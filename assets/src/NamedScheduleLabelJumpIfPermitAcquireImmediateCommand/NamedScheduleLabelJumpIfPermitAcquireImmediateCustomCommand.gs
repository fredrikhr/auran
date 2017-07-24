include "NamedScheduleLabelJumpCustomCommand.gs"
include "PermitManagerClient.gs"

class NamedScheduleLabelJumpIfPermitAcquireImmediateCustomCommand isclass NamedScheduleLabelJumpCustomCommand, PermitManagerClient
{
	public void Init(DriverCharacter driver, KUID labelKuid, string labelName, GameObject permitManagerRule, string permitType, string permitObject)
	{
		me.driver = driver;
		me.labelKuid = labelKuid;
		me.labelName = labelName;
		me.permitManagerRule = permitManagerRule;
		me.permitType = permitType;
		me.permitObject = permitObject;
	}

	public bool ShouldExecuteJump(Train train, int px, int py, int pz)
	{
		GameObject sender;
		if (train)
		{
			sender = train;
			train.SetAutopilotMode(Train.CONTROL_AUTOPILOT);
		}
		else
		{
			Interface.Log("NamedScheduleLabelJumpIfPermitAcquireImmediateCommand.Execute> train argument is invalid");
			sender = driver;
		}

		sender.Sniff(permitManagerRule, "PermitManager", null, true);
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
		sender.Sniff(permitManagerRule, "PermitManager", null, false);

		return result;
	}
};
