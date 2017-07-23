include "defaultdriverschedulecommand.gs"

include "namedschedulelabelinsertcustomcommand.gs"

class NamedScheduleLabelInsertScheduleCommand isclass DefaultDriverScheduleCommand
{
	public string labelName;

	public CustomCommand CreateCustomCommand(DriverCharacter driver)
	{
		return cast<CustomCommand>(new NamedScheduleLabelInsertCustomCommand());
	}

	public Soup GetProperties(void)
	{
		Soup soup = inherited();

		soup.SetNamedTag("label", labelName);

		return soup;
	}

	public void SetProperties(Soup soup)
	{
		inherited(soup);
		if (!soup)
			return;

		labelName = soup.GetNamedTag("label");
	}

	public string GetTooltip(void) { return labelName; }
};
