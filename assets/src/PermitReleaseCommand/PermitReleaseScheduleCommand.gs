include "DefaultDriverScheduleCommand.gs"

include "permitreleasecustomcommand.gs"

class PermitReleaseScheduleCommand isclass DefaultDriverScheduleCommand
{
	PermitBasicScheduleState state;

	public void Init(DriverCharacter driver, DriverCommand parent)
	{
		inherited(driver, parent);

		state = new PermitBasicScheduleState();
	}

	public CustomCommand CreateCustomCommand(DriverCharacter driver)
	{
		PermitReleaseCustomCommand cmd = new PermitReleaseCustomCommand();
		cmd.Init(driver, state);
		return cast<CustomCommand>(cmd);
	}

	public string GetTooltip(void)
	{
		return GetAsset().GetStringTable().GetString2(
			"PermitReleaseTooltip",
			state.permitType,
			state.permitObject
			);
	}

	public void SetProperties(Soup soup)
	{
		inherited(soup);

		state.SetProperties(soup);
	}

	public Soup GetProperties(void)
	{
		Soup soup = inherited();
		state.PopulateProperties(soup);
		return soup;
	}
};
