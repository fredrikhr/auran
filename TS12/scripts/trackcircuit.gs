// ============================================================================
// File: TrackCircuit.gs
// Desc: The TrainzScript file containing the accessors for Track Circuiting.
// ============================================================================
include "Trackside.gs"


// ============================================================================
// Name: TrackCircuitBlock
// Desc: The TrainzScript base class for TrackCircuitBlocks.
// ============================================================================
game class TrackCircuitBlock isclass GameObject
{

  // ==========================================================================
  // Name: IsOccupied()
  // Retn: boolean - true if block is occupied, false if it is available.
  // ==========================================================================
	public native bool IsOccupied(void);
  
};

// ============================================================================
// Name: TrackCircuitDetector
// Desc: The TrainzScript base class for TrackCircuitDetectors.
// ============================================================================
game class TrackCircuitDetector isclass Trackside
{
};