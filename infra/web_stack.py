from typing import Literal
import aws_cdk as cdk
from constructs import Construct
from aws_cdk import (
    aws_s3 as s3,
    aws_cloudfront as cf,
    aws_cloudfront_origins as origins,
)
from .backend_stack import BackendStack

Stage = Literal["dev","prod"]

class WebStack(cdk.Stack):
    def __init__(self, scope: Construct, _id: str, *, stage: Stage, backend: BackendStack, **kwargs) -> None:
        super().__init__(scope, _id, **kwargs)

        web_bucket = s3.Bucket(self, f"WebBucket-{stage}",
            website_index_document="index.html",
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=cdk.RemovalPolicy.DESTROY if stage=="dev" else cdk.RemovalPolicy.RETAIN,
            auto_delete_objects=(stage=="dev"),
        )

        api_domain = backend.node.try_get_context("apiDomain")  # not used; compute from output instead
        # Convert https://abcd.execute-api... to host only:
        # We'll pass via env: the backend stack already outputs the URL; but CloudFront origin accepts hostname only.
        # Simple trick: allow full URL then strip in code-build deploy if you later parameterize.
        # For now, read from stack property isn't available directly, so keep behavior below:
        api_host = cdk.Fn.select(2, cdk.Fn.split("/", backend.outputs["ApiUrl-"+stage].to_string())) if False else None

        dist = cf.Distribution(self, f"WebDist-{stage}",
            default_behavior=cf.BehaviorOptions(
                origin=origins.S3Origin(web_bucket),
                viewer_protocol_policy=cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cache_policy=cf.CachePolicy.CACHING_OPTIMIZED
            ),
            additional_behaviors={
                "api/*": cf.BehaviorOptions(
                    origin=origins.HttpOrigin(
                        # We can't directly read the other stack output at synth time.
                        # A practical pattern is to call the API directly from frontend (set VITE_API_BASE to the API URL),
                        # OR wire this later with a parameter. We'll skip CF proxy for now to keep deploy simple.
                        domain_name="example.com"  # placeholder, see note in README
                    ),
                    viewer_protocol_policy=cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    allowed_methods=cf.AllowedMethods.ALLOW_ALL,
                    cache_policy=cf.CachePolicy.CACHING_DISABLED,
                    origin_request_policy=cf.OriginRequestPolicy.ALL_VIEWER
                )
            }
        )

        cdk.CfnOutput(self, f"CloudFrontDomain-{stage}", value=dist.distribution_domain_name)
        cdk.CfnOutput(self, f"WebBucketName-{stage}", value=web_bucket.bucket_name)
