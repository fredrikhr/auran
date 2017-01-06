//
// gs.gs
//
//  Copyright (C) 2002-2003 Auran Developments Pty Ltd
//  All Rights Reserved.
//


//! A generic empty parent class.
//
// The GSObject class is an empty class with no methods or data members.  It is used as a generic
// parent class so that a variety of other classes can all be used as parameters to a function.
//
// Any child class of the classes listed above can also be considered a GSObject.  When accessing a
// GSObject from a parameter, be sure to cast the object to the class you want to use and then
// verify that cast object before use.
//
// Currently there is only one major usage of GSObject in the %Trainz API and that is as a generic 
// object parameter array for the Library::LibraryCall() method.
//
// See Also:
//     Library::LibraryCall()
//
class GSObject
{
  
  public native string GetGSClassName(void);
};


//! Base class for any object that requires messaging.
//
// GameObject is the base class for any object that requires messaging and threading support.
// GameObjects are placed in the games object table (Router).  You cannot create a GameObject using
// \ref gscLangKeyNew "new" from a script.  All game objects are created by the game.  Each game 
// object has a unique ID (see GetId()) and many also have a unique name.  GameObject instances are
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

	//! Add a message handler to the target game object such that it will send us all messages it receives of the specified major and minor type.
	//
	// Param:  target  Object to add a message handler to.
	// Param:  major   Message major type to listen for.
	// Param:  minor   Message minor type to listen for.  If null or an empty string, all messages
	//                 that match major will be seen regardless of what the minor type is.
	// Param:  state   On/off state of the handle.  Use true to enable the handler or false to
	//                 disable.
	//
	public native void Sniff(GameObject target, string major, string minor, bool state);

	//! Cause this process to pause for a given number of seconds.
	//
	// Param:  seconds  Amount of time in seconds to the process is to pause for.
	//
	public native void Sleep(float seconds);

	//! Gets this object node's unique ID.
	//
	// Note:
	//     The ID of a GameObject is not to be confused with the KUID of an asset.
	//
	// Returns:
	//     Returns the unique ID of this game object.
	//
	public native int GetId();

	//! Gets this object node's unique name.
	// 
	// Returns:
	//     Returns the unique name of this game object.
	//
	public native string GetName();

	//! Causes the current thread to give an exception.
	//
	// Param:  reason  Description why the exception was given.
	//
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
	//! Broadcast message ID.  All objects in the router will receive a broadcast message.
	public define int MESSAGE_BROADCAST = 0;

	//! Gets the game object for the given unique ID.
	//
	// Param:  uniqueId  Unique ID of object to find.
	//
	// Returns:
	//     Returns the game object that matches <i uniqueId>, null otherwise.
	//
	public native GameObject GetGameObject(int uniqueId);

	//! Gets the game object for the given unique ID in any context.
  //
  //  Don't use this in normal situations, use GetGameObject unless you have
  //  aspecific need to retrieve game objects from outside the current context.
	//
	// Param:  uniqueId  Unique ID of object to find.
	//
	// Returns:
	//     Returns the game object that matches <i uniqueId>, null otherwise.
	//
  public native GameObject GetForeignGameObject(int uniqueId);

	//! Gets the game object for the given unique name.
	//
	// Param:  uniqueName  Unique name of object to find.
	//
	// Returns:
	//     Returns the object as described by <i uniqueName> if possible, null otherwise.
	//
	public native GameObject GetGameObject(string uniqueName);

	//! Post a message through the router.
	//
	// This method allows code that isn't part of a GameObject thread to post a message.  As such,
	// a source for the message must also be provided well as the usual major/minor types and
	// destination.
	//
	// Param:  srcNodeId  ID of source object that the message is to come from.
	// Param:  dstNodeId  ID of destination object that the message is to be delivered to.  Use
	//                    <l Router::MESSAGE_BROADCAST  MESSAGE_BROADCAST> for a message that will be
	//                    broadcasted to all objects.
	// Param:  major      Major type of message to post.
	// Param:  minor      Minor type of message to post.
	// Param:  delay      Delay in seconds to wait before posting the message.
	//
	public native void PostMessage(int srcNodeId, int dstNodeId, string major, string minor, float delay);

	//! Logs current router information.  
	//
	// This information will be in the <n \\%Trainz\JetLog.txt> file.  Such data can be useful for
	// debugging scripts and scenarios.
	//
	// See Also:
	//     Interface::Log()
	//
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
  //       messages from the 'me' object, the thread's object must sniff() the
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

