//
// GSTrackSearch.gs
//
//  Copyright (C) 2004 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "MapObject.gs"


//! Interface class to search a length of track for Trackside items.
//
// The GSTrackSearch class provides an interface to access trackside items along a track in a
// certain direction from an existing source trackside item.  A GSTrackSearch object can be obtained
// by calling the <l Trackside::BeginTrackSearch()  BeginTrackSearch>() method on the Trackside item
// that you want to start your search from.
//
// The SearchNext() and GetMapObject() methods are provided to get a reference to a discovered
// Trackside object.  The reference returned by these methods can be <l gscLangKeyCast cast> to a
// Trackside child classes to find out if that item is in fact a Signal or a Junction for instance.
// As the script code doesn't know what the next item will be, always verify the cast.
//
// See Also:
//     Trackside, Trackside::BeginTrackSearch()
//
final game class GSTrackSearch
{
  //! Moves this search along to the next object and returns it. This function was introduced in
  //  TS2009 in order to support non-MapObject return values. Do not make any assumption about
  //  the range of objects found by this search function - new object types will be added 
  //  regularly. Call the appropriate accessors and use casts to determine if the object is 
  //  useful to you and continue to the next object if it is not.
  //
  // Returns:
  //     Returns TRUE if an object was found, or FALSE if the search has ended.
  //
  public native bool SearchNextObject(void);


  //! Gets the current object that this search is at.
  //
  // Returns:
  //     Returns the current script object that this search is at, null if
  //     the search cursor is not at a script object.
  //
  public native object GetObject(void);
  
  
  //! Moves this search along to the next MapObject and returns it.
  //
  // The SearchNext() method moves the search along to the next MapObject and returns it (if 
  // any).  As this method provides a way to move the search along, it can be thought of as an 
  // iterator to access the next item.
  //
  // The scope of a track search is limited and can only go so far.  Therefore if the end of the
  // line is encountered or there is an obstacle like a junction set against the path of the search,
  // then the search will end.  A null return value indicates the search can't go any further, so 
  // always the returned reference for this.  Level crossings and turntables may also block the 
  // search from going any further.
  //
  // Returns:
  //     Returns the next MapObject if possible, null otherwise.
  //
  public MapObject SearchNext(void)
  {
    MapObject foundMapObject;
    
    while (SearchNextObject())
    {
      foundMapObject = cast<MapObject> GetObject();
      if (foundMapObject != null)
        return foundMapObject;
    }
    
    return null;
  }
  

  //! Gets the current MapObject that this search is at.
  //
  // Returns:
  //     Returns the current MapObject that this search is at, null if the
  //     search cursor is not at a MapObject.
  //
  public MapObject GetMapObject(void)
  {
    return cast<MapObject> GetObject();
  }
  

  //! Gets the distance from the start of this search to the current item.
  //
  // Returns:
  //     Returns the distance in meters along the track from the Trackside item this search was
  //     started from to the current Trackside item.
  //
  public native float GetDistance(void);
  

  //! Gets the direction of the current item relative to the direction of the search.
  //
  // This method indicates the direction of the current Trackside item of this search relative to
  // the direction of the search. It does not indicate the direction of the current item relative to
  // the track's direction or the direction of the Trackside item that the search was started from.
  //
  // Returns:
  //     Returns true if the current Trackside item's orientation is in the same direction of the
  //     search, false otherwise if the item is facing against the search.
  //
  public native bool GetFacingRelativeToSearchDirection(void);
  
  
  //! Gets the Track upon which the search cursor resides.
  //
  // Returns:
  //     The Track, or null if the search is complete.
  //
  public native Track GetTrack(void);
  
  
  //! If the search cursor lies within an attached track, this function will return the
  //  SceneryWithTrack object to which the track is attached.
  //
  // Returns:
  //     Returns the SceneryWithTrack object to which the search cursor's track is attached,
  //     or null.
  //
  public native SceneryWithTrack GetAttachedTrackParentObject(void);
  
  
  //! If the search cursor lies within an attached track, this function will return the
  //  name as per the parent SceneryWithTrack object.
  //
  // Returns:
  //     Returns the attached track name of the search cursor's track, or the empty string.
  //
  public native string GetAttachedTrackName(void);
  
  
  //! Returns a new TrackSearch object which is in an identical state to this TrackSearch.
  //  Further operations performed on this object do not affect the clone, and vice versa.
  //
  // Returns:
  //     A clone of this TrackSearch object.
  //
  public native GSTrackSearch CloneSearch(void);
  
  
	// ============================================================================
  // Name: ReverseDirection
  // Desc: Reverses the current search direction, without changing the position.
  // ============================================================================
  public native void ReverseDirection(void);
};

