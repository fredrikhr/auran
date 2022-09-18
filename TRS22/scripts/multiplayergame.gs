//=============================================================================
// File: MultiplayerGame.gs
// Desc: Defines the MultiplayerGame class which provides the interface to the
//       native code responsible for multiplayer
//=============================================================================
include "SecurityToken.gs"
include "OnlineAccess.gs"
include "WorldCoordinate.gs"


//=============================================================================
// Name: MultiplayerGame
// Desc: Interface to the native multiplayer code. Initialisation and ending
//       of multiplayer games is restricted to the multiplayer session manager
//=============================================================================
final static class MultiplayerGame
{
  //=============================================================================
  // Name: Init
  // Desc: Initialises a multiplayer game instance
  // Parm: token - Token created by the Multiplayer Session Manager Library
  // Parm: serverUsername - The username of the server
  // Parm: bIsClient - true if this instance is a client
  // Parm: onlineAccess - OnlineAccess useable by the multiplayer game classes
  // Parm: gameGroup - An OnlineGroup containing every client in the multiplayer
  //       game, must be useable for communication by the multiplayer classes
  // Note: onlineAccess and gameGroup should not be used by any other classes
  //=============================================================================
  public native bool Init(SecurityToken token, string serverUsername, bool bIsClient,
                          OnlineAccess onlineAccess, OnlineGroup gameGroup);


  //=============================================================================
  // Name: End
  // Desc: Ends a multiplayer game instance
  // Parm: token - Token created by the Multiplayer Session Manager Library
  //=============================================================================
  public native void End(SecurityToken token);


  //=============================================================================
  // Name: IsActive
  // Desc: Returns true if a multiplayer game is in progress
  //=============================================================================
  public native bool IsActive();


  //=============================================================================
  // Name: IsClient/IsServer
  // Desc: Returns true if there is a multiplayer game running and this machine
  //       is a client/server.
  //=============================================================================
  public native bool IsClient();
  public native bool IsServer();


  //=============================================================================
  // Name: GetServerUsername
  // Desc: Returns the username of the game server endpoint.
  //=============================================================================
  public native string GetServerUsername();


  //=============================================================================
  // Name: IsLoadingClient
  // Desc: Returns true if the initial client multiplayer data is being loaded
  //       from the network. Returns false on the server, if there is no active
  //       multiplayer game or if load is complete.
  // Parm: clientName - The client to check the load state for (server only)
  //=============================================================================
  public native bool IsLoadingClient();
  public native bool IsLoadingClient(string clientName);


  //=============================================================================
  // Name: GetClientLoadProgress
  // Desc: Returns an estimate of the multiplayer loading progress for a client.
  //       Multiplayer clients can only retrieve their own loading progress, on
  //       the server a client name may be specified.
  // Parm: clientName - The client to check the load state for (server only)
  // Retn: float - Estimate of loading progress (0-1)
  //=============================================================================
  public native float GetClientLoadProgress();
  public native float GetClientLoadProgress(string clientName);


  //=============================================================================
  // Name: GetServerUsername
  // Desc: Returns the last known position of the camera for a given client. This
  //       data is semi-regularly transfered over the network by native code, but
  //       may be slightly stale. Suitable for limiting network data transfer,
  //       moving to player world position, etc.
  // Parm: clientName - The username of the client to query the camera position
  //       for (passing the server name or local player username is valid, an
  //       empty or null string is not).
  // Retn: WorldCoordinate - The last known WorldCoordinate for the client, or
  //       null if no such client exists in the game.
  //=============================================================================
  public native WorldCoordinate GetClientCameraLocation(string clientName);


  //=============================================================================
  // Name: SendGameplayMessageToClient
  // Desc: Sends a multiplayer 'gameplay' message across the network to another
  //       client. Only valid during multiplater games. This will post a script
  //       message to the Interface object when it is received on the client.
  // Parm: clientName - The client to send the message to (must be in this game)
  // Parm: msgMajor - The major component of the broadcast message
  // Parm: msgMinor - The minor component of the broadcast message
  // Parm: data - The data of the broadcast message. On the recieving end the
  //       native code will add the sending users profile name with the tag
  //       "__sender". Do not use any tag names that begin with a double
  //       underscore "__" on send, they will be stripped.
  //=============================================================================
  public native void SendGameplayMessageToClient(string clientName, string msgMajor, string msgMinor, Soup data);


  //=============================================================================
  // Name: SendGameplayMessageToServer
  // Desc: Sends a multiplayer 'gameplay' message across the network to the game
  //       server. Only valid during multiplater games. This will post a script
  //       message to the Interface object when it is received on the server.
  // Parm: msgMajor - The major component of the broadcast message
  // Parm: msgMinor - The minor component of the broadcast message
  // Parm: data - The data of the broadcast message. On the recieving end the
  //       native code will add the sending users profile name with the tag
  //       "__sender". Do not use any tag names that begin with a double
  //       underscore "__" on send, they will be stripped.
  //=============================================================================
  public native void SendGameplayMessageToServer(string msgMajor, string msgMinor, Soup data);


  //=============================================================================
  // Name: BroadcastGameplayMessage
  // Desc: Broadcasts a multiplayer 'gameplay' message over the network to every
  //       client. Only valid during multiplater games. This will post a script
  //       message to the Interface object when it is received on the client(s).
  // Parm: msgMajor - The major component of the broadcast message
  // Parm: msgMinor - The minor component of the broadcast message
  // Parm: data - The data of the broadcast message. On the recieving end the
  //       native code will add the sending users profile name with the tag
  //       "__sender". Do not use any tag names that begin with a double
  //       underscore "__" on send, they will be stripped.
  //=============================================================================
  public native void BroadcastGameplayMessage(string msgMajor, string msgMinor, Soup data);


  //=============================================================================
  // Name: GetGameChatChannel
  // Desc: Returns the name of the game chat channel if it's initialised,
  //       otherwise an empty string is returned
  //=============================================================================
  public native string GetGameChatChannel();


  //=============================================================================
  // Name: GetClientToServerLatency
  // Desc: Returns the last calculated client-to-server roundtrip latency time
  //       in milliseconds.
  //=============================================================================
  public native int GetClientToServerLatency();


  //=============================================================================
  // Name: GetAllowDriverOrderListReplication
  // Desc: Returns true if the replication of non-owned drivers' order lists is
  //       permitted. This may be disabled for gameplay reasons.
  //=============================================================================
  public native bool GetAllowDriverOrderListReplication();


  //=============================================================================
  // Name: SetAllowDriverOrderListReplication
  // Desc: Sets whether the replication of non-owned drivers' order lists is
  //       permitted. This may be disabled for gameplay reasons.
  //=============================================================================
  public native void SetAllowDriverOrderListReplication(bool allow);

};

