//
// PropertyObject.gs
//
//  Copyright (C) 2003 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "gs.gs"
include "Soup.gs"
include "Constructors.gs"
include "HTMLPropertyHandler.gs"


//! An interface for an object with data properties.
//
// This class provides an abstract interface that allows an object to have properties that can be
// saved or loaded with a session and edited by the user through a browser window in Surveyor.
//
// To give a class properties, it must inherit from this class (or a derived child class such as
// ScenarioBehavior or MeshObject).
//
// A property is a virtual data member in the sense that it is something that only exists by name as
// far the interface methods of the class are concerned.  As this is a high-level interface class,
// it has no properties itself, rather only a variety of methods that %Trainz calls to access
// properties.
//
// Note:
//     See GetPropertyType() for further details on the type of properties supported.
//
// All properties are referred to in the methods by name.  How the actually property is handled is
// left to the programmer to do in their own overridden method implementation.  The idea is that the
// derived class will have normal data members and the property interface methods act as a 
// translation layer between the abstract property names and the actual data being used.
//
// To elaborate further, this uniform interface means that when %Trainz is saving a session, it asks
// each object to save its respective state into a Soup database.  %Trainz won't know what your
// object needs to save but it does know that it can request an object's state in a database for
// storage.  So in that sense, %Trainz is relying on the script programmer to have given careful
// thought to how they construct their asset.
//
// Depending on circumstances, not all methods have to be implemented (all do have minimal default
// implementations in this class).  For example, you don't need to override GetDescriptionHTML() if
// you don't want the object to have editable properties in Surveyor or GetPropertyElementList() if
// there are no list-selection properties.
//
// Note that with the introduction of property handlers (described below), there is no longer a need
// to override PropertyObject methods to support properties.
//
//
// <bi Property Handlers><br>
// A property handler is attached to a property object to manage that property object's properties.
// Because the property handler is a separate entity from the property object, the actual script
// code that deals with properties is more portable and not tied down to a specific PropertyObject
// derived class.
//
// PropertyObject retains backward compatibility so no existing assets will be affected by the added
// handler support.  However care must be taken if you are overriding PropertyObject methods and a
// handler is being used with your object.  The reason being is that PropertyObject's parent method
// implementations check for the a handler and pass the call onto the handler for processing if one
// is available.
//
// As a result, if you have overridden these methods in your PropertyObject-derived class and a 
// handler is attached to the property object, that handler won't be used unless you either call its
// methods from your own overridden PropertyObject methods or call the parent PropertyObject method
// with the <l gscLangKeyInherit  inherited> keyword.
//
// Generally, it would be less troublesome and error prone if you either stick to just overriding 
// PropertyObject methods for your property handling or switched over to using handlers exclusively.
//
// A handler can be assigned to a PropertyObject by calling its SetPropertyHandler() method.  More
// details about property handlers can be found in the HTMLPropertyHandler class documentation.
//
// See Also:
//     Asset, HTMLPropertyHandler, HTMLPropertyGroup, MeshObject, ScenarioBehavior, Soup
//
game class PropertyObject
{
  //! Instructs this PropertyObject to initialize its properties from the given database.
  //
  // If the database is empty, then the PropertyObject should initialize itself with sensible
  // defaults.  If it does have tags, they will be in the private descriptor format as produced by
  // GetProperties().
  //
  // When overriding this method to handle your own properties, always call through to the 
  // overridden parent by using <l gscLangKeyInherit  inherited> like this:
  //
  //<code>
  //public void SetProperties(Soup soup)
  //{
  //  //# call overridden parent with soup passed up to it
  //  inherited(soup);
  //
  //  //# your initialization goes here...
  //}
  //</code>
  //
  // In the PropertyObject implementation, if a property handler is attached to this object and it
  // has been set to have its <l HTMLPropertyHandler::GetSavesProperties()  properties saved>, that
  // handler's <l HTMLPropertyHandler::SetProperties()  SetProperties>() method will be called.
  //
  // Note:
  //     It is possible that in future versions of %Trainz, parent methods like this one may have
  //     their implementation modified.  By not calling through to the overridden parent, you will
  //     ill be running the risk of having your assets <bi NOT WORKING> in a future version of
  //     %Trainz.
  //
  // Param:  soup  Database to initialize this property object with.
  //
  // See Also:
  //     HTMLPropertyHandler::SetProperties(), HTMLPropertyHandler::GetSavesProperties()
  //
  public void SetProperties(Soup soup);

  //! Instructs this PropertyObject to put all of its current properties into a database to be returned.
  //
  // This method is used to save the properties of a PropertyObject into a database.  Care must be
  // taken to ensure it writes data in the same tag format that SetProperties() is expecting it to
  // be in.
  //
  // When overriding this method to handle your own properties, always call through to the 
  // overridden parent by using <l gscLangKeyInherit  inherited> like this:
  //
  //<code>
  //public Soup GetProperties(void)
  //{
  //  //# start out with parent class properties
  //  Soup retSoup = inherited();
  //
  //  //# add your own properties to retSoup here...
  //
  //  //# return the complete properties database
  //  return retSoup;
  //}
  //</code>
  //
  // In the PropertyObject implementation, if a property handler is attached to this object and it
  // has been set to have its <l HTMLPropertyHandler::GetSavesProperties()  properties saved>, that
  // handler's <l HTMLPropertyHandler::GetProperties()  GetProperties>() method will be called.
  //
  // Note:
  //     It is possible that in future versions of %Trainz, parent methods like this one may have
  //     their implementation modified.  By not calling through to the overridden parent, you risk
  //     your assets <bi NOT WORKING> in a future version of %Trainz.
  //
  // Returns:
  //     Returns a private descriptor for the current properties in use by this object.
  //
  // See Also:
  //     HTMLPropertyHandler::GetProperties(), HTMLPropertyHandler::GetSavesProperties()
  //
  public Soup GetProperties(void);


  //! Gets a description of this PropertyObject as a HTML page.
  //
  // This method is called by %Trainz from Surveyor to get the properties of the object as HTML code
  // for display in a Browser window.
  //
  // In the default PropertyObject implementation, if a property handler is present the handler's
  // <l HTMLPropertyHandler::GetDescriptionHTML()  GetDescriptionHTML>() method is called to get the
  // properties as a HTML page.  Otherwise an empty string will be returned.
  //
  // Property link URLs should be in the form of <n "live://property/foobar"> where <n foobar> is the
  // non-localized name of the property.  When one of these links is clicked on, %Trainz will call
  // LinkPropertyValue(), which must be implemented if the link is to be acted on.  Note that
  // properties used in URLs must be of type <b link>.
  //
  // Returns:
  //     Returns a HTML description of the PropertyObject to be displayed to the user in the 
  //     Surveyor Rules Editor.  Properties should appear as links and summarize the current
  //     setting so that the user can edit them.
  //
  // Note:
  //     To aid in localization, any text should be extracted from the PropertyObject's asset's 
  //     StringTable and not included in script code as a literal string.
  //
  // See Also:
  //     Browser, HTMLPropertyHandler::GetDescriptionHTML()
  //
  public string GetDescriptionHTML(void);


  //=============================================================================
  // Name: GetPropertyElementList
  // Desc: Called to get an arrayof options the player can select for a "list"
  //       property. Trainz will then display these items in a dialog. Once the
  //       player selects an item native code will call SetPropertyValue to set
  //       the selection in script. It is up to the deriving class to implement
  //       both this function and the SetPropertyValue call for the property.
  //       Implementations of this function should be fast, and should not
  //       perform large array population on demand.
  //       For simplified/automated selection of common types, consider the
  //       "map-object" and "asset-list" property types.
  // Parm: propertyID - The ID of the property to get the list elements for.
  // Retn: string[] - An array of localised human readable options to display
  //       to the player for selection.
  //=============================================================================
  public string[] GetPropertyElementList(string propertyID);


  //=============================================================================
  // Name: FilterPropertyElementList
  // Desc: Called by native code for properties of type "map-object" and
  //       "asset-list" in order to allow scripts to filter or extend the list
  //       options prior to display. Modify the passed arrays directly to alter
  //       the displayed lists.
  // Parm: listObjects - The object references for the list items (GameObjectID
  //       for map-object properties, and Asset for asset-list properties).
  // Parm: listNames - The displayed names for the list items.
  // Note: The indices of the two lists match when passed. It is up to the
  //       implementing scripter to ensure they still match on return. Any mis-
  //       match in list size on return will cause a script exception.
  // Retn: bool - Whether the list was modified. Returning false will result in
  //       no changes to the displayed list, regardless of changes to the params.
  //=============================================================================
  public bool FilterPropertyElementList(string propertyID, GSObject[] listObjects, string[] listNames);


  // Obsolete, never implemented, do not use
  obsolete void SetPropertySelectedElementList(string propertyID, string[] elements) { }


  //=============================================================================
  // Name: GetPropertyName
  // Desc: Gets the localized human-readable name of the specified property.
  //=============================================================================
  string GetPropertyName(string propertyID);


  //=============================================================================
  // Name: GetPropertyDescription
  // Desc: Gets the localized description text for the named property.
  //=============================================================================
  string GetPropertyDescription(string propertyID);


  //=============================================================================
  // Name: GetPropertyType
  // Desc: Gets the type of the named property.
  //       This needs to be overridden in a child class to return a type for each
  //       property the class has, so that Trainz knows how to interact with that
  //       property.
  //       The default PropertyObject implementation will return a string with
  //       the value "null" (not to be confused with an empty or null string).
  //       
  // Parm: propertyID - ID of the property to return the type for
  // Retn: A string definition of the property type, and optional range data.
  //       Examples:
  //        "string,0,200"   | A string up to 200 characters in length
  //        "float,0,20,0.2" | A float in the range of 0-20, with incremental steps of 0.2
  //        "int,0,50,2"     | An integer in the range of 0-50, with incremental steps of 2
  //        "list,1"         | A list type with automatic sorting of added elements
  //        "list-or-string" | A list type that also allows manual entering of strings not in the list
  //        "link"           | A type which is manually implemented via a html link
  //        "map-object,TO"  | A MapObject type, with a category string of "TO" (trackside object)
  //        "asset-list,TK"  | An asset type, with a category string of "TK" (track)
  //=============================================================================
  string GetPropertyType(string propertyID);


  //=============================================================================
  // Name: GetPropertyValue
  // Desc: Gets the value of the named property as a string.
  //       In the PropertyObject implementation, this method will check for a
  //       property handler and if one exists, it will return what the handlers
  //       HTMLPropertyHandler::GetPropertyValue() method does. Otherwise, an
  //       empty string will be returned as a default.
  // Parm: propertyID - ID of the property to set the value of.
  // Retn: string - A string representation of the current value of the property,
  //       or an empty string if there is no such value or no valid conversion.
  //=============================================================================
  public string GetPropertyValue(string propertyID);



  //=============================================================================
  // Name: SetPropertyValue
  // Desc: Sets the value of the named property to the given string.
  //       In the PropertyObject implementation, this method will check for a
  //       property handler and if one exists, it will call the handlers
  //       SetPropertyValue() method to set the property.
  // Parm: propertyID - ID of the property to set the value of.
  // Parm: value - The string value to set the property to.
  //=============================================================================
  void SetPropertyValue(string propertyID, string value);

  //=============================================================================
  // Name: SetPropertyValue
  // Desc: Variant of SetPropertyValue used for "list" type properties.
  //       In the PropertyObject implementation, this method will check for a
  //       property handler and if one exists, it will call the handlers
  //       SetPropertyValue() method to set the property.
  //       For compatibility, the base implementation of this function also calls
  //       the SetPropertyValue(string,string) variant.
  // Parm: propertyID - ID of the property to set the value of.
  // Parm: value - The string value to set the property to.
  // Parm: index - The index of the item in the list to set.
  //=============================================================================
  void SetPropertyValue(string propertyID, string value, int index);

  //=============================================================================
  // Name: SetPropertyValue
  // Desc: Variant of SetPropertyValue used for property types which support
  //       selection of a generic script object. Currently used for "map-object"
  //       and "asset-list" properties.
  // Parm: propertyID - ID of the property to set the value of.
  // Parm: value - A script object to set the property value to. For map-object
  //       properties this will be a GameObjectID for the selected object, for
  //       asset lists it will be an Asset object for the selected asset.
  // Parm: readableName - A human readable name for the object passed. May be an
  //       empty string if no readable interpretation is possible, or no value
  //       is set. This is for display purposes only and not suitable for use as
  //       any kind of ID in script.
  //=============================================================================
  void SetPropertyValue(string propertyID, GSObject value, string readableName);

  //=============================================================================
  // Name: SetPropertyValue
  // Desc: Sets the value of the named property to the given float.
  //       In the PropertyObject implementation, this method will check for a
  //       property handler and if one exists, it will call the handlers
  //       SetPropertyValue() method to set the property.
  // Parm: propertyID - ID of the property to set the value of.
  // Parm: value - The float value to set the property to.
  //=============================================================================
  void SetPropertyValue(string propertyID, float value);

  //=============================================================================
  // Name: SetPropertyValue
  // Desc: Sets the value of the named property to the given int.
  //       In the PropertyObject implementation, this method will check for a
  //       property handler and if one exists, it will call the handlers
  //       SetPropertyValue() method to set the property.
  // Parm: propertyID - ID of the property to set the value of.
  // Parm: value - The integer value to set the property to.
  //=============================================================================
  void SetPropertyValue(string propertyID, int value);

  //=============================================================================
  // Name: LinkPropertyValue
  // Desc: Callback method for when a property of the type "link" is clicked on.
  //       In the PropertyObject implementation, this method will check for a
  //       property handler and if one exists, it will call the handlers
  //       SetPropertyValue() method to handle the link.
  // Parm: propertyID - ID of the property that was clicked.
  //=============================================================================
  void LinkPropertyValue(string propertyID);


  //=============================================================================
  // Name: PropertyBrowserRefresh
  // Desc: Called when the game wishes to refresh the property view in the
  //       specified browser. This method updates the browser with the HTML code
  //       provided by GetDescriptionHTML(). The handler's RefreshBrowser method
  //       will be used if a handler is present.
  //=============================================================================
  public void PropertyBrowserRefresh(Browser browser);


  //=============================================================================
  // Name: SetPropertyHandler
  // Desc: Sets the property handler for this property object. When a handler is
  ///      present in a property object, the various property methods of this 
  //       class will automatically call through to the property handler's to
  //       handle the properties.
  //       If there is no property handler assigned it will rely on its own
  //       property methods. This is how backward compatibility is maintained
  //       with older classes written before property handlers were introduced.
  // Parm: handler - Property handler to assign to this property object. The
  //       handler object should already be initialized and created for the
  //       specific use of the host property object. May be null.
  //=============================================================================
  public void SetPropertyHandler(HTMLPropertyHandler handler);


  //=============================================================================
  // Name: GetPropertyHandler
  // Desc: Gets the current property handler of this object, if any.
  //=============================================================================
  public HTMLPropertyHandler GetPropertyHandler(void);
  
  
  
  //! Library call function.
  //
  // This method provides a virtual function call and can be thought of as being the RPC function
  // of a library asset.  It is through this method that all library calls are to go and it must be
  // overridden if you want your library to do anything.
  //
  // How the arguments are used and processed to determine what to do is something left to the 
  // library author to decide on.  This means that any external code using your library would need
  // to use the function arguments as your implementation requires.  If your library is going to be
  // available for use by others, then you would need to specify and document how your LibraryCall()
  // method requires arguments
  //
  // The name of the library call is specified in the <i function> argument while parameters for the
  // library calls are provided for through the <i stringParam> and <i objectParam> arguments.
  //
  // It is worth taking special note of how <i objectParam> is an array of GSObject references.
  // GSObject is an empty generic parent class that various other %Trainz classes inherit from, so
  // a large variety of objects can be passed in through that parameter.
  //
  // It is recommended that caution is taken when processing the arguments in your implementation of
  // this method, especially if your library asset is intended for use by other content creators as 
  // you have no control over how they may use (or abuse!) your library.
  //
  // Some guidelines to follow if you want your library to be robust and bullet proof are:
  //  - Never assume the arguments are valid.  When processing the arguments, make sure they are not
  //    null before using them.  There is no need however to check an argument you don't use.
  //  - Make sure the elements in the parameter arrays exist before trying to use them.  This can be
  //    done by verifying the size of array and making sure the element is not null.
  //  - If using the <i objectParam> argument, <l gscLangKeyCast  cast> the array item to the type
  //    you are expecting and verify the cast.  There are no guarantees of what the object might be.
  //    A <l gscLangKeyCast  cast> will be needed to access the objects anyway as GSObject has no 
  //    methods or data members.  If the cast failed, the object the cast was assigned to will be 
  //    null.
  //
  // Here is an example implementation that although fairly useless functionality wise, does provide
  // a demonstration of how you might structure your own implementation:
  //
  //<code>
  //public string LibraryCall(string function, string[] stringParam, GSObject[] objectParam)
  //{
  //  if (function == "YakOn")
  //  {
  //    //# do something to enable the fun of Yak mode...
  //    if (stringParam and stringParam.size() and objectParam and objectParam.size())
  //    {
  //      if (stringParam[0] == "Vehicle")
  //      {
  //        Vehicle vehicle = cast<Vehicle> GSObject[0];
  //        if (vehicle)
  //        {
  //          Interface.Print("YakOn: Valid vehicle '" + vehicle.GetName() + "' found'");
  //          return "YakOn:ok:vehicle";
  //        }
  //        return "YakOn:bad:invalid vehicle object";
  //      }
  //      return "YakOn:bad:unknown object type '" + stringParam[0] + "'";
  //    }
  //    return "YakOn:bad:stringParam array null/too small";
  //  }
  //  if (function == "YakOff")
  //  {
  //    //# do something to get rid of that annoying Yak stuff...
  //    if (stringParam and stringParam.size())
  //    {
  //      if (stringParam[0] and stringParam[1]) //# we need two valid string parameters
  //      {
  //        Interface.Print("YakOff: Two param strings are: '" + stringParam[0] +
  //                        "' and: '" + stringParam[1] + "'");
  //        return "YakOff:ok";
  //      }
  //      return "YakOff:bad:empty string parameters!";
  //    }
  //    return "YakOff:bad:stringParam array null/too small";
  //  }
  //
  //  //# otherwise, do whatever parent function does
  //  return inherited(function, stringParam, objectParam);
  //}
  //</code>
  //
  // LibraryCall() may not be the most efficient way to handle a library function call and may seem
  // rather crude, but this is a temporary measure that will be replaced with a more elegant
  // direct-call interface in a future versions of %Trainz.  This library call mechanism however 
  // will still remain supported so existing library assets are not broken.
  //
  // Param:  function     Name of the virtual function call.
  // Param:  stringParam  Array of string parameters.
  // Param:  objectParam  Array of object parameters.
  //
  // Returns:
  //     Returns a string that acts as a generic library call return value.  How this return string
  //     is to be used is up to the library creator.
  //
  public string LibraryCall(string function, string[] stringParam, GSObject[] objectParam);
  


  //
  // Default Implementation
  //

  HTMLPropertyHandler m_propertyObjectHandler;

  public void SetPropertyHandler(HTMLPropertyHandler handler)
  {
    m_propertyObjectHandler = handler;
  }

  public HTMLPropertyHandler GetPropertyHandler(void)
  {
    return m_propertyObjectHandler;
  }


  public void SetProperties(Soup soup)
  {
    if (m_propertyObjectHandler  and  m_propertyObjectHandler.GetSavesProperties())
      m_propertyObjectHandler.SetProperties(soup);
  }

  public Soup GetProperties(void)
  {
    Soup soup;

    if (m_propertyObjectHandler  and  m_propertyObjectHandler.GetSavesProperties())
      soup = m_propertyObjectHandler.GetProperties();
    else
      soup = Constructors.NewSoup();

    return soup;
  }

  public string GetDescriptionHTML(void)
  {
    if (m_propertyObjectHandler)
      return m_propertyObjectHandler.GetDescriptionHTML() + "<br>";

    return "";
  }

  public string[] GetPropertyElementList(string propertyID)
  {
    if (m_propertyObjectHandler)
      return m_propertyObjectHandler.GetPropertyElementList(propertyID);

    string[] ret = new string[0];
    return ret;
  }

  public bool FilterPropertyElementList(string propertyID, GSObject[] listObjects, string[] listNames)
  {
    if (m_propertyObjectHandler)
      return m_propertyObjectHandler.FilterPropertyElementList(propertyID, listObjects, listNames);

    return false;
  }

  string GetPropertyName(string propertyID)
  {
    if (m_propertyObjectHandler)
      return m_propertyObjectHandler.GetPropertyName(propertyID);

    return Constructors.GetTrainzStrings().GetString1("property_object_property_name", (string)propertyID);
  }

  string GetPropertyDescription(string propertyID)
  {
    if (m_propertyObjectHandler)
      return m_propertyObjectHandler.GetPropertyDescription(propertyID);

    return "";
  }

  string GetPropertyType(string propertyID)
  {
    if (m_propertyObjectHandler)
      return m_propertyObjectHandler.GetPropertyType(propertyID);

    return "string";
  }
  
  public string GetPropertyValue(string propertyID)
  {
    if (m_propertyObjectHandler)
      return m_propertyObjectHandler.GetPropertyValue(propertyID);

    return "";
  }

  void SetPropertyValue(string propertyID, string value)
  {
    if (m_propertyObjectHandler)
    {
      PropertyValue htmlPropValue = new PropertyValue();
      htmlPropValue.Set(value);
      m_propertyObjectHandler.SetPropertyValue(propertyID, htmlPropValue);
    }
  }

  void SetPropertyValue(string propertyID, string value, int index)
  {
    if (m_propertyObjectHandler)
    {
      PropertyValue htmlPropValue = new PropertyValue();
      htmlPropValue.Set(value, index);
      m_propertyObjectHandler.SetPropertyValue(propertyID, htmlPropValue);
    }
    else
    {
      // Call the old version of the function for compatibility
      SetPropertyValue(propertyID, value);
    }
  }

  void SetPropertyValue(string propertyID, GSObject value, string readableName)
  {
    if (m_propertyObjectHandler)
    {
      PropertyValue htmlPropValue = new PropertyValue();
      htmlPropValue.Set(value, readableName);
      m_propertyObjectHandler.SetPropertyValue(propertyID, htmlPropValue);
    }
  }

  void SetPropertyValue(string propertyID, float value)
  {
    if (m_propertyObjectHandler)
    {
      PropertyValue htmlPropValue = new PropertyValue();
      htmlPropValue.Set(value);
      m_propertyObjectHandler.SetPropertyValue(propertyID, htmlPropValue);
    }
  }

  void SetPropertyValue(string propertyID, int value)
  {
    if (m_propertyObjectHandler)
    {
      PropertyValue htmlPropValue = new PropertyValue();
      htmlPropValue.Set(value);
      m_propertyObjectHandler.SetPropertyValue(propertyID, htmlPropValue);
    }
  }

  void LinkPropertyValue(string propertyID)
  {
    if (m_propertyObjectHandler)
    {
      PropertyValue htmlPropValue = new PropertyValue();
      htmlPropValue.Set();
      m_propertyObjectHandler.SetPropertyValue(propertyID, htmlPropValue);
    }
  }

  public void PropertyBrowserRefresh(Browser browser)
  {
    string html = GetDescriptionHTML();

    browser.LoadHTMLString(browser.GetAsset(), html);

    if (m_propertyObjectHandler)
      m_propertyObjectHandler.RefreshBrowser(browser);
  }



  public string LibraryCall(string function, string[] stringParam, GSObject[] objectParam)
  {
    // Default implementation. It's probably a good idea to inherit this if you don't handle
    // the function, however it isnt essential.

    Interface.Log("PropertyObject.LibraryCall> unknown function '" + function + "' was called");
    
    string ret;
    return ret;
  }
};

