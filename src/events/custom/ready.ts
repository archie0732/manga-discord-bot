import { Events } from 'discord.js';
import { MangaBotEventHandler } from '../../class/event';

import logger from '../../class/logger';

export default new MangaBotEventHandler({
  event: Events.ClientReady,
  async on(client) {
    logger.info(`Logged in as ${client.user.tag}`);
    await this.updateCommands();
  },
});