// ============================================================================
// File: Soup.gs
// Desc: 
// ============================================================================
include "KUID.gs"
include "GameObjectID.gs"


// ============================================================================
// Name: Soup
// Desc: The Soup class is used throughout Trainz script to store, save and
//       load miscellaneous data. Each entry in the Soup is identified by a
//       unique string 'tag name'. Supported data types include numbers, text
//       KUIDs and nested Soups. It is up to the caller to know the data type
//       for a specific tag.
//       Passing a null or empty tag name to any Soup function will generate
//       a script exception.
//       Soup structures may be locked and not allow editing in certain uses.
//       Attempts to edit locked a Soup will generate script exceptions.
// ============================================================================
final game class Soup isclass GSObject
{

  // ============================================================================
  // Name: CountTags
  // Desc: Returns the number of tags in this Soup.
  // ============================================================================
  public native int CountTags(void);

  // ============================================================================
  // Name: GetIndexedTagName
  // Desc: Gets the name of the tag in this database for the given index.
  // ============================================================================
  public native string GetIndexedTagName(int index);

  // ============================================================================
  // Name: GetIndexForNamedTag
  // Desc: Gets the index of a specific tag in this database. Returns -1 if the
  //       tag name does not exist.
  // =============================================================================
  public native int GetIndexForNamedTag(string name);


  // ============================================================================
  // Name: GetNamedTag
  // Desc: Gets the value of the named tag as a string.
  // Parm: name - The name of the tag to retrieve.
  // ============================================================================
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
  //       created empty sub-soup with the specified name.
  // ============================================================================
  public native Soup GetNamedSoupAdd(string name);


  // ============================================================================
  // Name: GetNamedTagAsKUID
  // Desc: Gets the value of the named tag in this database as a KUID.
  // Retn: KUID - The KUID value for the specified name, or null if no such tag
  //       exists or it is not a valid KUID.
  // ============================================================================
  public native KUID GetNamedTagAsKUID(string name);


  // ============================================================================
  // Name: GetNamedTagAsGameObjectID
  // Desc: Gets the value of the named tag in this database as a GameObjectID.
  // Retn: GameObjectID - The GameObjectID value for the specified name, or null
  //        if no such tag exists or it is not a valid GameObjectID.
  // ============================================================================
  public native GameObjectID GetNamedTagAsGameObjectID(string name);


  // ============================================================================
  // Name: GetNamedTagAsInt
  // Desc: Gets the value of the named tag in this database as an int.
  // Parm: name - The name of the tag to retrieve.
  // Parm: defaultValue (optional) - The value to return if the tag does not
  //       exist, or is not an integer type.
  // ============================================================================
  public native int GetNamedTagAsInt(string name, int defaultValue);
  public int GetNamedTagAsInt(string name) { return GetNamedTagAsInt(name, 0); }


  // ============================================================================
  // Name: GetNamedTagAsFloat
  // Desc: Gets the value of the named tag in this database as a float.
  // Parm: name - The name of the tag to retrieve.
  // Parm: defaultValue (optional) - The value to return if the tag does not
  //       exist, or is not a float type.
  // ============================================================================
  public native float GetNamedTagAsFloat(string name, float defaultValue);
  public float GetNamedTagAsFloat(string name) { return GetNamedTagAsFloat(name, 0); }


  // ============================================================================
  // Name: GetNamedTagAsBool
  // Desc: Gets the value of the named tag in this database as a bool.
  // ============================================================================
  public bool GetNamedTagAsBool(string name, bool defaultValue) { return (bool)GetNamedTagAsInt(name, (int)defaultValue); }
  public bool GetNamedTagAsBool(string name) { return GetNamedTagAsBool(name, false); }


  // ============================================================================
  // Name: SetNamedTag
  // Desc: Stores a string within this database using the tag name passed.
  // ============================================================================
  public native void SetNamedTag(string name, string value);


  // ============================================================================
  // Name: SetNamedSoup
  // Desc: Stores another Soup within this database using the tag name passed.
  // ============================================================================
  public native void SetNamedSoup(string name, Soup value);


  // ============================================================================
  // Name: SetNamedTag
  // Desc: Stores a KUID within this database using the tag name passed.
  // ============================================================================
  public native void SetNamedTag(string name, KUID value);


  // ============================================================================
  // Name: SetNamedTag
  // Desc: Stores a GameObjectID within this database using the tag name passed.
  // ============================================================================
  public native void SetNamedTag(string name, GameObjectID value);


  // ============================================================================
  // Name: SetNamedTag
  // Desc: Stores an int value within this database using the tag name passed.
  // ============================================================================
  public native void SetNamedTag(string name, int value);


  // ============================================================================
  // Name: SetNamedTag
  // Desc: Stores a float value within this database using the tag name passed.
  // ============================================================================
  public native void SetNamedTag(string name, float value);


  // ============================================================================
  // Name: SetNamedTag
  // Desc: Stores a boolean within this database using the tag name passed.
  // ============================================================================
  public void SetNamedTag(string name, bool value)
  {
    SetNamedTag(name, (int)value);
  }


  // ============================================================================
  // Name: RemoveNamedTag
  // Desc: Removes the named tag from this database.
  // ============================================================================
  public native void RemoveNamedTag(string name);


  // ============================================================================
  // Name: Clear
  // Desc: Clears out this database so it is empty with no tags or data.
  // ============================================================================
  public native void Clear(void);


  // ============================================================================
  // Name: Copy
  // Desc: Initializes this database to be a copy of the given one.
  // ============================================================================
  public native void Copy(Soup value);


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

