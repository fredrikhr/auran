//=============================================================================
// File: OAChatChannel.gs
// Desc: Defines the channel class used by OAChat
//=============================================================================

include "OAChat.gs"

//=============================================================================
// Name: ChannelMessage
// Desc: A simple channel message struct
//=============================================================================
class ChannelMessage
{
  public string user;
  public string message;
  public Soup   data;
};


//=============================================================================
// Name: ChatChannel
// Desc: class describing a chat channel. Holds an array of queued messages.
//=============================================================================
class ChatChannel isclass GameObject
{
  public BuddyInfo        m_buddyInfo;
  public OnlineGroup      m_channelGroup;
  public ChannelMessage[] m_messages;
  OAChat                  m_oaChat;

  public bool Init(OAChat oaChat, BuddyInfo buddyInfo, OnlineGroup channelGroup);

  public ChannelMessage GetQueuedMessage();
  public int CountQueuedMessage(void);

  void HandleReceiveMessage(Message msg);
  void HandleStatusChange(Message msg);
  void HandleUserAdded(Message msg);
  void HandleUserRemoved(Message msg);
  void HandleUserStatus(Message msg);


  // Initialises the class
  public bool Init(OAChat oaChat, BuddyInfo buddyInfo, OnlineGroup channelGroup)
  {
    if (!buddyInfo.IsChannel())
      return false;

    m_buddyInfo = buddyInfo;
    m_channelGroup = channelGroup;
    m_oaChat = oaChat;

    if (m_channelGroup)
    {
      // Add handlers
      AddHandler(m_channelGroup, "OnlineGroup",             "StatusChange",   "HandleStatusChange");
      AddHandler(m_channelGroup, "OnlineGroup.UserAdded",   "",               "HandleUserAdded");
      AddHandler(m_channelGroup, "OnlineGroup.UserRemoved", "",               "HandleUserRemoved");
      AddHandler(m_channelGroup, "OnlineGroup.UserStatus",  "",               "HandleUserStatus");
      AddHandler(m_channelGroup, "OnlineGroup",             "ReceiveMessage", "HandleReceiveMessage");
    }

    return true;
  }

  // Group status change
  void HandleStatusChange(Message msg)
  {
    PostMessage(me, "ChatChannel.StatusChange", "", 0.0f);
  }

  // New user handler
  void HandleUserAdded(Message msg)
  {
    //Interface.Log("ChatChannel.UserJoined " + msg.minor);
    PostMessage(me, "ChatChannel.UserJoined", msg.minor, 0.0f);
  }

  // User left handler
  void HandleUserRemoved(Message msg)
  {
    //Interface.Log("ChatChannel.UserLeft " + msg.minor);
    PostMessage(me, "ChatChannel.UserLeft", msg.minor, 0.0f);
  }

  // User status change handler
  void HandleUserStatus(Message msg)
  {
    //Interface.Log("ChatChannel.UserStatus " + msg.minor);
    PostMessage(me, "ChatChannel.UserStatus", msg.minor, 0.0f);
  }

  // Receive message handler
  void HandleReceiveMessage(Message msg)
  {
    string sourceUsername = "";
    Soup messageSoup = Constructors.NewSoup();
    bool bHasReceivedMessage = false;
    bool bHadQueuedMessage = (CountQueuedMessage() > 0);

    while (1)
    {
      int result = m_channelGroup.CollectMessage(sourceUsername, messageSoup);
      if (result != OnlineAccess.RESULT_OK)
        break;

      ChannelMessage newMessage = new ChannelMessage();
      newMessage.user    = sourceUsername;
      newMessage.message = messageSoup.GetNamedTag("text");
      newMessage.data    = messageSoup.GetNamedSoup("data");

      // Check if the user is ignored
      int buddyIndex = m_oaChat.GetBuddyIndex(newMessage.user);
      if (buddyIndex != -1 and m_oaChat.GetBuddyStyle(buddyIndex) == BuddyInfo.STYLE_IGNORED)
        continue;

      if (m_messages == null)
        m_messages = new ChannelMessage[0];

      m_messages[m_messages.size()] = newMessage;
      
      // Don't allow too many unviewed messages to queue up.
      if (m_messages.size() >= 256)
        m_messages[0, 16] = null;
      
      bHasReceivedMessage = true;
    }
    
    if (bHasReceivedMessage)
    {
      PostMessage(me, "ChatChannel.Message", "", 0.0f);
      
      // If we just queued our first message, notify of the state change.
      if (!bHadQueuedMessage)
      {
        m_oaChat.ClearMessages("OAChat.ChannelMessage", "");
        m_oaChat.PostMessage(m_oaChat, "OAChat.ChannelMessage", "", 0.5f);
      }
    }
  }

  // ============================================================================
  // Name: GetQueuedMessage
  // Desc: Returns the oldest queued message, removing it from the queue.
  // Retn: The oldest queued message.
  // ============================================================================
  public ChannelMessage GetQueuedMessage()
  {
    if (m_messages == null or m_messages.size() == 0)
      return null;

    ChannelMessage rtnMsg = m_messages[0];
    m_messages[0, 1] = null;
    
    // If we just consumed the last message, notify of the state change.
    if (m_messages.size() == 0)
    {
      m_oaChat.ClearMessages("OAChat.ChannelMessage", "");
      m_oaChat.PostMessage(m_oaChat, "OAChat.ChannelMessage", "", 0.5f);
    }

    return rtnMsg;
  }
  
  
  // ============================================================================
  // Name: CountQueuedMessages
  // Desc: Returns the number of unviewed messages queued on this channel.
  // Retn: The number of queued messages.
  // ============================================================================
  public int CountQueuedMessage(void)
  {
    if (m_messages == null)
      return 0;
    
    return m_messages.size();
  }

};