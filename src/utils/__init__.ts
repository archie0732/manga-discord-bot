import { mkdirSync, writeFileSync } from 'fs';

const dir_path = ['./.setup', './.setup/guilds'];

for (const p of dir_path) {
  mkdirSync(p, { recursive: true });
}

const manhuagui_file = './.setup/manhuagui_list.json';
const manhuagui_data = {
  mangas: [],
  last_check_time: '',
};

writeFileSync('.env', 'DISCORD_TOKEN=');

writeFileSync(manhuagui_file, JSON.stringify(manhuagui_data, null, 2));

console.log('[manga bot]all init setup complete');
