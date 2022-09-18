//=============================================================================
// File: IndustryProductInfoCollection.gs
// Desc: 
//=============================================================================
include "Industry.gs"
include "Vehicle.gs"
include "Common.gs"
include "IPICProcess.gs"
include "IPICQueue.gs"
include "IPICTrack.gs"
include "Log.gs"
include "IndustryProductInfoQueues.gs"
include "IndustryProductInfoTracks.gs"
include "IndustryProductInfoProcess.gs"
include "IndustryProductInfoComplete.gs"



//=============================================================================
// Name: IndustryProductInfoCollection
// Desc: This class is used by BaseIndustry and Vehicle to define a collection
//       of product transfers in terms of the type of products being used and
//       the associated processes, queues and tracks involved. It can be
//       initialized from a given BaseIndustry or Vehicle and also allows the
//       product transfers of the collection to be added and tweaked through
//       the properties interface of the host object.
//=============================================================================
class IndustryProductInfoCollection
{
  public IndustryProductInfoComplete[] ipicCollection;  // Collection of various product transfers the host industry allows.

  IPICTrack[]   m_tracks;       // Tracks that the host industry has.
  IPICQueue[]   m_queues;       // Product queues that the host industry has.
  IPICProcess[] m_processes;    // Processes that the host industry has.
  BaseIndustry  m_industry;     // Host industry of this product collection object.
  Vehicle       m_vehicle;
  bool          m_inInitFromAsset = false;


  //=============================================================================
  // Forward declarations.

  public void Init(BaseIndustry industry);
  public void Init(Vehicle vehicle);
  public BaseIndustry GetIndustry(void) { return m_industry; }
  public Vehicle GetVehicle(void) { return m_vehicle; }

  public IPICQueue FindIPICQueue(ProductQueue queue);
  public IPICTrack FindIPICTrack(string trackName);
  public IPICProcess FindIPICProcess(string processName);
  public int GetProductIndex(Asset product);
  public bool DoesProductHaveTrack(Asset product, string trackName);
  public int GetTrackIndex(int productIndex, string trackName);
  public int GetQueueIndex(int productIndex, ProductQueue queue);
  public ProductQueue GetQueueFromIndex(int productIndex, int queueIndex);
  public int GetProcessIndex(int productIndex, string processName);
  public bool DoesProductHaveProcess(Asset product, string processName);

  public IndustryProductInfoComplete AddProduct(Asset product, Vehicle vehicle);
  public IndustryProductInfoComplete AccessProductInfo(int index);
  public void AddQueueToProduct(Asset product, ProductQueue queue);
  public void SetProductQueueInitialAmount(BaseIndustry industry, Asset product, ProductQueue queue, int amount);
  public void RemoveQueueFromProduct(Asset product, ProductQueue queue);
  public IndustryProductInfoProcess AddProcessToProduct(Asset product, string processName);

  public void SyncQueuesToProducts();
  public void InitFromAsset(void);
  public bool IsInInitFromAsset(void);

  public void SetProperties(Soup soup, BaseIndustry genIndustry);
  public void GetProperties(Soup soup, BaseIndustry genIndustry);



  //=============================================================================
  // Name: Init
  // Desc: 
  //=============================================================================
  public void Init(BaseIndustry industry)
  {
    // ADD DEBUG WATCH
    //Log.DetailWatchFunctionStart("SetInputAmount", "IndustryProductInfoProcess");
    //Log.DetailWatchFunctionStart("SetInputQueue", "IndustryProductInfoProcess");
    // ADD DEBUG WATCH


    //Log.DetailLogStart("Init", "IndustryProductInfoCollection");
    //if (industry)
    //  Log.DetailLog(industry.GetLocalisedName(), "industry" + industry.GetLocalisedName());

    m_industry = industry;

    ipicCollection = new IndustryProductInfoComplete[0];

    InitFromAsset();
  }


  //=============================================================================
  // Name: Init
  // Desc: 
  //=============================================================================
  public void Init(Vehicle vehicle)
  {
    m_vehicle = vehicle;

    BaseIndustry industry;
    Init(industry);
  }


  //=============================================================================
  // Name: FindIPICQueue
  // Desc: Finds and returns the IPICQueue data for the queue passed.
  //=============================================================================
  public IPICQueue FindIPICQueue(ProductQueue queue)
  {
    if (m_queues)
    {
      int i;
      for (i = 0; i < m_queues.size(); ++i)
      {
        if (m_queues[i].GetProductQueue() == queue)
          return m_queues[i];
      }
    }

    if (queue)
      Interface.LogCallStack("IndustryProductInfoCollection.FindIPICQueue> unable to find queue: " + queue.GetQueueName());
    else
      Interface.LogCallStack("IndustryProductInfoCollection.FindIPICQueue> passed in queue was NULL");

    return null;
  }


  //=============================================================================
  // Name: FindIPICTrack
  // Desc: Finds and returns the IPICTrack data for the track name passed.
  //=============================================================================
  public IPICTrack FindIPICTrack(string trackName)
  {
    if (!m_tracks)
      return null;

    int i;
    for (i = 0; i < m_tracks.size(); ++i)
    {
      if (m_tracks[i].GetTrackName() == trackName)
        return m_tracks[i];
    }

    Interface.Log("IndustryProductInfoCollection.FindIPICTrack> unable to find track '" + trackName + "'");
    Interface.Log(" choices are:");
    for (i = 0; i < m_tracks.size(); i++)
      Interface.Log("  " + m_tracks[i].GetTrackName());

    return null;
  }


  //=============================================================================
  // Name: FindIPICProcess
  // Desc: Finds and returns the IPICProcess data for the process name passed.
  //=============================================================================
  public IPICProcess FindIPICProcess(string processName)
  {
    if (!m_processes)
      return null;

    int i;
    for (i = 0; i < m_processes.size(); ++i)
    {
      if (m_processes[i].GetProcessName() == processName)
        return m_processes[i];
    }

    Interface.Log("IndustryProductInfoCollection.FindIPICProcess> unable to find process '" + processName + "'");
    Interface.Log(" choices are:");
    for (i = 0; i < m_processes.size(); i++)
      Interface.Log("  " + m_processes[i].GetProcessName());

    return null;
  }


  //=============================================================================
  // Name: GetProductIndex
  // Desc: Searches for a specific product asset in this collection, returning
  //       it's index if found.
  //=============================================================================
  public int GetProductIndex(Asset product)
  {
    int i;
    for (i = 0; i < ipicCollection.size(); i++)
    {
      if (ipicCollection[i].GetProduct() == product)
        return i;
    }

    return -1;
  }


  //=============================================================================
  // Obsolete- Duplicate function, call GetProductIndex() instead.
  public obsolete int GetProductIndexFromAsset(Asset asset)
  {
    return GetProductIndex(asset);
  }


  //=============================================================================
  // Name: DoesProductHaveTrack
  // Desc: Returns whether a track exists with the specified product and name.
  //=============================================================================
  public bool DoesProductHaveTrack(Asset product, string trackName)
  {
    int k;
    for (k = 0; k < ipicCollection.size(); ++k)
    {
      if (ipicCollection[k].GetProduct() == product)
      {
        // Found the correct product, check its track listing.
        int i;
        for (i = 0; i < ipicCollection[k].tracks.size(); ++i)
        {
          if (ipicCollection[k].tracks[i].GetTrackName() == trackName)
            return true;
        }
      }
    }

    // No match found.
    return false;
  }


  //=============================================================================
  // Name: GetTrackIndex
  // Desc: Searches for a specific product track in this collection, returning
  //       it's index if found.
  //=============================================================================
  public int GetTrackIndex(int productIndex, string trackName)
  {
    if (productIndex > -1 and productIndex < ipicCollection.size())
    {
      int i;
      for (i = 0; i < ipicCollection[productIndex].tracks.size(); ++i)
      {
        if (ipicCollection[productIndex].tracks[i].GetTrackName() == trackName)
        return i;
      }
    }

    return -1;
  }


  //=============================================================================
  // Name: GetQueueIndex
  // Desc: Searches for a specific product queue in this collection, returning
  //       it's index if found.
  //=============================================================================
  public int GetQueueIndex(int productIndex, ProductQueue queue)
  {
    //Log.DetailLogStart("GetQueueIndex", "IndustryProductInfoCollection");
    //Log.DetailLog("productIndex", (string)productIndex);

    if (productIndex > -1 and productIndex < ipicCollection.size())
    {
      int i;
      for (i = 0; i < ipicCollection[productIndex].queues.size(); i++)
      {
        if (ipicCollection[productIndex].queues[i].GetProductQueue() == queue)
        {
          //Log.DetailLog("// Found Queue " + queue.GetQueueName() + " with index of " + (string)i);
          //Log.DetailLogEnd();
          return i;
        }
      }
    }

    //if (queue)
    //  Log.DetailLog("// Could not find Queue " + queue.GetQueueName());
    //else
    //  Log.DetailLog("// Queue was NULL, therefore could not be found");
    //Log.DetailLogEnd();

    return -1;
  }


  //=============================================================================
  // Name: GetQueueFromIndex
  // Desc: Returns a specific product queue from it's index.
  //=============================================================================
  public ProductQueue GetQueueFromIndex(int productIndex, int queueIndex)
  {
    if (productIndex > -1 and  productIndex < ipicCollection.size())
    {
      if (queueIndex > -1 and queueIndex < ipicCollection[productIndex].queues.size())
        return ipicCollection[productIndex].queues[queueIndex].GetProductQueue();
    }

    return null;
  }


  //=============================================================================
  // Name: GetProcessIndex
  // Desc: Searches for a specific product process in this collection, returning
  //       it's index if found.
  //=============================================================================
  public int GetProcessIndex(int productIndex, string processName)
  {
    if (productIndex > -1 and productIndex < ipicCollection.size())
    {
      int i;
      for (i = 0; i < ipicCollection[productIndex].processes.size(); ++i)
      {
        if (ipicCollection[productIndex].processes[i].GetProcessName() == processName)
          return i;
      }
    }

    return -1;
  }


  //=============================================================================
  // Name: DoesProductHaveProcess
  // Desc: Returns whether a process exists with the specified product and name.
  //=============================================================================
  public bool DoesProductHaveProcess(Asset product, string processName)
  {
    int k;
    for (k = 0; k < ipicCollection.size(); ++k)
    {
      if (ipicCollection[k].GetProduct() == product)
      {
        // Found the correct product, check its track listing.
        int i;
        for (i = 0; i < ipicCollection[k].processes.size(); ++i)
        {
          if (ipicCollection[k].processes[i].GetProcessName() == processName)
            return true;
        }
      }
    }

    // No match found.
    return false;
  }


  //=============================================================================
  // Obsolete- Duplicate function, call GetProcessIndex() instead.
  public obsolete int GetProcessIndexFromName(int productIndex, string processName)
  {
    return GetProcessIndex(productIndex, processName);
  }


  //=============================================================================
  // Name: AddProduct
  // Desc: Adds internal data for the specified product and vehicle.
  //=============================================================================
  public IndustryProductInfoComplete AddProduct(Asset product, Vehicle vehicle)
  {
    if (!product)
    {
      Interface.Log("IndustryProductInfoCollection.AddProduct> null product");
      return null;
    }

    IndustryProductInfoComplete ipic;

    int productIndex = GetProductIndex(product);
    if (productIndex >= 0)
    {
      // Already exists, prevent duplicates
      ipic = ipicCollection[productIndex];
    }
    else
    {
      // Add new product entry
      ipic = new IndustryProductInfoComplete();
      ipic.Init(me);
      ipic.SetProduct(product);

      ipicCollection[ipicCollection.size()] = ipic;
    }

    // Set vehicle KUID (this will replace/clear any previous value)
    if (vehicle and vehicle.GetAsset())
      ipic.SetVehicleKUID(vehicle.GetAsset().GetKUID());
    else
      ipic.SetVehicleKUID(null);

    return ipic;
  }


  //=============================================================================
  // Obsolete, use the newer variant above.
  public obsolete IndustryProductInfoComplete AddProduct(string productName, string vehicleName)
  {
    Asset trainzAsset = Constructors.GetTrainzAsset();

    // This function variant uses the kuid-table in the 'core strings' base
    // asset to refer to products by name
    Asset productAsset = trainzAsset.FindAsset(productName);
    if (!productAsset)
    {
      Interface.Log("IndustryProductInfoCollection.AddProduct> null product");
      return null;
    }

    return AddProduct(productAsset, cast<Vehicle>(Router.GetGameObject(vehicleName)));
  }


  //=============================================================================
  // Name: AccessProductInfo
  // Desc: Returns the IndustryProductInfoComplete the specified index.
  //=============================================================================
  public IndustryProductInfoComplete AccessProductInfo(int index)
  {
    if (index < 0 or index >= ipicCollection.size())
    {
      if (ipicCollection.size() > 0)
        return ipicCollection[0];

      return null;
    }

    return ipicCollection[index];
  }


  //=============================================================================
  // Name: AddQueueToProduct
  // Desc: Adds the passed product queue, if it doesn't already exist.
  //=============================================================================
  public void AddQueueToProduct(Asset product, ProductQueue queue)
  {
    if (!product)
    {
      Interface.LogCallStack("AddQueueToProduct> null product");
      return;
    }

    //Log.DetailLogStart("AddQueueToProduct", "IndustryProductInfoCollection");
    //Log.DetailLog("productName", product.GetLocalisedName());

    // Ensure this queue and product exists in the collection.
    int productIndex = GetProductIndex(product);
    if (productIndex == -1)
    {
      //Log.DetailLog("// Product did not exist, adding new one");
      AddProduct(product, null);
      productIndex = GetProductIndex(product);
    }

    int queueIndex = GetQueueIndex(productIndex, queue);
    if (queueIndex == -1)
    {
      //Log.DetailLog("// Queue did not exist, adding new one");

      // Queue doesn't exist, so its okay to add it.
      ProductFilter pf = Constructors.NewProductFilter();
      pf.CopyFilter(queue.GetProductFilter());
      pf.AddProduct(product);
      queue.SetProductFilter(pf);
      queue.CreateProduct(product, 0);

      IndustryProductInfoQueues ipiQueue = new IndustryProductInfoQueues();
      ipiQueue.Init(ipicCollection[productIndex], FindIPICQueue(queue));
      IPICQueue ipicQ = ipiQueue.GetIPICQueue();
      if (ipicQ)
      {
        ipicQ.SetSize(queue.GetQueueSize());
        ipicQ.SetWaybillRemain(0);
        ipicQ.SetWaybillIssuePercent(80);
      }

      ProductFilter pf2 = Constructors.NewProductFilter();
      pf2.AddProduct(product);
      int existingCount = queue.CountProductMatching(pf2);

      ipiQueue.SetInitialAmount(existingCount);
      //ipiQueue.queue = queue;
      //ipiQueue.queueSize = queue.GetQueueSize();
      //ipiQueue.initialAmount = existingCount;
      //ipiQueue.waybillRemain = 0;
      //ipiQueue.waybillIssuePercent = 80;
      ipicCollection[productIndex].queues[ipicCollection[productIndex].queues.size()] = ipiQueue;
    }
    else
    {
      //Interface.Log("* Queue already exists@!, not creating new.");
    }

    //Log.DetailLogEnd();
  }


  //=============================================================================
  // Name: SetProductQueueInitialAmount
  // Desc: Finds the specified queue and updates the "initial" amount on it.
  //=============================================================================
  public void SetProductQueueInitialAmount(BaseIndustry industry, Asset product, ProductQueue queue, int amount)
  {
    int productIndex = GetProductIndex(product);
    if (productIndex > -1)
    {
      int queueIndex = GetQueueIndex(productIndex, queue);
      if (queueIndex > -1)
      {
        ipicCollection[productIndex].queues[queueIndex].SetInitialAmount(amount);

        industry.SetQueueInitialCount(queue, product, amount);
        //queue.DestroyAllProducts();
        //queue.CreateProduct(product, amount);
      }
    }
  }


  //=============================================================================
  // Name: RemoveQueueFromProduct
  // Desc: Removes/destroys the specified product queue.
  //=============================================================================
  public void RemoveQueueFromProduct(Asset product, ProductQueue queue)
  {
    // Destroy the products
    ProductFilter pf = Constructors.NewProductFilter();
    pf.AddProduct(product);
    queue.DestroyProductMatching(pf, queue.CountProductMatching(pf));

    // Destroy the filter for the products
    pf = Constructors.NewProductFilter();
    pf.CopyFilter(queue.GetProductFilter());
    pf.RemoveProduct(product);
    queue.SetProductFilter(pf);

    // Remove this queue from the product
    int productIndex = GetProductIndex(product);
    if (productIndex > -1)
    {
      ipicCollection[productIndex].RemoveQueue(FindIPICQueue(queue));
    }

  }


  //=============================================================================
  // Name: SortStringArray
  // Desc: Alphabetically sorts the passed string array.
  //=============================================================================
  public void SortStringArray(string[] retList)
  {
    int k;
    int kx;
    for (k = 0; k < retList.size(); ++k)
    {
      for (kx = k + 1; kx < retList.size(); ++kx)
      {
        if (retList[k] > retList[kx])
        {
          string tmp = retList[kx];
          retList[kx] = retList[k];
          retList[k] = tmp;
        }
      }
    }
  }


  //=============================================================================
  // Name: AddProcessToProduct
  // Desc: Adds a blank "process" with the specific asset and name.
  //=============================================================================
  public IndustryProductInfoProcess AddProcessToProduct(Asset product, string processName)
  {
    //Log.DetailLogStart("AddProcessToProduct", "IndustryProductInfoCollection");
    IndustryProductInfoProcess ipiProcess;
    // Ensure this process and product exists in the collection.
    int productIndex = GetProductIndex(product);
    if (productIndex == -1)
    {
      //Log.DetailLog("// Product " + product.GetLocalisedName() + " did not exist, Adding");
      AddProduct(product, null);
      productIndex = GetProductIndex(product);
    }

    int processIndex = GetProcessIndex(productIndex, processName);
    if (processIndex == -1)
    {
      //Log.DetailLog("// Process " + processName + " did not exist, Adding");
      // Queue doesn't exist, so its okay to add it.
      ipiProcess = new IndustryProductInfoProcess();
      ipiProcess.Init(ipicCollection[productIndex], FindIPICProcess(processName));

      //ipiProcess.name = processName;
      ipiProcess.SetProcessDuration(30);

      if (m_industry)
        ipiProcess.SetProcessEnabled(m_industry.GetProcessEnabled(processName));
      else
        ipiProcess.SetProcessEnabled(true);

      ipiProcess.SetInputQueue(null);
      ipiProcess.SetInputAmount(0);

      ipiProcess.SetOutputQueue(null);
      ipiProcess.SetOutputAmount(0);

      ipicCollection[productIndex].processes[ipicCollection[productIndex].processes.size()] = ipiProcess;
    }
    else
    {
      //Log.DetailLog("// Process " + processName + " exists, using that instead.");
      ipiProcess = ipicCollection[productIndex].processes[GetProcessIndex(productIndex, processName)];
    }

    //Log.DetailLogEnd();
    return ipiProcess;
  }


  //=============================================================================
  // Name: SyncQueuesToProducts
  // Desc: Ensures that script configured products have equivalent state in
  //       native code.
  //=============================================================================
  public void SyncQueuesToProducts()
  {
    //Log.DetailLogStart("SyncQueuesToProducts", "IndustryProductInfoCollection");

    int i;
    int k;

    //Log.DetailLog("ipicCollection.size()", (string)ipicCollection.size());
    for (k = 0; k < ipicCollection.size(); k++)
    {
      //Log.DetailLog("ipicCollection[k].queues.size()", (string)ipicCollection[k].queues.size());
      for (i = 0; i < ipicCollection[k].queues.size(); i++)
      {
        ProductQueue queue = ipicCollection[k].queues[i].GetProductQueue();

        //Log.DetailLog("queue", queue.GetQueueName());

        ProductFilter pf = Constructors.NewProductFilter();
        pf.CopyFilter(queue.GetProductFilter());
        pf.AddProduct(ipicCollection[k].GetProduct());
        queue.SetProductFilter(pf);
        queue.CreateProduct(ipicCollection[k].GetProduct(), ipicCollection[k].queues[i].GetInitialAmount());

      }
    }

    //Log.DetailLogEnd();
  }


  //=============================================================================
  // Name: InitFromAsset
  // Desc: This loads the immutable data from the game state.
  //=============================================================================
  public void InitFromAsset(void)
  {
    //Log.DetailLogStart("InitFromAsset", "IndustryProductInfoCollection");
    m_inInitFromAsset = true;

    int i;


    // Init the Tracks
    string[] temp = new string[0];
    string[] trackNames = new string[0];
    if (m_industry)
    {
      m_industry.AppendDriverDestinations(temp, trackNames);

      m_tracks = new IPICTrack[trackNames.size()];
      if (trackNames)
      {
        for (i = 0; i < trackNames.size(); i++)
        {
          //Log.DetailLog("trackNames[" + i + "]", trackNames[i]);
          m_tracks[i] = new IPICTrack();
          m_tracks[i].Init(me, trackNames[i]);
        }
      }

      // Init the queus
      ProductQueue[] queues = m_industry.GetQueues();
      m_queues = new IPICQueue[queues.size()];
      if (queues)
      {
        for (i = 0; i < queues.size(); i++)
        {
          //Log.DetailLog("queues[" + i + "]", queues[i].GetQueueName());
          m_queues[i] = new IPICQueue();
          m_queues[i].Init(me, queues[i]);
        }
      }

      // Init the processes
      string[] processes = m_industry.GetProcessNameList();
      m_processes = new IPICProcess[processes.size()];
      if (processes)
      {
        for (i = 0; i < processes.size(); i++)
        {
          //Log.DetailLog("processes[" + i + "]", processes[i]);
          m_processes[i] = new IPICProcess();
          m_processes[i].Init(me, processes[i]);
        }
      }

    } // if (m_industry)


    if (m_vehicle)
    {
      // Init the queus
      ProductQueue[] queues = m_vehicle.GetQueues();
      m_queues = new IPICQueue[queues.size()];
      if (queues)
      {
        for (i = 0; i < queues.size(); i++)
        {
          //Log.DetailLog("queues[" + i + "]", queues[i].GetQueueName());
          m_queues[i] = new IPICQueue();
          m_queues[i].Init(me, queues[i]);
        }
      }
    } // if (m_vehicle)

    m_inInitFromAsset = false;

    //Log.DetailLogEnd();


    // Ensure this isn't a vehicle, or something else that hasn't set the industry.
    if (m_industry)
    {
      //Log.DetailLog("// Newly created industry. Adding Queues to Product");
      // this is a newly created industry-
      // read the initial settings from the config file
      ProductQueue[] queues = m_industry.GetQueues();

      int k;

      // Loop through the queues, and add these products, along with the queue values
      //Log.DetailLog("queues.size()", (string)queues.size());
      for (i = 0; i < queues.size(); i++)
      {
        ProductFilter pf = queues[i].GetProductFilter();
        Asset[] products = pf.GetProducts();
        ProductQueue queue = queues[i];
        for (k = 0; k < products.size(); k++)
        {
          AddQueueToProduct(products[k], queue);

          ProductFilter pf = Constructors.NewProductFilter();
          pf.AddProduct(products[k]);
          int initialValue = queue.CountProductMatching(pf);

          int productIndex = GetProductIndex(products[k]);
          int queueIndex = GetQueueIndex(productIndex, queue);
          //Log.DetailLog("initialAmount", (string)initialValue);

          ipicCollection[productIndex].queues[queueIndex].SetInitialAmount(initialValue);
        }
      }

      // Create the processes.
      string[] processes = m_industry.GetProcessNameList();
      //Log.DetailLog("processes.size()", (string)processes.size());
      for (i = 0; i < processes.size(); ++i)
      {
        string processName = processes[i];
        //Log.DetailLog("processName", processName);
        for (k = 0; k < 99999999; k++)
        {
          // Now that we have setup the process, we shall assign it to the correct product
          Asset inProduct = m_industry.GetProcessIOProduct( processName, true, k );
          Asset outProduct = m_industry.GetProcessIOProduct( processName, false, k );

          // Cache the info first, then set it, because the set functions clear the variables.
          int duration = m_industry.GetProcessDuration(processName);
          bool enabled = m_industry.GetProcessEnabled(processName);

          // Final check just in case, some fatal failure
          if (inProduct)
          {
            IPICQueue ipicINQueue = FindIPICQueue(m_industry.GetProcessIOQueue( processName, true, k ));
            int inAmount = m_industry.GetProcessIOAmount( processName, true, k );

            IndustryProductInfoProcess inIpip = AddProcessToProduct(inProduct, processName);

            //Log.DetailLog("inProduct.GetLocalisedName()", inProduct.GetLocalisedName());

            IndustryProductInfoComplete ipic = AddProduct(inProduct, null);
            inIpip.Init(ipic, FindIPICProcess(processName));

            IPICProcess ipicProcess = inIpip.GetIPICProcess();

            ipicProcess.SetDuration(duration);
            ipicProcess.SetEnabled(enabled); // Perhaps use GetProcessStarted?
            //inIpip.SetInputQueue( ipicINQueue );
            //inIpip.SetInputAmount( inAmount );
            inIpip.SetUiIsExpanded(true, true);
            //inIpip.SetVisibleInSurveyor(true, true);

            //Log.DetailLog("// Add process with Input to process listing");
            //ipic.processes[ipic.processes.size()] = inIpip;
          }

          if (outProduct)
          {
            IPICQueue ipicOUTQueue = FindIPICQueue(m_industry.GetProcessIOQueue( processName, false, k ));
            int outamount = m_industry.GetProcessIOAmount( processName, false, k );

            // Cache the info first, then set it, because the set functions clear the variables.

            IndustryProductInfoProcess outIpip = AddProcessToProduct(outProduct, processName);

            //Log.DetailLog("outProduct.GetLocalisedName()", outProduct.GetLocalisedName());

            IndustryProductInfoComplete ipic = AddProduct(outProduct, null);
            outIpip.Init(ipic, FindIPICProcess(processName));

            IPICProcess ipicProcess = outIpip.GetIPICProcess();

            ipicProcess.SetDuration(duration);
            ipicProcess.SetEnabled(enabled); // Perhaps use GetProcessStarted?
            //outIpip.SetOutputQueue( ipicOUTQueue );
            //outIpip.SetOutputAmount( outamount );
            outIpip.SetUiIsExpanded(false, true);
            //outIpip.SetVisibleInSurveyor(false, true);

            //Log.DetailLog("// Add process with Output to process listing");
            //ipic.processes[ipic.processes.size()] = outIpip;
          }

          if (!inProduct and !outProduct)
            break;
        }
      } // for (i = 0; i < processes.size(); ++i)

    } // if (m_industry)

    // Ensure this isn't a vehicle, or something else that hasn't set the industry.
    if (m_vehicle)
    {
      //Log.DetailLog("// Newly created industry. Adding Queues to Product");
      // this is a newly created industry-
      // read the initial settings from the config file
      ProductQueue[] queues = m_vehicle.GetQueues();

      int k;

      // Loop through the queues, and add these products, along with the queue values
      //Log.DetailLog("queues.size()", (string)queues.size());
      for (i = 0; i < queues.size(); ++i)
      {
        ProductFilter pf = queues[i].GetProductFilter();
        Asset[] products = pf.GetProducts();
        ProductQueue queue = queues[i];
        for (k = 0; k < products.size(); ++k)
        {
          AddQueueToProduct(products[k], queue);

          ProductFilter pf = Constructors.NewProductFilter();
          pf.AddProduct(products[k]);
          int initialValue = queue.CountProductMatching(pf);

          int productIndex = GetProductIndex(products[k]);
          int queueIndex = GetQueueIndex(productIndex, queue);
          //Log.DetailLog("initialAmount", (string)initialValue);

          ipicCollection[productIndex].queues[queueIndex].SetInitialAmount(initialValue);
        }

      } // for (i = 0; i < queues.size(); ++i)

    } // if (m_vehicle)

  }


  //=============================================================================
  // Name: IsInInitFromAsset
  // Desc: Returns whether InitFromAsset() is currently running.
  //=============================================================================
  public bool IsInInitFromAsset(void)
  {
    return m_inInitFromAsset;
  }


  //=============================================================================
  // Name: SetProperties
  // Desc: Restores the state of this object using a soup generated by a previous
  //       call to GetProperties().
  //=============================================================================
  public void SetProperties(Soup soup, BaseIndustry genIndustry)
  {
    //Log.DetailLogStart("SetProperties", "IndustryProductInfoCollection");
    int k = 0;
    int i = 0;
    int l = 0;

    int productCount;
    productCount = soup.GetNamedTagAsInt("BaseIndustry.ipicCollectionSize");
    if (!soup.CountTags() or productCount == 0)
      return;

    // Clear the queues and process so that we have a clean slate.
    ProductQueue[] queues = genIndustry.GetQueues();
    for (i = 0; i < queues.size(); ++i)
      queues[i].DestroyAllProducts();

    // Note: Calling ClearProcess() clears all queued inputs and outputs, but
    // it does not affect the progress on any partially complete processes.
    string[] processes = genIndustry.GetProcessNameList();
    for (i = 0; i < processes.size(); ++i)
      genIndustry.ClearProcess(processes[i]);

    // Read the settings in from the soup

    // Kill the existing array.
    genIndustry.industryProductInfoCollection.ipicCollection = new IndustryProductInfoComplete[0];

    productCount = soup.GetNamedTagAsInt("BaseIndustry.ipicCollectionSize");
    for (k = 0; k < productCount; k++)
    {
      Soup productSoup = soup.GetNamedSoup("BaseIndustry.ipicCollection" + (string)k);
      KUID kuid = productSoup.GetNamedTagAsKUID("Product.productKUID");
      Asset productAsset = World.FindAsset(kuid);
      if (!productAsset)
      {
        Interface.Log("IndustryProductInfoCollection.SetProperties> missing product asset " + kuid.GetLogString());
        continue;
      }

      IndustryProductInfoComplete ipic = new IndustryProductInfoComplete();
      ipic.Init(me);
      ipic.processes = new IndustryProductInfoProcess[0];
      ipic.tracks = new IndustryProductInfoTracks[0];
      ipic.queues = new IndustryProductInfoQueues[0];

      ipic.SetProduct(productAsset);

      string tmpVehicle = productSoup.GetNamedTag("Product.vehicleKUID");
      if (tmpVehicle != "None")
        kuid = productSoup.GetNamedTagAsKUID("Product.vehicleKUID");
      else
        kuid = null;

      ipic.SetVehicleKUID(kuid);
      ipic.SetPerVehicleAmount(productSoup.GetNamedTagAsInt("Product.perVehicleAmount"));
      ipic.SetDisplayType(productSoup.GetNamedTagAsInt("Product.displayType"));
      //ipic.showInViewDetails = productSoup.GetNamedTagAsInt("Product.showInViewDetails");
      ipic.uiIsExpanded = productSoup.GetNamedTagAsInt("Product.uiIsExpanded");


      // Read each of the queues
      int count = productSoup.GetNamedTagAsInt("Queues.Size");
      for (i = 0; i < count; ++i)
      {
        Soup queueSoup = productSoup.GetNamedSoup("Queues" + (string)i);

        string queueName = queueSoup.GetNamedTag("Queue.queueName");
        ProductQueue queue = genIndustry.GetQueue(queueName);
        if (!queue)
        {
          Interface.Exception("SetProperties> Queue '" + queueName + "' not found in " + genIndustry.GetLocalisedName());
          continue;
        }

				IndustryProductInfoQueues ipiq = new IndustryProductInfoQueues();
				ipiq.Init(ipic, FindIPICQueue(queue));

				ipiq.SetQueueSize(queueSoup.GetNamedTagAsInt("Queue.queueSize"));
				ipiq.SetInitialAmount(queueSoup.GetNamedTagAsInt("Queue.initialAmount"));
				ipiq.SetQueueWaybillRemain(queueSoup.GetNamedTagAsInt("Queue.waybillRemain"));
				ipiq.SetQueueWaybillIssuePercent(queueSoup.GetNamedTagAsInt("Queue.waybillIssuePercent"));

        ipic.queues[ipic.queues.size()] = ipiq;

      } // for (i = 0; i < count; ++i)


      // Read each of the tracks
      count = productSoup.GetNamedTagAsInt("Tracks.Size");
      for (i = 0; i < count; ++i)
      {
        Soup trackSoup = productSoup.GetNamedSoup("Tracks" + (string)i);
        IndustryProductInfoTracks ipit = new IndustryProductInfoTracks();

        string trackName = trackSoup.GetNamedTag("Track.trackName");
        ipit.Init(ipic, FindIPICTrack(trackName));

        int queueIndex = trackSoup.GetNamedTagAsInt("Track.queueIndex");
        ipit.SetIPICQueue(ipic.GetIPICQueueByIndex(queueIndex));

        ipit.mode = trackSoup.GetNamedTag("Track.mode");
        ipit.uiIsExpanded = trackSoup.GetNamedTagAsInt("Track.uiIsExpanded");

        ipic.tracks[ipic.tracks.size()] = ipit;

      } // for (i = 0; i < count; ++i)


      // Read each of the processes
      count = productSoup.GetNamedTagAsInt("Processes.Size");
      for (i = 0; i < count; ++i)
      {
        Soup processSoup = productSoup.GetNamedSoup("Processes" + (string)i);
        IndustryProductInfoProcess ipip = new IndustryProductInfoProcess();

        string processName = processSoup.GetNamedTag("Process.name");
        ipip.Init(ipic, FindIPICProcess(processName));

        ipip.SetProcessDuration(processSoup.GetNamedTagAsInt("Process.duration"));
        ipip.SetProcessEnabled(processSoup.GetNamedTagAsInt("Process.startEnabled"));

        ipip.SetInputQueue( ipic.GetIPICQueueByIndex( processSoup.GetNamedTagAsInt("Process.inQueueIndex", -1) ));
        ipip.SetInputAmount( processSoup.GetNamedTagAsInt("Process.inAmount") );
        //ipip.inUse = processSoup.GetNamedTagAsInt("Process.inUse");
        ipip.SetUiIsExpanded(true, processSoup.GetNamedTagAsInt("Process.inUiIsExpanded"));
        ipip.SetVisibleInSurveyor(true, processSoup.GetNamedTagAsBool("Process.inVisibleInSurveyor", true));
        ipip.SetVisibleInViewDetails(true, processSoup.GetNamedTagAsBool("Process.inVisibleInViewDetails", true));
        //if (ipip.inUse)
        //  genIndustry.SetProcessInput(ipip.name, ipic.queues[ipip.inQueueIndex].queue, ipic.product, ipip.inAmount);

        ipip.SetOutputQueue( ipic.GetIPICQueueByIndex( processSoup.GetNamedTagAsInt("Process.outQueueIndex", -1) ));
        ipip.SetOutputAmount( processSoup.GetNamedTagAsInt("Process.outAmount") );
        //ipip.outUse = processSoup.GetNamedTagAsInt("Process.outUse");
        ipip.SetUiIsExpanded(false, processSoup.GetNamedTagAsInt("Process.outUiIsExpanded"));
        ipip.SetVisibleInSurveyor(false, processSoup.GetNamedTagAsBool("Process.outVisibleInSurveyor", true));
        ipip.SetVisibleInViewDetails(false, processSoup.GetNamedTagAsBool("Process.outVisibleInViewDetails", true));
        //if (ipip.outUse)
        //  genIndustry.SetProcessOutput(ipip.name, ipic.queues[ipip.outQueueIndex].queue, ipic.product, ipip.outAmount);

        //genIndustry.SetProcessEnabled(ipip.name, ipip.startEnabled);

        ipic.processes[ipic.processes.size()] = ipip;

      } // for (i = 0; i < count; ++i)


      // Now that we have all the details loaded in, ensure the process has been cleaned out and reset.
      genIndustry.industryProductInfoCollection.ipicCollection[genIndustry.industryProductInfoCollection.ipicCollection.size()] = ipic;

    } // for (k = 0; k < productCount; k++)



    // Now go through again, and make sure the queues are up-to-date.
    for (k = 0; k < genIndustry.industryProductInfoCollection.ipicCollection.size(); ++k)
    {
      IndustryProductInfoComplete ipic = genIndustry.industryProductInfoCollection.ipicCollection[k];
      for (i = 0; i < ipic.queues.size(); ++i)
      {
        ProductFilter pf = Constructors.NewProductFilter();
        ipic.queues[i].GetProductQueue().SetProductFilter(pf);
      }
    }

    for (k = 0; k < genIndustry.industryProductInfoCollection.ipicCollection.size(); ++k)
    {
      IndustryProductInfoComplete ipic = genIndustry.industryProductInfoCollection.ipicCollection[k];

      for (i = 0; i < ipic.queues.size(); ++i)
      {
        if (ipic.queues[i].GetProductQueue())
        {
          // Ensure the product filter is blank...
          ProductFilter pf = Constructors.NewProductFilter();
          pf.CopyFilter(ipic.queues[i].GetProductQueue().GetProductFilter());
          pf.AddProduct(ipic.GetProduct());

          ipic.queues[i].GetProductQueue().SetProductFilter(pf);
          // TODO: do we need to create an initial amount?
          //queue.CreateProduct(product, 1);
        }
      }

      for (i = 0; i < ipic.processes.size(); ++i)
      {
        for (l = 0; l < ipic.queues.size(); ++l)
        {
          // Do we need to set this?
          if (ipic.processes[i].DoesUseInput() and ipic.processes[i].GetInputQueue() == ipic.queues[l].GetIPICQueue())
            genIndustry.SetProcessInput(ipic.processes[i].GetProcessName(), ipic.queues[l].GetProductQueue(), ipic.GetProduct(), ipic.processes[i].GetInputAmount());
          if (ipic.processes[i].DoesUseOutput() and ipic.processes[i].GetOutputQueue() == ipic.queues[l].GetIPICQueue())
            genIndustry.SetProcessOutput(ipic.processes[i].GetProcessName(), ipic.queues[l].GetProductQueue(), ipic.GetProduct(), ipic.processes[i].GetOutputAmount());
        }
      }
    } // for (k = 0; k < genIndustry.industryProductInfoCollection.ipicCollection.size(); ++k)

    //Log.DetailLogEnd();
  }


  //=============================================================================
  // Name: GetProperties
  // Desc: Saves this object state to the Soup passed, such that it can be
  //       restored with a later call to SetProperties().
  //=============================================================================
  public void GetProperties(Soup soup, BaseIndustry genIndustry)
  {
    //Log.DetailLogStart("GetProperties", "IndustryProductInfoCollection");

    int k = 0;
    int i = 0;


    soup.SetNamedTag("BaseIndustry.ipicCollectionSize", genIndustry.industryProductInfoCollection.ipicCollection.size());

    // For each ipic collection
    for (k = 0; k < genIndustry.industryProductInfoCollection.ipicCollection.size(); ++k)
    {
      IndustryProductInfoComplete ipic = genIndustry.industryProductInfoCollection.ipicCollection[k];

      // Save the basic product infor (kuid, amount, type, etc)
      Soup productSoup = Constructors.NewSoup();
      productSoup.SetNamedTag("Product.productKUID", ipic.GetProduct().GetKUID());
      if (ipic.GetVehicleKUID())
      {
        if (ipic.GetVehicleKUID())
          productSoup.SetNamedTag("Product.vehicleKUID", ipic.GetVehicleKUID());
        else
          productSoup.SetNamedTag("Product.vehicleKUID", "None");
      }
      else
      {
        productSoup.SetNamedTag("Product.vehicleKUID", "None");
      }

      productSoup.SetNamedTag("Product.perVehicleAmount", ipic.GetPerVehicleAmount());
      productSoup.SetNamedTag("Product.displayType", ipic.GetDisplayType());
      //productSoup.SetNamedTag("Product.showInViewDetails", ipic.showInViewDetails);
      productSoup.SetNamedTag("Product.uiIsExpanded", ipic.uiIsExpanded);


      // Save each of the processes
      productSoup.SetNamedTag("Processes.Size", ipic.processes.size());
      for (i = 0; i < ipic.processes.size(); ++i)
      {
        Soup processSoup = Constructors.NewSoup();
        IndustryProductInfoProcess ipip = ipic.processes[i];

        processSoup.SetNamedTag("Process.name", ipip.GetProcessName());
        //Log.DetailLog("ipip.Name", ipip.GetProcessName());
        processSoup.SetNamedTag("Process.duration", ipip.GetIPICProcess().GetDuration());
        processSoup.SetNamedTag("Process.startEnabled", ipip.GetIPICProcess().GetEnabled());

        processSoup.SetNamedTag("Process.inAmount", ipip.GetInputAmount());
        //Log.DetailLog("ipip.inAmount", ipip.GetInputAmount());
        processSoup.SetNamedTag("Process.inQueueIndex", ipic.GetIndexByIPICQueue(ipip.GetInputQueue()));
        processSoup.SetNamedTag("Process.inUse", ipip.DoesUseInput());
        processSoup.SetNamedTag("Process.inUiIsExpanded", ipip.GetUiIsExpanded(true));
        processSoup.SetNamedTag("Process.inVisibleInSurveyor", ipip.GetVisibleInSurveyor(true));
        processSoup.SetNamedTag("Process.inVisibleInViewDetails", ipip.GetVisibleInViewDetails(true));

        processSoup.SetNamedTag("Process.outAmount", ipip.GetOutputAmount());
        //Log.DetailLog("ipip.outAmount", ipip.GetOutputAmount());
        processSoup.SetNamedTag("Process.outQueueIndex", ipic.GetIndexByIPICQueue(ipip.GetOutputQueue()));
        processSoup.SetNamedTag("Process.outUse", ipip.DoesUseOutput());
        processSoup.SetNamedTag("Process.outUiIsExpanded", ipip.GetUiIsExpanded(false));
        processSoup.SetNamedTag("Process.outVisibleInSurveyor", ipip.GetVisibleInSurveyor(false));
        processSoup.SetNamedTag("Process.outVisibleInViewDetails", ipip.GetVisibleInViewDetails(false));

        productSoup.SetNamedSoup("Processes" + (string)i, processSoup);

      } // for (i = 0; i < ipic.processes.size(); ++i)


      // Save each of the tracks
      productSoup.SetNamedTag("Tracks.Size", ipic.tracks.size());
      for (i = 0; i < ipic.tracks.size(); ++i)
      {
        Soup trackSoup = Constructors.NewSoup();
        IndustryProductInfoTracks ipit = ipic.tracks[i];

        trackSoup.SetNamedTag("Track.trackName", ipit.GetTrackName());
        trackSoup.SetNamedTag("Track.queueIndex", ipic.GetIndexByIPICQueue(ipit.GetIPICQueue()));
        trackSoup.SetNamedTag("Track.mode", ipit.mode);
        trackSoup.SetNamedTag("Track.uiIsExpanded", ipit.uiIsExpanded);

        productSoup.SetNamedSoup("Tracks" + (string)i, trackSoup);

      } // for (i = 0; i < ipic.tracks.size(); ++i)


      // Save each of the queues
      productSoup.SetNamedTag("Queues.Size", ipic.queues.size());
      for (i = 0; i < ipic.queues.size(); ++i)
      {
        IndustryProductInfoQueues ipiq = ipic.queues[i];

        Soup queueSoup = Constructors.NewSoup();
        queueSoup.SetNamedTag("Queue.queueName", ipiq.GetProductQueue().GetQueueName());
				queueSoup.SetNamedTag("Queue.queueSize", ipiq.GetQueueSize());
				queueSoup.SetNamedTag("Queue.initialAmount", ipiq.GetInitialAmount());
				queueSoup.SetNamedTag("Queue.waybillRemain", ipiq.GetIPICQueue().GetWaybillRemain());
				queueSoup.SetNamedTag("Queue.waybillIssuePercent", ipiq.GetIPICQueue().GetWaybillIssuePercent());

        productSoup.SetNamedSoup("Queues" + (string)i, queueSoup);
      }


      soup.SetNamedSoup("BaseIndustry.ipicCollection" + (string)k, productSoup);

    } // for (k = 0; k < genIndustry.industryProductInfoCollection.ipicCollection.size(); ++k)

    //Log.DetailLogEnd();
  }


};





