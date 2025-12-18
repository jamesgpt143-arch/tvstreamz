export interface Channel {
  id: string;
  name: string;
  manifestUri: string;
  type: 'mpd' | 'hls' | 'youtube';
  logo: string;
  clearKey?: Record<string, string>;
  widevineUrl?: string;
  embedUrl?: string;
}

export const liveChannels: Channel[] = [
  {
    id: 'a2z',
    name: 'A2Z',
    manifestUri: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/cg_a2z/default/index.mpd',
    clearKey: {
      'f703e4c8ec9041eeb5028ab4248fa094': 'c22f2162e176eee6273a5d0b68d19530'
    },
    type: 'mpd',
    logo: 'https://i.imgur.com/pRwyOMP.png'
  },
  {
    id: 'anime-x-hidive',
    name: 'Anime X Hidive',
    manifestUri: 'https://amc-anime-x-hidive-1-us.tablo.wurl.tv/playlist.m3u8',
    type: 'hls',
    logo: 'https://www.tablotv.com/wp-content/uploads/2023/12/AnimeXHIDIVE_official-768x499.png'
  },
  {
    id: 'gma',
    name: 'GMA',
    manifestUri: 'https://converse.nathcreqtives.com/1093/manifest.mpd?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0cnlsYW5nIiwiZXhwIjoxNzY2MjI0MjAyfQ.z7zLY0g7Pim-rbsW5I0ZYx9hvUswbssoQVwMLG-vUEs',
    widevineUrl: 'https://key.nathcreqtives.com/widevine/?deviceId=02:00:00:00:00:00',
    type: 'mpd',
    logo: 'https://ottepg8.comclark.com:8443/iptvepg/images/markurl/mark_1723126306082.png'
  },
  {
    id: 'gma-youtube',
    name: 'GMA (YouTube)',
    manifestUri: '',
    type: 'youtube',
    embedUrl: 'https://www.youtube.com/embed/live_stream?channel=UCKL5hAuzgFQsyrsQKgU0Qng',
    logo: 'https://aphrodite.gmanetwork.com/entertainment/shows/images/1200_675_TVShow_MainTCARD_-20220622115633.png'
  }
];
