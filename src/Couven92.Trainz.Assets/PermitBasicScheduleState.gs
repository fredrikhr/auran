include "Constructors.gs"
include "Soup.gs"

class PermitBasicScheduleState
{
	public GameObject permitManagerRule;
	public string permitType;
	public string permitObject;

	public void SetProperties(Soup soup)
	{
		if (!soup)
			return;

		string sgid = soup.GetNamedTag("rule");
		GameObjectID gid = Router.SerialiseGameObjectIDFromString(sgid);
		GameObject permitManagerRule = Router.GetGameObject(gid);
		if (permitManagerRule)
			me.permitManagerRule = permitManagerRule;
		string permitType = soup.GetNamedTag("type");
		if (permitType)
			me.permitType = permitType;
		string permitObject = soup.GetNamedTag("object");
		if (permitObject)
			me.permitObject = permitObject;
	}

	public void PopulateProperties(Soup soup)
	{
		if (!soup)
			return;
		string sgid = "";
		if (permitManagerRule)
			sgid = permitManagerRule.GetGameObjectID().SerialiseToString();
		soup.SetNamedTag("rule", sgid);
		soup.SetNamedTag("type", permitType);
		soup.SetNamedTag("object", permitObject);
	}

	public Soup GetProperties(void)
	{
		Soup soup = Constructors.NewSoup();
		PopulateProperties(soup);
		return soup;
	}
};
