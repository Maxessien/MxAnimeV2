use reqwest::Client;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use tokio::{
    fs::{File, create_dir_all, write},
    io::{AsyncReadExt, AsyncWriteExt},
};

use futures_util::{StreamExt, TryFutureExt}; 

async fn check_path(path: PathBuf) -> Result<(bool, PathBuf), String> {
    if !path.exists() {
        match create_dir_all(&path).await {
            Ok(_) => return Ok((true, path)),
            Err(_) => return Err("Failed to create path".to_string()),
        }
    };
    Ok((false, path))
}

async fn save_json(dir: PathBuf, file_name: &str, json_string: String) -> Result<(), String> {
    let (was_created, p) = check_path(dir).await?;

    let path = p.join(file_name);

    if was_created {
        match write(path, "[]").await {
            Ok(_) => (),
            Err(_) => return Err("Failed to write to file".to_string()),
        };
    } else {
        match write(path, json_string).await {
            Ok(_) => (),
            Err(_) => return Err("Failed to write to file".to_string()),
        };
    };
    Ok(())
}

#[tauri::command]
pub async fn save_watch_history(history: String, app: AppHandle) -> Result<String, String> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|_| "Failed to get app data dir".to_string())?;

    save_json(app_dir, "history.json", history).await?;

    Ok("".to_string())
}

#[tauri::command]
pub async fn save_dl_history(downloads: String, app: AppHandle) -> Result<String, String> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|_| "Failed to get app data dir".to_string())?;

    save_json(app_dir, "downloads.json", downloads).await?;

    Ok("".to_string())
}

#[tauri::command]
pub async fn get_json_file(app: AppHandle, sub_path: String) -> Result<String, String> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|_| "Failed to get app data dir".to_string())?;
    let path = app_dir.join(&sub_path);

    if !path.exists() {
        save_json(app_dir, sub_path.as_str(), "[]".to_string()).await?;
        Ok("[]".to_string())
    } else {
        let mut f = String::new();
        let mut file = File::open(path)
            .await
            .map_err(|_| "Failed to open file".to_string())?;

        file.read_to_string(&mut f)
            .await
            .map_err(|_| "Failed to read file")?;

        Ok(f)
    }
}

#[tauri::command]
pub async fn dl_file(app: tauri::AppHandle, url: String, save_as: String) -> Result<(), String> {
    let cl = Client::new();

    let res = cl
        .get(url)
        .send()
        .await
        .map_err(|_| "Failed to fetch file".to_string())?;

    let mut  str = res.bytes_stream();

    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|_| "Failed to get app data dir".to_string())?;

    let path =app_dir.join(format!("downloads/{}", save_as));

    let mut f = File::create(path).map_err(|_| "Failed to create file").await?;

    while let Some(byte) = str.next().await {
        let b = byte.map_err(|_| "Failed to read stream")?;
        let _ = f.write_all(&b).await;
    };

    let _ = f.flush().await;
    
    Ok(())
}
