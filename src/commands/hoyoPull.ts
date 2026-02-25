import {
  SlashCommandBuilder,
  SlashCommandNumberOption,
  SlashCommandStringOption,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ColorResolvable,
} from 'discord.js';
import { MangaBotCommand } from '../class/command';

// 圖片連結設定
const goldenRay = 'https://truth.bahamut.com.tw/s01/202010/f4ef2d76b033e0508ec48cd90494e078.JPG';
const purpleRay = 'https://i.pinimg.com/736x/7e/da/c9/7edac97aa8da37421e8c3f8387e461d5.jpg';

export interface GachaState {
  pity: number;
  isG: boolean;
  total: number;
  charName: string;
  win: number;
  loss: number;
  maxStreak: number; // 最高連續沒歪紀錄
  currentStreak: number; // 當前連續沒歪次數
}

export interface GachaResult {
  displayIcons: string[];
  newState: GachaState;
}

const pull_number = [
  { name: '單抽', value: 1 },
  { name: '十連', value: 10 },
];

export default new MangaBotCommand({
  builder: new SlashCommandBuilder()
    .setName('pull_beta')
    .setNameLocalization('zh-TW', '米池抽卡_beta')
    .setDescription('體驗經典米池 (90 小保底 / 180 大保底)')
    .addNumberOption((opt) => opt.setName('count').setDescription('抽數').addChoices(pull_number).setRequired(true))
    .addStringOption((opt) => opt.setName('卡池名稱').setDescription('可以字定義卡池名稱(未輸入預設為限定角色)').setRequired(false)),

  defer: true,
  flags: undefined,

  async execute(interaction) {
    const count = interaction.options.getNumber('count', true);
    const charName = (interaction.options.getString('卡池名稱') || '限定角色').substring(0, 15);

    const initialState: GachaState = {
      pity: 0,
      isG: false,
      total: 0,
      charName,
      win: 0,
      loss: 0,
      maxStreak: 0,
      currentStreak: 0,
    };

    const result = performGacha(count, initialState);

    await interaction.editReply({
      content: `**抽卡結果：**\n${result.displayIcons.join(' ')}\n\u200b`,
      embeds: [createGachaEmbed(interaction.member.displayName, result.newState, result.displayIcons)],
      components: [createGachaButtons(result.newState, result.displayIcons)],
    });
  },

  async onButton(interaction, buttonId) {
    // [action]_[pity]_[isG]_[total]_[win]_[loss]_[maxStr]_[curStr]_[charName]
    const [action, pityStr, isGStr, totalStr, winStr, lossStr, maxStr, curStr, ...nameParts] = buttonId.split('_');

    if (!pityStr || !isGStr || !totalStr || !winStr || !lossStr || !maxStr || !curStr) return;

    const state: GachaState = {
      pity: parseInt(pityStr, 10),
      isG: isGStr === '1',
      total: parseInt(totalStr, 10),
      win: parseInt(winStr, 10),
      loss: parseInt(lossStr, 10),
      maxStreak: parseInt(maxStr, 10),
      currentStreak: parseInt(curStr, 10),
      charName: nameParts.join('_'),
    };

    if (action === 'share') {
      const luckRating = getLuckRating(state);
      const shareEmbed = new EmbedBuilder()
        .setTitle(`📢 ${interaction.member.displayName} 分享了祈願戰績`)
        .setColor(luckRating.color)
        .addFields(
          { name: '運氣評價', value: `**${luckRating.text}**`, inline: true },
          { name: '最高連續沒歪', value: `\`${state.maxStreak}\` 次`, inline: true },
          { name: '總抽數', value: `\`${state.total}\` 抽`, inline: true },
          { name: '戰績統計', value: `👑 沒歪：\`${state.win}\` | 🤡 歪了：\`${state.loss}\``, inline: false },
          { name: '累計原石', value: `💎 \`${(state.total * 160).toLocaleString()}\``, inline: true },
        )
        .setFooter({ text: '快來接力挑戰運氣！' });

      await interaction.followUp({ embeds: [shareEmbed] });
      return;
    }

    const pullCount = parseInt(action || '1', 10);
    const result = performGacha(pullCount, state);

    await interaction.editReply({
      content: `**抽卡結果：**\n${result.displayIcons.join(' ')}\n\u200b`,
      embeds: [createGachaEmbed(interaction.member.displayName, result.newState, result.displayIcons)],
      components: [createGachaButtons(result.newState, result.displayIcons)],
    });
  },
});

function performGacha(count: number, state: GachaState): GachaResult {
  const displayIcons: string[] = [];
  const { charName } = state;
  let { pity, isG, total, win, loss, maxStreak, currentStreak } = state;

  for (let i = 0; i < count; i++) {
    total++;
    const nextPity = pity + 1;
    const chance = nextPity <= 73 ? 0.6 : 0.6 + (nextPity - 73) * 6;
    const roll = Math.random() * 100;

    if (roll < chance || pity >= 89) {
      if (isG || Math.random() > 0.5) {
        displayIcons.push('||👑||');
        isG = false;
        win++;
        currentStreak++;
        if (currentStreak > maxStreak) maxStreak = currentStreak;
      }
      else {
        displayIcons.push('||🤡||');
        isG = true;
        loss++;
        currentStreak = 0;
      }
      pity = 0;
    }
    else {
      displayIcons.push('||💩||');
      pity++;
    }
  }

  return {
    displayIcons,
    newState: { pity, isG, total, charName, win, loss, maxStreak, currentStreak },
  };
}

function getLuckRating(state: GachaState): { text: string; color: ColorResolvable } {
  const totalGolds = state.win + state.loss;

  if (totalGolds === 0) {
    if (state.pity > 73) return { text: '非洲難民 (貧瘠)', color: 0x555555 };
    return { text: '資源貧瘠中...', color: 0x999999 };
  }

  const avgPullsPerGold = state.total / totalGolds;
  const frequencyFactor = 62.5 / avgPullsPerGold;

  const winRate = state.win / totalGolds;
  const winFactor = winRate / 0.5;

  const finalScore = (frequencyFactor * 0.6) + (winFactor * 0.4);

  if (finalScore >= 1.35) return { text: '歐皇轉世', color: 0xf1c40f };
  if (finalScore >= 1.1) return { text: '歐洲貴族', color: 0x2ecc71 };
  if (finalScore >= 0.95) return { text: '普通人類', color: 0x3498db };
  if (finalScore >= 0.75) return { text: '非洲酋長', color: 0xe67e22 };
  return { text: '天選小丑 (🤡)', color: 0xe74c3c };
}
function createGachaEmbed(lastUser: string, state: GachaState, lastResults: string[]): EmbedBuilder {
  const hasGold = lastResults.includes('||👑||') || lastResults.includes('||🤡||');
  const cost = state.total * 160;
  const embedColor: ColorResolvable = hasGold ? 0xf1c40f : 0x9b59b6;

  return new EmbedBuilder()
    .setTitle(`🌠 祈願：${state.charName}`)
    .setDescription(`本輪抽卡者：**${lastUser}**\n\n**提示說明：**\n💩: 4星以下 | 🤡: 歪了 | 👑: 沒歪`)
    .setColor(embedColor)
    .setThumbnail(hasGold ? goldenRay : purpleRay)
    .addFields(
      { name: '目前抽數', value: `\`${state.pity} / 90\``, inline: true },
      { name: '累計消耗', value: `\`${state.total.toLocaleString()}\` 抽`, inline: true },
      { name: '花費原石', value: `💎 \`${cost.toLocaleString()}\``, inline: true },
      {
        name: '⚠️ 操作提示',
        value: '直接使用 `/pull_beta` 指令會**清空**所有紀錄。\n若要繼續累抽，請使用下方的按鈕操作。',
        inline: false,
      },
    )
    .setFooter({ text: '點擊 || 符號查看內容，或點按鈕接力！' });
}

function createGachaButtons(state: GachaState, lastResults: string[]): ActionRowBuilder<ButtonBuilder> {
  const baseData = `${state.pity}_${state.isG ? 1 : 0}_${state.total}_${state.win}_${state.loss}_${state.maxStreak}_${state.currentStreak}_${state.charName}`;
  const hasGold = lastResults.includes('||👑||') || lastResults.includes('||🤡||');

  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`pull_beta:1_${baseData}`)
      .setLabel('單抽')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`pull_beta:10_${baseData}`)
      .setLabel('十連')
      .setStyle(hasGold ? ButtonStyle.Success : ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`pull_beta:share_${baseData}`)
      .setLabel('分享戰績')
      .setStyle(ButtonStyle.Secondary),
  );
}
