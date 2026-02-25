import { ChannelType, SlashCommandBuilder, SlashCommandChannelOption, SlashCommandStringOption } from 'discord.js';
import { MangaBotCommand } from '../class/command';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { getGuildPath } from '../utils/path';

const SuposeMangaList = [
  {
    name: '看漫畫(漫畫櫃)',
    value: 'manhuagui',
  },
  {
    name: 'n網 (nhentai) beta 尚未實裝',
    value: 'nehntai',
  },
];

export interface DataBaseGuild {
  guild: string;
  channel_id: string;
  channel_name: string;
}

export default new MangaBotCommand({
  builder: new SlashCommandBuilder()
    .setName('setup_channel')
    .setNameLocalization('zh-TW', '初始化與更改通知設定')
    .setDescription('setup you want to recieve message cahnnel')
    .setDescriptionLocalization('zh-TW', '初始化或更改機器人的通知發送頻道')
    .addStringOption(new SlashCommandStringOption().setName('tr_website').setDescription('追蹤的網站').addChoices(SuposeMangaList).setRequired(true))
    .addChannelOption(new SlashCommandChannelOption().setName('tr_channel').setDescription('設置通知的頻道').addChannelTypes(ChannelType.GuildText).setRequired(true)),
  defer: true,
  flags: undefined,
  async execute(interaction) {
    const website = interaction.options.getString(`tr_website`, true);
    const channel = interaction.options.getChannel<ChannelType.GuildText>(
      `tr_channel`,
      true,
    );
    const guild_id = interaction.guildId;

    const guild_path = getGuildPath(guild_id, 'manhuagui');
    let old_data: DataBaseGuild = {
      guild: '',
      channel_id: '',
      channel_name: '',

    };
    if (existsSync(guild_path)) {
      old_data = JSON.parse(readFileSync(guild_path, 'utf-8')) as DataBaseGuild;

      if (old_data.channel_id == channel.id) {
        await interaction.editReply({
          content: `${interaction.member.displayName} sama, ${website}通知已經在${channel}了 ( ×ω× )`,
        });
        return;
      }
    }

    const new_data: DataBaseGuild = {
      guild: guild_id,
      channel_id: channel.id,
      channel_name: channel.name,
    };

    if (old_data.channel_id == '') {
      await interaction.editReply({
        content: `${interaction.member.displayName} SAMA, 已經將 ${website} 的訂閱通知設定在 ${channel} 了! (ﾉ>ω<)ﾉ`,
      });
    }
    else {
      await interaction.editReply({
        content: `${interaction.member.displayName} SAMA, 已經將 ${website} 的訂閱通知由 <#${old_data.channel_id}> 移至 ${channel}! (ﾉ>ω<)ﾉ`,
      });
    }

    writeFileSync(guild_path, JSON.stringify(new_data, null, 2), 'utf-8');
  },
});
