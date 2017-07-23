include "scenariobehavior.gs"

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

		string soupName = soup.GetNamedTag("name");
		if (soupName)
			me.name = soupName;
		if (soup.GetIndexForNamedTag("shared") >= 0)
			me.isShared = soup.GetNamedTagAsBool("shared");
	}

	public Soup GetProperties()
	{
		Soup soup = Constructors.NewSoup();

		soup.SetNamedTag("name", me.name);
		soup.SetNamedTag("shared", me.isShared);

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
			string typeName = soup.GetNamedTag("type");
			for (i = 0; i < types.size(); i++)
			{
				if (typeName == types[i].name)
				{
					me.type = types[i];
					break;
				}
			}
		}
		string goId = soup.GetNamedTag("src");
		GameObject goRef = Router.GetGameObject(Router.SerialiseGameObjectIDFromString(goId));
		if (goRef)
			me.src = goRef;
	}

	public void SetProperties(Soup soup)
	{ SetProperties(soup, cast<PermitType[]>(null)); }

	public Soup GetProperties(void)
	{
		Soup soup = Constructors.NewSoup();

		if (type)
			soup.SetNamedTag("type", type.name);
		if (src)
			soup.SetNamedTag("src", src.GetGameObjectID().SerialiseToString());

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

		string typeName = soup.GetNamedTag("type");
		for (i = 0; i < types.size(); i++)
		{
			if (typeName == types[i].name)
			{
				me.type = types[i];
				break;
			}
		}

		Soup grantsSoup = soup.GetNamedSoup("grants");
		if (grantsSoup)
		{
			n = grantsSoup.CountTags();
			GameObject[] grants = new GameObject[0];
			for (i = 0; i < n; i++)
			{
				string tagName = grantsSoup.GetIndexedTagName(i);
				string sgid = grantsSoup.GetNamedTag(tagName);
				GameObject go = Router.GetGameObject(Router.SerialiseGameObjectIDFromString(sgid));
				if (go)
					grants[grants.size()] = go;
			}
			me.grants = grants;
		}

		Soup queueSoup = soup.GetNamedSoup("queue");
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
			soup.SetNamedTag("type", type.name);
		if (grants)
		{
			Soup grantsSoup = Constructors.NewSoup();
			for (i = 0; i < grants.size(); i++)
			{
				if (grants[i])
					grantsSoup.SetNamedTag(i, grants[i].GetGameObjectID().SerialiseToString());
			}
			soup.SetNamedSoup("grants", grantsSoup);
		}
		if (queue)
		{
			Soup queueSoup = Constructors.NewSoup();
			for (i = 0; i < queue.size(); i++)
			{
				if (queue[i])
					queueSoup.AddUniqueNamedSoup(queue[i].GetProperties());
			}
			soup.SetNamedSoup("queue", queueSoup);
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

		string soupName = soup.GetNamedTag("name");
		if (soupName)
			me.name = soupName;
		Soup stateSoup = soup.GetNamedSoup("state");
		if (stateSoup)
		{
			if (!state)
			{
				state = new PermitState();
				state.Init();
			}
			state.SetProperties(stateSoup, types);
		}
	}

	public void SetProperties(Soup soup)
	{ SetProperties(soup, cast<PermitType[]>(null)); }

	public Soup GetProperties()
	{
		Soup soup = Constructors.NewSoup();

		soup.SetNamedTag("name", me.name);
		if (me.state)
			soup.SetNamedSoup("state", me.state.GetProperties());

		return soup;
	}
};

class PermitManagerRule isclass ScenarioBehavior
{
	StringTable stringTable;
	PermitType[] types;
	PermitObject[] objects;

	void SendTypeAndObjectResponseMessage(string minor, GameObject dst, PermitType typeInst, PermitObject objectInst)
	{
		Interface.Print("PermitManagerRule.SendTypeAndObjectResponseMessage> minor: \"" + minor + "\", dst: " + dst.GetDebugName() + ", type: \"" + typeInst.name + "\", object: \"" + objectInst.name + "\"");
		Soup soup = Constructors.NewSoup();
		soup.SetNamedTag("type", typeInst.name);
		soup.SetNamedTag("object", objectInst.name);
		SendMessage(dst, "PermitManager", minor, soup);
	}

	void SendGrantedMessage(GameObject dst, PermitType typeInst, PermitObject objectInst) { SendTypeAndObjectResponseMessage("Granted", dst, typeInst, objectInst); }
	void SendReleasedMessage(GameObject dst, PermitType typeInst, PermitObject objectInst) { SendTypeAndObjectResponseMessage("Released", dst, typeInst, objectInst); }
	void SendRemovedMessage(GameObject dst, PermitType typeInst, PermitObject objectInst) { SendTypeAndObjectResponseMessage("Removed", dst, typeInst, objectInst); }

	void OnAcquireRequest(GameObject src, PermitType typeInst, PermitObject objectInst)
	{
		PermitState stateInst = objectInst.state;
		if (!stateInst.type)
		{
			Interface.Print("PermitManagerRule.OnAcquireRequest> No outstanding permits for PermitObject");
			stateInst.type = typeInst;
			stateInst.grants[stateInst.grants.size()] = src;
			SendGrantedMessage(src, typeInst, objectInst);
		}
		else if (stateInst.type == typeInst and typeInst.isShared and stateInst.queue.size() == 0)
		{
			Interface.Print("PermitManagerRule.OnAcquireRequest> Sharing with current state");
			stateInst.grants[stateInst.grants.size()] = src;
			SendGrantedMessage(src, typeInst, objectInst);
		}
		else
		{
			Interface.Print("PermitManagerRule.OnAcquireRequest> Adding Request to pending queue");
			PermitQueueItem qi = new PermitQueueItem();
			qi.Init(src, typeInst);
			stateInst.queue[stateInst.queue.size()] = qi;
		}
	}

	void OnReleaseRequest(GameObject src, PermitType typeInst, PermitObject objectInst)
	{
		int i;
		PermitState stateInst = objectInst.state;
		if (stateInst.type == typeInst)
		{
			for (i = 0; i < stateInst.grants.size(); i++)
			{
				if (stateInst.grants[i] != src)
					continue;
				Interface.Print("PermitManagerRule.OnReleaseRequest> Releasing previously granted Permit");
				int lastIdx = stateInst.grants.size() - 1;
				if (i < lastIdx)
					stateInst.grants[i] = stateInst.grants[lastIdx]; // Puts the last grant into current grant slot, order does not matter
				stateInst.grants[lastIdx,] = null; // Shrink grants list by 1 element
				SendReleasedMessage(src, typeInst, objectInst);
				return;
			}
		}

		for (i = 0; i < stateInst.queue.size(); i++)
		{
			PermitQueueItem qi = stateInst.queue[i];
			if (qi.type != typeInst or qi.src != src)
				continue;
			Interface.Print("PermitManagerRule.OnReleaseRequest> Removing Pending Permit Request from queue");
			stateInst.queue[i, i + 1] = null; // Remove item from queue
			SendRemovedMessage(src, typeInst, objectInst);
			return;
		}

		Interface.Print("PermitManagerRule.OnReleaseRequest> Could not find Permit Request or Permit Grant: src: " + src.GetDebugName() + ", type: \"" + typeInst.name + "\", object: \"" + objectInst.name + "\"");
		SendReleasedMessage(src, typeInst, objectInst);
	}

	void PostReleaseRequest(PermitObject objectInst)
	{
		PermitState stateInst = objectInst.state;
		if (stateInst.grants.size() != 0)
			return;

		PermitQueueItem qi;
		if (stateInst.queue.size() == 0)
			return;
		qi = stateInst.queue[0];
		stateInst.queue[0, 1] = null;
		stateInst.type = qi.type;
		stateInst.grants[stateInst.grants.size()] = qi.src;
		SendGrantedMessage(qi.src, qi.type, objectInst);

		while (stateInst.type.isShared and stateInst.queue.size() > 0 and stateInst.type == stateInst.queue[0].type)
		{
			qi = stateInst.queue[0];
			stateInst.queue[0, 1] = null;
			stateInst.grants[stateInst.grants.size()] = qi.src;
			SendGrantedMessage(qi.src, stateInst.type, objectInst);
		}
	}

	void OnTypeAndObjectRequestMessage(Message msg)
	{
		int i;
		GameObject src = cast<GameObject>(msg.src);
		if (!src)
		{
			Exception("PermitManagerRule.OnTypeAndObjectRequestMessage> message source is not a GameObject instance");
			return;
		}
		Interface.Print("PermitManagerRule.OnTypeAndObjectRequestMessage> src: " + src.GetDebugName());

		Interface.Print("PermitManagerRule.OnTypeAndObjectRequestMessage> major: \"" + msg.major + "\", minor: \"" + msg.minor + "\"");

		Soup soup = cast<Soup>(msg.paramSoup);
		if (!soup)
		{
			Exception("PermitManagerRule.OnTypeAndObjectRequestMessage> message carries no soup");
			return;
		}

		string typeName = soup.GetNamedTag("type");
		Interface.Print("PermitManagerRule.OnTypeAndObjectRequestMessage> typeName: \"" + typeName + "\"");
		if (!typeName)
		{
			Exception("PermitManagerRule.OnTypeAndObjectRequestMessage> message carries no named PermitType");
			return;
		}
		PermitType typeInst;
		for (i = 0; i < types.size(); i++)
		{
			if (types[i].name != typeName)
				continue;
			typeInst = types[i];
			break;
		}
		if (!typeInst)
		{
			Interface.Print("PermitManagerRule.OnTypeAndObjectRequestMessage> Creating unknown PermitType with name \"" + typeName + "\"");
			typeInst = new PermitType();
			typeInst.Init(typeName);
			types[types.size()] = typeInst;
		}

		string objectName = soup.GetNamedTag("object");
		Interface.Print("PermitManagerRule.OnTypeAndObjectRequestMessage> objectName: \"" + objectName + "\"");
		if (!objectName)
		{
			Exception("PermitManagerRule.OnTypeAndObjectRequestMessage> message carries no named PermitObject");
			return;
		}
		PermitObject objectInst;
		for (i = 0; i < objects.size(); i++)
		{
			if (objects[i].name != objectName)
				continue;
			objectInst = objects[i];
			break;
		}
		if (!objectInst)
		{
			Interface.Print("PermitManagerRule.OnTypeAndObjectRequestMessage> Creating unknown PermitObject with name \"" + objectName + "\"");
			objectInst = new PermitObject();
			objectInst.Init(objectName);
			objects[objects.size()] = objectInst;
		}

		if (msg.minor == "Acquire")
		{
			OnAcquireRequest(src, typeInst, objectInst);
		}
		else if (msg.minor == "Release")
		{
			OnReleaseRequest(src, typeInst, objectInst);
			PostReleaseRequest(objectInst);
		}
		else
		{
			Exception("PermitManagerRule.OnTypeAndObjectRequestMessage> Unrecognized Message Minor string: " + msg.minor);
		}
	}

	thread void MessageLoop()
	{
		int i;
		GameObject src, dst;
		Soup soup;
		Message msg;
		wait()
		{
			on "PermitManager", "Acquire", msg:
			{
				OnTypeAndObjectRequestMessage(msg);
				continue;
			}

			on "PermitManager", "Release", msg:
			{
				OnTypeAndObjectRequestMessage(msg);
				continue;
			}
		}
	}

	public void Init(Asset asset)
	{
		inherited(asset);

		stringTable = asset.GetStringTable();

		SetPropertyHandler(null);

		types = new PermitType[0];
		objects = new PermitObject[0];

		MessageLoop();
	}

	void SetTypeProperties(Soup arraysoup)
	{
		if (!arraysoup)
			return;
		int i, j, cnt;
		cnt = arraysoup.CountTags();
		for (i = 0; i < cnt; i++)
		{
			string tagName = arraysoup.GetIndexedTagName(i);
			if (!tagName)
				continue;
			Soup itemSoup = arraysoup.GetNamedSoup(tagName);
			string itemName = itemSoup.GetNamedTag("name");
			if (!itemName)
				continue;
			bool match = false;
			for (j = 0; j < types.size(); j++)
			{
				if (types[j].name != itemName)
					continue;
				match = true;
				types[j].SetProperties(itemSoup);
				break;
			}
			if (!match)
			{
				PermitType newItem = new PermitType();
				newItem.Init(itemName);
				newItem.SetProperties(itemSoup);
				types[types.size()] = newItem;
			}
		}
	}

	void SetObjectProperties(Soup arraysoup)
	{
		if (!arraysoup)
			return;
		int i, cnt;
		cnt = arraysoup.CountTags();
		for (i = 0; i < cnt; i++)
		{
			string tagName = arraysoup.GetIndexedTagName(i);
			if (!tagName)
				continue;
			Soup itemSoup = arraysoup.GetNamedSoup(tagName);
			string itemName = itemSoup.GetNamedTag("name");
			if (!itemName)
				continue;
			bool match = false;
			int j;
			for (j = 0; j < objects.size(); j++)
			{
				if (objects[j].name != itemName)
					continue;
				match = true;
				objects[j].SetProperties(itemSoup);
				break;
			}
			if (!match)
			{
				PermitObject newItem = new PermitObject();
				newItem.Init(itemName);
				newItem.SetProperties(itemSoup);
				objects[objects.size()] = newItem;
			}
		}
	}

	public void SetProperties(Soup soup)
	{
		inherited(soup);

		if (!soup)
			return;

		SetTypeProperties(soup.GetNamedSoup("types"));
		SetObjectProperties(soup.GetNamedSoup("objects"));
	}

	Soup GetTypeProperties(void)
	{
		Soup arraysoup = Constructors.NewSoup();
		int i;
		for (i = 0; i < types.size(); i++)
		{
			arraysoup.AddUniqueNamedSoup(types[i].GetProperties());
		}
		return arraysoup;
	}

	Soup GetObjectProperties(void)
	{
		Soup arraysoup = Constructors.NewSoup();
		int i;
		for (i = 0; i < objects.size(); i++)
		{
			arraysoup.AddUniqueNamedSoup(objects[i].GetProperties());
		}
		return arraysoup;
	}

	public Soup GetProperties(void)
	{
		Soup soup = inherited();

		soup.SetNamedSoup("types", GetTypeProperties());
		soup.SetNamedSoup("objects", GetObjectProperties());

		return soup;
	}

	// Here comes boring GUI and interface stuff

	define int PROPERTY_VALUE = 0;
	define int PROPERTY_ID = 1;
	define int PROPERTY_TYPE = 2;
	define int PROPERTY_NAME = 3;
	define int PROPERTY_DESCRIPTION = 4;
	define int PROPERTY_SET_STRING = -1;
	define int PROPERTY_SET_STRING_IDX = -2;
	define int PROPERTY_SET_INT = -3;
	define int PROPERTY_SET_FLOAT = -4;
	define int PROPERTY_LINK = -5;

	define public string PermitManagerAddItemPropertyId = "add";

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

	string OperateAddProperty(string propertyID, string[] remainTokens, int opcode, string value, int idx)
	{
		int i;
		if (!remainTokens or remainTokens.size() < 1)
			return (string)null;
		if (remainTokens[0] == PermitTypePropertyId)
		{
			if (opcode == PROPERTY_ID)
				return PermitManagerAddItemPropertyId + "/" + PermitTypePropertyId;
			else if (opcode == PROPERTY_TYPE)
				return "string";
			else if (opcode == PROPERTY_NAME)
				return stringTable.GetString(PermitTypeAddNameStringTable);
			else if (opcode == PROPERTY_DESCRIPTION)
				return stringTable.GetString(PermitTypeAddDescriptionStringTable);
			else if (opcode == PROPERTY_SET_STRING)
			{
				if (!value)
					return (string)null;
				else if (!types)
					types = new PermitType[0];
				for (i = 0; i < types.size(); i++)
				{
					if (types[i] and types[i].name == value)
						return "PermitType already exists";
				}
				PermitType pt = new PermitType();
				pt.Init(value);
				types[types.size()] = pt;
				return "PermitType with name '"+ value +  "' added.";
			}
			else
				return (string)null;
		}
		else if (remainTokens[0] == PermitObjectPropertyId)
		{
			if (opcode == PROPERTY_ID)
				return PermitManagerAddItemPropertyId + "/" + PermitObjectPropertyId;
			else if (opcode == PROPERTY_TYPE)
				return "string";
			else if (opcode == PROPERTY_NAME)
				return stringTable.GetString(PermitObjectAddNameStringTable);
			else if (opcode == PROPERTY_DESCRIPTION)
				return stringTable.GetString(PermitObjectAddDescriptionStringTable);
			else if (opcode == PROPERTY_SET_STRING)
			{
				if (!value)
					return (string)null;
				else if (!objects)
					objects = new PermitObject[0];
				for (i = 0; i < objects.size(); i++)
				{
					if (objects[i] and objects[i].name == value)
						return "PermitObject already exists";
				}
				PermitObject po = new PermitObject();
				po.Init(value);
				objects[objects.size()] = po;
				return "PermitObject with name '"+ value +  "' added.";
			}
			else
				return (string)null;
		}

		return (string)null;
	}

	string OperateTypeProperty(string propertyID, string[] remainTokens, int opcode, string value, int idx)
	{
		if (!remainTokens or remainTokens.size() < 1)
			return (string)null;
		int i = Str.UnpackInt(remainTokens[0]);
		if (i >= 0 and types and i < types.size() and remainTokens.size() > 1)
		{
			if (remainTokens[1] == PermitTypeRemovePropertyId)
			{
				if (opcode == PROPERTY_ID)
					return PermitTypePropertyId + "/" + i + "/" + PermitTypeRemovePropertyId;
				else if (opcode == PROPERTY_TYPE)
					return "link";
				else if (opcode == PROPERTY_NAME)
					return stringTable.GetString(PermitTypeRemoveNameStringTable);
				else if (opcode == PROPERTY_DESCRIPTION)
					return stringTable.GetString(PermitTypeRemoveDescriptionStringTable);
				else if (opcode == PROPERTY_LINK)
				{
					types[i, i + 1] = null;
					return "PermitType with index '" + i + "' removed.";
				}
				else
					return (string)null;
			}
			else if (remainTokens[1] == PermitTypeNamePropertyId)
			{
				if (opcode == PROPERTY_ID)
					return PermitTypePropertyId + "/" + i + "/" + PermitTypeNamePropertyId;
				else if (opcode == PROPERTY_TYPE)
					return "string";
				else if (opcode == PROPERTY_NAME)
					return stringTable.GetString(PermitTypeNameNameStringTable);
				else if (opcode == PROPERTY_DESCRIPTION)
					return stringTable.GetString(PermitTypeNameDescriptionStringTable);
				else if (opcode == PROPERTY_SET_STRING)
				{
					types[i].name = value;
					if (value)
						return value;
					else
						return "null";
				}
				else
					return (string)null;
			}
			else if (remainTokens[1] == PermitTypeSharedPropertyId)
			{
				if (opcode == PROPERTY_ID)
					return PermitTypePropertyId + "/" + i + "/" + PermitTypeSharedPropertyId;
				else if (opcode == PROPERTY_TYPE)
					return "link";
				else if (opcode == PROPERTY_NAME)
					return stringTable.GetString(PermitTypeSharedNameStringTable);
				else if (opcode == PROPERTY_DESCRIPTION)
					return stringTable.GetString(PermitTypeSharedDescriptionStringTable);
				else if (opcode == PROPERTY_LINK)
				{
					types[i].isShared = !types[i].isShared;
					return (string)(types[i].isShared);
				}
				else
					return (string)null;
			}
		}

		return (string)null;
	}

	string OperateObjectProperty(string propertyID, string[] remainTokens, int opcode, string value, int idx)
	{
		if (!remainTokens or remainTokens.size() < 1)
			return (string)null;
		int i = Str.UnpackInt(remainTokens[0]);
		if (i >= 0 and types and i < types.size() and remainTokens.size() > 1)
		{
			if (remainTokens[1] == PermitObjectRemovePropertyId)
			{
				if (opcode == PROPERTY_ID)
					return PermitObjectPropertyId + "/" + i + "/" + PermitObjectRemovePropertyId;
				else if (opcode == PROPERTY_TYPE)
					return "link";
				else if (opcode == PROPERTY_NAME)
					return stringTable.GetString(PermitObjectNameNameStringTable);
				else if (opcode == PROPERTY_DESCRIPTION)
					return stringTable.GetString(PermitObjectNameDescriptionStringTable);
				else if (opcode == PROPERTY_LINK)
				{
					types[i, i + 1] = null;
					return "PermitObject with index '" + i + "' removed.";
				}
				else
					return (string)null;
			}
			else if (remainTokens[1] == PermitObjectNamePropertyId)
			{
				if (opcode == PROPERTY_ID)
					return PermitObjectPropertyId + "/" + i + "/" + PermitObjectNamePropertyId;
				else if (opcode == PROPERTY_TYPE)
					return "string";
				else if (opcode == PROPERTY_NAME)
					return stringTable.GetString(PermitObjectNameNameStringTable);
				else if (opcode == PROPERTY_DESCRIPTION)
					return stringTable.GetString(PermitObjectNameDescriptionStringTable);
				else if (opcode == PROPERTY_SET_STRING)
				{
					types[i].name = value;
					if (value)
						return value;
					else
						return "null";
				}
				else
					return (string)null;
			}
		}

		return (string)null;
	}

	string OperateProperty(string propertyID, int opcode, string value, int idx)
	{
		if (!propertyID)
			return (string)null;
		string[] tokens = Str.Tokens(propertyID, "/");
		if (tokens.size() > 0)
		{
			if (tokens.size() > 1)
			{
				if (tokens[0] == PermitManagerAddItemPropertyId)
					return OperateAddProperty(propertyID, tokens[1,], opcode, value, idx);
				else if (tokens[0] == PermitTypePropertyId)
					return OperateTypeProperty(propertyID, tokens[1,], opcode, value, idx);
			}
		}

		return (string)null;
	}

	public string GetPropertyName(string propertyID)
	{
		string result = OperateProperty(propertyID, PROPERTY_NAME, null, -1);
		if (result)
			return result;

		return inherited(propertyID);
	}

	public string GetPropertyDescription(string propertyID)
	{
		string result = OperateProperty(propertyID, PROPERTY_DESCRIPTION, null, -1);
		if (result)
			return result;

		return inherited(propertyID);
	}

	public string GetPropertyType(string propertyID)
	{
		string result = OperateProperty(propertyID, PROPERTY_TYPE, null, -1);
		if (result)
			return result;

		return inherited(propertyID);
	}

	public string GetPropertyValue(string propertyID)
	{
		string result = OperateProperty(propertyID, PROPERTY_VALUE, null, -1);
		if (result)
			return result;

		return inherited(propertyID);
	}

	public void SetPropertyValue(string propertyID, string value, int index)
	{
		string result = OperateProperty(propertyID, PROPERTY_SET_STRING_IDX, value, index);
		if (result)
			return;

		inherited(propertyID, value, index);
	}

	public void SetPropertyValue(string propertyID, string value)
	{
		string result = OperateProperty(propertyID, PROPERTY_SET_STRING, value, -1);
		if (result)
			return;

		inherited(propertyID, value);
	}

	public void SetPropertyValue(string propertyID, float value)
	{
		string result = OperateProperty(propertyID, PROPERTY_SET_FLOAT, value, -1);
		if (result)
			return;

		inherited(propertyID, value);
	}

	public void SetPropertyValue(string propertyID, int value)
	{
		string result = OperateProperty(propertyID, PROPERTY_SET_INT, value, -1);
		if (result)
			return;

		inherited(propertyID, value);
	}

	public void LinkPropertyValue(string propertyID)
	{
		string result = OperateProperty(propertyID, PROPERTY_LINK, null, -1);
		if (result)
			return;

		inherited(propertyID);
	}

	public string GetDescriptionHTML(void)
	{
		int i;
		string html = "";
		html = html
			+ HTMLWindow.MakeFontSizeLarge(
				HTMLWindow.MakeBold(GetAsset().GetName())
				)
			+ "<br>"
			+ HTMLWindow.MakeItalic(GetAsset().GetLocalisedDescription())
			;
		string spacer = "";
		for (i = 0; i < 50; i++)
			spacer = spacer + "_";
		spacer = spacer
			+ "<br>"
			;
		html = html + spacer;
		html = html
			+ HTMLWindow.MakeFontSizeMedium(
				HTMLWindow.MakeBold(stringTable.GetString(PermitTypeHeadingStringTable))
				)
			+ "<br>"
			+ HTMLWindow.MakeItalic(stringTable.GetString(PermitTypeDescriptionStringTable))
			+ "<br>"
			;
		string propertyID = PermitManagerAddItemPropertyId + "/" + PermitTypePropertyId;
		html = html
			+ HTMLWindow.MakeLink("live://property/" + propertyID, GetPropertyName(propertyID), GetPropertyDescription(propertyID))
			+ "<br>"
			;
		string tableContent = "";
		for (i = 0; types and i < types.size(); i++)
		{
			string rowContent = "";
			propertyID = PermitTypePropertyId + "/" + i + "/" + PermitTypeNamePropertyId;
			rowContent = rowContent
				+ HTMLWindow.MakeCell(HTMLWindow.MakeLink("live://property/" + propertyID, types[i].name, GetPropertyDescription(propertyID)))
				;
			propertyID = PermitTypePropertyId + "/" + i + "/" + PermitTypeSharedPropertyId;
			rowContent = rowContent
				+ HTMLWindow.MakeCell(HTMLWindow.MakeLink("live://property/" + propertyID, HTMLWindow.CheckBox("", types[i].isShared) + " " + stringTable.GetString(PermitTypeSharedNameStringTable), stringTable.GetString(PermitTypeSharedDescriptionStringTable)))
				;
			propertyID = PermitTypePropertyId + "/" + i + "/" + PermitTypeRemovePropertyId;
			rowContent = rowContent
				+ HTMLWindow.MakeCell(HTMLWindow.MakeLink("live://property/" + propertyID, stringTable.GetString(PermitTypeRemoveNameStringTable), stringTable.GetString(PermitTypeRemoveDescriptionStringTable)))
				;
			tableContent = tableContent
				+ HTMLWindow.MakeRow(rowContent);
		}
		html = html + HTMLWindow.MakeTable(tableContent)
			+ spacer;

		html = html
			+ HTMLWindow.MakeFontSizeMedium(
				HTMLWindow.MakeBold(stringTable.GetString(PermitObjectHeadingStringTable))
				)
			+ "<br>"
			+ HTMLWindow.MakeItalic(stringTable.GetString(PermitObjectDescriptionStringTable))
			+ "<br>"
			;
		propertyID = PermitManagerAddItemPropertyId + "/" + PermitObjectPropertyId;
		html = html
			+ HTMLWindow.MakeLink("live://property/" + propertyID, GetPropertyName(propertyID), GetPropertyDescription(propertyID))
			+ "<br>"
			;
		tableContent = "";
		for (i = 0; objects and i < objects.size(); i++)
		{
			string rowContent = "";
			propertyID = PermitObjectPropertyId + "/" + i + "/" + PermitObjectNamePropertyId;
			rowContent = rowContent
				+ HTMLWindow.MakeCell(HTMLWindow.MakeLink("live://property/" + propertyID, objects[i].name, GetPropertyDescription(propertyID)))
				;
			propertyID = PermitObjectPropertyId + "/" + i + "/" + PermitObjectRemovePropertyId;
			rowContent = rowContent
				+ HTMLWindow.MakeCell(HTMLWindow.MakeLink("live://property/" + propertyID, stringTable.GetString(PermitObjectRemoveNameStringTable), stringTable.GetString(PermitObjectRemoveDescriptionStringTable)))
				;
			tableContent = tableContent
				+ HTMLWindow.MakeRow(rowContent);
		}
		html = html + HTMLWindow.MakeTable(tableContent);

		return html;
	}
};
