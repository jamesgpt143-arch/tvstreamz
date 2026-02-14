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
    id: 'gma7',
    name: 'GMA 7',
    manifestUri: 'https://gsattv.akamaized.net/live/media0/gma7/Fairplay/gma7.m3u8',
    type: 'hls',
    logo: 'https://philippines.mom-gmr.org/uploads/_processed_/0/4/csm_1011-167_import_5fdc5c345c.png'
  },
  {
    id: 'a2z',
    name: 'A2Z',
    manifestUri: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/cg_a2z/default/index.mpd',
    clearKey: {
      '3f6d8a2c1b7e4c9f8d52a7e1b0c6f93d': '4019f9269b9054a2b9e257b114ebbaf2'
    },
    type: 'mpd',
    logo: 'https://i.imgur.com/pRwyOMP.png'
  },
  {
    id: 'flix',
    name: '&Flix',
    manifestUri: 'https://edge3-moblive.yuppcdn.net/drm/smil:nflixdrm.smil/chunklist_b996000.m3u8',
    type: 'hls',
    logo: 'https://ts1.mm.bing.net/th?id=OIP.FlPpt1NoTPALgSMM8CwFgAHaHa&pid=15.1'
  },
  {
    id: 'abc-australia',
    name: 'ABC Australia',
    manifestUri: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/abc_aus/default/index.mpd',
    clearKey: {
      'd6f1a8c29b7e4d5a8f332c1e9d7b6a90': '790bd17b9e623e832003a993a2de1d87'
    },
    type: 'mpd',
    logo: 'https://i.imgur.com/480rU5C.png'
  },
  {
    id: 'animal-planet',
    name: 'Animal Planet',
    manifestUri: 'https://qp-pldt-live-bpk-01-prod.akamaized.net/bpk-tv/cg_animal_planet_sd/default/index.mpd',
    clearKey: {
      '1c9f7a6d3b2e4e5d8a61f4d0c2b9e813': 'b8f52451c67a2b54f272543eef45b621'
    },
    type: 'mpd',
    logo: 'https://api.discovery.com/v1/images/5bc91c366b66d1494068339e?aspectRatio=1x1&width=192&key=3020a40c2356a645b4b4'
  },
  {
    id: 'animax',
    name: 'Animax',
    manifestUri: 'https://qp-pldt-live-bpk-01-prod.akamaized.net/bpk-tv/cg_animax_sd_new/default/index.mpd',
    clearKey: {
      '1e7b9d2c6a4f4d8c9f33b5c1a8d7e260': '67336c0c5b24fb4b8caac248dad3c55d'
    },
    type: 'mpd',
    logo: 'https://i.imgur.com/VLlyHhT.png'
  },
  {
    id: 'anime-x-hidive',
    name: 'Anime X Hidive',
    manifestUri: 'https://amc-anime-x-hidive-1-us.tablo.wurl.tv/playlist.m3u8',
    type: 'hls',
    logo: 'https://www.tablotv.com/wp-content/uploads/2023/12/AnimeXHIDIVE_official-768x499.png'
  },
  {
    id: 'ani-one',
    name: 'Ani-One',
    manifestUri: 'https://amg19223-amg19223c9-amgplt0019.playout.now3.amagi.tv/playlist/amg19223-amg19223c9-amgplt0019/playlist.m3u8',
    type: 'hls',
    logo: 'https://i.ibb.co/Rpj2zNY7/1.png'
  },
  {
    id: 'aniplus',
    name: 'Aniplus',
    manifestUri: 'https://amg18481-amg18481c1-amgplt0352.playout.now3.amagi.tv/playlist/amg18481-amg18481c1-amgplt0352/playlist.m3u8',
    type: 'hls',
    logo: 'https://i.ibb.co/N2WkpBbJ/Gemini-Generated-Image-dwpwypdwpwypdwpw.png'
  },
  {
    id: 'anc',
    name: 'ANC',
    manifestUri: 'https://cdn-ue1-prod.tsv2.amagi.tv/linear/amg01006-abs-cbn-anc-global-dash-abscbnono/index.mpd',
    clearKey: {
      '4bbdc78024a54662854b412d01fafa16': '6039ec9b213aca913821677a28bd78ae'
    },
    type: 'mpd',
    logo: 'https://vignette.wikia.nocookie.net/russel/images/5/52/ANC_HD_Logo_2016.png/revision/latest?cb=20180404015018'
  },
  {
    id: 'axn',
    name: 'AXN',
    manifestUri: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/cg_axn_sd/default/index.mpd',
    clearKey: {
      '8a6c2f1e9d7b4c5aa1f04d2b7e9c1f88': '05e6bfa4b6805c46b772f35326b26b36'
    },
    type: 'mpd',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/AXN_Logo_2015.png'
  },
  {
    id: 'bbc-earth',
    name: 'BBC Earth',
    manifestUri: 'https://qp-pldt-live-bpk-01-prod.akamaized.net/bpk-tv/cg_bbcearth_hd1/default/index.mpd',
    clearKey: {
      '34ce95b60c424e169619816c5181aded': '0e2a2117d705613542618f58bf26fc8e'
    },
    type: 'mpd',
    logo: 'https://i.imgur.com/cvYi2Io.png'
  },
  {
    id: 'bbc-world-news',
    name: 'BBCWORLD News',
    manifestUri: 'https://qp-pldt-live-bpk-01-prod.akamaized.net/bpk-tv/bbcworld_news_sd/default/index.mpd',
    clearKey: {
      'f59650be475e4c34a844d4e2062f71f3': '119639e849ddee96c4cec2f2b6b09b40'
    },
    type: 'mpd',
    logo: 'https://th.bing.com/th/id/OIP.Dt6zbSEb8BztEMb1C93QHQHaHk?rs=1&pid=ImgDetMain'
  },
  {
    id: 'billiard-tv',
    name: 'Billiard TV',
    manifestUri: 'https://1b29dd71cd5e4191a3eb26afff631ed3.mediatailor.us-west-2.amazonaws.com/v1/master/9d062541f2ff39b5c0f48b743c6411d25f62fc25/SportsTribal-BilliardTV/BILLIARDTV_SCTE.m3u8',
    type: 'hls',
    logo: 'https://th.bing.com/th/id/OIP.JKBoiu3cX_PVMSwZLYFxCAHaHa?rs=1&pid=ImgDetMain'
  },
  {
    id: 'bilyonaryo',
    name: 'Bilyonaryo',
    manifestUri: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/bilyonaryoch/default/index.mpd',
    clearKey: {
      '227ffaf09bec4a889e0e0988704d52a2': 'b2d0dce5c486891997c1c92ddaca2cd2'
    },
    type: 'mpd',
    logo: 'https://th.bing.com/th/id/OIP.O2OG_59US0j-zqWyZwqhXAHaCH?rs=1&pid=ImgDetMain'
  },
  {
    id: 'blast-movies',
    name: 'Blast Movies',
    manifestUri: 'https://amg19223-amg19223c7-amgplt0351.playout.now3.amagi.tv/playlist/amg19223-amg19223c7-amgplt0351/playlist.m3u8',
    type: 'hls',
    logo: 'https://i.ibb.co/G3sSvQmD/unnamed-2.png'
  },
  {
    id: 'blast-sports',
    name: 'Blast Sports',
    manifestUri: 'https://amg19223-amg19223c1-amgplt0351.playout.now3.amagi.tv/playlist/amg19223-amg19223c1-amgplt0351/playlist.m3u8',
    type: 'hls',
    logo: 'https://is1-ssl.mzstatic.com/image/thumb/Purple112/v4/62/d2/16/62d216ec-1c2f-0e1f-530e-0bdb23150ea2/AppIcon-0-0-1x_U007emarketing-0-10-0-0-85-220.png/1200x630wa.png'
  },
  {
    id: 'bloomberg',
    name: 'Bloomberg',
    manifestUri: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/bloomberg_sd/default/index.mpd',
    clearKey: {
      '3b8e6d1f2c9a4f7d9a556c1e7b2d8f90': '09f0bd803966c4befbd239cfa75efe23'
    },
    type: 'mpd',
    logo: 'https://th.bing.com/th/id/OIP.ayx_C9FL75IKjIl408wLagHaFj?rs=1&pid=ImgDetMain'
  },
  {
    id: 'buko',
    name: 'BUKO',
    manifestUri: 'https://qp-pldt-live-bpk-01-prod.akamaized.net/bpk-tv/cg_buko_sd/default/index.mpd',
    clearKey: {
      'd273c085f2ab4a248e7bfc375229007d': '7932354c3a84f7fc1b80efa6bcea0615'
    },
    type: 'mpd',
    logo: 'https://th.bing.com/th/id/OIP.ph_7Uv-meouzQBVcfuuQQwHaIL?rs=1&pid=ImgDetMain'
  },
  {
    id: 'cartoon-network',
    name: 'Cartoon Network',
    manifestUri: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/cartoonnetworkhd/default/index.mpd',
    clearKey: {
      'a2d1f552ff9541558b3296b5a932136b': 'cdd48fa884dc0c3a3f85aeebca13d444'
    },
    type: 'mpd',
    logo: 'https://i.imgur.com/9PLlajp.png'
  },
  {
    id: 'cartoon-classics',
    name: 'Cartoon Classics',
    manifestUri: 'https://streams2.sofast.tv/v1/master/611d79b11b77e2f571934fd80ca1413453772ac7/d5543c06-5122-49a7-9662-32187f48aa2c/manifest.m3u8',
    type: 'hls',
    logo: 'https://tse1.mm.bing.net/th/id/OIP.e3EnrHl_y0kw59ySjxxmQAAAAA?rs=1&pid=ImgDetMain'
  },
  {
    id: 'celestial-movies-pinoy',
    name: 'Celestial Movies Pinoy',
    manifestUri: 'https://qp-pldt-live-bpk-01-prod.akamaized.net/bpk-tv/celmovie_pinoy_sd/default/index.mpd',
    clearKey: {
      '0f8537d8412b11edb8780242ac120002': '2ffd7230416150fd5196fd7ea71c36f3'
    },
    type: 'mpd',
    logo: 'https://cms.cignal.tv/Upload/Images/Celestial-Logo-2022.jpg'
  },
  {
    id: 'celestial-movies',
    name: 'Celestial Movies',
    manifestUri: 'https://linearjitp-playback.astro.com.my/dash-wv/linear/506/default_ott.mpd',
    clearKey: {
      'c5c1ba26907291afec11a9a78d513410': '361197805d0149c29801946cf2dde67c'
    },
    type: 'mpd',
    logo: 'https://mir-s3-cdn-cf.behance.net/project_modules/1400/7a0c1582445367.5d1d90a91e63c.jpg'
  },
  {
    id: 'cinema-one',
    name: 'CinemaOne',
    manifestUri: 'https://d9rpesrrg1bdi.cloudfront.net/out/v1/93b9db7b231d45f28f64f29b86dc6c65/index.mpd',
    clearKey: {
      '58d0e56991194043b8fb82feb4db7276': 'd68f41b59649676788889e19fb10d22c'
    },
    type: 'mpd',
    logo: 'https://th.bing.com/th/id/OIP.3wplDtTyzPCr4Yoyg8t_GgHaDC?rs=1&pid=ImgDetMain'
  },
  {
    id: 'cinemo',
    name: 'Cinemo',
    manifestUri: 'https://d1bail49udbz1k.cloudfront.net/out/v1/3a895f368f4a467c9bca0962559efc19/index.mpd',
    clearKey: {
      'aa8aebe35ccc4541b7ce6292efcb1bfb': 'aab1df109d22fc5d7e3ec121ddf24e5f'
    },
    type: 'mpd',
    logo: 'https://ottepg8.comclark.com:8443/iptvepg/images/markurl/mark_1723219276891.png'
  },
  {
    id: 'cinemax',
    name: 'Cinemax',
    manifestUri: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/cg_cinemax/default/index.mpd',
    clearKey: {
      'b207c44332844523a3a3b0469e5652d7': 'fe71aea346db08f8c6fbf0592209f955'
    },
    type: 'mpd',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Cinemax_%28Yellow%29.svg/1200px-Cinemax_%28Yellow%29.svg.png'
  },
  {
    id: 'cctv4',
    name: 'CCTV4',
    manifestUri: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/cgtn/default/index.mpd',
    clearKey: {
      '0f854ee4412b11edb8780242ac120002': '9f2c82a74e727deadbda389e18798d55'
    },
    type: 'mpd',
    logo: 'https://w7.pngwing.com/pngs/976/161/png-transparent-china-central-television-cctv-4-cgtn-russian-cctv-channels-television-channel-others-miscellaneous-television-text.png'
  },
  {
    id: 'channel-news-asia',
    name: 'Channel News Asia',
    manifestUri: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/channelnewsasia/default/index.mpd',
    clearKey: {
      'b259df9987364dd3b778aa5d42cb9acd': '753e3dba96ab467e468269e7e33fb813'
    },
    type: 'mpd',
    logo: 'https://www.sopasia.com/wp-content/uploads/2014/04/logo_Channel-NewsAsia-logo.jpg'
  },
  {
    id: 'cnn-international',
    name: 'CNN INTERNATIONAL',
    manifestUri: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/cg_cnnhd/default/index.mpd',
    clearKey: {
      '900c43f0e02742dd854148b7a75abbec': 'da315cca7f2902b4de23199718ed7e90'
    },
    type: 'mpd',
    logo: 'https://th.bing.com/th/id/OIP.S7pJUpbQ6mU4KQeBF66nMgHaHa?rs=1&pid=ImgDetMain'
  },
  {
    id: 'crime-investigation',
    name: 'CRIME INVESTIGATION',
    manifestUri: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/crime_invest/default/index.mpd',
    clearKey: {
      '21e2843b561c4248b8ea487986a16d33': 'db6bb638ccdfc1ad1a3e98d728486801'
    },
    type: 'mpd',
    logo: 'https://download.logo.wine/logo/Crime_%2B_Investigation_(Australian_TV_channel)/Crime_%2B_Investigation_(Australian_TV_channel)-Logo.wine.png'
  },
  {
    id: 'dzrh-tv',
    name: 'DZRH TV',
    type: 'youtube',
    manifestUri: '',
    embedUrl: 'https://www.youtube.com/embed/live_stream?channel=UCcTiBX8js_djhSSlmJRI99A',
    logo: 'https://th.bing.com/th/id/OIP.LA48bslLAx_sTgviWD-EKQAAAA?rs=1&pid=ImgDetMain'
  },
  {
    id: 'deped-channel',
    name: 'DepEd Channel',
    manifestUri: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/depedch_sd/default/index.mpd',
    clearKey: {
      '0f853706412b11edb8780242ac120002': '2157d6529d80a760f60a8b5350dbc4df'
    },
    type: 'mpd',
    logo: 'https://th.bing.com/th/id/OIP.MPPdJ1ObiLG4Q6MFEDQ4pAHaEH?rs=1&pid=ImgDetMain'
  },
  {
    id: 'discovery-channel',
    name: 'Discovery Channel',
    manifestUri: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/discovery/default/index.mpd',
    clearKey: {
      'd9ac48f5131641a789328257e778ad3a': 'b6e67c37239901980c6e37e0607ceee6'
    },
    type: 'mpd',
    logo: 'https://th.bing.com/th/id/OIP.4ONCH8mk4foZNv6W4xM0nQHaGa?rs=1&pid=ImgDetMain'
  },
  {
    id: 'discovery-science',
    name: 'Discovery Science',
    manifestUri: 'https://d1g8wgjurz8via.cloudfront.net/bpk-tv/Discoveryscience2/default/manifest.mpd',
    clearKey: {
      '5458f45efedb4d6f8aa6ac76c85b621b': 'dbf8a0a306a64525ba3012fd225370c0'
    },
    type: 'mpd',
    logo: 'https://banner2.cleanpng.com/20180824/ava/kisspng-science-channel-logo-discovery-channel-brand-showing-porn-images-for-greek-italian-porn-www-fre-1713949227223.webp'
  },
  {
    id: 'disney-channel',
    name: 'Disney Channel',
    manifestUri: 'https://uselector.cdn.intigral-ott.net/DIS/DIS.isml/manifest.mpd',
    clearKey: {
      '72800c62fcf2bfbedd9af27d79ed35d6': 'b6ccb9facb2c1c81ebe4dfaab8a45195'
    },
    type: 'mpd',
    logo: 'https://th.bing.com/th/id/OIP.ry79quPYFII7hj-ZpuoDAQHaDt?rs=1&pid=ImgDetMain'
  },
  {
    id: 'dreamworks-hd',
    name: 'Dreamworks HD',
    manifestUri: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/cg_dreamworks_hd1/default/index.mpd',
    clearKey: {
      '7b1e9c4d5a2f4d8c9f106d3a8b2c1e77': '8b2904224c6cee13d2d4e06c0a3b2887'
    },
    type: 'mpd',
    logo: 'https://logos-world.net/wp-content/uploads/2020/12/DreamWorks-Animation-Logo.png'
  },
  {
    id: 'dreamworks-tagalog',
    name: 'Dreamworks Tagalog',
    manifestUri: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/cg_dreamworktag/default/index.mpd',
    clearKey: {
      '564b3b1c781043c19242c66e348699c5': 'd3ad27d7fe1f14fb1a2cd5688549fbab'
    },
    type: 'mpd',
    logo: 'https://logos-world.net/wp-content/uploads/2020/12/DreamWorks-Animation-Logo.png'
  },
  {
    id: 'fashion-tv-hd',
    name: 'Fashion TV HD',
    manifestUri: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/fashiontvhd/default/index.mpd',
    clearKey: {
      '9d7c1f2a6b4e4a8d8f33c1e5b7d2a960': '3a18c535c52db7c79823f59036a9d195'
    },
    type: 'mpd',
    logo: 'https://th.bing.com/th/id/OIP.fRG_3Wx6qmssHxgeN5leBQHaD4?rs=1&pid=ImgDetMain'
  },
  {
    id: 'food-network-hd',
    name: 'Food Network HD',
    manifestUri: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/cg_foodnetwork_hd1/default/index.mpd',
    clearKey: {
      '4a9d2f7c1e6b4c8d8a55d7b1e3f0c926': '2e62531bdb450480a18197b14f4ebc77'
    },
    type: 'mpd',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Food_Network_New_Logo.png'
  },
  {
    id: 'global-trekker',
    name: 'Global Trekker',
    manifestUri: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/globaltrekker/default/index.mpd',
    clearKey: {
      'b7a6c5d23f1e4a9d8c721e5d9f4a6b13': '63ca9ad0d88fccb8c667b028f47287ba'
    },
    type: 'mpd',
    logo: 'https://cdn2.ettoday.net/images/6892/e6892888.jpg'
  },
  {
    id: 'gma-youtube',
    name: 'GMA (Youtube Stream)',
    type: 'youtube',
    manifestUri: '',
    embedUrl: 'https://www.youtube.com/embed/live_stream?channel=UCKL5hAuzgFQsyrsQKgU0Qng',
    logo: 'https://aphrodite.gmanetwork.com/entertainment/shows/images/1200_675_TVShow_MainTCARD_-20220622115633.png'
  },
  {
    id: 'gma-pinoy-tv',
    name: 'GMA Pinoy TV',
    manifestUri: 'https://cdn-uw2-prod.tsv2.amagi.tv/linear/amg01006-abs-cbn-abscbn-gma-x7-dash-abscbnono/7c693236-e0c1-40a3-8bd0-bb25e43f5bfc/index.mpd',
    clearKey: {
      'c95ed4c44b0b4f7fa1c6ebbbbaab21a1': '47635b8e885e19f2ccbdff078c207058'
    },
    type: 'mpd',
    logo: 'https://th.bing.com/th/id/OIP.ntjNVRaXsZJ0vrhWBA35sQHaE7?rs=1&pid=ImgDetMain'
  },
  {
    id: 'hallypop',
    name: 'hallypop',
    manifestUri: 'https://jungotvstream.chanall.tv/jungotv/hallypop/stream.m3u8',
    type: 'hls',
    logo: 'https://static.wixstatic.com/media/3f6f0d_6b141fb2470c4d0d9210f6cac32075ac~mv2.png/v1/fill/w_600,h_139,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/Hallypop_Logo_FullColor.png'
  },
  {
    id: 'hbo-family',
    name: 'HBO Family',
    manifestUri: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/cg_hbofam/default/index.mpd',
    clearKey: {
      '872910c843294319800d85f9a0940607': 'f79fd895b79c590708cf5e8b5c6263be'
    },
    type: 'mpd',
    logo: 'https://2.bp.blogspot.com/-fWMY8sHAuHs/TqB9xKDM_-I/AAAAAAAAQh0/N-fI53l9A84/s1600/hbo-family.png'
  },
  {
    id: 'hbo-hits',
    name: 'HBO Hits',
    manifestUri: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/cg_hbohits/default/index.mpd',
    clearKey: {
      'b04ae8017b5b4601a5a0c9060f6d5b7d': 'a8795f3bdb8a4778b7e888ee484cc7a1'
    },
    type: 'mpd',
    logo: 'https://vignette.wikia.nocookie.net/logopedia/images/0/04/HBO_HiTS.svg/revision/latest/scale-to-width-down/627?cb=20100511073403'
  },
  {
    id: 'hbo-signature',
    name: 'HBO Signature',
    manifestUri: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/cg_hbosign/default/index.mpd',
    clearKey: {
      'a06ca6c275744151895762e0346380f5': '559da1b63eec77b5a942018f14d3f56f'
    },
    type: 'mpd',
    logo: 'https://th.bing.com/th/id/OIP.PNeE4yWz4_Tp1O-dCdY_xAHaEP?rs=1&pid=ImgDetMain'
  },
  {
    id: 'hbo-hd',
    name: 'HBO HD',
    manifestUri: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/cg_hbohd/default/index.mpd',
    clearKey: {
      'c2b7a1e95d4f4c3a8e617f9d0a2b6c18': '27fca1ab042998b0c2f058b0764d7ed4'
    },
    type: 'mpd',
    logo: 'https://th.bing.com/th/id/OIP.lY5V2M3D9jtBFJNbOAI8swHaDt?rs=1&pid=ImgDetMain'
  },
  {
    id: 'hgtv-hd',
    name: 'HGTV HD',
    manifestUri: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/hgtv_hd1/default/index.mpd',
    clearKey: {
      'f1e8c2d97a3b4f5d8c669d1a2b7e4c30': '03aaa7dcf893e6b934aeb3c46f9df5b9'
    },
    type: 'mpd',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/0/05/HGTV_logo.png'
  },
  {
    id: 'history-hd',
    name: 'History HD',
    manifestUri: 'https://qp-pldt-live-bpk-01-prod.akamaized.net/bpk-tv/dr_historyhd/default/index.mpd',
    clearKey: {
      'e2a8c7d15b9f4d6a9c101f7e3b2d8a44': '397ca914a73b1e00bc94ed9eccf9c258'
    },
    type: 'mpd',
    logo: 'https://th.bing.com/th/id/OIP.Yx9hYOFfO03taYL2CZd6FAHaE8?rs=1&pid=ImgDetMain'
  },
  {
    id: 'hits-hd',
    name: 'Hits HD',
    manifestUri: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/hits_hd1/default/index.mpd',
    clearKey: {
      '6d2f8a1c9b5e4c7da1f03e7b9d6c2a55': '37c9835795779f8d848a6119d3270c69'
    },
    type: 'mpd',
    logo: 'https://th.bing.com/th/id/OIP.x2dQgh_yGBdnttScluIGYAHaCp?w=900&h=322&rs=1&pid=ImgDetMain'
  },
  {
    id: 'hits-movies',
    name: 'Hits Movies',
    manifestUri: 'https://qp-pldt-live-bpk-01-prod.akamaized.net/bpk-tv/dr_hitsmovies/default/index.mpd',
    clearKey: {
      '2c8a5f1e7b9d4c6a9e55f1d7b2a8c360': 'c9f622dff27e9e1c1f78617ba3b81a62'
    },
    type: 'mpd',
    logo: 'https://tse2.mm.bing.net/th/id/OIP.IVTdT_KbbSE3puMAYpFGaQAAAA?cb=12&w=434&h=284&rs=1&pid=ImgDetMain&o=7&rm=3'
  },
  {
    id: 'hits-now',
    name: 'Hits Now',
    manifestUri: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/cg_hitsnow/default/index.mpd',
    clearKey: {
      'f9c3d6b18a2e4d7f9e453b1a8c6d2f70': 'ce8874347ec428c624558dcdc3575dd4'
    },
    type: 'mpd',
    logo: 'https://th.bing.com/th/id/OIP.cM1HO2isouoNessbj31CcgAAAA?rs=1&pid=ImgDetMain'
  },
  {
    id: 'ibc13',
    name: 'IBC13',
    manifestUri: 'https://qp-pldt-live-bpk-01-prod.akamaized.net/bpk-tv/ibc13_sd_new/default1/index.mpd',
    clearKey: {
      '16ecd238c0394592b8d3559c06b1faf5': '05b47ae3be1368912ebe28f87480fc84'
    },
    type: 'mpd',
    logo: 'https://th.bing.com/th/id/OIP.sJNkdFUalhzRyZT4SJ9HBAHaEc?rs=1&pid=ImgDetMain'
  },
  {
    id: 'iqiyi',
    name: 'iQIYI',
    manifestUri: 'https://mt12.aa.astro.com.my/default_ott.mpd?PID=&PAID=1006&deviceIdType=%5BdevIdType%5D&deviceId=1&appId=astrogo.astro.com.my&appName=%5BappName%5D&devModel=%5BdevModel%5D&playerWidth=%5BplayerWidth%5D&playerHeight=%5BplayerHeight%5D&sessionId=abr-linear-1&optin=true&hhid=1&kvp=lang%7Echi&kvp=genre%7ECHINESE%2CHD%2CALL&daiEnabled=true',
    clearKey: {
      '7ef7e913ce85a1131b27036069169a10': '77d98ed71db7524c27875a09a975f9e6'
    },
    type: 'mpd',
    logo: 'https://th.bing.com/th/id/OIP.tGUjHFJqDIFUuKfn-31TxAHaEN?rs=1&pid=ImgDetMain'
  },
  {
    id: 'jungo-pinoy-tv',
    name: 'Jungo Pinoy tv',
    manifestUri: 'https://jungotvstream.chanall.tv/jungotv/jungopinoytv/stream.m3u8',
    type: 'hls',
    logo: 'https://dito.ph/hubfs/Dito_July2021/Ott%20Pages/Jungo-img/Jungo-logo.png'
  },
  {
    id: 'kapamilya-channel',
    name: 'Kapamilya Channel',
    manifestUri: 'https://cdn-ue1-prod.tsv2.amagi.tv/linear/amg01006-abs-cbn-kapcha-dash-abscbnono/index.mpd',
    clearKey: {
      'bd17afb5dc9648a39be79ee3634dd4b8': '3ecf305d54a7729299b93a3d69c02ea5'
    },
    type: 'mpd',
    logo: 'https://th.bing.com/th/id/OIP.ZzYB03x8FwMJFXEoCw4BcQHaEK?rs=1&pid=ImgDetMain'
  },
  {
    id: 'kapamilya-online',
    name: 'Kapamilya Online',
    type: 'youtube',
    manifestUri: '',
    embedUrl: 'https://www.youtube.com/embed/live_stream?channel=UCstEtN0pgOmCf02EdXsGChw',
    logo: 'https://th.bing.com/th/id/OIP.WJ42CLSN52F8__yoFceMOwHaEK?rs=1&pid=ImgDetMain'
  },
  {
    id: 'kbs-world',
    name: 'KBS World',
    manifestUri: 'https://qp-pldt-live-bpk-01-prod.akamaized.net/bpk-tv/kbsworld/default/index.mpd',
    clearKey: {
      '22ff2347107e4871aa423bea9c2bd363': 'c6e7ba2f48b3a3b8269e8bc360e60404'
    },
    type: 'mpd',
    logo: 'https://th.bing.com/th/id/OIP.tGUjHFJqDIFUuKfn-31TxAHaEN?rs=1&pid=ImgDetMain'
  },
  {
    id: 'kix-hd',
    name: 'Kix HD',
    manifestUri: 'https://qp-pldt-live-bpk-01-prod.akamaized.net/bpk-tv/kix_hd1/default/index.mpd',
    clearKey: {
      'c9d4b7a18e2f4d6c9a103f5b7e1c2d88': '7f3139092bf87d8aa51ee40e6294d376'
    },
    type: 'mpd',
    logo: 'https://th.bing.com/th/id/OIP.tGUjHFJqDIFUuKfn-31TxAHaEN?rs=1&pid=ImgDetMain'
  },
  {
    id: 'knowledge-channel',
    name: 'Knowledge Channel',
    manifestUri: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/knowledge_channel/default/index.mpd',
    clearKey: {
      'c7d2b1e94f8a4d6c8a106b3d1f9c2e55': '2052f6b844aa53144bb32f0e41295106'
    },
    type: 'mpd',
    logo: 'https://th.bing.com/th/id/OIP.ix5ReWijxZg8uPcKrk2GHwHaGd?rs=1&pid=ImgDetMain'
  },
  {
    id: 'kplus',
    name: 'Kplus',
    manifestUri: 'https://unifi-live2.secureswiftcontent.com/Content/DASH/Live/channel(Kplus)/master.mpd',
    clearKey: {
      '826e7fd2d6a14060bfea9347d96f8824': '176897afb079e0cc76bc912df4cb0b6e'
    },
    type: 'mpd',
    logo: 'https://www.pngkey.com/png/detail/306-3060351_k-plus-k-plus-channel-logo.png'
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    manifestUri: 'https://qp-pldt-live-bpk-01-prod.akamaized.net/bpk-tv/dr_lifetime/default/index.mpd',
    clearKey: {
      'cf861d26e7834166807c324d57df5119': '64a81e30f6e5b7547e3516bbf8c647d0'
    },
    type: 'mpd',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Logo_Lifetime_2020.svg/440px-Logo_Lifetime_2020.svg.png'
  },
  {
    id: 'k-movies',
    name: 'K-Movies',
    manifestUri: 'https://7732c5436342497882363a8cd14ceff4.mediatailor.us-east-1.amazonaws.com/v1/master/04fd913bb278d8775298c26fdca9d9841f37601f/Plex_NewMovies/playlist.m3u8',
    type: 'hls',
    logo: 'https://th.bing.com/th/id/OIP.uvYKFBubGFR40NtgWh7W8wHaES?rs=1&pid=ImgDetMain'
  },
  {
    id: 'lotus-macau',
    name: 'Lotus Macau',
    manifestUri: 'https://qp-pldt-live-bpk-01-prod.akamaized.net/bpk-tv/lotusmacau_prd/default/index.mpd',
    clearKey: {
      '9a7c2d1f4e8b4a6d8f301b5c9e7d2a44': 'ca88469cabc18aa33d1f2e46a6efb4f7'
    },
    type: 'mpd',
    logo: 'https://i.imgur.com/5G72qjx.png'
  },
  {
    id: 'Kapatid HD',
    name: 'MPTV',
    manifestUri: 'https://qp-pldt-live-bpk-01-prod.akamaized.net/bpk-tv/kapatid_hd/default/index.mpd',
    clearKey: {
      '045d103180f64562b1db7c932741c3ba': 'c3380548b9075c767a6ae2006ef4bff8'
    },
    type: 'mpd',
    logo: 'https://via.placeholder.com/150?text=KAPATID+HD'
  },
  {
    id: 'myx',
    name: 'Myx',
    manifestUri: 'https://d24xfhmhdb6r0q.cloudfront.net/out/v1/e897a7b6414a46019818ee9f2c081c4f/index.mpd',
    clearKey: {
      'f40a52a3ac9b4702bdd5b735d910fd2f': '5ce1bc7f06b494c276252b4d13c90e51'
    },
    type: 'mpd',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Cinemax_%28Yellow%29.svg/1200px-Cinemax_%28Yellow%29.svg.png'
  },
  {
    id: 'nba-tv-philippines',
    name: 'NBA TV Philippines',
    manifestUri: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/cgnl_nba/default/index.mpd',
    clearKey: {
      'd1f8a0c97b3d4e529a6f2c4b8d7e1f90': '58ab331d14b66bf31aca4284e0a3e536'
    },
    type: 'mpd',
    logo: 'https://cms.cignal.tv/Upload/Images/NBA-TV-Philippines.jpg'
  },
  {
    id: 'nhk-japan',
    name: 'NHK JAPAN',
    manifestUri: 'https://qp-pldt-live-bpk-01-prod.akamaized.net/bpk-tv/dr_nhk_japan/default/index.mpd',
    clearKey: {
      '3d6e9d4de7d7449aadd846b7a684e564': '0800fff80980f47f7ac6bc60b361b0cf'
    },
    type: 'mpd',
    logo: 'https://logowik.com/content/uploads/images/nhk-world-japan1495.jpg'
  },
  {
    id: 'nickjr',
    name: 'Nickjr',
    manifestUri: 'https://qp-pldt-live-bpk-01-prod.akamaized.net/bpk-tv/dr_nickjr/default/index.mpd',
    clearKey: {
      'bab5c11178b646749fbae87962bf5113': '0ac679aad3b9d619ac39ad634ec76bc8'
    },
    type: 'mpd',
    logo: 'https://vignette.wikia.nocookie.net/logaekranowe/images/4/45/1024px-Nick_Jr._logo_2009.svg.png/revision/latest?cb=20180616122202&path-prefix=pl'
  },
  {
    id: 'nickelodeon',
    name: 'Nickelodeon',
    manifestUri: 'https://qp-pldt-live-bpk-01-prod.akamaized.net/bpk-tv/dr_nickelodeon/default/index.mpd',
    clearKey: {
      '9ce58f37576b416381b6514a809bfd8b': 'f0fbb758cdeeaddfa3eae538856b4d72'
    },
    type: 'mpd',
    logo: 'https://logos-download.com/wp-content/uploads/2016/04/Nickelodeon_logo_logotype_2.png'
  },
  {
    id: 'one-news-hd',
    name: 'One News HD',
    manifestUri: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/onenews_hd1/default/index.mpd',
    clearKey: {
      '2e6a9d7c1f4b4c8a8d33c7b1f0a5e924': '4c71e178d090332fbfe72e023b59f6d2'
    },
    type: 'mpd',
    logo: 'https://th.bing.com/th/id/OIP.x5VzEESkd4_1pVGulNU43gHaGN?rs=1&pid=ImgDetMain'
  },
  {
    id: 'one-ph',
    name: 'One PH',
    manifestUri: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/oneph_sd/default/index.mpd',
    clearKey: {
      'b1c7e9d24f8a4d6c9e337a2f1c5b8d60': '8ff2e524cc1e028f2a4d4925e860c796'
    },
    type: 'mpd',
    logo: 'https://th.bing.com/th/id/OIP.uz-f8yhdILIhdUj56NO6YAAAAA?rs=1&pid=ImgDetMain'
  },
  {
    id: 'one-sports',
    name: 'One Sports',
    manifestUri: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/cg_onesports_hd/default/index.mpd',
    clearKey: {
      '53c3bf2eba574f639aa21f2d4409ff11': '3de28411cf08a64ea935b9578f6d0edd'
    },
    type: 'mpd',
    logo: 'https://vignette.wikia.nocookie.net/logopedia/images/5/56/TV5_One_Sports_Channel.png/revision/latest/scale-to-width-down/300?cb=20181221055916'
  },
  {
    id: 'one-sports-plus-hd',
    name: 'One Sports Plus HD',
    manifestUri: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/cg_onesportsplus_hd1/default/index.mpd',
    clearKey: {
      'f00bd0122a8a4da1a49ea6c49f7098ad': 'a4079f3667ba4c2bcfdeb13e45a6e9c6'
    },
    type: 'mpd',
    logo: 'https://yt3.ggpht.com/a/AATXAJxL2nOhPRXCDKBEK-ccmTRM0G5r24tnVWUraw=s900-c-k-c0xffffffff-no-rj-mo'
  },
  {
    id: 'pba-rush',
    name: 'PBA Rush',
    manifestUri: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/cg_pbarush_hd1/default/index.mpd',
    clearKey: {
      'd7f1a9c36b2e4f8d9a441c5e7b2d8f60': 'fb83c86f600ab945e7e9afed8376eb1e'
    },
    type: 'mpd',
    logo: 'https://th.bing.com/th/id/OIP.dDzYufwVTWroitJQy9pfXQAAAA?rs=1&pid=ImgDetMain'
  },
  {
    id: 'pbb-collab',
    name: 'PBB Collab 2.0',
    manifestUri: 'https://cdn-uw2-prod.tsv2.amagi.tv/linear/amg01006-abs-cbn-pbb-live-dash-abscbnono/index.mpd',
    type: 'mpd',
    logo: 'https://pql-static.abs-cbn.com/images/channel/pbbcelebritycollab_livethumb_20251023021847.jpg'
  },
  {
    id: 'pbb-collab-dining',
    name: 'PBB Collab 2.0 Dining Area',
    manifestUri: 'https://abslive.akamaized.net/dash/live/2028025/pbb1/manifest.mpd',
    clearKey: {
      'b37bb823fe48452eba8cee62516f5da1': '8b48cec6bce94917e4c39c381d607102'
    },
    type: 'mpd',
    logo: 'https://pql-static.abs-cbn.com/images/channel/pbballaccessstreamdining_livethumb_20251023021947.jpg'
  },
  {
    id: 'pbb-collab-pool',
    name: 'PBB Collab 2.0 Pool Area',
    manifestUri: 'https://abslive.akamaized.net/dash/live/2028025/pbb2/manifest.mpd',
    clearKey: {
      '9539027a7c42446a8648555af3bb3095': '1cb94c88f68bef1e728cfa4677e1eeca'
    },
    type: 'mpd',
    logo: 'https://pql-static.abs-cbn.com/images/channel/pbballaccessstreampool_livethumb_20251023022209.jpg'
  },
  {
    id: 'pbo',
    name: 'PBO',
    manifestUri: 'https://qp-pldt-live-bpk-01-prod.akamaized.net/bpk-tv/pbo_sd/default/index.mpd',
    clearKey: {
      'dcbdaaa6662d4188bdf97f9f0ca5e830': '31e752b441bd2972f2b98a4b1bc1c7a1'
    },
    type: 'mpd',
    logo: 'https://i.imgur.com/ZUZIt9s.png'
  },
  {
    id: 'premier-sports',
    name: 'Premier Sports',
    manifestUri: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/cg_ps_hd1/default/index.mpd',
    clearKey: {
      'b8b595299fdf41c1a3481fddeb0b55e4': 'cd2b4ad0eb286239a4a022e6ca5fd007'
    },
    type: 'mpd',
    logo: 'https://th.bing.com/th/id/OIP.UEZdJevwcZaL1qmePWjLGgHaHY?rs=1&pid=ImgDetMain'
  },
  {
    id: 'premier-tennis',
    name: 'Premier Tennis',
    manifestUri: 'https://qp-pldt-live-grp-13-prod.akamaized.net/out/u/dr_premiertennishd.mpd',
    clearKey: {
      '59454adb530b4e0784eae62735f9d850': '61100d0b8c4dd13e4eb8b4851ba192cc'
    },
    type: 'mpd',
    logo: 'https://th.bing.com/th/id/OIP.yd4QRZWcEgEz2T1EZv41mAAAAA?rs=1&pid=ImgDetMain'
  },
  {
    id: 'ptv4',
    name: 'PTV4',
    manifestUri: 'https://qp-pldt-live-bpk-01-prod.akamaized.net/bpk-tv/cg_ptv4_sd/default/index.mpd',
    clearKey: {
      '71a130a851b9484bb47141c8966fb4a3': 'ad1f003b4f0b31b75ea4593844435600'
    },
    type: 'mpd',
    logo: 'https://media.philstar.com/images/articles/ptv4_2018-06-14_11-27-10.jpg'
  },
  {
    id: 'rakuten-viki',
    name: 'Rakuten Viki',
    manifestUri: 'https://fd18f1cadd404894a31a3362c5f319bd.mediatailor.us-east-1.amazonaws.com/v1/master/04fd913bb278d8775298c26fdca9d9841f37601f/RakutenTV-eu_RakutenViki-1/playlist.m3u8',
    type: 'hls',
    logo: 'https://tse1.mm.bing.net/th/id/OIP.14iQmo2HrOxiL10lttVslgAAAA?rs=1&pid=ImgDetMain&o=7&rm=3'
  },
  {
    id: 'red-bull-tv',
    name: 'Red Bull TV',
    manifestUri: 'https://d3k3xxewhm1my2.cloudfront.net/playlist.m3u8',
    type: 'hls',
    logo: 'https://i.ibb.co/cK5FsbyM/unnamed-1.png'
  },
  {
    id: 'rock-action',
    name: 'Rock Action',
    manifestUri: 'https://qp-pldt-live-bpk-01-prod.akamaized.net/bpk-tv/dr_rockextreme/default/index.mpd',
    clearKey: {
      '8d2a6f1c9b7e4c3da5f01e7b9c6d2f44': '23841651ebf49fa03fdfcd7b43337f87'
    },
    type: 'mpd',
    logo: 'https://th.bing.com/th/id/OIP.0c6d3hoH5evqsJVNnbhVNwHaC3?rs=1&pid=ImgDetMain'
  },
  {
    id: 'rock-entertainment',
    name: 'Rock Entertainment',
    manifestUri: 'https://qp-pldt-live-bpk-01-prod.akamaized.net/bpk-tv/dr_rockentertainment/default/index.mpd',
    clearKey: {
      'a8b2d6f14c9e4d7a8f552c1e9b7d6a30': 'b61a33a4281e7c8e68b24b9af466f7b4'
    },
    type: 'mpd',
    logo: 'https://assets-global.website-files.com/64e81e52acfdaa1696fd623f/652f763c600497122b122df0_logo_ent_red_web.png'
  },
  {
    id: 'rptv',
    name: 'RPTV',
    manifestUri: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/cnn_rptv_prod_hd/default/index.mpd',
    clearKey: {
      '1917f4caf2364e6d9b1507326a85ead6': 'a1340a251a5aa63a9b0ea5d9d7f67595'
    },
    type: 'mpd',
    logo: 'https://th.bing.com/th/id/OIP.hWUhA4FmrinqMTykADb9NwHaEX?rs=1&pid=ImgDetMain'
  },
  {
    id: 'sarisari',
    name: 'SARISARI',
    manifestUri: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/cg_sarisari/default/index.mpd',
    clearKey: {
      '0a7ab3612f434335aa6e895016d8cd2d': 'b21654621230ae21714a5cab52daeb9d'
    },
    type: 'mpd',
    logo: 'https://vignette1.wikia.nocookie.net/logopedia/images/3/3e/Sari-Sari_alternate_Logo.PNG/revision/latest?cb=20160619031101'
  },
  {
 id: 'SineManila',
    name: 'SineManila',
    manifestUri: 'https://live20.bozztv.com/giatv/giatv-sinemanila/sinemanila/chunks.m3u8',
    type: 'hls',
    logo: 'https://i.imgur.com/zcFUYC5.png'
  },
  {

    id: 'sony-cine',
    name: 'Sony Cine',
    manifestUri: 'https://a-cdn.klowdtv.com/live1/cine_720p/chunks.m3u8',
    type: 'hls',
    logo: 'https://th.bing.com/th/id/OIP._NGk-Rpn5n6TOVRIjvnZ6QHaHb?rs=1&pid=ImgDetMain'
  },
  {
    id: 'spotv',
    name: 'SPOTV',
    manifestUri: 'https://qp-pldt-live-bpk-01-prod.akamaized.net/bpk-tv/cg_spotvhd/default/index.mpd',
    clearKey: {
      'ec7ee27d83764e4b845c48cca31c8eef': '9c0e4191203fccb0fde34ee29999129e'
    },
    type: 'mpd',
    logo: 'https://uploads-sportbusiness.imgix.net/uploads/2021/09/SPOTV_LOGO-01-w-2.png?auto=compress,format&crop=faces,entropy,edges&fit=crop&w=620&h=227'
  },
  {
    id: 'spotv2',
    name: 'SPOTV2',
    manifestUri: 'https://qp-pldt-live-bpk-01-prod.akamaized.net/bpk-tv/dr_spotv2hd/default/index.mpd',
    clearKey: {
      '7eea72d6075245a99ee3255603d58853': '6848ef60575579bf4d415db1032153ed'
    },
    type: 'mpd',
    logo: 'https://cms.dmpcdn.com/livetv/2023/02/06/00d2eb00-a5c0-11ed-a358-099f80363291_webp_original.png'
  },
  {
    id: 'tap-sports',
    name: 'TAP Sports',
    manifestUri: 'https://qp-pldt-live-bpk-01-prod.akamaized.net/bpk-tv/dr_tapsports/default/index.mpd',
    clearKey: {
      '5e7c1b9a2d8f4a6c9f30b1d6e2a8c744': '6178d9d177689eec5028e2dd608ae7b6'
    },
    type: 'mpd',
    logo: 'https://tapdmv.com/logo-tapSPORTS-2021.png'
  },
  {
    id: 'tap-movies',
    name: 'Tap Movies',
    manifestUri: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/cg_tapmovies_hd1/default/index.mpd',
    clearKey: {
      '71cbdf02b595468bb77398222e1ade09': 'c3f2aa420b8908ab8761571c01899460'
    },
    type: 'mpd',
    logo: 'https://cms.cignal.tv/Upload/Images/Tap-movies.jpg'
  },
  {
    id: 'tap-tv',
    name: 'TAP TV',
    manifestUri: 'https://qp-pldt-live-bpk-01-prod.akamaized.net/bpk-tv/cg_taptv_sd/default/index.mpd',
    clearKey: {
      '5c1e7b9d2f6a4d8c8a55e9d2c7b1a344': 'e72d21a22e89660ff0ec33627eb4ef35'
    },
    type: 'mpd',
    logo: 'https://th.bing.com/th/id/OIP.6ypmkyHr4CsiHriWt327pgHaHc?rs=1&pid=ImgDetMain'
  },
  {
    id: 'tap-action-flix',
    name: 'Tap Action Flix',
    manifestUri: 'https://qp-pldt-live-bpk-01-prod.akamaized.net/bpk-tv/cg_tapactionflix_hd1/default/index.mpd',
    clearKey: {
      'bee1066160c0424696d9bf99ca0645e3': 'f5b72bf3b89b9848de5616f37de040b7'
    },
    type: 'mpd',
    logo: 'https://tapdmv.ovationproductionsmanila.com/logo-TapActionFlix-2021-B.png'
  },
  {
    id: 'teleradyo',
    name: 'Teleradyo',
    manifestUri: 'https://cdn-ue1-prod.tsv2.amagi.tv/linear/amg01006-abs-cbn-teleradyo-dash-abscbnono/index.mpd',
    clearKey: {
      '47c093e0c9fd4f80839a0337da3dd876': '50547394045b3d047dc7d92f57b5fb33'
    },
    type: 'mpd',
    logo: 'https://th.bing.com/th/id/OIP.VFN5ge6hBzP5uudSV5giGwAAAA?rs=1&pid=ImgDetMain'
  },
  {
    id: 'tennis-plus',
    name: 'Tennis+',
    manifestUri: 'https://amg01935-amg01935c1-amgplt0352.playout.now3.amagi.tv/playlist/amg01935-amg01935c1-amgplt0352/playlist.m3u8',
    type: 'hls',
    logo: 'https://i.ibb.co/wNqkRfjw/unnamed.png'
  },
  {
    id: 'thrill',
    name: 'Thrill',
    manifestUri: 'https://qp-pldt-live-bpk-01-prod.akamaized.net/bpk-tv/cg_thrill_sd/default/index.mpd',
    clearKey: {
      '928114ffb2394d14b5585258f70ed183': 'a82edc340bc73447bac16cdfed0a4c62'
    },
    type: 'mpd',
    logo: 'https://www.mncvision.id/userfiles/image/channel/thrill_150x150px.jpg'
  },
  {
    id: 'tmc',
    name: 'TMC',
    manifestUri: 'https://qp-pldt-live-bpk-01-prod.akamaized.net/bpk-tv/cg_tagalogmovie/default/index.mpd',
    clearKey: {
      '96701d297d1241e492d41c397631d857': 'ca2931211c1a261f082a3a2c4fd9f91b'
    },
    type: 'mpd',
    logo: 'https://th.bing.com/th/id/OIP.mskveWFrbAwpq6athkC91gAAAA?rs=1&pid=ImgDetMain'
  },
  {
    id: 'travel-channel',
    name: 'Travel Channel',
    manifestUri: 'https://qp-pldt-live-bpk-01-prod.akamaized.net/bpk-tv/travel_channel_sd/default/index.mpd',
    clearKey: {
      'f3047fc13d454dacb6db4207ee79d3d3': 'bdbd38748f51fc26932e96c9a2020839'
    },
    type: 'mpd',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/2018_Travel_Channel_logo.svg/1200px-2018_Travel_Channel_logo.svg.png'
  },
  {
    id: 'true-fm-tv',
    name: 'True FM TV',
    manifestUri: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/truefm_tv/default/index.mpd',
    clearKey: {
      'a4e2b9d61c754f3a8d109b6c2f1e7a55': '1d8d975f0bc2ed90eda138bd31f173f4'
    },
    type: 'mpd',
    logo: 'https://th.bing.com/th/id/OIP.mnFsqTyoPfS65QqSTLKHLAHaHa?rs=1&pid=ImgDetMain'
  },
  {
    id: 'tvn-movies-tagalog',
    name: 'TVN Movies (Tagalog)',
    manifestUri: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/cg_tvnmovie/default/index.mpd',
    clearKey: {
      '2e53f8d8a5e94bca8f9a1e16ce67df33': '3471b2464b5c7b033a03bb8307d9fa35'
    },
    type: 'mpd',
    logo: 'https://i.imgur.com/3zLgtdM.png'
  },
  {
    id: 'tvn',
    name: 'TVN',
    manifestUri: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/cg_tvnpre/default/index.mpd',
    clearKey: {
      'e1bde543e8a140b38d3f84ace746553e': 'b712c4ec307300043333a6899a402c10'
    },
    type: 'mpd',
    logo: 'https://i.imgur.com/3zLgtdM.png'
  },
  {
    id: 'tvup',
    name: 'TVUP',
    manifestUri: 'https://qp-pldt-live-bpk-01-prod.akamaized.net/bpk-tv/tvup_prd/default/index.mpd',
    clearKey: {
      '83e813ccd4ca4837afd611037af02f63': 'a97c515dbcb5dcbc432bbd09d15afd41'
    },
    type: 'mpd',
    logo: 'https://i.imgur.com/3L0yn52.png'
  },
  {
    id: 'tv5',
    name: 'TV5',
    manifestUri: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/tv5_hd/default1/index.mpd',
    clearKey: {
      '2615129ef2c846a9bbd43a641c7303ef': '07c7f996b1734ea288641a68e1cfdc4d'
    },
    type: 'mpd',
    logo: 'https://cms.cignal.tv/Upload/Thumbnails/TV5%20HD%20logo%20(1).png'
  },
  {
    id: 'uaap-varsity',
    name: 'UAAP Varsity',
    manifestUri: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/cg_uaap_cplay_sd/default/index.mpd',
    clearKey: {
      '95588338ee37423e99358a6d431324b9': '6e0f50a12f36599a55073868f814e81e'
    },
    type: 'mpd',
    logo: 'https://i.imgur.com/pt2hGDc.png'
  },
  {
    id: 'viva',
    name: 'VIVA',
    manifestUri: 'https://qp-pldt-live-bpk-01-prod.akamaized.net/bpk-tv/viva_sd/default/index.mpd',
    clearKey: {
      '07aa813bf2c147748046edd930f7736e': '3bd6688b8b44e96201e753224adfc8fb'
    },
    type: 'mpd',
    logo: 'https://i.imgur.com/z8lWIX6.png'
  },
  {
    id: 'warner-tv',
    name: 'Warner TV',
    manifestUri: 'https://qp-pldt-live-grp-11-prod.akamaized.net/out/u/dr_warnertvhd.mpd',
    clearKey: {
      '4503cf86bca3494ab95a77ed913619a0': 'afc9c8f627fb3fb255dee8e3b0fe1d71'
    },
    type: 'mpd',
    logo: 'https://th.bing.com/th/id/OIP.8xIdcYektX82pKAdaXcQEgHaHr?rs=1&pid=ImgDetMain'
  }
];
