const int LED_PIN = 2;

void setup() {
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  // Stable final demo heartbeat effect
  digitalWrite(LED_PIN, HIGH); delay(120);
  digitalWrite(LED_PIN, LOW);  delay(120);
  digitalWrite(LED_PIN, HIGH); delay(120);
  digitalWrite(LED_PIN, LOW);  delay(800);
}
