import os
import aws_cdk as cdk
from infra.backend_stack import BackendStack
from infra.web_stack import WebStack
from infra.pipeline_stack import PipelineStack

app = cdk.App()

only_pipeline = os.getenv("ONLY_PIPELINE") == "1"
stage = os.getenv("STAGE", "dev")  # dev or prod

if only_pipeline:
    PipelineStack(app, "SmartFeedbackPipeline", env=cdk.Environment(
        account=os.getenv("CDK_DEFAULT_ACCOUNT"),
        region="ap-south-1",
    ))
else:
    backend = BackendStack(app, f"BackendStack-{stage}", stage=stage,
                           env=cdk.Environment(
                               account=os.getenv("CDK_DEFAULT_ACCOUNT"),
                               region="ap-south-1",
                           ))
    WebStack(app, f"WebStack-{stage}", stage=stage, backend=backend,
             env=cdk.Environment(
                 account=os.getenv("CDK_DEFAULT_ACCOUNT"),
                 region="ap-south-1",
             ))

app.synth()
