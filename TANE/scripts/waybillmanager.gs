//=============================================================================
// File: WaybillManager.gs
// Desc: 
//=============================================================================
include "Library.gs"
include "Browser.gs"
include "World.gs"
include "Industry.gs"


class WaybillManagerIndustry
{
  GameObject    m_location;
  Requirement[] m_waybills;
};


//=============================================================================
// Name: WaybillManager
// Desc: Creates and manages the Waybill window in Driver.
//
//  Messages posted by this system:
//  [ Major           | Minor                 | Source          | Destination ]
//  [ WaybillManager    WaybillsWindowShown     WaybillManager    Broadcast   ]
//  [ WaybillManager    WaybillsWindowHidden    WaybillManager    Broadcast   ]
//
//=============================================================================
game class WaybillManager isclass Library
{
  Browser       m_window;             // The waybill window, if currently open
  Requirement[] requirementsList;     // The current list of waybill requirements on the route
  Requirement   currentRequirement;   // The currently displayed waybill

  AsyncObjectSearchResult m_industrySearch;
  bool          m_bIndustrySearchComplete;


  // Forward declarations, see implementations further down for usage instructions
  public void SetWaybillsWindowVisible(bool show);
  public bool GetWaybillsWindowVisible(void) { return m_window != null; }
  public void ToggleWaybillsWindowVisible(void) { SetWaybillsWindowVisible(!GetWaybillsWindowVisible()); }

  public void UpdateWaybillsWindow(void);
  public void UpdateRequirementsList(void);

  public string LibraryCall(string function, string[] stringParam, GSObject[] objectParam);



  //=============================================================================
  // Name: Init
  // Desc: Initialises this library with it's asset
  //=============================================================================
  public void Init(Asset asset)
  {
    inherited(asset);

    if (asset)
      Interface.Log("WaybillManager.Init> " + asset.GetKUID().GetLogString());
    else
      Interface.Log("WaybillManager.Init> null asset init");

    AddHandler(me, "Browser", "Closed", "HandleBrowserClosed");
    AddHandler(me, "Browser-URL", "", "HandleBrowserURL");
    AddHandler(me, "ObjectSearch", "AsyncResult", "OnObjectSearchResult");

    // Search for a list of industries on the route
    m_bIndustrySearchComplete = false;
    m_industrySearch = World.GetNamedObjectList("IND", "");
    Sniff(m_industrySearch, "ObjectSearch", "AsyncResult", true);
  }


  //=============================================================================
  // Name: SetWaybillsWindowVisible
  // Desc: Sets whether the waybills window is currently visible. The window
  //       should only ever be hidden as a result of direct user action. Showing
  //       the window as an automated process may be acceptable in sessions.
  //=============================================================================
  public void SetWaybillsWindowVisible(bool show)
  {
    // No waybill window in touch interface versions
    if (TrainzScript.DoesInstallationProvideRight(TrainzScript.PRODUCTRIGHT_TOUCH_INTERFACE))
    {
      Interface.Log("WaybillsManager.SetWaybillsWindowVisible> Waybills not supported on touch interfaces");
      return;
    }

    if (show and !m_window)
    {
      m_window = Constructors.NewBrowser();
      //m_window.SetWindowStyle(Browser.STYLE_SLIM_FRAME);
      m_window.SetWindowSize(711, 332);

      Sniff(m_window, "Browser", "", true);
      Sniff(m_window, "Browser-URL", "", true);

      UpdateRequirementsList();
      UpdateWaybillsWindow();

      PostMessage(me, "WaybillManager", "WaybillsWindowShown", 0.0f);
    
      // Legacy support, do not rely on this message as it will eventually be removed
      Router.LegacyBroadcastMessage(me, "WaybillManager", "WaybillsWindowShown", 0.0f, true);
    }
    else if (!show and m_window)
    {
      m_window = null;

      PostMessage(me, "WaybillManager", "WaybillsWindowHidden", 0.0f);
    
      // Legacy support, do not rely on this message as it will eventually be removed
      Router.LegacyBroadcastMessage(me, "WaybillManager", "WaybillsWindowHidden", 0.0f, true);
    }
  }


  //=============================================================================
  // Name: GetUnitsString
  // Desc: Obsolete - Do not use.
  //       Returns a human-readable string describing the product required by an
  //       industry. Never completely implemented and not used internally. Avoid
  //       this function in favour of better (localised, etc) implementations.
  //=============================================================================
  public obsolete string GetUnitsString(int amount, Asset productType, MapObject objectInstance)
  {
    string ret;
    bool plural;
    
    if (amount < 0)
    {
      Interface.Exception("WaybillsManager.GetUnitsString> bad amount parameter");
      return "Unknown";
    }
    
    if (amount == 0)
    {
      ret = "No";
      plural = true;
    }
    else if (amount == 1)
    {
      ret = "One";
      plural = false;
    }
    else
    {
      ret = amount;
      plural = true;
    }
    
    if (plural)
      ret = ret + " units";
    else
      ret = ret + " unit";
    
    if (productType)
    {
      string productName = productType.GetLocalisedName();
      ret = ret + " of " + productName;
    }
    
    return ret;
  }


  //=============================================================================
  // Name: AppendRequirementList
  // Desc: Generates and returns a list of current requirements (i.e. waybills).
  //       This includes requirements of active industries placed in the world
  //       and artifical requirements generated by session rules.
  //=============================================================================
  public void AppendRequirementList(Requirement[] requirementsList)
  {
    int i;


    if (m_bIndustrySearchComplete)
    {
      int unloadedIndustryCount = 0;

      // Append current industry requirements
      NamedObjectInfo[] industryList = m_industrySearch.GetResults();
      for (i = 0; i < industryList.size(); ++i)
      {
        if (!industryList[i].objectRef)
        {
          // This industry isn't currently loaded. This is problematic as it means
          // it won't be producing or consuming product. It also means we can't
          // query it for waybills, but such issues are outside of our current
          // scope so we'll just skip over it for now.
          ++unloadedIndustryCount;
          continue;
        }

        Industry industry = cast<Industry>(industryList[i].objectRef);
        if (!industry)
        {
          // The object is loaded, but it's not actually an Industry. This may
          // happen if the content creator has attempted to fudge the asset
          // category data. We have no way to query its waybills though, so
          // we'll just ignore it for now.
          Interface.Log("WaybillManager.AppendRequirementList> WARNING: Returned object '" + industryList[i].objectRef.GetDebugName() + "' is not an Indstry");
          continue;
        }

        Requirement[] industryRequirements = industry.GetRequirements();
        if (!industryRequirements or !industryRequirements.size())
        {
          // Loaded, and an industry, but it doesn't want anything.
          continue;
        }

        int req;
        for (req = 0; req < industryRequirements.size(); ++req)
        {
          if (industryRequirements[req])
            requirementsList[requirementsList.size()] = industryRequirements[req];
        }
      }

      if (unloadedIndustryCount > 0)
      {
        Interface.Log("WaybillManager.AppendRequirementList> WARNING: Skipped " + unloadedIndustryCount + " unloaded industry objects");
        // TODO: If this becomes a valid condition we may want to consider a having a way to
        // show these 'far away' industries, and allow the player to manually load them for query.
      }
    }

    // Append session rule requirements
    ScenarioBehavior[] behaviors = World.GetBehaviors();
    for (i = 0; i < behaviors.size(); i++)
    {
      ScenarioBehavior behavior = behaviors[i];
      if (behavior)
      {
        Requirement[] behaviorRequirements = behavior.GetRequirements();
        if (behaviorRequirements)
        {
          int req;
          for (req = 0; req < behaviorRequirements.size(); ++req)
          {
            if (behaviorRequirements[req])
              requirementsList[requirementsList.size()] = behaviorRequirements[req];
          }
        }
      }
    }
  }


  //=============================================================================
  // Name: UpdateRequirementsList
  // Desc: Rebuilds the internal requirement list based on the world state.
  //=============================================================================
  public void UpdateRequirementsList(void)
  {
    requirementsList = new Requirement[0];
    AppendRequirementList(requirementsList);
  }


  //=============================================================================
  // Name: GetHTMLRequirementDescription
  // Desc: Returns a HTML description of the requirement passed. Used to display
  //       the currently selected waybill within the waybill window.
  //=============================================================================
  public string GetHTMLRequirementDescription(Requirement req)
  {
    if (!req)
      return "";

    StringTable coreStrTable = Constructors.GetTrainzStrings();

    ResourceRequirement res = cast<ResourceRequirement>(req);
    if (!res)
    {
      // Unsupported (legacy?) type
      Interface.WarnObsolete("(WaybillManager) Unsupported parameter. Update to ResourceRequirement class.");
      return coreStrTable.GetString("waybills-unknown-requirement");
    }

    Asset resource = res.GetResource();
    GameObject dest = res.GetDst();
    int amount = res.GetAmount();

    // Industry name
    string industryName;
    MapObject destMapObject = cast<MapObject>(dest);
    if (destMapObject)
      industryName = destMapObject.GetLocalisedName();

    if (industryName == "")
      industryName = coreStrTable.GetString("waybills-unknown-location");
    else
      industryName = BrowserInterface.Quote(industryName);

    // Product name
    string productName = "";
    if (res.GetResource())
      productName = res.GetResource().GetLocalisedName();

    if (productName == "")
      productName = coreStrTable.GetString("waybills-unknown-unit");

    if (amount > 0)
    {
      // Required to be dropped off
      if (amount == 1)
        return coreStrTable.GetString2("waybill_entry_required_one", productName, industryName);

      return coreStrTable.GetString3("waybill_entry_required_plr", (string)amount, productName, industryName);
    }
      
    if (amount < 0)
    {
      // Available to be picked up
      int altAmount = -amount;
      if (altAmount == 1)
        return coreStrTable.GetString2("waybill_entry_ready_one", productName, industryName);

      return coreStrTable.GetString3("waybill_entry_ready_plr", (string)altAmount, productName, industryName);
    }

    // Amount equals zero?
    return coreStrTable.GetString1("waybills-unknown-dest-requirement", industryName);
  }
  

  //=============================================================================
  // Name: GetHTMLRequirementIcon
  // Desc: Returns HTML for an icon for a specific resource requirement. Used in
  //       the windows waybill list.
  //=============================================================================
  public string GetHTMLRequirementIcon(Requirement req, string params)
  {
    ResourceRequirement res = cast<ResourceRequirement>(req);
    if (!res)
    {
      // Unsupported (legacy?) type
      Interface.WarnObsolete("(WaybillManager) Unsupported parameter. Update to ResourceRequirement class.");
    }
    else
    {
      Asset resource = res.GetResource();
      if (resource)
        return "<IMG kuid='" + resource.GetKUID().GetHTMLString() + "' width=48 height=48 " + params + ">";
    }

    
    return "<IMG src='missing-icon.tga' width=48 height=48>";
  }


  //=============================================================================
  // Name: UpdateWaybillsListBrowser
  // Desc: Regenerates the html for the browsers waybill list (if visible)
  //=============================================================================
  public void UpdateWaybillsListBrowser(void)
  {
    if (!m_window)
      return;

    string bodyText = "<HTML><BODY><TABLE inherit-font width=40>";

    int i;
    for (i = 0; i < requirementsList.size(); i++)
    {
      Requirement req = requirementsList[i];
      
      if (req)
      {
        bodyText = bodyText + "<tr height=54><td width=48><a href='live://req/" + i + "'>";
        string params = "";
        if (currentRequirement != req)
          params = "color=#BBBBBB";
        bodyText = bodyText + GetHTMLRequirementIcon(req, params);
        
        bodyText = bodyText + "</a></td></tr>";
      }
    }
    
    bodyText = bodyText + "</TABLE></BODY></HTML>";
    
    m_window.SetElementProperty("list", "html", bodyText);
  }
  
  
  //=============================================================================
  // Name: UpdateWaybillsWindow
  // Desc: Rebuilds the HTML for the waybills window (if it's visible).
  //=============================================================================
  public void UpdateWaybillsWindow(void)
  {
    if (!m_window)
      return;

    // Ensure we have something selected if possible
    if (!currentRequirement and requirementsList.size() > 0)
      currentRequirement = requirementsList[0];


    // Save the current window scroll value
    string scrollVal = m_window.GetElementProperty("list", "scroll");



    string bodyText = "";

    // Add the HTML for the (localised) background image
    bodyText = bodyText + me.GetAsset().GetStringTable().GetString("waybill_background_image");


    bodyText = bodyText + "<HTML><BODY><FONT color=#000000><TABLE inherit-font><TR><TD width=25></TD>";

      // Print left column sub-browser for waybill list
      bodyText = bodyText + "<TD><br><trainz-object style='browser' id='list' width=96 height=260></trainz-object></TD>";

      // Print right column sub-browser for current waybill
      bodyText = bodyText + "<TD width=100%><TABLE width=100% inherit-font><TR height=134><TD></TD></TR><TR><TD>";
      bodyText = bodyText + GetHTMLRequirementDescription(currentRequirement);
      bodyText = bodyText + "</TD></TR></TABLE></TD>";

    bodyText = bodyText + "</TR></TABLE></FONT></BODY></HTML>";


    // Load the html into the window
    m_window.LoadHTMLString(GetAsset(), bodyText);


    // Refresh the HTML in the list sub-browser
    UpdateWaybillsListBrowser();

    // Attempt to restore the previous window scroll
    m_window.SetElementProperty("list", "scroll", scrollVal);
  }


  //=============================================================================
  // Name: LibraryCall
  // Desc: Generic LibraryCall implementation, for external script interaction
  //=============================================================================
  public string LibraryCall(string function, string[] stringParam, GSObject[] objectParam)
  {
    if (function == "show-waybills-window")
    {
      SetWaybillsWindowVisible(true);
      return "";
    }

    if (function == "hide-waybills-window")
    {
      SetWaybillsWindowVisible(false);
      return "";
    }

    if (function == "toggle-waybills-window")
    {
      ToggleWaybillsWindowVisible();
      return "";
    }

    if (function == "update-waybills-window")
    {
      UpdateRequirementsList();
      UpdateWaybillsWindow();
      return "";
    }

    if (function == "get-waybills-window-visible")
      return (string)GetWaybillsWindowVisible();


    // Unknown function, check base class
    return inherited(function, stringParam, objectParam);
  }


  //=============================================================================
  // Name: HandleBrowserClosed
  // Desc: Internal handler for browser closed messages
  //=============================================================================
  void HandleBrowserClosed(Message msg)
  {
    if (msg.src and msg.src == m_window)
    {
      Sniff(m_window, "Browser", "", false);
      Sniff(m_window, "Browser-URL", "", false);

      PostMessage(me, "WaybillManager", "WaybillsWindowHidden", 0.0f);

      // Legacy support, do not rely on this message as it will eventually be removed
      Router.LegacyBroadcastMessage(me, "WaybillManager", "WaybillsWindowHidden", 0.0f, true);

      m_window = null;
    }
  }


  //=============================================================================
  // Name: HandleBrowserURL
  // Desc: Internal browser url handler. Responds link clicking in our browser.
  //=============================================================================
  void HandleBrowserURL(Message msg)
  {
    if (!msg.src or msg.src != m_window)
      return;

    if (msg.minor[0, 11] == "live://req/")
    {
      // List item clicked, update current waybill and rebuild html
      int index = Str.ToInt(msg.minor[11, ]);
      
      if (index >= 0 and index < requirementsList.size())
      {
        currentRequirement = requirementsList[index];
        UpdateWaybillsWindow();
      }
    }
  }


  //=============================================================================
  // Name: OnObjectSearchResult
  // Desc: Message handler for the completion of our industry search.
  //=============================================================================
  void OnObjectSearchResult(Message msg)
  {
    if (msg.src and msg.src == m_industrySearch)
    {
      m_bIndustrySearchComplete = true;

      // Ensure the window is updated if it's already visible
      UpdateWaybillsWindow();
    }
  }

};