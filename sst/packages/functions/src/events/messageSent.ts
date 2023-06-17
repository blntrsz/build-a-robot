import { DynamoDB, ApiGatewayManagementApi } from "aws-sdk";
import { EventHandler } from "sst/node/event-bus";
import * as Robot from "@sst/core/robot";

const TableName = process.env.TABLE_NAME ?? "";
const dynamoDb = new DynamoDB.DocumentClient();

export const handler = EventHandler(Robot.Events.MessageSent, async (evt) => {
  // Get all the connections
  const connections = await dynamoDb
    .scan({ TableName, ProjectionExpression: "id" })
    .promise();

  const apiG = new ApiGatewayManagementApi({
    endpoint: process.env.WS_API_ENDPOINT?.replace("wss://", ""),
  });

  const postToConnection = async function ({ id }: any) {
    try {
      // Send the message to the given client
      await apiG
        .postToConnection({ ConnectionId: id, Data: evt.properties.message })
        .promise();
    } catch (e: any) {
      if (e.statusCode === 410) {
        // Remove stale connections
        await dynamoDb.delete({ TableName, Key: { id } }).promise();
      }

      console.error(e);
    }
  };

  // Iterate through all the connections
  await Promise.all((connections.Items ?? []).map(postToConnection));
});
