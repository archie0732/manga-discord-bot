import { ManhuaguiSearchAPI } from './index';

const api = new ManhuaguiSearchAPI();

api.search('皺術').then(() => console.log(api.searchResults));
