//
// KUIDList.gs
//
//  Copyright (C) 2004 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "KUID.gs"
include "Soup.gs"


//! A list of KUID objects.
//
// Note:
//     A KUIDList cannot be created with <l gscLangKeyNew  new>.  Instead you must either use
//     Constructors::NewKUIDList() to create a new list or get a list from a method such as
//     Asset::GetDependencyList().
//
// See Also:
//     KUID, Asset::GetDependencyList(), Constructors::NewKUIDList(), ScenarioBehavior::AppendDependencies()
//
final game class KUIDList isclass GSObject
{
	//! Returns the number of KUIDs in this list.
	//
	// Returns:
	//     The number of KUIDs in this list.
	//
	public native int CountKUIDs(void);

	//! Adds the given KUID object to this list.
	//
	// Param:  kuid  KUID to add to this list.  A null value will result in this method not doing
	//               anything.
	//
	// Note:
	//     If this list is locked, than the KUID can't be added so this method will simply return
	//     without doing anything.
	//
	public native void AddKUID(KUID kuid);

	//! Removes the given KUID object from this list.
	//
	// Param:  kuid  KUID to remove from this list.  A null value will result in this method not
	//               doing anything.
	//
	// Note:
	//     If this list is locked, you can't remove a KUID from it and this method will simply return
	//     without having done anything.
	//
	public native void RemoveKUID(KUID kuid);

	//! Determines if the given KUID is present in this list.
	//
	// Param:  kuid  KUID to check for the existence of in this list.
	//
	// Returns:
	//     Returns true if <i kuid> already exists in this list, false otherwise.
	//
	public native bool HasKUID(KUID kuid);

	//! Gets the specified KUID from by its list index number.
	//
	// Param:  index  Index position of the KUID in this list.
	//
	// Returns:
	//     Returns the KUID specified by <i index> if it exists, null otherwise.
	//
	public native KUID GetIndexedKUID(int index);

	//! Initializes this list to be a copy of the given one.
	//
	// Param:  from  Other list to initialize this one with.
	//
	// Note:
	//     To create a new KUIDList, you must use the Constructors::NewKUIDList() method.
	//
	public native void Copy(KUIDList from);

	//! Clears out this list so that it is empty.
	public native void Clear(void);

	//! Determines if this list is locked (i.e. read only).
	//
	// Returns:
	//     Returns true if this list is locked, false otherwise.
	//
	public native bool IsLocked(void);
};


