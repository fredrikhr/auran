//
// OAChat.gs
//
// Copyright (C) 2004-2005 Auran Developments Pty Ltd
// All Rights Reserved.
//
include "OnlineAccess.gs"
include "Library.gs"
include "OnlineGroup.gs"
include "OAChatChannel.gs"

class BuddyInfo
{
  public define int STYLE_UNKNOWN = -1;
  public define int STYLE_BUDDY = 0;
  public define int STYLE_TEMPORARY = 1;
  public define int STYLE_IGNORED = 2;
  public define int STYLE_INVITE = 3;
  public define int STYLE_CHANNEL = 4;
  public define int STYLE_HIDDEN_CHANNEL = 5;

  //
  // Internal data is considered private and can change between releases
  // of Trainz. Do not rely on direct access to this data as future releases
  // may cause script breakages. Use OAChat accessors instead.
  //
  public string   m_profileName;
  public Soup[]   m_messages;       // Array of received chat messages/data bundles
  public int      m_style;

    // set if this buddy is currently in an online session with our local user.
  public bool buddyIsInOnlineSession;
  //
  //

  public void AddMessage(GameObject oachat, Soup message);
  public bool Matches(string name);

  public Soup GetProperties(void);
  public void SetProperties(Soup soup);


  public void AddMessage(GameObject oachat, Soup message)
  {
    if (message == null)
      return;

    if (m_style == STYLE_IGNORED)
      return;
    
    if (m_style == STYLE_INVITE)
    {
      m_style = STYLE_BUDDY;
      oachat.PostMessage(oachat, "OAChat", "UsersChange", 0.0f);
    }
    
    if (!m_messages)
    {
      m_messages = new Soup[1];
      m_messages[0] = message;
    }
    else
    {
      m_messages[m_messages.size()] = message;
    }
    
    oachat.PostMessage(oachat, "OAChat.Message", m_profileName, 0.0f);
  }
  
  public bool Matches(string name)
  {
    string match0 = m_profileName;
    string match1 = name;
    
    Str.ToLower(match0);
    Str.ToLower(match1);
    
    return match0 == match1;
  }
  
  public Soup GetProperties(void)
  {
    Soup buddySoup = Constructors.NewSoup();
    
    buddySoup.SetNamedTag("name", m_profileName);
    buddySoup.SetNamedTag("style", m_style);
    
    // handle messages
    if (m_messages  and  m_messages.size())
    {
      Soup messagesSoup = Constructors.NewSoup();
      int i;
      for (i = 0; i < m_messages.size(); i++)
        messagesSoup.SetNamedSoup((string)i, m_messages[i]);
      
      buddySoup.SetNamedSoup("messages", messagesSoup);
    }
    
    return buddySoup;
  }
  
  public void SetProperties(Soup soup)
  {
    m_profileName = soup.GetNamedTag("name");
    m_style = soup.GetNamedTagAsInt("style");
    
    // handle messages
    Soup messagesSoup = soup.GetNamedSoup("messages");
    int messageCount = messagesSoup.CountTags();
    if (messageCount)
    {
      m_messages = new Soup[messageCount];
      int i;
      for (i = 0; i < messageCount; i++)
        m_messages[i] = messagesSoup.GetNamedSoup((string)i);
    }
  }
  
  public bool IsUserProfile(void)
  {
    if (m_style == STYLE_UNKNOWN)
      return true;
    if (m_style == STYLE_BUDDY)
      return true;
    if (m_style == STYLE_TEMPORARY)
      return true;
    if (m_style == STYLE_IGNORED)
      return true;
    if (m_style == STYLE_INVITE)
      return true;
    
    return false;
  }
  
  public bool IsChannel(void)
  {
    return m_style == STYLE_CHANNEL or m_style == STYLE_HIDDEN_CHANNEL;
  }
};



class OAChat isclass Library
{
  public void Init(Asset asset);

  public BuddyInfo AddBuddy(string profileName, int style);
  public BuddyInfo GetBuddyInfo(int buddyIndex);

  public void RemoveBuddy(string profileName);
  public bool HasBuddy(string profileName);
  public int CountBuddies(void);

  public string GetBuddyProfileName(int index);
  public bool HasBuddyQueuedMessage(int index);
  public bool HasBuddyQueuedMessage(string profileName);
  public bool HasBuddyQueuedMessage(BuddyInfo buddyInfo);
  public string GetBuddyQueuedMessage(string profileName);
  public Soup GetBuddyQueuedMessageData(string profileName);
  public int GetBuddyStatus(int index);

  public void SendMessage(string profileName, string messageText);
  public void SendData(string profileName, Soup dataBundle);
  public bool GetOnlineStatus(void);
  public int GetOnlineAccessStatus(void);
  public void Connect(void);
  public string GetLocalUserProfileName(void);
  public int CountQueuedMessages(void);

  public int GetBuddyIndex(string profileName);
  public int GetBuddyStyle(int index);
  public void SetBuddyStyle(int index, int style);

  public string[] GetIgnoreList();

  public void AddBuddyToOnlineSession(string buddyProfileName);
  public void RemoveBuddyFromOnlineSession(string buddyProfileName);

  public ChatChannel OpenChannelGroup(int channelBuddyIndex, int groupFlags);
  public ChatChannel OpenChannelGroup(int channelBuddyIndex) { return OpenChannelGroup(channelBuddyIndex, 0); }
  public ChatChannel FindChannel(BuddyInfo buddyInfo);
  public bool RemoveChannel(string profileName);
  public bool DisconnectFromChannel(string channelName);
  public void ReconnectChannels();
  public void DisconnectChannels();
  public void ConnectToAllChannels(void);



  //
  // PRIVATE IMPLEMENTATION
  //

  void HandleReceiveMessage(Message msg);
  void HandleStatusChange(Message msg);
  BuddyInfo GetBuddyInfo(string profileName, bool create);
  //BuddyInfo GetBuddyInfo(int buddyIndex);
  void NotifyOnlineStatus(bool status);
  void ReadBuddyList(void);
  void WriteBuddyList(void);
  void SortBuddyList(void);
  void HandleGroupUsersChange(Message msg);
  void HandleBuddyListModified(Message msg);

  OnlineAccess m_onlineAccess;
  OnlineGroup m_onlineGroup;
  BuddyInfo[] buddyList = new BuddyInfo[0];
  bool m_onlineStatus = false;
  bool m_bIsBuddyListModified = false;

  ChatChannel[] m_chatChannels = new ChatChannel[0];

  public void Init(Asset asset)
  {
    inherited(asset);
    
    m_onlineAccess = GetOnlineAccess();
    
    ReadBuddyList();
    
    AddHandler(m_onlineAccess, "OnlineAccess", "ReceiveMessage", "HandleReceiveMessage");
    AddHandler(m_onlineAccess, "OnlineAccess", "StatusChange", "HandleStatusChange");
    AddHandler(me, "OAChat", "BuddyListModified", "HandleBuddyListModified");
    //AddHandler(me, "World", "ModuleInit", "ModuleInitHandler");
    
    m_onlineAccess.Connect();
  }



  public string GetLocalUserProfileName(void)
  {
    return m_onlineAccess.GetUsername();
  }


  public int GetBuddyIndex(string profileName)
  {
    int i;
    for (i = 0; i < buddyList.size(); i++)
      if (buddyList[i].Matches(profileName))
        return i;
    
    return -1;
  }

  public int GetBuddyStyle(int index)
  {
    BuddyInfo buddy = GetBuddyInfo(index);
    if (!buddy)
      return BuddyInfo.STYLE_UNKNOWN;
    
    return buddy.m_style;
  }

  public void SetBuddyStyle(int index, int style)
  {
    BuddyInfo buddy = GetBuddyInfo(index);
    if (buddy and buddy.m_style != style)
    {
      buddy.m_style = style;
      HandleGroupUsersChange(null);
      
      WriteBuddyList();
    }
  }

  public string[] GetIgnoreList()
  {
    int i;
    string[] ignored = new string[0];

    // Gather the list of locally ignored players
    for (i = 0; i < buddyList.size(); ++i)
      if (buddyList[i].m_style == BuddyInfo.STYLE_IGNORED)
        ignored[ignored.size()] = buddyList[i].m_profileName;

    // Ensure the usernames are all lowercase and return
    for (i = 0; i < ignored.size(); ++i)
      Str.ToLower(ignored[i]);
    return ignored;
  }

  void HandleReceiveMessage(Message msg)
  {
    bool changed = false;
    
    while (1)
    {
      int result;
      string sourceUsername = "";
      Soup messageData = Constructors.NewSoup();
      
      result = m_onlineAccess.CollectMessage(sourceUsername, messageData);
      
      if (result != OnlineAccess.RESULT_OK)
        break;
      
      if (sourceUsername == "")
        break;
      
      
      BuddyInfo buddy = GetBuddyInfo(sourceUsername, true);
      if (buddy != null)
      {
        // Add the message to the queue
        buddy.AddMessage(me, messageData);
        changed = true;
      }
    }
    
    if (changed)
	    WriteBuddyList();
  }
  
  
  void CreateOnlineGroup(void)
  {
    m_onlineGroup = m_onlineAccess.CreateGroup();
    AddHandler(m_onlineGroup, "OnlineGroup", "StatusChange", "HandleGroupStatusChange");
    AddHandler(m_onlineGroup, "OnlineGroup", "UsersChange", "HandleGroupUsersChange");
  }
  
  
  void AddBuddiesToOnlineGroup(void)
  {
    //  add all our buddies to this OnlineGroup
    int i;
    for (i = 0; i < buddyList.size(); i++)
    {
      BuddyInfo buddy = buddyList[i];
      
      if (buddy.IsUserProfile())
        m_onlineGroup.AddUser(buddy.m_profileName);
    }
  }
  
  
  void HandleStatusChange(Message msg)
  {
    int status = m_onlineAccess.GetStatus();
    
    if (status == OnlineAccess.MODE_ONLINE)
    {
      // We have an iTrainz network connection, but we are not counted as "online" until
      // we've established our private group. We will get a further notification once the
      // group is online, so we perform any on-startup work at that point, not here.
      if (m_onlineGroup == null)
        CreateOnlineGroup();
    }
    else
    {
      // Disconnect all the active chat channels immediately
      DisconnectChannels();

      // Release our buddy group since we are offline anyway.
      m_onlineGroup = null;
      
      // Notify that we are definitely offline.
      NotifyOnlineStatus(false);
    }
  }
  
  /*void ModuleInitHandler(Message msg)
  {
    //if (World.GetCurrentModule() == World.DRIVER_MODULE)
      m_onlineAccess.Connect();
  }*/
  
  void NotifyOnlineStatus(bool status)
  {
    m_onlineStatus = status;
    PostMessage(me, "OAChat", "StatusChange", 0.0f);
  }
  
  public bool GetOnlineStatus(void)
  {
    return m_onlineStatus;
  }

  public int GetOnlineAccessStatus(void)
  {
    return m_onlineAccess.GetStatus();
  }
  
  //
  // Attempt an iTrainz network connection. If we are already connected, this does nothing.
  // If we are not connected, this will start the connection process.
  //
  public void Connect(void)
  {
    m_onlineAccess.Connect();
  }
  
  
  void HandleGroupStatusChange(Message msg)
  {
    if (!m_onlineGroup)
      return;
    
    int status = m_onlineGroup.GetStatus();
    if (status == OnlineGroup.STATUS_OPEN)
    {
      // we're live..
      AddBuddiesToOnlineGroup();
      
      NotifyOnlineStatus(true);
      
      // Connect everything.
      ConnectToAllChannels();
      ReconnectChannels();
    }
    else if (status == OnlineGroup.STATUS_CLOSED)
    {
      // Our buddy group got closed?
      NotifyOnlineStatus(false);

      DisconnectChannels();
      
      // Try for a forced reconnect.
      m_onlineGroup = null;
      CreateOnlineGroup();
    }
  }
  
  
  void HandleGroupUsersChange(Message msg)
  {
    if (!m_onlineGroup)
      return;
    
    bool buddyListChanged = false;
    int i;
    for (i = 0; i < buddyList.size(); )
    {
      BuddyInfo buddyInfo = buddyList[i];
      
      if (buddyInfo.IsUserProfile())
      {
        int buddyStatus = m_onlineGroup.GetUserStatus(buddyInfo.m_profileName);
        
        if (buddyStatus == OnlineGroup.USER_STATUS_INVALID)
        {
          // newly added buddy was not valid!
          // (this occurs when the user mis-typed their buddy's name)
          Interface.Log("OAChat.HandleGroupUsersChange> removing invalid buddy \"" + buddyInfo.m_profileName + "\"");
          buddyList[i, i+1] = null;
          buddyListChanged = true;
          m_onlineGroup.RemoveUser(buddyInfo.m_profileName);
        }
        else
        {
          i++;
        }
      }
      else
      {
        i++;
      }
    }
    PostMessage(me, "OAChat", "UsersChange", 0.0f);

    if (buddyListChanged)
      WriteBuddyList();
  }
  
  
  //


  //
  // Add a new buddy given his profile name.
  // Does nothing if we already have this buddy in our list.
  //
  public BuddyInfo AddBuddy(string profileName, int style)
  {
    string lowerName = profileName;
    Str.ToLower(lowerName);
    string localName = GetLocalUserProfileName();
    Str.ToLower(localName);

    //Interface.Log("AddBuddy \"" + profileName + "\"");
    if (profileName == "" or lowerName == localName)
    {
      // invalid profile name
      return null;
    }

    int i;
    for (i = 0; i < buddyList.size(); i++)
    {
      if (buddyList[i].Matches(profileName))
      {
        // Buddy already exists in our list, update style if required
        if (buddyList[i].m_style != style)
          SetBuddyStyle(i, style);

        return buddyList[i];
      }
    }

    BuddyInfo newBuddy = new BuddyInfo();
    newBuddy.m_profileName = profileName;
    newBuddy.m_style = style;
    buddyList[buddyList.size()] = newBuddy;

    if (newBuddy.IsUserProfile() and m_onlineGroup != null)
      m_onlineGroup.AddUser(profileName);
    PostMessage(me, "OAChat", "UsersChange", 0.0f);

    WriteBuddyList();
    
    // If the new buddy is a channel, join immediately.
    if (newBuddy.IsChannel()  and  newBuddy.m_style != BuddyInfo.STYLE_HIDDEN_CHANNEL)
    {
      OpenChannelGroup(buddyList.size()-1, OnlineGroup.GROUP_MODEFLAG_WALLED);
    }

    return newBuddy;
  }


  //
  // Remove a buddy given his profile name.
  // Does nothing if he is not in our buddy list.
  //
  public void RemoveBuddy(string profileName)
  {
    int i;
    for (i = 0; i < buddyList.size(); i++)
    {
      BuddyInfo buddy = buddyList[i];
      if (buddy.Matches(profileName))
      {
        if (buddy.IsChannel())
          DisconnectFromChannel(buddy.m_profileName);

        if (buddy.buddyIsInOnlineSession)
        {
          // we can't remove someone who's in an online session with us, until one of us leaves the session
          buddy.m_style = BuddyInfo.STYLE_TEMPORARY;
          
          PostMessage(me, "OAChat", "UsersChange", 0.0f);
          WriteBuddyList();
          return;
        }
        
        buddyList[i, i+1] = null;
        
        if (m_onlineGroup != null)
          m_onlineGroup.RemoveUser(profileName);
        PostMessage(me, "OAChat", "UsersChange", 0.0f);
        WriteBuddyList();
        return;
      }
    }
  }


  //
  // Returns true if we have a buddy with the specified profile name.
  //
  public bool HasBuddy(string profileName)
  {
    int i;
    for (i = 0; i < buddyList.size(); i++)
      if (buddyList[i].Matches(profileName))
        return true;
    
    return false;
  }

  //
  // Returns the BuddyInfo for the specified profile name, or null if not found.
  //
  BuddyInfo GetBuddyInfo(string profileName, bool create)
  {
    int i;
    for (i = 0; i < buddyList.size(); i++)
      if (buddyList[i].Matches(profileName))
        return buddyList[i];
    
    if (create)
      return AddBuddy(profileName, BuddyInfo.STYLE_TEMPORARY);
    
    return null;
  }


  //
  // Returns the BuddyInfo for the specified index, or null if not found.
  //
  public BuddyInfo GetBuddyInfo(int buddyIndex)
  {
    if (buddyIndex < 0  or  buddyIndex >= buddyList.size())
      return null;
    
    return buddyList[buddyIndex];
  }



  //
  // Returns the number of buddies in the buddy list.
  //
  public int CountBuddies(void)
  {
    return buddyList.size();
  }


  //
  // Returns the profile name of the indexed buddy.
  //
  public string GetBuddyProfileName(int index)
  {
    if (index < 0  or  index >= buddyList.size())
      return "";
    
    return buddyList[index].m_profileName;
  }


  // ============================================================================
  // Name: CountQueuedMessages
  // Desc: Returns the number of unviewed messages.
  // ============================================================================
  public int CountQueuedMessages(void)
  {
    int buddyIndex;
    int messageCount = 0;
    
    for (buddyIndex = 0; buddyIndex < buddyList.size(); buddyIndex++)
    {
      BuddyInfo buddy = buddyList[buddyIndex];
  	  
      if (buddy.m_messages)
        messageCount = messageCount + buddy.m_messages.size();
      
      ChatChannel channel = FindChannel(buddy);
      if (channel != null)
        messageCount = messageCount + channel.CountQueuedMessage();
    }
    
    return messageCount;
  }


  // ============================================================================
  // Name: HasBuddyQueuedMessage
  // Desc: Returns whether we have any queued (received, but unread) messages
  //       for the specified buddy (which may be either a user or a channel.)
  // Parm: profileName - The buddy to query.
  // Retn: bool - True if message are queued.
  // ============================================================================
  public bool HasBuddyQueuedMessage(string profileName)
  {
    return HasBuddyQueuedMessage(GetBuddyInfo(profileName, false));
  }


  // ============================================================================
  // Name: HasBuddyQueuedMessage
  // Desc: Returns whether we have any queued (received, but unread) messages
  //       for the specified buddy (which may be either a user or a channel.)
  // Parm: index - The buddy to query.
  // Retn: bool - True if message are queued.
  // ============================================================================
  public bool HasBuddyQueuedMessage(int index)
  {
    if (index < 0  or  index >= buddyList.size())
      return false;
    
    return HasBuddyQueuedMessage(buddyList[index]);
  }
  
  
  // ============================================================================
  // Name: HasBuddyQueuedMessage
  // Desc: Returns whether we have any queued (received, but unread) messages
  //       for the specified buddy (which may be either a user or a channel.)
  // Parm: buddyInfo - The buddy to query.
  // Retn: bool - True if message are queued.
  // ============================================================================
  public bool HasBuddyQueuedMessage(BuddyInfo buddyInfo)
  {
    if (!buddyInfo)
      return false;
    
    if (buddyInfo.m_messages  and  buddyInfo.m_messages.size())
      return true;
    
    ChatChannel channel = FindChannel(buddyInfo);
    if (channel != null)
      return channel.CountQueuedMessage() > 0;
    
    return false;
  }


  // ============================================================================
  // Name: GetBuddyStatus
  // Desc: Returns the status of the specified buddy, using the OnlineGroup user
  //       status enumerations. The buddy may be a user, in which case that
  //       user's online status is queried, or the buddy may be a channel, in
  //       which case the local user's membership of the channel is queried.
  // Parm: index - The buddy to query.
  // Retn: int - An OnlineGroup user status enumeration.
  // ============================================================================
  public int GetBuddyStatus(int index)
  {
    if (index < 0  or  index >= buddyList.size())
      return OnlineGroup.USER_STATUS_OFFLINE;
    
    if (!m_onlineGroup)
      return OnlineGroup.USER_STATUS_OFFLINE;
    
    
    BuddyInfo buddyInfo = buddyList[index];
    
    // Channel?
    if (buddyInfo.IsChannel())
    {
      ChatChannel channel = FindChannel(buddyInfo);
      if (channel != null)
      {
        if (channel.m_channelGroup == null)
          return OnlineGroup.USER_STATUS_OFFLINE;
        
        if (channel.m_channelGroup.GetStatus() == OnlineGroup.STATUS_OPEN)
          return OnlineGroup.USER_STATUS_ONLINE;
        
        return OnlineGroup.USER_STATUS_OFFLINE;
      }
      
      return OnlineGroup.USER_STATUS_UNKNOWN;
    }
    
    // Normal buddy.
    return m_onlineGroup.GetUserStatus(buddyInfo.m_profileName);
  }


  //
  // Returns the oldest queued message for this buddy, and remove it from the queue.
  // Note: Using this function will return the "text" component of a queued message
  //       only, causing any other data to be deleted without use.
  //
  public string GetBuddyQueuedMessage(string profileName)
  {
    Soup soup = GetBuddyQueuedMessageData(profileName);
    
    // Return the text tag, any "data" tag will be lost
    return soup.GetNamedTag("text");
  }

  public Soup GetBuddyQueuedMessageData(string profileName)
  {
    BuddyInfo buddy = GetBuddyInfo(profileName, false);
    if (!buddy)
      return null;
    
    if (!buddy.m_messages)
      return null;
    
    if (!buddy.m_messages.size())
      return null;
    
    Soup ret = buddy.m_messages[0];
    if (buddy.m_messages.size() <= 1)
    {
      // all done, clear the list
      buddy.m_messages = null;
      
      // .. and flag a status update
      PostMessage(me, "OAChat", "UsersChange", 0.0f);
    }
    else
    {
      // remove the returned message
      buddy.m_messages[0, 1] = null;
    }
    
    WriteBuddyList();
    
    return ret;
  }

  //
  public void SendMessage(string profileName, string messageText)
  {
    if (profileName == "")
      return;
    
    if (messageText == "")
      return;
    
    //Interface.Log("OAChat> outgoing message to '" + profileName + "' -> " + messageText);
    
    Soup soup = Constructors.NewSoup();
    soup.SetNamedTag("text", messageText);
    m_onlineAccess.PostMessage(profileName, soup);
  }


  // Sends a soup of generic data through to the profile name provided
  public void SendData(string profileName, Soup dataBundle)
  {
    if (profileName == "")
      return;

    if (dataBundle == null)
      return;

    Soup soup = Constructors.NewSoup();
    soup.SetNamedSoup("data", dataBundle);
    m_onlineAccess.PostMessage(profileName, soup);
  }


  //
  public void AddBuddyToOnlineSession(string buddyProfileName)
  {
    BuddyInfo buddy = GetBuddyInfo(buddyProfileName, true);
    
    buddy.buddyIsInOnlineSession = true;
  }
  
  //
  public void RemoveBuddyFromOnlineSession(string buddyProfileName)
  {
    BuddyInfo buddy = GetBuddyInfo(buddyProfileName, false);
    if (buddy)
    {
      if (buddy.buddyIsInOnlineSession)
      {
        buddy.buddyIsInOnlineSession = false;
        PostMessage(me, "OAChat", "UsersChange", 0.0f);
        
        if (buddy.m_style == BuddyInfo.STYLE_TEMPORARY)
          RemoveBuddy(buddyProfileName);
      }
    }
  }



  bool m_debugBuddyListRead = false;


  // Populate a default list of buddies for new users.
  void CreateDefaultBuddyList(void)
  {
    AddBuddy("#trainz", BuddyInfo.STYLE_CHANNEL);
  }


  //
  void ReadBuddyList(void)
  {
    string buddyListName = "buddy-list-" + GetLocalUserProfileName();

    Soup soup = Constructors.NewSoup();
    m_onlineAccess.GetLocalData(buddyListName, soup);
    
    int i;
    int buddyCount = soup.CountTags();
    buddyList = new BuddyInfo[buddyCount];
    
    for (i = 0; i < buddyCount; i++)
    {
      BuddyInfo info = new BuddyInfo();
      buddyList[i] = info;
      
      Soup buddySoup = soup.GetNamedSoup((string)i);
      info.SetProperties(buddySoup);
    }
    
    if (buddyCount == 0)
      CreateDefaultBuddyList();
    
    SortBuddyList();

    m_debugBuddyListRead = true;
    m_bIsBuddyListModified = false;
  }

  //
  void WriteBuddyList(void)
  {
    if (m_bIsBuddyListModified)
      return;
    
    m_bIsBuddyListModified = true;
    
    SortBuddyList();
    
    PostMessage(me, "OAChat", "BuddyListModified", 0.5f);
  }


  void HandleBuddyListModified(Message msg)
  {
    if (!m_bIsBuddyListModified)
      return;
    
    if (!m_debugBuddyListRead)
      return;
    
    m_bIsBuddyListModified = false;
    
    SortBuddyList();
    
    Soup soup = Constructors.NewSoup();
    
    int i;
    int index = 0;
    for (i = 0; i < buddyList.size(); i++)
    {
      BuddyInfo buddy = buddyList[i];
      if (buddy.m_style != BuddyInfo.STYLE_TEMPORARY and buddy.m_style != BuddyInfo.STYLE_HIDDEN_CHANNEL)
      {
        Soup buddySoup = buddy.GetProperties();
        
        soup.SetNamedSoup((string)index, buddySoup);
        
        index++;
      }
    }
    
    string buddyListName = "buddy-list-" + GetLocalUserProfileName();
    m_onlineAccess.SetLocalData(buddyListName, soup);
  }


  void SortBuddyList(void)
  {
    int i, j;
    BuddyInfo tmp;

    // Slow linear sort, but the list should be small so it'll do.
    for (i = 0; i < buddyList.size(); ++i)
    {
      for (j = 0; j < buddyList.size(); ++j)
      {
        if (buddyList[i].m_profileName < buddyList[j].m_profileName)
        {
          tmp = buddyList[i];
          buddyList[i] = buddyList[j];
          buddyList[j] = tmp;
        }
      }
    }
  }


  public ChatChannel OpenChannelGroup(int channelBuddyIndex, int groupFlags)
  {
    BuddyInfo buddyInfo = GetBuddyInfo(channelBuddyIndex);
    if (buddyInfo == null)
    {
      Interface.Log("OAChat.OpenChannelGroup> Invalid buddy index " + channelBuddyIndex);
      return null;
    }

    if (!buddyInfo.IsChannel())
    {
      Interface.Log("OAChat.OpenChannelGroup> Buddy entry exists but is not a channel");
      return null;
    }
      
    if (!GetOnlineStatus())
    {
      Interface.Log("OAChat.OpenChannelGroup> Cannot open group, not online");
      return null;
    }

    ChatChannel channel = FindChannel(buddyInfo);
    if (channel != null)
    {
      if (channel.m_channelGroup == null)
        channel.Init(me, buddyInfo, m_onlineAccess.OpenGroup(buddyInfo.m_profileName, groupFlags | OnlineGroup.GROUP_MODEFLAG_WALLED));
    }
    else
    {
      // Create and add it if not found
      channel = new ChatChannel();
      channel.Init(me, buddyInfo, m_onlineAccess.OpenGroup(buddyInfo.m_profileName, groupFlags | OnlineGroup.GROUP_MODEFLAG_WALLED));
      m_chatChannels[m_chatChannels.size()] = channel;
    }
    
    if (channel.m_channelGroup)
      channel.m_channelGroup.AddUser(GetLocalUserProfileName());

    return channel;
  }


  // ============================================================================
  // Name: FindChannel
  // Desc: Search for a Chat Channel matching the specified BuddyInfo object.
  // Parm: buddyInfo - The BuddyInfo object to search for.
  // Retn: ChatChannel - The Chat Channel matching the search, or null if no
  //       match found.
  // ============================================================================
  public ChatChannel FindChannel(BuddyInfo buddyInfo)
  {
    if (!buddyInfo.IsChannel())
      return null;
    
    int i;

    // Check if this channel is mapped yet
    for (i = 0; i < m_chatChannels.size(); ++i)
    {
      if (m_chatChannels[i].m_buddyInfo == buddyInfo)
        return m_chatChannels[i];
    }
    return null;
  }


  // ============================================================================
  // Name: RemoveChannel
  // Desc: Called when the ChatInterface closes a channel window. This used to
  //       result in the user being removed from the channel, but we now
  //       preserve the connection.
  // ============================================================================
  public bool RemoveChannel(string profileName)
  {
    return true;
  }
  
  
  // ============================================================================
  // Name: DisconnectFromChannel
  // Desc: Remove the user from the specified chat channel. This does not remove
  //       the channel from the buddy list, if it is present there, which means
  //       that the user will eventually be reconnected to the chat channel
  //       unless the channel is also removed from the buddy list.
  // ============================================================================
  public bool DisconnectFromChannel(string channelName)
  {
    int i;

    // Check if this channel is mapped yet
    for (i = 0; i < m_chatChannels.size(); ++i)
    {
      if (m_chatChannels[i].m_buddyInfo.m_profileName == channelName)
      {
        if (m_chatChannels[i].m_channelGroup)
          m_chatChannels[i].m_channelGroup.RemoveUser(GetLocalUserProfileName());
        m_chatChannels[i].m_channelGroup = null;
        m_chatChannels[i, i+1] = null;
        return true;
      }
    }

    return false;
  }

  
  // ============================================================================
  // Name: ReconnectChannels
  // Desc: Called when an iTrainz connection is (re)established, this function
  //       attempts to join the user to each chat channel on which they are
  //       supposed to be present. Note that it is possible that the join will
  //       fail (due to networking issues or channel permissions) in which case
  //       the channel object will persist but will not be connected.
  // ============================================================================
  public void ReconnectChannels(void)
  {
    int i;
    for (i = 0; i < m_chatChannels.size(); ++i)
    {
      ChatChannel channel = m_chatChannels[i];

      if (channel.m_channelGroup == null and channel.m_buddyInfo.m_style != BuddyInfo.STYLE_HIDDEN_CHANNEL)
        channel.Init(me, channel.m_buddyInfo, m_onlineAccess.OpenGroup(channel.m_buddyInfo.m_profileName, OnlineGroup.GROUP_MODEFLAG_WALLED));
      
      if (channel.m_channelGroup)
        channel.m_channelGroup.Connect();
    }
  }


  //=============================================================================
  // Name: DisconnectChannels
  // Desc: Called when an iTrainz connection is lost, this function removes our
  //       reference to any open and no longer valid groups. This ensures that if
  //       the connection is re-established the groups will be correctly reopened.
  //=============================================================================
  public void DisconnectChannels()
  {
    int i;
    for (i = 0; i < m_chatChannels.size(); ++i)
    {
      // Just clear the group reference, it's been made useless in native code
      // and if we come back online we'll need to open a brand new one.
      m_chatChannels[i].m_channelGroup = null;
    }
  }

  
  // ============================================================================
  // Name: ConnectToAllChannels
  // Desc: Called when an iTrainz connection is (re)established, this attempts
  //       to reopen all channels that are present in their buddy list. Note that
  //       this does not necessarily force a reconnect if the channel is already
  //       open. Use ReconnectChannels() to trigger a reconnect for open
  //       channels.
  // ============================================================================
  public void ConnectToAllChannels(void)
  {
    int buddyListSize = buddyList.size();
    
    int i;
    for (i = 0; i < buddyListSize; ++i)
    {
      BuddyInfo buddyInfo = buddyList[i];
      
      if (buddyInfo.IsChannel()  and  buddyInfo.m_style != BuddyInfo.STYLE_HIDDEN_CHANNEL)
      {
        OpenChannelGroup(i, OnlineGroup.GROUP_MODEFLAG_WALLED);
      }
    }
  }
};

