import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, MessageFlags, SlashCommandBuilder, SlashCommandNumberOption, ButtonInteraction } from 'discord.js';
import { MangaBotCommand } from '../class/command';
import { getGuildPath, getSubListPath } from '../utils/path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { ManhuaguiManga } from '../api/manhuagui';

export interface DatabaseSchema {
  mangas: TrackedManga[];
  last_check_time: string;
}

export interface TrackedManga {
  id: string;
  title: string;
  latest_chapter: string;
  target_channels: TargetChannel[];
}

export interface TargetChannel {
  guild: string;
  channel: string;
}

interface LocalGuildConfig {
  channel_id: string;
}

export default new MangaBotCommand({
  builder: new SlashCommandBuilder()
    .setName('search_manga_by_id')
    .setNameLocalization('zh-TW', 'id搜尋漫畫')
    .setDescription('you can use the id of manhuagui comic to get comic information')
    .setDescriptionLocalization('zh-TW', '您可以使用 manhuagui 網站上的漫畫id來取得漫畫資訊')
    .addNumberOption(new SlashCommandNumberOption()
      .setName('id')
      .setNameLocalization('zh-TW', '漫畫id')
      .setDescription('您可以在漫畫櫃網站的網址尋找漫畫id')
      .setRequired(true)),
  defer: true,
  flags: undefined,

  async execute(interaction) {
    const mangaId = interaction.options.getNumber('id', true);
    const guildId = interaction.guildId;

    if (!guildId) return;

    const localDataPath = getGuildPath(guildId, 'manhuagui');

    if (!existsSync(localDataPath)) {
      await interaction.editReply({
        content: '您尚未在此伺服器設定通知頻道，請先使用 `/setup_channel` 來完成設定',
      });
      return;
    }

    const subListPath = getSubListPath('manhuagui');
    let isSub = false;

    if (existsSync(subListPath)) {
      const database: DatabaseSchema = JSON.parse(readFileSync(subListPath, 'utf-8'));
      isSub = database.mangas.some((m) =>
        m.id === mangaId.toString()
        && m.target_channels.some((c) => c.guild === guildId),
      );
    }

    const manga = new ManhuaguiManga(mangaId.toString());
    await manga.scraper();

    await interaction.editReply({
      content: `您查尋的 [${manga.title}](${manga.url}), 現在已經更新到 [${manga.latest_chapter}](${manga.latest_chapter_url})\n-# 如果需要訂閱漫畫可以按下訂閱按鈕，取消訂閱可以使用 \`/dissub_manhuagui\``,
      embeds: [createMangaEmbed(interaction, manga)],
      components: [createMangaButton(guildId, mangaId.toString(), isSub)],
    });
  },

  async onButton(interaction, buttonId) {
    const [guildId, mangaId] = buttonId.split('-');
    const subListPath = getSubListPath('manhuagui');
    const localDataPath = getGuildPath(guildId!, 'manhuagui');

    if (!existsSync(subListPath)) return;
    const database: DatabaseSchema = JSON.parse(readFileSync(subListPath, 'utf-8'));

    if (!existsSync(localDataPath)) {
      await interaction.followUp({ content: '此伺服器尚未設定通知頻道，請管理員使用 `/setup_channel`。', flags: MessageFlags.Ephemeral });
      return;
    }
    const localConfig: LocalGuildConfig = JSON.parse(readFileSync(localDataPath, 'utf-8'));

    const mangaInDb = database.mangas.find((m) => m.id === mangaId);
    if (mangaInDb && mangaInDb.target_channels.some((c) => c.guild === guildId)) {
      await interaction.followUp({ content: '您已經訂閱這本漫畫了!', flags: MessageFlags.Ephemeral });
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

const createMangaEmbed = (interaction: ChatInputCommandInteraction, manga: ManhuaguiManga) => {
  return new EmbedBuilder()
    .setAuthor({ name: interaction.guild?.name || '未知伺服器', iconURL: interaction.guild?.iconURL() || '' })
    .setTitle(manga.title)
    .setDescription(manga.detail.length > 200 ? manga.detail.substring(0, 200) + '...' : manga.detail)
    .setThumbnail(manga.thum)
    .setURL(manga.url)
    .setFields([
      { name: '✒️ 作者', value: manga.author.join(', ') || '未知', inline: true },
      { name: '👾 目前狀態', value: manga.status, inline: true },
      { name: '🏆 排名', value: manga.rank?.toString() || '無', inline: true },
      { name: '🔔 更新', value: `${manga.latest_update_date} | [${manga.latest_chapter}](${manga.latest_chapter_url})`, inline: false },
      { name: '🏷️ 標籤', value: manga.tags.join(', ') || '無', inline: false },
    ])
    .setFooter({ text: 'Source: manhuagui | Provider: arch1e Manga Bot V4' });
};

const createMangaButton = (guildId: string, mangaId: string, isSub: boolean): ActionRowBuilder<ButtonBuilder> =>
  new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`search_manga_by_id:${guildId}-${mangaId}`)
      .setLabel(isSub ? '已訂閱' : '訂閱')
      .setDisabled(isSub)
      .setStyle(isSub ? ButtonStyle.Success : ButtonStyle.Primary),
    new ButtonBuilder()
      .setLabel('看漫畫')
      .setURL(`https://tw.manhuagui.com/comic/${mangaId}/`)
      .setStyle(ButtonStyle.Link),
  );
