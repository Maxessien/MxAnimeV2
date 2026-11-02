use std::{env::current_dir, path::PathBuf};

use bsdiff_android::CompressionAlgorithm;
use reqwest::Client;
use tokio::{
    fs::{read, read_dir, File},
    io::AsyncWriteExt,
};

struct Version {
    tag: &'static str,
    file_url: &'static str,
}

static V0_1_0: Version = Version {
    tag: "v0_1_0",
    file_url: "https://github.com/Maxessien/MxAnimeV2/releases/download/v0.1.0/MxAnime_0.1.0.apk",
};

#[tokio::main]
async fn main() {
    let versions = [&V0_1_0];
    let cl = Client::new();
    let curr_dir = current_dir().unwrap();
    let curr_apk_dir = curr_dir.join(PathBuf::from(
        "src-tauri/gen/android/app/build/outputs/apk/universal/release",
    ));

    let mut files = read_dir(curr_apk_dir).await.unwrap();
    let mut apk_path = PathBuf::new();
    while let Ok(entry) = files.next_entry().await {
        if let Some(e) = entry {
            let file = e.file_name().to_string_lossy().into_owned();
            if file.ends_with(".apk") {
                apk_path = e.path();
            }
        }
    }

    for version in versions {
        let res = cl.get(version.file_url).send().await;
        if let Ok(res) = res {
            let bytes = res.bytes().await;
            if let Ok(bytes) = bytes {
                let path = curr_dir.join(format!("{}_patch.bsdf2", version.tag));
                let new = match read(&apk_path).await {
                    Ok(bytes) => bytes,
                    Err(e) => {
                        eprintln!("Failed to read apk: {}", e);
                        continue;
                    }
                };
                let mut diff: Vec<u8> = Vec::new();
                let result = bsdiff_android::diff_bsdf2(
                    &bytes,
                    &new,
                    &mut diff,
                    CompressionAlgorithm::Brotli,
                    CompressionAlgorithm::Brotli,
                    CompressionAlgorithm::Brotli,
                );

                match result {
                    Ok(_) => {
                        if let Ok(mut f) = File::create(&path).await {
                            let _ = f.write(&diff).await;
                        };
                    }
                    Err(e) => eprintln!("Failed to generate patch: {}", e),
                }
            }
        }
    }
}
