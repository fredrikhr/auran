//
// IPICQueue.gs
//
//  Copyright (C) 2004 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "IPICProcess.gs"
include "IPICQueue.gs"
include "IndustryProductInfoComplete.gs"
include "IndustryProductInfoQueues.gs"


//! Information class that describes a product queue and its waybill requirements.
//
// This class defines a queue in an industry where a product transfer can take place.  It is mainly
// used by the IndustryProductInfoCollection class.
//
// Useful interface methods of this class are:
//  - public void                           <b Init>              (IndustryProductInfoCollection ipic, ProductQueue queue)
//  - public int                            <b GetSize>           ()
//  - public void                           <b SetSize>           (int asize)
//  - public int                            <b GetWaybillRemain>  ()
//  - public void                           <b SetWaybillRemain>  (int waybillRemain)
//  - public int                            <b GetWaybillIssuePercent>  ()
//  - public void                           <b SetWaybillIssuePercent>  (int issuePercent)
//  - public IndustryProductInfoQueues[]    <b GetRelatedProducts>      ()
//  - public IndustryProductInfoCollection  <b GetIndustryProductInfoCollection>  ()
//
// Note:
//     This class is not a part of the core %Trainz API and isn't fully documented.  The full class definition
//     and implementation however can be found in the <b \Trainz\scripts\IPICQueue.gs> script file.
//
// See Also:
//     IndustryProductInfoCollection, IndustryProductInfoQueues, IPICProcess, IPICTrack,
//     IndustryProductInfoComplete, MapObject::GetQueues()
//
class IPICQueue
{
  public void Init(IndustryProductInfoCollection ipic, ProductQueue queue);


  public IndustryProductInfoQueues[] GetRelatedProducts(void);
  //public IndustryProductInfoProcess[] GetRelatedProcesses(void);

  public void SetSize(int asize);
  public int GetSize(void);
  // todo: categories

  public int GetWaybillRemain(void);
  public void SetWaybillRemain(int waybillRemain);

  public int GetWaybillIssuePercent(void);
  public void SetWaybillIssuePercent(int issuePercent);

  //
  public ProductQueue GetProductQueue(void);

  public IndustryProductInfoCollection GetIndustryProductInfoCollection(void);

  //
  // IMPLEMENTATION
  //
  int m_size;
	int m_waybillRemain;
	int m_waybillIssuePercent;
  ProductQueue m_productQueue;
  IndustryProductInfoCollection m_ipic;

  
  public IndustryProductInfoQueues[] GetRelatedProducts(void)
  {
    IndustryProductInfoQueues[] ret = new IndustryProductInfoQueues[0];
    
    int i;
    for (i = 0; i < m_ipic.ipicCollection.size(); i++)
    {
      IndustryProductInfoComplete product = m_ipic.ipicCollection[i];

      int j;
      for (j = 0; j < product.queues.size(); j++)
      {
        IndustryProductInfoQueues processRelation = product.queues[j];
        if (processRelation.GetIPICQueue() == me)
          ret[ret.size()] = processRelation;
      }
    }

    return ret;
  }

  /*public IndustryProductInfoProcess[] GetRelatedProcesses(void)
  {
  }*/

  
  public void Init(IndustryProductInfoCollection ipic, ProductQueue queue)
  {
    m_ipic = ipic;
    m_productQueue = queue;
    
    if (!ipic.IsInInitFromAsset())
      Interface.Exception("IPICQueue.Init> don't call this yourself");

		if (!m_productQueue)
			Interface.Exception("IPICQueue.Init> null queue");
  }

  public void SetSize(int asize)
  {
	  if (m_productQueue)
    {
      m_productQueue.SetQueueSize(asize);
      m_size = asize;
    }

  }

  public int GetSize(void)
  {
    return m_size;
  }

  public int GetWaybillRemain(void)
  {
    return m_waybillRemain;
  }

  public void SetWaybillRemain(int waybillRemain)
  {
    m_waybillRemain = waybillRemain;
    if (m_waybillRemain < 0)
      m_waybillRemain = 0;

    //Interface.Log("IPICQueue>> SetWaybillRemain-> Setting m_waybillRemain to " + m_waybillRemain);
  }

  public int GetWaybillIssuePercent(void)
  {
    return m_waybillIssuePercent;
  }

  public void SetWaybillIssuePercent(int issuePercent)
  {
    m_waybillIssuePercent = issuePercent;
  }

  //
  public ProductQueue GetProductQueue(void)
  {
    return m_productQueue;
  }

  public IndustryProductInfoCollection GetIndustryProductInfoCollection(void)
  {
    
    //Log.DetailLogStart("GetIndustryProductInfoCollection", "IPICProcess");

    //if (!m_ipic)
    //  Log.DetailLog("// WARNING: m_ipic is NULL!");

    //Log.DetailLogEnd();

    return m_ipic;
  }
};