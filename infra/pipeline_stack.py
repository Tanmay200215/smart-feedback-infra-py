import aws_cdk as cdk
from constructs import Construct
from aws_cdk import (
    aws_codepipeline as codepipeline,
    aws_codepipeline_actions as actions,
    aws_codebuild as codebuild,
    aws_codestarconnections as codestar,
)

class PipelineStack(cdk.Stack):
    def __init__(self, scope: Construct, _id: str, **kwargs) -> None:
        super().__init__(scope, _id, **kwargs)

        # Create a GitHub connection (complete handshake once in console)
        connection = codestar.CfnConnection(self, "GitHubConnection",
            connection_name="SmartFeedbackGitHub",
            provider_type="GitHub"
        )
        conn_arn = connection.attr_connection_arn

        self._make_pipeline("dev", "dev", conn_arn, require_approval=False)
        self._make_pipeline("prod", "main", conn_arn, require_approval=True)

    def _make_pipeline(self, stage: str, branch: str, conn_arn: str, require_approval: bool):
        pipe = codepipeline.Pipeline(self, f"InfraPipeline-{stage}",
            pipeline_name=f"smart-feedback-infra-{stage}",
            restart_execution_on_update=True
        )

        source_output = codepipeline.Artifact()
        pipe.add_stage(stage_name="Source", actions=[
            actions.CodeStarConnectionsSourceAction(
                action_name="GitHub",
                owner="<YOUR_GH_USER>",
                repo="smart-feedback-infra-py",
                branch=branch,
                connection_arn=conn_arn,
                output=source_output
            )
        ])

        synth_project = codebuild.PipelineProject(self, f"Synth-{stage}",
            environment=codebuild.BuildEnvironment(build_image=codebuild.LinuxBuildImage.STANDARD_7_0),
            build_spec=codebuild.BuildSpec.from_object({
                "version": "0.2",
                "phases": {
                    "install": { "commands": [
                        "python3 -m pip install --upgrade pip",
                        "pip install -r requirements.txt"
                    ]},
                    "build": { "commands": [
                        # Use CDK CLI via npx (no global install)
                        "npx -y aws-cdk@2.151.0 synth --app 'python3 -m infra.app' > cdk.out/template.yaml"
                    ]}
                },
                "artifacts": { "base-directory": "cdk.out", "files": ["template.yaml"] }
            })
        )

        synth_output = codepipeline.Artifact()
        pipe.add_stage(stage_name="Build", actions=[
            actions.CodeBuildAction(
                action_name="Synth",
                project=synth_project,
                input=source_output,
                outputs=[synth_output]
            )
        ])

        if require_approval:
            pipe.add_stage(stage_name="Approve", actions=[
                actions.ManualApprovalAction(action_name="PromoteToProd")
            ])

        deploy_project = codebuild.PipelineProject(self, f"Deploy-{stage}",
            environment=codebuild.BuildEnvironment(build_image=codebuild.LinuxBuildImage.STANDARD_7_0, privileged=True),
            build_spec=codebuild.BuildSpec.from_object({
                "version": "0.2",
                "phases": {
                    "install": { "commands": [
                        "python3 -m pip install --upgrade pip",
                        "pip install -r requirements.txt"
                    ]},
                    "build": { "commands": [
                        f"export STAGE={stage}",
                        "npx -y aws-cdk@2.151.0 deploy "
                        f"BackendStack-{stage} WebStack-{stage} "
                        "--app 'python3 -m infra.app' --require-approval never"
                    ]}
                }
            })
        )

        pipe.add_stage(stage_name="Deploy", actions=[
            actions.CodeBuildAction(
                action_name="CDKDeploy",
                project=deploy_project,
                input=source_output
            )
        ])
