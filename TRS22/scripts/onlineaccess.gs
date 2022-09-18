//
// OnlineAccess.gs
//
// Copyright (C) 2004 Auran Developments Pty Ltd
// All Rights Reserved.
//
include "Soup.gs"
include "OnlineGroup.gs"


//! An interface class that allows online connectivity with other %Trainz users via Planet Auran.
//
// Objects of this class provide an instance of network access, with associated rights.  You must ensure to 
// protect your scripts such that other scripts cannot trivially gain access to your OnlineAccess instance, 
// including indirect access via calling your methods.  Only one OnlineAccess instance is provided for any
// given requesting Asset.  Multiple requests from scripts of the same Asset will return the same OnlineAccess
// instance.  When an OnlineAccess instance is completely released, it will automatically disconnect.
//
// Notes:
//  - Only one client login per Planet Auran profile will be accepted.  An attempt from a second client to log
//    in with the same profile will result in the first client being disconnected.  However, multiple 
//    OnlineAccess objects can be connected on the same client simultaneously.  Bandwidth limits, etc. are 
//    applied on a per-client basis.
//
//  - %Trainz may request permission from the local user for some operations.  The exact messages presented to
//    the user is implementation-specific.  <bi DO NOT> attempt to rely on the timing or presentation of these
//    messages.  Handle the status codes appropriately in all cases.
//
//  - Key names within the data soups should be kept short.  Namespacing is provided by the use of the Asset
//    keying of messages, so it is generally not necessary to use large key names.  Smaller key names allow 
//    for more data to be sent in the limited bandwidth available.
//
//  - It is only from within a Library script that you can create an OnlineAccess object.  Any other 
//    non-library script will have to call through to your library to access information exchanged via the
//    online features of this class.  How your library handles external requests is dependent on what
//    implementation of Library::LibraryCall() you provide.
//
//  - The <l astSrcRuleOnlineChat  Online Chat> rule makes use of OnlineAccess functionality.  The script
//    code that manages the online access for iTrainz Chat can be found in the <b \Trainz\scripts\OAChat.gs>
//    script file.
//
//
// Messages used by this class are:
//
// {[ Major           | Minor             | Source  | Destination   | Description  ]
//  [ "OnlineAccess"  | "ReceiveMessage"  | --      | OnlineAccess  | This message is sent to the OnlineAccess instance in response to a
//                                                                    client calling <a class="el" href="classOnlineAccess.html#a6">PostMessage</a>()
//                                                                    to send data to the local client.  Messages sent while a client is 
//                                                                    offline are delivered when a matching OnlineAccess instance is constructed.
//                                                                    After receiving this notification, the script must respond by calling 
//                                                                    <a class="el" href="classOnlineAccess.html#a7">CollectMessage</a>()
//                                                                    When multiple messages become available simultaneously, only one 
//                                                                    notification may be sent.  ]
//  [ "OnlineAccess"  | "StatusChange"    | --      | OnlineAccess  | This message is sent to the OnlineAccess instance 
//                                                                    when its network status has changed.  The 
//                                                                    <a class="el" href="classOnlineAccess.html#a1">GetStatus</a>()
//                                                                    method should be used to determine the new status.  ]}
//
// See also:
//     Library::GetOnlineAccess(), OnlineGroup
//
secured class OnlineAccess isclass GameObject
{

  //! \name   Connection Status Modes
  //  \anchor connectionStatus
  //@{
  //! Connection Status Modes
  //
  // These constants define the different states an OnlineAccess object can be in as reported
  // by OnlineAccess::GetStatus().
  //
  // See Also:
  //     OnlineAccess::GetStatus()
  //

  public define int MODE_DISABLED     = 0;  //!< User has not enabled online play.
  public define int MODE_OFFLINE      = 1;  //!< Connection attempt has not been made.
  public define int MODE_FAILED       = 2;  //!< Most recent connection attempt failed.
  public define int MODE_AUTH_FAILED  = 3;  //!< Authorization failure - user details are not valid.
  public define int MODE_DENIED_LOCAL = 4;  //!< User did not permit this script to gain online access.
  public define int MODE_INTERRUPTED  = 5;  //!< Existing connection has been disrupted.
  public define int MODE_CONNECTING   = 6;  //!< Connection attempt in progress.
  public define int MODE_ONLINE       = 7;  //!< Connected successfully.

  // other positive values are reserved for future expansion

  //@}


  //! Starts a background attempt to connect to Planet Auran.
  //
  // This method begins a background connection attempt.  GetStatus() can be queried to determine the ongoing
  // status of the connection attempt.  Calls made to Connect() while a connection attempt is in progress, or
  // an existing connection is active, will have no effect.
  //
  // Note:
  //     For this method to work, internet connectivity is required and the %Trainz installation must be 
  //     correctly configured for the user's Planet Auran account.
  //
  public native void Connect(void);

  //! Gets the current connection status. 
  //
  // This method allows the connection status of an OnlineAccess object to be queried so the script can 
  // determine if Connect() for example is making any progress in connecting to Planet Auran.
  //
  // Note:
  //     When the connection status changes, a message of type (<m"OnlineAccess">, <m "StatusChange">) is
  //     sent to this object.
  //
  // Note:
  //     The connection status can be changed by the game code at any time, so don't rely on this method as a
  //     one-off call to determine the connection status as it will inevitably change (i.e. keep calling this
  //     method to get updates when a (<m"OnlineAccess">, <m "StatusChange">) message is received.
  //
  // Returns:
  //     Returns the current connection status as one of the \ref connectionStatus "connection status" values.
  //
  public native int GetStatus(void);

  //! Cancel an in-progress connection attempt started by Connect(), or disconnect the current session.
  public native void Disconnect(void);


  //! Gets the Planet Auran username for the current user.
  //
  // At the moment, only one Planet Auran profile can be registered for a given version of %Trainz.
  //
  // Returns:
  //     Returns the Planet Auran Username for the current user.  If no Planet Auran username is 
  //     available, an empty string (<m"">) is returned.
  //
  public native string GetUsername(void);


  //! \name   Operation Result States
  //  \anchor operationResult
  //@{
  //! Operation Result States
  //
  // These constants are used to indicate the result of message/data transfer as returned by the various 
  // methods in the OnlineAccess class.
  //
  // See Also:
  //     OnlineAccess::GetLocalData(), OnlineAccess::SetLocalData(), OnlineAccess::CollectMessage(),
  //     OnlineAccess::PostMessage(), OnlineAccess::PostOfflineMessage(), OnlineAccess::CollectOfflineMessage()
  //

  public define int RESULT_OK = 0;                 //!< Operation successful.
  public define int RESULT_CONNECTION_FAILED = 1;  //!< Attempt failed due to connection error.
  public define int RESULT_DENIED_LOCAL = 2;       //!< Permission was denied by the user.
  public define int RESULT_DENIED_REMOTE = 3;      //!< Permission was denied by Planet Auran.
  public define int RESULT_FLOOD = 4;              //!< Permission denied due to excess send rate.
  public define int RESULT_OVERFLOW = 5;           //!< The request was too large (or the destination "mailbox" is full).
  public define int RESULT_NO_DATA = 6;            //!< No result data was available for this request.

  // other positive values are reserved for future expansion

  //@}


  //! Writes data to the user's local profile storage.
  //
  // Write <i data> to the user's local profile storage.  This method does not require an active network
  // connection.  Overwrites any existing data with a matching <i access> and <i key>.
  //
  // Param:  key   Key to identify the written data with.
  // Param:  data  Data to place in local profile.
  //
  // Returns:
  //     Returns one of the \ref operationResult "Operation Result" values indicating the result of this
  //     function call.
  //
  public native int SetLocalData(string key, Soup data);

  //! Gets the local data from this user's local profile storage.
  // 
  // Read <i data> from the user's local profile storage.  This does not require an active network connection.
  //
  // Param:  key   Key to identify which data is to be read.
  // Param:  data  Soup database to place local data into.
  //
  // Returns:
  //     Returns one of the \ref operationResult "Operation Result" values indicating the result of this
  //     function call.
  //
  public native int GetLocalData(string key, Soup data);


  //
  // Write <data> to the local user's Planet Auran storage. Overwrites any existing data with a matching <access> and <key>.
  // This function will fail if <data> is large or if the function is called too frequently. It will also fail
  // if the user's profile is too full to accept local data.
  //
  // NOT YET IMPLEMENTED
  //public native int SetProfileData(string key, Soup data);

  //
  // Read <data> from the local user's Planet Auran storage. Returns an empty soup if no data matches <access> and <key>.
  //
  // NOT YET IMPLEMENTED
  //public native int GetProfileData(string key, Soup data);



  //! Posts a message to the specified user.
  //
  // Posts <i data> to the specified user.  Will not overwrite any existing data.
  //
  // This method allows data to be sent to both offline and online users.  When the recipient user is online
  // and has a matching OnlineAccess instance, a message of type (<m"OnlineAccess">, <m"ReceiveMessage">) will
  // be generated to notify their OnlineAccess object of the received message.  From there, CollectMessage() 
  // can be called to get the data received.
  //
  // The sender of the message (i.e. the caller of this function) is not notified of successfully delivery;
  // the result status returned by this method only reflects the success of the 'send' operation.
  //
  // This method will fail if <i data> is too large or if it is called too frequently.  It will also fail if
  // the destination user's Planet Auran storage is too full to accept remote data.
  //
  // Note:
  //     A network message sent by this method is not to be confused with the %Trainz GS object messages,
  //     even though a <l Message  object message> is used indicate the arrival of a new network message.
  //
  // Param:  destUsername  Username to send message to.
  // Param:  data          %Message data.
  //
  // Returns:
  //     Returns one of the \ref operationResult "Operation Result" values indicating the result of this
  //     function call.
  //
  public native int PostMessage(string destUsername, Soup data);



  //! Collects a received network message.
  //
  // This method retrieves a queued message and returns it in <i o_data> and <i o_sourceUsername>.  It should 
  // only be called in response to the script receiving a (<m"OnlineAccess">, <m "ReceiveMessage">) message.
  // If a queued message is not collected prior to releasing the OnlineAccess object, it is discarded.
  //
  // Param:  o_sourceUsername  Username to collect message from.
  // Param:  o_data            %Message data will be placed in this database.
  //
  // Returns:
  //     Returns one of the \ref operationResult "operation result" values indicating the result of this
  //     function call.
  //
  public native int CollectMessage(string o_sourceUsername, Soup o_data);



  //! Creates a new group on the Planet Auran servers.
  //
  // Returns:
  //     Returns an OnlineGroup instance, which refers to a new group on the Planet Auran servers, 
  //     otherwise null if one cannot be created.
  //
  // See Also:
  //     OnlineGroup::GetStatus()
  //
  public native OnlineGroup CreateGroup(int initialGroupFlags);
  
  // Backwards-compatibility support.
  public OnlineGroup CreateGroup(void) { return CreateGroup(0); }



  //! Opens up an online group.
  //
  // Param:  onlineGroupCookie  If the specified cookie is not valid, the group will enter 
  //                            \ref operationResult "STATUS_CLOSED".
  //
  // Returns:
  //     Returns an OnlineGroup instance which refers to an existing group on the Planet Auran servers.
  //     Otherwise null if a group matching <i onlineGroupCookie> could not be found.
  //     A "named group" can be opened by using a custom string prefix with the '#' character. This
  //     group will be created if it does not exist, or opened if it already exists.
  //
  // See Also:
  //     OnlineGroup::GetOnlineGroupCookie()
  //
  public native OnlineGroup OpenGroup(string onlineGroupCookie, int initialGroupFlags);
  
  // Backwards-compatibility support.
  public OnlineGroup OpenGroup(string onlineGroupCookie) { return OpenGroup(onlineGroupCookie, 0); }



  // No longer supported.
  public obsolete int PostOfflineMessage(Soup data) { return 0; }



  // No longer supported.
  public obsolete int CollectOfflineMessage(Soup o_data) { return 0; }



  //! Gets whether this players planet auran account can currently use multiplayer
  //
  // This data may be sent to the client from the iTrainz server, it is therefore
  // invalid unless this OnlineAccess is connected. See Connect().
  //
  // Returns:
  //     true if the player can host or join multiplayer games
  //
  // See Also:
  //     OnlineAccess::Connect()
  //
  public native bool CanAccessMultiplayer();
};


