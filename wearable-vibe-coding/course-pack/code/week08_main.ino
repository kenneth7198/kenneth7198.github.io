const int BTN_PIN = 12;
const int LED_PIN = 2;

void setup() {
  pinMode(BTN_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  bool pressed = digitalRead(BTN_PIN) == LOW;
  digitalWrite(LED_PIN, pressed ? HIGH : LOW);
  delay(30);
}
