use reqwest::Client;
use serde::Serialize;
use std::{
    path::PathBuf,
    time::{Duration, Instant},
};
use tauri::{AppHandle, Emitter, Manager};
use tokio::{
    fs::{create_dir_all, write, File},
    io::{AsyncReadExt, AsyncWriteExt},
};

use futures_util::{StreamExt, TryFutureExt};

#[derive(Serialize, Clone)]
pub struct ByteProgress {
    pub current: usize,
    pub total: usize,
    pub task_id: String
}

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
pub async fn dl_file(app: tauri::AppHandle, url: String, save_as: String, task_id: String) -> Result<(), String> {
    let cl = Client::new();

    let res = cl
        .get(url)
        .send()
        .await
        .map_err(|_| "Failed to fetch file".to_string())?;

    let total = res.content_length().unwrap_or(0) as usize;

    let mut str = res.bytes_stream();

    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|_| "Failed to get app data dir".to_string())?;

    let dl_path = app_dir.join("downloads");

    let (_, dl_path_l) = check_path(dl_path).await?;

    let path = dl_path_l.join(save_as);

    let mut f = File::create(path)
        .map_err(|_| "Failed to create file")
        .await?;

    let mut curr = 0;

    let mut last_emit = Instant::now();

    let app_clone = app.clone();

    while let Some(byte) = str.next().await {
        let b = byte.map_err(|_| "Failed to read stream")?;

        curr += b.len();
        let _ = f.write_all(&b).await;

        if last_emit.elapsed() >= Duration::from_millis(100) {
            let _ = app_clone.emit(
                "dl_progress",
                ByteProgress {
                    current: curr,
                    total,
                    task_id: task_id.clone()
                },
            );
            last_emit = Instant::now();
        };
    }

    let _ = f.flush().await;

    Ok(())
}
