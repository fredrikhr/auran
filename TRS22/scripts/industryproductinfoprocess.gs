//=============================================================================
// File: IndustryProductInfoProcess.gs
// Desc: 
//=============================================================================
include "IPICProcess.gs"
include "IPICQueue.gs"
include "IndustryProductInfoComplete.gs"
include "IndustryProductInfoQueues.gs"
include "Log.gs"



//=============================================================================
// Name: IndustryProductInfoProcess
// Desc: This class defines a process in an industry. It is mainly used by the
//       IndustryProductInfoComplete class and provides a more comprehensive
//       interface than its IPICProcess cousin.
//=============================================================================
class IndustryProductInfoProcess
{
  IndustryProductInfoComplete m_product;
  IPICProcess                 m_process;
  IndustryProductInfoQueues   m_inputQueue;
  IndustryProductInfoQueues   m_outputQueue;

  int         inAmount;
  int         outAmount;
  bool        inUiIsExpanded;
  bool        inVisibleInSurveyor;
  bool        outUiIsExpanded;
  bool        outVisibleInSurveyor;
  bool        inVisibleInViewDetails;
  bool        outVisibleInViewDetails;


  //=============================================================================
  // Forward declarations.


  public void Init(IndustryProductInfoComplete product, IPICProcess process);

  public IndustryProductInfoComplete GetIPICProduct(void);
  public Asset GetProduct(void);
  public IPICProcess GetIPICProcess(void);
  public string GetProcessName(void);

  public void SetInputIPIQ(IndustryProductInfoQueues ipiq);
  public void SetInputQueue(IPICQueue queue);
  public IndustryProductInfoQueues GetInputIPIQ(void);
  public IPICQueue GetInputQueue(void);

  public void SetOutputIPIQ(IndustryProductInfoQueues ipiq);
  public void SetOutputQueue(IPICQueue queue);
  public IndustryProductInfoQueues GetOutputIPIQ(void);
  public IPICQueue GetOutputQueue(void);

  public bool GetProcessEnabled(void);
  public void SetProcessEnabled(bool enabled);

  public float GetProcessDuration(void);
  public void SetProcessDuration(float duration);

  public void SetInputAmount(int amount);
  public int GetInputAmount(void);
  public void SetOutputAmount(int amount);
  public int GetOutputAmount(void);

  public bool DoesUseInput(void);
  public bool DoesUseOutput(void);
  public bool DoesAnything(void);
  public bool DoesUseInputForSurveyor(void);
  public bool DoesUseOutputForSurveyor(void);
  public bool DoesAnythingForSurveyor(void);

  public void SetUiIsExpanded(bool isInput, bool expanded);
  public bool GetUiIsExpanded(bool isInput);

  public void SetVisibleInSurveyor(bool isInput, bool visible);
  public bool GetVisibleInSurveyor(bool isInput);

  public void SetVisibleInViewDetails(bool isInput, bool visible);
  public bool GetVisibleInViewDetails(bool isInput);
  public bool GetVisibleInViewDetailsProcessList(bool isInput);



  //=============================================================================
  // Name: Init
  // Desc: 
  //=============================================================================
  public void Init(IndustryProductInfoComplete product, IPICProcess process)
  {
    m_product = product;
    if (!m_product)
      Interface.Exception("IndustryProductInfoProcess.Init> null product");

    m_process = process;
    if (!m_process)
      Interface.Exception("IndustryProductInfoProcess.Init> null process");
  }


  //=============================================================================
  // Name: WriteInputsToGameObject
  // Desc: Writes the process inputs to the linked native game object.
  //=============================================================================
  void WriteInputsToGameObject(void)
  {
    // Get the industry, so that we can set the process amounts.
    IPICProcess ipicProcess = GetIPICProcess();
    IndustryProductInfoCollection ipic = ipicProcess.GetIndustryProductInfoCollection();
    BaseIndustry genIndustry = ipic.GetIndustry();
    IPICQueue ipiq = GetInputQueue();

    if (ipiq and genIndustry and ipic and ipicProcess)
      genIndustry.SetProcessInput(ipicProcess.GetProcessName(), ipiq.GetProductQueue(), GetProduct(), inAmount);
  }


  //=============================================================================
  // Name: WriteOutputsToGameObject
  // Desc: Writes the process outputs to the linked native game object.
  //=============================================================================
  void WriteOutputsToGameObject(void)
  {
    // Get the industry, so that we can set the process amounts.
    IPICProcess ipicProcess = GetIPICProcess();
    IndustryProductInfoCollection ipic = ipicProcess.GetIndustryProductInfoCollection();
    BaseIndustry genIndustry = ipic.GetIndustry();
    IPICQueue ipiq = GetOutputQueue();

    if (ipiq and genIndustry and ipic and ipicProcess)
      genIndustry.SetProcessOutput(ipicProcess.GetProcessName(), ipiq.GetProductQueue(), GetProduct(), outAmount);
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
  // Name: GetProduct
  // Desc: Returns the asset this process consumes/produces.
  //=============================================================================
  public Asset GetProduct(void)
  {
    return m_product.GetProduct();
  }


  //=============================================================================
  // Name: GetIPICProcess
  // Desc: 
  //=============================================================================
  public IPICProcess GetIPICProcess(void)
  {
    return m_process;
  }


  //=============================================================================
  // Name: GetProcessName
  // Desc: 
  //=============================================================================
  public string GetProcessName(void)
  {
    return m_process.GetProcessName();
  }


  //=============================================================================
  // Name: SetInputIPIQ
  // Desc: 
  //=============================================================================
  public void SetInputIPIQ(IndustryProductInfoQueues ipiq)
  {
    m_inputQueue = ipiq;

    WriteInputsToGameObject();
  }


  //=============================================================================
  // Name: SetInputQueue
  // Desc: 
  //=============================================================================
  public void SetInputQueue(IPICQueue queue)
  {
    //Log.DetailLogStart("SetInputQueue", "IndustryProductInfoProcess");
    //if (queue)
    //  Log.DetailLog("ProductQueue", queue.GetProductQueue().GetQueueName());

    // Ensure that the queue has been associated with the product.
    //IndustryProductInfoCollection ipic = queue.GetIndustryProductInfoCollection();
    //Asset product = m_product.product;
    //ipic.AddQueueToProduct(product, queue.GetProductQueue());
    m_inputQueue = m_product.GetRelationshipToQueue(queue);

    //Log.DetailLogEnd();
    WriteInputsToGameObject();
  }


  //=============================================================================
  // Name: GetInputQueue
  // Desc: 
  //=============================================================================
  public IPICQueue GetInputQueue(void)
  {
    if (!m_inputQueue)
      return null;

    return m_inputQueue.GetIPICQueue();
  }


  //=============================================================================
  // Name: SetOutputIPIQ
  // Desc: 
  //=============================================================================
  public void SetOutputIPIQ(IndustryProductInfoQueues ipiq)
  {
    m_outputQueue = ipiq;
    
    WriteOutputsToGameObject();
  }


  //=============================================================================
  // Name: SetOutputQueue
  // Desc: 
  //=============================================================================
  public void SetOutputQueue(IPICQueue queue)
  {
    //Log.DetailLogStart("SetOutputQueue", "IndustryProductInfoProcess");
    //if (queue)
    //  Log.DetailLog("ProductQueue", queue.GetProductQueue().GetQueueName());
    //Log.DetailLogEnd();

    m_outputQueue = m_product.GetRelationshipToQueue(queue);

    WriteOutputsToGameObject();
  }


  //=============================================================================
  // Name: GetOutputQueue
  // Desc: 
  //=============================================================================
  public IPICQueue GetOutputQueue(void)
  {
    if (!m_outputQueue)
      return null;

    return m_outputQueue.GetIPICQueue();
  }


  //=============================================================================
  // Name: GetInputIPIQ
  // Desc: 
  //=============================================================================
  public IndustryProductInfoQueues GetInputIPIQ(void)
  {
    return m_inputQueue;
  }


  //=============================================================================
  // Name: GetOutputIPIQ
  // Desc: 
  //=============================================================================
  public IndustryProductInfoQueues GetOutputIPIQ(void)
  {
    return m_outputQueue;
  }


  //=============================================================================
  // Name: SetInputAmount
  // Desc: Sets the input amount for this process.
  //=============================================================================
  public void SetInputAmount(int amount)
  {
    inAmount = amount;

    WriteInputsToGameObject();
  }


  //=============================================================================
  // Name: GetInputAmount
  // Desc: Gets the input amount for this process.
  //=============================================================================
  public int GetInputAmount(void)
  {
    return inAmount;
  }


  //=============================================================================
  // Name: SetOutputAmount
  // Desc: Sets the output amount for this process.
  //=============================================================================
  public void SetOutputAmount(int amount)
  {
    outAmount = amount;

    WriteOutputsToGameObject();
  }


  //=============================================================================
  // Name: GetOutputAmount
  // Desc: Gets the output amount for this process.
  //=============================================================================
  public int GetOutputAmount(void)
  {
    return outAmount;
  }


  //=============================================================================
  // Name: DoesUseInput
  // Desc: Returns whether this process consumes anything.
  //=============================================================================
  public bool DoesUseInput(void)
  {
    return (m_inputQueue and (inAmount > 0));
  }


  //=============================================================================
  // Name: DoesUseOutput
  // Desc: Returns whether this process produces anything.
  //=============================================================================
  public bool DoesUseOutput(void)
  {
    return (m_outputQueue and (outAmount > 0));
  }


  //=============================================================================
  // Name: DoesAnything
  // Desc: Returns whether this process produces or consumes anything.
  //=============================================================================
  public bool DoesAnything(void)
  {
    return DoesUseInput() or DoesUseOutput();
  }


  //=============================================================================
  // Name: DoesUseInputForSurveyor
  // Desc: 
  //=============================================================================
  public bool DoesUseInputForSurveyor(void)
  {
    //Log.DetailLogStart("DoesUseInputForSurveyor", "IndustryProductInfoProcess");
    //Log.DetailLogEnd();

    return !!m_inputQueue;
  }


  //=============================================================================
  // Name: DoesUseOutputForSurveyor
  // Desc: 
  //=============================================================================
  public bool DoesUseOutputForSurveyor(void)
  {
    //Log.DetailLogStart("DoesUseOutputForSurveyor", "IndustryProductInfoProcess");
    //Log.DetailLogEnd();

    return !!m_outputQueue;
  }


  //=============================================================================
  // Name: DoesAnythingForSurveyor
  // Desc: 
  //=============================================================================
  public bool DoesAnythingForSurveyor(void)
  {
    return DoesUseInputForSurveyor() or DoesUseOutputForSurveyor();
  }


  //=============================================================================
  // Name: GetProcessEnabled
  // Desc: Returns whether this process is currently enabled.
  //=============================================================================
  public bool GetProcessEnabled(void)
  {
    return m_process.GetEnabled();
  }


  //=============================================================================
  // Name: SetProcessEnabled
  // Desc: Sets whether this process is currently enabled.
  //=============================================================================
  public void SetProcessEnabled(bool enabled)
  {
    m_process.SetEnabled(enabled);
  }


  //=============================================================================
  // Name: GetProcessDuration
  // Desc: Returns the duration of this process (in seconds).
  //=============================================================================
  public float GetProcessDuration(void)
  {
    return m_process.GetDuration();
  }


  //=============================================================================
  // Name: SetProcessDuration
  // Desc: Sets the duration of this process (in seconds).
  //=============================================================================
  public void SetProcessDuration(float duration)
  {
    m_process.SetDuration(duration);
  }


  //=============================================================================
  // Name: SetUiIsExpanded
  // Desc: 
  //=============================================================================
  public void SetUiIsExpanded(bool isInput, bool expanded)
  {
    //Log.DetailLogStart("SetUiIsExpanded", "IndustryProductInfoProcess");
    //Log.DetailLog("isInput", isInput);
    //Log.DetailLog("expanded", expanded);
    //Log.DetailLogEnd();

    if (isInput)
      inUiIsExpanded = expanded;
    else
      outUiIsExpanded = expanded;
  }


  //=============================================================================
  // Name: GetUiIsExpanded
  // Desc: 
  //=============================================================================
  public bool GetUiIsExpanded(bool isInput)
  {
    //Log.DetailLogStart("GetUiIsExpanded", "IndustryProductInfoProcess");
    //Log.DetailLog("isInput", isInput);
    //Log.DetailLogEnd();

    if (isInput)
      return inUiIsExpanded;

    return outUiIsExpanded;
  }


  //=============================================================================
  // Name: SetVisibleInSurveyor
  // Desc: Sets whether the details of this process should be visible in the
  //       Surveyor property edit dialog for this parent industry.
  //=============================================================================
  public void SetVisibleInSurveyor(bool isInput, bool visible)
  {
    //Log.DetailLogStart("SetVisibleInSurveyor", "IndustryProductInfoProcess");
    //Log.DetailLog("isInput", isInput);
    //Log.DetailLog("visible", visible);
    //Log.DetailLogEnd();

    if (isInput)
      inVisibleInSurveyor = visible;
    else
      outVisibleInSurveyor = visible;
  }


  //=============================================================================
  // Name: GetVisibleInSurveyor
  // Desc: Returns whether the details of this process should be visible in the
  //       Surveyor property edit dialog for this parent industry.
  //=============================================================================
  public bool GetVisibleInSurveyor(bool isInput)
  {
    //Log.DetailLogStart("GetVisibleInSurveyor", "IndustryProductInfoProcess");
    //Log.DetailLog("isInput", isInput);
    //if (isInput)
    //  Log.DetailLog("// Returning " + inVisibleInSurveyor);
    //else
    //  Log.DetailLog("// Returning " + outVisibleInSurveyor);

    //Log.DetailLogEnd();

    if (isInput)
      return inVisibleInSurveyor;

    return outVisibleInSurveyor;
  }


  //=============================================================================
  // Name: SetVisibleInViewDetails
  // Desc: Sets whether the details of this process should be visible in the
  //       "View Details" dialog for this parent industry.
  //=============================================================================
  public void SetVisibleInViewDetails(bool isInput, bool visible)
  {
    //Log.DetailLogStart("SetVisibleInViewDetails", "IndustryProductInfoProcess");
    //Log.DetailLog("isInput", isInput);
    //Log.DetailLog("visible", visible);
    //Log.DetailLogEnd();

    if (isInput)
      inVisibleInViewDetails = visible;
    else
      outVisibleInViewDetails = visible;
  }


  //=============================================================================
  // Name: GetVisibleInViewDetails
  // Desc: Returns whether the details of this process should be visible in the
  //       "View Details" dialog for this parent industry.
  //=============================================================================
  public bool GetVisibleInViewDetails(bool isInput)
  {
    //Log.DetailLogStart("GetVisibleInViewDetails", "IndustryProductInfoProcess");
    //Log.DetailLog("isInput", isInput);
    //if (isInput)
    //  Log.DetailLog("// Returning " + inVisibleInViewDetails);
    //else
    //  Log.DetailLog("// Returning " + outVisibleInViewDetails);
    //Log.DetailLogEnd();

    if (isInput)
      return inVisibleInViewDetails;

    return outVisibleInViewDetails;
  }


  //=============================================================================
  // Name: GetVisibleInViewDetailsProcessList
  // Desc: 
  //=============================================================================
  public bool GetVisibleInViewDetailsProcessList(bool isInput)
  {
    return GetVisibleInSurveyor(isInput);
  }


};



