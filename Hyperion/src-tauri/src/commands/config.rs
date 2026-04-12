use crate::clash::client::{ClashConfig, ClashConnection, ClashVersion};
use crate::utils::platform::get_config_dir;
use serde::{Deserialize, Serialize};
use std::fs;
use tauri::command;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct HyperionConfig {
    pub clash: ClashConnection,
    pub theme: String,
    pub language: String,
    pub auto_start: bool,
    pub silent_start: bool,
    pub minimize_to_tray: bool,
}

impl Default for HyperionConfig {
    fn default() -> Self {
        Self {
            clash: ClashConnection::default(),
            theme: "dark".to_string(),
            language: "zh-CN".to_string(),
            auto_start: false,
            silent_start: false,
            minimize_to_tray: true,
        }
    }
}

impl HyperionConfig {
    fn config_path() -> std::path::PathBuf {
        get_config_dir()
            .unwrap_or_default()
            .join("config.json")
    }

    pub fn load() -> Self {
        let path = Self::config_path();
        if path.exists() {
            fs::read_to_string(&path)
                .ok()
                .and_then(|content| serde_json::from_str(&content).ok())
                .unwrap_or_default()
        } else {
            let config = Self::default();
            config.save();
            config
        }
    }

    pub fn save(&self) {
        let path = Self::config_path();
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).ok();
        }
        serde_json::to_string_pretty(self)
            .and_then(|content| fs::write(path, content))
            .ok();
    }
}

#[command]
pub fn get_clash_config() -> Result<HyperionConfig, String> {
    Ok(HyperionConfig::load())
}

#[command]
pub fn set_clash_config(config: HyperionConfig) -> Result<(), String> {
    config.save();
    Ok(())
}

#[command]
pub fn reload_clash_config() -> Result<(), String> {
    // TODO: Signal the frontend to reconnect to Clash API
    Ok(())
}

#[command]
pub fn get_config_path() -> Result<String, String> {
    HyperionConfig::config_path()
        .to_str()
        .map(|s| s.to_string())
        .ok_or("Failed to get config path".to_string())
}
