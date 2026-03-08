import { existsSync, mkdirSync, writeFileSync } from 'fs';
import logger from '../class/logger';

const dir_path = ['./.setup', './.setup/guilds'];
const sub_types = ['manhuagui_list.json'];

export const checkSetup = () => {
  for (const p of dir_path) {
    if (!existsSync(p)) {
      mkdirSync(p, { recursive: true });
      logger.info(`created directory: ${p}`);
    }
  }
  for (const t of sub_types) {
    if (!existsSync(`./.setup/${t}`)) {
      writeFileSync(`./.setup/${t}`, JSON.stringify({}, null, 2));
      logger.info(`created file: ${t}`);
    }
  }
};
