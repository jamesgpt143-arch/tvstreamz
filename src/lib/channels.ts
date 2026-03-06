export type ProxyKey = 'primary' | 'backup' | 'backup2' | 'backup3' | 'backup4';

export const PROXY_LABELS: Record<ProxyKey, string> = {
  primary: 'Primary',
  backup: 'Backup 1',
  backup2: 'Backup 2',
  backup3: 'Backup 3',
  backup4: 'Backup 4',
};

export const DEFAULT_PROXY_ORDER: ProxyKey[] = ['primary', 'backup', 'backup2', 'backup3', 'backup4'];

export interface Channel {
  id: string;
  name: string;
  manifestUri: string;
  type: 'mpd' | 'hls' | 'youtube';
  logo: string;
  clearKey?: Record<string, string>;
  widevineUrl?: string;
  embedUrl?: string;
  userAgent?: string;
  referrer?: string;
  useProxy?: boolean;
  proxyOrder?: ProxyKey[];
}
