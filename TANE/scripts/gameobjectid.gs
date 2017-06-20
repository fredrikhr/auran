//=============================================================================
// File: GameObjectID.gs
// Desc: 
//=============================================================================


// TODO: move this into its own file.
//! A generic empty parent class.
//
// The GSObject class is an empty class with no methods or data members.  It is used as a generic
// parent class so that a variety of other classes can all be used as parameters to a function.
//
// Any child class of the classes listed above can also be considered a GSObject.  When accessing a
// GSObject from a parameter, be sure to cast the object to the class you want to use and then
// verify that cast object before use.
//
// Currently there is only one major usage of GSObject in the %Trainz API and that is as a generic 
// object parameter array for the Library::LibraryCall() method.
//
// See Also:
//     Library::LibraryCall()
//
class GSObject
{
  
  public native string GetGSClassName(void);
};


//=============================================================================
// Name: GameObjectID
// Desc: A unique identifier for a specific game script object. This ID is
//       persistant across game instances and suitable to be saved/loaded
//       within GetProperties/SetProperties.
//       For examples of how/where this is used, see AsyncObjectSearchResult,
//       World.GetNamedObjectList(), and World.GetGameObjectByID().
//=============================================================================
final game class GameObjectID isclass GSObject
{

  //=============================================================================
  // Name: DoesMatch
  // Desc: Returns whether this GameObjectID matches the ID passed. GameObjectIDs
  //       MUST be equality tested using this function. Testing using standard
  //       operators ('==' and '!=') will not work.
  //=============================================================================
  public native bool DoesMatch(GameObjectID otherID);


  //=============================================================================
  // Name: DoesMatch
  // Desc: Returns whether this GameObjectID matches the object passed.
  // Parm: otherObject - The object to test. This must be a GameObject.
  // Retn: bool - True if the specified GameObject matches this GameObjectID, or
  //       false if it does not match. False if the specified GameObject is null.
  //=============================================================================
  public native bool DoesMatch(GSObject otherObject);


  //=============================================================================
  // Name: GetDebugString
  // Desc: Returns a string describing the contents of this ID, for use in debug
  //       logs. The format of this string is not guaranteed, do not attempt to
  //       machine parse it.
  //=============================================================================
  public native string GetDebugString(void);


  //=============================================================================
  // Name: SerialiseToString
  // Desc: Returns a machine-readable string representing this GameObjectID, and
  //       parseable by Router.SerialiseGameObjectIDFromString(). This allows a
  //       GameObjectID to be temporarily stored in a html link or similar.
  //=============================================================================
  public native string SerialiseToString(void);

  
};

