# AGENT.md

## 專案概要
- 專案名稱：`manga-discord-bot`
- 主要用途：在 Discord 伺服器中提供漫畫查詢與訂閱功能，當漫畫更新時自動推播到指定頻道。
- 主要來源站：`manhuagui`（目前已實作）
- 執行環境：`Bun + TypeScript + discord.js v14`

## 目前功能
- `/ping`：回覆 Bot 延遲與 WebSocket 延遲。
- `/setup_channel`：設定指定網站（目前為 `manhuagui`）的通知頻道。
- `/search_manga_by_title`：搜尋漫畫、顯示資訊並可點按按鈕訂閱。
  - 支援 autocomplete（輸入標題時即時查詢 manhuagui）。
- `/cancel-sub-manga`：取消訂閱流程（目前只有 autocomplete 與 debug 回覆，尚未完整實作取消邏輯）。
- `/pull_beta`：抽卡模擬功能（與漫畫通知功能無直接關係）。

## 自動任務
- Bot 啟動後會每 10 分鐘執行一次訂閱檢查：
  - 讀取 `.setup/manhuagui_list.json`
  - 抓取每部漫畫最新章節
  - 若章節更新，推播到該漫畫所有已訂閱的 Discord 頻道

## 指令與互動規格

### Slash Command 檔案放置規則
- 指令檔案放在：`src/commands/**`
- 所有指令必須匯出 `new MangaBotCommand({...})`
- 新增後必須在 `src/commands/index.ts` 註冊，否則不會載入。

### 互動事件路由規格
- 互動事件由 `src/events/core/*` 負責路由：
  - `onCommand.ts`：slash command
  - `onButton.ts`：button
  - `onAutocomplete.ts`：autocomplete
  - `onModelSubmit.ts`：modal submit
- `Button / Modal / SelectMenu` 的 `customId` 格式：
  - `<commandName>:<payload>`
  - 例如：`search_manga_by_title:<guildId>-<mangaId>`
- 對應 handler 會依 `commandName` 找到相同 command 並呼叫其 `onButton/onModalSubmit/onSelectMenu`。

### defer 規則
- `MangaBotCommand.defer = true` 時：
  - slash command 會先 `deferReply()`（`onCommand.ts`）
  - button / modal 會先 `deferUpdate()`（`onButton.ts`、`onModelSubmit.ts`）
- 若指令要立即回覆可設 `defer: false`。

### Guild 快取限制
- 互動處理統一使用 `interaction.inCachedGuild()`。
- 新功能請以 guild context 為前提（目前程式流程依賴 cached guild）。

## 資料檔與路徑規格

### 初始化
- 啟動時 `checkSetup()` 會確保以下路徑存在：
  - `./.setup/`
  - `./.setup/guilds/`
  - `./.setup/manhuagui_list.json`

### 路徑工具函式
- 定義於 `src/utils/path.ts`
- guild 設定檔：
  - `getGuildPath(guildId, datatype)`
  - 實際路徑：`./.setup/guilds/<guildId>_<datatype>.json`
- 訂閱清單檔：
  - `getSubListPath(datatype)`
  - 實際路徑：`./.setup/<datatype>_list.json`

### JSON Schema（重要）
- 來源：`src/utils/models.ts`

`DatabaseSchema`（例如 `manhuagui_list.json`）
- `mangas: TrackedManga[]`
- `last_check_time: string`

`TrackedManga`
- `id: string`
- `title: string`
- `latest_chapter: string`
- `target_channels: { guild: string; channel: string }[]`

Guild local config（例如 `<guildId>_manhuagui.json`）
- 目前至少使用欄位：`channel_id: string`
- 註：`setup_channel` 寫入時包含 `guild/channel_id/channel_name`，實際讀取主要使用 `channel_id`

## 專案結構（重點）
- `src/index.ts`：Bot 入口，建立 `MangaBotClient` 並登入。
- `src/class/client.ts`：
  - 載入 commands/events
  - `updateCommands()` 註冊 slash commands
- `src/events/index.ts`：事件 handler 註冊表。
- `src/events/custom/ready.ts`：啟動時初始化與更新 commands。
- `src/events/custom/checkSubUpdate.ts`：啟動後定時檢查漫畫更新。
- `src/api/manhuagui/index.ts`：manhuagui scraper 與 search API。
- `src/utils/index.ts`：訂閱檢查、embed 建立、推播訊息。

## 環境變數
- 必填：
  - `DISCORD_TOKEN`
- 選填：
  - `CACHE_FOLDER`（command hash cache 路徑，預設 `.cache`）
  - `DEV_GUILD_ID`（`NODE_ENV=development` 時用 guild commands 更新）

## 開發與執行
- 安裝依賴：`bun install`
- 啟動：`bun run dev`
- Docker：
  - `Dockerfile` 使用 `oven/bun:latest`
  - `docker-compose.yaml` 會掛載 `./.setup` 供訂閱資料持久化

## 程式風格與維護規則
- TypeScript 設定：strict 模式（見 `tsconfig.json`）。
- ESLint + stylistic：以單引號為主，保留分號。
- 新增功能時請遵守：
  - 不要直接硬編路徑，優先使用 `src/utils/path.ts`。
  - Command、Event 新增後必須在對應 `index.ts` 註冊。
  - 所有互動元件 customId 使用 `<commandName>:<payload>` 格式。
  - 若會寫入檔案，請維持現有 JSON schema 相容性，避免破壞舊資料。

## 擴充新漫畫來源（建議流程）
1. 在 `src/utils/path.ts` 的 `DataWebSite` union 新增網站 key。
2. 新增對應 scraper/API（建議放 `src/api/<website>/`）。
3. 建立該網站的查詢/訂閱 command（可參考 `manhuagui/searchByTitle.ts`）。
4. 在排程檢查中加上該來源的更新檢查與推播流程。
5. 確認 `.setup/<website>_list.json` 初始化與 schema 一致。

## 已知注意事項
- `src/events/core/onSelectMenu.ts` 已存在，但目前未在 `src/events/index.ts` 註冊。
- `cancel-sub-manga` 指令尚未完成真正取消訂閱資料寫回邏輯。
- 部分文案目前有亂碼/編碼不一致，修改時建議統一 UTF-8。
