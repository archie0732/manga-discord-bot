import type { MangaBotCommand } from '../class/command';

import ping from './ping';
import setupCgannel from './setMessageChannel';
import mihoyoPull from './hoyoPull';
import searchManhuaguiById from './searchManhuaguiById';

export default [ping, setupCgannel, mihoyoPull, searchManhuaguiById] as MangaBotCommand[];
