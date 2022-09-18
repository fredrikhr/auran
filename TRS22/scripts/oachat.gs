//=============================================================================
// Name: OAChat.gs
// Desc: 
//=============================================================================
include "Library.gs"
include "OnlineAccess.gs"
include "OnlineGroup.gs"
include "OAChatChannel.gs"


//=============================================================================
// Name: BuddyInfo
// Desc: Obsolete- The buddy list is now mostly managed by native code.
//       This class remains only to prevent compilation errors in dependent
//       scripts, and will eventually be removed.
//=============================================================================
obsolete class BuddyInfo
{
  public define int STYLE_UNKNOWN = -1;
  public define int STYLE_BUDDY = 0;
  public define int STYLE_TEMPORARY = 1;
  public define int STYLE_IGNORED = 2;
  public define int STYLE_INVITE = 3;
  public define int STYLE_CHANNEL = 4;
  public define int STYLE_HIDDEN_CHANNEL = 5;


  public void AddMessage(GameObject oachat, Soup message) { }
  public bool Matches(string name) { return false; }

  public Soup GetProperties(void) { return Constructors.NewSoup(); }
  public void SetProperties(Soup soup) { }

  public bool IsChannel(void) { return false; }
  public bool IsUserProfile(void) { return false; }

};



//=============================================================================
// Name: OAChat
// Desc: A script interface to Trainz's online chat feature. This allows script
//       limited access to the chat buddy list and the ability to open various
//       chat system windows.
//       Note that iTrainz chat used to be implemented mostly in script but is
//       now largely native code. As such, many of the interfaces here are
//       obsolete and do not perform any useful function.
//=============================================================================
final static class OAChat isclass Library
{
  public define int BUDDY_STYLE_UNKNOWN = -1;
  public define int BUDDY_STYLE_BUDDY = 0;
  public define int BUDDY_STYLE_TEMPORARY = 1;
  public define int BUDDY_STYLE_IGNORED = 2;
  public define int BUDDY_STYLE_INVITE = 3;
  public define int BUDDY_STYLE_CHANNEL = 4;
  public define int BUDDY_STYLE_HIDDEN_CHANNEL = 5;



  //=============================================================================
  // Name: Init
  // Desc: Initialises this library.
  //=============================================================================
  public void Init(Asset asset)
  {
    inherited(asset);
  }


  //=============================================================================
  // Name: GetOnlineAccessStatus
  // Desc: Returns the current online status of the chat system.
  //=============================================================================
  public native int GetOnlineAccessStatus(void);


  //=============================================================================
  // Name: GetOnlineStatus
  // Desc: Returns whether chat is currently online.
  //=============================================================================
  public native bool GetOnlineStatus(void);


  //=============================================================================
  // Name: GetLocalUserProfileName
  // Desc: Returns the username of the local install.
  //=============================================================================
  public native string GetLocalUserProfileName(void);


  //=============================================================================
  // Name: CountBuddies
  // Desc: Returns the total number of buddies in this persons local buddy list.
  //=============================================================================
  public native int CountBuddies(void);


  //=============================================================================
  // Name: GetBuddyStyle
  // Desc: Returns the style of the buddy with the name passed.
  //=============================================================================
  public native int GetBuddyStyle(string buddyName);


  //=============================================================================
  // Name: GetBuddyStatus
  // Desc: Returns the current online status of the buddy with the name passed.
  //=============================================================================
  public native int GetBuddyStatus(string buddyName);


  //=============================================================================
  // Name: AddNewBuddy
  // Desc: Add a new buddy given a profile name and style. Does nothing if an
  //       entry with this name already exists.
  // Retn: Whether a buddy with this name and style now exists.
  // Note: May return true for 'similar' styles if the buddy already existed.
  //       e.g. If called with STYLE_INVITE or STYLE_TEMPORARY, then native may
  //       return true for an existing entry with STYLE_BUDDY. If specific type
  //       is critical then a follow up call to GetBuddyStyle() is recommended.
  //=============================================================================
  public native bool AddNewBuddy(string buddyName, int style);


  //=============================================================================
  // Name: HasBuddy
  // Desc: Returns whether we have a buddy with the specified profile name.
  //=============================================================================
  public bool HasBuddy(string buddyName) { return GetBuddyStyle(buddyName) != BUDDY_STYLE_UNKNOWN; }


  //=============================================================================
  // Name: GetIgnoreList
  // Desc: Returns a string array of every username on this players ignore list.
  //=============================================================================
  public native string[] GetIgnoreList();


  //=============================================================================
  // Name: CountQueuedMessages
  // Desc: Returns the total number of unviewed messages on every buddy.
  //=============================================================================
  public native int CountQueuedMessages(void);


  //=============================================================================
  // Name: CountQueuedMessages
  // Desc: Returns the number of unviewed messages for the specified buddy.
  //=============================================================================
  public native int CountQueuedMessages(string buddyName);


  //=============================================================================
  // Name: HasBuddyQueuedMessage
  // Desc: Returns whether we have any queued (received, but unread) messages
  //       for the specified buddy (which may be either a user or a channel.)
  //=============================================================================
  public bool HasBuddyQueuedMessage(string buddyName) { return CountQueuedMessages(buddyName) > 0; }


  //=============================================================================
  // Name: OpenBuddyListWindow
  // Desc: Opens/shows the chat buddy list window, if possible.
  //=============================================================================
  public native void OpenBuddyListWindow(void);


  //=============================================================================
  // Name: OpenChatWindow
  // Desc: Opens/shows a chat window with the desired buddy, if possible.
  //=============================================================================
  public native void OpenChatWindow(string buddyName);



  //=============================================================================
  public obsolete void Connect(void) { }

  public obsolete BuddyInfo AddBuddy(string buddyName, int style) { AddNewBuddy(buddyName, style); return null; }
  public obsolete void RemoveBuddy(string buddyName) { Interface.WarnObsolete("OAChat.RemoveBuddy"); }

  public obsolete int GetBuddyIndex(string buddyName) { Interface.WarnObsolete("OAChat.GetBuddyIndex"); return -1; }
  public obsolete BuddyInfo GetBuddyInfo(int buddyIndex) { Interface.WarnObsolete("OAChat.GetBuddyInfo"); return null; }
  public obsolete string GetBuddyProfileName(int index) { Interface.WarnObsolete("OAChat.GetBuddyProfileName"); return ""; }
  public obsolete int GetBuddyStyle(int index) { Interface.WarnObsolete("OAChat.GetBuddyStyle"); return BUDDY_STYLE_UNKNOWN; }
  public obsolete void SetBuddyStyle(int index, int style) { Interface.WarnObsolete("OAChat.SetBuddyStyle"); }
  public obsolete int GetBuddyStatus(int index) { Interface.WarnObsolete("OAChat.GetBuddyStatus"); return OnlineGroup.USER_STATUS_UNKNOWN; }

  public obsolete bool HasBuddyQueuedMessage(BuddyInfo buddyInfo) { Interface.WarnObsolete("OAChat.HasBuddyQueuedMessage"); return false; }
  public obsolete string GetBuddyQueuedMessage(string buddyName) { Interface.WarnObsolete("OAChat.GetBuddyQueuedMessage"); return ""; }
  public obsolete Soup GetBuddyQueuedMessageData(string buddyName) { Interface.WarnObsolete("OAChat.GetBuddyQueuedMessageData"); return null; }

  public obsolete void SendMessage(string buddyName, string messageText) { Interface.WarnObsolete("OAChat.SendData"); }
  public obsolete void SendData(string buddyName, Soup dataBundle) { Interface.WarnObsolete("OAChat.SendData"); }

  public obsolete ChatChannel OpenChannelGroup(int channelBuddyIndex, int groupFlags) { Interface.WarnObsolete("OAChat.OpenChannelGroup"); return null; }
  public obsolete ChatChannel OpenChannelGroup(int channelBuddyIndex) { Interface.WarnObsolete("OAChat.OpenChannelGroup"); return null; }
  public obsolete ChatChannel FindChannel(BuddyInfo buddyInfo) { Interface.WarnObsolete("OAChat.FindChannel"); return null; }
  public obsolete bool RemoveChannel(string buddyName) { Interface.WarnObsolete("OAChat.RemoveChannel"); return false; }

  public obsolete void ConnectToAllChannels(void) { Interface.WarnObsolete("OAChat.ConnectToAllChannels"); }
  public obsolete void ReconnectChannels(void) { Interface.WarnObsolete("OAChat.ReconnectChannels"); }
  public obsolete void DisconnectChannels(void) { Interface.WarnObsolete("OAChat.DisconnectChannels"); }
  public obsolete bool DisconnectFromChannel(string channelName) { Interface.WarnObsolete("OAChat.DisconnectFromChannel"); return false; }

  public obsolete void AddBuddyToOnlineSession(string buddyProfileName) { Interface.WarnObsolete("OAChat.AddBuddyToOnlineSession"); }
  public obsolete void RemoveBuddyFromOnlineSession(string buddyProfileName) { Interface.WarnObsolete("OAChat.RemoveBuddyFromOnlineSession"); }


};



