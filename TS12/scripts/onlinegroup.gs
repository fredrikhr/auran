//
// OnlineGroup.gs
//
// Copyright (C) 2004 Auran Developments Pty Ltd
// All Rights Reserved.
//

include "OnlineAccess.gs"


//! An online grouping of Planet Auran users.
//
// This class provides management features for a group of Planet Auran users.  A group like this is 
// created by calling OnlineAccess::CreateGroup() or you can join an existing one by calling
// OnlineAccess::OpenGroup().
//
// Messages used by this class are:
// {[ Major          | Minor          | Source  | Destination   | Description  ]
//  [ "OnlineGroup"  | "UsersChange"  | --      | online group  | This message is sent to the OnlineGroup instance in
//                                                                response to a user being added or removed from the
//                                                                group, or having their status change (local changes
//                                                                may not cause notification.)  ]
//  [ "OnlineGroup"  | "StatusChange" | --      | online group  | This message is sent to the OnlineGroup when a 
//                                                                network status change has occurred.  ]}
//  [ "OnlineGroup"  | "ReceiveMessage"  | --   | online group  | This message is sent to the OnlineGroup instance in response to a
//                                                                client calling PostMessage() to send data to the local client. 
//                                                                After receiving this notification, the script must respond by calling 
//                                                                CollectMessage(). When multiple messages become available 
//                                                                simultaneously, only one notification may be sent.  ]
//
// These messages are indicators of something happening in the group.  You will need to have your
// own thread to wait for these messages and use the interface methods of this class to find out
// what is happening in the group.  
//
// Note:
//     Most of the user management methods in this class require the group to be 
//     \ref groupConnectStatus "STATUS_OPEN", otherwise they may have no effect.
//
// Note:
//     The <l astSrcRuleOnlineChat  Online Chat> rule makes use of OnlineAccess and OnlineGroup
//     functionality.  The script code that manages the grouping for iTrainz Chat can be found in
//     the <b \Trainz\scripts\OAChat.gs> script file.
//
// See Also:
//     OnlineAccess, OnlineAccess::CreateGroup(), OnlineAccess::OpenGroup()
//
secured class OnlineGroup isclass GameObject
{
  //! \name   Group Status Modes
  //  \anchor groupStatusModes
  //@{
  //! Group User Status Modes
  //
  // These constant values define the status of a particular user in this group as reported by 
  // OnlineGroup::GetUserStatus(string) or OnlineGroup::GetUserStatus(int).
  //
  // See Also:
  //     OnlineGroup::GetUserStatus(string), OnlineGroup::GetUserStatus(int)
  //

  public define int USER_STATUS_UNKNOWN = 0;   //!< Specified user is not a member of this group, or local user is offline.
  public define int USER_STATUS_OFFLINE = 1;   //!< User is offline.
  public define int USER_STATUS_ONLINE  = 2;   //!< User is online but does not have this group open.
  public define int USER_STATUS_INSIDE  = 3;   //!< User is online and has this group open.
  public define int USER_STATUS_INVALID = 4;   //!< Requested user does not exist.

  //@}


  //! \name   Group Connection Status
  //  \anchor groupConnectStatus
  //@{
  //! Group Connection Status
  //
  // Connection status of the group as reported by OnlineGroup::GetStatus().
  //
  // See Also:
  //     OnlineGroup::GetStatus()
  //

  public define int STATUS_OFFLINE = 0;        //!< Local user is not currently online.
  public define int STATUS_CONNECTING = 1;     //!< Attempting a connection to this group on the Planet Auran server.
  public define int STATUS_OPEN = 2;           //!< Connected to this group on the Planet Auran server.
  public define int STATUS_CLOSED = 3;         //!< Planet Auran server has marked this group as closed.

  //@}
  
  
  // ============================================================================
  // GROUP_MODEFLAG bit field.
  // See also OnlineGroup::SetModeFlags().
  // ============================================================================
  public define int GROUP_MODEFLAG_CLOSED = 1;                // New subscribers cannot join. Only the group creator may subscribe to the group.

  public define int GROUP_MODEFLAG_PRIVATE = 2;               // All subscribers must first be users, and where removing a user kicks the subscriber.
                                                              // The group creator is automatically added as a user.

  public define int GROUP_MODEFLAG_CONTROLLED = 4;            // Only officers may add/remove users; the group creator is automatically added as
                                                              // a user and set as an officer.

  public define int GROUP_MODEFLAG_MODERATED = 8;             // Only voiced users may send group messages.

  public define int GROUP_MODEFLAG_WALLED = 16;               // Only group members may send group messages.


  // ============================================================================
  // GROUPMEMBER_MODEFLAG bit field.
  // See also OnlineGroup::SetUserModeFlags().
  // ============================================================================
  public define int GROUPMEMBER_MODEFLAG_OFFICER = 1;         // This user is an officer of the group.

  public define int GROUPMEMBER_MODEFLAG_VOICED = 2;          // This user may speak even if the group is moderated.

  public define int GROUPMEMBER_MODEFLAG_SUBSCRIBER = 4;      // This user is also a subscriber to the group.



  //! Attempt to connect to this group on the Planet Auran server.
  //
  // Attempt to connect to this group on the Planet Auran server. If this OnlineGroup instance is 
  // in \ref groupConnectStatus "STATUS_CLOSED", this call will initiate an asynchronous connection
  // attempt to the group.
  //
  // If the connection attempt is successful, this OnlineGroup instance will be moved to 
  // \ref groupConnectStatus "STATUS_OPEN".
  //
  // If the Planet Auran server cannot be contacted, this OnlineGroup instance will be moved to 
  // \ref groupConnectStatus "STATUS_OFFLINE".
  // If the group is not available or has been closed, this OnlineGroup instance will be moved to
  // \ref groupConnectStatus "STATUS_CLOSED".
  //
  // If this OnlineGroup instance is already in \ref groupConnectStatus "STATUS_OPEN" or 
  // \ref groupConnectStatus "STATUS_CONNECTING", this call has no effect.
  //
  // Note:
  //     When a change of status has occurred, this group object will receive a message of type 
  //     (<m"OnlineGroup">, <m "StatusChange">).  You can then query the current status by calling
  //     GetStatus().
  //
  public native void Connect(void);


  //! Cancels an in-progress connection attempt started by Connect(), or disconnect a current session.
  public native void Disconnect(void);
  
  

  //! Gets the current status of this OnlineGroup instance.
  //
  // Note:
  //     A message of type (<m"OnlineGroup">, <m "StatusChange">) is sent to this OnlineGroup object
  //     when the status of the group changes.
  //
  // Returns:
  //     Returns the one of the \ref groupConnectStatus "group connection status" values indicating
  //     the current status of this OnlineGroup instance.
  //
  public native int GetStatus(void);
  
  

  //! Gets the cookie string for this online group.
  //
  // The cookie string is appropriate for passing to OnlineAccess::OpenGroup().
  //
  // Note:
  //     Cookies used in online access groups <bi are not> edible.
  //
  // Returns:
  //     Returns a cookie for this group. If this OnlineGroup instance is \ref groupConnectStatus "STATUS_CLOSED",
  //     an empty string is returned.
  //
  public native string GetOnlineGroupCookie(void);



  //
  // The following user-management routines require that this OnlineGroup instance is in 
  // STATUS_OPEN, otherwise they may have no effect.
  //

  //! Adds the named user to this online group.
  //
  // Request that the specified user be added to this OnlineGroup.  There may be a delay between
  // issuing the request and the user being added.
  //
  // Param:  profilename  Planet Auran username of used to add to this group.
  //
  public native void AddUser(string profilename);
  
  

  //! Removes the named user from this online group.
  //
  // Request that the specified user be removed from this OnlineGroup.  There may be a delay 
  // between issuing the request and the user being removed.
  //
  // Param:  profilename  Planet Auran profile name of user to remove.
  //
  public native void RemoveUser(string profilename);
  
  

  //! Gets the amount of users currently in this group.
  //
  // Returns:
  //     Returns the number of users currently in this group.
  //
  public native int CountUsers(void);
  
  

  //! Gets the profile name of a group member by index.
  //
  // Param:  index  Index of user to get the name of.  Must be in the range of 
  //                [0 <= <i index> < CountUsers()].
  //
  // Returns:
  //     Returns the profile name of the indexed user if possible, an empty string otherwise.
  //
  public native string GetIndexedUser(int index);
  
  

  //! Finds the index of the named user.
  //
  // Note:
  //     The mapping between a user's index and profile name may change as users are added and 
  //     removed from the group.
  //
  // Param:  profilename  Planet Auran profile name of user to find the index of in this group.
  //
  // Returns:
  //     Returns the index for the named user, or -1 if the user is not a member of this group.
  //
  public native int FindUser(string profilename);



  //! Determines if the named user is currently a member of this group.
  //
  // Param:  profilename  Planet Auran profile name of user to look for in this group.
  //
  // Returns:
  //     Returns true if the specified user is currently in this group, false otherwise.
  //
  public bool HasUser(string profilename) { return FindUser(profilename) != -1; }
  
  

  //! Gets the current status of the specified user in this group.
  //
  // Param:  index  User index value (obtained via FindUser()).
  //
  // Returns:
  //     Returns one of the \ref groupStatusModes "user status modes" indicating the status of the user
  //     specified by <i index> if they exist in this group, \ref groupStatusModes "USER_STATUS_UNKNOWN"
  //     otherwise.
  //
  public native int GetUserStatus(int index);
  
  

  //! Gets the current status of the named user.
  //
  // Param:  profilename  Planet Auran profile name of user to get status of.
  //
  // Returns:
  //     Returns one of the \ref groupStatusModes "user status modes" indicating the status of the user
  //     specified by <i profilename> if they exist in this group, \ref groupStatusModes "USER_STATUS_UNKNOWN"
  //     otherwise.
  //
  public int GetUserStatus(string profilename) { return GetUserStatus(FindUser(profilename)); }
  
  
  
  //! Posts a message to the all users subscribed to this group.
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
  // Param:  data          %Message data.
  //
  // Returns:
  //     Returns one of the \ref operationResult "Operation Result" values indicating the result of this
  //     function call.
  //
  // See Also:
  //     OnlineAccess.PostMessage()
  //
  public native int PostMessage(Soup data);



  //! Collects a received network message.
  //
  // This method retrieves a queued message and returns it in <i o_data> and <i o_sourceUsername>.  It should 
  // only be called in response to the script receiving a (<m"OnlineGroup">, <m "ReceiveMessage">) message.
  // If a queued message is not collected prior to releasing the OnlineGroup object, it is discarded.
  //
  // Param:  o_sourceUsername  Username to collect message from.
  // Param:  o_data            %Message data will be placed in this database.
  //
  // Returns:
  //     Returns one of the \ref operationResult "operation result" values indicating the result of this
  //     function call.
  //
  // See Also:
  //     OnlineAccess.CollectMessage()
  //
  public native int CollectMessage(string o_sourceUsername, Soup o_data);
  
  
  // ============================================================================
  // Name: SetModeFlags
  // Desc: Attempts to set the specified modes on this group. Any changes that
  //       the local user does not have sufficient privileges to enact are 
  //       silently ignored.
  // Parm: modeFlags - A bitfield containing any flags to be switched 'on'.
  // Parm: modeFlagsMask - A bitfield containing any flags to be modified.
  // ============================================================================
  public native void SetModeFlags(int modeFlags, int modeFlagsMask);
  
  
  // ============================================================================
  // Name: SetUserModeFlags
  // Desc: Attempts to set the specified modes on a user in this group. Any 
  //       changes that the local user does not have sufficient privileges to  
  //       enact are silently ignored.
  // Parm: username - The user belonging this group.
  // Parm: modeFlags - A bitfield containing any flags to be switched 'on'.
  // Parm: modeFlagsMask - A bitfield containing any flags to be modified.
  // ============================================================================
  public native void SetUserModeFlags(string username, int modeFlags, int modeFlagsMask);


  // ============================================================================
  // Name: GetUserModeFlags
  // Desc: Gets the currently set modes on a user in this group
  // Parm: username - The user to get the status of
  // Retn: int - A bitfield containing any flags which are switched 'on'
  // ============================================================================
  public native int GetUserModeFlags(string username);


};



