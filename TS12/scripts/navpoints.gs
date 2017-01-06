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
  public string   tMark = "";   // The name of the trackmark, trigger or vehicle to attach to
  public int      icon = 0;     // The icon types for this point, see NAVICON_*
  public string   text = "";    // Localised display text for this point (max 25 chars)
  public int      style = 0;    // The style of this nav point
};



//=============================================================================
// Name: NavPoints
// Desc: The main navigation point interface. Provides an interface for the
//       creation and management of nav points within Driver.
//
//       Messages broadcast from this class are as follows:
//        [     Major               |     Minor                              ]
//        [ "nav-point-reached"     | "<set id>-<nav point index>"           ]
//        [ "nav-set-complete"      | "<set id>"                             ]
//=============================================================================
final static class NavPoints
{
  //===========================================================================
  // Name: NAVICON_*
  // Desc: Icon style definitions, see NavPoint.icon
  //===========================================================================
  public define int NAVICON_GO_FORWARD  = 0;
  public define int NAVICON_GO_LEFT     = 1;
  public define int NAVICON_GO_RIGHT    = 2;
  public define int NAVICON_STOP        = 3;
  public define int NAVICON_TURNAROUND  = 4;
  public define int NAVICON_LOAD        = 5;
  public define int NAVICON_UNLOAD      = 6;
  public define int NAVICON_COUPLE      = 7;
  public define int NAVICON_DECOUPLE    = 8;
  public define int NAVICON_PASSENGER   = 9;
  public define int NAVICON_MAX = 10; // Identifier only, add new values above this


  //===========================================================================
  // Name: NAVSTYLE_*
  // Desc: Navigation point styles
  //===========================================================================
  public define int NAVSTLYE_AUTO             = 0;  // Nav points are completed automatically
  public define int NAVSTLYE_MANUAL           = 1;  // Nav points trigger script messages but must be
                                                    // completed manually (SetNavigationPointComplete)
  public define int NAVSTLYE_MAX = 2; // Identifier only, add new values above this


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
  // Parm: trainFilter - OPTIONAL - The trains that can complete these points
  // Retn: bool - true on success, false on failure
  //===========================================================================
  public bool CreateNavigationPointSet(string id, int mode, NavPoint[] points);
  public bool CreateNavigationPointSet(string id, int mode, NavPoint[] points, string[] trainFilter);


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



  //===========================================================================
  // Name: CreateNavigationPointSetInternal
  // Desc: Internal use only
  //===========================================================================
  native bool CreateNavigationPointSetInternal(string id, int style, Soup points, string[] trainFilter);



  //===========================================================================
  // Name: CreateNavigationPointSet
  // Desc: Creates a set of navigation points. Attempts to create multiple 
  //       navigation point sets using the same ID will fail.
  // Parm: id - Unique navigation point set identifier
  // Parm: style - One of the navigation point modes, eg. sequential
  // Parm: points - An ordered array of navigation points
  // Parm: trainFilter - Filters the list 
  // Retn: bool - true on success, false on failure
  //===========================================================================
  public bool CreateNavigationPointSet(string id, int style, NavPoint[] points, string[] trainFilter)
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
      data.SetNamedTag("tobj", points[i].tMark);
      data.SetNamedTag("icon", points[i].icon);
      data.SetNamedTag("text", points[i].text);
      data.SetNamedTag("style", points[i].style);

      nativePts.SetNamedSoup((string)i, data);
    }

    // Pass it down to native to plot the points
    return CreateNavigationPointSetInternal(id, style, nativePts, trainFilter);
  }


  //=============================================================================
  // Name: CreateNavigationPointSet
  //=============================================================================
  public bool CreateNavigationPointSet(string id, int style, NavPoint[] points)
  {
    return CreateNavigationPointSet(id, style, points, null);
  }
};

