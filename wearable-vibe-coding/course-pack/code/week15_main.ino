const int SENSOR_PIN = 34;
const int LED_PIN = 2;
int smooth = 0;

void setup() {
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  int raw = analogRead(SENSOR_PIN);
  smooth = (smooth * 8 + raw * 2) / 10;
  digitalWrite(LED_PIN, smooth > 2200 ? HIGH : LOW);
  delay(30);
}
