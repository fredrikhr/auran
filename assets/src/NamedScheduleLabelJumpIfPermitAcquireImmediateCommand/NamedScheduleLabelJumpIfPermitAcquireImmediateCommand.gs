include "drivercommandshared.gs"
include "PermitBasicCommand.gs"
include "NamedScheduleLabelJumpIfPermitAcquireImmediateScheduleCommand.gs"

class NamedScheduleLabelJumpIfPermitAcquireImmediateCommand isclass PermitBasicCommand
{
	public define int SEGMENT_LABEL = 3;
	public define int SEGMENT_COUNT = 4;
	define string KUID_LABEL_NAMES_RULE_ENTRY = "NamedScheduleLabelRule";
	KUID labelNamesRuleKuid;
	StringTable stringTable;

	public mandatory void Init(Asset asset)
	{
		inherited(asset);

		labelNamesRuleKuid = DriverCommandShared.GetDepdendantKUID(me, KUID_LABEL_NAMES_RULE_ENTRY);
		stringTable = GetAsset().GetStringTable();
	}

	public Soup CreateScheduleCommandProperties(Message menuItemMessage)
	{
		Soup soup = inherited(menuItemMessage);
		string[] msgSegments = DriverCommandShared.UnpackString(menuItemMessage.minor, SEGMENT_COUNT);
		soup.SetNamedTag("label", msgSegments[SEGMENT_LABEL]);
		return soup;
	}

	public DriverScheduleCommand CreateScheduleComamndInstance(void)
	{
		NamedScheduleLabelJumpIfPermitAcquireImmediateScheduleCommand cmd = new NamedScheduleLabelJumpIfPermitAcquireImmediateScheduleCommand();
		return cast<DriverScheduleCommand>(cmd);
	}

	public Menu AddPermitSubCommandItem(string[] msgSegments)
	{
		Menu subMenu = Constructors.NewMenu();
		ScenarioBehavior[] rules = DriverCommandShared.GetMatchingRuleInstances(labelNamesRuleKuid);
		if (!rules or rules.size() < 1)
			return subMenu;

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
				msgSegments[SEGMENT_LABEL] = labels[j];
				string msgMinor = DriverCommandShared.PackToString(msgSegments);
				subMenu.AddItem(stringTable.GetString1("jumplabelmenuitem", labels[j]), me, GetMenuItemMessageMajor(), msgMinor);
			}
		}
		subMenu.SubdivideItems(true);
		return subMenu;
	}

	public string GetMenuItemRootString(void) { return stringTable.GetString("rootmenuitem"); }
};
