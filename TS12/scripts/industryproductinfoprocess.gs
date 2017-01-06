//
// IndustryProductInfoProcess.gs
//
//  Copyright (C) 2004 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "IPICProcess.gs"
include "IPICQueue.gs"
include "IndustryProductInfoComplete.gs"
include "IndustryProductInfoQueues.gs"
include "Log.gs"


//! Information class that describes an industry process and its various attributes.
//
// This class defines a process in an industry.  It is mainly used by the IndustryProductInfoComplete
// class and provides a more comprehensive interface than its IPICProcess cousin.
//
// Useful interface methods of this class are:
//  - public void                         <b Init>                (IndustryProductInfoComplete product, IPICProcess process)
//  - public IndustryProductInfoComplete  <b GetIPICProduct>      ()
//  - public IPICProcess                  <b GetIPICProcess>      ()
//  - public string                       <b GetProcessName>      ()
//  - public IndustryProductInfoQueues    <b GetInputIPIQ>        ()
//  - public void                         <b SetInputIPIQ>        (IndustryProductInfoQueues ipiq)
//  - public IPICQueue                    <b GetInputQueue>       ()
//  - public void                         <b SetInputQueue>       (IPICQueue queue)
//  - public IndustryProductInfoQueues    <b GetOutputIPIQ>       ()
//  - public void                         <b SetOutputIPIQ>       (IndustryProductInfoQueues ipiq)
//  - public IPICQueue                    <b GetOutputQueue>      ()
//  - public void                         <b SetOutputQueue>      (IPICQueue queue)
//  - public bool                         <b GetProcessEnabled>   ()
//  - public void                         <b SetProcessEnabled>   (bool enabled)
//  - public float                        <b GetProcessDuration>  ()
//  - public void                         <b SetProcessDuration>  (float duration)
//  - public int                          <b GetInputAmount>      ()
//  - public void                         <b SetInputAmount>      (int amount)
//  - public int                          <b GetOutputAmount>     ()
//  - public void                         <b SetOutputAmount>     (int amount)
//  - public bool                         <b DoesUseInput>        ()
//  - public bool                         <b DoesUseOutput>       ()
//  - public bool                         <b DoesAnything>        ()
//  - public bool                         <b DoesUseInputForSurveyor>   ()
//  - public bool                         <b DoesUseOutputForSurveyor>  ()
//  - public bool                         <b DoesAnythingForSurveyor>   ()
//  - public Asset                        <b GetProduct>                ()
//  - public bool                         <b GetUiIsExpanded>           (bool isInput)
//  - public void                         <b SetUiIsExpanded>           (bool isInput, bool expanded)
//  - public bool                         <b GetVisibleInSurveyor>      (bool isInput)
//  - public void                         <b SetVisibleInSurveyor>      (bool isInput, bool visible)
//  - public bool                         <b GetVisibleInViewDetails>   (bool isInput)
//  - public void                         <b SetVisibleInViewDetails>   (bool isInput, bool visible)
//  - public bool                         <b GetVisibleInViewDetailsProcessList>  (bool isInput)
//
// Note:
//     This class is not a part of the core %Trainz API and isn't fully documented.  The full class definition and
//     implementation however can be found in the <b \Trainz\scripts\IndustryProductInfoProcess.gs> script file.
//
// See Also:
//     IndustryProductInfoComplete, IndustryProductInfoQueues, IndustryProductInfoTracks, IPICProcess,
//     IndustryProductInfoCollection, Industry::GetProcessNameList()
//
class IndustryProductInfoProcess
{
  public void Init(IndustryProductInfoComplete product, IPICProcess process);

  public IndustryProductInfoComplete GetIPICProduct(void);
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

  public Asset GetProduct(void);


  public void SetUiIsExpanded(bool isInput, bool expanded);
  public bool GetUiIsExpanded(bool isInput);

  public void SetVisibleInSurveyor(bool isInput, bool visible);
  public bool GetVisibleInSurveyor(bool isInput);

  public bool GetVisibleInViewDetailsProcessList(bool isInput);

  public void SetVisibleInViewDetails(bool isInput, bool visible);
  public bool GetVisibleInViewDetails(bool isInput);

  //public string name;                 NOW IN IPICProcess
	//public int duration;                NOW IN IPICProcess
  //public bool startEnabled;           NOW IN IPICProcess
	
	//public int inQueueIndex;
	//public bool inUse;

	//public int outQueueIndex;
	//public bool outUse;


  //
  // PRIVATES: These should have accessors above.
  //
  int inAmount;
	int outAmount;

	bool inUiIsExpanded;
  bool inVisibleInSurveyor;    //inVisibleOnGUI
  
 	bool outUiIsExpanded;
  bool outVisibleInSurveyor;
  
  bool inVisibleInViewDetails;
  bool outVisibleInViewDetails;

  //
  // IMPLEMENTATION
  //
  IndustryProductInfoComplete m_product;
  IPICProcess m_process;
  IndustryProductInfoQueues m_inputQueue;
  IndustryProductInfoQueues m_outputQueue;

  public Asset GetProduct(void)
  {
    return m_product.GetProduct();
  }

  public void Init(IndustryProductInfoComplete product, IPICProcess process)
  {
    m_product = product;
		if (!m_product)
			Interface.Exception("IndustryProductInfoProcess.Init> null product");

    m_process = process;
		if (!m_process)
			Interface.Exception("IndustryProductInfoProcess.Init> null process");
  }

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

  public IndustryProductInfoComplete GetIPICProduct(void)
  {
    return m_product;
  }

  public IPICProcess GetIPICProcess(void)
  {
    return m_process;
  }

  public string GetProcessName(void)
  {
    return m_process.GetProcessName();
  }


  public void SetInputIPIQ(IndustryProductInfoQueues ipiq)
  {
    m_inputQueue = ipiq;

    WriteInputsToGameObject();
  }

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

  public IPICQueue GetInputQueue(void)
  {
    if (!m_inputQueue)
      return null;

    return m_inputQueue.GetIPICQueue();
  }


  public void SetOutputIPIQ(IndustryProductInfoQueues ipiq)
  {
    m_outputQueue = ipiq;
    
    WriteOutputsToGameObject();
  }

  public void SetOutputQueue(IPICQueue queue)
  {
    //Log.DetailLogStart("SetOutputQueue", "IndustryProductInfoProcess");
    
    //if (queue)
    //  Log.DetailLog("ProductQueue", queue.GetProductQueue().GetQueueName());

    m_outputQueue = m_product.GetRelationshipToQueue(queue);

    //Log.DetailLogEnd();

    WriteOutputsToGameObject();
  }

  public IPICQueue GetOutputQueue(void)
  {
    if (!m_outputQueue)
      return null;

    return m_outputQueue.GetIPICQueue();
  }

  public IndustryProductInfoQueues GetInputIPIQ(void)
  {
    return m_inputQueue;
  }

  public IndustryProductInfoQueues GetOutputIPIQ(void)
  {
    return m_outputQueue;
  }


  public void SetInputAmount(int amount)
  {
    inAmount = amount;

    WriteInputsToGameObject();
  }

  public int GetInputAmount(void)
  {
    return inAmount;
  }

  public void SetOutputAmount(int amount)
  {
    outAmount = amount;

    WriteOutputsToGameObject();
  }

  public int GetOutputAmount(void)
  {
    return outAmount;
  }

  public bool DoesUseInput(void)
  {
    /*
    if (m_inputQueue)
      Interface.Log("m_inputQueue is VALID");
    else
      Interface.Log("m_inputQueue is INVALID");
    */
    //Interface.Log("inAmount = " + (string)inAmount);

    return (m_inputQueue  and  (inAmount > 0));
  }

  public bool DoesUseOutput(void)
  {
    /*
    if (m_outputQueue)
      Interface.Log("m_outputQueue is VALID");
    else
      Interface.Log("m_outputQueue is INVALID");
    */
    //Interface.Log("outAmount = " + (string)outAmount);

    return (m_outputQueue  and  (outAmount > 0));
  }

  public bool DoesAnything(void)
  {
    return DoesUseInput() or DoesUseOutput();
  }


  public bool DoesUseInputForSurveyor(void)
  {
    //Log.DetailLogStart("DoesUseInputForSurveyor", "IndustryProductInfoProcess");
    //Log.DetailLogEnd();

    return !!m_inputQueue;
  }

  public bool DoesUseOutputForSurveyor(void)
  {
    //Log.DetailLogStart("DoesUseOutputForSurveyor", "IndustryProductInfoProcess");
    //Log.DetailLogEnd();

    return !!m_outputQueue;
  }

  public bool DoesAnythingForSurveyor(void)
  {
    return DoesUseInputForSurveyor() or DoesUseOutputForSurveyor();
  }

  public bool GetProcessEnabled(void)
  {
    return m_process.GetEnabled();
  }

  public void SetProcessEnabled(bool enabled)
  {
    m_process.SetEnabled(enabled);
  }

  public float GetProcessDuration(void)
  {
    return m_process.GetDuration();
  }

  public void SetProcessDuration(float duration)
  {
    m_process.SetDuration(duration);
  }


  public void SetUiIsExpanded(bool isInput, bool expanded)
  {
    //Log.DetailLogStart("SetUiIsExpanded", "IndustryProductInfoProcess");

    //Log.DetailLog("isInput", isInput);
    //Log.DetailLog("expanded", expanded);

    if (isInput)
      inUiIsExpanded = expanded;
    else
      outUiIsExpanded = expanded;

    //Log.DetailLogEnd();
  }

  public bool GetUiIsExpanded(bool isInput)
  {
    //Log.DetailLogStart("GetUiIsExpanded", "IndustryProductInfoProcess");
    //Log.DetailLog("isInput", isInput);
    //Log.DetailLogEnd();

    if (isInput)
      return inUiIsExpanded;
    else
      return outUiIsExpanded;

    return false;
  }

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
    else
      return outVisibleInSurveyor;
    
    return false;
  }


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
    else
      return outVisibleInViewDetails;
    
    return false;
  }


  public bool GetVisibleInViewDetailsProcessList(bool isInput)
  {
    return GetVisibleInSurveyor(isInput);
  }
};



