//
// WaybillManager.gs
//
//  Copyright (C) 2004 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "Library.gs"
include "Browser.gs"
include "World.gs"
include "Industry.gs"


//
// Manages/creates the Waybill window in Driver when called by the DriverModule script.
// Is not part of the API.
//
game class WaybillManager isclass Library
{
  //
  public void SetWaybillsWindowVisible(bool show);
  
  //
  public bool GetWaybillsWindowVisible(void);
  
  //
  public void ToggleWaybillsWindowVisible(void);
  
  //
  public void UpdateWaybillsWindow(void);
  public void UpdateRequirementsList(void);

  //
  // "show-waybills-window"
  // "hide-waybills-window"
  // "toggle-waybills-window"
  // "update-waybills-window"
  // "get-waybills-window-visible"
  //
  public string LibraryCall(string function, string[] stringParam, GSObject[] objectParam);


  //
  // Messages broadcast:
  //
  //  "WaybillManager", "WaybillsWindowShown"
  //  "WaybillManager", "WaybillsWindowHidden"
  //


  //
  // INTERNAL IMPLEMENTATION
  //
  
  Browser m_window;
  Requirement currentRequirement;
  Requirement[] requirementsList;
  
  
  public void Init(Asset self)
  {
    inherited(self);
    
    AddHandler(me, "Browser-Closed", "", "HandleBrowserClosed");
    AddHandler(me, "Browser-URL", "", "HandleBrowserURL");
  }
  
  
  public void SetWaybillsWindowVisible(bool show)
  {
    // no waybill window in touch interface version
    if (show and !(TrainzScript.DoesInstallationProvideRight(TrainzScript.PRODUCTRIGHT_TOUCH_INTERFACE)))
    {
      if (m_window)
        return;
      
      m_window = Constructors.NewBrowser();
      //m_window.SetWindowStyle(Browser.STYLE_SLIM_FRAME);
      m_window.SetWindowSize(711, 332);
      
      UpdateRequirementsList();
      UpdateWaybillsWindow();
      
      Router.PostMessage(GetId(), Router.MESSAGE_BROADCAST, "WaybillManager", "WaybillsWindowShown", 0.0f);
    }
    else
    {
      m_window = null;
      
      Router.PostMessage(GetId(), Router.MESSAGE_BROADCAST, "WaybillManager", "WaybillsWindowHidden", 0.0f);
    }
  }
  
  
  public bool GetWaybillsWindowVisible(void)
  {
    return (m_window != null);
  }
  
  
  public void ToggleWaybillsWindowVisible(void)
  {
    SetWaybillsWindowVisible(!GetWaybillsWindowVisible());
  }
  
  
  //
  // TODO: There should be a global, overridable, mechanism for this.
  //  This should also allow instanced overrides via BaseIndustry.
  //
  // <amount> must be >= 0.
  // <productType> may be null if the product type is unknown.
  // <objectInstance> should be passed as NULL if a particular instance is not required.
  //
  public string GetUnitsString(int amount, Asset productType, MapObject objectInstance)
  {
    string ret;
    bool plural;
    
    if (amount < 0)
    {
      Interface.Exception("GetUnitsString> bad amount parameter");
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
  
  //
  // TODO: This should be a member of the Requirement class to enable overrides.
  //
  public string GetHTMLRequirementDescription(Requirement req)
  {
    StringTable coreStrTable = Constructors.GetTrainzStrings();
    ResourceRequirement res = cast<ResourceRequirement>(req);
    
    if (res)
    {
      Asset resource = res.GetResource();
      GameObject dest = res.GetDst();
      int amount = res.GetAmount();

      // destination name
      string destName;
      MapObject destMapObject = cast<MapObject>(dest);
      if (destMapObject)
        destName = destMapObject.GetLocalisedName();
        
      if (destName == "")
        destName = coreStrTable.GetString("waybills-unknown-location");
      else
        destName = BrowserInterface.Quote(destName);

      // product name
      string productName = "";
      if (res.GetResource())
        productName = res.GetResource().GetLocalisedName();

      if (productName == "")
        productName = coreStrTable.GetString("waybills-unknown-unit");

      if (amount > 0)
      {
        // required at (for drop-off)
        if (amount == 1)
          return coreStrTable.GetString2("waybill_entry_required_one", productName, destName);

        return coreStrTable.GetString3("waybill_entry_required_plr", (string)amount, productName, destName);
      }
      else if (amount < 0)
      {
        // ready to be removed from (for pickup)
        int altAmount = -amount;
        if (altAmount == 1)
          return coreStrTable.GetString2("waybill_entry_ready_one", productName, destName);

        return coreStrTable.GetString3("waybill_entry_ready_plr", (string)altAmount, productName, destName);
      }
      else
      {
        // unknown requirement
        return coreStrTable.GetString1("waybills-unknown-dest-requirement", destName);
      }
    }
    
    // unhandled Requirement type
    return coreStrTable.GetString("waybills-unknown-requirement");
  }
  
  //
  public string GetHTMLRequirementIcon(Requirement req, string params)
  {
    ResourceRequirement res = cast<ResourceRequirement>(req);
    
    if (res)
    {
      Asset resource = res.GetResource();
      
      if (resource)
        return "<IMG kuid='" + resource.GetKUID().GetHTMLString() + "' width=48 height=48 " + params + ">";
    }
    
    return "<IMG src='missing-icon.tga' width=48 height=48>";
  }
  
  
  //
  // Append a list of all current Requirements for this layout.
  //
  public void AppendRequirementList(Requirement[] requirementsList)
  {
    //
    // Append all Industry requirements
    //
    GameObject[] industries = World.GetIndustryList();
    int i;
    for (i = 0; i < industries.size(); i++)
    {
      Industry industry = cast<Industry>(industries[i]);
      if (industry)
      {
        Requirement[] industryRequirements = industry.GetRequirements();
        if (industryRequirements)
        {
          int req;
          for (req = 0; req < industryRequirements.size(); req++)
            requirementsList[requirementsList.size()] = industryRequirements[req];
        }
      }
    }
    
    //
    // Append all Rule requirements
    //
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
          for (req = 0; req < behaviorRequirements.size(); req++)
            requirementsList[requirementsList.size()] = behaviorRequirements[req];
        }
      }
    }
  }
  
  
  //
  // Update the requirements list.
  //
  public void UpdateRequirementsList(void)
  {
    //
    // Determine the current requirements list for this layout.
    //
    requirementsList = new Requirement[0];
    AppendRequirementList(requirementsList);
  }
  
  
  //
  // Update the waybills list sub-browser.
  //
  public void UpdateWaybillsListBrowser(void)
  {
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
  
  
  //
  // Update the contents of the Waybills window, if it is visible.
  //
  public void UpdateWaybillsWindow(void)
  {
    if (!m_window)
      return;
    
    
    int i;
    for (i = 0; i < requirementsList.size(); i++)
    {
      Requirement req = requirementsList[i];
      
      if (req)
      {
        if (!currentRequirement)
          currentRequirement = req;
      }
    }

    // Save the window scroll
    string scrollVal = m_window.GetElementProperty("list", "scroll");

    //
    // Create the HTML
    //
    string bodyText = "";
    
    // background image
    bodyText = bodyText + me.GetAsset().GetStringTable().GetString("waybill_background_image");
    
    // main table and spacing column
    bodyText = bodyText + "<HTML><BODY><FONT color=#000000><TABLE inherit-font><TR><TD width=25></TD>";
    
    // side list of waybills
    //  50,12 .. 124,283
    bodyText = bodyText + "<TD>";
    
    bodyText = bodyText + "<br><trainz-object style='browser' id='list' width=96 height=260></trainz-object>";
    
    bodyText = bodyText + "</TD>";
    
    // current waybill
    //  144,137 .. 541,280
    if (currentRequirement)
    {
      bodyText = bodyText + "<TD width=100%><TABLE width=100% inherit-font><TR height=134><TD></TD></TR><TR><TD>";
      
      bodyText = bodyText + GetHTMLRequirementDescription(currentRequirement);
      
      bodyText = bodyText + "</TD></TR></TABLE></TD>";
    }
    
    // 
    
    bodyText = bodyText + "</TR></TABLE> </FONT></BODY></HTML>";
    m_window.LoadHTMLString(GetAsset(), bodyText);

    UpdateWaybillsListBrowser();

    // Restore the window scroll
    m_window.SetElementProperty("list", "scroll", scrollVal);
  }


  //
  // Respond to a LibraryCall.
  //
  public string LibraryCall(string function, string[] stringParam, GSObject[] objectParam)
  {
    string ret;

    if (function == "show-waybills-window")
    {
      SetWaybillsWindowVisible(true);
    }
    else if (function == "hide-waybills-window")
    {
      SetWaybillsWindowVisible(false);
    }
    else if (function == "toggle-waybills-window")
    {
      ToggleWaybillsWindowVisible();
    }
    else if (function == "update-waybills-window")
    {
      UpdateRequirementsList();
      UpdateWaybillsWindow();
    }
    else if (function == "get-waybills-window-visible")
    {
      ret = GetWaybillsWindowVisible();
    }
    else
    {
      return inherited(function, stringParam, objectParam);
    }

    return ret;
  }

  void HandleBrowserClosed(Message msg)
  {
    if (msg.src == m_window  and  m_window)
    {
      Router.PostMessage(GetId(), Router.MESSAGE_BROADCAST, "WaybillManager", "WaybillsWindowHidden", 0.0f);
      m_window = null;
    }
  }

  void HandleBrowserURL(Message msg)
  {
    if (msg.src != m_window  and  m_window)
      return;

    if (msg.minor[0, 11] == "live://req/")
    {
      int index = Str.ToInt(msg.minor[11, ]);
      
      if (index >= 0  and  index < requirementsList.size())
      {
        currentRequirement = requirementsList[index];
        UpdateWaybillsWindow();
      }
    }
  }
  
};