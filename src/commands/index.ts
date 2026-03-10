import type { MangaBotCommand } from '../class/command';

import ping from './ping';
import setupCgannel from './setMessageChannel';
import mihoyoPull from './hoyoPull';
import searchManhuaguiByTitle from './manhuagui/searchByTitle';
import cancelSubManga from './manhuagui/cancelSubManga';

export default [
  ping,
  setupCgannel,
  mihoyoPull,
  searchManhuaguiByTitle,
  cancelSubManga,
] as MangaBotCommand[];
