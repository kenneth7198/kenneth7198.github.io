#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "YOUR_WIFI";
const char* pass = "YOUR_PASS";
const char* webhook = "https://maker.ifttt.com/trigger/YOUR_EVENT/with/key/YOUR_KEY";
const int BTN_PIN = 14;

void setup() {
  pinMode(BTN_PIN, INPUT_PULLUP);
  WiFi.begin(ssid, pass);
  while (WiFi.status() != WL_CONNECTED) delay(300);
}

void loop() {
  if (digitalRead(BTN_PIN) == LOW && WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(webhook);
    http.GET();
    http.end();
    delay(2000);
  }
}
