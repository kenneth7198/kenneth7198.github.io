#include <FastLED.h>
#define NUM_LEDS 60
#define DATA_PIN 6
  
CRGB leds[NUM_LEDS];
  
// This function sets up the ledsand tells the controller about them
void setup() {
    // sanity check delay - allows reprogramming if accidently blowing power w/leds
    delay(2000);
    FastLED.addLeds<WS2812B, DATA_PIN, RGB>(leds, NUM_LEDS);
  
}
  
// This function runs over and over, and is where you do the magic to light
// your leds.
void loop() {
   // Move a single white led 
   for(int whiteLed = 0; whiteLed < NUM_LEDS; whiteLed = whiteLed + 1) {
      // Turn our current led on to white, then show the leds
      leds[whiteLed] = CRGB::White;
  
      // Show the leds (only one of which is set to white, from above)
      FastLED.show();
  
      // Wait a little bit
      delay(100);
  
      // Turn our current led back to black for the next loop around
      leds[whiteLed] = CRGB::Black;
   }
}