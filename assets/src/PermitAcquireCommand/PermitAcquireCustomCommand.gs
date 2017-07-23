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

		sender.Sniff(permitManagerRule, "PermitManager", null, true);
		SendMessage(sender, "Acquire");

		Soup soup;
		Message msg;
		wait()
		{
			on "PermitManager", "Granted", msg:
			{
				Interface.Print("PermitAcquireCustomCommand.Execute> Received Permit Granted message");
				if (ValidatePermitManagerMessage(msg))
					break;
				ResendMessage(msg);
				continue;
			}

			on "Schedule", "Abort":
			{
				Interface.Print("PermitAcquireCustomCommand.Execute> Received Schedule Abort message");
				sender.SendMessage(permitManagerRule, "PermitManager", "Release", soup);
				break;
			}
		}
		sender.Sniff(permitManagerRule, "PermitManager", null, false);

		return true;
	}
};
