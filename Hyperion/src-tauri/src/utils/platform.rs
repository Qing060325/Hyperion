use anyhow::Result;

/// Get the platform-specific config directory for Hyperion
pub fn get_config_dir() -> Result<std::path::PathBuf> {
    let config_dir = dirs::config_dir()
        .unwrap_or_else(|| std::path::PathBuf::from("."))
        .join("Hyperion");
    std::fs::create_dir_all(&config_dir)?;
    Ok(config_dir)
}

/// Get the platform-specific data directory for Hyperion
pub fn get_data_dir() -> Result<std::path::PathBuf> {
    let data_dir = dirs::data_dir()
        .unwrap_or_else(|| std::path::PathBuf::from("."))
        .join("Hyperion");
    std::fs::create_dir_all(&data_dir)?;
    Ok(data_dir)
}

/// Get the current platform name
pub fn get_platform() -> &'static str {
    #[cfg(target_os = "windows")]
    {
        "windows"
    }
    #[cfg(target_os = "macos")]
    {
        "macos"
    }
    #[cfg(target_os = "linux")]
    {
        "linux"
    }
    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    {
        "unknown"
    }
}
