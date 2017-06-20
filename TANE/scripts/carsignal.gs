// ============================================================================
// File: CarSignal.gs
// Desc: A signal object which controls the movement of Carz on roads. These 
//       objects are responsible for visualising signal state and acting as a 
//       control marker for the Carz.
// ============================================================================

include "trackside.gs"


game class CarSignal isclass Trackside
{
	public define int CARSIGNAL_OFF = 0;        // All lights are out; cars ignore signal.
	public define int CARSIGNAL_FAILED = 1;     // Lights are flashing; signal is uncontrolled; cars cross at caution.
	public define int CARSIGNAL_RED = 2;        // Cars stop.
	public define int CARSIGNAL_AMBER = 3;      // Cars stop if not too close or fast.
	public define int CARSIGNAL_GREEN = 4;      // Cars go.
	public define int CARSIGNAL_PREGREEN = 5;   // Cars slow or stay stopped.
  
  
  // ============================================================================
  // Name: SetCarSignalState
  // Desc: Set this CarSignal to the specified state. This function does nothing
  //       on Multiplayer Clients as signal state is replicated from the Game
  //       Server.
  // ============================================================================
	public native void SetCarSignalState(int state);
  
  
  // ============================================================================
  // Name: SetCarSignalState
  // Desc: Return the current state of this CarSignal. Be careful not to confuse
  //       this function with Trackside.GetSignalState() which relates to Train
  //       signalling.
  // ============================================================================
	public native int GetCarSignalState(void);
  
  
  // ============================================================================
  // Name: UpdateSignalGraphics
  // Desc: Called by the game code to update this CarSignal object's visuals
  //       after a state change. Note that this function may only be called once
  //       the CarSignal object is to be visible to the local player. It is
  //       imperative that this function performs any visual updates in a 
  //       straightforward fashion and does not attempt to implement any custom
  //       signalling logic or etc. Script code must never call this function.
  // ============================================================================
  void UpdateSignalGraphics(void)
  {
    // To be overridden.
  }
};

