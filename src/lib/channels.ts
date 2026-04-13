export type ProxyKey = 'primary' | 'backup' | 'backup2' | 'backup3' | 'backup4' | 'backup5' | 'backup6' | 
  'supabase_proxy_url' | 'supabase_proxy_url_backup' | 'supabase_proxy_url_backup2' | 'supabase_proxy_url_backup3' | 'supabase_proxy_url_backup4' | 'supabase_proxy_url_backup5' | 'supabase_proxy_url_backup6' |
  'vercel_proxy_url' | 'vercel_proxy_url_backup' | 'vercel_proxy_url_backup2' | 'vercel_proxy_url_backup3' | 'vercel_proxy_url_backup4' | 'vercel_proxy_url_backup5' | 'vercel_proxy_url_backup6';

export const PROXY_LABELS: Record<string, string> = {
  primary: 'Primary',
  backup: 'Backup 1',
  backup2: 'Backup 2',
  backup3: 'Backup 3',
  backup4: 'Backup 4',
  backup5: 'Backup 5',
  backup6: 'Backup 6',
  supabase_proxy_url: 'SB Primary',
  supabase_proxy_url_backup: 'SB Backup 1',
  supabase_proxy_url_backup2: 'SB Backup 2',
  supabase_proxy_url_backup3: 'SB Backup 3',
  supabase_proxy_url_backup4: 'SB Backup 4',
  supabase_proxy_url_backup5: 'SB Backup 5',
  supabase_proxy_url_backup6: 'SB Backup 6',
  vercel_proxy_url: 'VC Primary',
  vercel_proxy_url_backup: 'VC Backup 1',
  vercel_proxy_url_backup2: 'VC Backup 2',
  vercel_proxy_url_backup3: 'VC Backup 3',
  vercel_proxy_url_backup4: 'VC Backup 4',
  vercel_proxy_url_backup5: 'VC Backup 5',
  vercel_proxy_url_backup6: 'VC Backup 6',
};

export const DEFAULT_PROXY_ORDER: ProxyKey[] = ['primary', 'backup', 'backup2', 'backup3', 'backup4', 'backup5', 'backup6'];

export interface Channel {
  id: string;
  name: string;
  manifestUri: string;
  type: 'mpd' | 'hls' | 'youtube' | 'plain';
  logo: string;
  clearKey?: Record<string, string>;
  widevineUrl?: string;
  embedUrl?: string;
  userAgent?: string;
  referrer?: string;
  useProxy?: boolean;
  proxyOrder?: ProxyKey[];
  tvappSlug?: string;
  proxyType?: string;
  offlineTitle?: string;
  offlineMessage?: string;
  status?: 'online' | 'offline';
}
