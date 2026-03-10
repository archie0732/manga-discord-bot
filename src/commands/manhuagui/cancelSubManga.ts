import { SlashCommandBuilder, SlashCommandStringOption } from 'discord.js';
import { MangaBotCommand } from '../../class/command';
import { existsSync, readFileSync } from 'fs';
import { getGuildPath, getSubListPath } from '../../utils/path';
import type { DatabaseSchema } from '../../utils/models';

export default new MangaBotCommand({
  builder: new SlashCommandBuilder().setName('cancel-sub-manga').setNameLocalization('zh-TW', '取消訂閱漫畫')
    .setDescription('cancel you subscription on manhuagui, and will no longer receive updates')
    .setDescriptionLocalization('zh-TW', '取消訂閱漫畫，將不再收到更新')
    .addStringOption(new SlashCommandStringOption().setName('manga_name').setNameLocalization('zh-TW', '漫畫名稱')
      .setDescription('the name of the manga you want to cancel subscription')
      .setDescriptionLocalization('zh-TW', '你想取消訂閱的漫畫名稱')
      .setAutocomplete(true).setRequired(true)),
  defer: true,
  flags: undefined,
  async execute(interaction) {
    const mangaID = interaction.options.getString('manga_name', true);

    if (mangaID === '您尚未訂閱任何漫畫') {
      await interaction.editReply({
        content: '您尚未訂閱任何漫畫',
      });
      return;
    }

    await interaction.editReply({
      content: `我跟你很熟嗎 \n\n debug: ${mangaID}`,
    });
  },

  async onAutocomplete(interaction) {
    const mangaName = interaction.options.getString('manga_name', true);
    const guildID = interaction.guildId;

    if (!existsSync(getGuildPath(guildID, 'manhuagui'))) {
      return [{ name: '你尚未訂閱任何漫畫', value: '您尚未訂閱任何漫畫' }];
    }

    const sublist = getSubListPath('manhuagui');

    const mangaList = JSON.parse(readFileSync(sublist, 'utf-8')) as DatabaseSchema;
    const allResults = mangaList.mangas.filter((manga) =>
      manga.target_channels.some((g) => g.guild === guildID),
    );

    const filteredResults = allResults.filter((manga) =>
      manga.title.toLowerCase().includes(mangaName.toLowerCase()),
    );

    const results = filteredResults.map((manga) => ({
      name: manga.title,
      value: manga.id,
    }));

    const result2 = allResults.map((manga) => ({
      name: manga.title,
      value: manga.id,
    }));

    return filteredResults.length > 0 ? results : result2;
  },
});
