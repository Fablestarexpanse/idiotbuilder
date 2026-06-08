use serde::{Deserialize, Serialize};

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

#[tauri::command]
async fn rephrase(prompt: String, base_url: String, model: String) -> Result<String, String> {
    let client = reqwest::Client::new();

    let system = "You are a creative writing assistant for AI image generation prompts. \
                  Rephrase the given text to be more vivid, evocative, and specific. \
                  Keep it concise (1-3 sentences). Return only the rephrased text, no preamble.";

    let body = ChatRequest {
        model,
        messages: vec![
            ChatMessage { role: "system".into(), content: system.into() },
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
        .map_err(|e| format!("LM Studio returned HTTP {}", e.status().map_or("error".to_string(), |s| s.to_string())))?;

    let chat: ChatResponse = response.json().await.map_err(|e| e.to_string())?;

    chat.choices
        .into_iter()
        .next()
        .map(|c| c.message.content)
        .ok_or_else(|| "No response from LM Studio".into())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![rephrase])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
