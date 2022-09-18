//=============================================================================
// File: IndustryProductInfoComplete.gs
// Desc: 
//=============================================================================
include "IPICProcess.gs"
include "IPICQueue.gs"
include "IndustryProductInfoQueues.gs"
include "IndustryProductInfoTracks.gs"
include "IndustryProductInfoProcess.gs"



//=============================================================================
// Name: IndustryProductInfoComplete
// Desc: This class is used by IndustryProductInfoCollection to define a single
//       product transfer. The transfer is defined by the following data:
//        - Product being transferred
//        - Type of vehicle the transfer happens with
//        - Quantity of products per vehicle
//        - Industry queues involved with the transfer
//        - Industry tracks where it happens
//        - Industry processes affected by the transfer
//=============================================================================
class IndustryProductInfoComplete
{
  public define int DISPLAY_TYPE_MASS = 0;
  public define int DISPLAY_TYPE_VOLUME = 1;
  public define int DISPLAY_TYPE_COUNT = 2;

  public IndustryProductInfoProcess[] processes;  // Industry processes.
  public IndustryProductInfoTracks[]  tracks;     // Industry tracks.
  public IndustryProductInfoQueues[]  queues;     // Industry queues involved in this transfer.
  public bool                         uiIsExpanded;


  IndustryProductInfoCollection m_ipic;
  Asset       m_product;
  KUID        m_vehicleKUID;
  int         m_perVehicleAmount = 1;
  int         m_displayType = DISPLAY_TYPE_MASS;


  //=============================================================================
  // Forward declarations.

  public void Init(IndustryProductInfoCollection ipic);

  public void AddProductTrack(string trackName, string mode, ProductQueue queue);

  public IPICQueue GetIPICQueueByIndex(int index);
  public int GetIndexByIPICQueue(IPICQueue queue);
  public void RemoveQueue(IPICQueue queue);
  public IndustryProductInfoQueues GetRelationshipToQueue(IPICQueue queue);

  public Asset GetProduct(void);
  public void SetProduct(Asset product);

  public KUID GetVehicleKUID(void);
  public void SetVehicleKUID(KUID kuid);

  public int GetPerVehicleAmount(void);
  public void SetPerVehicleAmount(int amount);

  public int GetDisplayType(void);
  public void SetDisplayType(int type);



  //=============================================================================
  // Name: Init
  // Desc: 
  //=============================================================================
  public void Init(IndustryProductInfoCollection ipic)
  {
    m_ipic = ipic;

    processes = new IndustryProductInfoProcess[0];
    tracks = new IndustryProductInfoTracks[0];
    queues = new IndustryProductInfoQueues[0];
  }


  //=============================================================================
  // Name: AddProductTrack
  // Desc: 
  //=============================================================================
  public void AddProductTrack(string trackName, string mode, ProductQueue queue)
  {
    // Check if it already exists.
    int existingIndex = -1;
    int i = 0;
    for (i = 0; i < tracks.size(); ++i)
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
    {
      newTrack = tracks[existingIndex];
    }

    newTrack.mode = mode;
    if (m_ipic)
      newTrack.SetIPICQueue(m_ipic.FindIPICQueue(queue));

    if (existingIndex == -1)
      tracks[tracks.size()] = newTrack;
  }


  //=============================================================================
  // Name: GetIPICQueueByIndex
  // Desc: 
  //=============================================================================
  public IPICQueue GetIPICQueueByIndex(int index)
  {
    if (index == -1)
      return null;

    return queues[index].GetIPICQueue();
  }


  //=============================================================================
  // Name: GetIndexByIPICQueue
  // Desc: 
  //=============================================================================
  public int GetIndexByIPICQueue(IPICQueue queue)
  {
    if (queue == null)
      return -1;

    int i;
    for (i = 0; i < queues.size(); ++i)
    {
      if (queues[i].GetIPICQueue() == queue)
        return i;
    }

    Interface.Log("WARNING: GetIndexByIPICQueue with queue " + queue.GetProductQueue().GetQueueName() + " could not be found!");
    return -1;
  }


  //=============================================================================
  // Name: RemoveQueue
  // Desc: 
  //=============================================================================
  public void RemoveQueue(IPICQueue queue)
  {
    int i;

    // make sure no tracks are using this queue
    for (i = 0; i < tracks.size(); ++i)
    {
      if (tracks[i].GetIPICQueue() == queue)
        tracks[i].SetIPICQueue(null);
    }

    // make sure that no processes are using this queue
    for (i = processes.size()-1; i >= 0; --i)
    {
      if (processes[i].GetInputQueue() == queue)
        processes[i].SetInputQueue(null);

      if (processes[i].GetOutputQueue() == queue)
        processes[i].SetOutputQueue(null);

      if (!processes[i].DoesAnything())
        processes[i, i+1] = null;
    }

    // remove the queue
    for (i = queues.size() - 1; i >= 0; --i)
    {
      if (queues[i].GetIPICQueue() == queue)
        queues[i, i + 1] = null;
    }

  }


  //=============================================================================
  // Name: GetRelationshipToQueue
  // Desc: 
  //=============================================================================
  public IndustryProductInfoQueues GetRelationshipToQueue(IPICQueue queue)
  {
    if (!queue)
      return null;

    int i;
    for (i = 0; i < queues.size(); ++i)
    {
      if (queues[i].GetIPICQueue() == queue)
        return queues[i];
    }

    Interface.Log("IndustryProductInfoComplete.GetRelationshipToQueue> queue is not related to this product");
    return null;
  }


  //=============================================================================
  // Name: GetProduct
  // Desc: 
  //=============================================================================
  public Asset GetProduct(void)
  {
    return m_product;
  }


  //=============================================================================
  // Name: SetProduct
  // Desc: 
  //=============================================================================
  public void SetProduct(Asset product)
  {
    m_product = product;
  }


  //=============================================================================
  // Name: GetVehicleKUID
  // Desc: 
  //=============================================================================
  public KUID GetVehicleKUID(void)
  {
    return m_vehicleKUID;
  }


  //=============================================================================
  // Name: SetVehicleKUID
  // Desc: 
  //=============================================================================
  public void SetVehicleKUID(KUID kuid)
  {
    m_vehicleKUID = kuid;
  }


  //=============================================================================
  // Name: GetPerVehicleAmount
  // Desc: 
  //=============================================================================
  public int GetPerVehicleAmount(void)
  {
    return m_perVehicleAmount;
  }


  //=============================================================================
  // Name: SetPerVehicleAmount
  // Desc: 
  //=============================================================================
  public void SetPerVehicleAmount(int amount)
  {
    m_perVehicleAmount = amount;
  }


  //=============================================================================
  // Name: GetDisplayType
  // Desc: 
  //=============================================================================
  public int GetDisplayType(void)
  {
    return m_displayType;
  }


  //=============================================================================
  // Name: SetDisplayType
  // Desc: 
  //=============================================================================
  public void SetDisplayType(int type)
  {
    m_displayType = type;
  }


};


