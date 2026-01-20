import { EmbedBuilder, SlashCommandBuilder } from '@discordjs/builders';
import { Colors } from 'discord.js';
import { MangaBotCommand } from '../class/command';

export default new MangaBotCommand({
  builder: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot latency'),
  defer: false,
  ephemeral: false,
  async execute(interaction) {
    const embed = new EmbedBuilder().setColor(Colors.Blue).addFields(
      {
        name: '⏳ Latency',
        value: '`Waiting...`',
      },
      {
        name: '📡 WebSocket Latency',
        value: `${this.ws.ping}ms`,
      },
    );

    await interaction.reply({
      content: 'Pong! 🏓',
      embeds: [embed],
    });

    const sent = await interaction.fetchReply();

    const roundTripLatency = Math.round(
      (sent.createdTimestamp - interaction.createdTimestamp) / 2,
    );

    embed.spliceFields(0, 1, {
      name: '⌛ Latency',
      value: `${roundTripLatency}ms`,
    });

    await interaction.editReply({
      content: 'Pong! 🏓',
      embeds: [embed],
    });
  },
});