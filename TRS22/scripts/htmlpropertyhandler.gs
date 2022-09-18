//
// HTMLPropertyHandler.gs
//
//  Copyright (C) 2004-2005 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "soup.gs"
include "Constructors.gs"


//! A generic property value.
//
// This class describes a property as used by a property handler in terms of its type and value.
// Supported types include null values, integers, floating point numbers, strings, list indices and
// bools.
//
// See Also:
//     HTMLPropertyHandler, HTMLPropertyHandler::SetPropertyValue(),
//     HTMLPropertyHandler::GetPropertyAttribute(), HTMLPropertyHandler::SetPropertyAttribute()
//
class PropertyValue
{

  //! \name   Property Types
  //  \anchor propertyTypes
  //@{
  //! Different types that a property value can be.
  //
  // See Also:
  //     PropertyValue::GetType()
  //

  public define int NULL_TYPE   = 0;  //!< Null property value.
  public define int INT_TYPE    = 1;  //!< Integer property value.
  public define int FLOAT_TYPE  = 2;  //!< Floating point property value.
  public define int STRING_TYPE = 3;  //!< String property value.
  public define int INDEX_TYPE  = 4;  //!< Value is an index to a list item.
  public define int BOOL_TYPE   = 5;  //!< Boolean value.
  public define int OBJECT_TYPE = 6;  //!< GSObject value.

  //@}


  //! Gets the type of this property.
  //
  // Returns:
  //     Returns one of the \ref propertyTypes "property type" values.
  //
  public int GetType(void);

  //! Gets the value of this property as an int.
  //
  // Returns:
  //     Returns the value of this property as an int.  A value of 0 will be returned if the 
  //     property is not of type \ref propertyTypes "INT_TYPE".
  //
  public int AsInt(void);

  //! Gets the value of this property as a float.
  //
  // Returns:
  //     Returns the value of this property as a float.  A value of 0.0 will be returned if the
  //     property is not of type \ref propertyTypes "FLOAT_TYPE".
  //
  public float AsFloat(void);

  //! Gets the value of this property as a string.
  //
  // Returns:
  //     Returns the value of this property in a string. An empty string will be returned if the
  //     property is not of a supported type, but most types attempt some kind of cast. The
  //     OBJECT_TYPE string is usable only as a human readable representation of the object
  //     and not suitable to be used as any kind of ID.
  //
  public string AsString(void);

  //! Gets the value of this property as a bool.
  //
  // Returns:
  //     Returns the value of this property as a bool if the property is of type 
  //     \ref propertyTypes "BOOL_TYPE".  If the property is a \ref propertyTypes "STRING_TYPE" and
  //     \htmlonly the string value is <m"TRUE">, <m"&#116;rue">, <m"True"> or <m"1">, true is returned. \endhtmlonly
  //     If the property is of type \ref propertyTypes "INT_TYPE" and value is equal to 1, true is
  //     returned.  In any other circumstance, false will be returned.
  //
  public bool AsBool(void);

  //! Gets the value of this property as an object.
  //
  // Returns:
  //     Returns the value of this property in a generic script object. Will
  //     return null if the property is not of type OBJECT_TYPE.
  //
  public GSObject AsObject(void);

  //! Gets the value of this property as an index.
  //
  // Returns:
  //     Returns the value of this property as an index if the property is of type 
  //     \ref propertyTypes "INDEX_TYPE", 0 otherwise.
  //
  public int GetIndex(void);


  //! Sets this property to a \ref propertyTypes "null" value.
  public void Set(void);

  //! Sets the value of this property to the given int.
  //
  // Param:  val  Value to set this property to.
  //
  public void Set(int val);

  //! Sets the value of this property to the given float.
  //
  // Param:  val  Value to set this property to.
  //
  public void Set(float val);

  //! Sets the value of this property to the given string.
  //
  // Param:  val  Value to set this property to.
  //
  public void Set(string val);

  //! Sets the value of this property to the given index value.
  //
  // Param:  val    Value to set this property to.
  // Param:  index  Index value for this property.
  //
  public void Set(string val, int index);

  //! Sets the value of this property to the given bool.
  //
  // Param: val  Boolean value to set this property to.
  //
  public void Set(bool val);

  //! Sets the value of this property to the given GSObject.
  //
  // Param: val  Object to set this property value to.
  // Param: readableName  An optional human readable name for the object.
  //
  public void Set(GSObject val, string readableName);
  public void Set(GSObject val) { Set(val, ""); }


  //
  // PRIVATE IMPLEMENTATION
  //

  int m_type = NULL_TYPE;
  
  string    m_string;
  int       m_int;
  float     m_float;
  bool      m_bool;
  GSObject  m_object;


  public int GetType(void)
  {
    return m_type;
  }

  public int AsInt(void)
  {
    if (m_type == INT_TYPE)
      return m_int;
    
    if (m_type == FLOAT_TYPE)
      return (int)m_float;
    
    return 0;
  }

  public float AsFloat(void)
  {
    if (m_type == FLOAT_TYPE)
      return m_float;
    
    if (m_type == INT_TYPE)
      return (float)m_int;

    return 0.0f;
  }

  public string AsString(void)
  {
    if (m_type == STRING_TYPE  or  m_type == INDEX_TYPE)
      return m_string;
    
    if (m_type == INT_TYPE)
      return (string)m_int;
    
    if (m_type == FLOAT_TYPE)
      return (string)m_float;
    
    if (m_type == BOOL_TYPE)
      return (string)m_bool;
    
    if (m_type == OBJECT_TYPE)
      return m_string;
    
    return "";
  }

  public int GetIndex(void)
  {
    if (m_type == INDEX_TYPE)
      return m_int;

    return 0;
  }
  
  public bool AsBool(void)
  {
    if (m_type == BOOL_TYPE)
      return m_bool;
    
    if (m_type == INT_TYPE)
      return (m_int != 0);
    
    if (m_type == FLOAT_TYPE)
      return (m_float != 0);
    
    if (m_type == STRING_TYPE)
      return (m_string == "TRUE"  or  m_string == "true"  or  m_string == "True"  or  m_string == "1");
    
    return false;
  }

  public GSObject AsObject(void)
  {
    if (m_type == OBJECT_TYPE)
      return m_object;

    return null;
  }


  public void Set(void)
  {
    m_type = NULL_TYPE;
  }

  public void Set(int val)
  {
    m_type = INT_TYPE;
    m_int = val;
  }

  public void Set(float val)
  {
    m_type = FLOAT_TYPE;
    m_float = val;
  }

  public void Set(string val)
  {
    m_type = STRING_TYPE;
    m_string = val;
  }

  public void Set(string val, int index)
  {
    m_type = INDEX_TYPE;
    m_string = val;
    m_int = index;
  }

  public void Set(bool val)
  {
    m_type = BOOL_TYPE;
    m_bool = val;
  }

  public void Set(GSObject val, string readableName)
  {
    m_type = OBJECT_TYPE;
    m_object = val;
    m_string = readableName;
  }

};



//! A HTML property handler.
//
// Takes over the role of handling HTML properties from the PropertyObject class.
//
// To allow property objects to have properties that can be shared and more easily reused with other
// property objects, %Trainz now has property handlers.
//
// Previously properties were handled by overriding the various methods of the PropertyObject class 
// for each individual class that had properties.  The main limitation with this approach to property
// handling was that the properties code is locked down to that class and couldn't be reused very 
// easily.
//
// With property handlers, a property object has a property handler assigned to it to manage its 
// properties.  Because the property handler is a separate entity that can be attached to any 
// property object, property-handling code is now much more portable.
//
// The HTMLPropertyHandler class defines the interface for a property handler and you create you own
// handler by implementing its methods in the same way you would implement the various PropertyObject
// methods.
//
// The methods you override in HTMLPropertyHandler in most cases have identical PropertyObject 
// equivalents and are to be implemented in the same way.
//
// The methods to implement in your own property handler class are:
//  - GetDescriptionHTML()
//  - GetPropertyDescription()
//  - GetPropertyName()
//  - GetPropertyType()
//  - GetPropertyValue()
//  - GetPropertyElementList()
//  - SetPropertyValue()
//  - RefreshBrowser()
//  - GetProperties()
//  - SetProperties()
//
// As with PropertyObject, the implemented methods are not called by the script programmer.  In the
// case of HTMLPropertyHandler, it is PropertyObject's equivalent methods that will call the handler
// methods automatically.
//
// Sometimes a method doesn't have to be implemented and generally if you don't implement something
// you should have, the parent HTMLPropertyHandler method will put a message in the log file that
// is available once you exit %Trainz (<b \Trainz\JetLog.txt>).
//
// See Also:
//     PropertyValue, PropertyObject, HTMLPropertyGroup
//
class HTMLPropertyHandler isclass GameObject
{
  //
  // prefix methods
  //

  //! Sets the prefix of this property handler.
  //
  // All property handlers have a prefix string.  The prefix string is what the handler will prefix 
  // all of its property reference names with.  If a PropertyObject only contain a basic handler
  // that isn't a <l HTMLPropertyGroup  group handler> then you can get away without setting the
  // prefix string.
  //
  // For the sake of making your handler more versatile and easier to use, you should always strip 
  // the prefix of a property string in your implementations of the various methods in this handler.
  // HTMLPropertyHandler includes internal prefix utility methods to do this for you.
  //
  // For example, here is a simple GetPropertyValue() implementation that strips the prefix off 
  // <n propertyID> to determine the property name on its own:
  //
  //<code>
  //public string GetPropertyValue(string propertyID)
  //{
  //  string property = PropStripPrefix(propertyID, "");
  //  if (property == "propertyName")
  //  {
  //    //# property name verified, so return whatever the property's value is as a string...
  //  }
  //
  //  return inherited(propertyID);
  //}</code>
  //
  // Although it is not compulsory to have a prefix in a handler, it is recommended.  It is most
  // definitely recommended that you always strip the prefix from a property argument as is done in
  // the above code sample.  Even if the prefix is blank, this code will still cope without any
  // trouble.
  //
  // Param:  prefix  Prefix string to use with this handler.
  //
  public void SetPrefix(string prefix);

  //! Gets the prefix string of this property handler.
  //
  // Returns:
  //     Returns the prefix of this property handler.  An empty string (the default prefix) will be
  //     returned if a prefix hasn't been set for this handler.
  //
  public string GetPrefix(void);

  //! Gets the named property merged with the prefix of this handler.
  //
  // Param:  propertyName  Name of the property to get merged with the prefix.
  //
  // Returns:
  //     Returns a string that is equivalent to GetPrefix() + <i propertyName>.
  //
  public string Prop(string propertyName);

  //! Puts the named property into a URL value with prefix.
  //
  // This method is used to generate an appropriate URL for the given property name.  The returned
  // URL string can be used with the <n &lt;a href=&gt;> tag in the HTML page returned by 
  // GetDescriptionHTML().
  //
  // Param:  propertyName  Name of the property to generate a URL for.
  //
  // Returns:
  //     Returns a URL string that takes the form of <m"live://property/"> + GetPrefix() + <i propertyName>.
  //
  public string Link(string propertyName);

  //! Gets a HTML hyperlink for the named property.
  //
  // This method is used to generate an appropriate URL for the given property name.  The returned
  // HTML code can be used as a property link in the HTML page returned by GetDescriptionHTML().
  // Note that you will need to close the link with <n &lt;/a&gt;> yourself.
  //
  // Param:  propertyName  Name of the property to put into a hyperlink without the prefix.
  //
  // Returns:
  //     Returns the URL for the property specified by <i propertyName> in a <n &lt;a href=&gt;> tag
  //     that takes the form of <m"&lt;a href='live://property/"> + GetPrefix() + <i propertyName> + <m"'&gt;">.
  //
  public string HREF(string propertyName);

  //! Determines if the given property string is already prefixed.
  //
  // This method determines if a property string is already prefixed.  It can also be used to 
  // validate a properties name without having to split a string and remove the prefix.
  //
  // Param:  propertyName  Name of the property to check for the existence of a prefix in.
  // Param:  prefix        Additional extra prefix to append to the <l GetPrefix()  current prefix>
  //                       for testing purposes.  Use a blank string if not needed.
  //
  // Returns:
  //     Returns true if <i propertyName> is prefixed with the equivalent of this handler's
  //     <l GetPrefix()  prefix> with <i prefix> just after it, false otherwise.
  //
  bool PropMatchesPrefix(string propertyName, string prefix);

  //! Strips the given property string of its prefix.
  //
  // This method allows the a property string to be stripped of its prefix making it easier to verify
  // the contents of a <i propertyID> parameter.  For example:
  //
  //<code>
  //public string GetPropertyValue(string propertyID)
  //{
  //  string property = PropStripPrefix(propertyID, "");
  //  if (property == "propertyName")
  //  {
  //    //# property name verified, so return whatever the property's value is as a string...
  //  }
  //
  //  return inherited(propertyID);
  //}</code>
  //
  // The above code sample means the property being queried is easier to check as we don't need to
  // worry about what the prefix might be when trying to determine the property.  Remember that 
  // prefixes vary, property names don't (well they shouldn't once the handler is fully implemented).
  //
  // Param:  propertyName  Property string to strip the prefix from.
  // Param:  prefix        Additional extra prefix to append to the <l GetPrefix()  current prefix>
  //                       that may also need to be stripped.  Use a blank string if not needed.
  //
  // Returns:
  //     Returns a new version of <i propertyName> with the current prefix and <i prefix> removed
  //     from the start of it.  It is assumed that the caller knows what they are doing and 
  //     <i propertyName> is big enough to handle the combined prefix being stripped from it.
  //
  string PropStripPrefix(string propertyName, string prefix);


  //
  // HTMLPropertyHandler dispatch methods
  //

  //! Gets the properties of this handler in HTML code.
  //
  // This method is called by PropertyObject::GetDescriptionHTML() to get the properties of this
  // handler as HTML code for display in a browser window.
  //
  // See the PropertyObject::GetDescriptionHTML() method description for further details on how a
  // HTML properties page should be constructed.
  //
  // Returns:
  //     Returns the HTML code that presents the properties for a Browser to display.
  //
  // See Also:
  //     PropertyObject::GetDescriptionHTML()
  //
  public string GetDescriptionHTML(void);

  //! Gets a readable name for the named property.
  //
  // This method is called by PropertyObject::GetPropertyName() to get a readable description for
  // the named property.
  //
  // The script programmer will need to override this method if they want their properties to have
  // names to appear in %Trainz such as a label for the edit window of a property for example.
  //
  // Param:  propertyID  Name of the property to get a readable name for.
  //
  // Returns:
  //     Should return a short human-readable name for <i propertyID>.  The default 
  //     HTMLPropertyHandler implementation will always return the string <m"null"> 
  //     (not to be confused with a \ref propertyTypes "null" value).
  //
  // See Also:
  //     PropertyObject::GetPropertyName()
  //
  public string GetPropertyName(string propertyID);

  //! Gets a readable description for the named property.
  //
  // This method is called by PropertyObject::GetPropertyDescription() to get a readable description
  // for the named property.
  //
  // The script programmer will need to override this method if they want their properties to have
  // descriptions to appear in %Trainz such as in the tooltip of a property link for example.
  //
  // Param:  propertyID  Name of the property to get a human-friendly readable description of.
  //
  // Returns:
  //     Should return the localized description text for <i propertyID>.  The HTMLPropertyHandler
  //     implementation will always return the string <m"null"> (not to be confused with a null value).
  //
  // See Also:
  //     PropertyObject::GetPropertyDescription()
  //
  public string GetPropertyDescription(string propertyID);

  //! Gets the type of the named property.
  //
  // This method is called by PropertyObject::GetPropertyType() to get the type definition string
  // for the named property.
  //
  // See the PropertyObject::GetPropertyType() method for details on how a property type string is
  // to be formatted.
  //
  // Param:  propertyID  Name of the property to get the type information for.
  //
  // Returns:
  //     Should return the type of the property named by <i propertyID> in the required format as
  //     specified in the PropertyObject::GetPropertyType() description.  The HTMLPropertyHandler
  //     implementation will always return the string <m"null"> (not to be confused with a null 
  //     value).
  //
  // See Also:
  //     PropertyObject::GetPropertyType()
  //
  public string GetPropertyType(string propertyID);

  //! Gets the value of the named property as a string. 
  //
  // This method is called by PropertyObject::GetPropertyValue() to get the value of the named
  // property.
  //
  // Param:  propertyID  Property to get the value of.
  //
  // Returns:
  //     Returns the value of <i propertyID> as a string (convert if necessary).  The 
  //     HTMLPropertyHandler implementation will always return an empty string.
  //
  // See Also:
  //     PropertyObject::GetPropertyValue()
  //
  public string GetPropertyValue(string propertyID);

  //! Sets the named property to the specified value.
  //
  // This method is called from a PropertyObject to set a property to a new value as specified in
  // the arguments.
  //
  // Param:  propertyID  Name of the property to set the value of.
  // Param:  value       Object describing that value to set the property to.
  //
  // See Also:
  //     PropertyObject::LinkPropertyValue(), PropertyObject::SetPropertyValue(string,string,int),
  //     PropertyObject::SetPropertyValue(string,string), PropertyObject::SetPropertyValue(string,int),
  //     PropertyObject::SetPropertyValue(string,float)
  //
  public void SetPropertyValue(string propertyID, PropertyValue value);

  //! Provides list of possible elements for the named list property.
  //
  // This method is called by PropertyObject::GetPropertyElementList() to get a list of possible
  // values that the named property can be.
  //
  // See the PropertyObject::GetPropertyElementList() method for further details on list properties.
  //
  // Param:  propertyID  Name of the property to get the list elements for.
  //
  // Returns:
  //     Returns an array of strings that lists the possibly elements <i propertyID> can be.
  //     The default HTMLPropertyHandler implementation will always return an empty list.
  //
  // See Also:
  //     PropertyObject::GetPropertyElementList()
  //
  public string[] GetPropertyElementList(string propertyID);


  //=============================================================================
  // Name: FilterPropertyElementList
  // Desc: Called by PropertyObject::FilterPropertyElementList to filter display
  //       lists for map-object and asset-list properties. See PropertyObject for
  //       more details.
  //=============================================================================
  public bool FilterPropertyElementList(string propertyID, GSObject[] listObjects, string[] listNames);


  //! Sets the attribute of the named property.
  //
  // This method is provided as a mechanism for the properties of a handler to be accessed 
  // externally.  Implementing it is not required as it isn't called by a host PropertyObject.
  // How it is used is entirely up to the programmer making the handler.
  //
  // Param:  propertyID  Name of the property to set the attribute of.
  // Param:  attribute   Attribute field.  How this string value is used is entirely up to the 
  //                     programmer implementing this method.
  // Param:  value       Value to apply the property.  Like <i attribute>, how this parameter
  //                     is dealt with is up to the programmer.
  //
  public void SetPropertyAttribute(string propertyID, string attribute, PropertyValue value);

  //! Gets the attributes of the named property.
  //
  // This method is provided as a mechanism for the properties of a handler to be accessed 
  // externally.  Implementing it is not required as it isn't called by a host PropertyObject.
  // How it is used is entirely up to the programmer making the handler.
  //
  // Param:  propertyID  Name of the property to get the attributes of.
  // Param:  attribute   Attribute field.  How this string value is interpreted is entirely up to
  //                     the programmer implementing this method.
  //
  // Returns:
  //     Should return a PropertyValue object containing the requested attributes of the named 
  //     property.  The default top-level implementation returns a PropertyValue that is of type
  //     \ref propertyTypes "NULL_TYPE".
  //
  public PropertyValue GetPropertyAttribute(string propertyID, string attribute);


  //! Refreshes the given browser with the properties of this handler.
  //
  // Param:  browser  Browser to update.
  //
  // See Also:
  //     PropertyObject::PropertyBrowserRefresh()
  //
  public void RefreshBrowser(Browser browser); 


  //! Initializes the properties of this handler from the given soup.
  //
  // If the <i soup> database is empty, then the PropertyObject should initialize itself with 
  // sensible defaults.  If it does have tags, they will be in the private descriptor format as 
  // produced by GetProperties().
  //
  // Note:
  //     This method will only be called by the host PropertyObject if this handler's
  //     <l GetSavesProperties()  save properties flag> is set.
  //
  // Param:  soup  Database to initialize this handler with.
  //
  // See Also:
  //     PropertyObject::SetProperties()
  //
  public void SetProperties(Soup soup);

  //! Saves the properties of this handler to a soup and returns it.
  //
  // This method is used to save the properties of a handler into a database.  Care must be taken to
  // ensure it writes data in the same tag format that SetProperties() is expecting it to be in.
  //
  // Note:
  //     This method will only be called by the host PropertyObject if this handler's
  //     <l GetSavesProperties()  save properties flag> is set.
  //
  // Returns:
  //     Returns a private descriptor for the current properties in use by this object.
  //
  // See Also:
  //     PropertyObject::GetProperties()
  //
  public Soup GetProperties(void);


  //
  // other attributes
  //

  //! Instructs this handler whether to save its properties.
  //
  // If the handler is set to save properties, then the host PropertyObject will use the handler's
  // GetProperties() and SetProperties() methods when saving and loading.
  //
  // Param:  saveProperties  If true, handler properties are saved.  Use false to get the host 
  //                         PropertyObject to not save the properties of this handler.
  //
  // See Also:
  //     PropertyObject::GetProperties(), PropertyObject::SetProperties()
  //
  public void SetSavesProperties(bool saveProperties);

  //! Determines if this handler will save its properties.
  //
  // Returns:
  //     Returns true if this handler will save its properties when the host PropertyObject is
  //     saving, false otherwise.
  //
  // See Also:
  //     PropertyObject::GetProperties(), PropertyObject::SetProperties()
  //
  public bool GetSavesProperties(void);


  //
  // PRIVATE IMPLEMENTATION
  //

  string m_prefix = "";
  bool m_savesProperties = true;


  public string GetDescriptionHTML(void)
  {
    return "<p><b>HTMLPropertyHandler</b></p>";
  }

  public string GetPropertyName(string propertyID)
  {
    return "null";
  }

  public string GetPropertyDescription(string propertyID)
  {
    return "null";
  }

  public string GetPropertyType(string propertyID)
  {
    return "null";
  }

  public string GetPropertyValue(string propertyID)
  {
    return "";
  }

  public void SetPropertyValue(string propertyID, PropertyValue value)
  {
  }

  public string[] GetPropertyElementList(string propertyID)
  {
    return new string[0];
  }

  public bool FilterPropertyElementList(string propertyID, GSObject[] listObjects, string[] listNames)
  {
    return false;
  }
  
  public void SetPropertyAttribute(string propertyID, string attribute, PropertyValue value)
  {
    Interface.Log("HTMLPropertyHandler.SetPropertyAttribute> unhandled on prefix='" + GetPrefix() + "': propertyID='" + propertyID + "' attribute='" + attribute + "'");
  }
  
  public PropertyValue GetPropertyAttribute(string propertyID, string attribute)
  {
    Interface.Log("HTMLPropertyHandler.GetPropertyAttribute> unhandled on prefix='" + GetPrefix() + "': propertyID='" + propertyID + "' attribute='" + attribute + "'");
    
    PropertyValue ret = new PropertyValue();
    ret.Set();
    return ret;
  }

  public void RefreshBrowser(Browser browser)
  {
  }


  public void SetPrefix(string prefix)
  {
    m_prefix = prefix;
  }

  public string GetPrefix(void)
  {
    return m_prefix;
  }


  public string Prop(string propertyName)
  {
    return m_prefix + propertyName;
  }

  public string Link(string propertyName)
  {
    return "live://property/" + m_prefix + propertyName;
  }

  public string HREF(string propertyName)
  {
    return "<a href='live://property/" + m_prefix + propertyName + "'>";
  }

  bool PropMatchesPrefix(string propertyName, string prefix)
  {
    string fullPrefix = m_prefix + prefix;
    
    return propertyName[0, fullPrefix.size()] == fullPrefix;
  }

  string PropStripPrefix(string propertyName, string prefix)
  {
    string fullPrefix = m_prefix + prefix;
    
    return propertyName[fullPrefix.size(), ];
  }


  public void SetProperties(Soup soup)
  {
  }

  public Soup GetProperties(void)
  {
    return Constructors.NewSoup();
  }


  public void SetSavesProperties(bool saveProperties)
  {
    m_savesProperties = saveProperties;
  }

  public bool GetSavesProperties(void)
  {
    return m_savesProperties;
  }

};



//! A group property handler.
//
// This class manages multiple property handlers allowing the different handlers to be combined and
// used as one.  As this class is derived from HTMLPropertyHandler, it has the same interface as a 
// a regular property handler and can be assigned to a PropertyObject like a regular handler.  This
// allows us to use more than one property handler for an object.  As a result, it is easier to combine
// and reuse handlers as required for different property objects.
//
// As any handler derived from HTMLPropertyHandler can be added as a sub handler, it is possible to
// create a hierarchy of handlers by adding an existing group handler such that it becomes a sub 
// handler.
//
// The group handler works by simply passing on the various property handler function calls to the 
// appropriate child handler equivalent.  It identifies each child handler by extending their 
// <l HTMLPropertyHandler::SetPrefix()  prefix>, so be careful to ensure two child handles don't 
// have the same prefix.
//
// See Also:
//     HTMLPropertyHandler, PropertyObject, PropertyValue
//
class HTMLPropertyGroup isclass HTMLPropertyHandler
{
  public bool hasFrame = false;
  public bool visible = true;
  public string fontParams;

  //
  // HTMLPropertyGroup management methods
  //

  //! Adds the given property handler to this group handler.
  //
  // Note:
  //     A specific property handler object instance should not be used as a sub handler for more than
  //     one particular group handler.  Doing so is at your own risk.
  //
  // Param:  handler    New sub handler to add to this group.  
  // Param:  subPrefix  Prefix to identify the sub handler by.  This string will be prefixed with 
  //                    the existing prefix of <i handler> so its actual prefix is updated in the 
  //                    process of being added to this group.
  //
  public void AddHandler(HTMLPropertyHandler handler, string subPrefix);

  //! Removes the given sub handler from this group.
  //
  // Param:  handler  Handler to remove from this group handler.  If it isn't a member of this group,
  //                  nothing will be done by this method.
  //
  public void RemoveHandler(HTMLPropertyHandler handler);

  //! Logs useful information about all sub handlers in this group handler to the <b \Trainz\JetLog.txt> log file.
  public void LogHandlers(void);


  //
  // HTMLPropertyHandler dispatch methods
  //

  //! Gets a HTML description of this group handler based on all of the child handlers.
  //
  // Overridden from HTMLPropertyHandler::GetDescriptionHTML() to get the HTML description of each
  // child handler in this group for inclusion in the returned description.
  //
  // Returns:
  //     Returns a HTML description built up by gathering the descriptions of all of the child 
  //     handlers.
  //
  public string GetDescriptionHTML(void);

  //! Gets a descriptive name for the given property.
  //
  // Overridden from HTMLPropertyHandler::GetPropertyName() to get the property name from the
  // appropriate child handler.
  //
  // Param:  propertyID  Name of the property to get the descriptive name of.  This should be a
  //                     full property string with group handler and sub handler prefixes.
  //
  // Returns:
  //     Returns whatever the sub handler's GetPropertyName() method does, <m"null"> otherwise.
  //
  public string GetPropertyName(string propertyID);

  //! Gets a description for the named property.
  //
  // Overridden from HTMLPropertyHandler::GetPropertyDescription() to get the property name from 
  // the appropriate child handler.
  //
  // Param:  propertyID  Name of the property to get the description of.  This should be a
  //                     full property string with group handler and sub handler prefixes.
  //
  // Returns:
  //     Returns whatever the sub handler's GetPropertyDescription() method does, <m"null"> otherwise.
  //
  public string GetPropertyDescription(string propertyID);

  //! Gets the type of the named property.
  //
  // Overridden from HTMLPropertyHandler::GetPropertyType() to get the type of the named property
  // from the appropriate child handler.
  //
  // Param:  propertyID  Name of the property to get the type of.  This should be a full property
  //                     string with group handler and sub handler prefixes.
  //
  // Returns:
  //     Returns whatever the sub handler's GetPropertyType() method does, <m"null"> otherwise.
  //
  public string GetPropertyType(string propertyID);

  //! Gets the value of the named property.
  //
  // Overridden from HTMLPropertyHandler::GetPropertyValue() to get the value of the named property
  // as a string from the appropriate child handler.
  //
  // Param:  propertyID  Name of the property to get the value of.  This should be a full property
  //                     string with group handler and sub handler prefixes.
  //
  // Returns:
  //     Returns whatever the sub handler's GetPropertyValue() method does, an empty string (<m"">)
  //     otherwise.
  //
  public string GetPropertyValue(string propertyID);

  //! Sets the value of the named property.
  //
  // Overridden from HTMLPropertyHandler::SetPropertyValue() to set the value of the named property
  // on the appropriate child handler.
  //
  // Param:  propertyID  Name of the property to set the value of.  This should be a full property
  //                     string with group handler and sub handler prefixes.
  // Param:  value       Value to set the property to.
  //
  public void SetPropertyValue(string propertyID, PropertyValue value);

  //! Gets the elements list for the named list property.
  //
  // Overridden from HTMLPropertyHandler::GetPropertyElementList() to get the elements list for the
  // named list property.
  //
  // Param:  propertyID  Name of the property to get the element list of.  This should be a full
  //                     property string with group handler and sub handler prefixes.
  //
  // Returns:
  //     Returns whatever the sub handler's GetPropertyElementList() method does, an empty string 
  //     array otherwise.
  //
  public string[] GetPropertyElementList(string propertyID);

  //=============================================================================
  // Name: FilterPropertyElementList
  // Desc: Overridden from HTMLPropertyHandler::FilterPropertyElementList() to
  //       filter the list for the named map-object or asset-list property. See
  //       PropertyObject::FilterPropertyElementList for more details.
  //=============================================================================
  public bool FilterPropertyElementList(string propertyID, GSObject[] listObjects, string[] listNames);

  //! Sets the attributes of the named property.
  //
  // Overridden from HTMLPropertyHandler::SetPropertyAttribute() to set the attributes of the named
  // property in the appropriate sub handler.
  //
  // Param:  propertyID  Name of the property to set the attribute of.
  // Param:  attribute   Attribute field.  
  // Param:  value       Value to apply the property.  
  //
  public void SetPropertyAttribute(string propertyID, string attribute, PropertyValue value);

  //! Gets the attributes of the named property.
  //
  // Overridden from HTMLPropertyHandler::GetPropertyAttribute() to get the attributes of the
  // named property from the appropriate sub handler.
  //
  // Param:  propertyID  Name of the property to get the attributes of.  This should be a full
  //                     property string with group handler and sub handler prefixes.
  // Param:  attribute   Attribute field.
  //
  // Returns:
  //     Returns whatever the sub handler's GetPropertyAttribute() method does, a PropertyValue that
  //     is of type \ref propertyTypes "NULL_TYPE" otherwise.
  //
  public PropertyValue GetPropertyAttribute(string propertyID, string attribute);

  //! Refreshes the given browser with the properties of this handler.
  //
  // Overridden from HTMLPropertyHandler::RefreshBrowser() to refresh a <i browser> with the HTML
  // from all of the sub handlers.
  //
  // Param:  browser  Browser to refresh.
  //
  public void RefreshBrowser(Browser browser);


  // Be vary careful with the use of the following methods.
  // The appropriate PropertyHandlers need to be created and attached prior
  // to the SetProperties() call being made, or the data will be lost.


  //! Initializes this handler's properties from the given database.
  //
  // Overridden from HTMLPropertyHandler::SetProperties() to initialize all of the sub handlers from
  // the given Soup database.  The HTMLPropertyGroup implementation of this method assumes the sub 
  // handlers have already been added to the group handler - it only initializes existing sub 
  // handlers and generally isn't meant to create new sub handlers itself (although you can do that
  // in your own overridden implementation if you really want to).
  //
  // Param:  soup  Database of property values to initialize this handler with.  Sub-databases in side
  //               this soup will be used to initialize each sub-handler. 
  //
  public void SetProperties(Soup soup);

  //! Gets this handler's properties in a database.
  //
  // Overridden from HTMLPropertyHandler::GetProperties() to save the properties of all sub handlers
  // and then return a Soup containing a sub-database for each sub handler obtained by calling the 
  // sub handlers GetProperties() method.
  //
  // Returns:
  //     Returns a Soup database containing the saved properties of this group handler and its sub
  //     handlers.
  //
  public Soup GetProperties(void);


  //
  // Overrides
  //

  //! Sets the prefix of this handler.
  //
  // Overridden from HTMLPropertyHandler::SetPrefix() to set the prefix of this handler as well
  // as the sub handlers.  The new <i prefix> value will not only be applied to this handler but
  // it will also replace the current on each sub-handler.  This works on the basis that all sub
  // handlers have their group handler's prefix before their own prefix.
  //
  // Param:  prefix  Prefix to apply this group handler and its sub handlers.
  //
  public void SetPrefix(string prefix);


  //
  // Internal methods
  //

  //! Internal private method that allows a sub handler to be found by name.
  //
  // Param:  propertyID  Prefix of the sub handler to search for.
  //
  // Returns:
  //     Returns the requested sub handler if it exists in this group, null otherwise.
  //
  HTMLPropertyHandler FindHandler(string propertyID);


  //
  // PRIVATE IMPLEMENTATION
  //
  HTMLPropertyHandler[] handlers = new HTMLPropertyHandler[0];


  public string GetDescriptionHTML(void)
  {
    string body = "";
    
    if (visible  and  handlers.size())
    {
      body = body + handlers[0].GetDescriptionHTML();

      int i;
      for (i = 1; i < handlers.size(); i++)
        body = body + "<br>" + handlers[i].GetDescriptionHTML();
      
      if (hasFrame)
      {
        body = HTMLWindow.MakeTable(
          HTMLWindow.MakeRow(
            HTMLWindow.MakeCell("", "width=50") +
          
            HTMLWindow.MakeCell(
              HTMLWindow.MakeTable(
                HTMLWindow.MakeRow(
                  HTMLWindow.MakeCell(
                    body
                  )
                ),
              "cellpadding=20 border=1 bgcolor=#FFAD0059 bordercolor=#00000059 inherit-font"
              )
            )
          )
        );
      } // hasFrame
      
      if (fontParams)
        body = "<font " + fontParams + ">" + body + "</font>";
    }
    
    return body;
  }

  public string GetPropertyName(string propertyID)
  {
    HTMLPropertyHandler handler = FindHandler(propertyID);
    if (handler)
      return handler.GetPropertyName(propertyID);

    return "null";
  }

  public string GetPropertyDescription(string propertyID)
  {
    HTMLPropertyHandler handler = FindHandler(propertyID);
    if (handler)
      return handler.GetPropertyDescription(propertyID);

    return "no description";
  }

  public string GetPropertyType(string propertyID)
  {
    HTMLPropertyHandler handler = FindHandler(propertyID);
    if (handler)
      return handler.GetPropertyType(propertyID);
    
    Interface.Log("HTMLPropertyHandler.GetPropertyType> no handler for '" + propertyID + "'");
    LogHandlers();
    return "null";
  }

  public string GetPropertyValue(string propertyID)
  {
    HTMLPropertyHandler handler = FindHandler(propertyID);
    if (handler)
      return handler.GetPropertyValue(propertyID);

    return "";
  }

  public void SetPropertyValue(string propertyID, PropertyValue value)
  {
    HTMLPropertyHandler handler = FindHandler(propertyID);
    if (handler)
      handler.SetPropertyValue(propertyID, value);
  }

  public string[] GetPropertyElementList(string propertyID)
  {
    HTMLPropertyHandler handler = FindHandler(propertyID);
    if (handler)
      return handler.GetPropertyElementList(propertyID);

    return new string[0];
  }

  public bool FilterPropertyElementList(string propertyID, GSObject[] listObjects, string[] listNames)
  {
    HTMLPropertyHandler handler = FindHandler(propertyID);
    if (handler)
      return handler.FilterPropertyElementList(propertyID, listObjects, listNames);

    return false;
  }

  public void SetPropertyAttribute(string propertyID, string attribute, PropertyValue value)
  {
    HTMLPropertyHandler handler = FindHandler(propertyID);
    if (handler)
    {
      handler.SetPropertyAttribute(propertyID, attribute, value);
      return;
    }
    
    if (propertyID != GetPrefix())
    {
      inherited(propertyID, attribute, value);
      return;
    }
    
    // local property
    if (attribute == "visible")
    {
      visible = value.AsBool();
    }
    else
      inherited(propertyID, attribute, value);
  }

  public PropertyValue GetPropertyAttribute(string propertyID, string attribute)
  {
    HTMLPropertyHandler handler = FindHandler(propertyID);
    if (handler)
      return handler.GetPropertyAttribute(propertyID, attribute);
    
    if (propertyID != GetPrefix())
      return inherited(propertyID, attribute);
    
    
    // local property
    PropertyValue ret = new PropertyValue();
    if (attribute == "visible")
    {
      ret.Set(visible);
    }
    else
      return inherited(propertyID, attribute);
    
    return ret;
  }

  public void RefreshBrowser(Browser browser)
  {
    int i;
    for (i = 0; i < handlers.size(); i++)
      handlers[i].RefreshBrowser(browser);
  }


  public void SetProperties(Soup soup)
  {
    inherited(soup);
    
    if (soup.CountTags() <= 0)
      return;
    
    int i;
    for (i = 0; i < handlers.size(); i++)
    {
      if (handlers[i].GetSavesProperties())
      {
        string prefix = handlers[i].GetPrefix();
        if (prefix == "")
          prefix = "<null>";

        Soup subsoup = soup.GetNamedSoup(prefix);
        handlers[i].SetProperties(subsoup);
      }
    }
  }

  public Soup GetProperties(void)
  {
    Soup soup = inherited();
    
    int i;
    for (i = 0; i < handlers.size(); i++)
    {
      if (handlers[i].GetSavesProperties())
      {
        string prefix = handlers[i].GetPrefix();
        if (prefix == "")
          prefix = "<null>";

        Soup subsoup = handlers[i].GetProperties();
        soup.SetNamedSoup(prefix, subsoup);
      }
    }

    return soup;
  }


  public void AddHandler(HTMLPropertyHandler handler, string subPrefix)
  {
    handler.SetPrefix(GetPrefix() + subPrefix);

    handlers[handlers.size()] = handler;
  }

  public void RemoveHandler(HTMLPropertyHandler handler)
  {
    int i;
    for (i = 0; i < handlers.size(); i++)
      if (handlers[i] == handler)
      {
        handlers[i, i+1] = null;
        break;
      }
  }


  HTMLPropertyHandler FindHandler(string propertyID)
  {
    int i;
    
    HTMLPropertyHandler bestHandler;
    int bestHandlerPrefixSize = 0;
    
    for (i = 0; i < handlers.size(); i++)
    {
      HTMLPropertyHandler handler = handlers[i];
      string handlerPrefix = handler.GetPrefix();
      int prefixSize = handlerPrefix.size();
      
      if (propertyID[0, prefixSize] == handlerPrefix)
      {
        if (prefixSize > bestHandlerPrefixSize)
        {
          bestHandler = handler;
          bestHandlerPrefixSize = prefixSize;
        }
      }
    }

    return bestHandler;
  }

  public void LogHandlers(void)
  {
    Interface.Log("** HTMLPropertyGroup.LogHandlers> prefix='" + m_prefix + "'");

    int i;
    
    for (i = 0; i < handlers.size(); i++)
      Interface.Log("   handler #" + i + " prefix='" + handlers[i].GetPrefix() + "'");

    Interface.Log("--");
  }

  public void SetPrefix(string prefix)
  {
    if (prefix == m_prefix)
      return;

    
    int oldPrefixLen = m_prefix.size();
    int i;
    for (i = 0; i < handlers.size(); i++)
    {
      HTMLPropertyHandler handler = handlers[i];

      string handlerPrefix = handler.GetPrefix();

      handlerPrefix = prefix + handlerPrefix[oldPrefixLen, ];

      handler.SetPrefix(handlerPrefix);
    }
    
    inherited(prefix);
  }


};