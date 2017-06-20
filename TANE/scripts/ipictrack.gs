//
// IPICTrack.gs
//
//  Copyright (C) 2004 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "IPICProcess.gs"
include "IPICQueue.gs"
include "IndustryProductInfoComplete.gs"


//! Information class that describes a piece of track an in industry.
//
// This class defines a piece of track in an industry where a product transfer can take place.  It is mainly
// used by the IndustryProductInfoCollection class.
//
// Useful interface methods of this class are:
//  - public void                           <b Init>          (IndustryProductInfoCollection ipic, string trackName)
//  - public string                         <b GetTrackName>  ()
//  - public IndustryProductInfoCollection  <b GetIndustryProductInfoCollection>  ()
//
// Note:
//     This class is not a part of the core %Trainz API and isn't fully documented.  The full class definition
//     and implementation however can be found in the <b \Trainz\scripts\IPICTrack.gs> script file.
//
// See Also:
//     IndustryProductInfoCollection, IndustryProductInfoTracks, IPICProcess, IPICQueue,
//     IndustryProductInfoComplete, SceneryWithTrack::GetAttachedTrack()
//
class IPICTrack
{
  
  public void Init(IndustryProductInfoCollection ipic, string trackName);

  IndustryProductInfoTracks[] GetRelatedProducts(void);

  //
  public string GetTrackName(void);

  public IndustryProductInfoCollection GetIndustryProductInfoCollection(void);
  

  //
  // IMPLEMENTATION
  //
  IndustryProductInfoCollection m_ipic;
  string m_trackName;

  public void Init(IndustryProductInfoCollection ipic, string trackName)
  {
    m_ipic = ipic;
    m_trackName = trackName;
    
    if (!ipic.IsInInitFromAsset())
      Interface.Exception("IPICTrack.Init> don't call this yourself");
  }
  
  IndustryProductInfoTracks[] GetRelatedProducts(void)
  {
    IndustryProductInfoTracks[] ret = new IndustryProductInfoTracks[0];
    
    int i;
    for (i = 0; i < m_ipic.ipicCollection.size(); i++)
    {
      IndustryProductInfoComplete product = m_ipic.ipicCollection[i];

      int j;
      for (j = 0; j < product.tracks.size(); j++)
      {
        IndustryProductInfoTracks processRelation = product.tracks[j];
        if (processRelation.GetIPICTrack() == me)
          ret[ret.size()] = processRelation;
      }
    }

    return ret;
  }

  public string GetTrackName(void)
  {
    return m_trackName;
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

