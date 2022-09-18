//=============================================================================
// File: SecurityToken.gs
// Desc: The SecurityToken is designed to be used like a security pass or key
//       and grants certain assets the right to perform certain actions.
//       However, the token itself does not directly provide or guarantee
//       security. It is up to the creator of a script object to require the
//       use of a SecurityToken if they wish to restrict access to certain
//       actions/data. This would typically be done by requiring a token to be
//       passed as a function parameter wherever security is wanted.
//=============================================================================

include "gs.gs"


// ============================================================================
// Name: SecurityToken
// Desc: The security token class
// ============================================================================
final secured class SecurityToken isclass GSObject
{
  //=============================================================================
  // Name: IsOwnerLocallyModified
  // Desc: Returns true if any asset that has ‘touched’ (issued, re-issued or 
  //       merged) the token has been modified on the local user’s machine.
  //=============================================================================
  public native bool IsOwnerLocallyModified();
};

