# 硬體接線圖

---

## ESP32-C3 SuperMini 接腳說明

```
             ESP32-C3 SuperMini
          ┌──────────────────────┐
  GND ────┤ GND            5V   ├──── 5V (外部供電)
  3.3V ───┤ 3V3           GND   ├──── GND
  GPIO 4 ─┤ IO4           IO3   ├──── GPIO 3  (PWM/高亮 LED)
  GPIO 5 ─┤ IO5           IO2   ├──── GPIO 2  (WS2812B Data)
  GPIO 6 ─┤ IO6           IO1   ├──── GPIO 1
  GPIO 7 ─┤ IO7           IO0   ├──── GPIO 0
  GPIO 8 ─┤ IO8 (RGB LED) IO10  ├──── GPIO 10
  GPIO 9 ─┤ IO9 (BOOT)    IO20  ├──── GPIO 20 (RX)
          │               IO21  ├──── GPIO 21 (TX)
          └──────────────────────┘
           (板載 USB Type-C)
```

---

## Lab 01 接線：GPIO LED 閃爍

```
ESP32-C3            麵包板
GPIO 2 ─────────── [220Ω] ──── LED+ (長腳/陽極)
GND ────────────────────────── LED- (短腳/陰極)

注意：ESP32-C3 GPIO 輸出 3.3V，使用 220Ω 限流電阻
電流 = (3.3V - 2.0V) / 220Ω ≈ 6mA（一般 LED 安全範圍 5~20mA）
```

---

## Lab 02 接線：高亮度 LED（透過 MOSFET）

```
5V 電源 ──────────────────────── [高亮度 LED 正極]
                                          │
                                  [高亮度 LED 負極]
                                          │
                                   [MOSFET 汲極 D]
                                   [MOSFET 源極 S] ──── GND
                                   [MOSFET 閘極 G]
                                          │
ESP32-C3                          [100Ω 電阻]
GPIO 3 ──── [100Ω] ───────────── MOSFET 閘極 G
GND ─────── [10kΩ] ──── MOSFET 閘極 G (下拉電阻，防止懸空)

注意：
  - IRLZ34N：邏輯電平 MOSFET，可直接用 3.3V 驅動
  - Gate 電阻 100Ω 防止振盪
  - 下拉 10kΩ 確保 GPIO 懸空時 MOSFET 關閉
```

---

## Lab 03 接線：RGB LED（共陰極）

```
ESP32-C3 GPIO 4 ──── [220Ω] ──── RGB LED R 腳（紅）
ESP32-C3 GPIO 5 ──── [220Ω] ──── RGB LED G 腳（綠）
ESP32-C3 GPIO 6 ──── [220Ω] ──── RGB LED B 腳（藍）
GND ──────────────────────────── RGB LED 最長腳（共陰 GND）

RGB LED 四支腳位置（由左到右，平面朝向自己）：
  R  GND  G  B
  |   |   |  |
  1   2   3  4
     (長腳=GND)
```

---

## Lab 04 & 05 接線：WS2812B 燈環 / 燈條

```
USB 5V 電源 ────── [1000μF 電容+] ──── WS2812B VCC (紅線)
GND ─────────────── [1000μF 電容-] ──── WS2812B GND (黑線)

ESP32-C3
GPIO 2 ──── [470Ω] ──── WS2812B DIN (綠/黃/白線)

重要：
  ① 電容要緊鄰 WS2812B 電源端，濾除開機突波
  ② 470Ω 資料線電阻防止長線反射雜訊
  ③ WS2812B 電源和 ESP32-C3 電源「共地」（GND 接在一起）
  ④ 不要用 ESP32-C3 的 3.3V 供 WS2812B，需用 5V

燈條串接：
  DIN → [燈條] → DOUT → [下一燈條] DIN → ...
```

---

## Lab 06~09 接線：最終整合

```
                  ┌─────────────────────────────────────────┐
                  │           ESP32-C3 SuperMini             │
                  │                                          │
5V ─────────────→ 5V                                GND ←──── GND
                  │ IO2 ──[470Ω]──→ WS2812B DIN              │
                  │ IO3 ──[100Ω]──→ MOSFET G (高亮 LED)      │
                  │ IO4 ──[220Ω]──→ RGB-R                     │
                  │ IO5 ──[220Ω]──→ RGB-G                     │
                  │ IO6 ──[220Ω]──→ RGB-B                     │
                  │ IO8 ─ (板載 WS2812B)                      │
                  │ IO9 ─ (板載 BOOT 按鈕，無需接線)           │
                  └─────────────────────────────────────────┘
                  
  USB 電源 ──→ USB（ESP32-C3 用）
  5V 電源  ──→ 麵包板 5V 排（WS2812B 用）
  共同 GND（ESP32-C3 GND ＝ 麵包板 GND ＝ 電源 GND）
```

---

## 常見接線錯誤

| 錯誤 | 症狀 | 解決方法 |
|------|------|----------|
| LED 不亮 | 無任何反應 | 確認 GND 共接、正負極方向 |
| LED 太暗 / 不穩 | 亮度不足或閃爍 | 電流不足，換更大電源 |
| WS2812B 顏色不對 | 顏色混亂 | FastLED 設定 `GRB` 而非 `RGB` |
| WS2812B 第一顆亮其餘不亮 | 只有 1 顆亮 | 資料線斷路或焊點問題 |
| ESP32 燒錄失敗 | `A fatal error occurred` | USB CDC on Boot 未啟用，或換 USB 線 |
| 高亮 LED 不受控 | 一直全亮或全暗 | MOSFET 方向錯誤，確認 G/D/S |
| MCU 重置 / 當機 | 持續重開機 | WS2812B 電流不足導致電壓跌落，分開供電 |

---

## 安全注意事項

```
⚠ GPIO 最大電流：每腳 12mA，建議 5mA 以下
⚠ 高亮 LED 必須用 MOSFET，不可直接接 GPIO
⚠ WS2812B 開機瞬間電流大，務必加裝 1000μF 電容
⚠ 5V 和 3.3V 不要搞混，WS2812B 接 5V，不接 3.3V
⚠ 首次測試先把 FastLED 亮度設低（BRIGHTNESS 50 以下）
```
