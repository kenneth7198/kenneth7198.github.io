// Week13: Capstone scaffold
const int LED_PIN = 2;

void setup() {
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(115200);
  Serial.println("Capstone scaffold ready");
}

void loop() {
  // TODO: integrate sensor module
  // TODO: integrate communication module
  // TODO: integrate feedback module
  digitalWrite(LED_PIN, HIGH);
  delay(100);
  digitalWrite(LED_PIN, LOW);
  delay(900);
}
