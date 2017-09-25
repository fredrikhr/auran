include "schedule.gs"
include "permitmanagerclient.gs"

class PermitAcquireCustomCommand isclass CustomCommand, PermitManagerClient
{
	public bool Execute(Train train, int px, int py, int pz)
	{
		GameObject sender;
		if (train)
		{
			sender = train;
			train.SetAutopilotMode(Train.CONTROL_SCRIPT);
			train.SetDCCThrottle(0.0);
		}
		else
		{
			Interface.Log("PermitAcquireCustomCommand.Execute> train argument is null");
			sender = driver;
		}

		sender.Sniff(state.permitManagerRule, "PermitManager", null, true);
		SendMessage(sender, "Acquire");

		Message msg;
		wait()
		{
			on "PermitManager", "Granted", msg:
			{
				if (ValidatePermitManagerMessage(msg))
					break;
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

		return true;
	}
};
