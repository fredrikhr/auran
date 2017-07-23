include "gs.gs"
include "interface.gs"

class PermitManagerClient
{
	public DriverCharacter driver;
	public GameObject permitManagerRule;
	public string permitType, permitObject;

	public bool ValidatePermitManagerMessage(Message msg);
	public void ResendMessage(Message msg);

	public mandatory void Init(DriverCharacter driver, GameObject permitManagerRule, string permitType, string permitObject)
	{
		me.driver = driver;
		me.permitManagerRule = permitManagerRule;
		me.permitType = permitType;
		me.permitObject = permitObject;
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
		if (permitType != soup.GetNamedTag("type"))
		{
			Interface.Log("PermitManagerCustomCommand.ValidatePermitManagerMessage> message permit type: \"" + soup.GetNamedTag("type") + "\", expected: \"" + permitType + "\"");
			return false;
		}
		if (permitObject != soup.GetNamedTag("object"))
		{
			Interface.Log("PermitManagerCustomCommand.ValidatePermitManagerMessage> message permit type: \"" + soup.GetNamedTag("object") + "\", expected: \"" + permitObject + "\"");
			return false;
		}
		return true;
	}

	public void ResendMessage(Message msg)
	{
		GameObject sender = cast<GameObject>(msg.src);
		if (!sender)
			sender = permitManagerRule;
		sender.PostMessage(cast<GameObject>(msg.dst), msg.major, msg.minor, cast<GSObject>(msg.paramSoup), 0.1);
	}

	public void SendMessage(GameObject sender, string msgMinor)
	{
		if (!sender)
		{
			Interface.Log("PermitManagerCustomCommand.SendMessage> sender argument is null");
			sender = driver;
		}

		Soup soup = Constructors.NewSoup();
		soup.SetNamedTag("type", permitType);
		soup.SetNamedTag("object", permitObject);
		sender.SendMessage(permitManagerRule, "PermitManager", "Acquire", soup);
	}
};
