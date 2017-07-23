include "defaultdrivercommand.gs"
include "drivercommandshared.gs"
include "soupshared.gs"

include "namedschedulelabelinsertschedulecommand.gs"

class NamedScheduleLabelInsertCommand isclass DefaultDriverCommand
{
	define string KUID_RULE_ENTRY = "NamedScheduleLabelRule";
	KUID labelNamesRuleKuid;

	public string GetMenuItemMessageMajor(void) { return "InsertLabelCommandMenuItem"; }

	public Soup CreateScheduleComamndProperties(Message menuItemMessage)
	{
		Soup soup = Constructors.NewSoup();
		soup.SetNamedTag("label", menuItemMessage.minor);
		return soup;
	}

	public DriverScheduleCommand CreateScheduleComamndInstance(void)
	{ return cast<DriverScheduleCommand>(new NamedScheduleLabelInsertScheduleCommand()); }

	public void Init(Asset asset)
	{
		inherited(asset);

		labelNamesRuleKuid = DriverCommandShared.GetDepdendantKUID(me, KUID_RULE_ENTRY);
	}

	public void AddCommandMenuItem(DriverCharacter driver, Menu menu)
	{
		ScenarioBehavior[] rules = DriverCommandShared.GetMatchingRuleInstances(labelNamesRuleKuid);
		if (!rules or rules.size() < 1)
			return;

		Menu subMenu = Constructors.NewMenu();
		int i;
		for (i = 0; i < rules.size(); i++)
		{
			Soup ruleSoup = rules[i].GetProperties();
			Soup labelsSoup = ruleSoup.GetNamedSoup("labels");
			string[] labels = SoupShared.GetStringArrayFromArraySoup(labelsSoup, true);
			if (!labels)
				continue;
			int j;
			for (j = 0; j < labels.size(); j++)
			{
				string label = labels[j];
				subMenu.AddItem(label, me, "InsertLabelCommandMenuItem", label);
			}
		}
		subMenu.SubdivideItems(true);
		if (subMenu.CountItems() > 0)
			menu.AddSubmenu(GetAsset().GetStringTable().GetString("InsertLabelMenuItem") + " >", subMenu);
	}
};
