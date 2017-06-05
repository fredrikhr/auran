include "Soup.gs"
include "Constructors.gs"
include "ScenarioBehavior.gs"

static class PermitManagerConst
{
	define public string PermitManagerRuleKuidEntryName = "PermitManagerRule";
	define public string PermitTypesSoupTag = "types";
	define public string PermitTypeNameSoupTag = "name";
	define public string PermitObjectsSoupTag = "objects";
	define public string PermitObjectNameSoupTag = "name";
};

class PermitManagerPermitType
{
	public string name;

	public void SetProperties(Soup soup)
	{
		if (!soup)
			return;

		string soupName = soup.GetNamedTag(PermitManagerConst.PermitTypeNameSoupTag);
		if (soupName)
			me.name = soupName;
	}

	public Soup GetProperties()
	{
		Soup soup = Constructors.NewSoup();

		soup.SetNamedTag(PermitManagerConst.PermitTypeNameSoupTag, me.name);

		return soup;
	}
};

class PermitManagerPermitObject
{
	public string name;

	public void SetProperties(Soup soup)
	{
		if (!soup)
			return;

		string soupName = soup.GetNamedTag(PermitManagerConst.PermitObjectNameSoupTag);
		if (soupName)
			me.name = soupName;
	}

	public Soup GetProperties()
	{
		Soup soup = Constructors.NewSoup();

		soup.SetNamedTag(PermitManagerConst.PermitObjectNameSoupTag, me.name);

		return soup;
	}
};

static class PermitManagerConverter
{
	public PermitManagerPermitType[] GetPermitTypesFromSoup(Soup permitTypesSoup)
	{
		int i;
		PermitManagerPermitType[] result = new PermitManagerPermitType[0];
		if (!permitTypesSoup)
			return result;
		for (i = 0; i < permitTypesSoup.CountTags(); i++)
		{
			string soupTag = permitTypesSoup.GetIndexedTagName(i);
			Soup soup = permitTypesSoup.GetNamedSoup(soupTag);
			if (!soup)
				continue;
			PermitManagerPermitType newPermitType = new PermitManagerPermitType();
			newPermitType.SetProperties(soup);
			result[result.size()] = newPermitType;
		}
		return result;
	}

	public PermitManagerPermitObject[] GetPermitObjectsFromSoup(Soup permitsSoup)
	{
		int i;
		PermitManagerPermitObject[] result = new PermitManagerPermitObject[0];
		if (!permitsSoup)
			return result;
		for (i = 0; i < permitsSoup.CountTags(); i++)
		{
			string soupTag = permitsSoup.GetIndexedTagName(i);
			Soup soup = permitsSoup.GetNamedSoup(soupTag);
			if (!soup)
				continue;
			PermitManagerPermitObject newPermitObj = new PermitManagerPermitObject();
			newPermitObj.SetProperties(soup);
			result[result.size()] = newPermitObj;
		}
		return result;
	}

	public Soup GetSoupFromPermitTypes(PermitManagerPermitType[] permitTypes)
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

	public Soup GetSoupFromPermitObjects(PermitManagerPermitObject[] permitObjs)
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

	public void AddPermitTypesToSoup(PermitManagerPermitType[] permitTypes, Soup soup)
	{
		soup.SetNamedSoup(PermitManagerConst.PermitTypesSoupTag,
			GetSoupFromPermitTypes(permitTypes));
	}

	public void AddPermitObjectsToSoup(PermitManagerPermitObject[] permitObjs, Soup soup)
	{
		soup.SetNamedSoup(PermitManagerConst.PermitObjectsSoupTag,
			GetSoupFromPermitObjects(permitObjs));
	}

	public PermitManagerPermitType GetPermitTypeByName(ScenarioBehavior permitManager, string name)
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
				PermitManagerPermitType result = new PermitManagerPermitType();
				result.SetProperties(typeSoup);
				return result;
			}
		}

		return null;
	}

	public PermitManagerPermitObject GetPermitObjectByName(ScenarioBehavior permitManager, string name)
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
				PermitManagerPermitObject result = new PermitManagerPermitObject();
				result.SetProperties(objSoup);
				return result;
			}
		}

		return null;
	}
};
