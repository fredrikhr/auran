//
// IndustryProductInfoQueues.gs
//
//  Copyright (C) 2004 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "IPICProcess.gs"
include "IPICQueue.gs"
include "IndustryProductInfoComplete.gs"


//! Information class that describes a product queue and its waybill requirements.
//
// This class defines a queue in an industry where a product transfer can take place.  It is mainly
// used by the IndustryProductInfoComplete class.
//
// Useful interface methods of this class are:
//  - public void                         <b Init>              (IndustryProductInfoComplete product, IPICQueue queue)
//  - public IPICQueue                    <b GetIPICQueue>      ()
//  - public ProductQueue                 <b GetProductQueue>   ()
//  - public IndustryProductInfoComplete  <b GetIPICProduct>    ()
//  - public int                          <b GetInitialAmount>  ()
//  - public void                         <b SetInitialAmount>  (int amount)
//  - public int                          <b GetQueueSize>      ()
//  - public void                         <b SetQueueSize>      (int amount)
//  - public int                          <b GetQueueWaybillRemain>        ()
//  - public void                         <b SetQueueWaybillRemain>        (int waybillRemain)
//  - public int                          <b GetQueueWaybillIssuePercent>  ()
//  - public void                         <b SetQueueWaybillIssuePercent>  (int issuePercent)
//  - public void                         <b ResetAssetToInitialAmount>    ()
//
// Note:
//     This class is not a part of the core %Trainz API and isn't fully documented.  The full class definition
//     and implementation however can be found in the <b \Trainz\scripts\IndustryProductInfoQueues.gs> script file.
//
// See Also:
//     IndustryProductInfoComplete, IndustryProductInfoProcess, IndustryProductInfoTracks, IPICQueue, 
//     IndustryProductInfoCollection, MapObject::GetQueues()
//
class IndustryProductInfoQueues
{
  public void Init(IndustryProductInfoComplete product, IPICQueue queue);

  public IPICQueue GetIPICQueue(void);
  public ProductQueue GetProductQueue(void);
  public IndustryProductInfoComplete GetIPICProduct(void);

  public void SetInitialAmount(int amount);
  public int GetInitialAmount();
	public void ResetAssetToInitialAmount(void);

  public void SetQueueSize(int amount);
  public int GetQueueSize();

  public int GetQueueWaybillRemain(void);
  public void SetQueueWaybillRemain(int waybillRemain);

  public int GetQueueWaybillIssuePercent(void);
  public void SetQueueWaybillIssuePercent(int issuePercent);


	//public ProductQueue queue;          NOW IN IPICQueue
	//public int queueSize;               NOW IN IPICQueue
	//public int waybillRemain;           NOW IN IPICQueue
	//public int waybillIssuePercent;     NOW IN IPICQueue

	public bool uiIsExpanded;

  //
  // PRIVATES: These should have accessors above.
  //
	int initialAmount;


  //
  // IMPLEMENTATION
  //
  IndustryProductInfoComplete m_product;
  IPICQueue m_queue;

  
  public void Init(IndustryProductInfoComplete product, IPICQueue queue)
  {
    m_product = product;
    m_queue = queue;
	
		if (!m_product)
			Interface.Exception("IndustryProductInfoQueues.Init> null product");
		if (!queue)
			Interface.Exception("IndustryProductInfoQueues.Init> null queue");
  }

  public IPICQueue GetIPICQueue(void)
  {
    return m_queue;
  }

  public ProductQueue GetProductQueue(void)
  {
    if (m_queue)
      return m_queue.GetProductQueue();
    
    return null;
  }

  public IndustryProductInfoComplete GetIPICProduct(void)
  {
    return m_product;
  }

  public void SetInitialAmount(int amount)
  {
    //Log.DetailLogStart("SetInitialAmount", "IndustryProductInfoQueues");
    //Log.DetailLog("amount", amount);
    
    if (m_queue)
    {
      initialAmount = amount;
			
			//if (World.GetCurrentModule() == World.SURVEYOR_MODULE)
				ResetAssetToInitialAmount();
    }
    //else
    //  Log.DetailLog("// WARNING: Queue was invalid, SetQueueInitialCount not called");

    //Log.DetailLogEnd();
  }

		// set it on the actual queue.
	public void ResetAssetToInitialAmount(void)
	{
		IndustryProductInfoCollection ipic = m_queue.GetIndustryProductInfoCollection();
		BaseIndustry genIndustry = ipic.GetIndustry();
		Vehicle vehicle = ipic.GetVehicle();

		if (genIndustry)
			genIndustry.SetQueueInitialCount(m_queue.GetProductQueue(), m_product.GetProduct(), initialAmount);
		if (vehicle)
			vehicle.SetQueueInitialCount(m_queue.GetProductQueue(), m_product.GetProduct(), initialAmount);
	}

  public int GetInitialAmount()
  {
		if (m_queue  and  m_product)
		{
      ProductFilter filter = Constructors.NewProductFilter();
      filter.AddProduct(m_product.GetProduct());
			initialAmount = m_queue.GetProductQueue().CountProductMatching(filter);
		}
    //Log.DetailLogStart("GetInitialAmount", "IndustryProductInfoQueues");
    
    //Log.DetailLog("initialAmount", initialAmount);

    //Log.DetailLogEnd();

    return initialAmount;
    
  }

  public void SetQueueSize(int amount)
  {
    if (initialAmount > amount)
      SetInitialAmount(amount);
    m_queue.SetSize(amount);
  }

  public int GetQueueSize()
  {
    return m_queue.GetSize();
  }

  public int GetQueueWaybillRemain(void)
  {
    return m_queue.GetWaybillRemain();
  }

  public void SetQueueWaybillRemain(int waybillRemain)
  {
    m_queue.SetWaybillRemain(waybillRemain);
  }

  public int GetQueueWaybillIssuePercent(void)
  {
    return m_queue.GetWaybillIssuePercent();
  }

  public void SetQueueWaybillIssuePercent(int issuePercent)
  {
    m_queue.SetWaybillIssuePercent(issuePercent);
  }

};