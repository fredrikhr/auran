include "DefaultDriverScheduleCommand.gs"
include "PermitBasicScheduleState.gs"

include "permitacquirecustomcommand.gs"

class PermitAcquireScheduleCommand isclass DefaultDriverScheduleCommand
{
	PermitBasicScheduleState state;

	public void Init(DriverCharacter driver, DriverCommand parent)
	{
		inherited(driver, parent);

		state = new PermitBasicScheduleState();
	}

	public CustomCommand CreateCustomCommand(DriverCharacter driver)
	{
		PermitAcquireCustomCommand cmd = new PermitAcquireCustomCommand();
		cmd.Init(driver, state);
		return cast<CustomCommand>(cmd);
	}

	public string GetTooltip(void)
	{
		return GetStringTable().GetString2(
			"PermitAcquireTooltip",
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
