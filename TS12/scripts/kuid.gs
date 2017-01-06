//
// kuid.gs
//
//  Copyright (C) 2002 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "gs.gs"


//! KUID represents a single Asset (of any type).
//
// A KUID object is not to be confused as an instance of an asset.  For example, a particular
// locomotive could be used several times in a consist.  The locomotives in the consist are
// instances of the same asset and all refer back to the same KUID.
//
// It is possible to refer to a KUID by name.  For example, <n "%Locomotive class F7 - NYC"> may be
// represented as a KUID.
//
// Note:
//     An asset's KUID <bi MUST> be unique.
//
// See Also:
//     Asset, Asset::GetKUID(), Asset::LookupKUIDTable(), GameObject, Soup::GetNamedTagAsKUID(),
//     KUIDList
//
final class KUID isclass GSObject
{
	//! Gets the human-readable name of the asset of this KUID.
	//
	// Returns:
	//     Returns the name of the asset this KUID represents.
	//
	public native string GetName(void);

	//! Gets the encoding of this KUID for use as a parameter in a mini-browser tag.
	//
	// Note:
	//     Do <bi NOT> rely on the format or contents of the returned string, it will change with
	//     future versions of %Trainz.
	//
	// Returns:
	//     Returns this KUID as a string in the format of "<b><tt><KUID:user id:asset number></tt></b>".
	//
	public native string GetHTMLString(void);

	//! Gets a human-readable form of this KUID for use in error logs, etc.
	//
	// Note:
	//     Do <bi NOT> rely on the format or contents of the returned string, it will change with
	//     future versions of %Trainz.
	//
	public native string GetLogString(void);

	//! Gets a human-readable form of this KUID without versioning information.
	//
	// Note:
	//     Do <bi NOT> rely on the format or contents of the returned string, it will change with
	//     future versions of %Trainz.
	//
	public native string GetBaseString(void);

	//! Gets the base KUID for this KUID - without versioning information.
	//
	// Note:
	//     Do <bi NOT> rely on the format or contents of the returned string, it will change with
	//     future versions of %Trainz.
	//
	public native KUID GetBaseKUID(void);
};

