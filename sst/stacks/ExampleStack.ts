import {
  Api,
  EventBus,
  StackContext,
  Table,
  WebSocketApi,
} from "sst/constructs";
import * as Robot from "../packages/core/src/robot";

export function ExampleStack({ stack }: StackContext) {
  const bus = new EventBus(stack, "bus", {
    defaults: {
      retries: 10,
    },
  });

  bus.subscribe(Robot.EventNames.Started, {
    bind: [bus],
    handler: "packages/functions/src/events/robot/started.handler",
  });

  bus.subscribe(Robot.EventNames.HeadCreated, {
    bind: [bus],
    handler: "packages/functions/src/events/robot/headCreated.handler",
  });

  bus.subscribe(Robot.EventNames.BodyCreated, {
    bind: [bus],
    handler: "packages/functions/src/events/robot/bodyCreated.handler",
  });

  bus.subscribe(Robot.EventNames.LegsCreated, {
    bind: [bus],
    handler: "packages/functions/src/events/robot/legsCreated.handler",
  });

  const table = new Table(stack, "Connections", {
    fields: {
      id: "string",
    },
    primaryIndex: { partitionKey: "id" },
  });

  const wsApi = new WebSocketApi(stack, "Api", {
    defaults: {
      function: {
        bind: [table],
        environment: {
          TABLE_NAME: table.tableName,
        },
      },
    },
    routes: {
      $connect: "packages/functions/src/connect.main",
      $disconnect: "packages/functions/src/disconnect.main",
      sendmessage: "packages/functions/src/sendMessage.main",
    },
  });

  const api = new Api(stack, "api", {
    defaults: {
      function: {
        bind: [bus],
      },
    },
    cors: true,
    routes: {
      "POST /": "packages/functions/src/buildRobot.handler",
    },
  });

  bus.subscribe(Robot.EventNames.MessageSent, {
    bind: [bus, wsApi, table],
    environment: {
      WS_API_ENDPOINT: wsApi.url,
      TABLE_NAME: table.tableName,
    },
    handler: "packages/functions/src/events/messageSent.handler",
  });

  // Show the API endpoint in the output
  stack.addOutputs({
    WsApiEndpoint: wsApi.url,
    ApiEndpoint: api.url,
  });
}
