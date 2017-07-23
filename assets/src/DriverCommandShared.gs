include "drivercommand.gs"

static class DriverCommandShared
{
	public KUID GetDepdendantKUID(DriverCommand cmd, string kuidListEntry);
	public ScenarioBehavior[] GetMatchingRuleInstances(KUID ruleKuid);
	public string PackToString(string[] items);
	public string[] UnpackString(string packed, int count);

	public KUID GetDepdendantKUID(DriverCommand cmd, string kuidListEntry)
	{
		if (!cmd or !kuidListEntry)
			return cast<KUID>(null);
		KUID targetAssetKuid = cmd.GetAsset().LookupKUIDTable(kuidListEntry);
		if (!targetAssetKuid)
		{
			Interface.Exception("DriverCommandShared.GetDepdendantKUID> Missing entry in asset KUID Table: "
				+ kuidListEntry
				);
		}
		return targetAssetKuid;
	}

	public ScenarioBehavior[] GetMatchingRuleInstances(KUID ruleKuid)
	{
		KUID k = ruleKuid;
		if (!k)
			return cast<ScenarioBehavior[]>(null);
		ScenarioBehavior[] matches = new ScenarioBehavior[0];
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

	public string PackToString(string[] items)
	{
		if (items == null)
			return (string)null;
		string packed = "";
		int i;
		for (i = 0; i < items.size(); i++)
		{
			string iValue = items[i];
			int iSize = 0;
			if (iValue != null)
				iSize = iValue.size();
			string iPacked = (string)iSize + "/" + iValue;
			if (packed.size() > 0)
				packed = packed + "/";
			packed = packed + iPacked;
		}
		return packed;
	}

	public string[] UnpackString(string packed, int count)
	{
		string[] unpack = new string[count];
		int i;
		int startIdx = 0;
		for (i = 0; i < count; i++)
		{
			int slashIdx = Str.Find(packed, "/", startIdx);
			if (slashIdx < 0)
			{
				Interface.Exception("DriverCommandShared.UnpackString> Missing '/' token after in remaining substring: \"" + packed[startIdx,] + "\", processed " + (string)startIdx + " characters in packed string.");
				return unpack;
			}
			string lengthString = packed[startIdx, slashIdx];
			int lengthValue = Str.ToInt(lengthString);
			startIdx = slashIdx + 1;
			string valueString = packed[startIdx, startIdx + lengthValue];
			startIdx = startIdx + lengthValue;
			slashIdx = Str.Find(packed, "/", startIdx);
			if (slashIdx >= 0)
				startIdx = slashIdx + 1;
			unpack[i] = valueString;
		}
		return unpack;
	}
};
