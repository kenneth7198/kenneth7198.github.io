int IN1 = 7;
int IN2 = 6;
void setup() { 
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  Serial.begin(9600); 
} 

void loop() {
   digitalWrite(IN1, HIGH);
   digitalWrite(IN2, LOW);
   delay(3000);
   Serial.println("forward");

   digitalWrite(IN1, LOW);
   digitalWrite(IN2, HIGH);
   delay(3000);
   Serial.println("backward");

   digitalWrite(IN1, LOW);
   digitalWrite(IN2, LOW);
   delay(1000);
   Serial.println("stop");
}
