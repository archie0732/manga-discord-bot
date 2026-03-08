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

export interface LocalGuildConfig {
  channel_id: string;
}
