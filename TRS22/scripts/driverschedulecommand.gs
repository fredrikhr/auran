//=============================================================================
// File: DriverScheduleCommand.gs
// Desc: 
//=============================================================================
include "DriverCommand.gs"



//=============================================================================
// Name: DriverScheduleCommand
// Desc: A schedule command that a driver can follow.
//       Instances of this class are created by the DriverCommand asset script,
//       when commands are queued by the player. Implementations of this
//       function typically implement BeginExecute and/or UpdateExecute and use
//       it to call the driving/nativation commands on the DriverCharacter.
//       Custom driving functionality may also be implemented by inheriting the
//       CustomCommand class (see schedule.gs) and calling DriverCustomCommand.
//=============================================================================
class DriverScheduleCommand
{
  DriverCharacter   m_driverCharacter;      // The attached driver. May be null.
  DriverCommand     m_driverCommand;        // The parent DriverCommand.

  public Asset GetAsset(void) { return m_driverCommand.GetAsset(); }


  //=============================================================================
  // Name: Init
  // Desc: Called by a DriverCommand object to initialise this object.
  //       You can override this method to perform your own initialisation, but
  //       you must call inherited() from within your implementation.
  //=============================================================================
  public mandatory void Init(DriverCharacter driver, DriverCommand parent)
  {
    m_driverCharacter = driver;
    m_driverCommand = parent;
  }


  //=============================================================================
  // Name: IsReadyToExecute
  // Desc: An optional function which may be used to delay execution of this
  //       command if the command is not fully configured. If false is returned
  //       all command execution on this driver will be suspended, and the player
  //       will be notified via the HUD that the command requires attention.
  //       This function is provided for driver commands which can be added to
  //       the queue in an unconfigured or partially configured state, and then
  //       configured using the edit popup (see GetUserInterfaceProperties and
  //       SetUserInterfaceProperty for more information about this behaviour).
  // Retn: bool - true to indicate that BeginExecute can and should be called,
  //       false to stall command execution until the command is edited.
  //=============================================================================
  public bool IsReadyToExecute(DriverCharacter driver) { return true; }


  //=============================================================================
  // Name: BeginExecute
  // Desc: Begins executing this command for the given driver character.
  //       This method is called when the parent command is reached in the driver
  //       schedule.
  //       It is up to the script programmer to implement this method for their
  //       own custom commands as the default implementation does nothing.
  // Retn: bool - Whether the command has started to exectute (i.e. added more
  //       commands to the driver schedule). Returning false here indicates that
  //       the command has failed to start, or at least does not need to do
  //       anything further.
  //=============================================================================
  public bool BeginExecute(DriverCharacter driver) { return false; }


  //=============================================================================
  // Name: UpdateExecute
  // Desc: Update execution of this command on the given driver character.
  //       This is called when the driver command schedule is empty. If this
  //       command has more work to do it must add more commands here.
  // Retn: bool - Whether the command is still exectuting (i.e. has added more
  //       commands to the driver schedule). Returning false here indicates that
  //       the command is complete (or has failed).
  //=============================================================================
  public bool UpdateExecute(DriverCharacter driver) { return false; }


  //=============================================================================
  // Name: FailExecute
  // Desc: Notifies this command that a schedule item has failed, and the
  //       schedule has been aborted. The default implementation will do nothing
  //       here, so this must be overridden if any error handling or command
  //       retry is desired.
  // Retn: bool - Returns true if the command has recovered, false if it has
  //       failed and should be aborted.
  //=============================================================================
  public bool FailExecute(DriverCharacter driver) { return false; }


  //=============================================================================
  // Name: EndExecute
  // Desc: Called to end execution and reset this command to its initial state.
  //       This will be called exactly once for each call to BeginExecute that
  //       returned true. If BeginExecute returned false this will not be called.
  //       This being called does not mean the command must end entirely. Under
  //       some circumstances schedules may be 'reissued', which results in a
  //       call to EndExecute followed by another to BeginExecute. As such, this
  //       function may wish to preserve state or even queue new commands itself.
  // Retn: bool - Whether the command was successful. The return value of this
  //       function is not currently used, but it is good practice to implement
  //       this nonetheless.
  //=============================================================================
  public bool EndExecute(DriverCharacter driver) { return true; }


  //=============================================================================
  // Name: GetIcon
  // Desc: Called by Trainz to determine the display icon for this command
  //       within the driver command list. The default DriverScheduleCommand
  //       implementation always returns null, so the script programmer must
  //       override this method.
  // Retn: A MapObject or DriverCommand. The icon will be sourced from the asset
  //       of this returned object.
  //=============================================================================
  public object GetIcon(void) { return null; }


  //=============================================================================
  // Name: GetTooltip
  // Desc: Gets the toltip text for this driver schedule command within the
  //       driver order bar (i.e. when mousing the icon returned from GetIcon).
  //=============================================================================
  public string GetTooltip(void) { return ""; }


  //=============================================================================
  // Name: GetDriverCommand
  // Desc: Returns the parent DriverCommand this schedule command is attached to.
  //=============================================================================
  public DriverCommand GetDriverCommand(void) { return m_driverCommand; }


  //=============================================================================
  // Name: GetDriverCharacter
  // Desc: Gets the DriverCharacter that this schedule command is attached to.
  //=============================================================================
  public DriverCharacter GetDriverCharacter(void) { return m_driverCharacter; }


  //=============================================================================
  // Name: SetDriverCharacter
  // Desc: Assigns this driver schedule command to the specified driver.
  //=============================================================================
  public void SetDriverCharacter(DriverCharacter driver) { m_driverCharacter = driver; }


  //=============================================================================
  // Name: GetProperties
  // Desc: Gets the properties (if any) of this driver schedule command.
  //       The default DriverScheduleCommand implementation of this method always
  //       returns an empty Soup database. The script programmer must provide
  //       their own overridden version if they have any command properties that
  //       need to be saved.
  //=============================================================================
  public Soup GetProperties(void) { return Constructors.NewSoup(); }


  //=============================================================================
  // Name: SetProperties
  // Desc: Uses the given Soup database to initializes the properties (if any)
  //       of this command.
  //       The default DriverScheduleCommand implementation of this method does
  //       nothing. The script programmer must provide their own overridden
  //       version if they have any command that needs to be loaded.
  //=============================================================================
  public void SetProperties(Soup soup) { }


  //=============================================================================
  // Name: GetUserInterfaceProperties
  // Desc: Returns a Soup defining the UI properties for this schedule command.
  //       This function is used by the full-screen Driver Command edit screen,
  //       and should return a Soup object defining the user interface for this
  //       specific command. 
  // Retn: Soup - A database defining the user interface used to configure this
  //       schedule command index. The format of each item is as follows:
  //
  //       property-id
  //       {
  //         name     (a localised display name to label this property with)
  //         type     (one of the either: "int", "float", "string", "list" or "map-object")
  //         value    (the current value of this property, if any)
  //       }
  //
  //       Numeric type values may optionally be followed by the lower and upper
  //       range limits (inclusive). For example "int,0,100" allows the player to
  //       enter any integer between 0 and 100.
  //
  //       List values require the addition of an indexed "list-options"
  //       subcontainer. For example:
  //
  //       list-options
  //       {
  //         0        "1"
  //         1        "5"
  //         2        "10"
  //       {
  //
  //       Map object type values may optionally be followed a category string to
  //       retrict the possible object list. For example "map-object,TV" would
  //       show only traincars, and "map-object,IND" would show only industries.
  //
  //=============================================================================
  mandatory Soup GetUserInterfaceProperties()
  {
    return Constructors.NewSoup();
  }


  //=============================================================================
  // Name: SetUserInterfaceProperty
  // Desc: Called by native code set a new player-configured value for a specific
  //       property in the UI defined by GetUserInterfaceProperties(). This
  //       function can perform extra input validation if required, and either
  //       accept or reject the input. If the input is rejected this function
  //       should return false without altering ANY internal properties, and
  //       may optionally show an error message to the player.
  // Parm: propertyID - The property ID, as defined by the container name of the
  //       return value from GetUserInterfaceProperties().
  // Parm: propertyData - A soup containing the new value configured by the
  //       player, and any other relevant data. The format is as follows:
  //
  //       {
  //         value            (the new value of this property, data type varies)
  //         value-index      ("list" types only, specifies the index from the
  //                           list-options subcontainer)
  //         display-name     ("map-object" types only, specifies the localised
  //                           display name of the map object)
  //         auto-completed   (whether this data entry was auto-completed)
  //       }
  //
  //       The data type of the "value" tag will vary based on the property type,
  //       being an integer, float, string for "int", "float" and "string"/"list"
  //       respectively, and a GameObjectID for the "map-object" type.
  //
  // Retn: bool - Whether the rule accepted the new value.
  //=============================================================================
  mandatory bool SetUserInterfaceProperty(string propertyID, Soup propertyData)
  {
    return false;
  }

};

