//
// IndustryProductInfoComplete.gs
//
//  Copyright (C) 2004 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "IPICProcess.gs"
include "IPICQueue.gs"
include "IndustryProductInfoQueues.gs"
include "IndustryProductInfoTracks.gs"
include "IndustryProductInfoProcess.gs"


//! Information class that defines a product transfer in a BaseIndustry or Vehicle.
//
// This class is used by IndustryProductInfoCollection to define a single product transfer.  This transfer
// is defined using the following bits of information:
//  - Product being transferred
//  - Type of vehicle the transfer happens with
//  - Quantity of products per vehicle
//  - %Industry queues involved with the transfer
//  - %Industry tracks where it happens
//  - %Industry processes affected by the transfer
//
// Useful interface methods of this class are:
//  - public void                       <b Init>            (IndustryProductInfoCollection ipic)
//  - public Asset                      <b GetProduct>      ()
//  - public void                       <b SetProduct>      (Asset product)
//  - public KUID                       <b GetVehicleKUID>  ()
//  - public void                       <b SetVehicleKUID>  (KUID kuid)
//  - public int                        <b GetDisplayType>  ()
//  - public void                       <b SetDisplayType>  (int type)
//  - public int                        <b GetPerVehicleAmount>  ()
//  - public void                       <b SetPerVehicleAmount>  (int amount)
//  - public void                       <b AddProductTrack>      (string trackName, string mode, ProductQueue queue)
//  - public IPICQueue                  <b GetIPICQueueByIndex>     (int index)
//  - public IndustryProductInfoQueues  <b GetRelationshipToQueue>  (IPICQueue queue);
//  - public void                       <b RemoveQueue>             (IPICQueue queue)
//
// Note:
//     This class is not a part of the core %Trainz API and isn't fully documented.  The full class definition
//     and implementation however can be found in the <b \Trainz\scripts\IndustryProductInfoComplete.gs> 
//     script file.
//
// See Also:
//     IndustryProductInfoCollection, IndustryProductInfoProcess, IndustryProductInfoTracks,
//     IndustryProductInfoQueues, IPICTrack, IPICProcess, IPICQueue, BaseIndustryInfo, ProductQueue
//
class IndustryProductInfoComplete
{
  public void Init(IndustryProductInfoCollection ipic);
  public void RemoveQueue(IPICQueue queue);
  public IndustryProductInfoQueues GetRelationshipToQueue(IPICQueue queue);

  IndustryProductInfoCollection m_ipic;

	public IndustryProductInfoProcess[] processes;  //!< Industry processes.
	public IndustryProductInfoTracks[] tracks;      //!< Industry tracks.
	public IndustryProductInfoQueues[] queues;      //!< Industry queues involved in this transfer.

	public define int DISPLAY_TYPE_MASS = 0;
	public define int DISPLAY_TYPE_VOLUME = 1;
	public define int DISPLAY_TYPE_COUNT = 2;

  public Asset GetProduct(void);
  public void SetProduct(Asset product);

  public KUID GetVehicleKUID(void);
  public void SetVehicleKUID(KUID kuid);

  public int GetPerVehicleAmount(void);
  public void SetPerVehicleAmount(int amount);
  
  public int GetDisplayType(void);
  public void SetDisplayType(int type);
  
  //
  // PRIVATES: These should have accessors above.
  //
	Asset m_product;
	KUID m_vehicleKUID;
	int m_perVehicleAmount = 1;
	int m_displayType = DISPLAY_TYPE_MASS;
  //public bool showInViewDetails = true;

	public bool uiIsExpanded;

	public void AddProductTrack(string trackName, string mode, ProductQueue queue)
	{
    // Exists?
    int i = 0;
    int existingIndex = -1;
    for (i = 0; i < tracks.size(); i++)
    {
      if (tracks[i].GetTrackName() == trackName)
      {
        // FOund existing
        existingIndex = i;
        break;
      }
    }

		IndustryProductInfoTracks newTrack;

    if (existingIndex == -1)
    {
      newTrack = new IndustryProductInfoTracks();
      IPICTrack ipicTrack = m_ipic.FindIPICTrack(trackName);
      newTrack.Init(me, ipicTrack);
    }
    else
      newTrack = tracks[existingIndex];

		newTrack.mode = mode;
		if (m_ipic)
      newTrack.SetIPICQueue(m_ipic.FindIPICQueue(queue));

    if (existingIndex == -1)
  		tracks[tracks.size()] = newTrack;
	}

  public void Init(IndustryProductInfoCollection ipic)
  {
    m_ipic = ipic;
    
    processes = new IndustryProductInfoProcess[0];
		tracks = new IndustryProductInfoTracks[0];
		queues = new IndustryProductInfoQueues[0];
  }

  public IPICQueue GetIPICQueueByIndex(int index)
  {
    if (index == -1)
      return null;

    return queues[index].GetIPICQueue();
  }

  public int GetIndexByIPICQueue(IPICQueue queue)
  {
    if (queue == null)
      return -1;

    int i;
    for (i = 0; i < queues.size(); i++)
    {
      if (queues[i].GetIPICQueue() == queue)
        return i;
    }

    Interface.Log("WARNING: GetIndexByIPICQueue with queue " + queue.GetProductQueue().GetQueueName() + " could not be found!");
    return -1;
  }


  public void RemoveQueue(IPICQueue queue)
  {
    int i;

    // make sure no tracks are using this queue
    for (i = 0; i < tracks.size(); i++)
      if (tracks[i].GetIPICQueue() == queue)
        tracks[i].SetIPICQueue(null);
    
    // make sure that no processes are using this queue
    for (i = processes.size()-1; i >= 0; i--)
    {
      if (processes[i].GetInputQueue() == queue)
        processes[i].SetInputQueue(null);
      
      if (processes[i].GetOutputQueue() == queue)
        processes[i].SetOutputQueue(null);
      
      if (!processes[i].DoesAnything())
        processes[i, i+1] = null;
    }
    
    // remove the queue
    for (i = queues.size()-1; i >= 0; i--)
      if (queues[i].GetIPICQueue() == queue)
        queues[i, i+1] = null;
  }
  
  
  public IndustryProductInfoQueues GetRelationshipToQueue(IPICQueue queue)
  {
    if (!queue)
      return null;

    int i;
    for (i = 0; i < queues.size(); i++)
      if (queues[i].GetIPICQueue() == queue)
        return queues[i];
    
    
    Interface.Log("IndustryProductInfoComplete.GetRelationshipToQueue> queue is not related to this product");
    return null;
  }

  public Asset GetProduct(void)
  {
    return m_product;
  }

  public void SetProduct(Asset product)
  {
    m_product = product;
  }

  public KUID GetVehicleKUID(void)
  {
    return m_vehicleKUID;
  }

  public void SetVehicleKUID(KUID kuid)
  {
    m_vehicleKUID = kuid;
  }

  public int GetPerVehicleAmount(void)
  {
    return m_perVehicleAmount;
  }

  public void SetPerVehicleAmount(int amount)
  {
    m_perVehicleAmount = amount;
  }

  public int GetDisplayType(void)
  {
    return m_displayType;
  }

  public void SetDisplayType(int type)
  {
    m_displayType = type;
  }

};

