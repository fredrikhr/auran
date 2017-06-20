//
// gs.gs
//
//  Copyright (C) 2002-2003 Auran Developments Pty Ltd
//  All Rights Reserved.
//
include "GameObjectID.gs"


//! Base class for any object that requires messaging.
//
// GameObject is the base class for any object that requires messaging and threading support.
// GameObjects are placed in the games object table (Router). Each game object has a unique ID
// (assigned by the game, see GetId()) and many also have a unique name. GameObject instances are
// often referred to as a '<i node>' because they represent a message node in the game message
// Router.
//
// See Also:
//     Message, PropertyObject, Router, TrainzGameObject, World
//
game class GameObject isclass GSObject
{
  //! Sends a message of given major and minor type to a destination object immediately.
  //
  // The message will be sent immediately without delay.
  //
  // Param:  dst    Destination object to send the message to.
  // Param:  major  Message major type.
  // Param:  minor  Message minor type.
  // Param:  paramSoup  An optional Soup containing extra parameters. Tag names beginning
  //                    with "__" are reserved for system data and will be stripped.
  //
  public native void SendMessage(GameObject dst, string major, string minor);
  public native void SendMessage(GameObject dst, string major, string minor, GSObject paramSoup);


  //! Posts a message of the specified major and minor type to the given destination object.
  //
  // Param:  dst      Destination object.
  // Param:  major    Message major type.
  // Param:  minor    Message minor type.
  // Param:  paramSoup  An optional Soup containing extra parameters. Tag names beginning
  //                    with "__" are reserved for system data and will be stripped.
  // Param:  seconds  Amount of seconds to delay before the message is sent.  If 0.0, the message
  //                  will be sent straight away on the next game update.
  //
  public native void PostMessage(GameObject dst, string major, string minor, float seconds);
  public native void PostMessage(GameObject dst, string major, string minor, GSObject paramSoup, float seconds);


  //! Clears all messages of the specified type from this object that are outstanding via PostMessage().
  //
  // Param:  major  Major type of messages to clear.
  // Param:  minor  Minor type of messages to clear.
  //
  public native void ClearMessages(string major, string minor);


  //! Adds a message handler to this game object such that it will be called whenever the target GameObject receives a message of the specified major and minor type.
  //
  // The minor string may be null or an empty string.  This means any minor type handlers must have
  // a void return type and a single parameter which is of type Message.
  //
  // Param:  target   Target object.
  // Param:  major    Message major type to listen for.
  // Param:  minor    Message minor type to listen for.  If null or an empty string, all messages
  //                  that match <i major> will be seen regardless of what the minor type is.
  // Param:  handler  Name of the method to call in <i target> when a message of type 
  //                  (<i major>,<i minor>) is sent to this object.
  //
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
  public obsolete native int GetId();

  // Obsolete, use GameObjectID instead, as this may not actually be unique
  public obsolete native string GetName();


  //=============================================================================
  // Name: GetDebugName
  // Desc: Returns a debug name for identifying this object in logs etc. This is
  //       not guaranteed to be human-readable, but will be where possible.
  //=============================================================================
  public string GetDebugName()
  {
    GameObjectID id = GetGameObjectID();
    if (id)
      return id.GetDebugString();

    // We'll still have a Router ID and may have a name, so return that in case it helps
    return "GameObjectID{unknown:" + (string)GetId() + " " + GetName() + "}";
  }


  //=============================================================================
  // Name: Exception
  // Desc: Causes the current thread to give an exception.
  //=============================================================================
  public native void Exception(string reason);


  //! A reference to an unknown object for user extension data.
  public object extension;

};



//! An object message.
//
// <bi WARNING:> Do not alter this class - the ordering and size are hard coded!
//
// See Also:
//     GameObject, Router, GameObject::SendMessage(), GameObject::SendMessage(), Router::PostMessage()
//
final class Message
{
  public string major;  //!< Major message type.
  public string minor;  //!< Minor message type.
  public object src;    //!< Source object.
  public object dst;    //!< Destination object.
  public object paramSoup;      // an optional Soup containing extra parameters
};



//! Routes messages between game objects.
//
// See Also:
//     GameObject, Message
//
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
  //       GameObjectID. See GameObjectID.gs for details.
  // Parm: gameObjectID - The GameObjectID to query.
  // Retn: GameObject - The resident GameObject, or null if no matching object is
  //       resident.
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
  //       function, and will cease working at the same time as tradition message
  //       broadcast. It should ONLY be used in situations where just removing a
  //       broadcast would break script compatibility.
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
  public obsolete native void LegacyBroadcastMessage(GameObject srcNode, string major, string minor, float delay, bool bFailSilently);


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



//! Static class with various mathematical utility methods.
//
// See Also:
//     Str
//
final static class Math
{
  // Constants
  public define float PI = 3.14159265;
  
	//! Returns a random number between the two given values.
	//
	// Param:  p_lower  Lower limit for random value.
	// Param:  p_upper  Upper limit for random value.
	//
	// Returns:
	//     Returns a random floating point value between the ranges of <i p_lower> and <i p_upper>.
	//
	public native float Rand(float p_lower, float p_upper);

	//! Returns a random number between the two given values.
	//
	// Param:  p_lower  Lower limit for random value.
	// Param:  p_upper  Upper limit for random value.
	//
	// Returns:
	//     Returns a random integer value between the ranges of <i p_lower> and <i p_upper>.
	//
	public native int Rand(int p_lower, int p_upper);

	//! Gets the square root of the given floating point value.
	//
	// Param:  p_v  Value to get the square root of.
	//
	// Returns:
	//     Returns the square root of <i p_v>.
	//
	public native float Sqrt(float p_v);

	//! Gets the absolute value of the given integer.
	//
	// Param:  p_v  Integer to get the absolute value of.
	//
	// Returns:
	//     Returns the absolute value of <i p_v>.
	//
	public int Abs(int p_v)
	{
		if (p_v < 0)
			return -p_v;
		return p_v;
	}

	//! Gets the absolute value of the given floating point.
	//
	// Param:  p_v  Number to get the absolute value of.
	//
	// Returns:
	//     Returns the absolute value of <i p_v>.
	//
	public float Fabs(float p_v)
	{
		if (p_v < 0.0)
			return -p_v;
		return p_v;
	}

	//! Gets the greater of the two given floating point values.
	//
	// Param:  a0  First value.
	// Param:  a1  Second value.
	//
	// Returns:
	//     Returns the greater of <i a0> and <i a1>.
	//
	public float Fmax(float a0, float a1)
	{
		if (a0 > a1)
			return a0;
		return a1;
	}

	//! Gets the lesser of the two given floating point values.
	//
	// Param:  a0  First value.
	// Param:  a1  Second value.
	//
	// Returns:
	//     Returns the lesser of <i a0> and <i a1>.
	//
	public float Fmin(float a0, float a1)
	{
		if (a0 < a1)
			return a0;
		return a1;
	}

	//! Gets the greater of the two given integer values.
	//
	// Param:  a0  First value.
	// Param:  a1  Second value.
	//
	// Returns:
	//     Returns the greater of <i a0> and <i a1>.
	//
	public int Max(int a0, int a1)
	{
		if (a0 > a1)
			return a0;
		return a1;
	}

	//! Gets the lesser of the two given integer values.
	//
	// Param:  a0  First value.
	// Param:  a1  Second value.
	//
	// Returns:
	//     Returns the lesser of <i a0> and <i a1>.
	//
	public int Min(int a0, int a1)
	{
		if (a0 < a1)
			return a0;
		return a1;
	}
};


//! Static string helper class.
//
// Str is a <l gscLangKeyStatic  static> class providing string utility functions not supported by
// the native <l gscLangKeyString  string> object.
//
// Note:
//     <l gsc  GS> is not a pure Object Oriented language.  You cannot extend the native types
//     such as <l gscLangKeyInt  int>, <l gscLangKeyFloat  float>, <l gscLangKeyString  string> etc.
//
// See Also:
//     Interface, Math, StringTable, TrainUtil::AlreadyThereStr(), TrainUtil::GetUpTo()
//
final static class Str
{
	//! Trim left characters from <i s> while each character encountered is in <i trim>.
	//
	// Param:  s     String to trim left on.
	// Param:  trim  Characters to trim.  If an empty string is passed in, white space will be 
	//               trimmed.
	//
	public native void TrimLeft(string s, string trim); 

	//! Trim right characters from <i s> while each character encountered is in <i trim>.
	//
	// Param:  s     String to trim right on.
	// Param:  trim  Characters to trim.  If an empty string is passed in, white space will be 
	//               trimmed.
	//
	public native void TrimRight(string s, string trim);

	//! Sets <i s> to its <i i>th leftmost characters.
	//
	// Param:  s  String to strip characters from.
	// Param:  i  Amount of leftmost characters in <i s> to set <i s> to.
	//
	public void Left(string s, int i)
	{
		s[0,] = s[,i];
	}

	//! Sets <i s> to its <i i>th rightmost characters.
	//
	// Param:  s  String to strip characters from.
	// Param:  i  Amount of rightmost characters in <i s> to set <i s> to.
	//
	public void Right(string s, int i)
	{
		s[0,] = s[s.size() - i,];
	}

	//! Clips a string to the specified segment within it.
	//
	// Param:  s      String to clip.
	// Param:  first  Character in <i s> to start the new string from.
	// Param:  count  Amount of characters from first onwards to include in the new string.
	//
	public void Mid(string s, int first, int count)
	{
		s[0,] = s[first, first + count];
	}

	//! Converts the given string to an integer.
	//
	// Param:  s  String to convert to an integer.
	//
	// Returns:
	//     Returns <i s> as an integer if possible or 0 in the case of failure.
	//
	public native int ToInt(string s);

	//! Converts the given string to a floating point value.
	//
	// Param:  s  String to convert to a floating point value.
	//
	// Returns:
	//     Returns <i s> as a floating point value if possible or 0.0 in the case of failure.
	//
	public native float ToFloat(string s);

	//! Converts the given string to all uppercase (i.e. capitalize all characters).
	//
	// Param:  s  String to convert to all uppercase.
	//
	public native void ToUpper(string s);

	//! Converts the given string to all lowercase characters.
	//
	// Param:  s  String to convert to all lowercase.
	//
	public native void ToLower(string s);

	//! Tokenizes a string using the given delimiters as separators.
	//
	// Param:  s           String to tokenize.
	// Param:  delimiters  Delimiter to look for in <i s> that defines separation characters for 
	//                     creating the tokens.  If null or empty, <i s> will be tokenized by 
	//                     white space.
	//
	// Returns:
	//    Returns an array of string tokens.
	//
	public native string[] Tokens(string s, string delimiters);

	//! Removes the front most integer value from the given string and returns it.
	//
	// Param:  s  String to remove the front most integer value from.
	//
	// Returns:
	//     Returns the front most integer value in <i s>.
	//
	public native int UnpackInt(string s);

	//! Removes the front most floating point value from the given string.
	//
	// Param:  s  String to remove the front most floating point value from.
	//
	// Returns:
	//     Returns the front most floating point value in <i s>.
	//
	public native float UnpackFloat(string s);

	//! Removes the front most string from the given one.
	//
	// Param:  s  String to remove front most string from.  That is, the first section of this string
	//            before a white space is encountered.  Any leading white space is removed from this
	//            string prior to parsing.
	//
	// Returns:
	//     Returns the removed front most string.
	//
	public native string UnpackString(string s);


  // ============================================================================
  // Name: CloneString
  // Desc: CloneString() creates a copy of the string passed. Ordinarily 
  //       'copying' a string will just create a new object that references
  //       the old string. This is not allowed across different contexts, 
  //       CloneString() creates a new string for use in the current context.
  // Parm: s - The string to clone.
  // Retn: string - A new string in the current gamescript context which has
  //       contents that exactly match the original string.
  // ============================================================================
  public string CloneString(string s)
  {
    return "" + s;
  }
  
  // ============================================================================
  // Name: Str.Find
  // Desc: Search for a substring within a string.
  // Parm: string s - string in which to search
  // Parm: string substr - substring to find
  // Parm: int startingIndex - where to start looking down the string
  //                           i.e. skip the first 'n' characters
  // Retn: int - index point within string that substr starts at.
  //             '-1' if not found.
  // ============================================================================
	public native int Find(string s, string substr, int startingIndex);

};

