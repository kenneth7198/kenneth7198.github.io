#include <BleKeyboard.h>

BleKeyboard bleKeyboard("Wearable-ESP32", "CourseLab", 100);
const int BTN_PIN = 12;

void setup() {
  pinMode(BTN_PIN, INPUT_PULLUP);
  bleKeyboard.begin();
}

void loop() {
  if (bleKeyboard.isConnected() && digitalRead(BTN_PIN) == LOW) {
    bleKeyboard.write(KEY_MEDIA_PLAY_PAUSE);
    delay(600);
  }
}
