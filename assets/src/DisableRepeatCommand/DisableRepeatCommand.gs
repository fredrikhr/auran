include "DefaultDriverCommand.gs"
include "DisableRepeatScheduleCommand.gs"

class DisableRepeatCommand isclass DefaultDriverCommand
{
	public Soup CreateScheduleCommandProperties(Message menuItemMessage)
	{ return Constructors.NewSoup(); }

	public DriverScheduleCommand CreateScheduleComamndInstance(void)
	{ return cast<DriverScheduleCommand>(new DisableRepeatScheduleCommand()); }
};
