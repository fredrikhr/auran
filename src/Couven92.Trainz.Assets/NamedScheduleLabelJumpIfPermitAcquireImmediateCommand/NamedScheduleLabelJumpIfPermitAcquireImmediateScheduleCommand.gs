include "drivercommandshared.gs"
include "NamedScheduleLabelJumpScheduleCommand.gs"

include "PermitBasicScheduleState.gs"
include "PermitManagerClient.gs"

class NamedScheduleLabelJumpIfPermitAcquireImmediateCustomCommand isclass NamedScheduleLabelJumpCustomCommand, PermitManagerClient
{
	public bool ShouldExecuteJump(DriverCharacter driver)
	{
		GameObject sender = driver.GetTrain();
		sender.Sniff(state.permitManagerRule, "PermitManager", null, true);
		SendMessage(sender, "AcquireImmediate");

		bool result = false;
		Message msg;
		wait()
		{
			on "PermitManager", "", msg:
			{
				if (ValidatePermitManagerMessage(msg))
				{
					if (msg.minor == "Granted")
						result = true;
					else if (msg.minor == "Denied")
						result = false;
					else
						ResendMessage(msg);
					break;
				}
				ResendMessage(msg);
				continue;
			}

			on "Schedule", "Abort":
			{
				SendMessage(sender, "Release");
				break;
			}
		}
		sender.Sniff(state.permitManagerRule, "PermitManager", null, false);

		return result;
	}
};

class NamedScheduleLabelJumpIfPermitAcquireImmediateScheduleCommand isclass NamedScheduleLabelJumpScheduleCommand
{
	PermitBasicScheduleState state;

	public void Init(DriverCharacter driver, DriverCommand parent)
	{
		inherited(driver, parent);
		state = new PermitBasicScheduleState();
	}

	public CustomCommand CreateCustomCommand(DriverCharacter driver)
	{
		NamedScheduleLabelJumpIfPermitAcquireImmediateCustomCommand cmd = new NamedScheduleLabelJumpIfPermitAcquireImmediateCustomCommand();
		cmd.Init(driver, me, labelName, labelKuid);
		cmd.Init(state);
		return cast<CustomCommand>(cmd);
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

	public string GetTooltip(void)
	{
		return GetStringTable()
			.GetString3(
				GetTooltipStringTableEntry(),
				state.permitType,
				state.permitObject,
				labelName
				);
	}
};
