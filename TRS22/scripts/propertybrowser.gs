//
// PropertyBrowser.gs
//
//  Copyright (C) 2004 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "HTMLPropertyHandler.gs"
include "Browser.gs"


//! Class that manages a Browser with a HTMLPropertyHandler.
//
// This class allows a HTML property handler to be used to produce and refresh the contents of a
// Browser window so the handlers are not restricted to just PropertyObject-derived classes.
//
// %Interface methods of this class are:
//  - public void                 <b Init>                (Browser browser, HTMLPropertyHandler handler)
//  - public void                 <b SetPropertyHandler>  (HTMLPropertyHandler handler)
//  - public HTMLPropertyHandler  <b GetPropertyHandler>  ()
//  - public void                 <b SetBrowser>          (Browser browser)
//  - public Browser              <b GetBrowser>          ()
//  - public void                 <b Refresh>             ()
//  - public bool                 <b HandleLink>          (string link)
//
// Note:
//     This class is <bi very limited> at this point in time.  It won't correctly support editable
//     properties and should only be used for display purposes and for "link" properties.
//
// See Also:
//     Browser, HTMLPropertyHandler
//
class PropertyBrowser
{
	// Sets the property handler.
	public void SetPropertyHandler(HTMLPropertyHandler handler);

	// Gets the property handler.
	public HTMLPropertyHandler GetPropertyHandler(void);

	// Sets the browser.
	public void SetBrowser(Browser browser);

	// Gets the browser.
	public Browser GetBrowser(void);

	// Refreshes the browser window.
	public void Refresh(void);

	// Handles a URL click on the browser window.
	public bool HandleLink(string link);

	// Initializes this object with given browser and handler.
	public void Init(Browser browser, HTMLPropertyHandler handler);


	//
	// PRIVATE IMPLEMENTATION
	//



	HTMLPropertyHandler m_handler;
	Browser m_browser;


	
	public void Init(Browser browser, HTMLPropertyHandler handler)
	{
		m_browser = browser;
		m_handler = handler;
		Refresh();
	}


	public void SetPropertyHandler(HTMLPropertyHandler handler)
	{
		m_handler = handler;
	}


	public HTMLPropertyHandler GetPropertyHandler(void)
	{
		return m_handler;
	}


	public void SetBrowser(Browser browser)
	{
		m_browser = browser;
	}


	public Browser GetBrowser(void)
	{
		return m_browser;
	}


	public void Refresh(void)
	{
		if (!m_browser)
			return;
		
		string html = "";

		if (m_handler)
			html = m_handler.GetDescriptionHTML();


		m_browser.LoadHTMLString(m_browser.GetAsset(), html);
	}


	public bool HandleLink(string link)
	{
		if (!m_handler)
			return false;

		if (link[0, 16] != "live://property/")
			return false;
		
		link[0, 16] = null;


		string type = m_handler.GetPropertyType(link);
		

		if (type == "link")
		{
			// handle a click on a 'link' property

			PropertyValue value = new PropertyValue();
			value.Set();
			m_handler.SetPropertyValue(link, value);

			return true;
		}

		return false;
	}

};


