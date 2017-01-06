//
// ProductQueue.gs
//
//  Copyright (C) 2002-2003 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "ProductFilter.gs"


//! A queue of products.
//
// A product queue is not an asset in itself, rather other assets can have queues contained in them.
// Any asset that uses a class derived from MapObject can have queues.  This includes Industry and 
// Vehicle for example.
//
// See Also:
//     Asset, Industry, LoadingReport, MapObject, MapObject::GetQueues(), ProductFilter, Vehicle
//
game class ProductQueue isclass GSObject
{
	//! Gets the maximum size of this queue.
	//
	// The size limits the maximum value of the queue's count (i.e. how many products it can contain
	// when full).
	//
	// Returns: 
	//     Return this queue's size as specified in the asset's configuration.
	//
	public native int GetQueueSize(void);

	//! Sets the maximum size of this queue.
	//
	// This method allows the maximum queue size to be changed dynamically from script code.
	//
	// Param:  queueSize  Maximum amount of products this queue can hold.
	//
	public native void SetQueueSize(int queueSize);

	//! Gets the per hour read in from the config file.
	//
	// This method returns the per hour value stored in the config file for a station.
	//
	// Returns: 
	//     Return this queue's size as specified in the asset's configuration.
	//
	public native int GetQueuePerHour(void);

	//! Sets the maximum size of this queue.
	//
	// This method allows the maximum queue size to be changed dynamically from script code.
	//
	// Param:  queueSize  Maximum amount of products this queue can hold.
	//
	public native void SetQueuePerHour(int queueSize);

	//! Gets the amount of space left in this queue (i.e. GetQueueSize() - GetQueueCount()).
	//
	// Returns:
	//     Returns the amount of space left in this queue 
	//
	public native int GetQueueSpace(void);

	//! Gets the amount of product items in this queue.
	//
	// Returns:
	//     Return the total amount of products currently in this queue.
	//
	public int GetQueueCount(void);

	//! Gets the name of this queue.
	//
	// Gets the text name of this queue as defined in the asset's configuration.
	//
	// Returns:
	//     Returns the name of this queue.
	//
	public native string GetQueueName(void);


	//! Gets the amount of products in this queue that match the given filter.
	//
	// Param:  filter  Filter that specified products to include in the count.  If null, all products
	//                 will be included.
	//
	// Returns:
	//     Returns the amount of products in this queue that match <i filter>.
	//
	public native int CountProductMatching(ProductFilter filter);


	//! Transfer products from the given queue to this queue.
	//
	// Only products matching the specified filter are transferred.  A null filter matches all
	// products.  No more than <i maximumToTransfer> products are transferred.
	//
	// Param:  fromQueue          Queue to transfer products from.
	// Param:  matchingFilter     Filter to apply to <i fromQueue> for the transfer.
	// Param:  maximumToTransfer  Maximum amount of product items allowed to be transferred.
	// Param:  performTransfer    Flag indicating whether to perform the actual transfer.  If false,
	//                            the transfer isn't carried out but the correct results are still
	//                            returned.
	//
	// Returns:
	//     Returns the actual amount of product transferred.
	//
	public native int TransferProductFrom(ProductQueue fromQueue, ProductFilter matchingFilter, int maximumToTransfer, bool performTransfer);


	//! Remove products from this queue using a filter.
	//
	// Param:  filter            Filter that defines what products to remove.  If null, all products
	//                           will be matched.
	// Param:  maximumToDestroy  Maximum amount of the products that can be destroyed.
	//
	// Returns:
	//     Returns the amount of products destroyed.
	//
	public native int DestroyProductMatching(ProductFilter filter, int maximumToDestroy);

	//! Creates the specified amount of the given product for this queue.
	//
	// If there isn't enough room in the queue, it will be filled up with as many products as possible
	// and the actual amount added will be returned.
	//
	// Param:  product       Type of product to create.
	// Param:  maximumToAdd  Maximum amount of the product to add.
	//
	// Returns:
	//     Returns the actual amount of products created.
	//
	public native int CreateProduct(Asset product, int maximumToAdd);


	//! Gets the product filter as defined in this queue's asset configuration.
	//
	// Returns:
	//     Returns the ProductFilter as defined in the configuration.  This filter will be returned in
	//     a locked state as it is defined as part of the asset.
	//
	public native ProductFilter GetProductFilter(void);

	//! Sets the product filter for this queue to a copy of the specified filter.
	//
	// This method will set the <i filter> parameter object to be a clone of this queue's filter.
	//
	// Param:  filter  ProductFilter to copy to.
	//
	public native void SetProductFilter(ProductFilter filter);

	//! Gets the list of product types that are currently present in this queue.
	//
	// Returns:
	//     Returns an array of product types that are currently present in this queue.
	//
	public native Asset[] GetProductList(void);

	//! Gets the product category that is currently in this queue.
	//
	// Returns:
	//     Returns the product category that is currently present in this queue, null if there are no
	//     products present.
	//
	public native Asset GetProductCategory(void);

	//! Removes all products from this queue making it empty.
	//
	// Returns:
	//     Returns the amount of products removed.
	//
	public int DestroyAllProducts(void);


	//
	// IMPLEMENTATION
	//

	public int GetQueueCount(void)
	{
		return CountProductMatching(null);
	}

	public int DestroyAllProducts(void)
	{
		return DestroyProductMatching(null, CountProductMatching(null));
	}
};


