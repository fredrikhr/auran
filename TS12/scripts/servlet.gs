// ============================================================================
// File: Servlet.gs
// Desc: The TrainzScript base class for iTrainz Servlet assets.
// ============================================================================
include "Library.gs"
include "Asset.gs"
include "Image.gs"



// ============================================================================
// Name: ServletHTTPRequest
// Desc: An instance of this class is populated with data about an incoming 
//       HTTP request and passed to Servlet.ProcessHTTPRequest().
// NOTE: Do not alter this class - the ordering and size are hard coded!
// ============================================================================
final class ServletHTTPRequest
{
  public string     URI;          // The URI being requested.
  public Soup       params;       // Any parameters passed to this request.
};



// ============================================================================
// Name: ServletHTTPReply
// Desc: An instance of this class is default-initialised and passed into 
//       Servlet.ProcessHTTPRequest() where it should be populated with the
//       query results.
// NOTE: Do not alter this class - the ordering and size are hard coded!
// ============================================================================
final class ServletHTTPReply
{
  public int        resultCode;   // The HTTP result code, defaults to 200-OK.
  
  // Where a simple text/html response is suitable, populate the following.
  public string     text;         // The reply text, if a simple text reply is suitable.
  
  // To respond with a static image or text/html file, populate the following.
  public Asset      asset;        // An asset to source a response file.
  public string     filepath;     // The filepath to retrieve from within the asset.
  
  // To respond with a dynamic image, populate the following.
  public Image      image;        // The image to use as a response.
};



// ============================================================================
// Name: Servlet
// Desc: The TrainzScript base class for iTrainz Servlet assets.
// ============================================================================
game class Servlet isclass Library
{
  // ============================================================================
  // Name: Start
  // Desc: Called immediately after this Servlet instance is created. The
  //       servlet should initialise to the extent that it is ready to begin
  //       processing client queries prior to returning from this function.
  // Retn: bool - True on success. False if the servlet failed to initialise.
  // ============================================================================
  public bool Start(void)
  {
    // TO BE OVERRIDDEN IN CHILD CLASS
    return true;
  }
  
  
  
  // ============================================================================
  // Name: Stop
  // Desc: Called immediately before this Servlet instance is destroyed during a
  //       clean shutdown. The servlet should notify any attached clients of
  //       the shutdown as necessary prior to returning from this function.
  // ============================================================================
  public void Stop(void)
  {
    // TO BE OVERRIDDEN IN CHILD CLASS
  }
  
  
  
  // ============================================================================
  // Name: GetStatusText
  // Desc: Returns a administrator-viewable status message describing the state
  //       of this servlet.
  // Retn: string - The status message. This should be a single short line of 
  //       plain english text.
  // ============================================================================
  public string GetStatusText(void)
  {
    // TO BE OVERRIDDEN IN CHILD CLASS
    return "Running";
  }
  
  
  
  // ============================================================================
  // Name: ProcessHTTPRequest
  // Desc: Called when an external client has made a request against our HTTP
  //       interface. The servlet should process the query and return a fully
  //       formed reply. While the servlet may choose to queue further work as
  //       the result of this query, no further modification of the reply is
  //       possible after this function returns.
  // Parm: request -
  // Parm: reply - 
  // ============================================================================
  public void ProcessHTTPRequest(ServletHTTPRequest request, ServletHTTPReply reply)
  {
    // TO BE OVERRIDDEN IN CHILD CLASS
  }
  
  
  
  // ============================================================================
  // Name: ProcessAdministrativeLogin
  // Desc: Called when an authorized administrator has requested administrative
  //       access to this servlet via the iTrainz Servlet Administrative 
  //       Interface. No additional authorization is necessary at this point;
  //       the servlet should immediately begin an administrative session for
  //       the specified user.
  // Parm: userID - The Authorized Administrator's UserID.
  // Parm: request - 
  // Parm: reply - 
  // Retn: bool - TRUE if the administrative request was handled.
  // ============================================================================
  public bool ProcessAdministrativeLogin(int userID, ServletHTTPRequest request, ServletHTTPReply reply)
  {
    // TO BE OVERRIDDEN IN CHILD CLASS
    return false;
  }
  
  
  
  // ============================================================================
  // Name: ProcessAdministrativeRequest
  // Desc: Called when the administrator has entered a request through the
  //       console interface. The servlet should write any response to the log.
  // Parm: request - The text string entered by the administrator.
  // ============================================================================
  public void ProcessAdministrativeRequest(string request)
  {
    // TO BE OVERRIDDEN IN CHILD CLASS
  }
  


  // ============================================================================
  // Name: SetPersistentData
  // Desc: Stores a soup of persistent data in this Servlet's private data store.
  // Parm: key - A unique key within this Servlet's data store that identifies
  //       the data. Any existing data with a matching key is erased. The key
  //       should consist of lowercase ascii characters.
  // Parm: data - The data value to store. Passing a null value causes all
  //       existing data associated with this key to be erased.
  // ============================================================================
  public native void SetPersistentData(string key, Soup data);



  // ============================================================================
  // Name: GetPersistentData
  // Desc: Retreives a soup of persistent data from this Servlet's private data 
  //       store.
  // Parm: key - The unique key within this Servlet's data store that identifies
  //       the data. The key should consist of lowercase ascii characters.
  // Parm: o_data - (OUT) A copy of the data value associated with the requested 
  //       key.
  // ============================================================================
  public native void GetPersistentData(string key, Soup o_data);
  
  
  
  // ============================================================================
  // Name: GetPeristentDataKeysWithPrefix
  // Desc: Queries the persistent data store for a list of all keys which begin
  //       with the specified prefix.
  // Parm: prefixString - The prefix to query. An empty string will cause all
  //       keys to be returned.
  // Retn: string[] - The list of keys matching the queried prefix. The prefix
  //       string is stripped from each key.
  // ============================================================================
  public native string[] GetPeristentDataKeysWithPrefix(string prefixString);
  
  
  
  
  // ============================================================================
  // INTERNAL AURAN USE ONLY.
  // The following are privileged functions and will throw an exception if used
  // from third-party scripts. This interface may change without notice.
  // ============================================================================
  public native int AdminValidateLogin(string username, string password);
  public native Soup AdminListAvailableServlets(int contentID);
  public native Soup AdminListInstalledServlets(int contentID);
  public native bool AdminInstallContent(int contentID, KUID assetID);
  public native bool AdminStartServlet(int contentID, KUID assetID);
  public native void AdminStopServlet(int contentID, KUID assetID);
  public native bool AdminProcessAdministrativeLogin(KUID servletID, int userID, ServletHTTPRequest request, ServletHTTPReply reply);
  
};



