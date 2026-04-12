use anyhow::Result;
use futures_util::{SinkExt, StreamExt};
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio_tungstenite::connect_async;

use super::client::ClashConnection;

pub type WsCallback = Box<dyn Fn(String) + Send + Sync>;

pub struct ClashWebSocket {
    connection: ClashConnection,
    traffic_tx: Arc<Mutex<Option<WsCallback>>>,
    logs_tx: Arc<Mutex<Option<WsCallback>>>,
    connections_tx: Arc<Mutex<Option<WsCallback>>>,
}

impl ClashWebSocket {
    pub fn new(connection: ClashConnection) -> Self {
        Self {
            connection,
            traffic_tx: Arc::new(Mutex::new(None)),
            logs_tx: Arc::new(Mutex::new(None)),
            connections_tx: Arc::new(Mutex::new(None)),
        }
    }

    pub fn on_traffic(&self, callback: WsCallback) {
        let tx = self.traffic_tx.clone();
        tokio::spawn(async move {
            let mut guard = tx.lock().await;
            *guard = Some(callback);
        });
    }

    pub fn on_logs(&self, callback: WsCallback) {
        let tx = self.logs_tx.clone();
        tokio::spawn(async move {
            let mut guard = tx.lock().await;
            *guard = Some(callback);
        });
    }

    pub fn on_connections(&self, callback: WsCallback) {
        let tx = self.connections_tx.clone();
        tokio::spawn(async move {
            let mut guard = tx.lock().await;
            *guard = Some(callback);
        });
    }

    pub async fn connect_traffic(&self) -> Result<()> {
        let url = self.connection.ws_url("/traffic");
        let (ws_stream, _) = connect_async(&url).await?;
        let (_, read) = ws_stream.split();
        let callback = self.traffic_tx.clone();

        tokio::spawn(async move {
            let mut reader = read;
            while let Some(msg) = reader.next().await {
                if let Ok(text) = msg {
                    if let Some(cb) = callback.lock().await.as_ref() {
                        cb(text.to_string());
                    }
                }
            }
        });
        Ok(())
    }

    pub async fn connect_logs(&self, level: &str) -> Result<()> {
        let mut url = self.connection.ws_url("/logs");
        url = format!("{}&level={}", url, level);
        let (ws_stream, _) = connect_async(&url).await?;
        let (_, read) = ws_stream.split();
        let callback = self.logs_tx.clone();

        tokio::spawn(async move {
            let mut reader = read;
            while let Some(msg) = reader.next().await {
                if let Ok(text) = msg {
                    if let Some(cb) = callback.lock().await.as_ref() {
                        cb(text.to_string());
                    }
                }
            }
        });
        Ok(())
    }

    pub async fn connect_connections(&self) -> Result<()> {
        let url = self.connection.ws_url("/connections");
        let (ws_stream, _) = connect_async(&url).await?;
        let (_, read) = ws_stream.split();
        let callback = self.connections_tx.clone();

        tokio::spawn(async move {
            let mut reader = read;
            while let Some(msg) = reader.next().await {
                if let Ok(text) = msg {
                    if let Some(cb) = callback.lock().await.as_ref() {
                        cb(text.to_string());
                    }
                }
            }
        });
        Ok(())
    }
}
