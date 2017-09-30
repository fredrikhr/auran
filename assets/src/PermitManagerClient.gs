include "gs.gs"
include "interface.gs"
include "PermitBasicScheduleState.gs"

class PermitManagerClient
{
	public PermitBasicScheduleState state;

	public bool ValidatePermitManagerMessage(Message msg);
	public void ResendMessage(Message msg);

	public void Init(PermitBasicScheduleState state)
	{
		me.state = state;
	}

	public bool ValidatePermitManagerMessage(Message msg)
	{
		//GameObject src = cast<GameObject>(msg.src);
		//if (src)
		//	Interface.Print("PermitAcquireCustomCommand.ValidateMessage> src: " + src.GetDebugName());
		//else
		//	Interface.Print("PermitAcquireCustomCommand.ValidateMessage> src: (null)");
		//GameObject dst = cast<GameObject>(msg.dst);
		//if (dst)
		//	Interface.Print("PermitAcquireCustomCommand.ValidateMessage> dst: " + dst.GetDebugName());
		//else
		//	Interface.Print("PermitAcquireCustomCommand.ValidateMessage> dst: (null)");
		//Interface.Print("PermitAcquireCustomCommand.ValidateMessage> major: \"" + msg.major + "\", minor: \"" + msg.minor + "\"");
		Soup soup = cast<Soup>(msg.paramSoup);
		if (!soup)
		{
			Interface.Log("PermitManagerCustomCommand.ValidatePermitManagerMessage> message carries no soup");
			return false;
		}
		if (state.permitType != soup.GetNamedTag("type"))
		{
			Interface.Log("PermitManagerCustomCommand.ValidatePermitManagerMessage> message permit type: \"" + soup.GetNamedTag("type") + "\", expected: \"" + state.permitType + "\"");
			return false;
		}
		if (state.permitObject != soup.GetNamedTag("object"))
		{
			Interface.Log("PermitManagerCustomCommand.ValidatePermitManagerMessage> message permit type: \"" + soup.GetNamedTag("object") + "\", expected: \"" + state.permitObject + "\"");
			return false;
		}
		return true;
	}

	public void ResendMessage(Message msg)
	{
		GameObject sender = cast<GameObject>(msg.src);
		if (!sender)
			sender = state.permitManagerRule;
		sender.PostMessage(cast<GameObject>(msg.dst), msg.major, msg.minor, cast<GSObject>(msg.paramSoup), 0.001);
	}

	public void SendMessage(GameObject sender, string msgMinor, Soup soup)
	{
		soup.SetNamedTag("type", state.permitType);
		soup.SetNamedTag("object", state.permitObject);
		sender.SendMessage(state.permitManagerRule, "PermitManager", msgMinor, soup);
	}

	public void SendMessage(GameObject sender, string msgMinor)
	{ SendMessage(sender, msgMinor, Constructors.NewSoup()); }

	public void PostMessage(GameObject sender, string msgMinor, float seconds, Soup soup)
	{
		soup.SetNamedTag("type", state.permitType);
		soup.SetNamedTag("object", state.permitObject);
		sender.PostMessage(state.permitManagerRule, "PermitManager", msgMinor, soup, seconds);
	}

	public void PostMessage(GameObject sender, string msgMinor, float seconds)
	{ PostMessage(sender, msgMinor, seconds, Constructors.NewSoup()); }

	public void PostMessageImmediate(GameObject sender, string msgMinor, Soup soup)
	{ PostMessage(sender, msgMinor, 0.001, soup); }

	public void PostMessageImmediate(GameObject sender, string msgMinor)
	{ PostMessageImmediate(sender, msgMinor, Constructors.NewSoup()); }
};
