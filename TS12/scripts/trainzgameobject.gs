//
// TrainzGameObject.gs
//
//  Copyright (C) 2004 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "Trainz.gs"
include "SecurityToken.gs"



//! Base class for a GameObject that is an instance of a %Trainz asset.
//
// This class is a parent class for game objects in the %Trainz world that are instances of a 
// %Trainz asset.  Examples of game objects based on particular a asset that derive from this
// class include Bogey, Cabin, Crossing, Industry, Library, Turntable and Vehicle to name a few.
//
// The only interface methods provided here deal with object initialization via Init(Asset) and 
// GetAsset() which allows the Asset this object is based on to be obtained.
//
// See Also:
//     Asset, KUID, MeshObject, GameObject, Library, ScenarioBehavior
//
game class TrainzGameObject isclass GameObject
{
  //
  // PRIVATE IMPLEMENTATION
  //

  Asset m_trainzAsset;

  //
  // PUBLIC IMPLEMENTATION
  //

  //! Initialization method.  Called by %Trainz when the object is first created.
  //
  // It is up to the script programmer to do any initialization tasks required here as well as
  // ensuring a thread is started if the object is to exist in a persistent state that can monitor
  // and respond to message for example.
  //
  // Note:
  //     You will see that some derived classes have both an Init() and Init(Asset) method.  There 
  //     isn't much difference between them except one gets the Asset as a parameter.  It is 
  //     recommended that you use the Init(Asset) version whenever you can.
  //
  // Note:
  //     When overriding this base Init() method, you must call it explicitly by using the 
  //     <l gscLangKeyInherit  inherited> keyword in the overridden implementation.
  //
  // Note:
  //     As Init() is called from native %Trainz code, you cannot <bi CANNOT> <l GameObject::Sleep  Sleep>()
  //     or <l gscLangKeyWait  wait()> in an Init() method.  However, Init() can start threaded 
  //     methods that are allowed to sleep and process messages.
  //
  // Param:  asset  %Trainz asset this object is based on.
  //
  // See Also:
  //     MeshObject::Init()
  //
  public void Init(Asset asset);


  //! Gets the Asset of this game object.
  //
  // Returns:
  //     Returns the Asset of this game object.  This returned reference can be used to obtain the 
  //     <l Asset::GetKUID()  KUID> and <l Asset::GetStringTable()  StringTable> of the Asset.
  //
  public Asset GetAsset(void);



  // ============================================================================
  // Name: IssueSecurityToken
  // Desc: Create a SecurityToken associated with the object. The token will
  //       only be useable by the asset passed to the creation function.
  // Parm: asset - The asset this token is intended to be used by
  // Parm: rights - Array of string identifiers used to specify operations
  //                performable with the created security token
  // ============================================================================
  native SecurityToken IssueSecurityToken(KUID asset, string[] rights);


  // ============================================================================
  // Name: IssueSecurityToken
  // Desc: Re-issue a SecurityToken to another asset. This function will create a
  //       new security token only if the calling asset has duplication rights
  //       over the ‘source’ token. This entry will add the new target KUID, with
  //       the new rights strings. It is not be possible to add rights that the
  //       calling asset does not already have, only remove existing ones.
  //       An asset always has duplication rights over its own security tokens.
  // Parm: source - The source security token
  // Parm: asset - The asset this token is intended to be used by
  // Parm: rights - Array of string identifiers used to specify operations
  //                performable with the re-issued security token
  // ============================================================================
  native SecurityToken IssueSecurityToken(SecurityToken source, KUID asset, string[] rights);



  //=============================================================================
  // Name: MergeSecurityTokens
  // Desc: Merges multiple security tokens
  // Parm: tokens - The tokens to merge together
  //=============================================================================
  native SecurityToken MergeSecurityTokens(SecurityToken[] tokens);


  //=============================================================================
  // Name: Validate
  // Desc: Checks if a token is owned by a specific object, and has the rights
  //       to perform a certain operation on this TrainzGameObject.
  // Parm: token - The token to verify against
  // Parm: owner - the object wanting to perform the operation (token owner)
  // Parm: operation - the operation the object wants to perform on this object
  // Retn: bool - true if the token lists the owner object as being able to
  //       perform the requested operation on this object
  //=============================================================================
  native bool Validate(SecurityToken token, TrainzGameObject owner, string operation);


  //=============================================================================
  // Name: Validate
  // Desc: Checks if a token is owned by a object with a specific KUID, and has
  //       the rights to perform a certain operation on this object.
  // Parm: token - The token to verify against
  // Parm: owner - the kuid of the object wanting to perform the operation
  // Parm: operation - the operation the object wants to perform on this object
  // Retn: bool - true if the token lists the owner object as being able to
  //       perform the requested operation on this object
  //=============================================================================
  native bool Validate(SecurityToken token, KUID owner, string operation);



  public void Init(Asset asset)
  {
    // ALWAYS INHERIT THIS FUNCTION

    m_trainzAsset = asset;
  }


  Asset ObsoleteGetAsset(void)
  {
    Asset ret;
    return ret;
  }


  public Asset GetAsset(void)
  {
    if (!m_trainzAsset)
    {
      m_trainzAsset = ObsoleteGetAsset();
      if (m_trainzAsset)
        Interface.WarnObsolete("TrainzGameObject.GetAsset> invalid call to GetAsset() prior to Init(Asset) being inherited");
      else
        Exception("TrainzGameObject.GetAsset> invalid call to GetAsset() prior to Init(Asset) being inherited");
    }

    return m_trainzAsset;
  }
};