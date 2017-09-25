include "drivercommand.gs"

class DefaultDriverCommand isclass DriverCommand
{
	public string GetMenuItemMessageMajor(void) { return (string)null; }
	public string GetMenuItemMessageMinor(void) { return (string)null; }
	public Soup CreateScheduleCommandProperties(Message menuItemMessage);
	public DriverScheduleCommand CreateScheduleComamndInstance(void);

	public mandatory void Init(Asset asset)
	{
		inherited(asset);

		AddHandler(me, GetMenuItemMessageMajor(), GetMenuItemMessageMinor(), "OnMenuItemMessage");
	}

	public Soup CreateScheduleCommandProperties(Message menuItemMessage)
	{
		Exception("DefaultDriverCommand.CreateScheduleCommandProperties> Not overridden.");
		return cast<Soup>(null);
	}

	public void OnMenuItemMessage(Message msg)
	{
		DriverCharacter driver = cast<DriverCharacter>(msg.src);
		DriverCommands commands;
		if (driver)
			commands = driver.GetDriverCommands();
		else
			commands = cast<DriverCommands>(msg.src);
		if (!commands)
		{
			Exception("DefaultDriverCommand.OnMenuItemMessage> Unable to Get Driver Commands from Message");
			return;
		}

		Soup soup = CreateScheduleCommandProperties(msg);

		DriverScheduleCommand cmd = CreateScheduleCommand(driver, soup);
		commands.AddDriverScheduleCommand(cmd);
	}

	public DriverScheduleCommand CreateScheduleComamndInstance(void)
	{
		Exception("DefaultDriverCommand.CreateScheduleComamndInstance> Not overridden.");
		return cast<DriverScheduleCommand>(null);
	}

	public DriverScheduleCommand CreateScheduleCommand(DriverCharacter driver, Soup properties)
	{
		DriverScheduleCommand cmd = CreateScheduleComamndInstance();
		cmd.Init(driver, me);
		cmd.SetProperties(properties);
		return cmd;
	}

	public StringTable GetStringTable(void) { return GetAsset().GetStringTable(); }
};
