//=============================================================================
// File: TrainzAssetSearch.gs
// Desc: Defines the TrainzAssetSearch class
//=============================================================================
include "Asset.gs"



//=============================================================================
// Name: TrainzAssetSearch
// Desc: Used to search the Trainz asset database (TAD) for specific assets.
//
//       Searches behave identically to the search filters in Content Manager
//       and the Surveyor search panel. For each filter type a type and value
//       must be supplied, failure to do so will result in script exceptions.
//       Sorting support by certain fields is also available via the
//       SearchAssetsSorted implementations.
//
//       Example usage:
//        
//        // Search for all valid local routes and sessions
//        int[] types = new int[6];
//        string[] vals = new string[6];
//        types[0] = TrainzAssetSearch.FILTER_CATEGORY;  vals[0] = "RT";
//        types[1] = TrainzAssetSearch.FILTER_OR;
//        types[2] = TrainzAssetSearch.FILTER_CATEGORY;  vals[2] = "SS";
//        types[3] = TrainzAssetSearch.FILTER_AND;
//        types[4] = TrainzAssetSearch.FILTER_LOCATION;  vals[4] = "local";
//        types[5] = TrainzAssetSearch.FILTER_VALID;     vals[5] = "true";
//
//        Asset[] assets = TrainzAssetSearch.SearchAssetsSorted(types, vals, TrainzAssetSearch.SORT_NAME, true);
//       
//=============================================================================
final static class TrainzAssetSearch
{
  // Filter types
  public define int FILTER_NONE         = 0;  // No filter, not valid for searching
  public define int FILTER_KEYWORD      = 1;  // Filter by asset name/keywords
  public define int FILTER_KIND         = 2;  // Filter by asset kind: e.g. "map"
  public define int FILTER_AUTHOR       = 3;  // Author name or id, e.g. "Auran"
  public define int FILTER_CATEGORY     = 4;  // Asset category: e.g. "YM;YP"
  public define int FILTER_LOCATION     = 5;  // Asset location: valid options are "local","dls","builtin"
  public define int FILTER_MIN_BUILD    = 6;  // Filter by minimum build: float, e.g. 3.6
  public define int FILTER_OBSOLETE     = 7;  // Whether the asset is obsolete: boolean, e.g. "true"
  public define int FILTER_UPDATE_AVAIL = 8;  // Whether an update's available for the asset: boolean
  public define int FILTER_KUID         = 9;  // Asset kuid, use KUID.GetLogString()
  public define int FILTER_VALID        = 10; // Return only valid assets (non-faulty, no missing/faulty 
                                              // dependencies, not locally disabled and not locally obsolete)
  public define int FILTER_PAYWARE      = 11; // Return only non purchased payware assets (this content will not be usable): boolean
  public define int FILTER_RATING       = 12; // Filter by a specific rating (int, -1 to 5 where -1 is unrated and 5 is favourited)

  // Filter group types. Filter groups are order dependent and will operate on
  // the filters following it in an array. AND groups cannot be nested, adding
  // one creates a new group. OR groups will nest within the previous AND group.
  public define int FILTER_AND          = 20; // Creates an AND group
  public define int FILTER_AND_NOT      = 21; // Creates an AND NOT group
  public define int FILTER_OR           = 22; // Creates an OR group


  public define int SORT_NAME           = 0;  // Sort by asset name
  public define int SORT_KUID           = 1;  // Sort by asset KUID
  public define int SORT_AUTHOR         = 2;  // Sort by author
  public define int SORT_BUILD          = 3;  // Sort by trainz-build
  public define int SORT_DATE_INSTALLED = 4;  // Sort by date installed/uploaded (for dls content)


  //=============================================================================
  // Name: SearchAssets
  // Desc: Performs a basic asset search with one filter type and value
  // Parm: filterType - What to filter by, FILTER_NONE is not a valid option
  // Parm: filterValue - The value to use when filtering
  // Retn: Asset[] - An array of Assets which pass the search filter
  //=============================================================================
  public native Asset[] SearchAssets(int filterType, string filterValue);


  //=============================================================================
  // Name: SearchAssets
  // Desc: Performs an asset search using multiple filters. Filter type and value
  //       arrays are matched by index.
  // Parm: filterTypes - An array of filter types to search with
  // Parm: filterValues - An array of filter values to search with
  // Retn: KUID[] - An array of Assets which pass the search filters
  //=============================================================================
  public native Asset[] SearchAssets(int[] filterTypes, string[] filterValues);


  //=============================================================================
  // Name: SearchAssetsSorted
  // Desc: Performs a basic asset search with one filter type and value, and
  //       returning a sorted result set
  // Parm: filterType - What to filter by, FILTER_NONE is not a valid option
  // Parm: filterValue - The value to use when filtering
  // Parm: sortedBy - What to sort by, see SORT_* defines above
  // Parm: sortAsc - true to sort ascending (e.g. a-z), false to sort descending
  // Retn: Asset[] - A sorted array of Assets which pass the search filter
  //=============================================================================
  public native Asset[] SearchAssetsSorted( int filterType, string filterValue,
                                            int sortedBy, bool sortAsc);


  //=============================================================================
  // Name: SearchAssets
  // Desc: Performs an asset search using multiple filters
  // Parm: filterTypes - An array of filter types to search with
  // Parm: filterValues - An array of filter values to search with
  // Parm: sortedBy - What to sort by, see SORT_* defines above
  // Parm: sortAsc - true to sort ascending (e.g. a-z), false to sort descending
  // Retn: Asset[] - A sorted array of Assets which pass the search filter
  //=============================================================================
  public native Asset[] SearchAssetsSorted(int[] filterTypes, string[] filterValues, int sortedBy, bool sortAsc);
};
