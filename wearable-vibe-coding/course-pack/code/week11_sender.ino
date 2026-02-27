#include <esp_now.h>
#include <WiFi.h>

typedef struct { int trigger; } payload_t;
payload_t data;
uint8_t peer[] = {0x24,0x6F,0x28,0xAA,0xBB,0xCC};

void setup() {
  WiFi.mode(WIFI_STA);
  esp_now_init();
  esp_now_peer_info_t p = {};
  memcpy(p.peer_addr, peer, 6);
  p.channel = 0; p.encrypt = false;
  esp_now_add_peer(&p);
}

void loop() {
  data.trigger = 1;
  esp_now_send(peer, (uint8_t *)&data, sizeof(data));
  delay(1000);
}
