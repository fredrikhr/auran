//
// IndustryProductInfoTracks.gs
//
//  Copyright (C) 2004 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "IPICProcess.gs"
include "IPICQueue.gs"
include "IPICTrack.gs"
include "IndustryProductInfoComplete.gs"
include "IndustryProductInfoQueues.gs"


//! Information class that describes a piece of track an in industry.
//
// This class defines a piece of track in an industry where a product transfer can take place.  It is mainly
// used by the IndustryProductInfoComplete class.
//
// Useful interface methods of this class are:
//  - public void                         <b Init>  (IndustryProductInfoComplete product, IPICTrack track)
//  - public IPICTrack                    <b GetIPICTrack>    ()
//  - public string                       <b GetTrackName>    ()
//  - public IndustryProductInfoComplete  <b GetIPICProduct>  ()
//  - public IndustryProductInfoQueues    <b GetIPIQ>         ()
//  - public void                         <b SetIPIQ>         (IndustryProductInfoQueues ipiq)
//  - public IPICQueue                    <b GetIPICQueue>    ()
//  - public void                         <b SetIPICQueue>    (IPICQueue queue)
//
// Note:
//     This class is not a part of the core %Trainz API and isn't fully documented.  The full class definition
//     and implementation however can be found in the <b \Trainz\scripts\IndustryProductInfoTracks.gs> script file.
//
// See Also:
//     IndustryProductInfoComplete, IndustryProductInfoProcess, IndustryProductInfoQueues, IPICTrack,
//     IndustryProductInfoCollection, SceneryWithTrack::GetAttachedTrack()
//
class IndustryProductInfoTracks
{
  public void Init(IndustryProductInfoComplete product, IPICTrack track);

  public IPICTrack GetIPICTrack(void);
  public string GetTrackName(void);

  public IndustryProductInfoComplete GetIPICProduct(void);

  public void SetIPIQ(IndustryProductInfoQueues ipiq);
  public void SetIPICQueue(IPICQueue queue);
  public IndustryProductInfoQueues GetIPIQ(void);
  public IPICQueue GetIPICQueue(void);


	//public string trackName;            NOW IN IPICTrack
	public string mode;
	//public int queueIndex;              NOW IN IPICQueue

	public bool uiIsExpanded;

  //
  // IMPLEMENTATION
  //
  IndustryProductInfoComplete m_product;
  IPICTrack m_track;
  IndustryProductInfoQueues m_queue;

  public void Init(IndustryProductInfoComplete product, IPICTrack track)
  {
    m_product = product;
    m_track = track;
  }

  public IPICTrack GetIPICTrack(void)
  {
    return m_track;
  }

  public string GetTrackName(void)
  {
    return m_track.GetTrackName();
  }

  public IndustryProductInfoComplete GetIPICProduct(void)
  {
    return m_product;
  }

  public void SetIPIQ(IndustryProductInfoQueues ipiq)
  {
    m_queue = ipiq;
  }

  public void SetIPICQueue(IPICQueue queue)
  {
    m_queue = m_product.GetRelationshipToQueue(queue);
  }

  public IndustryProductInfoQueues GetIPIQ(void)
  {
    return m_queue;
  }

  public IPICQueue GetIPICQueue(void)
  {
    if (!m_queue)
      return null;

    return m_queue.GetIPICQueue();
  }
};

