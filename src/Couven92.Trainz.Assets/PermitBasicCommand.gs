include "defaultdrivercommand.gs"
include "drivercommandshared.gs"
include "soupshared.gs"

class PermitBasicCommand isclass DefaultDriverCommand
{
	public define string KUID_RULE_ENTRY = "PermitManagerRule";
	public define string MSG_MAJOR = "PermitBasicCommandMenuItem";
	public define int SEGMENT_RULE_GAMEID = 0;
	public define int SEGMENT_TYPENAME = 1;
	public define int SEGMENT_OBJECTNAME = 2;
	public define int SEGMENT_COUNT = 3;
	public KUID permitManagerRuleKuid;

	public string GetMenuItemMessageMajor(void) { return MSG_MAJOR; }
	public string GetMenuItemRootString() { return "Permit Basic"; }

	public mandatory void Init(Asset asset)
	{
		inherited(asset);

		permitManagerRuleKuid = DriverCommandShared.GetDepdendantKUID(me, KUID_RULE_ENTRY);
	}

	public Soup CreateScheduleCommandProperties(Message menuItemMessage)
	{
		string[] msgSegments = DriverCommandShared.UnpackString(menuItemMessage.minor, SEGMENT_COUNT);
		Soup soup = Constructors.NewSoup();
		soup.SetNamedTag("rule", msgSegments[SEGMENT_RULE_GAMEID]);
		soup.SetNamedTag("type", msgSegments[SEGMENT_TYPENAME]);
		soup.SetNamedTag("object", msgSegments[SEGMENT_OBJECTNAME]);
		return soup;
	}

	public Menu AddPermitSubCommandItem(string[] msgSegments) { return cast<Menu>(null); }

	void AddCommandMenuSubItems(Menu subMenuRoot, ScenarioBehavior permitManagerRule, string[] permitTypes, string[] permitObjects)
	{
		int i, j;
		string[] msgSegments = new string[SEGMENT_COUNT];
		if (permitManagerRule)
			msgSegments[SEGMENT_RULE_GAMEID] = permitManagerRule.GetGameObjectID().SerialiseToString();
		for (i = 0; i < permitTypes.size(); i++)
		{
			string permitType = permitTypes[i];
			msgSegments[SEGMENT_TYPENAME] = permitType;
			Menu permitTypeSubMenu = Constructors.NewMenu();
			for (j = 0; j < permitObjects.size(); j++)
			{
				string permitObject = permitObjects[j];
				msgSegments[SEGMENT_OBJECTNAME] = permitObject;
				Menu permitSubMenu = AddPermitSubCommandItem(msgSegments);
				if (permitSubMenu)
				{
					if (permitSubMenu.CountItems() > 0)
						permitTypeSubMenu.AddSubmenu(permitObject + " >", permitSubMenu);
				}
				else
				{
					string msgMinor = DriverCommandShared.PackToString(msgSegments);
					permitTypeSubMenu.AddItem(permitObject, me, MSG_MAJOR, msgMinor);
				}
			}
			permitTypeSubMenu.SubdivideItems(true);
			if (permitTypeSubMenu.CountItems() > 0)
				subMenuRoot.AddSubmenu(permitType + " >", permitTypeSubMenu);
		}
		subMenuRoot.SubdivideItems(true);
	}

	public void AddCommandMenuItem(DriverCharacter driver, Menu menu)
	{
		ScenarioBehavior[] rules = DriverCommandShared.GetMatchingRuleInstances(permitManagerRuleKuid);
		if (!rules or rules.size() < 1)
			return;

		Menu subMenu = Constructors.NewMenu();
		int i;
		for (i = 0; i < rules.size(); i++)
		{
			Soup ruleProps = rules[i].GetProperties();
			if (!ruleProps)
				continue;
			Soup objsSoup = ruleProps.GetNamedSoup("objects");
			Soup typsSoup = ruleProps.GetNamedSoup("types");
			string[] permitObjects = SoupShared.GetStringArrayFromArraySoup(objsSoup, "name");
			string[] permitTypes = SoupShared.GetStringArrayFromArraySoup(typsSoup, "name");

			if (permitObjects and permitObjects.size() > 0 and permitTypes and permitTypes.size() > 0)
			{
				//if (subMenu.CountItems() > 0)
				//	subMenu.AddSeperator();
				AddCommandMenuSubItems(subMenu, rules[i], permitTypes, permitObjects);
			}
		}

		if (subMenu.CountItems() > 0)
			menu.AddSubmenu(GetMenuItemRootString() + " >", subMenu);
	}
};
