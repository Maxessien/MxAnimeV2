use std::{collections::HashMap, io::ErrorKind, path::PathBuf, sync::Arc, time::Duration};
use tauri::{AppHandle, Manager};
use tokio::{
    fs::{self, write, File},
    io::AsyncReadExt,
    sync::RwLock,
    time::sleep,
};

use crate::utils::{check_path, dl_file_fn, CancelFlag, PauseFlag};

static ALLOW_LIST: [&str; 3] = ["downloads.json", "settings.json", "history.json"];

async fn save_json(dir: PathBuf, file_name: &str, json_string: String) -> Result<(), String> {
	if !ALLOW_LIST.contains(&file_name) {return Err("Unauthorised file name".to_string());};
    let (_, p) = check_path(dir).await?;

    let path = p.join(file_name);

        match write(path, json_string).await {
            Ok(_) => (),
            Err(_) => return Err("Failed to write to file".to_string()),
        };

    Ok(())
}

#[tauri::command]
pub async fn save_json_file(file: String, json: String, app: AppHandle) -> Result<String, String> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|_| "Failed to get app data dir".to_string())?;

    save_json(app_dir, &file, json).await?;

    Ok("".to_string())
}

#[tauri::command]
pub async fn get_json_file(app: AppHandle, sub_path: String, default_json: String) -> Result<String, String> {
	if !ALLOW_LIST.contains(&sub_path.as_str()) {return Err("Unauthorised file name".to_string());};
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|_| "Failed to get app data dir".to_string())?;
    let path = app_dir.join(&sub_path);

    if !path.exists() {
        save_json(app_dir, sub_path.as_str(), default_json.clone()).await?;
        Ok(default_json)
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
    let state = app.state::<RwLock<HashMap<String, CancelFlag>>>();
    let mut cancel = state.write().await;

    cancel.insert(id, CancelFlag { active: true });

    Ok(())
}

#[tauri::command]
pub async fn pause_dl(app: AppHandle, id: String, is_paused: bool) -> Result<(), String> {
    let state = app.state::<RwLock<HashMap<String, PauseFlag>>>();

    let mut cancel = state.write().await;

    cancel.insert(id, PauseFlag { active: is_paused });

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
    let app_clone = app.clone();

    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|_| "Failed to get app data dir".to_string())?;

    let dl_path = app_dir.join("downloads");

    let (_, dl_path_l) = check_path(dl_path).await?;

    let path = dl_path_l.join(save_as.clone());

    let path_ref = &path;
    let task_id_clone = task_id.clone();
    let img_path: Arc<RwLock<Option<PathBuf>>> = Arc::new(RwLock::new(None));
    let img_path_clone = img_path.clone();

    tokio::select! {
        _ = async {
            let state = app_clone.state::<RwLock<HashMap<String, CancelFlag>>>();
            let pause_state = app_clone.state::<RwLock<HashMap<String, PauseFlag>>>();
            loop {
                let cancel = state.read().await;
                let val = cancel.get(&task_id_clone);

                if let Some(v) = val {
                    if v.active {
                        drop(cancel);
                        let _ = fs::remove_file(path_ref);
                        if let Some(p) = img_path_clone.read().await.clone() {let _ = fs::remove_file(p.clone());};
                        let mut cancel = state.write().await;
                        let _ = cancel.remove(&task_id_clone);
                        let mut pause = pause_state.write().await;
                        let _ = pause.remove(&task_id_clone);
                        drop(cancel);
                        drop(pause);
                        break;
                    }
                }
                sleep(Duration::from_millis(100)).await;
            }
        } => {Ok((None, None))},

        res = dl_file_fn(app, url, save_as, task_id, image_url, img_path.clone(), &path, &app_dir) => {res}
    }
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
