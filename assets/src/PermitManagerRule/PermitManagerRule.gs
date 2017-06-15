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

		MessageLoop();
	}

	thread void MessageLoop()
	{
		GameObject src, dst;
		Soup soup;
		Message msg;
		while (true)
		{
			wait()
			{
				on "PermitManager", "Acquire", msg:
				{
					src = cast<GameObject>(msg.src);
					dst = cast<GameObject>(msg.dst);
					soup = cast<Soup>(msg.paramSoup);
				}
				on "PermitManager", "Release", msg:
				{
					src = cast<GameObject>(msg.src);
					dst = cast<GameObject>(msg.dst);
					soup = cast<Soup>(msg.paramSoup);
				}
			}
		}
	}
};
