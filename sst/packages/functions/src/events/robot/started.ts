import { EventHandler } from "sst/node/event-bus";
import * as Robot from "@sst/core/robot";

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const handler = EventHandler(Robot.Events.Started, async (evt) => {
  await wait(1_000);
  Robot.createHead();
});
