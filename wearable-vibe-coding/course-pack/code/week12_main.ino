const int LED_PIN = 2;
const int SENSOR_PIN = 34;

int readSensor() {
  return analogRead(SENSOR_PIN);
}

bool detectEvent(int value) {
  return value > 2500;
}

void renderOutput(bool eventDetected) {
  digitalWrite(LED_PIN, eventDetected ? HIGH : LOW);
}

void setup() {
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  int sensorValue = readSensor();
  bool eventDetected = detectEvent(sensorValue);
  renderOutput(eventDetected);
  delay(50);
}
