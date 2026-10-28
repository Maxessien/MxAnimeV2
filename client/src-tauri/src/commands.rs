use reqwest::{Client, Response};
use serde::Serialize;
use std::{
    io::ErrorKind,
    path::PathBuf,
    time::{Duration, Instant},
};
use tauri::{AppHandle, Emitter, Manager};
use tokio::{
    fs::{self, create_dir_all, write, File},
    io::{AsyncReadExt, AsyncWriteExt},
    sync::RwLock,
};

use futures_util::{StreamExt, TryFutureExt};

#[derive(Serialize, Clone)]
pub struct ByteProgress {
    pub current: usize,
    pub total: usize,
    pub task_id: String,
    pub title: String,
}

pub struct CancelFlag {
    pub active: bool,
    pub id: String,
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
pub async fn cancel_dl(app: tauri::AppHandle, id: String) -> Result<(), String> {
    let state = app.state::<RwLock<CancelFlag>>();
    let mut cancel = state.write().await;

    *cancel = CancelFlag { active: true, id };

    Ok(())
}

#[tauri::command]
pub async fn dl_file(
    app: tauri::AppHandle,
    url: String,
    save_as: String,
    task_id: String,
    image_url: Option<String>,
) -> Result<(Option<PathBuf>, Option<PathBuf>), String> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|_| "Failed to get app data dir".to_string())?;

    let cl = Client::new();

    let res = cl
        .get(url)
        .send()
        .await
        .map_err(|_| "Failed to fetch file".to_string())?;

    let mut img_size = 0;
    let mut img_path: Option<PathBuf> = None;
    let mut base_path = None;
    let mut image_res: Option<Response> = None;

    if let Some(image_url) = &image_url {
        image_res = cl.get(image_url).send().await.ok();
        img_size = match &image_res {
            Some(val) => val.content_length().unwrap_or(0),
            None => 0,
        };
        base_path = check_path(app_dir.join("images"))
            .await
            .map(|(_, p)| Some(p))
            .unwrap_or(None);
    }

    let mut curr = 0;
    let total = (res.content_length().unwrap_or(0) + img_size) as usize;

    let _ = app.emit(
        "dl_progress",
        ByteProgress {
            current: curr,
            total,
            task_id: task_id.clone(),
            title: save_as.clone(),
        },
    );

    (async || {
        if let Some(response) = image_res {
            if let Some(path) = &base_path {
                if img_size < (20 * 1024 * 1024) {
                    let img_bytes = match response.bytes().await {
                        Ok(b) => {
                            let itm: Vec<u8> = b.iter().as_slice().to_vec();
                            itm
                        }
                        Err(_) => {
                            return;
                        }
                    };
                    let ext = match infer::get(&img_bytes) {
                        Some(e) => e.extension(),
                        None => {
                            return;
                        }
                    };
                    let mut tmp = path.join(save_as.clone());
                    tmp.set_extension(ext);
                    let mut file = match File::create(&tmp).await {
                        Ok(f) => f,
                        Err(_) => {
                            return;
                        }
                    };
                    let inn_curr = &mut curr;
                    *inn_curr += img_bytes.len();
                    let _ = match file.write_all(&img_bytes).await {
                        Ok(_) => (),
                        Err(_) => {
                            return;
                        }
                    };
                    let _ = match file.flush().await {
                        Ok(_) => (),
                        Err(_) => {
                            return;
                        }
                    };
                    img_path = Some(tmp);
                    let _ = app.emit(
                        "dl_progress",
                        ByteProgress {
                            current: inn_curr.clone(),
                            total,
                            task_id: task_id.clone(),
                            title: save_as.clone(),
                        },
                    );
                }
            }
        }
    })()
    .await;

    let mut str = res.bytes_stream();

    let dl_path = app_dir.join("downloads");

    let (_, dl_path_l) = check_path(dl_path).await?;

    let path = dl_path_l.join(save_as.clone());

    let mut f = File::create(path.clone())
        .map_err(|_| "Failed to create file")
        .await?;

    let mut last_emit = Instant::now();

    let app_clone = app.clone();

    let state = app.state::<RwLock<CancelFlag>>();
    let mut broke_early = false;

    tokio::select! {
        _ = async {
            loop {
                let cancel = state.read().await;

                if cancel.active && cancel.id == task_id {
                    broke_early = true;
                    break;
                }

                drop(cancel);
            }
        } => {},

        _= async {
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
                            task_id: task_id.clone(),
                            title: save_as.clone(),
                        },
                    );
                    last_emit = Instant::now();
                }
            }
            Ok::<(), &str>(())
        } => {}
    }

    let mut cancel = state.write().await;
    *cancel = CancelFlag {
        active: false,
        id: String::new(),
    };

    if broke_early {
        drop(f);
        let _ = fs::remove_file(path);
        return Ok((None, img_path));
    }

    let _ = f.flush().await;

    Ok((Some(path), img_path))
}

#[tauri::command]
pub async fn save_to_downloads(
    app: tauri::AppHandle,
    file_path: String,
    save_as: String,
) -> Result<(), String> {
    let from = PathBuf::from(file_path);

    if !from.exists() {
        return Err("File not found".to_string());
    };

    #[cfg(not(target_os = "android"))]
    let to = app.path().download_dir().map_err(|err| {
        dbg!(&err);
        "Failed to save to downloads".to_string()
    })?;

    #[cfg(target_os = "android")]
    let to = PathBuf::from("/storage/emulated/0/Download");

    if !to.exists() {
        return Err("Downloads dir not found".to_string());
    }

    let _ = fs::copy(from, to.join(save_as)).await.map_err(|err| {
        dbg!(&err);
        match err.kind() {
            ErrorKind::FileTooLarge => "File too large".to_string(),
            ErrorKind::StorageFull => "Storage full".to_string(),
            _ => "Failed to save to downloads".to_string(),
        }
    })?;

    Ok(())
}

#[tauri::command]
pub async fn delete_file(app: tauri::AppHandle, path: String) -> Result<(), String> {
    let p = PathBuf::from(path);
    let allowed = app
        .path()
        .app_data_dir()
        .map_err(|e| {
            dbg!(&e);
            "Failed to get downloads directory".to_string()
        })?
        .join("downloads");

    if p.is_dir() {
        return Err("Cannot delete directory".to_string());
    }

    if p.parent()
        .ok_or("Invalid parent dir".to_string())?
        .to_owned()
        != allowed
    {
        return Err("Cannot delete file outside downloads directory".to_string());
    }

    let _ = fs::remove_file(p).await.map_err(|e| {
        dbg!(&e);
        match e.kind() {
            ErrorKind::NotFound => "File not found".to_string(),
            _ => "Failed to delete file".to_string(),
        }
    })?;

    Ok(())
}
