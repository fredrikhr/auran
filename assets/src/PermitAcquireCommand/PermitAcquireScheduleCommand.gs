include "permitbasicschedulecommand.gs"

include "permitacquirecustomcommand.gs"

class PermitAcquireScheduleCommand isclass PermitBasicScheduleCommand
{
	public CustomCommand CreateCustomCommand(DriverCharacter driver)
	{
		PermitAcquireCustomCommand cmd = new PermitAcquireCustomCommand();
		cmd.Init(driver, permitManagerRule, permitType, permitObject);
		return cast<CustomCommand>(cmd);
	}

	public string GetTooltip(void)
	{
		return GetAsset().GetStringTable().GetString2("PermitAcquireTooltip", permitType, permitObject);
	}
};
