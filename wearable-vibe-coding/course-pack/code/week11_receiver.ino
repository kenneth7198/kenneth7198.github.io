#include <esp_now.h>
#include <WiFi.h>

const int LED_PIN = 2;
typedef struct { int trigger; } payload_t;

void onReceive(const uint8_t *mac, const uint8_t *incomingData, int len) {
  payload_t d;
  memcpy(&d, incomingData, sizeof(d));
  if (d.trigger == 1) {
    digitalWrite(LED_PIN, HIGH);
    delay(500);
    digitalWrite(LED_PIN, LOW);
  }
}

void setup() {
  pinMode(LED_PIN, OUTPUT);
  WiFi.mode(WIFI_STA);
  esp_now_init();
  esp_now_register_recv_cb(onReceive);
}

void loop() {}
