use serde::{Deserialize, Serialize};
use std::time::Duration;

#[derive(Serialize, Deserialize)]
struct ChatMessage {
    role: String,
    content: String,
}

#[derive(Serialize)]
struct ChatRequest {
    model: String,
    messages: Vec<ChatMessage>,
    max_tokens: u32,
}

#[derive(Deserialize)]
struct ChatChoice {
    message: ChatMessage,
}

#[derive(Deserialize)]
struct ChatResponse {
    choices: Vec<ChatChoice>,
}

/// Send a single-turn completion to an OpenAI-compatible endpoint.
/// `system_prompt` controls the LLM's behaviour for the specific field being rephrased.
#[tauri::command]
async fn rephrase(
    prompt: String,
    base_url: String,
    model: String,
    system_prompt: String,
) -> Result<String, String> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(30))
        .build()
        .map_err(|e| e.to_string())?;

    let body = ChatRequest {
        model,
        messages: vec![
            ChatMessage { role: "system".into(), content: system_prompt },
            ChatMessage { role: "user".into(), content: prompt },
        ],
        max_tokens: 300,
    };

    let response = client
        .post(&base_url)
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .error_for_status()
        .map_err(|e| {
            format!(
                "LM Studio returned HTTP {}",
                e.status().map_or("error".to_string(), |s| s.to_string())
            )
        })?;

    let chat: ChatResponse = response.json().await.map_err(|e| e.to_string())?;

    chat.choices
        .into_iter()
        .next()
        .map(|c| c.message.content)
        .ok_or_else(|| "No response from LM Studio".into())
}

/// Fetch available model IDs from the LM Studio /v1/models endpoint.
#[tauri::command]
async fn list_models(base_url: String) -> Result<Vec<String>, String> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(5))
        .build()
        .map_err(|e| e.to_string())?;

    let mut parsed = reqwest::Url::parse(&base_url).map_err(|e| e.to_string())?;
    parsed.set_path("/v1/models");
    parsed.set_query(None);

    #[derive(Deserialize)]
    struct ModelEntry {
        id: String,
    }
    #[derive(Deserialize)]
    struct ModelsResponse {
        data: Vec<ModelEntry>,
    }

    let resp: ModelsResponse = client
        .get(parsed)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .error_for_status()
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;

    Ok(resp.data.into_iter().map(|m| m.id).collect())
}

/// Ping the LM Studio models endpoint to check connectivity.
/// Derives the /v1/models URL from the stored chat completions URL.
/// Returns Ok(()) if reachable, Err(reason) if not.
#[tauri::command]
async fn ping_lm(base_url: String) -> Result<(), String> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(3))
        .build()
        .map_err(|e| e.to_string())?;

    // Derive the /v1/models URL from the stored chat-completions URL.
    // Strategy: keep only scheme + host + port, then append /v1/models.
    let mut parsed = reqwest::Url::parse(&base_url).map_err(|e| e.to_string())?;
    parsed.set_path("/v1/models");
    parsed.set_query(None);
    let models_url = parsed.to_string();

    client
        .get(&models_url)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![rephrase, ping_lm, list_models])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
