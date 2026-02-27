# IoT Cross-Media 手機網頁應用程式

## 專案描述
基於 Web 技術的手機應用程式，使用陀螺儀感測器和位置偵測來實現與 ESP32 NFC 設備的跨媒體互動控制。

## 功能特色

### 🎯 核心功能
- **陀螺儀手勢識別**: 偵測手機螢幕朝下等手勢
- **NFC 接近偵測**: 使用位置服務偵測接近 ESP32 設備
- **MQTT 通訊**: 與 IoT 系統即時通訊
- **跨媒體觸發**: 手勢 + NFC 組合觸發媒體動作

### 📱 技術特點
- **Progressive Web App (PWA)**: 可安裝到手機桌面
- **響應式設計**: 適配各種手機螢幕
- **離線功能**: 支援基本離線操作
- **原生體驗**: 接近原生 App 的使用體驗

## 技術架構

### 前端技術
- **HTML5**: 結構和語義
- **CSS3**: 樣式和動畫
- **JavaScript ES6+**: 邏輯和交互
- **Web APIs**: 
  - DeviceOrientationEvent (陀螺儀)
  - Geolocation API (位置)
  - WebSocket (即時通訊)

### 通訊協議
- **WebSocket**: 與 MQTT Broker 的即時連接
- **MQTT over WebSocket**: IoT 設備通訊
- **JSON**: 資料交換格式

## 檔案結構

```
mobile-webapp/
├── index.html              # 主頁面
├── styles.css              # 樣式表
├── manifest.json           # PWA 配置
├── README.md              # 說明文件
└── js/
    ├── app.js             # 主應用邏輯
    ├── mqtt-client.js     # MQTT WebSocket 客戶端
    ├── gyro-sensor.js     # 陀螺儀感測器管理
    └── nfc-proximity.js   # NFC 接近偵測
```

## MQTT Topic 設計

### 手機陀螺儀事件
```
iot/mobile/{user_id}/gyro/events
```

### NFC 接近事件
```
iot/mobile/{user_id}/nfc/proximity
```

### ESP32 控制命令
```
iot/esp32/{device_id}/nfc/control
```

### 跨媒體觸發
```
iot/crossmedia/trigger/{session_id}
```

## 使用方式

### 1. 部署到 Web 伺服器
```bash
# 將整個 mobile-webapp 資料夾複製到 Web 伺服器
cp -r mobile-webapp/ /var/www/html/iot-gesture/
```

### 2. 在手機瀏覽器中開啟
```
http://your-server.com/iot-gesture/
```

### 3. 安裝為 PWA (可選)
- 在瀏覽器中選擇「加入主畫面」
- 應用程式將出現在手機桌面

### 4. 設定 MQTT 連接
- 點擊「設定」按鈕
- 輸入 MQTT Broker 位址和端口
- 儲存設定

### 5. 啟用感測器
- 點擊「啟用」陀螺儀感測器
- 點擊「啟用」位置偵測
- 允許瀏覽器存取感測器權限

## 操作流程

### 手勢 + NFC 組合觸發
1. **準備階段**:
   - 確保 MQTT 連接正常
   - 啟用陀螺儀和位置偵測
   - 接近已知的 ESP32 NFC 設備

2. **觸發階段**:
   - 將手機螢幕朝下
   - 接近 ESP32 設備（3 米內）
   - 系統自動偵測組合條件

3. **執行階段**:
   - 發送控制命令到 ESP32
   - ESP32 觸發 NFC 讀取
   - 執行對應的跨媒體動作

## 設定說明

### MQTT 設定
- **Broker 位址**: MQTT 伺服器 IP 位址
- **端口**: WebSocket 端口 (預設 8083)
- **用戶 ID**: 唯一用戶識別
- **設備 ID**: 自動生成的設備識別

### 感測器設定
- **手勢靈敏度**: 0.1-1.0，越高越靈敏
- **接近閾值**: ESP32 設備接近距離
- **更新頻率**: 感測器數據更新間隔

## 相容性

### 支援的瀏覽器
- **Chrome/Edge 67+**: 完整支援
- **Firefox 62+**: 完整支援
- **Safari 12+**: 需要用戶授權 DeviceOrientation

### 支援的設備
- **Android 5.0+**: 完整支援
- **iOS 12.2+**: 需要 HTTPS 和用戶授權
- **桌面瀏覽器**: 部分功能（無陀螺儀）

## 開發和除錯

### 本地開發
```bash
# 使用 Python 簡單伺服器
python -m http.server 8000
# 或使用 Node.js
npx serve .
```

### 除錯功能
- **事件歷史**: 查看所有感測器和 MQTT 事件
- **測試按鈕**: 模擬手勢和接近事件
- **控制台日誌**: 詳細的除錯資訊
- **狀態指示器**: 即時顯示服務狀態

### 常見問題
1. **陀螺儀無法啟用**: 檢查瀏覽器權限和 HTTPS
2. **位置偵測失敗**: 確認 GPS 開啟和瀏覽器權限
3. **MQTT 連接失敗**: 檢查網路和伺服器設定
4. **手勢識別不準確**: 調整靈敏度設定

## 部署建議

### 生產環境
- 使用 HTTPS 協定
- 設定適當的 CSP 標頭
- 啟用 gzip 壓縮
- 配置快取策略

### 安全考量
- 驗證 MQTT 訊息來源
- 限制控制命令權限
- 保護敏感設備資訊
- 定期更新憑證

## 擴展功能

### 可能的增強
- **語音控制**: 結合 Web Speech API
- **攝影機辨識**: 使用 WebRTC 和 AI
- **藍牙支援**: 直接與 IoT 設備通訊
- **多用戶協作**: 支援多人同時控制

### 整合選項
- **智慧家居系統**: Home Assistant, OpenHAB
- **雲端服務**: AWS IoT, Google Cloud IoT
- **邊緣運算**: 本地 AI 推理
- **區塊鏈**: 去中心化設備認證
