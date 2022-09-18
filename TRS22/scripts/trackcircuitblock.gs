// ============================================================================
// File: TrackCircuitBlock.gs
// Desc: TrainzScript interface to the Track Circuit Block functionality within
//       Trainz. TCBs are created by placing a uniquely named instace of
//       "kind TrackCircuitDetector" onto a Track. Within Trainz, TCBs are a
//       generic concept of an area of track. TCBs may, but do not have to,
//       correspond with the real-life concept of Track Circuits.
// ============================================================================
include "trackside.gs"


// ============================================================================
// Name: TrackCircuitBlock
// Desc: The TrackCircuitBlock object is created by Trainz and cannot be
//       overridden. This acts as an accessor to the native TCB functionality.
// ============================================================================
final game class TrackCircuitBlock isclass GameObject
{

  // ==========================================================================
  // Name: IsOccupied
  // Desc: Returns whether this block is currently occupied by a Train.
  // Retn: bool - True if block is occupied, false if it is unoccupied.
  // Note: Native code will post a ("TrackCircuit","ChangedState") message to
  //       this TrackCircuitBlock whenever this blocks occupied status changes.
  // ==========================================================================
	public native bool IsOccupied(void);
  
  
  // ==========================================================================
  // Name: GetTCBName
  // Desc: TrackCircuitBlocks are uniquely named. The name is determined from
  //       the "kind TrackCircuitDetector" asset that spawned this block, and
  //       is not localised.
  // Retn: string - The internal unique name of this TrackCircuitBlock.
  // ==========================================================================
  public native string GetTCBName(void);
  
  
  // ==========================================================================
  // Name: GetLocalisedDisplayName
  // Desc: The localised name is determined from the
  //       "kind TrackCircuitDetector" asset that spawned this block, and
  //       is localised. This should be used for display purposes only.
  // Retn: string - The localised display name of this TrackCircuitBlock.
  // ==========================================================================
  public native string GetLocalisedDisplayName(void);
  
  
  // ==========================================================================
  // Name: GetTrackCircuitDetector
  // Desc: Returns the instance of "kind TrackCircuitDetector" which spawned
  //       this block. This can be used by scripts to provide extra parameters
  //       when making custom use of a TCB.
  // Retn: string - The localised display name of this TrackCircuitBlock.
  // ==========================================================================
  public native Trackside GetTrackCircuitDetector(void);
};


