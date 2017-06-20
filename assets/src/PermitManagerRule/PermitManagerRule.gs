include "gs.gs"
include "Soup.gs"
include "Asset.gs"
include "StringTable.gs"
include "ScenarioBehavior.gs"
include "PropertyObject.gs"

include "PermitManagerShared.gs"

class PermitManagerRule isclass ScenarioBehavior
{
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

	StringTable stringTable;
	PermitType[] types;
	PermitObject[] objects;

	string OperateAddProperty(string propertyID, string[] remainTokens, int opcode, string value, int idx)
	{
		int i;
		if (!remainTokens or remainTokens.size() < 1)
			return (string)null;
		if (remainTokens[0] == PermitManagerConst.PermitTypePropertyId)
		{
			if (opcode == PROPERTY_ID)
				return PermitManagerConst.PermitManagerAddItemPropertyId + "/" + PermitManagerConst.PermitTypePropertyId;
			else if (opcode == PROPERTY_TYPE)
				return "string";
			else if (opcode == PROPERTY_NAME)
				return stringTable.GetString(PermitManagerConst.PermitTypeAddNameStringTable);
			else if (opcode == PROPERTY_DESCRIPTION)
				return stringTable.GetString(PermitManagerConst.PermitTypeAddDescriptionStringTable);
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
		else if (remainTokens[0] == PermitManagerConst.PermitObjectPropertyId)
		{
			if (opcode == PROPERTY_ID)
				return PermitManagerConst.PermitManagerAddItemPropertyId + "/" + PermitManagerConst.PermitObjectPropertyId;
			else if (opcode == PROPERTY_TYPE)
				return "string";
			else if (opcode == PROPERTY_NAME)
				return stringTable.GetString(PermitManagerConst.PermitObjectAddNameStringTable);
			else if (opcode == PROPERTY_DESCRIPTION)
				return stringTable.GetString(PermitManagerConst.PermitObjectAddDescriptionStringTable);
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
			if (remainTokens[1] == PermitManagerConst.PermitTypeRemovePropertyId)
			{
				if (opcode == PROPERTY_ID)
					return PermitManagerConst.PermitTypePropertyId + "/" + i + "/" + PermitManagerConst.PermitTypeRemovePropertyId;
				else if (opcode == PROPERTY_TYPE)
					return "link";
				else if (opcode == PROPERTY_NAME)
					return stringTable.GetString(PermitManagerConst.PermitTypeRemoveNameStringTable);
				else if (opcode == PROPERTY_DESCRIPTION)
					return stringTable.GetString(PermitManagerConst.PermitTypeRemoveDescriptionStringTable);
				else if (opcode == PROPERTY_LINK)
				{
					types[i, i + 1] = null;
					return "PermitType with index '" + i + "' removed.";
				}
				else
					return (string)null;
			}
			else if (remainTokens[1] == PermitManagerConst.PermitTypeNamePropertyId)
			{
				if (opcode == PROPERTY_ID)
					return PermitManagerConst.PermitTypePropertyId + "/" + i + "/" + PermitManagerConst.PermitTypeNamePropertyId;
				else if (opcode == PROPERTY_TYPE)
					return "string";
				else if (opcode == PROPERTY_NAME)
					return stringTable.GetString(PermitManagerConst.PermitTypeNameNameStringTable);
				else if (opcode == PROPERTY_DESCRIPTION)
					return stringTable.GetString(PermitManagerConst.PermitTypeNameDescriptionStringTable);
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
			else if (remainTokens[1] == PermitManagerConst.PermitTypeSharedPropertyId)
			{
				if (opcode == PROPERTY_ID)
					return PermitManagerConst.PermitTypePropertyId + "/" + i + "/" + PermitManagerConst.PermitTypeSharedPropertyId;
				else if (opcode == PROPERTY_TYPE)
					return "link";
				else if (opcode == PROPERTY_NAME)
					return stringTable.GetString(PermitManagerConst.PermitTypeSharedNameStringTable);
				else if (opcode == PROPERTY_DESCRIPTION)
					return stringTable.GetString(PermitManagerConst.PermitTypeSharedDescriptionStringTable);
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
			if (remainTokens[1] == PermitManagerConst.PermitObjectRemovePropertyId)
			{
				if (opcode == PROPERTY_ID)
					return PermitManagerConst.PermitObjectPropertyId + "/" + i + "/" + PermitManagerConst.PermitObjectRemovePropertyId;
				else if (opcode == PROPERTY_TYPE)
					return "link";
				else if (opcode == PROPERTY_NAME)
					return stringTable.GetString(PermitManagerConst.PermitObjectNameNameStringTable);
				else if (opcode == PROPERTY_DESCRIPTION)
					return stringTable.GetString(PermitManagerConst.PermitObjectNameDescriptionStringTable);
				else if (opcode == PROPERTY_LINK)
				{
					types[i, i + 1] = null;
					return "PermitObject with index '" + i + "' removed.";
				}
				else
					return (string)null;
			}
			else if (remainTokens[1] == PermitManagerConst.PermitObjectNamePropertyId)
			{
				if (opcode == PROPERTY_ID)
					return PermitManagerConst.PermitObjectPropertyId + "/" + i + "/" + PermitManagerConst.PermitObjectNamePropertyId;
				else if (opcode == PROPERTY_TYPE)
					return "string";
				else if (opcode == PROPERTY_NAME)
					return stringTable.GetString(PermitManagerConst.PermitObjectNameNameStringTable);
				else if (opcode == PROPERTY_DESCRIPTION)
					return stringTable.GetString(PermitManagerConst.PermitObjectNameDescriptionStringTable);
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
				if (tokens[0] == PermitManagerConst.PermitManagerAddItemPropertyId)
					return OperateAddProperty(propertyID, tokens[1,], opcode, value, idx);
				else if (tokens[0] == PermitManagerConst.PermitTypePropertyId)
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

	public void SetProperties(Soup soup)
	{
		inherited(soup);

		if (!soup)
			return;
		types = PermitConverter.GetPermitTypesFromSoup(soup.GetNamedSoup(PermitManagerConst.PermitTypesSoupTag));
		objects = PermitConverter.GetPermitObjectsFromSoup(soup.GetNamedSoup(PermitManagerConst.PermitObjectsSoupTag), types);
	}

	public Soup GetProperties(void)
	{
		Soup soup = inherited();

		if (types)
			soup.SetNamedSoup(PermitManagerConst.PermitTypesSoupTag, PermitConverter.GetSoupFromPermitTypes(types));
		if (objects)
			soup.SetNamedSoup(PermitManagerConst.PermitObjectsSoupTag, PermitConverter.GetSoupFromPermitObjects(objects));

		return soup;
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
				HTMLWindow.MakeBold(stringTable.GetString(PermitManagerConst.PermitTypeHeadingStringTable))
				)
			+ "<br>"
			+ HTMLWindow.MakeItalic(stringTable.GetString(PermitManagerConst.PermitTypeDescriptionStringTable))
			+ "<br>"
			;
		string propertyID = PermitManagerConst.PermitManagerAddItemPropertyId + "/" + PermitManagerConst.PermitTypePropertyId;
		html = html
			+ HTMLWindow.MakeLink("live://property/" + propertyID, GetPropertyName(propertyID), GetPropertyDescription(propertyID))
			+ "<br>"
			;
		string tableContent = "";
		for (i = 0; types and i < types.size(); i++)
		{
			string rowContent = "";
			propertyID = PermitManagerConst.PermitTypePropertyId + "/" + i + "/" + PermitManagerConst.PermitTypeNamePropertyId;
			rowContent = rowContent
				+ HTMLWindow.MakeCell(HTMLWindow.MakeLink("live://property/" + propertyID, types[i].name, GetPropertyDescription(propertyID)))
				;
			propertyID = PermitManagerConst.PermitTypePropertyId + "/" + i + "/" + PermitManagerConst.PermitTypeSharedPropertyId;
			rowContent = rowContent
				+ HTMLWindow.MakeCell(HTMLWindow.MakeLink("live://property/" + propertyID, HTMLWindow.CheckBox("", types[i].isShared) + " " + stringTable.GetString(PermitManagerConst.PermitTypeSharedNameStringTable), stringTable.GetString(PermitManagerConst.PermitTypeSharedDescriptionStringTable)))
				;
			propertyID = PermitManagerConst.PermitTypePropertyId + "/" + i + "/" + PermitManagerConst.PermitTypeRemovePropertyId;
			rowContent = rowContent
				+ HTMLWindow.MakeCell(HTMLWindow.MakeLink("live://property/" + propertyID, stringTable.GetString(PermitManagerConst.PermitTypeRemoveNameStringTable), stringTable.GetString(PermitManagerConst.PermitTypeRemoveDescriptionStringTable)))
				;
			tableContent = tableContent
				+ HTMLWindow.MakeRow(rowContent);
		}
		html = html + HTMLWindow.MakeTable(tableContent)
			+ spacer;

		html = html
			+ HTMLWindow.MakeFontSizeMedium(
				HTMLWindow.MakeBold(stringTable.GetString(PermitManagerConst.PermitObjectHeadingStringTable))
				)
			+ "<br>"
			+ HTMLWindow.MakeItalic(stringTable.GetString(PermitManagerConst.PermitObjectDescriptionStringTable))
			+ "<br>"
			;
		propertyID = PermitManagerConst.PermitManagerAddItemPropertyId + "/" + PermitManagerConst.PermitObjectPropertyId;
		html = html
			+ HTMLWindow.MakeLink("live://property/" + propertyID, GetPropertyName(propertyID), GetPropertyDescription(propertyID))
			+ "<br>"
			;
		tableContent = "";
		for (i = 0; objects and i < objects.size(); i++)
		{
			string rowContent = "";
			propertyID = PermitManagerConst.PermitObjectPropertyId + "/" + i + "/" + PermitManagerConst.PermitObjectNamePropertyId;
			rowContent = rowContent
				+ HTMLWindow.MakeCell(HTMLWindow.MakeLink("live://property/" + propertyID, objects[i].name, GetPropertyDescription(propertyID)))
				;
			propertyID = PermitManagerConst.PermitObjectPropertyId + "/" + i + "/" + PermitManagerConst.PermitObjectRemovePropertyId;
			rowContent = rowContent
				+ HTMLWindow.MakeCell(HTMLWindow.MakeLink("live://property/" + propertyID, stringTable.GetString(PermitManagerConst.PermitObjectRemoveNameStringTable), stringTable.GetString(PermitManagerConst.PermitObjectRemoveDescriptionStringTable)))
				;
			tableContent = tableContent
				+ HTMLWindow.MakeRow(rowContent);
		}
		html = html + HTMLWindow.MakeTable(tableContent);

		return html;
	}

	void SendEnqueuedMessage(GameObject dst, PermitQueueItem qi)
	{
		if (!dst)
			return;
		if (qi)
			SendMessage(dst,
				PermitManagerConst.PermitManagerMessageMajor,
				PermitManagerConst.PermitScheduleCommandOpCodeEnqueued,
				qi.GetProperties()
				);
		else
			SendMessage(dst,
				PermitManagerConst.PermitManagerMessageMajor,
				PermitManagerConst.PermitScheduleCommandOpCodeEnqueued
				);
	}

	void SendGrantedMessage(GameObject dst, PermitType type)
	{
		if (!dst)
			return;
		if (type)
			SendMessage(dst,
				PermitManagerConst.PermitManagerMessageMajor,
				PermitManagerConst.PermitScheduleCommandOpCodeGranted,
				type.GetProperties()
				);
		else
			SendMessage(dst,
				PermitManagerConst.PermitManagerMessageMajor,
				PermitManagerConst.PermitScheduleCommandOpCodeGranted
				);
	}

	void SendReleasedMessage(GameObject dst, PermitQueueItem qi)
	{
		if (!dst)
			return;
		if (qi)
			SendMessage(dst,
				PermitManagerConst.PermitManagerMessageMajor,
				PermitManagerConst.PermitScheduleCommandOpCodeReleased,
				qi.GetProperties()
				);
		else
			SendMessage(dst,
				PermitManagerConst.PermitManagerMessageMajor,
				PermitManagerConst.PermitScheduleCommandOpCodeReleased
				);
	}

	void SendRemovedMessage(GameObject dst, PermitQueueItem qi)
	{
		if (!dst)
			return;
		if (qi)
			SendMessage(dst,
				PermitManagerConst.PermitManagerMessageMajor,
				PermitManagerConst.PermitScheduleCommandOpCodeRemoved,
				qi.GetProperties()
				);
		else
			SendMessage(dst,
				PermitManagerConst.PermitManagerMessageMajor,
				PermitManagerConst.PermitScheduleCommandOpCodeRemoved
				);
	}

	bool EnqueuePermit(PermitObject obj, PermitType type, GameObject go)
	{
		if (!obj)
			return false;
		else if (!obj.state)
		{
			obj.state = new PermitState();
			obj.state.Init();
			return EnqueuePermit(obj, type, go);
		}
		else if (!obj.state.queue)
		{
			obj.state.queue = new PermitQueueItem[0];
			return EnqueuePermit(obj, type, go);
		}

		PermitQueueItem qi = new PermitQueueItem();
		qi.Init(go, type);
		obj.state.queue[obj.state.queue.size()] = qi;
		SendEnqueuedMessage(go, qi);
		return true;
	}

	bool AcquirePermit(PermitObject obj, PermitType type, GameObject go, bool enqueue)
	{
		if (!obj)
			return false;
		else if (!obj.state)
		{
			obj.state = new PermitState();
			obj.state.Init();
			return AcquirePermit(obj, type, go, enqueue);
		}
		else if (!obj.state.grants)
		{
			obj.state.grants = new GameObject[0];
			return AcquirePermit(obj, type, go, enqueue);
		}
		else if (obj.state.type == type)
		{
			if ((obj.state.type and obj.state.type.isShared) or obj.state.grants.size() == 0)
			{
				obj.state.grants[obj.state.grants.size()] = go;
				SendGrantedMessage(go, type);
				return true;
			}
		}

		if (enqueue)
			return EnqueuePermit(obj, type, go);

		return false;
	}

	void ReleasePermit(PermitObject obj, PermitType type, GameObject go)
	{
		int i;
		if (!obj or !obj.state)
			return;
		if (obj.state.type == type)
		{
			if (obj.state.grants)
			{
				GameObject searchGo = go;
				for (i = 0; i < obj.state.grants.size(); i++)
				{
					if (obj.state.grants[i] != searchGo)
						continue;
					else if (i < (obj.state.grants.size() - 1))
						obj.state.grants[i] = obj.state.grants[obj.state.grants.size() - 1];
					obj.state.grants[obj.state.grants.size() - 1,] = null;
					PermitQueueItem qi = new PermitQueueItem();
					qi.Init(searchGo, type);
					SendReleasedMessage(searchGo, qi);
					return;
				}
			}
		}

		if (obj.state.queue)
		{
			for (i = 0; i < obj.state.queue.size(); i++)
			{
				PermitQueueItem qi = obj.state.queue[i];
				if (qi.src != go or qi.type != type)
					continue;
				obj.state.queue[i,i] = null;
				SendRemovedMessage(go, qi);
				return;
			}
		}
	}

	void GrantAfterStateChange(PermitObject obj)
	{
		if (!obj)
			return;
		else if (!obj.state)
		{
			obj.state = new PermitState();
			obj.state.Init();
			GrantAfterStateChange(obj);
			return;
		}
		else if (!obj.state.grants)
		{
			obj.state.grants = new GameObject[0];
			GrantAfterStateChange(obj);
			return;
		}
		else if (obj.state.grants.size() > 0)
			return;
		else if (!obj.state.queue)
		{
			obj.state.queue = new PermitQueueItem[0];
			GrantAfterStateChange(obj);
			return;
		}

		startFirstDequeue:
		if (obj.state.queue.size() < 1)
			return;

		PermitQueueItem qi = obj.state.queue[0];
		obj.state.queue = obj.state.queue[1,];
		if (!qi)
			goto startFirstDequeue;
		obj.state.type = qi.type;
		obj.state.grants[obj.state.grants.size()] = qi.src;
		SendGrantedMessage(qi.src, qi.type);
		if (!obj.state.type or !obj.state.type.isShared)
			return;
		while (true)
		{
			if (obj.state.queue.size() < 1)
				return;
			qi = obj.state.queue[0];
			if (!qi)
			{
				obj.state.queue = obj.state.queue[1,];
				continue;
			}

			if (qi.type != obj.state.type or !qi.type.isShared)
				return;
			obj.state.queue = obj.state.queue[1,];
			obj.state.grants[obj.state.grants.size()] = qi.src;
			SendGrantedMessage(qi.src, qi.type);
		}
	}

	void ProcessOperation(string opcode, PermitObject obj, PermitType type, GameObject src)
	{
		GrantAfterStateChange(obj);

		if (opcode == PermitManagerConst.PermitScheduleCommandOpCodeAcquire)
		{
			bool acquireResult = AcquirePermit(obj, type, src, true);
		}
		else if (opcode == PermitManagerConst.PermitScheduleCommandOpCodeRelease)
		{
			ReleasePermit(obj, type, src);
		}

		GrantAfterStateChange(obj);
	}

	void HandleMessage(Message msg)
	{
		int i;
		GameObject src, dst;
		Soup soup;
		string opcode;

		opcode = msg.minor;
		src = cast<GameObject>(msg.src);
		dst = cast<GameObject>(msg.dst);
		soup = cast<Soup>(msg.paramSoup);
		if (!soup)
			return;
		string typeName = soup.GetNamedTag(PermitManagerConst.PermitTypeSoupTag);
		PermitType type;
		if (types)
		{
			for (i = 0; i < types.size(); i++)
			{
				if (typeName == types[i].name)
				{
					type = types[i];
					break;
				}
			}
		}
		string objName = soup.GetNamedTag(PermitManagerConst.PermitObjectSoupTag);
		PermitObject obj;
		if (objects)
		{
			for (i = 0; i < objects.size(); i++)
			{
				if (objName == objects[i].name)
				{
					obj = objects[i];
					break;
				}
			}
		}
	}

	thread void MessageLoop()
	{
		int i;
		GameObject src, dst;
		Soup soup;
		Message msg;
		while (true)
		{
			wait()
			{
				on "PermitManager", "", msg:
				{ HandleMessage(msg); }
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
};
