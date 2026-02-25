export type DataWebSite = 'manhuagui' | 'nhentai';

export const getGuildPath = (id: number | string, datatype: DataWebSite) => `./.setup/guilds/${id}_${datatype}.json`;

export const getSubListPath = (datatype: DataWebSite) => `./.setup/${datatype}_list.json`;
