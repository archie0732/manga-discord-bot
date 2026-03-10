import 'dotenv/config';
import { MangaBotClient } from './class/client';
import { GatewayIntentBits } from 'discord.js';

import type { ClientOptions } from 'discord.js';

const options = {
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent],
} satisfies ClientOptions;

const client = new MangaBotClient(options);

client.login(process.env['DISCORD_TOKEN']).catch(console.error);
