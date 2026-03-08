import type { MangaBotEventHandler } from '../class/event';
import onAutocomplete from './core/onAutocomplete';

import onButton from './core/onButton';
import onCommand from './core/onCommand';
import onModalSubmit from './core/onModelSubmit';

import ready from './custom/ready';
import checkSubUpdate from './custom/checkSubUpdate';

export default [onButton, onCommand, onModalSubmit, onAutocomplete, ready, checkSubUpdate] as MangaBotEventHandler[];
