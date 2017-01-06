//
// Soup.gs
//
//  Copyright (C) 2003 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "KUID.gs"


//! Storage database for property settings.
//
// The soup class is a database of items and is used in various places around %Trainz as a way to
// load and save data.  The most common usage would be in objects based on PropertyObject where
// %Trainz calls the <l PropertyObject::GetProperties()  GetProperties>() and
// <l PropertyObject::SetProperties()  SetProperties>() methods to save and load object information.
//
// All data items in the Soup are identified by the by a tag name.  Items of different types are 
// supported including floating point numbers, integers, strings, KUIDs and even a sub-database
// within the database (effectively allowing for a tree hierarchy of nested Soup databases).
//
// See Also:
//     Asset, KUID, PropertyObject, HTMLPropertyHandler
//
final game class Soup isclass GSObject
{
	//! Gets the amount of tags in this database.
	//
	// Returns:
	//     Returns the amount of tags in this database.  This includes tags of other databases 
	//     contained within this one.
	//
	public native int CountTags(void);

	//! Gets the value of the named tag as a string.
	//
	// Param:  name  Name of the tag to get the value of.
	//
	// Returns:
	//     Returns the value of <i name> as a string.
	//
	public native string GetNamedTag(string name);


  // ============================================================================
  // Name: GetNamedSoup
  // Desc: Gets the sub-soup with the specified name.
  // Parm: name - The name of the sub-soup to retrieve. An exception is thrown
  //       if the name is an empty string.
  // Retn: Soup - The existing sub-soup with the specified name, or an unattached
  //       empty Soup. The returned Soup is locked if this object is locked.
  // ============================================================================
	public native Soup GetNamedSoup(string name);


  // ============================================================================
  // Name: GetNamedSoupAdd
  // Desc: Gets the sub-soup with the specified name, creating it if it does not
  //       already exist. An exception is thrown if this Soup object is locked,
  //       regardless of whether the named sub-soup already exists.
  // Parm: name - The name of the sub-soup to retrieve. An exception is thrown
  //       if the name is an empty string.
  // Retn: Soup - The existing sub-soup with the specified name, or a newly-
  //       created empty sub-soup with the specified name. The returned Soup is
  //       not locked.
  // ============================================================================
	public native Soup GetNamedSoupAdd(string name);
	

	//! Gets the name of the tag in this database for the given index.
	//
	// Param:  index  Index of the tag to get the name of.
	//
	// Returns:
	//     Returns the tag name that corresponds to <i index>.
	//
	public native string GetIndexedTagName(int index);

	//! Gets the index reference value for the named tag in this database.
	//
	// Param:  name  Name of the tag to get the index for.
	//
	// Returns:
	//     Returns the index to the tag specified by <i name>.
	//
	public native int GetIndexForNamedTag(string name);

	//! Gets the value of the named tag in this database as a KUID.
	//
	// Param:  name  Name of the tag to get as a KUID.
	//
	// Returns:
	//     Returns the value of the <i name> tag as a KUID if possible, null otherwise.
	//
	public native KUID GetNamedTagAsKUID(string name);

	//! Gets the value of the named tag in this database as an int.
	//
	// Param:  name  Name of the tag to get as an int.
	//
	// Returns:
	//     Returns the value of the <i name> tag as an int.
	//
	public native int GetNamedTagAsInt(string name);

	//! Gets the value of the named tag in this database as an int.
	//
	// Param:  name          Name of the tag to get as an int.
	// Param:  defaultValue  Default value if <i name> doesn't have one.
	//
	// Returns:
	//     Returns the value of the <i name> tag as an int.
	//
	public native int GetNamedTagAsInt(string name, int defaultValue);

	//! Gets the value of the named tag in this database as a float.
	//
	// Param:  name  Name of the tag to get as a float.
	//
	// Returns:
	//     Returns the value of the <i name> tag as a float.
	//
	public native float GetNamedTagAsFloat(string name);

	//! Gets the value of the named tag in this database as a float.
	//
	// Param:  name  Name of the tag to get as a float.
	//
	// Returns:
	//     Returns the value of the <i name> tag as a float.
	//
	public native float GetNamedTagAsFloat(string name, float defaultValue);

	//! Removes the named tag from this database.
	//
	// Param:  name  Name of the tag to remove.
	//
	public native void RemoveNamedTag(string name);

	//! Sets the named tag in this database to the given string value.
	//
	// Param:  name   Name of the tag to set.
	// Param:  value  String to set the value of the <i name> tag to.
	//
	public native void SetNamedTag(string name, string value);

	//! Sets the named tag in this database to the given float value.
	//
	// Param:  name   Name of the tag to set.
	// Param:  value  The float to set the value of the <i name> tag to.
	//
	public native void SetNamedTag(string name, float value);

	//! Sets the named tag in this database to the given int value.
	//
	// Param:  name   Name of the tag to set.
	// Param:  value  The int to set the <i name> tag to.
	//
	public native void SetNamedTag(string name, int value);

	//! Sets the named tag in this database to the given KUID.
	//
	// Param:  name   Name of the tag to set.
	// Param:  value  KUID value to set <i name> to, may be null.
	//
	public native void SetNamedTag(string name, KUID value);

	//! Sets the named tag to the given bool value.
	//
	// Param:  name   Name of the tag to get the value of.
	// Param:  value  Boolean value to set <i name> to.
	//
	public void SetNamedTag(string name, bool value)
	{
		SetNamedTag(name, (int)value);
	}

	//! Gets the named tag as a bool.
	//
	// Param:  name  Name of the tag to get the value of.
	//
	// Returns:
	//     Returns the value of the <i name> tag as a bool.
	//
	public bool GetNamedTagAsBool(string name)
	{
		return (bool)GetNamedTagAsInt(name);
	}

	//! Gets the named tag as a bool and returns <i defaultValue> if the tag doesn't exist.
	//
	// Param:  name          Name of the tag to get the value of.
	// Param:  defaultValue  Default value to return if the <i name> tag doesn't exist.
	//
	// Returns:
	//     Returns the value of <i name> as a bool if possible, <i defaultValue> otherwise.
	//
	public bool GetNamedTagAsBool(string name, bool defaultValue)
	{
		return (bool)GetNamedTagAsInt(name, (int)defaultValue);
	}

	//! Sets the named tag in this database to the given database.
	//
	// Param:  name   Name of the tag to set.
	// Param:  value  Other database to set the <i name> tag to.
	//
	// Note:
	//     A tag value can also be a database itself.  This allows hierarchical databases to be 
	//     created.
	//
	public native void SetNamedSoup(string name, Soup value);

	//! Initializes this database to be a copy of the given one.
	//
	// Param:  value  Other database to initialize this one with.
	//
	public native void Copy(Soup value);

	//! Clears out this database so it is empty with no tags or data.
	public native void Clear(void);

  // ============================================================================
  // Name: IsLocked
  // Desc: Determines whether this Soup object is locked. Data referenced by a 
  //       locked Soup cannot be modified. It is possible to have multiple Soup 
  //       objects which internally reference the same underlying data store- in 
  //       this situation it is feasible to have one Soup locked, and the other 
  //       not.
  //       It is not possible to unlock a Soup; to modify the original data,
  //       you must request an unlocked Soup from the original source- in some
  //       cases this is impossible as the original source is immutable.
  //       To modify a copy of a locked Soup, use Soup.Copy().
  // Retn: bool - True if this Soup object is locked.
  // ============================================================================
	public native bool IsLocked(void);

  // ============================================================================
  // Name: GetLockedReference
  // Desc: Returns a locked Soup object which refers to the same underlying data
  //       store as this Soup object. If this Soup object is unlocked, a new
  //       locked Soup object is returned. If this Soup object is already locked,
  //       this Soup object is returned.
  //       This function can be used to create a locked reference for passing to
  //       an external system for read-only access. This prevents the external 
  //       system from accidently modifying the Soup data.
  // Retn: Soup - A locked Soup object.
  // ============================================================================
	public native Soup GetLockedReference(void);
	
	
  // ============================================================================
  // Name: AddUniqueNamedSoup
  // Desc: Adds the child soup with a "random" tag name. Equivalent to calling
  //       SetNamedSoup() with a non-specific unique name, such as an 
  //       incrementing index. This function is typically used to implement
  //       efficient unordered array storage in a soup.
  // Parm: value - The child soup to add.
  // ============================================================================
	public native void AddUniqueNamedSoup(Soup value);
	
	
  // ============================================================================
  // Name: Log
  // Desc: Prints the contents of this Soup to the debug log, if enabled. The
  //       output format is version-specific and no attempt should be made to
  //       machine-parse the output. This function is provided for local 
  //       debugging purposes and should not be called from production code.
  // ============================================================================
	public native void Log(void);
	
	
  // ============================================================================
  // Name: AsString
  // Desc: Prints the contents of this Soup to a string.
  // Retn: string - The string equivalent of this Soup. While the return format
  //       is ACS Text, the exact layout may vary from version to version.
  // Note: <http://online.ts2009.com/mediaWiki/index.php5/ACS_Text_Format>
  // ============================================================================
	public native string AsString(void);
};

