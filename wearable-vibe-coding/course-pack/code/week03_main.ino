const int LDR_PIN = 34;
const int LED_PIN = 2;
const int THRESHOLD = 500;

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  int lightValue = analogRead(LDR_PIN);
  Serial.println(lightValue);
  digitalWrite(LED_PIN, lightValue < THRESHOLD ? HIGH : LOW);
  delay(200);
}
