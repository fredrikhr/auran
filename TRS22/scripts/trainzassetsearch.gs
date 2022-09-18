//=============================================================================
// File: TrainzAssetSearch.gs
// Desc: Defines the TrainzAssetSearch class
//=============================================================================
include "Asset.gs"
include "AsyncQueryHelper.gs"



//=============================================================================
// Name: AsyncTrainzAssetSearchObject
// Desc: Stores search parameters and results for an asynchronous asset search
// Note: Read the TrainzAssetSearch comments below for usage instructions
//=============================================================================
class AsyncTrainzAssetSearchObject isclass AsyncQueryHelper
{
  //===========================================================================
  // Name: GetResults
  // Desc: Returns the results of the search. If the search is not yet complete
  //       calling this will throw an exception.
  //===========================================================================
  public native Asset[] GetResults();


  //=============================================================================
  // Name: GetSearchErrorCode
  // Desc: Returns any relevant error or warning code for this search.
  // Retn: int - An integer error/warning code (as defined on AsyncQueryHelper).
  //=============================================================================
  public native int GetSearchErrorCode();
  public int GetQueryErrorCode() { return GetSearchErrorCode(); }


  //=============================================================================
  // Name: GetMessageMajor
  // Desc: Returns the custom message major param used by this class. Exists for
  //       compatibility support only, since this class was originally added
  //       before the AsyncQueryHelper base class (then merged for code reuse).
  //=============================================================================
  public string GetMessageMajor() { return "TrainzAssetSearch"; }

};



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
//
//        Each asset search function also has an asynchronous equivalent. To
//        perform an asynchronous search first create a new AsyncTrainzAssetSearchObject
//        object by calling TrainzAssetSearch.NewAsyncSearchObject() with meaningful a msgMinor
//        then call the AsyncSearch* function of your choice with that object. This
//        will spawn a new thread in native to perform the query and when the results
//        are available a ("TrainzAssetSearch", "AsyncResult") message will be
//        posted to the AsyncTrainzAssetSearchObject object.
//
//=============================================================================
final static class TrainzAssetSearch isclass GameObject
{
  // Filter types
  public define int FILTER_NONE           = 0;  // No filter, not valid for searching
  public define int FILTER_KEYWORD        = 1;  // Filter by asset name/keywords
  public define int FILTER_KIND           = 2;  // Filter by asset kind: e.g. "map"
  public define int FILTER_AUTHOR         = 3;  // Author name or id, e.g. "Auran"
  public define int FILTER_CATEGORY       = 4;  // Asset category: e.g. "YM;YP" (see AssetCategory in asset.gs)
  public define int FILTER_LOCATION       = 5;  // Asset location: valid options are "local","dls","builtin"
  public define int FILTER_MIN_BUILD      = 6;  // Filter by minimum build: float, e.g. 3.6
  public define int FILTER_OBSOLETE       = 7;  // Whether the asset is obsolete: boolean, e.g. "true"
  public define int FILTER_UPDATE_AVAIL   = 8;  // Whether an update's available for the asset: boolean
  public define int FILTER_KUID           = 9;  // Asset kuid, use KUID.GetHTMLString()
  public define int FILTER_VALID          = 10; // Return only valid assets (non-faulty, no missing/faulty 
                                                // dependencies, not locally disabled and not locally obsolete)
  public define int FILTER_PAYWARE        = 11; // Return only payware assets, whether purchased or not: boolean
  public define int FILTER_RATING         = 12; // Filter by a specific rating (int, -1 to 5 where -1 is unrated and 5 is favourited)
  public define int FILTER_IN_ASSET_GROUP = 13; // Filter to assets beloning to a specific group (asset-group kuid, use KUID.GetHTMLString())
  public define int FILTER_AUTHORISED     = 14; // Return only authorised assets, whether payware or not: boolean
  public define int FILTER_NEWLY_INSTALLED = 15; // Return assets flagged as newly installed: boolean
  public define int FILTER_DEPENDENCIES   = 16; // Returns dependencies of an asset, use KUID.GetHTMLString()
  public define int FILTER_DEPENDANTS     = 17; // Returns dependants of an asset, use KUID.GetHTMLString()

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
  // Name: GetCategoryStringForAssetKind
  // Desc: Returns a category string for a specific asset "kind". For more asset
  //       category info/definitions, see AssetCategory in asset.gs.
  // Parm: kind - An asset kind as specified in an asset config.txt file
  // Retn: string - An asset category string suitable for use with modern asset
  //       search functions on TrainzAssetSearch or "asset-list" properties
  //=============================================================================
  public native string GetCategoryStringForAssetKind(string assetKind);


  //=============================================================================
  // Name: AsyncSearchAssets
  // Desc: Performs a basic asset search with one filter type and value
  // Parm: filterType - What to filter by, FILTER_NONE is not a valid option
  // Parm: filterValue - The value to use when filtering
  // Parm: resultObj - The query object, allocated using 
  //       TrainzAssetSearch.NewAsyncSearchObject(). This function runs 
  //       asynchronously and may take some non-trivial amount of time to 
  //       execute. Results are returned via this object. If the object is 
  //       released prior to results being returned, any results are discarded.
  //=============================================================================
  obsolete public native Asset[] SearchAssets(int filterType, string filterValue);
  public native void AsyncSearchAssets(int filterType, string filterValue, AsyncTrainzAssetSearchObject resultObj);


  //=============================================================================
  // Name: AsyncSearchAssets
  // Desc: Performs an asset search using multiple filters. Filter type and value
  //       arrays are matched by index.
  // Parm: filterTypes - An array of filter types to search with
  // Parm: filterValues - An array of filter values to search with
  // Parm: resultObj - The query object, allocated using 
  //       TrainzAssetSearch.NewAsyncSearchObject(). This function runs 
  //       asynchronously and may take some non-trivial amount of time to 
  //       execute. Results are returned via this object. If the object is 
  //       released prior to results being returned, any results are discarded.
  //=============================================================================
  obsolete public native Asset[] SearchAssets(int[] filterTypes, string[] filterValues);
  public native void AsyncSearchAssets(int[] filterTypes, string[] filterValues, AsyncTrainzAssetSearchObject resultObj);


  //=============================================================================
  // Name: AsyncSearchAssetsSorted
  // Desc: Performs a basic asset search with one filter type and value, and
  //       returning a sorted result set
  // Parm: filterType - What to filter by, FILTER_NONE is not a valid option
  // Parm: filterValue - The value to use when filtering
  // Parm: sortedBy - What to sort by, see SORT_* defines above
  // Parm: sortAsc - true to sort ascending (e.g. a-z), false to sort descending
  // Parm: resultObj - The query object, allocated using 
  //       TrainzAssetSearch.NewAsyncSearchObject(). This function runs 
  //       asynchronously and may take some non-trivial amount of time to 
  //       execute. Results are returned via this object. If the object is 
  //       released prior to results being returned, any results are discarded.
  //=============================================================================
  obsolete public native Asset[] SearchAssetsSorted(int filterType, string filterValue, int sortedBy, bool sortAsc);
  public native void AsyncSearchAssetsSorted( int filterType, string filterValue, int sortedBy, bool sortAsc,
                                              AsyncTrainzAssetSearchObject resultObj);


  //=============================================================================
  // Name: AsyncSearchAssetsSorted
  // Desc: Performs an asset search using multiple filters
  // Parm: filterTypes - An array of filter types to search with
  // Parm: filterValues - An array of filter values to search with
  // Parm: sortedBy - What to sort by, see SORT_* defines above
  // Parm: sortAsc - true to sort ascending (e.g. a-z), false to sort descending
  // Parm: resultObj - The query object, allocated using 
  //       TrainzAssetSearch.NewAsyncSearchObject(). This function runs 
  //       asynchronously and may take some non-trivial amount of time to 
  //       execute. Results are returned via this object. If the object is 
  //       released prior to results being returned, any results are discarded.
  //=============================================================================
  obsolete public native Asset[] SearchAssetsSorted(int[] filterTypes, string[] filterValues, int sortedBy, bool sortAsc);
  public native void AsyncSearchAssetsSorted( int[] filterTypes, string[] filterValues, int sortedBy, bool sortAsc,
                                              AsyncTrainzAssetSearchObject resultObj);


  //=============================================================================
  // Name: AsyncSearchFeaturedAssets
  // Desc: This function builds a list of 'featured' content, filters it based on 
  //       the specified criteria, discards all but the first 'resultCount'
  //       entries, then sorts as specified. The caller should not perform
  //       additional filtering or culling as this could leave less results than
  //       desired. Note that it is possible that the search will result less
  //       than 'resultCount' results.
  //       The list of featured content is downloaded from the internet on a
  //       semi-regular basis, at present it will include only unauthorised DLC.
  // Parm: filterTypes - An array of filter types to search with
  // Parm: filterValues - An array of filter values to search with
  // Parm: sortedBy - What to sort by, see SORT_* defines above
  // Parm: sortAsc - true to sort ascending (e.g. a-z), false to sort descending
  // Parm: resultCount - The maximum number of results to return.
  // Parm: resultObj - The query object, allocated using 
  //       TrainzAssetSearch.NewAsyncSearchObject(). This function runs 
  //       asynchronously and may take some non-trivial amount of time to 
  //       execute. Results are returned via this object. If the object is 
  //       released prior to results being returned, any results are discarded.
  //=============================================================================
  public native void AsyncSearchFeaturedAssets( int[] filterTypes, string[] filterValues, int sortedBy, bool sortAsc,
                                                int resultCount, AsyncTrainzAssetSearchObject resultObj);


  //=============================================================================
  // Name: NewAsyncSearchObject
  // Desc: Creates a new search object to be used for an asynchronous searches.
  //       Once an asynchronous search is started with a search object that
  //       object is permanently bound to that search and CANNOT be reused. When
  //       you are done with the results simply discard the object.
  //=============================================================================
  public native AsyncTrainzAssetSearchObject NewAsyncSearchObject();

};

