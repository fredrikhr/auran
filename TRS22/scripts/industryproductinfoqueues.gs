//=============================================================================
// Name: IndustryProductInfoQueues.gs
// Desc: 
//=============================================================================
include "IPICProcess.gs"
include "IPICQueue.gs"
include "IndustryProductInfoComplete.gs"



//=============================================================================
// Name: IndustryProductInfoQueues
// Desc: This class defines a queue in an industry where a product transfer can
//       take place. It is mainly used by IndustryProductInfoComplete.
// Note: This class is not a part of the core Trainz API and isn't fully
//       documented. The full class definition and implementation however can
//       be found in the IndustryProductInfoQueues.gs script file.
//=============================================================================
class IndustryProductInfoQueues
{
  IndustryProductInfoComplete m_product;
  IPICQueue                   m_queue;
  int                         initialAmount;

  public bool uiIsExpanded;


  //=============================================================================
  // Forward declarations.

  public void Init(IndustryProductInfoComplete product, IPICQueue queue);

  public IPICQueue GetIPICQueue(void);
  public ProductQueue GetProductQueue(void);
  public IndustryProductInfoComplete GetIPICProduct(void);

  public void ResetAssetToInitialAmount(void);
  public void SetInitialAmount(int amount);
  public int GetInitialAmount();

  public void SetQueueSize(int amount);
  public int GetQueueSize();

  public int GetQueueWaybillRemain(void);
  public void SetQueueWaybillRemain(int waybillRemain);

  public int GetQueueWaybillIssuePercent(void);
  public void SetQueueWaybillIssuePercent(int issuePercent);



  //=============================================================================
  // Name: Init
  // Desc: Initialises the queue info.
  //=============================================================================
  public void Init(IndustryProductInfoComplete product, IPICQueue queue)
  {
    m_product = product;
    m_queue = queue;

    if (!m_product)
      Interface.Exception("IndustryProductInfoQueues.Init> null product");
    if (!queue)
      Interface.Exception("IndustryProductInfoQueues.Init> null queue");
  }


  //=============================================================================
  // Name: GetIPICQueue
  // Desc: 
  //=============================================================================
  public IPICQueue GetIPICQueue(void)
  {
    return m_queue;
  }


  //=============================================================================
  // Name: GetProductQueue
  // Desc: 
  //=============================================================================
  public ProductQueue GetProductQueue(void)
  {
    if (m_queue)
      return m_queue.GetProductQueue();

    return null;
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
  // Name: ResetAssetToInitialAmount
  // Desc: Resets the parent industry/vehicle queue to have the amount specified
  //       by 'initialAmount'. Note that this is not necessarily the "initial"
  //       amount as configured by the player in Surveyor, as we update this
  //       value at save time.
  //=============================================================================
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


  //=============================================================================
  // Name: SetInitialAmount
  // Desc: Sets the "initial" amount of the product queue. This is saved
  //       internally (as initialAmount) but is also reflected on the parent
  //       queue in native code.
  //=============================================================================
  public void SetInitialAmount(int amount)
  {
    //Log.DetailLogStart("SetInitialAmount", "IndustryProductInfoQueues");
    //Log.DetailLog("amount", amount);

    if (m_queue)
    {
      initialAmount = amount;

      ResetAssetToInitialAmount();
    }
    else
    {
      //Log.DetailLog("// WARNING: Queue was invalid, SetQueueInitialCount not called");
    }

    //Log.DetailLogEnd();
  }


  //=============================================================================
  // Name: GetInitialAmount
  // Desc: Returns the current amount of product in the linked queue.
  // Note: Don't read too much into the name. This is not really an "initial"
  //       amount, as it's constantly updated from the parent industry. Rather,
  //       this is used at save time (GetProperties) to query what the "initial"
  //       amount should be set to on reload (SetProperties).
  //=============================================================================
  public int GetInitialAmount(void)
  {
    if (m_queue and m_product)
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


  //=============================================================================
  // Name: SetQueueSize
  // Desc: Sets the "size" of the queue. That is, the maximum amount of product
  //       it can hold.
  //=============================================================================
  public void SetQueueSize(int amount)
  {
    // Make sure the current/initial queue amount doesn't exceed the maximum.
    if (initialAmount > amount)
      SetInitialAmount(amount);

    m_queue.SetSize(amount);
  }


  //=============================================================================
  // Name: GetQueueSize
  // Desc: Returns the "size" of the queue. That is, the maximum amount of
  //       product it can hold.
  //=============================================================================
  public int GetQueueSize(void)
  {
    return m_queue.GetSize();
  }


  //=============================================================================
  // Name: GetQueueWaybillRemain
  // Desc: 
  //=============================================================================
  public int GetQueueWaybillRemain(void)
  {
    return m_queue.GetWaybillRemain();
  }


  //=============================================================================
  // Name: SetQueueWaybillRemain
  // Desc: 
  //=============================================================================
  public void SetQueueWaybillRemain(int waybillRemain)
  {
    m_queue.SetWaybillRemain(waybillRemain);
  }


  //=============================================================================
  // Name: GetQueueWaybillIssuePercent
  // Desc: 
  //=============================================================================
  public int GetQueueWaybillIssuePercent(void)
  {
    return m_queue.GetWaybillIssuePercent();
  }


  //=============================================================================
  // Name: SetQueueWaybillIssuePercent
  // Desc: 
  //=============================================================================
  public void SetQueueWaybillIssuePercent(int issuePercent)
  {
    m_queue.SetWaybillIssuePercent(issuePercent);
  }


};


