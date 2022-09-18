//
// BasePortal.gs
//
//  Copyright (C) 2004 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "Industry.gs"


//! A parent class for the portal assets.
//
// This class is a parent class for the portal assets.  It is not part of the API and its 
// implementation is fully visible in the <b \Trainz\scripts\BasePortal.gs> file.  The portal
// source code is also <l astSrcIndPortal provided>.
//
// See Also:
//     \ref astSrcIndPortal "Portal Asset Source", BaseIndustry, GenericIndustry
//
class BasePortal isclass Industry
{
	public void AddProduceTrain(Soup consistDescriptor);
	public Soup PopFirstProduceTrain(void);
	

	//
	// PRIVATE IMPLEMENTATION
	//

	Soup[] m_productionList = new Soup[0];

	
	public void AddProduceTrain(Soup consistDescriptor)
	{
		if (!consistDescriptor)
		{
			Interface.Log("PortalTunnel.AddProduceTrain> null consistDescriptor");
			return;
		}

		int num = m_productionList.size();
		if (num >= 16)
		{
			Interface.Log("PortalTunnel.AddProduceTrain> too many trains in list");
			return;
		}

		m_productionList[num] = consistDescriptor;

	  // send a message to ourselves to emit the train, if we're not already busy
		PostMessage(me, "PortalTunnel", "EmitTrain", 0);
	}


	public Soup PopFirstProduceTrain(void)
	{
		if (!m_productionList.size())
			return null;

		Soup ret = m_productionList[0];
		m_productionList[0, 1] = null;

		return ret;
	}
};