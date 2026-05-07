export interface ConnectionMetadata {
  network?: string;
  type?: string;
  source_ip?: string;
  destination_ip?: string;
  source_port?: string;
  destination_port?: string;
  host?: string;
  dns_mode?: string;
  uid?: number;
  process?: string;
  process_path?: string;
  remote_destination?: string;
  sniff_host?: string;
}

export interface ConnectionModel {
  id: string;
  metadata: ConnectionMetadata;
  upload: number;
  download: number;
  rule: string;
  rule_payload: string;
  chains: string[];
  start: string;
}
