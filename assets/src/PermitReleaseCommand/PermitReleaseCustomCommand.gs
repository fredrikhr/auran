include "schedule.gs"
include "permitmanagerclient.gs"

class PermitReleaseCustomCommand isclass CustomCommand, PermitManagerClient
{
	public bool Execute(Train train, int px, int py, int pz)
	{
		GameObject sender;
		if (train)
		{
			sender = train;
			train.SetAutopilotMode(Train.CONTROL_AUTOPILOT);
		}
		else
		{
			Interface.Log("PermitReleaseCustomCommand.Execute> train argument is invalid");
			sender = driver;
		}

		sender.Sniff(permitManagerRule, "PermitManager", null, true);
		SendMessage(sender, "Release");

		Message msg;
		wait()
		{
			on "PermitManager", "Released", msg:
			{
				if (ValidatePermitManagerMessage(msg))
					break;
				ResendMessage(msg);
				continue;
			}
			on "PermitManager", "Removed", msg:
			{
				if (ValidatePermitManagerMessage(msg))
					break;
				ResendMessage(msg);
				continue;
			}
			on "Schedule", "Abort": { break; }
		}
		sender.Sniff(permitManagerRule, "PermitManager", null, false);

		return true;
	}
};
