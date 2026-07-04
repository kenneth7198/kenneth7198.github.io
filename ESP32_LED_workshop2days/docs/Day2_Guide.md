# 第二天課程指南
## 物聯網連接 × 手機控制 × 整合專案

---

## 課程目標

完成第二天課程後，學員能夠：
1. **（早上）** 在昨天 BLE 基礎上加入效果控制，手機一鍵切換七種燈效
2. 設定 ESP32-C3 為 WiFi 熱點，架設 Captive Portal 讓手機自動彈出控制頁面
3. 使用 WebSocket 實現即時雙向通訊（不需重整頁面）
4. 整合 BLE + WiFi + 實體按鈕三種控制方式於單一裝置

---

## 時程表

| 時段 | 時間 | 主題 | 活動 |
|------|------|------|------|
| 早上 0 | 09:00–09:20 | 昨天回顧 + BLE 進階預告 | 講解 |
| **早上 1** | **09:20–10:45** | **Lab 07：BLE + 七種燈效** | **實作** |
| 休息 | 10:45–11:00 | 休息 | — |
| **早上 2** | **11:00–12:30** | **Lab 07 深化 + 挑戰任務** | **實作** |
| 午餐 | 12:30–13:30 | 午餐 | — |
| 下午 1 | 13:30–14:45 | Lab 08：Captive Portal + WebSocket | 實作 |
| 休息 | 14:45–15:00 | 休息 | — |
| 下午 2 | 15:00–16:45 | Lab 09：最終整合（三合一） | 實作 |
| 下午 3 | 16:45–17:30 | 成果展示 + 課程回顧 | 展示/討論 |

---

## 第一天回顧（09:00–09:20）

```
硬體回顧：
  ✓ GPIO 數位輸出 → LED 開關
  ✓ PWM analogWrite() → 高亮度 LED 調光
  ✓ RGB LED → 三 PWM 混色
  ✓ WS2812B FastLED → 智慧燈條控制
  ✓ 七種燈光效果：彩虹/呼吸/追逐/閃爍/劇場/火焰/流星

今日計畫：
  → 加入無線通訊，手機遠端控制！
```

---

## Lab 07：BLE + 七種燈效控制（09:20–12:30）⭐ 早上重點

### 今天與昨天的差異

昨天（Day1 Lab06）完成了基礎 BLE 連線，今天早上擴充為效果控制：

| 命令 | Day1 Lab06 | Day2 Lab07 |
|------|-----------|-----------|
| `ON` | ✅ 開燈 | ✅ 開燈 |
| `OFF` | ✅ 關燈 | ✅ 關燈 |
| `R:255,G:0,B:0` | ✅ 設顏色 | ✅ 設顏色（自動切靜態效果）|
| `BRIGHT:128` | ✅ 設亮度 | ✅ 設亮度 |
| `EFFECT:0` | ❌ 不支援 | ✅ **新增**：靜態 |
| `EFFECT:1` | ❌ | ✅ **新增**：彩虹 |
| `EFFECT:2` | ❌ | ✅ **新增**：呼吸 |
| `EFFECT:3` | ❌ | ✅ **新增**：追逐 |
| `EFFECT:4` | ❌ | ✅ **新增**：閃爍 |
| `EFFECT:5` | ❌ | ✅ **新增**：火焰 |
| `EFFECT:6` | ❌ | ✅ **新增**：流星 |

### BLE 架構介紹

**Bluetooth Low Energy（低功耗藍牙）**
```
傳統藍牙 vs BLE：
  傳統藍牙 Classic：高頻寬音頻、SPP 串列通訊，功耗較高
  BLE：低功耗、適合感測器和控制，ESP32-C3 僅支援 BLE

GATT 架構（Generic Attribute Profile）：
  Server（ESP32）：提供服務和特性
  Client（手機）：連線並讀寫特性

  Server
  └── Service（服務，UUID 識別）
      └── Characteristic（特性，UUID 識別）
          ├── Properties: READ | WRITE | NOTIFY
          └── Value: 資料內容

UUID 說明：
  128-bit UUID 全域唯一，自行設計時建議用 UUID 產生器
  範例: "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
```

**NimBLE vs Bluedroid**
```
Bluedroid（ESP32 預設）：功能完整但佔記憶體多（~100KB）
NimBLE（推薦）：輕量化（~50KB），對 ESP32-C3 友好，API 簡潔

安裝：工具 → 管理程式庫 → "NimBLE-Arduino" → 安裝
```

### BLE 命令協定設計

```
命令格式（純文字字串）：
  "ON"              → 開燈
  "OFF"             → 關燈
  "R:255,G:0,B:0"  → 設定顏色（RGB 各 0~255）
  "BRIGHT:128"      → 設定亮度（0~255）
  "EFFECT:1"        → 選擇效果（0~6）

回應（Notify）：
  "OK:COLOR:255,0,0"
  "OK:BRIGHT:128"
  "OK:EFFECT:1"
```

### 手機 App 使用說明

**nRF Connect（推薦）**
1. iOS/Android 免費下載 "nRF Connect for Mobile"
2. 打開 APP → Scan → 找到 `ESP32-LED`
3. 點選 Connect
4. 展開服務 `4fafc201...`
5. 找到 Characteristic `beb5483e...`（LED 控制）
6. 點選 ↑（向上箭頭，Write）
7. 選擇 `UTF-8` 輸入模式
8. 輸入命令如 `R:255,G:0,B:0` 並送出

### 程式碼

開啟 `Day2_IoT/Lab06_BLE_Control/Lab06_BLE_Control.ino`

**09:20–10:45 實作目標**：
- 燒錄程式，完成 BLE 連線
- 用 nRF Connect 測試所有 EFFECT:0~6 命令
- 觀察 Notify 欄位收到 ESP32 回傳的 `OK:EFFECT:n` 確認訊息

**11:00–12:30 深化挑戰**：
- [ ] 新增 `SPEED:n` 命令控制效果速度（修改 `effectTick` 間隔門檻）
- [ ] 設計第 8 種效果（自由創作，加進 `runEffect()` switch case）
- [ ] 加入 `STATUS` 命令，讓 ESP32 Notify 回傳目前完整狀態
- [ ] 用 Python（`bleak` 套件）或 Node.js 寫 BLE 控制腳本

---

## Lab 07 附錄：WiFi 網頁伺服器（進度快者自學）

> **本節不在今日主要時程**，供提早完成 BLE 挑戰的學員或課後自學使用。

### WiFi 模式介紹

```
WiFi 三種模式：
  STA（Station）：連接既有 WiFi 路由器（像電腦連 WiFi）
  AP（Access Point）：自己當熱點，其他裝置連進來
  AP+STA：同時作為熱點，也連接到路由器（本 Lab 使用 AP 模式）

本 Lab 使用 AP 模式優點：
  ✓ 不需要預先知道學員的 WiFi 密碼
  ✓ 現場即可使用，零配置
  ✓ 學員手機連到 ESP32 的熱點即可
```

**HTTP 基礎**
```
HTTP GET 請求：
  手機瀏覽器 → http://192.168.4.1/led/color?r=255&g=0&b=0
  ESP32 解析 URL 和參數 → 執行動作 → 回應 "OK"

RESTful 路由設計：
  GET /           → 回傳 HTML 控制頁面
  GET /led/on     → 開燈
  GET /led/off    → 關燈
  GET /led/bright?v=128  → 設定亮度
  GET /led/color?r=255&g=0&b=0  → 設定顏色
  GET /led/effect?n=1    → 選擇效果
```

### 手機操作步驟

```
1. ESP32 開機後，WiFi 熱點 "ESP32-LED" 啟動
2. 手機設定 → WiFi → 連接 "ESP32-LED"（密碼：led12345）
3. 手機瀏覽器開啟 http://192.168.4.1
4. 出現控制介面即可操作
```

### 程式碼

開啟 `Day2_IoT/Lab07_WiFi_WebServer/Lab07_WiFi_WebServer.ino`

**網頁設計重點**：
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<!-- 確保手機自適應顯示 -->

<input type="color" onchange="setColor(this.value)">
<!-- 手機原生顏色選擇器 -->

fetch('/led/color?r=255&g=0&b=0')  // AJAX 非阻塞請求
<!-- 不重整頁面直接發命令 -->
```

**挑戰任務**：
- [ ] 加入色溫調節（暖白/冷白）
- [ ] 加入「定時關燈」功能（JavaScript setTimeout）
- [ ] 記住上次的設定（ESP32 NVS 儲存）

---

## Lab 08：Captive Portal + WebSocket 手機即時控制（13:30–14:30）

### 為何選用此方案

| 方案 | iPhone | Android | 需安裝 App | 需設定 |
|------|--------|---------|-----------|--------|
| **Captive Portal + WS（本 Lab）** | ✅ | ✅ | ❌ 無需 | ❌ 零設定 |
| BLE（Lab 06） | ✅ | ✅ | ✅ nRF Connect | 需配對 |
| MQTT | ✅ | ✅ | ✅ MQTT App | 需 WiFi 帳密 |

### Captive Portal 運作原理

```
手機連上 ESP32 WiFi AP
        ↓
手機 OS 向 DNS 查詢任意網域
        ↓
DNS Server（ESP32）把所有查詢回應為 192.168.4.1
        ↓
手機 OS 偵測到「需要登入此網路」
        ↓
自動彈出瀏覽器，載入 http://192.168.4.1
        ↓
控制頁面建立 WebSocket 連線 (ws://192.168.4.1:81)
        ↓
即時雙向通訊！

各系統偵測方式：
  iOS    → 請求 captive.apple.com  → 內容不符即彈窗
  Android→ 請求 connectivitycheck  → 非 204 即彈窗
  → ESP32 對所有未知路徑回傳 302 redirect → 觸發彈窗
```

### WebSocket vs HTTP 輪詢

```
HTTP 輪詢（Lab 07）：     WebSocket（本 Lab）：
手機 → 發請求 → ESP32    手機 ←→ 保持連線 ←→ ESP32
等待回應                  即時雙向傳輸
每次命令建新連線          一條連線傳所有命令
延遲 100ms+              延遲 < 10ms
```

### WebSocket 命令格式

```json
// 手機 → ESP32（控制命令）
{"cmd":"on"}
{"cmd":"off"}
{"cmd":"color","r":0,"g":200,"b":255}
{"cmd":"bright","v":128}
{"cmd":"effect","n":2}

// ESP32 → 所有手機（廣播狀態）
{"on":true,"r":0,"g":200,"b":255,"bright":128,"effect":2}
```

### 手機操作步驟

```
1. 手機 WiFi 設定 → 選擇 "ESP32-LED"（密碼: led12345）
2. 連上後等待 2~3 秒 → 系統自動彈出「需要登入」通知
3. 點選通知 → 瀏覽器自動開啟控制頁面
4. 若未自動彈出 → 手動開啟瀏覽器輸入 192.168.4.1
5. 頁面左上角 ● 變綠色 = WebSocket 已連線
6. 開始即時控制！
```

### 程式碼

開啟 `Day2_IoT/Lab08_CaptivePortal_WS/Lab08_CaptivePortal_WS.ino`

需安裝：**WebSockets** by Markus Sattler（工具 → 管理程式庫 → 搜尋 WebSockets）

**挑戰任務**：
- [ ] 同時連接兩支手機，觀察狀態廣播同步效果
- [ ] 加入滑動條改變效果速度（WebSocket 傳 `{"cmd":"speed","v":50}`）
- [ ] 加入 mDNS，讓 URL 變成 `http://esp32-led.local`

---

## Lab 09：最終整合專案（14:45–16:45）

### 系統架構

```
                    ┌─────────────────────────────┐
                    │      ESP32-C3 SuperMini       │
                    │                               │
    手機 BLE App  ──┤ BLE GATT Server              │
                    │   ↓ NimBLE Callbacks          │
   手機瀏覽器    ──┤ WiFi AP + HTTP Server        │── WS2812B 燈條/燈環
    192.168.4.1     │   ↓ HTTP GET routes           │── RGB LED
                    │                               │── 高亮度 LED
  GPIO 9 按鈕    ──┤ Boot Button (本地控制)        │
                    │   ↓ ISR or polling            │
                    │                               │
                    │  共享狀態（全域變數）          │
                    │  currentEffect, brightness    │
                    │  ledR, ledG, ledB, ledsOn     │
                    └─────────────────────────────┘
```

### 非阻塞式程式設計

```cpp
// ❌ 錯誤：用 delay() 會卡住 WiFi 和 BLE 處理
void loop() {
  for (int i = 0; i < 255; i++) {
    analogWrite(LED, i);
    delay(10);  // 在此 2.55 秒內 HTTP/BLE 都無法回應
  }
}

// ✅ 正確：用 millis() 計時，非阻塞
unsigned long lastUpdate = 0;
int brightness = 0;

void loop() {
  server.handleClient();  // 每次迴圈都能處理 HTTP 請求
  
  if (millis() - lastUpdate > 10) {
    lastUpdate = millis();
    brightness = (brightness + 1) % 256;
    analogWrite(LED, brightness);
  }
}
```

### 共享狀態管理

```cpp
// 所有控制方式都修改同一套全域狀態變數
// 效果引擎每次 loop 讀取這些變數來渲染 LED

struct LEDState {
  bool on;
  uint8_t r, g, b;
  uint8_t brightness;
  uint8_t effect;
} state = {true, 255, 128, 0, 80, 0};

// BLE callback 修改 state
// HTTP handler 修改 state
// 按鈕中斷修改 state
// LED 效果引擎讀取 state
```

### 按鈕功能設計

```
按一下短按（< 1秒）：切換到下一個效果（0→1→2→...→6→0）
長按（> 3秒）：關燈 / 開燈 切換
雙擊：切回彩虹效果（效果 1）
```

### 程式碼

開啟 `Day2_IoT/Lab09_Final_Project/Lab09_Final_Project.ino`

**挑戰任務**：
- [ ] 加入 OTA（Over-the-Air）無線更新功能
- [ ] 加入 NVS 儲存（斷電記憶上次設定）
- [ ] 連接 PIR 感測器，自動感應人來開燈
- [ ] 用 MQTT 同時控制多台 ESP32（廣播模式）

---

## 成果展示（16:45–17:30）

### 展示項目

每位學員展示自己完成的智慧燈光控制器，示範：
1. 藍牙 BLE 連線並切換效果
2. WiFi 網頁控制顏色和亮度
3. 按鈕本地切換效果

### 課程回顧

```
第一天：硬體 → 軟體 → 效果
  GPIO → PWM → RGB → WS2812B → 七種效果

第二天：單機 → 網路 → 整合
  BLE → WiFi WebServer → MQTT → 三合一

學到的技能：
  ✓ Arduino/ESP32 開發環境
  ✓ LED 硬體驅動原理
  ✓ 動態燈光效果設計
  ✓ BLE GATT 協定
  ✓ HTTP REST API 設計
  ✓ MQTT 物聯網協定
  ✓ 非阻塞式 IoT 程式設計
  ✓ 手機 + 嵌入式系統整合
```

### 延伸學習路徑

```
初級完成後 → 可繼續探索：
  
  硬體進階：
    - 更多傳感器（溫度/光線/聲音）
    - OLED 顯示狀態
    - 電池供電（低功耗設計）
  
  軟體進階：
    - FreeRTOS 多工處理
    - ESP-IDF 原生開發
    - Matter / Zigbee 協定
  
  平台整合：
    - Home Assistant 智慧家庭
    - AWS IoT / Azure IoT
    - Node-RED 流程設計
    - Grafana 數據視覺化
```
