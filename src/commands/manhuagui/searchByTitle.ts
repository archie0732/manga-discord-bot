import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Message,
  MessageFlags,
  SlashCommandBuilder,
  SlashCommandStringOption,
} from 'discord.js';
import { MangaBotCommand } from '../../class/command';
import { ManhuaguiManga, ManhuaguiSearchAPI } from '../../api/manhuagui';
import { getGuildPath } from '../../utils/path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { getSubListPath } from '../../utils/path';
import type { DatabaseSchema, LocalGuildConfig } from '../../utils/models';
import { createMangaUpdateEmbed } from '../../utils';

export default new MangaBotCommand({
  builder: new SlashCommandBuilder()
    .setName('search_manga_by_title')
    .setNameLocalization('zh-TW', '名稱搜尋漫畫')
    .setDescription(
      'use the title of manhuagui comic to get comic information and subscribe to updates',
    )
    .setDescriptionLocalization(
      'zh-TW',
      '輸入關鍵字後選擇上方漫畫名稱',
    )
    .addStringOption(
      new SlashCommandStringOption()
        .setName('title')
        .setNameLocalization('zh-TW', '漫畫名稱')
        .setDescription('輸入關鍵字後選擇上方漫畫名稱')
        .setAutocomplete(true)
        .setRequired(true),
    ),
  defer: true,
  flags: undefined,

  async execute(interaction) {
    const mangaId = interaction.options.getString('title', true);

    if (!(/^\d+$/.test(mangaId))) {
      interaction.editReply({
        content: '請點選上方的提示(不要直接送出)',
        flags: MessageFlags.IsComponentsV2,
        files: ['https://i.ytimg.com/vi/3pw1aojfnpY/maxresdefault.jpg'],
      });
      return;
    }

    const guildId = interaction.guildId;

    if (!guildId) return;

    const localDataPath = getGuildPath(guildId, 'manhuagui');

    if (!existsSync(localDataPath)) {
      await interaction.editReply({
        content:
          '您尚未在此伺服器設定通知頻道，請先使用 `/setup_channel` 來完成設定',
      });
      return;
    }

    const subListPath = getSubListPath('manhuagui');
    let isSub = false;

    if (existsSync(subListPath)) {
      const database: DatabaseSchema = JSON.parse(
        readFileSync(subListPath, 'utf-8'),
      );
      isSub = database.mangas.some(
        (m) =>
          m.id === mangaId.toString()
          && m.target_channels.some((c) => c.guild === guildId),
      );
    }

    const manga = new ManhuaguiManga(mangaId.toString());
    await manga.scraper();

    await interaction.editReply({
      content: `您查尋的 [${manga.title}](${manga.url}), 現在已經更新到 [${manga.latest_chapter}](${manga.latest_chapter_url})\n\n-# 如果需要訂閱漫畫可以按下訂閱按鈕，取消訂閱可以使用 \`/dissub_manhuagui\``,
      embeds: [createMangaUpdateEmbed(manga, { name: interaction.guild?.name || 'Manga Notifier', iconURL: interaction.guild?.iconURL() || '' })],
      components: [createMangaButton(guildId, mangaId.toString(), isSub)],
    });
  },

  async onAutocomplete(interaction) {
    const title = interaction.options.getString('title') ?? '總之';
    const api = new ManhuaguiSearchAPI();
    await api.search(title);

    if (api.searchResults.length === 0) {
      return [{
        name: '總之就是非常可愛 fly me to the moon',
        value: '27099',
      }];
    }

    const results = api.searchResults.map((result) => ({
      name: result.title,
      value: result.id,
    }));

    return results;
  },

  async onButton(interaction, buttonId) {
    const [guildId, mangaId] = buttonId.split('-');
    const subListPath = getSubListPath('manhuagui');
    const localDataPath = getGuildPath(guildId!, 'manhuagui');

    if (!existsSync(subListPath)) return;
    const database: DatabaseSchema = JSON.parse(
      readFileSync(subListPath, 'utf-8'),
    );

    if (!existsSync(localDataPath)) {
      await interaction.followUp({
        content: '此伺服器尚未設定通知頻道，請管理員使用 `/setup_channel`。',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    const localConfig: LocalGuildConfig = JSON.parse(
      readFileSync(localDataPath, 'utf-8'),
    );

    const mangaInDb = database.mangas.find((m) => m.id === mangaId);
    if (
      mangaInDb
      && mangaInDb.target_channels.some((c) => c.guild === guildId)
    ) {
      await interaction.followUp({
        content: '您已經訂閱這本漫畫了!',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (mangaInDb) {
      mangaInDb.target_channels.push({
        guild: guildId!,
        channel: localConfig.channel_id,
      });
    }
    else {
      const manga = new ManhuaguiManga(mangaId!);
      await manga.scraper();
      database.mangas.push({
        id: mangaId!,
        title: manga.title,
        latest_chapter: manga.latest_chapter,
        target_channels: [{ guild: guildId!, channel: localConfig.channel_id }],
      });
    }

    writeFileSync(subListPath, JSON.stringify(database, null, 2));

    await interaction.editReply({
      content: `✅ 成功訂閱！當有新章節時，將會發送通知至 <#${localConfig.channel_id}>。`,
      components: [createMangaButton(guildId!, mangaId!, true)],
    });
  },

});

const createMangaButton = (
  guildId: string,
  mangaId: string,
  isSub: boolean,
): ActionRowBuilder<ButtonBuilder> =>
  new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`search_manga_by_title:${guildId}-${mangaId}`)
      .setLabel(isSub ? '已訂閱' : '訂閱')
      .setDisabled(isSub)
      .setStyle(isSub ? ButtonStyle.Success : ButtonStyle.Primary),
    new ButtonBuilder()
      .setLabel('看漫畫')
      .setURL(`https://tw.manhuagui.com/comic/${mangaId}/`)
      .setStyle(ButtonStyle.Link),
  );
