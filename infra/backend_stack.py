from typing import Literal
import aws_cdk as cdk
from constructs import Construct
from aws_cdk import (
    Duration,
    aws_s3 as s3,
    aws_s3_deployment as s3deploy,
    aws_dynamodb as dynamodb,
    aws_lambda as _lambda,
    aws_apigatewayv2 as apigwv2,
    aws_apigatewayv2_integrations as apigw_int,
)

Stage = Literal["dev","prod"]

class BackendStack(cdk.Stack):
    def __init__(self, scope: Construct, _id: str, *, stage: Stage, **kwargs) -> None:
        super().__init__(scope, _id, **kwargs)

        bucket = s3.Bucket(self, f"DataBucket-{stage}",
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=cdk.RemovalPolicy.DESTROY if stage=="dev" else cdk.RemovalPolicy.RETAIN,
            auto_delete_objects=(stage=="dev"),
        )

        s3deploy.BucketDeployment(self, f"SeedDeploy-{stage}",
            destination_bucket=bucket,
            destination_key_prefix="seed",
            sources=[s3deploy.Source.asset("seed")]
        )

        table = dynamodb.Table(self, f"FeedbackSubmissions-{stage}",
            partition_key=dynamodb.Attribute(name="feedbackId", type=dynamodb.AttributeType.STRING),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=cdk.RemovalPolicy.DESTROY if stage=="dev" else cdk.RemovalPolicy.RETAIN
        )

        rest_fn = _lambda.Function(self, f"RestFn-{stage}",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="app.handler",
            code=_lambda.Code.from_asset("lambda/rest"),
            timeout=Duration.seconds(15),
            environment={
                "TABLE_NAME": table.table_name,
                "BUCKET_NAME": bucket.bucket_name,
                "CACHE_INSIGHTS_TO_S3": "true",
            }
        )
        table.grant_read_write_data(rest_fn)
        bucket.grant_read_write(rest_fn)

        http_api = apigwv2.HttpApi(self, f"HttpApi-{stage}",
            cors_preflight=apigwv2.CorsPreflightOptions(
                allow_headers=["*"],
                allow_methods=[apigwv2.CorsHttpMethod.GET, apigwv2.CorsHttpMethod.POST, apigwv2.CorsHttpMethod.OPTIONS],
                allow_origins=["*"],
                max_age=Duration.days(10),
            )
        )
        intg = apigw_int.HttpLambdaIntegration(f"RestIntegration-{stage}", handler=rest_fn)
        http_api.add_routes(path="/feedback", methods=[apigwv2.HttpMethod.ANY], integration=intg)
        http_api.add_routes(path="/insights", methods=[apigwv2.HttpMethod.GET], integration=intg)

        cdk.CfnOutput(self, f"ApiUrl-{stage}", value=http_api.api_endpoint)
        cdk.CfnOutput(self, f"TableName-{stage}", value=table.table_name)
        cdk.CfnOutput(self, f"RestFunctionName-{stage}", value=rest_fn.function_name)
