import type {  MangaBotEventHandler } from '../class/event';
import onAutocomplete from './core/onAutocomplete';

import onButton from './core/onButton';
import onCommand from './core/onCommand';
import onModalSubmit from './core/onModelSubmit';


import ready from './custom/ready';

export default [onButton, onCommand, onModalSubmit, onAutocomplete, ready] as MangaBotEventHandler[];