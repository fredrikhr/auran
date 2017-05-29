include "Soup.gs"
include "Constructors.gs"

static class PermitManagerConst
{
	define public string PermitManagerRuleKuidEntryName = "PermitManagerRule";
	define public string PermitTypesSoupTag = "types";
	define public string PermitObjectsSoupTag = "objects";
};

class PermitManagerPermitType
{
	public void SetProperties(Soup soup)
	{

	}

	public Soup GetProperties()
	{
		Soup soup = Constructors.NewSoup();

		return soup;
	}
};

class PermitManagerPermitObject
{
	public void SetProperties(Soup soup)
	{

	}

	public Soup GetProperties()
	{
		Soup soup = Constructors.NewSoup();

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
};
