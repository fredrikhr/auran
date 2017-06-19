include "Soup.gs"
include "Constructors.gs"
include "ScenarioBehavior.gs"

static class PermitManagerConst
{
	define public string PermitManagerRuleSoupTag = "manager";
	define public string PermitManagerRuleKuidEntryName = "PermitManagerRule";

	define public string PermitManagerAddItemPropertyId = "add";

	define public string PermitTypeSoupTag = "type";
	define public string PermitTypesSoupTag = "types";
	define public string PermitTypeNameSoupTag = "name";
	define public string PermitTypeSharedSoupTag = "shared";
	define public string PermitTypePropertyId = "type";
	define public string PermitTypeRemovePropertyId = "remove";
	define public string PermitTypeNamePropertyId = "name";
	define public string PermitTypeSharedPropertyId = "shared";
	define public string PermitTypeHeadingStringTable = "PermitTypeHeading";
	define public string PermitTypeDescriptionStringTable = "PermitTypeDescription";
	define public string PermitTypeAddNameStringTable = "PermitTypeAddName";
	define public string PermitTypeAddDescriptionStringTable = "PermitTypeAddDescription";
	define public string PermitTypeRemoveNameStringTable = "PermitTypeRemoveName";
	define public string PermitTypeRemoveDescriptionStringTable = "PermitTypeRemoveDescription";
	define public string PermitTypeNameNameStringTable = "PermitTypeNameName";
	define public string PermitTypeNameDescriptionStringTable = "PermitTypeNameDescription";
	define public string PermitTypeSharedNameStringTable = "PermitTypeSharedName";
	define public string PermitTypeSharedDescriptionStringTable = "PermitTypeSharedDescription";

	define public string PermitObjectSoupTag = "object";
	define public string PermitObjectsSoupTag = "objects";
	define public string PermitObjectNameSoupTag = "name";
	define public string PermitObjectStateSoupTag = "state";
	define public string PermitObjectPropertyId = "object";
	define public string PermitObjectRemovePropertyId = "remove";
	define public string PermitObjectNamePropertyId = "name";
	define public string PermitObjectHeadingStringTable = "PermitObjectHeading";
	define public string PermitObjectDescriptionStringTable = "PermitObjectDescription";
	define public string PermitObjectAddNameStringTable = "PermitObjectAddName";
	define public string PermitObjectAddDescriptionStringTable = "PermitObjectAddDescription";
	define public string PermitObjectRemoveNameStringTable = "PermitObjectRemoveName";
	define public string PermitObjectRemoveDescriptionStringTable = "PermitObjectRemoveDescription";
	define public string PermitObjectNameNameStringTable = "PermitObjectNameName";
	define public string PermitObjectNameDescriptionStringTable = "PermitObjectNameDescription";

	define public string PermitStateTypeSoupTag = "type";
	define public string PermitStateGrantsSoupTag = "grants";
	define public string PermitStateQueueSoupTag = "queue";

	define public string PermitQueueItemTypeSoupTag = "queue";
	define public string PermitQueueItemSourceSoupTag = "src";

	define public string PermitManagerAcquireCommandMenuItemEntry = "AcquireCommandMenuItem";
	define public string PermitManagerReleaseCommandMenuItemEntry = "ReleaseCommandMenuItem";

	define public string PermitManagerMessageMajor = "PermitManager";
	define public string PermitScheduleCommandOpCodeSoupTag = "opcode";
	define public string PermitScheduleCommandOpCodeAcquire = "Acquire";
	define public string PermitScheduleCommandOpCodeRelease = "Release";
	define public string PermitScheduleCommandOpCodeEnqueued = "Enqueued";
	define public string PermitScheduleCommandOpCodeGranted = "Granted";
	define public string PermitScheduleCommandOpCodeReleased = "Released";
	define public string PermitScheduleCommandOpCodeRemoved = "Removed";
};

class PermitType
{
	public string name;
	public bool isShared;

	public void Init(string name, bool shared)
	{
		me.name = name;
		me.isShared = shared;
	}

	public void Init(string name)
	{ Init(name, false); }

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

	public void Init(GameObject src, PermitType type)
	{
		me.src = src;
		me.type = type;
	}

	public void SetProperties(Soup soup, PermitType[] types)
	{
		if (!soup)
			return;
		int i;
		if (types)
		{
			string typeName = soup.GetNamedTag(PermitManagerConst.PermitQueueItemTypeSoupTag);
			for (i = 0; i < types.size(); i++)
			{
				if (typeName == types[i].name)
				{
					me.type = types[i];
					break;
				}
			}
		}
		int goId = soup.GetNamedTagAsInt(PermitManagerConst.PermitQueueItemSourceSoupTag);
		GameObject goRef = Router.GetGameObject(goId);
		if (goRef)
			me.src = goRef;
	}

	public void SetProperties(Soup soup)
	{ SetProperties(soup, cast<PermitType[]>(null)); }

	public Soup GetProperties(void)
	{
		Soup soup = Constructors.NewSoup();

		if (type)
			soup.SetNamedTag(PermitManagerConst.PermitQueueItemTypeSoupTag, type.name);
		if (src)
			soup.SetNamedTag(PermitManagerConst.PermitQueueItemSourceSoupTag, src.GetId());

		return soup;
	}
};

class PermitState
{
	public PermitType type;
	public GameObject[] grants;
	public PermitQueueItem[] queue;

	public void Init(void)
	{
		grants = new GameObject[0];
		queue = new PermitQueueItem[0];
	}

	public void SetProperties(Soup soup, PermitType[] types)
	{
		int i; int n;
		if (!soup or !types)
			return;

		string typeName = soup.GetNamedTag(PermitManagerConst.PermitStateTypeSoupTag);
		for (i = 0; i < types.size(); i++)
		{
			if (typeName == types[i].name)
			{
				me.type = types[i];
				break;
			}
		}

		Soup grantsSoup = soup.GetNamedSoup(PermitManagerConst.PermitStateGrantsSoupTag);
		if (grantsSoup)
		{
			n = grantsSoup.CountTags();
			GameObject[] grants = new GameObject[0];
			for (i = 0; i < n; i++)
			{
				string tagName = grantsSoup.GetIndexedTagName(i);
				int goId = grantsSoup.GetNamedTagAsInt(tagName);
				GameObject goRef = Router.GetGameObject(goId);
				if (goRef)
					grants[grants.size()] = goRef;
			}
			me.grants = grants;
		}

		Soup queueSoup = soup.GetNamedSoup(PermitManagerConst.PermitStateQueueSoupTag);
		if (queueSoup)
		{
			n = queueSoup.CountTags();
			PermitQueueItem[] queue = new PermitQueueItem[0];
			for (i = 0; i < n; i++)
			{
				string tagName = queueSoup.GetIndexedTagName(i);
				Soup qiSoup = queueSoup.GetNamedSoup(tagName);
				if (qiSoup)
				{
					PermitQueueItem qiObj = new PermitQueueItem();
					qiObj.SetProperties(qiSoup, types);
					queue[queue.size()] = qiObj;
				}
			}
			me.queue = queue;
		}
	}

	public void SetProperties(Soup soup)
	{ SetProperties(soup, cast<PermitType[]>(null)); }

	public Soup GetProperties(void)
	{
		int i;
		Soup soup = Constructors.NewSoup();

		if (type)
			soup.SetNamedTag(PermitManagerConst.PermitStateTypeSoupTag, type.name);
		if (grants)
		{
			Soup grantsSoup = Constructors.NewSoup();
			for (i = 0; i < grants.size(); i++)
			{
				if (grants[i])
					grantsSoup.SetNamedTag(i, grants[i].GetId());
			}
			soup.SetNamedSoup(PermitManagerConst.PermitStateGrantsSoupTag, grantsSoup);
		}
		if (queue)
		{
			Soup queueSoup = Constructors.NewSoup();
			for (i = 0; i < queue.size(); i++)
			{
				if (queue[i])
					queueSoup.AddUniqueNamedSoup(queue[i].GetProperties());
			}
			soup.SetNamedSoup(PermitManagerConst.PermitStateQueueSoupTag, queueSoup);
		}

		return soup;
	}
};

class PermitObject
{
	public string name;
	public PermitState state;

	public void Init(string name)
	{
		me.name = name;
		me.state = new PermitState();
		me.state.Init();
	}

	public void SetProperties(Soup soup, PermitType[] types)
	{
		if (!soup)
			return;

		string soupName = soup.GetNamedTag(PermitManagerConst.PermitObjectNameSoupTag);
		if (soupName)
			me.name = soupName;
		Soup stateSoup = soup.GetNamedSoup(PermitManagerConst.PermitObjectStateSoupTag);
		if (stateSoup)
		{
			state = new PermitState();
			state.SetProperties(stateSoup, types);
		}
	}

	public void SetProperties(Soup soup)
	{ SetProperties(soup, cast<PermitType[]>(null)); }

	public Soup GetProperties()
	{
		Soup soup = Constructors.NewSoup();

		soup.SetNamedTag(PermitManagerConst.PermitObjectNameSoupTag, me.name);
		if (me.state)
			soup.SetNamedSoup(PermitManagerConst.PermitObjectStateSoupTag, me.state.GetProperties());

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
