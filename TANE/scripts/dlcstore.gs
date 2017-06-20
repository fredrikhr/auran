//=============================================================================
// File: DLCStore.gs
// Desc: Declares the classes for the in game content store
//=============================================================================
include "SecurityToken.gs"
include "KUID.gs"


//=============================================================================
// Name: DLCInfo
// Desc: Represents a single content package
//=============================================================================
final game class DLCInfo isclass GSObject
{

  //=============================================================================
  // Name: GeProductID
  // Desc: Returns a unique identifier for this product
  //=============================================================================
  public native string GetProductID();


  //=============================================================================
  // Name: GetLocalisedName
  // Desc: Returns a localised display name for this product
  //=============================================================================
  public native string GetLocalisedName();


  //=============================================================================
  // Name: GetLocalisedDescription
  // Desc: Returns a localised description for this product
  //=============================================================================
  public native string GetLocalisedDescription();


  //=============================================================================
  // Name: GetLocalisedPrice
  // Desc: Returns the cost of this product in a user-readable format
  //=============================================================================
  public native string GetLocalisedPrice();


  //=============================================================================
  // Name: GetIconPath
  // Desc: Returns the kuid for a small icon image, suitable for setting as a
  //       html img kuid param.
  //=============================================================================
  public native string GetIconPath();


  //=============================================================================
  // Name: GetThumbnailPath
  // Desc: Returns the kuid for a large thumbnail image, suitable for setting as
  //       a html img kuid param.
  //=============================================================================
  public native string GetThumbnailPath();

};



//=============================================================================
// Name: DLCStore
// Desc: The in game DLC store. Allows purchasing of content in game.
//
//       Posts the following messages:
//  | Message.major       | Message.minor                     | Destination
//  | DLCStore            | product-list-changed              | DLCStore
//  | DLCStore            | product-restore-succeeded         | DLCStore
//  | DLCStore            | product-restore-failed            | DLCStore
//  | DLCStore            | product-register-failed           | DLCStore
//  | DLCStoreTransaction | <product id>-<transaction status> | DLCStore
//    Where product id is identical to DLCInfo.GetProductID() and status is one
//    of the following: "unknown", "purchasing", "purchased", "failed"
//=============================================================================
final static class DLCStore isclass GameObject
{

  //=============================================================================
  // Name: GetProductList
  // Desc: Get the full list of purchasable content. Note that this does not
  //       include products that have been purchased by the player (regardless
  //       of whether they are locally installed).
  //=============================================================================
  public native DLCInfo[] GetProductList(SecurityToken token, GSObject caller);


  //=============================================================================
  // Name: GetProductInfo
  // Desc: Get the DLCInfo for a specific product
  //=============================================================================
  public native DLCInfo GetProductInfo(SecurityToken token, GSObject caller, string productId);


  //=============================================================================
  // Name: GetBestProductForKUID
  // Desc: Returns the best DLC package to purchase in order to obtain the asset
  //       passed. Where no dlc packages contain the requested asset an empty
  //       string will be returned.
  // Retn: string - The product id  of the dlc to purchase in order to unlock
  //       the requested asset, or an empty string if no products are found.
  //=============================================================================
  public native string GetBestProductForKUID(SecurityToken token, GSObject caller, KUID assetKuid);


  //=============================================================================
  // Name: IsPurchasingEnabled
  // Desc: Returns whether purchasing is enabled
  //=============================================================================
  public native bool IsPurchasingEnabled(SecurityToken token, GSObject caller);


  //=============================================================================
  // Name: SubmitPurchase
  // Desc: Submits a purchase to the store
  //=============================================================================
  public native void SubmitPurchase(SecurityToken token, GSObject caller, string productId);


  //=============================================================================
  // Name: RedownloadAllPurchases
  // Desc: Redownloads every product purchased by this player
  //=============================================================================
  public native void RedownloadAllPurchases(SecurityToken token, GSObject caller);

};

