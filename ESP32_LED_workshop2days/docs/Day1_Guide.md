# 第一天課程指南
## 硬體基礎 × 燈光效果

---

## 課程目標

完成第一天課程後，學員能夠：
1. 獨立設定 Arduino IDE 開發環境並燒錄 ESP32-C3
2. 使用 GPIO 數位輸出控制 LED，並用 `digitalRead()` 讀取實體按鈕
3. 使用 PWM 技術控制 LED 亮度與呼吸效果
4. 透過三個 PWM 通道混合 RGB LED 任意顏色
5. 使用 FastLED 函式庫控制 WS2812B 燈條、燈環、單顆
6. 實作七種動態燈光效果，並以按鈕切換
7. **使用 HC-SR04 超音波感測器，讓距離即時控制 LED 顏色與效果**
8. **完成第一次 BLE 藍牙配對，用手機控制 LED 顏色**

---

## 時程表

| 時段 | 時間 | 主題 | 活動 |
|------|------|------|------|
| 早上 1 | 09:00–09:30 | 開場與環境準備 | 講解 + IDE 安裝 |
| 早上 2 | 09:30–10:20 | Lab 01：GPIO 數位控制 + 按鈕輸入 | 實作 |
| 休息 | 10:20–10:35 | 休息 | — |
| 早上 3 | 10:35–11:15 | Lab 02：PWM 調光 | 實作 |
| 早上 4 | 11:15–12:00 | Lab 03：RGB LED 全彩 | 實作 |
| 午餐 | 12:00–13:00 | 午餐 | — |
| 下午 1 | 13:00–14:00 | Lab 04：WS2812B 基礎 | 實作 |
| 下午 2 | 14:00–15:00 | Lab 05：七種動態效果 | 實作 |
| **下午 3** | **15:00–15:45** | **Lab 05b：HC-SR04 感測器互動** | **實作（揮手控光！）** |
| 休息 | 15:45–16:00 | 休息 | — |
| **下午 4** | **16:00–18:00** | **Lab 06：BLE 藍牙初體驗** | **實作（壓軸）** |

---

## 開場（09:00–09:30）

### ESP32-C3 模組介紹

```
ESP32-C3 核心規格：
  架構：32-bit RISC-V 單核，最高 160 MHz
  記憶體：400KB SRAM，384KB ROM，4MB Flash
  WiFi：802.11 b/g/n 2.4GHz
  藍牙：Bluetooth 5.0（BLE only，無 Classic BT）
  GPIO：22 腳（多功能复用）
  PWM：6 組（LED 控制用）
  介面：UART、I2C、SPI、USB CDC
  供電：3.3V，USB 5V 供電
  特色：體積小、功耗低、WiFi+BLE 雙模
```

### Arduino IDE 設定步驟

1. 下載 Arduino IDE 2.x：https://www.arduino.cc/en/software
2. 檔案 → 偏好設定 → 額外開發板管理員 URL 貼入：
   `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
3. 工具 → 開發板 → 開發板管理員 → 搜尋 `ESP32` → 安裝 3.x 版
4. 工具 → 開發板 → ESP32 Arduino → **ESP32C3 Dev Module**
5. 工具 → USB CDC On Boot → **Enabled**（重要！否則 Serial 不輸出）
6. 工具 → 燒錄速度 → **921600**

### 驗證安裝

```cpp
// 複製此程式，按上傳（→），序列埠監視器應顯示 "Hello ESP32-C3!"
void setup() {
  Serial.begin(115200);
  Serial.println("Hello ESP32-C3!");
}
void loop() {}
```

---

## Lab 01：GPIO 基礎 – LED 閃爍 + 按鈕輸入（09:30–10:20）

### 學習概念

**GPIO 輸出（Output）**
- 每個 GPIO 可設定為輸入（INPUT）或輸出（OUTPUT）
- `HIGH` = 3.3V，`LOW` = 0V
- `pinMode(pin, OUTPUT)` → 設定方向
- `digitalWrite(pin, HIGH/LOW)` → 設定電位

**GPIO 輸入（Input）+ 按鈕防彈跳**
```
digitalRead(pin) → 讀取目前電位（HIGH 或 LOW）

INPUT_PULLUP 模式：
  腳位內建上拉電阻 → 沒按時 = HIGH
  按鈕接腳位到 GND → 按下時 = LOW
  外部只需一顆按鈕，不需下拉電阻！

防彈跳（Debounce）問題：
  機械按鈕彈簧抖動 → 50ms 內可能觸發數十次
  解法：記錄狀態改變時間，超過 25ms 穩定才算真正按下
```

**delay() vs millis() 觀念**
```
❌ delay(500)：在等待期間 CPU 完全停止，按鈕可能被漏掉
✅ millis() 計時：每次 loop() 檢查時間差，不阻塞任何輸入
→ IoT 專案的黃金法則：永遠用 millis()
```

**LED 限流電阻計算**
```
R = (Vcc - Vf) / If = (3.3V - 2.0V) / 0.010A = 130Ω → 使用 220Ω

Vf：LED 正向壓降（紅/黃 ≈ 2.0V，藍/白 ≈ 3.0V）
If：目標電流（5~10mA 即夠亮）
```

### 接線

| 元件 | 接腳 | ESP32 接腳 | 備注 |
|------|------|-----------|------|
| LED 陽極 | LED+ | GPIO 2 | 串 220Ω 電阻 |
| LED 陰極 | LED− | GND | — |
| 按鈕 A 腳 | — | GPIO 7 | INPUT_PULLUP |
| 按鈕 B 腳 | — | GND | — |

參考 `Hardware_Wiring.md` → Lab 01 接線圖

**程式碼**：開啟 `Day1_Foundation/Lab01_Blink/Lab01_Blink.ino`

**挑戰任務**：
- [ ] 雙擊按鈕（< 400ms 連按兩下）改變閃爍速度
- [ ] 長按 2 秒 → 進入快速閃爍模式
- [ ] 序列埠輸入數字（如 '2'）→ 閃爍間隔改為 200ms

---

## Lab 02：PWM 調光 – 高亮度 LED（10:45–12:00）

### 學習概念

**PWM（脈衝寬度調變）**
```
PWM 工作原理：
  訊號週期：20kHz（人眼無法察覺閃爍）
  占空比 0%  → 等效電壓 0V  → LED 全暗
  占空比 50% → 等效電壓 1.65V → LED 半亮
  占空比 100%→ 等效電壓 3.3V → LED 全亮

ESP32-C3 PWM 解析度：8 bit = 256 等級（0~255）
API：analogWrite(pin, value)  // value: 0~255
```

**為何需要 MOSFET**
```
GPIO 最大電流 12mA → 無法直驅 1W LED（需 350mA）
解決方案：GPIO 控制 MOSFET Gate → MOSFET 控制大電流
                               5V ─── LED ─── MOSFET_D
GPIO → MOSFET_G   →  MOSFET_S ─── GND
```

### 程式碼

開啟 `Day1_Foundation/Lab02_PWM_LED/Lab02_PWM_LED.ino`

**挑戰任務**：
- [ ] 調整呼吸速度（步進量與 delay 值）
- [ ] 增加旋鈕（類比輸入 analogRead）手動控制亮度
- [ ] 實作 S 曲線呼吸（用 sin 函數計算亮度）

---

## Lab 03：RGB LED 全彩控制（13:00–14:30）

### 學習概念

**RGB 加法混色**
```
紅 (255, 0, 0)   + 綠 (0, 255, 0)   = 黃 (255, 255, 0)
綠 (0, 255, 0)   + 藍 (0, 0, 255)   = 青 (0, 255, 255)
紅 (255, 0, 0)   + 藍 (0, 0, 255)   = 洋紅 (255, 0, 255)
紅 + 綠 + 藍 (255, 255, 255)        = 白色
全部為 0 (0, 0, 0)                  = 黑色（熄滅）

HSV（色相、飽和度、亮度）→ 更直觀的顏色表示法
色相 (Hue) 0~360：0=紅, 120=綠, 240=藍
```

### 程式碼

開啟 `Day1_Foundation/Lab03_RGB_LED/Lab03_RGB_LED.ino`

**挑戰任務**：
- [ ] 實作顏色漸變：紅→橙→黃→綠→藍→紫→紅（一圈）
- [ ] 將 HSV 轉換成 RGB 顯示（colorWheel 函數）
- [ ] 加入按鈕，每按一次切換到下一個預設顏色

---

## Lab 04：WS2812B 智慧 LED（14:45–16:00）

### 學習概念

**WS2812B 協定原理**
```
WS2812B = 整合了 RGB LED + 控制 IC 的智慧 LED
  - 只需一條資料線（單線串行協定）
  - 每顆 LED 有唯一地址（串接順序即地址）
  - 資料格式：GRB 各 8 bit = 24 bit/顆
  - 串接：DOUT → 下一顆 DIN，最多數百顆
  - 時序：0 碼 ≈ 0.4μs High + 0.8μs Low
           1 碼 ≈ 0.8μs High + 0.4μs Low

ESP32-C3 使用 RMT 外設生成精確時序
```

**FastLED 函式庫關鍵 API**
```cpp
FastLED.addLeds<WS2812B, DATA_PIN, GRB>(leds, NUM_LEDS);
FastLED.setBrightness(64);     // 整體亮度 0~255
FastLED.show();                 // 更新所有 LED 顯示

leds[i] = CRGB::Red;           // 設定第 i 顆顏色（預定義顏色）
leds[i] = CRGB(255, 0, 0);     // 設定第 i 顆顏色（RGB 值）
leds[i].fadeToBlackBy(50);     // 顏色逐步淡出

fill_solid(leds, NUM_LEDS, CRGB::White);           // 全部填充顏色
fill_rainbow(leds, NUM_LEDS, startHue, deltaHue);  // 彩虹填充
FastLED.clear();                                    // 清除全部（全黑）
```

### 程式碼

開啟 `Day1_Foundation/Lab04_WS2812B_Basic/Lab04_WS2812B_Basic.ino`

**挑戰任務**：
- [ ] 燈環顯示「旋轉」效果（只有一顆亮，持續移動）
- [ ] 燈條顯示「彈跳球」效果（光點來回）
- [ ] 讓不同的燈條區段顯示不同顏色

---

## Lab 05：七種動態 LED 效果（16:15–18:00）

### 效果說明

| # | 效果名稱 | 技術重點 |
|---|----------|----------|
| 1 | 彩虹循環 (Rainbow Cycle) | `fill_rainbow` + hue 累加 |
| 2 | 呼吸燈 (Breathing) | `setBrightness` + sin/linear 漸變 |
| 3 | 顏色追逐 (Color Chase) | 逐顆點亮、位置索引遞增 |
| 4 | 隨機閃爍 (Sparkle) | `random8(NUM_LEDS)` + `fadeToBlackBy` |
| 5 | 劇場追逐 (Theater Chase) | 間隔 3 顆交替亮滅 |
| 6 | 火焰模擬 (Fire Simulation) | Heat 陣列 + `HeatColor()` |
| 7 | 流星雨 (Meteor Rain) | 頭亮尾漸暗 + `fadeToBlackBy` |

### 學習重點：效果函式封裝

```cpp
// 好的設計：每個效果是獨立函式，有可調參數
void breathingEffect(CRGB color, uint8_t speed);
void colorChase(CRGB color, uint16_t waitMs);
void sparkleEffect(CRGB color, uint16_t waitMs);

// 主迴圈只需切換效果索引
switch (currentEffect) {
  case 0: rainbowCycle(3); break;
  case 1: breathingEffect(CRGB::Cyan, 2); break;
  // ...
}
```

### 程式碼

開啟 `Day1_Foundation/Lab05_LED_Effects/Lab05_LED_Effects.ino`

**挑戰任務**：
- [ ] 新增第 8 種效果（自由創作）
- [ ] 讓效果在計時器到達時自動輪替
- [ ] 加入效果參數調整（例如：速度、顏色）

---

## Lab 05b：HC-SR04 感測器互動輸入（15:00–15:45）

### 感測器原理

**HC-SR04 超音波距離感測**
```
工作原理：
  ① TRIG 腳發送 10µs 脈衝 → 感測器發出 8 次 40kHz 超音波
  ② 超音波碰到物體反射回來
  ③ ECHO 腳輸出高電位，持續時間 = 超音波來回時間

距離換算：
  距離(cm) = 時間(µs) × 音速(0.034 cm/µs) ÷ 2
  例：time = 1000µs → 距離 = 1000 × 0.034 / 2 = 17 cm

有效範圍：2cm ~ 400cm（最佳 30cm 以內精度高）
```

**⚠ ESP32-C3 電壓注意**
```
HC-SR04 若接 5V：ECHO 腳輸出 5V → 可能損壞 ESP32-C3！

解法 A（推薦）：接 3V3 腳（GPIO 輸出 3.3V 觸發即可）
解法 B：ECHO 接腳加分壓電阻（2kΩ 串聯 + 1kΩ 對地）
```

### 接線

| 元件 | 接腳 | ESP32 接腳 | 備注 |
|------|------|-----------|------|
| HC-SR04 VCC | VCC | 3V3 | ⚠ 接 3.3V，不要接 5V |
| HC-SR04 GND | GND | GND | — |
| HC-SR04 TRIG | TRIG | GPIO 4 | 輸出腳 |
| HC-SR04 ECHO | ECHO | GPIO 5 | 輸入腳（3V3 時安全）|
| WS2812B | DIN | GPIO 2 | 同 Lab04 |
| 外接按鈕 | — | GPIO 7 | INPUT_PULLUP |

### 互動區間設計

```
距離 < 8cm   → 🔴 警示：紅色快速閃爍（太近啦！）
距離 8~25cm  → 🌈 彩虹區：距離直接映射色相
              揮手從 8cm 到 25cm → 顏色從紅變藍！
距離 25~60cm → 💡 亮度區：越靠近越亮（線性映射）
距離 > 60cm  → 🌊 靜待：彩虹循環（偏暗，省電）
無回應 (-1)  → 💨 藍色呼吸燈（無人在場）

按鈕短按 → 截圖（凍結當前顏色）
按鈕長按 → 恢復感測器控制
```

### 程式碼

開啟 `Day1_Foundation/Lab05b_Sensor_Input/Lab05b_Sensor_Input.ino`

**現場示範重點**：
```cpp
// 距離量測核心程式（3行搞定）
digitalWrite(TRIG_PIN, HIGH); delayMicroseconds(10); digitalWrite(TRIG_PIN, LOW);
long duration = pulseIn(ECHO_PIN, HIGH, 25000);  // 最長等 25ms
long dist_cm  = duration * 0.034 / 2;            // 換算距離

// 距離 → 色相映射（8~25cm → 0~255 hue）
uint8_t hue   = map(dist_cm, 8, 25, 0, 255);
CRGB    color = CHSV(hue, 255, 255);             // HSV 轉 RGB
fill_solid(leds, NUM_LEDS, color);
FastLED.show();
```

**挑戰任務**：
- [ ] 「揮手切效果」：距離突然從 >30cm → <10cm = 一次揮手，切換效果
- [ ] 「雷達顯示」：距離 20cm → 亮 10 顆，40cm → 亮 5 顆（距離 = 亮燈數）
- [ ] 結合 RGB LED：感測器同步控制 WS2812B + RGB LED 兩組

---

## 第一天小結

### 知識回顧

```
數位輸出  → digitalWrite → HIGH/LOW 二值控制
數位輸入  → digitalRead  → 按鈕偵測 + millis() 防彈跳
PWM 輸出  → analogWrite  → 0~255 連續控制
RGB 混色  → 3×PWM        → 全彩 16,777,216 種顏色
WS2812B   → FastLED      → 串接多顆，單線控制
燈光效果  → 函式封裝     → 可重用、可組合的效果模組
感測器    → HC-SR04      → 距離 → 顏色/亮度/效果映射
```

### 明天預覽

---

## Lab 06：BLE 藍牙初體驗（16:00–18:00）⭐ 壓軸

### 為什麼今天就要做 BLE？

學員在 Lab01~05b 完成了所有 LED 效果與感測器互動，最後 2 小時立刻讓作品「活起來」——用手機遠端控制是最有成就感的結尾，也讓學員帶著期待回家，迫不及待明天繼續。

### BLE 概念快速介紹（15 分鐘）

```
BLE（Bluetooth Low Energy）藍牙低功耗

角色分工：
  手機（Client）← 連線 → ESP32（Server）

GATT 架構（像資料夾結構）：
  Server
  └── Service（服務，一組相關功能）
      └── Characteristic（特性，實際的數據通道）
          ├── Write   → 手機寫命令給 ESP32
          ├── Read    → 手機讀取 ESP32 狀態
          └── Notify  → ESP32 主動推送給手機

今天只用 Write：手機 → 傳字串 → ESP32 解析執行
```

### 手機 App 安裝（提前請學員準備）

| App | iOS | Android | 費用 |
|-----|-----|---------|------|
| **nRF Connect** | ✅ App Store | ✅ Google Play | 免費 |
| LightBlue | ✅ | ✅ | 免費（備用） |

### nRF Connect 操作步驟圖解

```
Step 1: 打開 nRF Connect          Step 2: 掃描裝置
┌─────────────────────┐           ┌─────────────────────┐
│  nRF Connect        │           │  SCANNER            │
│                     │           │  ○ ESP32-LED-3F8A   │← 你的裝置
│  [SCANNER]  [BONDED]│  → SCAN → │  ○ ESP32-LED-C12E   │
│                     │           │  ○ Unknown Device   │
└─────────────────────┘           └─────────────────────┘

Step 3: 連線成功（ESP32 閃綠燈）   Step 4: 展開 Service
┌─────────────────────┐           ┌─────────────────────┐
│  ESP32-LED-3F8A     │           │  Service 4fafc201.. │
│  Connected ●        │  → 展開 → │  └ Char beb5483e..  │
│                     │           │    Properties:WRITE  │
└─────────────────────┘           └─────────────────────┘

Step 5: 點 ↑ Write
┌─────────────────────┐
│  Write Value        │
│  Format: [UTF-8  ▼] │ ← 選 UTF-8！
│  Value: R:255,G:0,B:0│
│          [SEND]     │
└─────────────────────┘
```

### 程式碼

開啟 `Day1_Foundation/Lab06_BLE_Basic/Lab06_BLE_Basic.ino`

### 今天 BLE 支援的命令

| 命令 | 效果 |
|------|------|
| `ON` | 開燈（白色） |
| `OFF` | 關燈 |
| `R:255,G:0,B:0` | 設顏色（紅） |
| `R:0,G:200,B:255` | 設顏色（青） |
| `BRIGHT:200` | 亮度調高 |
| `BRIGHT:30` | 亮度調低 |

### 常見問題排解

| 問題 | 原因 | 解決 |
|------|------|------|
| 掃描不到裝置 | BLE 廣播未啟動 | 確認序列埠出現「等待手機連線」 |
| 連線後立刻斷開 | 手機距離太遠 | 保持 3 公尺內 |
| 輸入命令沒反應 | 格式選錯 | nRF Connect 格式一定選 **UTF-8** |
| LED 顏色不對 | R/G/B 順序錯誤 | 格式：`R:255,G:0,B:0`（逗號不加空格） |

**挑戰任務**：
- [ ] 試試全部顏色：紅、綠、藍、黃、青、洋紅、白
- [ ] BRIGHT:5 調到最暗，BRIGHT:255 調到最亮
- [ ] 找同學互連：掃描到同學的裝置並連線（觀察名稱差異）

---

## 第一天小結

### 今天完成了什麼

```
Lab01: GPIO      → LED 亮/暗（數位控制）
Lab02: PWM       → 亮度連續變化（類比控制）
Lab03: RGB LED   → 全彩混色 16,777,216 種顏色
Lab04: WS2812B   → 串接多顆智慧 LED
Lab05: 燈光效果  → 7 種動態動畫
Lab06: BLE 藍牙  → 第一次用手機控制！
```

### 明天預覽

```
第二天早上（BLE + 燈效）：
  今天只能控制靜態顏色
  明天把 Lab05 的所有效果接進 BLE
  → 手機一鍵切換彩虹、呼吸、火焰...

第二天下午（WiFi 網頁）：
  Captive Portal → 連 WiFi 自動彈出控制頁面
  WebSocket → 即時雙向，不需重整頁面
  最終整合 → BLE + WiFi + 按鈕 三合一
```
