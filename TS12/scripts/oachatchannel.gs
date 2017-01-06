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

    // Add handlers
    AddHandler(m_channelGroup, "OnlineGroup",             "StatusChange",   "HandleStatusChange");
    AddHandler(m_channelGroup, "OnlineGroup.UserAdded",   "",               "HandleUserAdded");
    AddHandler(m_channelGroup, "OnlineGroup.UserRemoved", "",               "HandleUserRemoved");
    AddHandler(m_channelGroup, "OnlineGroup.UserStatus",  "",               "HandleUserStatus");
    AddHandler(m_channelGroup, "OnlineGroup",             "ReceiveMessage", "HandleReceiveMessage");

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

  // Recieve message handler
  void HandleReceiveMessage(Message msg)
  {
    string sourceUsername = "";
    Soup messageSoup = Constructors.NewSoup();

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

      PostMessage(me, "ChatChannel.Message", "", 0.0f);
    }
  }

  // Gets the first queued message and removes it from the array
  public ChannelMessage GetQueuedMessage()
  {
    if (m_messages == null or m_messages.size() == 0)
      return null;

    ChannelMessage rtnMsg = m_messages[0];
    m_messages[0, 1] = null;

    return rtnMsg;
  }

};