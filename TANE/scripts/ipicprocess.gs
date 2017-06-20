//
// IPICProcess.gs
//
//  Copyright (C) 2004 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "IPICProcess.gs"
include "IPICQueue.gs"
include "IndustryProductInfoComplete.gs"
include "IndustryProductInfoCollection.gs"


//! Information class that describes an industry process and its attributes.
//
// This class defines a process in an industry.  It is mainly used by the IndustryProductInfoCollection class.
//
// Useful interface methods of this class are:
//  - public void                           <b Init>            (IndustryProductInfoCollection ipic, string processName)
//  - public bool                           <b GetEnabled>      ()
//  - public void                           <b SetEnabled>      (bool enabled)
//  - public float                          <b GetDuration>     ()
//  - public void                           <b SetDuration>     (float duration)
//  - public string                         <b GetProcessName>  ()
//  - public IndustryProductInfoCollection  <b GetIndustryProductInfoCollection>  ()
//
// Note:
//     This class is not a part of the core %Trainz API and isn't fully documented.  The full class definition
//     and implementation however can be found in the <b \Trainz\scripts\IPICProcess.gs> script file.
//
// See Also:
//     IndustryProductInfoCollection, IndustryProductInfoProcess, IPICQueue, IPICTrack, 
//     IndustryProductInfoComplete, Industry::GetProcessNameList()
//
class IPICProcess
{
  public void Init(IndustryProductInfoCollection ipic, string processName);

  IndustryProductInfoProcess[] GetRelatedProducts(void);

  public bool GetEnabled(void);
  public void SetEnabled(bool enabled);

  public float GetDuration(void);
  public void SetDuration(float duration);

  //
  public string GetProcessName(void);

  public IndustryProductInfoCollection GetIndustryProductInfoCollection(void);

  //
  // VARIABLES
  //
  IndustryProductInfoCollection m_ipic;
  string m_processName;
  bool m_enabled;
  float m_duration;

  //
  // IMPLEMENTATION
  //


  public void Init(IndustryProductInfoCollection ipic, string processName)
  {
    //Log.DetailLogStart("Init", "IPICProcess");
    //Log.DetailLog("processName", processName);

    //if (!ipic)
    //  Log.DetailLog("// WARNING: ipic is NULL!");

    m_ipic = ipic;
    m_processName = processName;
    
    if (!ipic.IsInInitFromAsset())
      Interface.Exception("IPICProcess.Init> don't call this yourself");

    //Log.DetailLogEnd();
  }
  

  IndustryProductInfoProcess[] GetRelatedProducts(void)
  {
    IndustryProductInfoProcess[] ret = new IndustryProductInfoProcess[0];
    
    int i;
    for (i = 0; i < m_ipic.ipicCollection.size(); i++)
    {
      IndustryProductInfoComplete product = m_ipic.ipicCollection[i];

      int j;
      for (j = 0; j < product.processes.size(); j++)
      {
        IndustryProductInfoProcess processRelation = product.processes[j];
        if (processRelation.GetIPICProcess() == me)
          ret[ret.size()] = processRelation;
      }
    }

    return ret;
  }

  public bool GetEnabled(void)
  {
    return m_enabled;
  }

  public void SetEnabled(bool enabled)
  {
    //Log.DetailLogStart("SetEnabled", "IPICProcess");
    if (m_ipic.GetIndustry())
    {
      m_ipic.GetIndustry().SetProcessEnabled(GetProcessName(), enabled);
      m_enabled = enabled;
    }
    //else
    //  Log.DetailLog("// m_ipic.m_industry is NULL");
    //Log.DetailLogEnd();
  }

  public float GetDuration(void)
  {
    return m_duration;
  }

  public void SetDuration(float duration)
  {
    //Log.DetailLogStart("SetDuration", "IPICProcess");
    if (m_ipic.GetIndustry())
    {
      m_ipic.GetIndustry().SetProcessDuration(GetProcessName(), duration);
      m_duration = duration;
    }
    //else
    //  Log.DetailLog("// m_ipic.m_industry is NULL");
    //Log.DetailLogEnd();
  }

  public string GetProcessName(void)
  {
    return m_processName;
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

