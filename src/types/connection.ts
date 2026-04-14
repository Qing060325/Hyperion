// ==========================================
// Connection Extended Type Definitions
// ==========================================

import type { ConnectionInfo } from './clash';

/** IP geographic location */
export interface IPLocation {
  ip: string;
  country: string;
  country_code: string;
  region: string;
  city: string;
  isp: string;
  org?: string;
  as?: string;
  lat: number;
  lon: number;
  timezone?: string;
}

/** Process information */
export interface ProcessInfo {
  name: string;
  path: string;
  icon?: string;
  pid?: number;
  user?: string;
}

/** Extended connection detail */
export interface ConnectionDetail extends ConnectionInfo {
  location?: IPLocation;
  destLocation?: IPLocation;
  duration: number;
  process_info?: ProcessInfo;
  formatted?: {
    upload: string;
    download: string;
    speedUp: string;
    speedDown: string;
    duration: string;
    start: string;
  };
}

/** Connection filter options */
export interface ConnectionFilter {
  host?: string;
  process?: string;
  rule?: string;
  chain?: string;
  minUpload?: number;
  minDownload?: number;
  status?: 'all' | 'active' | 'idle';
}

/** Connection sort options */
export interface ConnectionSort {
  field: 'host' | 'process' | 'upload' | 'download' | 'rule' | 'duration';
  direction: 'asc' | 'desc';
}

/** Connection stats */
export interface ConnectionStats {
  total: number;
  totalUpload: number;
  totalDownload: number;
  byProcess: Record<string, number>;
  byRule: Record<string, number>;
}
