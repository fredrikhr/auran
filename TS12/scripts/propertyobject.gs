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


  //! Gets a list of elements the user can select for the named property.
  //
  // This method is called to get the list of elements for the named property.  %Trainz will rely
  // on it to get the elements if a property is of type <n "list">, as returned by GetPropertyType(),
  // so it can then display them in a pop-up window for user selection.
  //
  // The script programmer is free to fill the returned elements array from the current game
  // environment and can create this dynamically if necessary (e.g. a list of industries in the
  // current route).  Remember that these elements will be presented to the user in a pop-up 
  // selection box, so be mindful of making them human-friendly and not too wide.
  //
  // In the PropertyObject implementation, this method will check for a property handler and if one
  // exists, it will return what the handler's <l HTMLPropertyHandler::GetPropertyElementList()  GetPropertyElementList>()
  // method does.  Otherwise, an empty list will be returned as a default.
  //
  // Param:  propertyID  Name of the property to get the list elements for.
  //
  // Returns:
  //     Returns an array of strings that list the elements in <i propertyID>.
  //
  // See Also:
  //     HTMLPropertyHandler::GetPropertyElementList()
  //
  public string[] GetPropertyElementList(string propertyID);

  //! Obsolete method.
  //
  // <b THIS METHOD WAS NEVER IMPLEMENTED AND IS OBSOLETE. DO NOT CALL IT. IT MAY BE REMOVED>.
  //
  void SetPropertySelectedElementList(string propertyID, string[] elements);


  //! Gets the localized human-readable name of the specified property.
  //
  // In the PropertyObject implementation, this method will check for a property handler and if one
  // exists, it will return what the handler's <l HTMLPropertyHandler::GetPropertyName()  GetPropertyName>()
  // method does.  Otherwise, a generic name will be returned as a default.
  //
  // Param:  propertyID  Name of the property to get the readable name for.
  //
  // Returns:
  //     Returns a human-readable name for <i propertyID>.
  //
  // See Also:
  //     HTMLPropertyHandler::GetPropertyName()
  //
  string GetPropertyName(string propertyID);

  //! Gets the localized description text for the named property.
  //
  // In the PropertyObject implementation, this method will check for a property handler and if one
  // exists, it will return what the handler's <l HTMLPropertyHandler::GetPropertyDescription()  GetPropertyDescription>()
  // method does.  Otherwise, a generic description will be returned as a default.
  //
  // Param:  propertyID  Name of the property to get a human-friendly readable description of.
  //
  // Returns:
  //     Returns the localized description text for <i propertyID>.
  //
  // See Also:
  //     HTMLPropertyHandler::GetPropertyDescription()
  //
  string GetPropertyDescription(string propertyID);

  //! Gets the type of the named property.
  //
  // This method is used by %Trainz to determine the type of the named property.  It is a method
  // that needs to be overridden in a child class to handle whatever properties that class has.
  //
  // The type of a property is defined as a string describing what type of data the property holds
  // as well as extra information about the range, size and increment count (depending on the 
  // property type).  Property types supported include <n string>, <n float>, <n int>, <n list> and
  // <n link>.  The returned string must be prefixed with one of these type names.
  //
  // You can optionally include the minimum and maximum range of the value for <n string>, <n float>
  // and <n int> types and the increment level for <n float> and <n int> types.  The <n list> type
  // has one optional parameter that may be 0 or 1 to disable or enable sorting of elements.
  // 
  // For example:
  // {[ Type String      | Description                                                             ]
  //  [ "string,0,200"   | A string that can be 0 through to 200 characters in length.             ]
  //  [ "float,0,20,0.2" | Float value in the range of [0.0 - 20.0] with incremental steps of 0.2. ]
  //  [ "int,0,50,2"     | Integer value in the range of [0 - 50] with incremental steps of 2.     ]
  //  [ "list,1"         | List type with sorting of added elements.                               ]
  //  [ "link"           | No extra options required.                                              ]}
  // 
  // Param:  propertyID  Name of the property to get the type information for.
  //
  // Returns:
  //     Returns a string describing the type of <i propertyID>.  The default PropertyObject 
  //     implementation will either return whatever the handler provides or <m"null"> (not to be
  //     confused with a <l gscLangKeyNull  null> value) if there is no handler.
  //
  // See Also:
  //     HTMLPropertyHandler::GetPropertyType()
  //
  string GetPropertyType(string propertyID);

  //! Gets the value of the named property as a string.
  //
  // In the PropertyObject implementation, this method will check for a property handler and if one
  // exists, it will return what the handler's <l HTMLPropertyHandler::GetPropertyValue()  GetPropertyValue>()
  // method does.  Otherwise, an empty string will be returned as a default.
  //
  // Param:  propertyID  Name of the property to get the value of as a string.
  //
  // Returns:
  //     Returns the value of <i propertyID> as a string.  Convert the result to <n float> or
  //     <n int> if required.
  //
  // See Also:
  //     HTMLPropertyHandler::GetPropertyValue()
  //
  public string GetPropertyValue(string propertyID);


  //
  // Sets the given property's value to the given value.
  //

  //! Sets the value of the named property.
  //
  // This method is called when a list property item is changed.
  //
  // In the PropertyObject implementation, this method will check for a property handler and if one
  // exists, it will call the handler's <l HTMLPropertyHandler::SetPropertyValue()  SetPropertyValue>()
  // method to set the property.
  //
  // Param:  propertyID  Name of the list property to set the value of.
  // Param:  value       String to set the property's value to.
  // Param:  index       Index of item from the list to set.
  //
  // Note:
  //     For compatibility, SetPropertyValue(string,string,int) should call SetPropertyValue(string,string).
  //
  // See Also:
  //     HTMLPropertyHandler::SetPropertyValue()
  //
  void SetPropertyValue(string propertyID, string value, int index);

  //! Sets the value of the named property to the given string.
  //
  // In the PropertyObject implementation, this method will check for a property handler and if one
  // exists, it will call the handler's <l HTMLPropertyHandler::SetPropertyValue()  SetPropertyValue>()
  // method to set the property.
  //
  // Param:  propertyID  Name of the property to set the value of.
  // Param:  value       String to set the value of the property named by <i propertyID> to.
  //
  // See Also:
  //     HTMLPropertyHandler::SetPropertyValue()
  //
  void SetPropertyValue(string propertyID, string value);

  //! Sets the value of the named property to given float.
  //
  // In the PropertyObject implementation, this method will check for a property handler and if one
  // exists, it will call the handler's <l HTMLPropertyHandler::SetPropertyValue()  SetPropertyValue>()
  // method to set the property.
  //
  // Param:  propertyID  Name of the property to set the value of.
  // Param:  value       Value to set the property named by <i propertyID> to.
  //
  // See Also:
  //     HTMLPropertyHandler::SetPropertyValue()
  //
  void SetPropertyValue(string propertyID, float value);

  //! Sets the value of the named property to given int.
  //
  // In the PropertyObject implementation, this method will check for a property handler and if one
  // exists, it will call the handler's <l HTMLPropertyHandler::SetPropertyValue()  SetPropertyValue>()
  // method to set the property.
  //
  // Param:  propertyID  Name of the property to set the value of.
  // Param:  value       Value to set the property named by <i propertyID> to.
  //
  // See Also:
  //     HTMLPropertyHandler::SetPropertyValue()
  //
  void SetPropertyValue(string propertyID, int value);


  //! Call-back method for when the named property of type <b link> is clicked on.
  //
  // This method is called by %Trainz if a property of type <b link> (as determined by
  // GetPropertyType()) is clicked on in a URL from the HTML page returned by GetDescriptionHTML().
  //
  // In the PropertyObject implementation, this method will check for a property handler and if one
  // exists, it will call the handler's <l HTMLPropertyHandler::SetPropertyValue()  SetPropertyValue>()
  // method to handle the link.
  //
  // Param:  propertyID  Name of the property clicked on.
  //
  // See Also:
  //     HTMLPropertyHandler::SetPropertyValue()
  //
  void LinkPropertyValue(string propertyID);


  //! Called when the game wishes to refresh the property view in the specified browser.
  //
  // This method updates the browser with the HTML code provided by GetDescriptionHTML().  The 
  // property handler's <l HTMLPropertyHandler::RefreshBrowser()  RefreshBrowser>() method will be
  // used if a handler is present.
  //
  // Param:  browser  Browser to place refreshed property view in.
  //
  // See Also:
  //     HTMLPropertyHandler::RefreshBrowser()
  //
  public void PropertyBrowserRefresh(Browser browser);


  //! Sets the property handler for this property object.
  //
  // When a handler is present in a property object, the various property methods of this class 
  // will automatically call through to the property handler's methods to handle the properties.
  // Hence we have the property handler taking over the role of handling properties for a property
  // object.
  //
  // If there is no property handler assigned to this object, it will rely on its own property
  // methods to handle properties.  This is how backward compatibility is maintained with older
  // classes written before property handlers were introduced.
  //
  // By setting a property handler, the current handler will be over-written by the new one.
  //
  // Param:  handler  Property handler to assign to this property object.  The handler object
  //                  should already be initialized and created for the specific use of the host
  //                  property object.  Use null to specify no handler.
  //
  public void SetPropertyHandler(HTMLPropertyHandler handler);

  //! Gets the current property handler of this object.
  //
  // Returns:
  //     Returns this property object's handler, null otherwise.
  //
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

  void SetPropertySelectedElementList(string propertyID, string[] elements)
  {
		// OBSOLETE
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
			PropertyValue xvalue = new PropertyValue();
			xvalue.Set(value);
			m_propertyObjectHandler.SetPropertyValue(propertyID, xvalue);
		}
  }

  void SetPropertyValue(string propertyID, float value)
  {
		if (m_propertyObjectHandler)
		{
			PropertyValue xvalue = new PropertyValue();
			xvalue.Set(value);
			m_propertyObjectHandler.SetPropertyValue(propertyID, xvalue);
		}
  }

  void SetPropertyValue(string propertyID, int value)
  {
		if (m_propertyObjectHandler)
		{
			PropertyValue xvalue = new PropertyValue();
			xvalue.Set(value);
			m_propertyObjectHandler.SetPropertyValue(propertyID, xvalue);
		}
  }

  void SetPropertyValue(string propertyID, string value, int index)
  {
		if (m_propertyObjectHandler)
		{
			PropertyValue xvalue = new PropertyValue();
			xvalue.Set(value, index);
			m_propertyObjectHandler.SetPropertyValue(propertyID, xvalue);
		}
		else
			// ..call the old version of the function..
			SetPropertyValue(propertyID, value);
  }

  void LinkPropertyValue(string propertyID)
  {
		if (m_propertyObjectHandler)
		{
			PropertyValue xvalue = new PropertyValue();
			xvalue.Set();
			m_propertyObjectHandler.SetPropertyValue(propertyID, xvalue);
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

