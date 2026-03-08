import { Events } from 'discord.js';
import { MangaBotEventHandler } from '../../class/event';

import logger from '../../class/logger';
import { checkSetup } from '../../utils/__init__';

export default new MangaBotEventHandler({
  event: Events.ClientReady,
  async on(client) {
    logger.info(`Logged in as ${client.user.tag}`);
    checkSetup();
    await this.updateCommands();
  },
});
