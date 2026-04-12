use anyhow::Result;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ClashConnection {
    pub host: String,
    pub port: u16,
    pub secret: Option<String>,
}

impl Default for ClashConnection {
    fn default() -> Self {
        Self {
            host: "127.0.0.1".to_string(),
            port: 9090,
            secret: None,
        }
    }
}

impl ClashConnection {
    pub fn base_url(&self) -> String {
        format!("http://{}:{}", self.host, self.port)
    }

    pub fn ws_url(&self, path: &str) -> String {
        let mut url = format!("ws://{}:{}{}", self.host, self.port, path);
        if let Some(secret) = &self.secret {
            url = format!("{}?token={}", url, secret);
        }
        url
    }
}

#[derive(Debug, Deserialize)]
pub struct ClashVersion {
    pub meta: bool,
    pub version: String,
}

#[derive(Debug, Deserialize)]
pub struct ClashConfig {
    pub port: Option<u16>,
    pub socks_port: Option<u16>,
    pub redir_port: Option<u16>,
    pub tproxy_port: Option<u16>,
    pub mixed_port: Option<u16>,
    pub allow_lan: Option<bool>,
    pub bind_address: Option<String>,
    pub mode: Option<String>,
    pub log_level: Option<String>,
    pub ipv6: Option<bool>,
    pub external_controller: Option<String>,
    pub secret: Option<String>,
    pub tun: Option<TunConfig>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct TunConfig {
    pub enable: bool,
    pub stack: Option<String>,
    pub dns_hijack: Option<Vec<String>>,
    pub auto_route: Option<bool>,
    pub auto_detect_interface: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct ProxiesData {
    pub proxies: std::collections::HashMap<String, ProxyInfo>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct ProxyInfo {
    pub name: String,
    pub r#type: String,
    pub udp: Option<bool>,
    pub xudp: Option<bool>,
    pub history: Option<Vec<DelayHistory>>,
    pub all: Option<Vec<String>>,
    pub now: Option<String>,
    pub alive: Option<bool>,
    pub delay: Option<u64>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct DelayHistory {
    pub time: String,
    pub delay: u64,
}

#[derive(Debug, Deserialize)]
pub struct RulesData {
    pub rules: Vec<RuleInfo>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct RuleInfo {
    pub r#type: String,
    pub payload: String,
    pub proxy: String,
}

#[derive(Debug, Deserialize)]
pub struct ConnectionsData {
    pub download_total: u64,
    pub upload_total: u64,
    pub connections: Option<Vec<ConnectionInfo>>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct ConnectionInfo {
    pub id: String,
    pub metadata: ConnectionMetadata,
    pub upload: u64,
    pub download: u64,
    pub rule: String,
    pub rule_payload: String,
    pub chains: Vec<String>,
    pub start: String,
}

#[derive(Debug, Deserialize, Clone)]
pub struct ConnectionMetadata {
    pub network: Option<String>,
    pub r#type: Option<String>,
    pub source_ip: Option<String>,
    pub destination_ip: Option<String>,
    pub source_port: Option<String>,
    pub destination_port: Option<String>,
    pub host: Option<String>,
    pub dns_mode: Option<String>,
    pub uid: Option<u32>,
    pub process: Option<String>,
    pub process_path: Option<String>,
    pub remote_destination: Option<String>,
    pub sniff_host: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct TrafficData {
    pub up: u64,
    pub down: u64,
}

#[derive(Debug, Deserialize)]
pub struct LogData {
    pub r#type: String,
    pub payload: String,
}
