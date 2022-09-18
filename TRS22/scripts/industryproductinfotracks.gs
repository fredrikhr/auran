//=============================================================================
// File: IndustryProductInfoTracks.gs
// Desc: 
//=============================================================================
include "IPICProcess.gs"
include "IPICQueue.gs"
include "IPICTrack.gs"
include "IndustryProductInfoComplete.gs"
include "IndustryProductInfoQueues.gs"



//=============================================================================
// Name: IndustryProductInfoTracks
// Desc: Describes a track in an industry where a product transfer can take
//       place. It is mainly used by the IndustryProductInfoComplete class.
//=============================================================================
class IndustryProductInfoTracks
{
  public string     mode;
  public bool       uiIsExpanded;

  IndustryProductInfoComplete m_product;
  IPICTrack                   m_track;
  IndustryProductInfoQueues   m_queue;


  //=============================================================================
  // Forward declarations.

  public void Init(IndustryProductInfoComplete product, IPICTrack track);

  public IPICTrack GetIPICTrack(void);
  public string GetTrackName(void);

  public IndustryProductInfoComplete GetIPICProduct(void);

  public void SetIPIQ(IndustryProductInfoQueues ipiq);
  public void SetIPICQueue(IPICQueue queue);
  public IndustryProductInfoQueues GetIPIQ(void);
  public IPICQueue GetIPICQueue(void);



  //=============================================================================
  // Name: Init
  // Desc: 
  //=============================================================================
  public void Init(IndustryProductInfoComplete product, IPICTrack track)
  {
    m_product = product;
    m_track = track;
  }


  //=============================================================================
  // Name: GetIPICTrack
  // Desc: 
  //=============================================================================
  public IPICTrack GetIPICTrack(void)
  {
    return m_track;
  }


  //=============================================================================
  // Name: GetTrackName
  // Desc: 
  //=============================================================================
  public string GetTrackName(void)
  {
    return m_track.GetTrackName();
  }


  //=============================================================================
  // Name: GetIPICProduct
  // Desc: 
  //=============================================================================
  public IndustryProductInfoComplete GetIPICProduct(void)
  {
    return m_product;
  }


  //=============================================================================
  // Name: SetIPIQ
  // Desc: 
  //=============================================================================
  public void SetIPIQ(IndustryProductInfoQueues ipiq)
  {
    m_queue = ipiq;
  }


  //=============================================================================
  // Name: SetIPICQueue
  // Desc: 
  //=============================================================================
  public void SetIPICQueue(IPICQueue queue)
  {
    m_queue = m_product.GetRelationshipToQueue(queue);
  }


  //=============================================================================
  // Name: GetIPIQ
  // Desc: 
  //=============================================================================
  public IndustryProductInfoQueues GetIPIQ(void)
  {
    return m_queue;
  }


  //=============================================================================
  // Name: GetIPICQueue
  // Desc: 
  //=============================================================================
  public IPICQueue GetIPICQueue(void)
  {
    if (!m_queue)
      return null;

    return m_queue.GetIPICQueue();
  }


};


