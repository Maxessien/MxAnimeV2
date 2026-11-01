use futures_util::StreamExt;
use reqwest::{Client, Response};
use serde::Serialize;
use std::{
    collections::HashMap,
    path::PathBuf,
    sync::Arc,
    time::{Duration, Instant},
};
use tauri::{AppHandle, Emitter, Manager};
use tokio::{
    fs::{create_dir_all, File},
    io::AsyncWriteExt,
    sync::RwLock,
    time::sleep,
};

#[derive(Serialize, Clone)]
pub struct ByteProgress {
    pub current: usize,
    pub total: usize,
    pub task_id: String,
    pub title: String,
}

pub struct CancelFlag {
    pub active: bool,
}

pub struct PauseFlag {
    pub active: bool,
}

pub async fn check_path(path: PathBuf) -> Result<(bool, PathBuf), String> {
    if !path.exists() {
        match create_dir_all(&path).await {
            Ok(_) => return Ok((true, path)),
            Err(_) => return Err("Failed to create path".to_string()),
        }
    };
    Ok((false, path))
}

async fn pause_loop(app: &AppHandle, id: &str) {
    let state = app.state::<RwLock<HashMap<String, PauseFlag>>>();
    let hmp = state.read().await;
    let mut is_paused = hmp.get(id).unwrap_or(&PauseFlag { active: false }).active;

    drop(hmp);
    while is_paused {
        let hmp_inner = state.read().await;
        is_paused = hmp_inner
            .get(id)
            .unwrap_or(&PauseFlag { active: false })
            .active;
        drop(hmp_inner);
        sleep(Duration::from_millis(100)).await;
    }
}

pub async fn dl_file_fn(
    app: AppHandle,
    url: String,
    save_as: String,
    task_id: String,
    image_url: Option<String>,
    img_path: Arc<RwLock<Option<PathBuf>>>,
    file_path: &PathBuf,
    app_dir: &PathBuf,
) -> Result<(Option<PathBuf>, Option<PathBuf>), String> {
    let cl = Client::new();

    let res = cl
        .get(url)
        .send()
        .await
        .map_err(|_| "Failed to fetch file".to_string())?;

    let mut img_size = 0;
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
                    let mut img_bytes: Vec<u8> = Vec::new();
                    let mut b_str = response.bytes_stream();
                    let inn_curr = &mut curr;
                    let mut last_img_emit = Instant::now();
                    while let Some(chunk) = b_str.next().await {
                        pause_loop(&app, &task_id).await;
                        if let Ok(ch) = chunk {
                            *inn_curr += ch.len();
                            img_bytes.extend(ch.iter());
                        }
                        if last_img_emit.elapsed() >= Duration::from_millis(500) {
                            let _ = app.emit(
                                "dl_progress",
                                ByteProgress {
                                    current: inn_curr.clone(),
                                    total,
                                    task_id: task_id.clone(),
                                    title: save_as.clone(),
                                },
                            );
                            last_img_emit = Instant::now()
                        }
                    }
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
                    let mut writer = img_path.write().await;
                    *writer = Some(tmp);
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

    let mut last_emit = Instant::now();

    let mut f = File::create(file_path.clone())
        .await
        .map_err(|_| "Failed to create file")?;

    let app_clone = app.clone();

    let state = app.state::<RwLock<HashMap<String, CancelFlag>>>();

    while let Some(byte) = str.next().await {
        pause_loop(&app, &task_id).await;
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

    if curr < total {
        return Err("Incomplete download".to_string());
    };

    let _ = f.flush().await;

    let mut cancel = state.write().await;
    cancel.insert(task_id, CancelFlag { active: false });

    Ok((Some(file_path.clone()), img_path.read().await.clone()))
}
