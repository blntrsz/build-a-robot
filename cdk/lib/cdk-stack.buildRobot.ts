import { Handler } from "aws-cdk-lib/aws-lambda";
import { EventBridge } from "aws-sdk";

const eb = new EventBridge({});

export const handler: Handler = async () => {
  console.log(process.env.EVENT_BRIDGE);
  await eb
    .putEvents({
      Entries: [
        {
          EventBusName: process.env.EVENT_BRIDGE,
          Source: "com",
          Detail: "{}",
          DetailType: "robot.started",
        },
      ],
    })
    .promise();

  return {
    headers: {
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "*",
    },
    statusCode: 200,
    body: "Robot creation started!",
  };
};
