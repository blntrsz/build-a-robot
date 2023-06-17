import { z } from "zod";

import { event } from "./event";

export enum EventNames {
  Started = "robot.started",
  HeadCreated = "robot.head.created",
  BodyCreated = "robot.body.created",
  LegsCreated = "robot.legs.created",
  MessageSent = "message",
}

export const Events = {
  Started: event(EventNames.Started, {}),
  HeadCreated: event(EventNames.HeadCreated, {}),
  BodyCreated: event(EventNames.BodyCreated, {}),
  LegsCreated: event(EventNames.LegsCreated, {}),
  MessageSent: event(EventNames.MessageSent, {
    message: z.string(),
  }),
};

export async function start() {
  await Events.Started.publish({});
}

export async function createHead() {
  await Events.HeadCreated.publish({});
}

export async function createBody() {
  await Events.BodyCreated.publish({});
}

export async function createLegs() {
  await Events.LegsCreated.publish({});
}

export async function sendMessage(message: string) {
  await Events.MessageSent.publish({
    message,
  });
}
