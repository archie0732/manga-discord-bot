import { ManhuaguiManga } from '../api/manhuagui';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { getSubListPath, type DataWebSite } from './path';
import logger from '../class/logger';
import type { DatabaseSchema } from './models';
import type { MangaBotClient } from '../class/client';
import { EmbedBuilder, TextChannel } from 'discord.js';
import { sleep } from 'bun';

export interface UpdateResult {
  manga: ManhuaguiManga;
  sub_channel_id: string[];
}

export const checkManhuaguiSubscriptions = async (datatype: DataWebSite): Promise<UpdateResult[] | null> => {
  const path = getSubListPath(datatype);
  if (!existsSync(path)) {
    logger.info(`Cannot find ${datatype} subscription list`);
    return null;
  }

  const subscriptionsManga = JSON.parse(readFileSync(path, 'utf-8')) as DatabaseSchema;
  const updateResults: UpdateResult[] = [];
  let hasChanges = false;

  logger.info(`開始檢查 ${subscriptionsManga.mangas.length} 本漫畫更新...`);

  // 改用 for...of 迴圈來嚴格控制請求頻率
  for (const sub of subscriptionsManga.mangas) {
    try {
      const api = new ManhuaguiManga(sub.id);

      const delay = Math.floor(Math.random() * 3000) + 2000;
      await sleep(delay);

      await api.scraper();

      if (api.latest_chapter !== sub.latest_chapter) {
        updateResults.push({
          manga: api,
          sub_channel_id: sub.target_channels.map((c) => c.channel),
        });

        sub.latest_chapter = api.latest_chapter;
        hasChanges = true;
      }
    }
    catch (error) {
      logger.error(`check ${sub.id} failed: ${error}`);
    }
  }

  if (hasChanges) {
    writeFileSync(path, JSON.stringify(subscriptionsManga, null, 2), 'utf-8');
    logger.info(`已更新訂閱清單檔案。`);
  }

  return updateResults;
};

export const createMangaUpdateEmbed = (
  manga: ManhuaguiManga,
  guildInfo?: { name: string; iconURL: string },
) => {
  return new EmbedBuilder()
    .setAuthor({
      name: guildInfo?.name || 'Manga Notifier',
      iconURL: guildInfo?.iconURL || '',
    })
    .setTitle(`📢 更新通知：${manga.title}`)
    .setDescription(
      manga.detail.length > 200
        ? manga.detail.substring(0, 200) + '...'
        : manga.detail,
    )
    .setThumbnail(manga.thum)
    .setURL(manga.latest_chapter_url || manga.url)
    .setFields([
      {
        name: '✒️ 作者',
        value: manga.author.join(', ') || '未知',
        inline: true,
      },
      { name: '👾 目前狀態', value: manga.status, inline: true },
      { name: '🏆 排名', value: manga.rank?.toString() || '無', inline: true },
      {
        name: '🔔 最新章節',
        value: `[${manga.latest_chapter}](${manga.latest_chapter_url}) | ${manga.latest_update_date}`,
        inline: false,
      },
      { name: '🏷️ 標籤', value: manga.tags.join(', ') || '無', inline: false },
    ])
    .setFooter({ text: 'Source: manhuagui | Provider: arch1e Manga Bot V4' })
    .setTimestamp()
    .setColor('#ff4500');
};

export const sendUpdateMessage = async (client: MangaBotClient, updateResults: UpdateResult[]) => {
  for (const result of updateResults) {
    for (const channelId of result.sub_channel_id) {
      try {
        const channel = await client.channels.fetch(channelId);
        if (channel instanceof TextChannel) {
          const guildInfo = {
            name: channel.guild.name,
            iconURL: channel.guild.iconURL() || '',
          };

          const embed = createMangaUpdateEmbed(result.manga, guildInfo);
          await channel.send({
            content: `📢 您訂閱的 [${result.manga.title}](${result.manga.url}) 已更新了 [${result.manga.latest_chapter}](${result.manga.latest_chapter_url})`,
            embeds: [embed],
          });
        }
      }
      catch (error) {
        logger.error(`Failed to send update to channel ${channelId}: ${error}`);
      }
    }
  }
};
