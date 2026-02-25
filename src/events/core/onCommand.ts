import { Events, MessageFlags } from 'discord.js';
import { MangaBotEventHandler } from '../../class/event';

export default new MangaBotEventHandler({
  event: Events.InteractionCreate,
  async on(interaction) {
    if (!interaction.inCachedGuild()) return;
    if (!interaction.isChatInputCommand()) return;

    const command = this.commands.get(interaction.commandName);
    if (!command) return;

    try {
      if (command.defer && !command.modals) {
        await interaction.deferReply({
          flags: command.flags,
        });
      }

      await command.execute.call(this, interaction);
    }
    catch (error) {
      console.error(`[指令執行錯誤] 來自 /${interaction.commandName}:`, error);

      const errorMessage = '執行指令時發生意外錯誤，請稍後再試。 ( ×ω× )';

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({
          content: errorMessage,

        });
      }
      else {
        await interaction.reply({
          content: errorMessage,
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
});
