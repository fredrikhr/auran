//=============================================================================
// Name: NavPoints.gs
// Desc: Defines the system used to create navigation points in the Driver 3D
//       world. Nav points are used to guide the player in their objectives.
//=============================================================================
include  "Soup.gs"
include  "Interface.gs"


//=============================================================================
// Name: NavPoint
// Desc: A simple class for holding data about an individual navigation point
//=============================================================================
class NavPoint
{
  public GameObjectID tMarkID;      // The name of the trackmark, trigger or vehicle to attach to
  public string       tMarkName;    // The localised display name of the trackmark
  public int          icon = 0;     // The icon types for this point, see NAVICON_*
  public string       text = "";    // Localised display text for this point (max 25 chars)
  public int          style = 0;    // The style of this nav point, see NAVSTLYE_*
  public int          target = 0;   // The location from which to calculate displayed distance

  public obsolete string tMark;     // Obsolete - Do not use.
};



//=============================================================================
// Name: NavPoints
// Desc: The main navigation point interface. Provides an interface for the
//       creation and management of nav points within Driver.
//
// Messages posted by this system:
//       [ Major              | Minor             | Source      | Destination ]
//       [====================================================================]
//       [ nav-point-reached  | <set id>-<index>  | NavPoints | NavPoints   ]
//       [ nav-set-complete   | <set id>          | NavPoints | NavPoints   ]
//       [ nav-point-clicked  | <set id>-<index>  | NavPoints | NavPoints   ]
//
// Where <set-id> is the navigation set ID as provided to the creation function
// and <index> is the index of the relevant nav point within the set.
//
// Legacy messages, which will be phased out and should not be used:
//       [ nav-point-reached  | <set id>-<index>  | DriverModule | Broadcast  ]
//       [ nav-set-complete   | <set id>          | DriverModule | Broadcast  ]
//       [ nav-point-clicked  | <set id>-<index>  | DriverModule | Broadcast  ]
//
//=============================================================================
final static class NavPoints isclass GameObject
{
  //===========================================================================
  // Name: NAVICON_*
  // Desc: Icon style definitions, see NavPoint.icon
  //===========================================================================
  public define int NAVICON_GO_FORWARD         = 0;
  public define int NAVICON_GO_LEFT            = 1;
  public define int NAVICON_GO_RIGHT           = 2;
  public define int NAVICON_STOP               = 3;
  public define int NAVICON_TURNAROUND         = 4;
  public define int NAVICON_LOAD               = 5;
  public define int NAVICON_UNLOAD             = 6;
  public define int NAVICON_COUPLE             = 7;
  public define int NAVICON_DECOUPLE           = 8;
  public define int NAVICON_PASSENGER          = 9;

  public define int NAVICON_INT_TOWER          = 10;

  public define int NAVICON_LOCATION           = 11;
  public define int NAVICON_LOCATION_CITY      = 12;
  public define int NAVICON_LOCATION_ENGINE    = 13;
  public define int NAVICON_LOCATION_FREIGHT   = 14;
  public define int NAVICON_LOCATION_HARBOUR   = 15;
  public define int NAVICON_LOCATION_INDUSTRY  = 16;
  public define int NAVICON_LOCATION_PASSENGER = 17;
  public define int NAVICON_LOCATION_STATION   = 18;
  public define int NAVICON_LOCATION_WAGON     = 19;
  public define int NAVICON_LOCATION_GREEN     = 20;
  public define int NAVICON_LOCATION_PURPLE    = 21;
  public define int NAVICON_LOCATION_YELLOW    = 22;
  public define int NAVICON_LOCATION_RED       = 23;
  public define int NAVICON_LOCATION_ORANGE    = 24;
  public define int NAVICON_LOCATION_AQUA      = 25;
  public define int NAVICON_LOCATION_BLUE      = 26;

  public define int NAVICON_MAX = 27; // Identifier only, add new values above this


  //===========================================================================
  // Name: NAVSTYLE_*
  // Desc: Navigation point styles
  //===========================================================================
  public define int NAVSTLYE_AUTO             = 0;  // Nav points are completed automatically
  public define int NAVSTLYE_MANUAL           = 1;  // Nav points trigger script messages but must be
                                                    // completed manually (SetNavigationPointComplete)
  public define int NAVSTLYE_REQUIRE_STOP     = 2;  // Nav points are completed automatically when train stops.
  public define int NAVSTLYE_MAX = 3; // Identifier only, add new values above this


  //===========================================================================
  // Name: NAVTARGET_*
  // Desc: Navigation point distance calculation modes (alters display only)
  //===========================================================================
  public define int NAVTARGET_VEHICLE         = 0;  // Distance is from the player train
  public define int NAVTARGET_CAMERA          = 1;  // Distance is from the player camera
  public define int NAVTARGET_MAX = 2; // Identifier only, add new values above this


  //===========================================================================
  // Name: NAVMODE_*
  // Desc: Navigation set modes
  //===========================================================================
  public define int NAVMODE_SEQUENTIAL        = 0;  // Each nav point *must* be visited in order.
  public define int NAVMODE_SEQUENTIAL_SKIP   = 1;  // Nav points are sequential but allow skipping. As such only
                                                    // the final point needs to be visited to complete the set.
  public define int NAVMODE_NON_SEQUENTIAL    = 2;  // Each nav point *must* be visited, but not necessarily in order.
  public define int NAVMODE_MAX = 3; // Identifier only, add new values above this


  //===========================================================================
  // Name: CreateNavigationPointSet
  // Desc: Creates a set of navigation points. Attempts to create multiple 
  //       navigation point sets using the same ID will fail.
  // Note: Sets may be hidden using SetNavigationPointSetVisible(), but are
  //       visible by default.
  // Parm: id - Unique navigation point set identifier
  // Parm: mode - One of the navigation point modes, eg. NAVMODE_SEQUENTIAL
  // Parm: points - An ordered array of navigation points
  // Parm: trainFilter - OPTIONAL - The IDs of the traincars that can complete
  //       these points
  // Retn: bool - true on success, false on failure
  //===========================================================================
  public bool CreateNavigationPointSet(string id, int mode, NavPoint[] points);
  public bool CreateNavigationPointSet(string id, int mode, NavPoint[] points, GameObjectID[] trainFilter);
  public obsolete bool CreateNavigationPointSet(string id, int mode, NavPoint[] points, string[] trainFilter);


  //===========================================================================
  // Name: SetNavigationPointComplete
  // Desc: Sets whether a specific navigation point within a set is complete.
  //       May also mark other points complete, depending on mode. Calling this
  //       will NOT generate "nav-point-reached" messages but may generate a
  //       "nav-set-complete" message if appropriate.
  // Parm: id - Unique navigation point set identifier
  // Parm: index - The index of the point within the ordered array or points
  // Parm: complete - true to set it complete, false to set it incomplete
  //===========================================================================
  public native void SetNavigationPointComplete(string id, int index, bool complete);


  //===========================================================================
  // Name: SetNavigationPointSetVisible
  // Desc: Sets whether a set of navigation points should be visible at the 
  //       current time. Visibility may also be subject to further rules.
  //===========================================================================
  public native void SetNavigationPointSetVisible(string id, bool visible);


  //===========================================================================
  // Name: ClearNavigationPointSet
  // Desc: Clears a set of navigation points
  // Parm: id - Unique navigation point set identifier
  //===========================================================================
  public native void ClearNavigationPointSet(string id);


  //===========================================================================
  // Name: IsNavigationPointSetComplete
  // Desc: Tests whether a set of navigation points has been completed
  // Parm: id - Unique navigation point set identifier
  // Retn: bool - true if the navigation point set is complete, false otherwise
  //===========================================================================
  public native bool IsNavigationPointSetComplete(string id);


  //=============================================================================
  // Name: GetNavigationPointIconDisplayName
  // Desc: Returns a localised name for the navigation point icon specified
  // Parm: icon - The icon type, see NAVICON_*
  //=============================================================================
  public native string GetNavigationPointIconDisplayName(int icon);


  //=============================================================================
  // Name: GetNavigationPointsVisible
  // Desc: Returns whether the navigation points overlay is visible
  //=============================================================================
  public native bool GetNavigationPointsVisible();


  //=============================================================================
  // Name: SetNavigationPointsVisible
  // Desc: Sets whether the navigation points overlay is visible
  //=============================================================================
  public native void SetNavigationPointsVisible(bool visible);


  //===========================================================================
  // Name: CreateNavigationPointSetInternal
  // Desc: Internal use only
  //===========================================================================
  native bool CreateNavigationPointSetInternal(string id, int style, Soup points, GameObjectID[] trainFilter);


  //===========================================================================
  // Name: CreateNavigationPointSet
  // Desc: Creates a set of navigation points. Attempts to create multiple 
  //       navigation point sets using the same ID will fail.
  // Parm: id - Unique navigation point set identifier
  // Parm: style - One of the navigation point modes, eg. sequential
  // Parm: points - An ordered array of navigation points
  // Parm: trainFilter - The IDs of the traincars that can complete this set
  // Retn: bool - true on success, false on failure
  //===========================================================================
  public bool CreateNavigationPointSet(string id, int style, NavPoint[] points, GameObjectID[] trainFilter)
  {
    if (id == "")
    {
      Interface.Exception("HTMLWindow.CreateNavigationPointSet> No ID set for navigation point set");
      return false;
    }

    if (style < 0 or style >= NAVMODE_MAX)
    {
      Interface.Exception("HTMLWindow.CreateNavigationPointSet> Invalid style, use one of the NAVMODE_* defines");
      return false;
    }

    // Transform this data to a Soup for native
    Soup nativePts = Constructors.NewSoup();

    int i;
    for (i = 0; i < points.size(); ++i)
    {
      if (points[i].icon < 0 or points[i].icon >= NAVICON_MAX)
      {
        Interface.Exception("HTMLWindow.CreateNavigationPointSet> Invalid icon, use one of the NAVICON_* defines");
        return false;
      }

      Soup data = Constructors.NewSoup();
      if (points[i].tMarkID)
        data.SetNamedTag("tobj-id", points[i].tMarkID);
      else
        data.SetNamedTag("tobj", points[i].tMark);
      data.SetNamedTag("icon", points[i].icon);
      data.SetNamedTag("text", points[i].text);
      data.SetNamedTag("style", points[i].style);
      data.SetNamedTag("target", points[i].target);

      nativePts.SetNamedSoup((string)i, data);
    }

    // Pass it down to native to plot the points
    return CreateNavigationPointSetInternal(id, style, nativePts, trainFilter);
  }

  
  //=============================================================================
  // Name: CreateNavigationPointSet
  //=============================================================================
  public obsolete bool CreateNavigationPointSet(string id, int style, NavPoint[] points, string[] vehicleNames)
  {
    GameObjectID[] trainFilter = new GameObjectID[0];

    int i;
    for (i = 0; i < vehicleNames.size(); ++i)
    {
      Vehicle vehicle = cast<Vehicle>(Router.GetGameObject(vehicleNames[i]));
      if (vehicle)
        trainFilter[trainFilter.size()] = vehicle.GetGameObjectID();
    }

    return CreateNavigationPointSet(id, style, points, trainFilter);
  }


  //=============================================================================
  // Name: CreateNavigationPointSet
  //=============================================================================
  public bool CreateNavigationPointSet(string id, int style, NavPoint[] points)
  {
    return CreateNavigationPointSet(id, style, points, new GameObjectID[0]);
  }
};

