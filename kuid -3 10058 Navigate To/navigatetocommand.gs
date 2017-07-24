//=============================================================================
// File: NavigateToCommand.gs
// Desc: 
//=============================================================================
include "DriverCommand.gs"
include "World.gs"
include "Industry.gs"
include "NavigateToScheduleCommand.gs"



//=============================================================================
// Desc: Struct containing basic data about a possible place to "Navigate To"
//=============================================================================
class IndustryDestination
{
  public GameObjectID industryID;
  public string       industryName;
  public string       industryTrack;
};



//=============================================================================
// Name: NavigateToCommand
// Desc: Driver command that allows a driver character to take a train to or a
//       specific track in a destination industry.
//=============================================================================
class NavigateToCommand isclass DriverCommand
{
  Menu                  m_cachedIndustryMenu;
  IndustryDestination[] m_menuItemData;

  thread void CacheIndustryMenu();


  //=============================================================================
  // Name: Init
  // Desc: 
  //=============================================================================
  public void Init(Asset asset)
  {
    inherited(asset);

    // Industries aren't added/removed at runtime, so we only need to build this once
    CacheIndustryMenu();

    AddHandler(me, "IndustryMenuItemSelected", "", "OnIndustryMenuItemSelected");
  }



  //=============================================================================
  // Name: AddCommandMenuItem
  // Desc: Builds the context menu for adding an instance of this command to a
  //       driver command schedule.
  //=============================================================================
  public void AddCommandMenuItem(DriverCharacter driver, Menu menu)
  {
    StringTable strTable = GetAsset().GetStringTable();

    if (m_cachedIndustryMenu)
    {
      // The menu is cached, just add it (if there's any point) and return
      if (m_cachedIndustryMenu.CountItems() > 0)
        menu.AddSubmenu(GetAsset().GetLocalisedName() + " >", m_cachedIndustryMenu);

      // Outside of Driver this menu may need rebuilding
      if (World.GetCurrentModule() != World.DRIVER_MODULE)
      {
        m_cachedIndustryMenu = null;
        CacheIndustryMenu();
      }

      return;
    }

    // Menu is still building, show a placeholder item (this should be rare)
    Menu submenu = Constructors.NewMenu();
    submenu.AddItem(strTable.GetString("menu_building_please_wait"), me, "-", "");
    menu.AddSubmenu(GetAsset().GetLocalisedName() + " >", submenu);
  }


  //=============================================================================
  // Name: CacheIndustryMenu
  // Desc: 
  //=============================================================================
  thread void CacheIndustryMenu()
  {
    if (m_cachedIndustryMenu)
      return;

    AsyncObjectSearchResult searchObject = World.GetNamedObjectList("IND", "");
    Sniff(searchObject, "ObjectSearch", "AsyncResult", true);

    Message msg;
    wait()
    {
      on "ObjectSearch", "AsyncResult", msg:
        if (msg.src != searchObject)
          continue;

        break;
    }

    StringTable strTable = GetAsset().GetStringTable();
    Menu newMenu = Constructors.NewMenu();

    NamedObjectInfo[] searchResults = searchObject.GetResults();
    if (!searchResults.size())
    {
      newMenu.AddItem(strTable.GetString("menu_none_found"), me, "-", "");
    }
    else
    {
      m_menuItemData = new IndustryDestination[0];

      int i;
      for (i = 0; i < searchResults.size(); ++i)
      {
        if (!searchResults[i].objectRef)
        {
          // Object isn't loaded yet, perform a search to request it
          searchObject = World.GetGameObjectByID(searchResults[i].objectId);
          wait()
          {
            on "ObjectSearch", "AsyncLoadComplete", msg:
              if (msg.src != searchObject)
                continue;

              break;
          }

          // Skip over any items which fail to load
          if (searchObject.GetResults().size() == 0)
            continue;

          // Copy the NamedObjectInfo from the load request
          searchResults[i] = searchObject.GetResults()[0];
        }

        Industry industry = cast<Industry>(searchResults[i].objectRef);
        if (!industry)
          continue;

        string[] locationNames = new string[0];
        string[] locationTracks = new string[0];
        industry.AppendDriverDestinations(locationNames, locationTracks);

        if (locationNames.size() > 0)
        {
          // Create a submenu with options for each destination track
          Menu submenu = Constructors.NewMenu();

          int j;
          for (j = 0; j < locationNames.size(); ++j)
          {
            if (locationNames[j] and locationNames[j].size() and locationTracks[j] and locationTracks[j].size())
            {
              IndustryDestination data = new IndustryDestination();
              data.industryID = searchResults[i].objectId;
              data.industryName = searchResults[i].localisedUsername;
              data.industryTrack = locationTracks[j];

              int index = m_menuItemData.size();
              m_menuItemData[index] = data;

              submenu.AddItem(locationNames[j], me, "IndustryMenuItemSelected", (string)index);
              ++index;
            }
          }

          newMenu.AddSubmenu(searchResults[i].localisedUsername + " >", submenu);
        }
        else
        {
          // No destination names, add a single entry for the industry
          IndustryDestination data = new IndustryDestination();
          data.industryID = searchResults[i].objectId;
          data.industryName = searchResults[i].localisedUsername;

          int index = m_menuItemData.size();
          m_menuItemData[index] = data;

          newMenu.AddItem(searchResults[i].localisedUsername, me, "IndustryMenuItemSelected", (string)index);
          ++index;
        }
      }

      // Split the menu into submenus if necessary
      newMenu.SubdivideItems();
    }

    // Don't set the menu until completion, to avoid the possibility of showing
    // it while it's still building
    m_cachedIndustryMenu = newMenu;
  }


  void PlayConfirmation(void)
  {
    Library libCommandSounds = World.GetLibrary(GetAsset().LookupKUIDTable("command-sounds"));
    if (libCommandSounds)
      libCommandSounds.LibraryCall("PlayConfirmation", null, null);
  }


  DriverScheduleCommand CreateScheduleCommand(DriverCharacter driver, Soup soup)
  {
    NavigateToScheduleCommand cmd = new NavigateToScheduleCommand();
    cmd.Init(driver, me);
    cmd.SetProperties(soup);
    return cast<DriverScheduleCommand>(cmd);
  }


  //=============================================================================
  // Name: OnIndustryMenuItemSelected
  // Desc: 
  //=============================================================================
  void OnIndustryMenuItemSelected(Message msg)
  {
    DriverCommands commands = GetDriverCommands(msg);
    DriverCharacter driver = cast<DriverCharacter>(msg.src);

    int menuItemID = Str.ToInt(msg.minor);
    if (menuItemID < 0 or menuItemID >= m_menuItemData.size())
      return;

    Soup commandSoup = Constructors.NewSoup();
    commandSoup.SetNamedTag("industryID", m_menuItemData[menuItemID].industryID);
    commandSoup.SetNamedTag("industryName", m_menuItemData[menuItemID].industryName);
    commandSoup.SetNamedTag("trackName", m_menuItemData[menuItemID].industryTrack);

    DriverScheduleCommand cmd = CreateScheduleCommand(driver, commandSoup);
    commands.AddDriverScheduleCommand(cmd);

    if (driver)
      PlayConfirmation();
  }
  
};


