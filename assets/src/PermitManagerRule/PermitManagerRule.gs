

class CongestionManagerRule isclass ScenarioBehavior
{
	private StringTable stringTable;

	public void Init(Asset asset)
	{
		inherited(asset);

		stringTable = asset.GetStringTable();

		SetPropertyHandler(null);


	}
};
