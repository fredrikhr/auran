include "gs.gs"
include "Asset.gs"
include "StringTable.gs"
include "DriverCharacter.gs"
include "Menu.gs"
include "DriverCommand.gs"
include "DriverScheduleCommand.gs"

include "PermitManagerShared.gs"
include "PermitScheduleCommand.gs"

class PermitCommandMenuItemTuple
{
	public ScenarioBehavior permitManager;
	public PermitType permitType;
	public PermitObject permitObject;
};

class PermitCommand isclass DriverCommand
{
	StringTable stringTable;
	define string acquireMenuItemMajor = "PermitObjectAcquireMenuItem";
	define string releaseMenuItemMajor = "PermitObjectReleaseMenuItem";

	public void Init(Asset asset)
	{
		inherited(asset);

		stringTable = asset.GetStringTable();

		AddHandler(me, acquireMenuItemMajor, null, "OnPermitObjectAcquireMenuItemClicked");
		AddHandler(me, releaseMenuItemMajor, null, "OnPermitObjectReleaseMenuItemClicked");
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

	string PackPermitCommandMenuItemTuple(ScenarioBehavior permitManager, PermitType permitType, PermitObject permitObject)
	{
		string packed;
		packed = cast<string>(permitManager.GetId());
		packed = packed + "/";
		string permitTypeName = permitType.name;
		packed = packed + cast<string>(permitTypeName.size()) + "/";
		packed = packed + permitTypeName + "/";
		string permitObjName = permitObject.name;
		packed = packed + cast<string>(permitObjName.size()) + "/";
		packed = packed + permitObjName;
		return packed;
	}

	string PackPermitCommandMenuItemTuple(PermitCommandMenuItemTuple tuple)
	{
		if (!tuple)
			return cast<string>(null);
		return PackPermitCommandMenuItemTuple(tuple.permitManager, tuple.permitType, tuple.permitObject);
	}

	PermitCommandMenuItemTuple UnPackPermitCommandMenuItemTuple(string packedTuple)
	{
		if (!packedTuple)
			return null;

		int slashIdx = Str.Find(packedTuple, "/", 0);
		if (slashIdx < 0)
			return null;
		int managerId = Str.ToInt(packedTuple[,slashIdx]);
		int startIdx = slashIdx + 1;
		slashIdx = Str.Find(packedTuple, "/", startIdx);
		if (slashIdx < 0)
			return null;
		int typeNameLength = Str.ToInt(packedTuple[startIdx, slashIdx]);
		startIdx = slashIdx + 1;
		string typeName = packedTuple[startIdx, startIdx + typeNameLength];
		startIdx = startIdx + typeNameLength + 1;
		slashIdx = Str.Find(packedTuple, "/", startIdx);
		if (slashIdx < 0)
			return null;
		startIdx = slashIdx + 1;
		slashIdx = Str.Find(packedTuple, "/", startIdx);
		int objNameLength = Str.ToInt(packedTuple[startIdx, slashIdx]);
		startIdx = slashIdx + 1;
		string objName = packedTuple[startIdx, startIdx + objNameLength];

		PermitCommandMenuItemTuple tuple = new PermitCommandMenuItemTuple();
		tuple.permitManager = cast<ScenarioBehavior>(Router.GetGameObject(managerId));
		tuple.permitType = PermitConverter.GetPermitTypeByName(tuple.permitManager, typeName);
		tuple.permitObject = PermitConverter.GetPermitObjectByName(tuple.permitManager, objName);
		return tuple;
	}

	void OnPermitObjectMenutItemClicked(Message msg, string opcode)
	{
		DriverCommands commands = GetDriverCommands(msg);
		DriverCharacter driver = cast<DriverCharacter>(msg.src);

		PermitCommandMenuItemTuple tuple = UnPackPermitCommandMenuItemTuple(msg.minor);
		if (!tuple)
			return;

		Soup soup = Constructors.NewSoup();
		soup.SetNamedTag(PermitManagerConst.PermitScheduleCommandOpCodeSoupTag, opcode);
		if (tuple.permitManager)
			soup.SetNamedTag(PermitManagerConst.PermitManagerRuleSoupTag, tuple.permitManager.GetGameObjectID().SerialiseToString());
		if (tuple.permitType)
			soup.SetNamedSoup(PermitManagerConst.PermitTypeSoupTag, tuple.permitType.GetProperties());
		if (tuple.permitObject)
			soup.SetNamedSoup(PermitManagerConst.PermitObjectSoupTag, tuple.permitObject.GetProperties());

		DriverScheduleCommand cmd = CreateScheduleCommand(driver, soup);
		commands.AddDriverScheduleCommand(cmd);
	}

	void OnPermitObjectAcquireMenuItemClicked(Message msg)
	{
		OnPermitObjectMenutItemClicked(msg, PermitManagerConst.PermitScheduleCommandOpCodeAcquire);
	}

	void OnPermitObjectReleaseMenuItemClicked(Message msg)
	{
		OnPermitObjectMenutItemClicked(msg, PermitManagerConst.PermitScheduleCommandOpCodeRelease);
	}

	void AddSubmenuHierarchies(Menu rootMenu, ScenarioBehavior permitManager, PermitType[] permitTypes, PermitObject[] permitObjects, string msgMajor)
	{
		int i, j;
		for (i = 0; i < permitTypes.size(); i++)
		{
			PermitType permitType = permitTypes[i];
			Menu permitTypeSubMenu = Constructors.NewMenu();
			for (j = 0; j < permitObjects.size(); j++)
			{
				PermitObject permitObject = permitObjects[j];
				string msgMinor = PackPermitCommandMenuItemTuple(permitManager, permitType, permitObject);
				permitTypeSubMenu.AddItem(permitObject.name, me, msgMajor, msgMinor);
			}
			permitTypeSubMenu.SubdivideItems(true);
			rootMenu.AddSubmenu(permitType.name, permitTypeSubMenu);
		}
		rootMenu.SubdivideItems(true);
	}

	public void AddCommandMenuItem(DriverCharacter driver, Menu menu)
	{
		ScenarioBehavior[] rules = getPermitManagerInstances();
		if (!rules or rules.size() < 1)
			return;

		Menu acquireSubMenu = Constructors.NewMenu();
		Menu releaseSubMenu = Constructors.NewMenu();

		int i;
		for (i = 0; i < rules.size(); i++)
		{
			Soup ruleProps = rules[i].GetProperties();
			if (!ruleProps)
				continue;
			Soup objsSoup = ruleProps.GetNamedSoup(PermitManagerConst.PermitObjectsSoupTag);
			Soup typsSoup = ruleProps.GetNamedSoup(PermitManagerConst.PermitTypesSoupTag);
			PermitObject[] permitObjects = PermitConverter.GetPermitObjectsFromSoup(objsSoup);
			PermitType[] permitTypes = PermitConverter.GetPermitTypesFromSoup(typsSoup);

			if (permitObjects and permitObjects.size() > 0 and permitTypes and permitTypes.size() > 0)
			{
				if (acquireSubMenu.CountItems() > 0)
					acquireSubMenu.AddSeperator();
				AddSubmenuHierarchies(acquireSubMenu, rules[i], permitTypes, permitObjects, acquireMenuItemMajor);
				if (releaseSubMenu.CountItems() > 0)
					releaseSubMenu.AddSeperator();
				AddSubmenuHierarchies(releaseSubMenu, rules[i], permitTypes, permitObjects, releaseMenuItemMajor);
			}
		}

		if (acquireSubMenu.CountItems() > 0)
			menu.AddSubmenu(stringTable.GetString(PermitManagerConst.PermitManagerAcquireCommandMenuItemEntry), acquireSubMenu);
		if (releaseSubMenu.CountItems() > 0)
			menu.AddSubmenu(stringTable.GetString(PermitManagerConst.PermitManagerReleaseCommandMenuItemEntry), releaseSubMenu);
	}

	public DriverScheduleCommand CreateScheduleCommand(DriverCharacter driver, Soup soup)
	{
		DriverScheduleCommand cmd = new PermitScheduleCommand();
		cmd.Init(driver, me);
		cmd.SetProperties(soup);

		return cmd;
	}
};
