use serde::{Deserialize, Serialize};
use tauri::command;
use tauri::updater::UpdaterExt;

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateInfo {
    pub available: bool,
    pub version: Option<String>,
    pub body: Option<String>,
}

#[command]
async fn check_update(app: tauri::AppHandle) -> Result<UpdateInfo, String> {
    let updater = app.updater().map_err(|e| e.to_string())?;

    match updater.check().await {
        Ok(update) => {
            if update.is_update_available() {
                Ok(UpdateInfo {
                    available: true,
                    version: update.version.clone(),
                    body: update.body.clone(),
                })
            } else {
                Ok(UpdateInfo {
                    available: false,
                    version: None,
                    body: None,
                })
            }
        }
        Err(e) => Err(e.to_string()),
    }
}

#[command]
async fn do_update(app: tauri::AppHandle) -> Result<(), String> {
    let updater = app.updater().map_err(|e| e.to_string())?;

    updater
        .update()
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}
