import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { RestApi, LambdaIntegration, Cors } from "aws-cdk-lib/aws-apigateway";
import { EventBus, Rule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { WebSocketApi, WebSocketStage } from "@aws-cdk/aws-apigatewayv2-alpha";
import { WebSocketLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import { AttributeType, Table } from "aws-cdk-lib/aws-dynamodb";

const createLambdaWithRule = (
  source: Construct,
  bus: EventBus,
  name: string,
  detailType: string,
  environment: Record<string, string> = {}
) => {
  return new Rule(source, `${name}Rule`, {
    targets: [
      new LambdaFunction(
        new NodejsFunction(source, name, {
          runtime: Runtime.NODEJS_18_X,
          initialPolicy: [
            new PolicyStatement({
              actions: ["*"],
              resources: ["*"],
            }),
          ],
          environment: {
            EVENT_BRIDGE: bus.eventBusArn,
            ...environment,
          },
        })
      ),
    ],
    eventBus: bus,
    eventPattern: {
      detailType: [detailType],
    },
  });
};

export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const api = new RestApi(this, "api", {
      defaultCorsPreflightOptions: {
        allowOrigins: ["*"],
        allowMethods: ["*"], // this is also the default
        allowHeaders: ["*"],
      },
    });

    const bus = new EventBus(this, "bus", {
      eventBusName: "MyCustomEventBus",
    });

    const buildRobotLambda = new NodejsFunction(this, "buildRobot", {
      runtime: Runtime.NODEJS_18_X,
      environment: {
        EVENT_BRIDGE: bus.eventBusName,
      },
      initialPolicy: [
        new PolicyStatement({
          actions: ["*"],
          resources: ["*"],
        }),
      ],
    });

    api.root.addMethod("POST", new LambdaIntegration(buildRobotLambda));

    const table = new Table(this, "Table", {
      partitionKey: { name: "id", type: AttributeType.STRING },
    });

    createLambdaWithRule(this, bus, "headCreated", "robot.started");
    createLambdaWithRule(this, bus, "bodyCreated", "robot.head.created");
    createLambdaWithRule(this, bus, "legsCreated", "robot.body.created");

    const wsApi = new WebSocketApi(this, "ws", {
      apiName: "wsApi",
    });

    const wsApiStage = new WebSocketStage(this, "wsStage", {
      stageName: "dev",
      webSocketApi: wsApi,
      autoDeploy: true,
    });

    wsApi.addRoute("$connect", {
      integration: new WebSocketLambdaIntegration(
        "ConnectIntegration",
        new NodejsFunction(this, "connect", {
          runtime: Runtime.NODEJS_18_X,
          environment: {
            TABLE_NAME: table.tableName,
          },
          initialPolicy: [
            new PolicyStatement({
              actions: ["*"],
              resources: ["*"],
            }),
          ],
        })
      ),
    });

    wsApi.addRoute("$disconnect", {
      integration: new WebSocketLambdaIntegration(
        "DisconnectIntegration",
        new NodejsFunction(this, "disconnect", {
          runtime: Runtime.NODEJS_18_X,
          environment: {
            TABLE_NAME: table.tableName,
          },
          initialPolicy: [
            new PolicyStatement({
              actions: ["*"],
              resources: ["*"],
            }),
          ],
        })
      ),
    });

    const wsApiEndpoint = wsApi.apiEndpoint + "/" + wsApiStage.stageName;

    createLambdaWithRule(this, bus, "sendMessage", "message", {
      TABLE_NAME: table.tableName,
      WS_API_ENDPOINT: wsApiEndpoint,
    });

    new CfnOutput(this, "wsApiEndpoint", {
      value: wsApiEndpoint,
    });
  }
}
