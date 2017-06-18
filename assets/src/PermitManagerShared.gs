include "Soup.gs"
include "Constructors.gs"
include "ScenarioBehavior.gs"

static class PermitManagerConst
{
	define public string PermitManagerRuleSoupTag = "manager";
	define public string PermitManagerRuleKuidEntryName = "PermitManagerRule";

	define public string PermitTypeSoupTag = "type";
	define public string PermitTypesSoupTag = "types";
	define public string PermitTypeNameSoupTag = "name";
	define public string PermitTypeSharedSoupTag = "shared";

	define public string PermitObjectSoupTag = "object";
	define public string PermitObjectsSoupTag = "objects";
	define public string PermitObjectNameSoupTag = "name";
	define public string PermitObjectStateSoupTag = "state";

	define public string PermitManagerAcquireCommandMenuItemEntry = "AcquireCommandMenuItem";
	define public string PermitManagerReleaseCommandMenuItemEntry = "ReleaseCommandMenuItem";

	define public string PermitManagerMessageMajor = "PermitManager";
	define public string PermitScheduleCommandOpCodeSoupTag = "opcode";
	define public string PermitScheduleCommandOpCodeAcquire = "Acquire";
	define public string PermitScheduleCommandOpCodeRelease = "Release";
	define public string PermitScheduleCommandOpCodeGranted = "Granted";
};

class PermitType
{
	public string name;
	public bool isShared;

	public void SetProperties(Soup soup)
	{
		if (!soup)
			return;

		string soupName = soup.GetNamedTag(PermitManagerConst.PermitTypeNameSoupTag);
		if (soupName)
			me.name = soupName;
		if (soup.GetIndexForNamedTag(PermitManagerConst.PermitTypeSharedSoupTag) >= 0)
			me.isShared = soup.GetNamedTagAsBool(PermitManagerConst.PermitTypeSharedSoupTag);
	}

	public Soup GetProperties()
	{
		Soup soup = Constructors.NewSoup();

		soup.SetNamedTag(PermitManagerConst.PermitTypeNameSoupTag, me.name);
		soup.SetNamedTag(PermitManagerConst.PermitTypeSharedSoupTag, me.isShared);

		return soup;
	}
};

class PermitObject
{
	public string name;
	public PermitType state;

	public void SetProperties(Soup soup)
	{
		if (!soup)
			return;

		string soupName = soup.GetNamedTag(PermitManagerConst.PermitObjectNameSoupTag);
		if (soupName)
			me.name = soupName;
		Soup stateSoup = soup.GetNamedSoup(PermitManagerConst.PermitObjectStateSoupTag);
		if (stateSoup)
		{
			state = new PermitType();
			state.SetProperties(stateSoup);
		}
	}

	public Soup GetProperties()
	{
		Soup soup = Constructors.NewSoup();

		soup.SetNamedTag(PermitManagerConst.PermitObjectNameSoupTag, me.name);
		if (state)
			soup.SetNamedSoup(PermitManagerConst.PermitObjectStateSoupTag, state.GetProperties());

		return soup;
	}
};

static class PermitConverter
{
	public PermitType[] GetPermitTypesFromSoup(Soup permitTypesSoup)
	{
		int i;
		PermitType[] result = new PermitType[0];
		if (!permitTypesSoup)
			return result;
		for (i = 0; i < permitTypesSoup.CountTags(); i++)
		{
			string soupTag = permitTypesSoup.GetIndexedTagName(i);
			Soup soup = permitTypesSoup.GetNamedSoup(soupTag);
			if (!soup)
				continue;
			PermitType newPermitType = new PermitType();
			newPermitType.SetProperties(soup);
			result[result.size()] = newPermitType;
		}
		return result;
	}

	public PermitObject[] GetPermitObjectsFromSoup(Soup permitsSoup)
	{
		int i;
		PermitObject[] result = new PermitObject[0];
		if (!permitsSoup)
			return result;
		for (i = 0; i < permitsSoup.CountTags(); i++)
		{
			string soupTag = permitsSoup.GetIndexedTagName(i);
			Soup soup = permitsSoup.GetNamedSoup(soupTag);
			if (!soup)
				continue;
			PermitObject newPermitObj = new PermitObject();
			newPermitObj.SetProperties(soup);
			result[result.size()] = newPermitObj;
		}
		return result;
	}

	public Soup GetSoupFromPermitTypes(PermitType[] permitTypes)
	{
		int i;
		Soup result = Constructors.NewSoup();
		if (!permitTypes)
			return result;
		for (i = 0; i < permitTypes.size(); i++)
		{
			result.AddUniqueNamedSoup(permitTypes[i].GetProperties());
		}
		return result;
	}

	public Soup GetSoupFromPermitObjects(PermitObject[] permitObjs)
	{
		int i;
		Soup result = Constructors.NewSoup();
		if (!permitObjs)
			return result;
		for (i = 0; i < permitObjs.size(); i++)
		{
			result.AddUniqueNamedSoup(permitObjs[i].GetProperties());
		}
		return result;
	}

	public void AddPermitTypesToSoup(PermitType[] permitTypes, Soup soup)
	{
		soup.SetNamedSoup(PermitManagerConst.PermitTypesSoupTag,
			GetSoupFromPermitTypes(permitTypes));
	}

	public void AddPermitObjectsToSoup(PermitObject[] permitObjs, Soup soup)
	{
		soup.SetNamedSoup(PermitManagerConst.PermitObjectsSoupTag,
			GetSoupFromPermitObjects(permitObjs));
	}

	public PermitType GetPermitTypeByName(ScenarioBehavior permitManager, string name)
	{
		if (!permitManager)
			return null;

		Soup managerSoup = permitManager.GetProperties();
		if (!managerSoup)
			return null;
		Soup typesSoup = managerSoup.GetNamedSoup(PermitManagerConst.PermitTypesSoupTag);
		if (!typesSoup)
			return null;
		int typesCount = typesSoup.CountTags();
		int i;
		for (i = 0; i < typesCount; i++)
		{
			string tagName = typesSoup.GetIndexedTagName(i);
			Soup typeSoup = typesSoup.GetNamedSoup(tagName);
			if (!typeSoup)
				continue;
			string typeName = typeSoup.GetNamedTag(PermitManagerConst.PermitTypeNameSoupTag);
			if (typeName == name)
			{
				PermitType result = new PermitType();
				result.SetProperties(typeSoup);
				return result;
			}
		}

		return null;
	}

	public PermitObject GetPermitObjectByName(ScenarioBehavior permitManager, string name)
	{
		if (!permitManager)
			return null;

		Soup managerSoup = permitManager.GetProperties();
		if (!managerSoup)
			return null;
		Soup objsSoup = managerSoup.GetNamedSoup(PermitManagerConst.PermitObjectsSoupTag);
		if (!objsSoup)
			return null;
		int objsCount = objsSoup.CountTags();
		int i;
		for (i = 0; i < objsCount; i++)
		{
			string tagName = objsSoup.GetIndexedTagName(i);
			Soup objSoup = objsSoup.GetNamedSoup(tagName);
			if (!objSoup)
				continue;
			string objName = objSoup.GetNamedTag(PermitManagerConst.PermitObjectNameSoupTag);
			if (objName == name)
			{
				PermitObject result = new PermitObject();
				result.SetProperties(objSoup);
				return result;
			}
		}

		return null;
	}
};
