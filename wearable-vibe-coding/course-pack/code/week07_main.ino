const int SENSOR_PIN = 34;
const int LED_PIN = 2;

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  int v = analogRead(SENSOR_PIN);
  Serial.println(v);
  int blinkDelay = map(v, 0, 4095, 100, 1000);
  digitalWrite(LED_PIN, HIGH);
  delay(blinkDelay / 2);
  digitalWrite(LED_PIN, LOW);
  delay(blinkDelay / 2);
}
