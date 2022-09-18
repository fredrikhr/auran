//=============================================================================
// File: gs.gs
// Desc: Copyright (C) 2002-2003 Auran Developments Pty Ltd
//=============================================================================
include "GameObjectID.gs"



//=============================================================================
// Name: GameObject
// Desc: GameObject is the base class for any object that requires messaging
//       or threading support. GameObjects are placed in the games object table
//       (Router). Each game object has a unique ID (assigned by the game, see
//       GetId()) and many also have a unique name. GameObject instances are
//       often referred to as a 'node' because they represent a message node in
//       the game message Router.
//=============================================================================
game class GameObject isclass GSObject
{

  //=============================================================================
  // Name: SendMessage
  // Desc: Sends a message to a destination object immediately.
  // Parm: dst - The object to send the message to.
  // Parm: major - Message major type.
  // Parm: minor - Message minor type.
  // Parm: paramSoup - An optional Soup containing extra parameters. Tag names 
  //       beginning with "__" are reserved for system data and will be stripped.
  //=============================================================================
  public native void SendMessage(GameObject dst, string major, string minor);
  public native void SendMessage(GameObject dst, string major, string minor, GSObject paramSoup);


  //=============================================================================
  // Name: PostMessage
  // Desc: Posts a message to the given destination object. Posted messages are
  //       queued for processing and are generally prefered over SendMessage.
  // Parm: dst - The object to post the message to.
  // Parm: major - Message major type.
  // Parm: minor - Message minor type.
  // Parm: paramSoup - An optional Soup containing extra parameters. Tag names 
  //       beginning with "__" are reserved for system data and will be stripped.
  // Parm: seconds - Amount of seconds to delay before the message is sent. If
  //       0.0, the message will be sent straight away on the next game update.
  //=============================================================================
  public native void PostMessage(GameObject dst, string major, string minor, float seconds);
  public native void PostMessage(GameObject dst, string major, string minor, GSObject paramSoup, float seconds);


  //=============================================================================
  // Name: PostObsoleteMessage
  // Desc: Same as PostMessage() above, but used to phase out legacy messages.
  //       When running in maximum compatibility mode, Trainz will treat calls to
  //       this function identically to a call to PostMessage(). However, if the
  //       compatibility mode is set toward higher performance this message may
  //       not be posted, and/or may generate errors if it's handled.
  //=============================================================================
  public native void PostObsoleteMessage(GameObject dst, string major, string minor, GSObject paramSoup, float seconds);
  public void PostObsoleteMessage(GameObject dst, string major, string minor, float seconds) { PostObsoleteMessage(dst, major, minor, null, seconds); }


  //=============================================================================
  // Name: ClearMessages
  // Desc: Clears all messages of the specified type from this object that are
  //       outstanding via PostMessage().
  // Parm: major - Message major type to clear.
  // Parm: minor - Message minor type to clear. If blank, all messages of type
  //       major will be cleared.
  //=============================================================================
  public native void ClearMessages(string major, string minor);


  //=============================================================================
  // Name: AddHandler
  // Desc: Adds a message handler to this game object such that it will be called
  //       whenever the target GameObject receives a message of the specified
  //       major and minor type.
  // Param: target - Target object.
  // Param: major - Message major type to listen for.
  // Param: minor - Message minor type to listen for. If null or an empty string,
  //        all messages that match 'major' will be seen regardless of what the
  //        minor type is.
  // Param: handler - Name of the function to call in 'target' when a matching
  //        message is sent to this object.
  //=============================================================================
  public native void AddHandler(GameObject target, string major, string minor, string handler);


  //=============================================================================
  // Name: Sniff
  // Desc: Requests that this object be notified of messages posted to the target
  // Parm: target - The object that the messages are posted to
  // Parm: major - The msg.major string of the message to be notified of
  // Parm: minor - The msg.minor string of the message to be notified of. This
  //       may be null/empty to be notified of all messages that match the major
  //       string.
  // Parm: state - Whether to enable message forwarding, or disable it.
  //=============================================================================
  public native void Sniff(GameObject target, string major, string minor, bool state);


  //=============================================================================
  // Name: Sniff
  // Desc: Requests that this object be forwarded any messages posted to the
  //       object with the target GameObjectID passed.
  // Parm: target - The ID of the object that the messages are posted to
  // Parm: major - The msg.major string of the message to be notified of
  // Parm: minor - The msg.minor string of the message to be notified of. This
  //       may be null/empty to be notified of all messages that match the major
  //       string.
  // Parm: state - Whether to enable message forwarding, or disable it.
  //=============================================================================
  public native void Sniff(GameObjectID target, string major, string minor, bool state);


  //=============================================================================
  // Name: Sleep
  // Desc: Causes the current script thread to pause for the passed time
  //=============================================================================
  public native void Sleep(float seconds);


  //=============================================================================
  // Name: GetGameObjectID
  // Desc: Gets this object's unique GameObjectID. See GameObjectID.gs for more
  //       information on GameObjectIDs and how to use them. Not all GameObject
  //       types support GameObjectID - typically only placeable objects do.
  // Retn: GameObjectID - The GameObjectID of this GameObject, or null if this
  //       GameObject does not support GameObjectIDs or this object's
  //       GameObjectID has not yet been assigned.
  //=============================================================================
  public native GameObjectID GetGameObjectID(void);


  // Obsolete, use GameObjectID instead, as this ID may be reassigned
  public /*obsolete*/ native int GetId(void);

  // Obsolete, use GameObjectID instead, as this may not actually be unique
  public /*obsolete*/ native string GetName(void);


  //=============================================================================
  // Name: GetDebugName
  // Desc: Returns a debug name for identifying this object in logs etc. This is
  //       not guaranteed to be human-readable, but will be where possible.
  //=============================================================================
  public legacy_compatibility string GetDebugName(void)
  {
    GameObjectID id = GetGameObjectID();
    if (id)
      return id.GetDebugString();

    // We'll still have a Router ID and may have a name, so return that in case it helps
    return "GameObjectID{" + GetGSClassName() + ":" + (string)GetId() + " \"" + GetName() + "\"}";
  }


  //=============================================================================
  // Name: Exception
  // Desc: Causes the current thread to give an exception.
  //=============================================================================
  public native void Exception(string reason);


  //! A reference to an unknown object for user extension data.
  public object extension;

};



//=============================================================================
// Name: Message
// Desc: An message object. This is used to pass generic messages between
//       script objects. See: PostMessage, SendMessage, AddHandler and Sniff.
// NOTE: Do not alter this class - the ordering and size are hard coded!
//=============================================================================
final class Message
{
  public string major;        // Major message type.
  public string minor;        // Minor message type.
  public object src;          // Source object.
  public object dst;          // Destination object.
  public object paramSoup;    // an optional Soup containing extra parameters
};



//=============================================================================
// Name: Router
// Desc: Routes messages between game objects.
//=============================================================================
final static class Router
{
  // Obsolete, do not use.
  // Message broadcasting causes every script object to be sent a message. This
  // is very inefficient, as most nodes won't want the message, and unneccesay,
  // as Sniff can be used to be notified of specific messages on objects.
  // Note that in future versions scripts attempting to post or receieve
  // broadcast messages may trigger script exceptions and/or error logs.
  public obsolete define int MESSAGE_BROADCAST = 0;

  //! Obsolete, as GameObjectID is more robust.
  public obsolete native GameObject GetGameObject(int uniqueId);

  //! Obsolete, as we no longer support foreign contexts.
  public obsolete GameObject GetForeignGameObject(int uniqueId) { return GetGameObject(uniqueId); }

  //! Obsolete, as GameObjectID is more robust.
  public obsolete native GameObject GetGameObject(string uniqueName);


  //=============================================================================
  // Name: GetGameObject
  // Desc: Returns the resident GameObject which corresponds with the specified
  //       GameObjectID, or null if no matching object is resident. This behaves
  //       identically to the obsolete string or integer ID variants.
  // Parm: gameObjectID - The ID of the object to find. See the comments in
  //       GameObjectID.gs for more information.
  // Retn: GameObject - The GameObject, or null if no matching object is found.
  //=============================================================================
  public native GameObject GetGameObject(GameObjectID gameObjectID);


  //=============================================================================
  // Name: SerialiseGameObjectIDFromString
  // Desc: Constructs a genuine GameObjectID from a string.
  // Parm: gameObjectIDString - A string representing a GameObjectID, as returned
  //       by GameObjectID.SerialiseToString()
  // Retn: GameObjectID - The constructed GameObjectID, or null if the string
  //       was unable to be parsed. A valid return result does NOT indicate that
  //       there is a GameObject with this ID in any script context.
  //=============================================================================
  public native GameObjectID SerialiseGameObjectIDFromString(string gameObjectIDString);


  //=============================================================================
  // Desc: Returns whether a game object still exists in this router, or has
  //       been deleted/unloaded in native code.
  // Parm: object - The object to test.
  // Retn: True if the object is still alive and well, false if its native
  //       component has been deleted.
  //=============================================================================
  public native bool DoesGameObjectStillExist(GameObject obj);


  //=============================================================================
  // Name: LegacyBroadcastMessage
  // Desc: Added to allow scripts to phase out support for message broadcasts.
  //       This behaves the same as using PostMessage with MESSAGE_BROADCAST, but
  //       without ever triggering script exceptions. This is NOT a replacement
  //       function, and will cease working at the same time as traditional
  //       message broadcast. It should ONLY be used in situations where just
  //       removing a broadcast would break script compatibility.
  //       If calls are added to use this it is recommended a local message post
  //       is added to replace the broadcast, so that scripts can instead Sniff
  //       for that instead of breaking functionality.
  // Parm: srcNode - The source node to send the message from
  // Parm: major - Message major type
  // Parm: minor - Message minor type
  // Parm: delay - Seconds to delay for before broadcasting the message
  // Parm: bFailSilently - If true no script exceptions or error logs will be
  //       triggered by calls which fail for compatibility reasons. This does NOT
  //       change the functionality other than to suppress error messages.
  //=============================================================================
  public native void LegacyBroadcastMessage(GameObject srcNode, string major, string minor, float delay, bool bFailSilently);


  //=============================================================================
  // Name: PostMessage
  // Desc: Obsolete, do not use.
  //       Uses node IDs to manually post a message, allowing non-GameObjects
  //       to use the message system, and providing the interface for broadcasts.
  //=============================================================================
  public obsolete void PostMessage(int srcNodeId, int dstNodeId, string major, string minor, float delay)
  {
    GameObject srcNodeObj = GetGameObject(srcNodeId);

    if (dstNodeId == MESSAGE_BROADCAST)
      LegacyBroadcastMessage(srcNodeObj, major, minor, delay, false);
      
    else if (srcNodeObj)
      srcNodeObj.PostMessage(GetGameObject(dstNodeId), major, minor, delay);
  }


  //=============================================================================
  // Name: Info
  // Desc: Logs current router information and statistics
  //=============================================================================
  public native void Info();
  
  
  // ============================================================================
  // Name: GetCurrentThreadGameObject
  // Desc: Return the GameObject on which the current thread is running.
  // Retn: GameObject - The GameObject on which the current thread of execution
  //       is running.
  // Note: Since a script function on one object can make calls to functions on
  //       another object, the 'me' object may not have any direct relationship
  //       with the object upon which the thread is executing. If the wait()
  //       function is used, incoming messages are received from the thread's
  //       object and NOT from the 'me' object. In order to receive incoming
  //       messages from the 'me' object, the thread's object must Sniff() the
  //       'me' object.
  // ============================================================================
  public native GameObject GetCurrentThreadGameObject(void);

};




//=============================================================================
// Name: Math
// Desc: Static class with various mathematical utility methods.
//=============================================================================
final static class Math
{
  // Constants
  public define float PI = 3.14159265;


  //=============================================================================
  // Name: Rand
  // Desc: Returns a random number between the two given values.
  // Parm: lower - Lower limit for random value (inclusive).
  // Parm: upper - Upper limit for random value (exclusive).
  // Retn: A random value greater than or equal to lower, and less than upper.
  //=============================================================================
  public native float Rand(float lower, float upper);


  //=============================================================================
  // Name: Rand
  // Desc: Returns a random number between the two given values.
  // Parm: lower - Lower limit for random value (inclusive).
  // Parm: upper - Upper limit for random value (exclusive).
  // Retn: A random value greater than or equal to lower, and less than upper.
  //=============================================================================
  public native int Rand(int p_lower, int p_upper);


  //=============================================================================
  // Name: Sqrt
  // Desc: Gets the square root of the given floating point value.
  //=============================================================================
  public native float Sqrt(float p_v);


  //=============================================================================
  // Name: Abs
  // Desc: Gets the absolute value of the given integer.
  //=============================================================================
  public int Abs(int p_v)
  {
    if (p_v < 0)
      return -p_v;
    return p_v;
  }


  //=============================================================================
  // Name: Fabs
  // Desc: Gets the absolute value of the given floating point.
  //=============================================================================
  public float Fabs(float p_v)
  {
    if (p_v < 0.0)
      return -p_v;
    return p_v;
  }


  //=============================================================================
  // Name: Fmax
  // Desc: Gets the greater of the two given floating point values.
  //=============================================================================
  public float Fmax(float a0, float a1)
  {
    if (a0 > a1)
      return a0;
    return a1;
  }


  //=============================================================================
  // Name: Fmin
  // Desc: Gets the lesser of the two given floating point values.
  //=============================================================================
  public float Fmin(float a0, float a1)
  {
    if (a0 < a1)
      return a0;
    return a1;
  }


  //=============================================================================
  // Name: Max
  // Desc: Gets the greater of the two given floating point values.
  //=============================================================================
  public int Max(int a0, int a1)
  {
    if (a0 > a1)
      return a0;
    return a1;
  }


  //=============================================================================
  // Name: Min
  // Desc: Gets the lesser of the two given integer point values.
  //=============================================================================
  public int Min(int a0, int a1)
  {
    if (a0 < a1)
      return a0;
    return a1;
  }

};



//=============================================================================
// Name: Str
// Desc: A static string helper class. Provides some string utility functions
//       not supported by the native string object.
//=============================================================================
final static class Str
{

  //=============================================================================
  // Name: TrimLeft
  // Desc: Trim left characters from 's' while each character encountered is in
  //       'trim'. If 'trim' is empty, white space will be trimmed.
  //=============================================================================
  public native void TrimLeft(string s, string trim);


  //=============================================================================
  // Name: TrimLeft
  // Desc: Trim right characters from 's' while each character encountered is in
  //       'trim'. If 'trim' is empty, white space will be trimmed.
  //=============================================================================
  public native void TrimRight(string s, string trim);


  //=============================================================================
  // Name: Left
  // Desc: Removes the rightmost characters from the passed string such that it's
  //       length becomes less than or equal to 'count'.
  //=============================================================================
  public void Left(string s, int count)
  {
    s[0,] = s[,count];
  }


  //=============================================================================
  // Name: Right
  // Desc: Removes the leftmost characters from the passed string such that it's
  //       length becomes less than or equal to 'count'.
  //=============================================================================
  public void Right(string s, int count)
  {
    s[0,] = s[s.size() - count,];
  }


  //=============================================================================
  // Name: Mid
  // Desc: Clips a string to the specified segment within it.
  //=============================================================================
  public void Mid(string s, int first, int count)
  {
    s[0,] = s[first, first + count];
  }


  //=============================================================================
  // Name: ToInt
  // Desc: Converts the given string to an integer.
  //=============================================================================
  public native int ToInt(string s);


  //=============================================================================
  // Name: ToFloat
  // Desc: Converts the given string to a floating point value.
  //=============================================================================
  public native float ToFloat(string s);


  //=============================================================================
  // Name: ToUpper
  // Desc: Converts a string to all uppercase (i.e. capitalize all letters).
  //=============================================================================
  public native void ToUpper(string s);


  //=============================================================================
  // Name: ToLower
  // Desc: Converts a string to all lowercase.
  //=============================================================================
  public native void ToLower(string s);


  //=============================================================================
  // Name: Tokens
  // Desc: Tokenizes a string using the given delimiters as separators.
  // Parm: s - String to tokenize.
  // Parm: delimiters - Delimiter to look for in 's' that defines separation
  //       characters for creating the tokens. If null or empty, 's' will be
  //       tokenized by white space.
  // Retn: string[] - An array of string tokens extracted from 's'.
  //=============================================================================
  public native string[] Tokens(string s, string delimiters);


  //=============================================================================
  // Name: UnpackInt
  // Desc: Removes the front most integer value from the given string and returns it.
  //=============================================================================
  public native int UnpackInt(string s);


  //=============================================================================
  // Name: UnpackFloat
  // Desc: Removes the front most floating point value from the given string.
  //=============================================================================
  public native float UnpackFloat(string s);


  //=============================================================================
  // Name: UnpackString
  // Desc: Removes the front most string from the given one. That is, the first
  //       section of this string before a white space is encountered. Any
  //       leading white space is removed from this string prior to parsing.
  //=============================================================================
  public native string UnpackString(string s);


  //=============================================================================
  // Name: CloneString
  // Desc: CloneString() creates a copy of the string passed. Ordinarily 
  //       'copying' a string will just create a new object that references
  //       the old string. This is not allowed across different contexts, 
  //       CloneString() creates a new string for use in the current context.
  // Parm: s - The string to clone.
  // Retn: string - A new string in the current gamescript context which has
  //       contents that exactly match the original string.
  //=============================================================================
  public string CloneString(string s)
  {
    return "" + s;
  }


  //=============================================================================
  // Name: Str.Find
  // Desc: Search for a substring within a string.
  // Parm: string s - string in which to search
  // Parm: string substr - substring to find
  // Parm: startingIndex - where to start looking down the string i.e. skip the
  //       first 'n' characters
  // Retn: int - index within string that substr starts at. '-1' if not found.
  //=============================================================================
  public native int Find(string s, string substr, int startingIndex);


};

