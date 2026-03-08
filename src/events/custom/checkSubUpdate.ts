import { Events } from 'discord.js';
import { MangaBotEventHandler } from '../../class/event';
import logger from '../../class/logger';
import { checkManhuaguiSubscriptions, sendUpdateMessage } from '../../utils';
import type { MangaBotClient } from '../../class/client';

export default new MangaBotEventHandler({
  event: Events.ClientReady,
  async on(rawClient) {
    const client = rawClient as MangaBotClient;

    const runCheckTask = async () => {
      logger.info('check subscruption update...');

      const updateResults = await checkManhuaguiSubscriptions('manhuagui');

      if (updateResults && updateResults.length > 0) {
        await sendUpdateMessage(client, updateResults);
      }
      else {
        logger.info('0 manga updates found');
      };
    };

    runCheckTask();
    const CHECK_INTERVAL = 10 * 60 * 1000;
    setInterval(runCheckTask, CHECK_INTERVAL);

    logger.info(`open auto check subscription task: every 10 minutes`);
  },
});
