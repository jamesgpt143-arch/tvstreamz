// Channel category mapping based on channel names
const categoryMap: Record<string, string> = {
  // News
  'anc': 'News', 'bloomberg': 'News', 'bbc-world-news': 'News', 'channel-news-asia': 'News',
  'cnn-international': 'News', 'dzrh-tv': 'News', 'one-news': 'News', 'net25': 'News',
  'ptvnews': 'News', 'ptv4': 'News', 'smni': 'News', 'nhk-world': 'News', 'tv5': 'News',
  'untv': 'News', 'bilyonaryo': 'News', 'smni-news': 'News',

  // Sports
  'billiard-tv': 'Sports', 'blast-sports': 'Sports', 'one-sports': 'Sports', 'one-sports-plus': 'Sports',
  'premier-sports': 'Sports', 'tap-sports-5': 'Sports', 'nba-tv': 'Sports',

  // Movies & Entertainment
  'blast-movies': 'Movies', 'celestial-movies-pinoy': 'Movies', 'celestial-movies': 'Movies',
  'cinema-one': 'Movies', 'cinemo': 'Movies', 'cinemax': 'Movies', 'hbo-family': 'Movies',
  'hbo-hits': 'Movies', 'hbo-signature': 'Movies', 'hbo-hd': 'Movies', 'flix': 'Movies',
  'hits-hd': 'Movies', 'lifetime-hd': 'Movies', 'major-cineplex': 'Movies',
  'myx': 'Movies', 'rock-entertainment': 'Movies', 'tag': 'Movies',
  'tvn-movies': 'Movies', 'warner-tv': 'Movies', 'jack-city': 'Movies',

  // Anime & Kids
  'animax': 'Anime', 'anime-x-hidive': 'Anime', 'ani-one': 'Anime', 'aniplus': 'Anime',
  'cartoon-network': 'Kids', 'cartoon-classics': 'Kids', 'disney-channel': 'Kids',
  'dreamworks-hd': 'Kids', 'dreamworks-tagalog': 'Kids', 'buko': 'Kids', 'nick-jr': 'Kids',
  'nickelodeon': 'Kids', 'nickelodeon-hd': 'Kids',

  // Filipino
  'gma7': 'Filipino', 'a2z': 'Filipino', 'gma-youtube': 'Filipino', 'gma-pinoy-tv': 'Filipino',
  'hallypop': 'Filipino', 'deped-channel': 'Filipino', 'knowledge-channel': 'Filipino',
  'iwant-tf': 'Filipino', 'jeepney-tv': 'Filipino', 'kapamilya-channel': 'Filipino',
  'mbn': 'Filipino', 'makisig': 'Filipino', 's-and-a': 'Filipino', 'all-tv': 'Filipino',
  'sbn': 'Filipino', 'tv5-too': 'Filipino',

  // Documentary & Lifestyle
  'animal-planet': 'Documentary', 'bbc-earth': 'Documentary', 'discovery-channel': 'Documentary',
  'discovery-science': 'Documentary', 'crime-investigation': 'Documentary', 'history-hd': 'Documentary',
  'national-geographic': 'Documentary', 'nat-geo-wild': 'Documentary', 'global-trekker': 'Documentary',
  'food-network-hd': 'Lifestyle', 'fashion-tv-hd': 'Lifestyle', 'hgtv-hd': 'Lifestyle',
  'tlc': 'Lifestyle',

  // International
  'abc-australia': 'International', 'cctv4': 'International', 'kbs-world': 'International',
  'tvn-hd': 'International', 'tvk': 'International', 'tv5monde': 'International',
  'one-life': 'International',

  // Music
  'mtv-live': 'Music', 'mtv-pinoy': 'Music', 'trace-urban': 'Music', 'vh1': 'Music',
};

export const CATEGORIES = [
  'All', 'Filipino', 'News', 'Sports', 'Movies', 'Anime', 'Kids',
  'Documentary', 'Lifestyle', 'Music', 'International'
] as const;

export type ChannelCategory = typeof CATEGORIES[number];

export const getChannelCategory = (channelId: string): string => {
  return categoryMap[channelId] || 'Other';
};
