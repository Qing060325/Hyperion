use serde::{Deserialize, Serialize};
use tauri::command;

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemProxyConfig {
    pub enable: bool,
    pub host: String,
    pub port: u16,
}

#[command]
pub fn get_system_proxy() -> Result<SystemProxyConfig, String> {
    // Platform-specific implementation
    #[cfg(target_os = "windows")]
    {
        // TODO: Read from Windows registry
        Ok(SystemProxyConfig {
            enable: false,
            host: "127.0.0.1".to_string(),
            port: 7890,
        })
    }

    #[cfg(target_os = "macos")]
    {
        // TODO: Read from macOS network settings
        Ok(SystemProxyConfig {
            enable: false,
            host: "127.0.0.1".to_string(),
            port: 7890,
        })
    }

    #[cfg(target_os = "linux")]
    {
        // TODO: Read from gsettings/environment
        Ok(SystemProxyConfig {
            enable: false,
            host: "127.0.0.1".to_string(),
            port: 7890,
        })
    }
}

#[command]
pub fn set_system_proxy(config: SystemProxyConfig) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        // TODO: Set Windows registry
        // Internet Settings\ProxyEnable
        // Internet Settings\ProxyServer
    }

    #[cfg(target_os = "macos")]
    {
        // TODO: Use networksetup command
    }

    #[cfg(target_os = "linux")]
    {
        // TODO: Use gsettings or environment variables
    }

    Ok(())
}

#[command]
pub fn clear_system_proxy() -> Result<(), String> {
    set_system_proxy(SystemProxyConfig {
        enable: false,
        host: "127.0.0.1".to_string(),
        port: 7890,
    })
}
