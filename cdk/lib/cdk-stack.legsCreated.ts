import { Handler } from "aws-cdk-lib/aws-lambda";
import { EventBridge } from "aws-sdk";

const eb = new EventBridge({});

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const handler: Handler = async () => {
  await wait(1_000);
  await eb
    .putEvents({
      Entries: [
        {
          Detail: "{}",
          DetailType: "robot.legs.created",
          EventBusName: process.env.EVENT_BRIDGE,
          Source: "com",
        },
      ],
    })
    .promise();
  await eb
    .putEvents({
      Entries: [
        {
          Detail: '{"message": "Robot creation finished!"}',
          DetailType: "message",
          EventBusName: process.env.EVENT_BRIDGE,
          Source: "com",
        },
      ],
    })
    .promise();
};
