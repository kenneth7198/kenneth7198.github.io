#include <Adafruit_NeoPixel.h>

const int PIXEL_PIN = 4;
const int VIB_PIN = 5;
Adafruit_NeoPixel strip(8, PIXEL_PIN, NEO_GRB + NEO_KHZ800);

void setup() {
  pinMode(VIB_PIN, OUTPUT);
  strip.begin();
  strip.show();
}

void loop() {
  bool trigger = millis() % 3000 < 700;
  uint32_t color = trigger ? strip.Color(255, 0, 0) : strip.Color(0, 0, 80);
  for (int i = 0; i < strip.numPixels(); i++) strip.setPixelColor(i, color);
  strip.show();
  digitalWrite(VIB_PIN, trigger ? HIGH : LOW);
  delay(80);
}
