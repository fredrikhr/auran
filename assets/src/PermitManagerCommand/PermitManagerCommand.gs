include "Asset.gs"
include "DriverCharacter.gs"
include "Menu.gs"
include "DriverCommand.gs"
include "DriverScheduleCommand.gs"

include "PermitManagerShared.gs"

class PermitManagerCommand isclass DriverCommand
{
	public void Init(Asset asset)
	{
		inherited(asset);
	}

	KUID getPermitManagerRuleKuid(void)
	{
		KUID targetAssetKuid = GetAsset().LookupKUIDTable(PermitManagerConst.PermitManagerRuleKuidEntryName);
		if (!targetAssetKuid)
		{
			Exception("Missing entry in asset KUID Table: "
				+ PermitManagerConst.PermitManagerRuleKuidEntryName
				);
		}
		return targetAssetKuid;
	}

	ScenarioBehavior[] getPermitManagerInstances()
	{
		KUID k = getPermitManagerRuleKuid();

		ScenarioBehavior[] matches = new ScenarioBehavior[0];
		if (!k)
			return matches;
		string kString = k.GetBaseString();

		ScenarioBehavior[] behaviors = World.GetBehaviors();

		int i;
		for (i = 0; i < behaviors.size(); i++)
		{
			Asset behaviorAsset = behaviors[i].GetAsset();
			KUID behaviorKuid = behaviorAsset.GetKUID();
			string behaviorKuidString = behaviorKuid.GetBaseString();
			if (behaviorKuidString == kString)
				matches[matches.size()] = behaviors[i];
		}

		return matches;
	}

	public void AddCommandMenuItem(DriverCharacter driver, Menu menu)
	{
		ScenarioBehavior[] rules = getPermitManagerInstances();
		if (!rules or rules.size() < 1)
			return;

		int i;
		for (i = 0; i < rules.size(); i++)
		{
			Soup ruleProps = rules[i].GetProperties();


		}
	}

	public DriverScheduleCommand CreateScheduleCommand(DriverCharacter driver, Soup soup)
	{
		return inherited(driver, soup);
	}
};
