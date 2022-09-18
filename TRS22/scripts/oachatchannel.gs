//=============================================================================
// File: OAChatChannel.gs
// Desc: Defines the channel class used by OAChat
//=============================================================================
include "OAChat.gs"


//=============================================================================
// Name: ChannelMessage
// Desc: A simple channel message struct
//=============================================================================
obsolete class ChannelMessage
{
  public string user;
  public string message;
  public Soup   data;
};


//=============================================================================
// Name: ChatChannel
// Desc: class describing a chat channel. Holds an array of queued messages.
//=============================================================================
obsolete class ChatChannel isclass GameObject
{
  public BuddyInfo         m_buddyInfo;
  public OnlineGroup       m_channelGroup;
  public ChannelMessage[]  m_messages;

  public bool Init(OAChat oaChat, BuddyInfo buddyInfo, OnlineGroup channelGroup) { return false; }
  public ChannelMessage GetQueuedMessage() { return null; }
  public int CountQueuedMessage(void) { return 0; }


};