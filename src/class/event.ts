import type { ClientEvents } from 'discord.js';
import type { MangaBotClient } from './client';

type Events = keyof ClientEvents;

export interface MangaBotEventHandlerOptions<Event extends Events = Events> {
  event: Event;
  on?: (this: MangaBotClient, ...args: ClientEvents[Event]) => void | Promise<void>;
  once?: (this: MangaBotClient, ...args: ClientEvents[Event]) => void | Promise<void>;
}

export class MangaBotEventHandler<Event extends Events = Events> {
  event: Event;
  on?: (this: MangaBotClient, ...args: ClientEvents[Event]) => void | Promise<void>;
  once?: (this: MangaBotClient, ...args: ClientEvents[Event]) => void | Promise<void>;
  constructor(options: MangaBotEventHandlerOptions<Event>) {
    this.event = options.event;
    this.on = options.on;
    this.once = options.once;
  }
}
