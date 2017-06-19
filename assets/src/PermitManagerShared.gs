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

class PermitQueueItem
{
	public PermitType type;
	public GameObject src;
};

class PermitState
{
	public PermitType type;
	public GameObject[] grants;
	public PermitQueueItem[] queue;
};

class PermitObject
{
	public string name;
	public PermitState state;

	public bool AcquirePermit(GameObject src, PermitType type, bool enqueue)
	{
		if (!type)
			return false;

		if (!state)
		{
			state = new PermitState();
			state.type = type;
			GameObject[] grants = new GameObject[1];
			grants[0] = src;
			state.grants = grants;
			state.queue = new PermitQueueItem[0];
			return true;
		}

		if (state.type)
		{
			if (!state.grants or state.grants.size() == 0)
			{
				state.type = null;
				return AcquirePermit(src, type, enqueue);
			}

			if (state.type == type and state.type.isShared and (!state.queue or state.queue.size() == 0))
			{
				state.grants[state.grants.size()] = src;
				return true;
			}

			if (enqueue)
			{
				PermitQueueItem qi = new PermitQueueItem();
				qi.src = src;
				qi.type = type;
				if (!state.queue)
					state.queue = new PermitQueueItem[0];
				state.queue[state.queue.size()] = qi;
			}
			return false;
		}

		state.type = type;
		if (!state.grants)
			state.grants = new GameObject[0];
		state.grants[state.grants.size()] = src;
		return true;
	}

	public bool ReleasePermit(GameObject src, PermitType type)
	{
		if (!state)
			return false;
		else if (!state.type or state.type != type)
			return false;
		else if (!state.grants)
			return false;
		int i;
		for (i = 0; i < state.grants.size(); i++)
		{
			if (state.grants[i] == src)
			{
				// Replace current item with the last item
				if (i < (state.grants.size() - 1))
					state.grants[i] = state.grants[state.grants.size() - 1];
				// Shrink the grants array at the end
				state.grants[state.grants.size() - 1,] = null;
				return true;
			}
		}
		if (src)
			return ReleasePermit(null, type);
		return false;
	}

	public bool DequeuePermitRequest(GameObject src, PermitType type)
	{
		return false;
	}

	public void SetProperties(Soup soup, PermitType[] types)
	{
		if (!soup)
			return;

		string soupName = soup.GetNamedTag(PermitManagerConst.PermitObjectNameSoupTag);
		if (soupName)
			me.name = soupName;

	}

	public void SetProperties(Soup soup)
	{ SetProperties(soup, cast<PermitType[]>(null)); }

	public Soup GetProperties()
	{
		Soup soup = Constructors.NewSoup();

		soup.SetNamedTag(PermitManagerConst.PermitObjectNameSoupTag, me.name);


		return soup;
	}
};

static class PermitConverter
{
	public PermitType[] GetPermitTypesFromSoup(Soup permitTypesSoup)
	{
		int i;
		if (!permitTypesSoup)
			return cast<PermitType[]>(null);
		PermitType[] result = new PermitType[0];
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

	public PermitObject[] GetPermitObjectsFromSoup(Soup permitsSoup, PermitType[] permitTypes)
	{
		int i;
		if (!permitsSoup)
			return cast<PermitObject[]>(null);
		PermitObject[] result = new PermitObject[0];
		for (i = 0; i < permitsSoup.CountTags(); i++)
		{
			string soupTag = permitsSoup.GetIndexedTagName(i);
			Soup soup = permitsSoup.GetNamedSoup(soupTag);
			if (!soup)
				continue;
			PermitObject newPermitObj = new PermitObject();
			newPermitObj.SetProperties(soup, permitTypes);
			result[result.size()] = newPermitObj;
		}
		return result;
	}

	public PermitObject[] GetPermitObjectsFromSoup(Soup permitsSoup)
	{ return GetPermitObjectsFromSoup(permitsSoup, cast<PermitType[]>(null)); }

	public Soup GetSoupFromPermitTypes(PermitType[] permitTypes)
	{
		int i;
		if (!permitTypes)
			return cast<Soup>(null);
		Soup result = Constructors.NewSoup();
		for (i = 0; i < permitTypes.size(); i++)
		{
			result.AddUniqueNamedSoup(permitTypes[i].GetProperties());
		}
		return result;
	}

	public Soup GetSoupFromPermitObjects(PermitObject[] permitObjs)
	{
		int i;
		if (!permitObjs)
			return cast<Soup>(null);
		Soup result = Constructors.NewSoup();
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
