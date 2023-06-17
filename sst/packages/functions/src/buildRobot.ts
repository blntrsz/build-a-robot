import * as Robot from "@sst/core/robot";
import { ApiHandler } from "sst/node/api";

export const handler = ApiHandler(async (_evt) => {
  await Robot.start();

  return {
    statusCode: 200,
    body: "Robot creation started!",
  };
});
