include "drivercommandshared.gs"
include "NamedScheduleLabelJumpScheduleCommand.gs"

include "PermitBasicScheduleState.gs"
include "PermitManagerClient.gs"

class NamedScheduleLabelJumpIfPermitAcquireImmediateScheduleCommand isclass NamedScheduleLabelJumpScheduleCommand, PermitManagerClient
{
	PermitBasicScheduleState state;

	public void Init(DriverCharacter driver, DriverCommand parent)
	{
		inherited(driver, parent);

		state = new PermitBasicScheduleState();
	}

	public bool ShouldExecuteJump(DriverCharacter driver)
	{
		GameObject sender = driver.GetTrain();
		sender.Sniff(state.permitManagerRule, "PermitManager", null, true);
		SendMessage(sender, "AcquireImmediate");

		bool result = false;
		Message msg;
		wait()
		{
			on "PermitManager", "Granted", msg:
			{
				if (ValidatePermitManagerMessage(msg))
				{
					result = true;
					break;
				}
				ResendMessage(msg);
				continue;
			}

			on "PermitManager", "Denied", msg:
			{
				if (ValidatePermitManagerMessage(msg))
				{
					result = false;
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
