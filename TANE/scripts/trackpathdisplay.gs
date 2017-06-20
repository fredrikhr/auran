//=============================================================================
// File: TrackPathDisplay.gs
// Desc: Script interface used to manage TrackPathDisplay objects
//=============================================================================
include "gstracksearch.gs"
include "InterlockingTowerPath.gs"


//=============================================================================
// Name: TrackPathDisplay
// Desc: Used to create a visual representation of a track path or block. Once
//       created the path will be visual in the 3D world and on the minimap.
//       Markers can be added to the path to denote points of interest, if
//       desired.
//       New instances are created via Constructors.NewTrackPathDisplay().
//=============================================================================
final game class TrackPathDisplay isclass GSObject
{

  //=============================================================================
  // Name: InitFromTrackCircuitBlock
  // Desc: Initialises this TrackPathDisplay from a TrackCircuitBlock by name.
  //       This will clear any existing path and points of interest defined on
  //       this object.
  //=============================================================================
  public native bool InitFromTrackCircuitBlock(string name);


  //=============================================================================
  // Name: InitFromSchedule
  // Desc: Initialises this TrackPathDisplay from a train schedule. This will
  //       clear any existing path and points of interest defined on this object.
  //=============================================================================
  public native bool InitFromSchedule(Train train, Schedule schedule);


  //=============================================================================
  // Name: InitFromInterlockingTowerPath
  // Desc: Initialises this TrackPathDisplay from an interlocking tower path.
  //       This will clear any existing path and points of interest defined on
  //       this object.
  //=============================================================================
  public native bool InitFromInterlockingTowerPath(InterlockingTowerPath path);


  //=============================================================================
  // Name: SetDisplaySpline
  // Desc: Sets the spline used to display this track path.
  //=============================================================================
  public native bool SetDisplaySpline(Asset splineAsset);


  //=============================================================================
  // Name: FindAllEndpoints
  // Desc: Locates all enpoints of this path. The search direction at each
  //       endpoint faces into the Path, not out of the Path. Returned array may
  //       be empty if this path is not configured, but will otherwise contain
  //       at least two entries.
  //=============================================================================
  public native GSTrackSearch[] FindAllEndpoints();


  //=============================================================================
  // Name: AddPointOfInterest
  // Desc: Adds a single point of interest marker at the position passed.
  //=============================================================================
  public void AddPointOfInterest(GSTrackSearch position, Asset displayMeshAsset);


  //=============================================================================
  // Name: AddPointsOfInterest
  // Desc: Adds multiple points of interest at the positions passed.
  //=============================================================================
  public native void AddPointsOfInterest(GSTrackSearch[] position, Asset[] displayMeshAsset);


  //=============================================================================
  // Name: ClearPointsOfInterest
  // Desc: Clears all points of interest currently set.
  //=============================================================================
  public native void ClearPointsOfInterest();



  //=============================================================================
  // Name: AddPointOfInterest
  // Desc: Adds a single point of interest marker at the position passed.
  //=============================================================================
  public void AddPointOfInterest(GSTrackSearch position, Asset displayMeshAsset)
  {
    GSTrackSearch[] positionArray;
    Asset[] assetArray;

    positionArray[0] = position;
    assetArray[0] = displayMeshAsset;

    AddPointsOfInterest(positionArray, assetArray);
  }

};


