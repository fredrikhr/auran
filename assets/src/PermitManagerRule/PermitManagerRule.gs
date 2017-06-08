include "gs.gs"
include "Asset.gs"
include "StringTable.gs"
include "ScenarioBehavior.gs"
include "PropertyObject.gs"

class PermitManagerRule isclass ScenarioBehavior
{
	private StringTable stringTable;

	public void Init(Asset asset)
	{
		inherited(asset);

		stringTable = asset.GetStringTable();

		SetPropertyHandler(null);


	}

	thread void MessageLoop()
	{

	}
};
