void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("Week01: ESP32 + Vibe Coding 課程啟動");
  Serial.println("請用 AI 幫你解釋這段程式每一行在做什麼");
}

void loop() {
  static unsigned long last = 0;
  if (millis() - last > 2000) {
    last = millis();
    Serial.println("Hello Wearable Course!");
  }
}
