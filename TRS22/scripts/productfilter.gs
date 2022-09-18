//
// ProductFilter.gs
//
//  Copyright (C) 2003 Auran Developments Pty Ltd
//  All Rights Reserved.
//

include "Asset.gs"
include "Soup.gs"
include "TrainzScript.gs"



//! Implements the filtering of products by Product asset or Product Category asset.
//
// Products that are not listed in the filter, and whose Product Category is not listed, are not
// accepted by this filter.
//
// Note:
//     Both products and product categories can be represented by an Asset object.
//
// See Also:
//     Asset, ProductQueue, Constructors::NewProductFilter()
//
game class ProductFilter isclass GSObject
{

	//! Clear out this filter so it is empty.
	public native void Clear(void);

	//! Makes this filter a copy of the specified filter. 
	//
	// This filter must not be locked.  The locked attribute of the specified filter is not copied.
	//
	// Param:  filter  Filter to clone properties from.
	//
	public native void CopyFilter(ProductFilter filter);

	//! Appends products and categories from another filter to this one.
	//
	// In order to use this method, this filter must not be locked.
	//
	// Param:  filter  Other filter to append to this one.
	//
	public native void AppendFilter(ProductFilter filter);

	//! Creates a filter that intersects between the given filter and this one.
	//
	// Param:  filter  Filter to generate an intersection with.
	//
	// Returns:
	//     Returns the intersection of the <i filter> argument and this one.
	//
	public native ProductFilter IntersectFilter(ProductFilter filter);

	//! Adds the given product to this filter.
	//
	// Param:  product  Product to add to this filter.
	//
	public native void AddProduct(Asset product);

	//! Removes the given product from this filter.
	//
	// Param:  product  Product to remove from this filter.
	//
	public native void RemoveProduct(Asset product);

	//! Adds the given product category to this filter.
	//
	// Param:  productCategory  Product category to add to this filter.
	//
	public native void AddProductCategory(Asset productCategory);

	//! Remove the given product category from this filter.
	//
	// Param:  productCategory  Product category to remove from this filter.
	//
	public native void RemoveProductCategory(Asset productCategory);

	//! Determines if this filter can accept the given product.
	//
	// Param:  product  Product to check against this filter.
	//
	// Returns:
	//    Returns true if this filter can accept <i product>, false otherwise.
	//
	public native bool DoesAcceptProduct(Asset product);

	//! Determines if this filter accepts products from the given category.
	//
	// Param:  productCategory  Product category to check against this filter accepts.
	//
	// Returns:
	//    Returns true if this filter accepts products from <i productCategory>, false otherwise.
	//
	public native bool DoesAcceptProductCategory(Asset productCategory);


	//! Gets the products that are accepted by this filter.
	// 
	// Returns:
	//     Returns an array of products that this filter accepts.
	//
	public native Asset[] GetProducts(void);

	//! Gets the product categories that are accepted by this filter.
	// 
	// Returns:
	//     Returns an array of product categories accepted by this filter.
	//
	public native Asset[] GetProductCategories(void);


	//! Determines if this filter is locked.
	// 
	// Returns:
	//    Returns true if this filter is locked, false otherwise.
	//
	public native bool IsLocked(void);


	//! Adds the filter properties from the given Soup to this filter.
	//
	// Param:  soup  Soup with products and product categories to be added to this filter.  This
	//               soup should be in the same format as that returned by GetAsSoup().
	//
	public void AddSoup(Soup soup);

	//! Gets the settings of this product filter as a Soup database.
	//
	// The returned Soup contains two sub-Soup databases named <n "ProductFilter.Products"> and
	// <n "ProductFilter.Categories">.  The products sub-database contains the KUIDs of all the 
	// products this filter currently allows where the tags of the KUIDs are named numerically
	// starting from "0".  The categories sub-database is arranged in the same way except it contains
	// the KUIDs of allowable product categories.
	//
	// Returns:
	//     Returns the settings of this product filter as a Soup object.
	//
	public Soup GetAsSoup(void);

	//! Determines if this filter is empty with no categories or products.
	//
	// Returns:
	//     Returns true if this filter is empty with no categories or products, false otherwise.
	//
	public bool IsEmpty(void);



	//
	// PRIVATE IMPLEMENTATION
	//
	public void AddSoup(Soup soup)
	{
		if (!soup)
			return;

		int i, count;
		
		Soup productsSoup = soup.GetNamedSoup("ProductFilter.Products");
		count = productsSoup.CountTags();
		if (count)
		{
			for (i = 0; i < count; i++)
			{
				KUID kuid = productsSoup.GetNamedTagAsKUID((string)i);
				Asset asset = TrainzScript.FindAsset(kuid);
				if (asset)
					AddProduct(asset);
			}
		}
		
		Soup categoriesSoup = soup.GetNamedSoup("ProductFilter.Categories");
		count = categoriesSoup.CountTags();
		if (count)
		{
			for (i = 0; i < count; i++)
			{
				KUID kuid = categoriesSoup.GetNamedTagAsKUID((string)i);
				Asset asset = TrainzScript.FindAsset(kuid);
				if (asset)
					AddProductCategory(asset);
			}
		}
	}



	public Soup GetAsSoup(void)
	{
		Soup soup = Constructors.NewSoup();

		int i, count;

		Asset[] products = GetProducts();
		count = products.size();
		if (count)
		{
			Soup productsSoup = Constructors.NewSoup();

			for (i = 0; i < count; i++)
				productsSoup.SetNamedTag((string)i, products[i].GetKUID());

			soup.SetNamedSoup("ProductFilter.Products", productsSoup);
		}

		Asset[] categories = GetProductCategories();
		count = categories.size();
		if (count)
		{
			Soup categoriesSoup = Constructors.NewSoup();

			for (i = 0; i < count; i++)
				categoriesSoup.SetNamedTag((string)i, categories[i].GetKUID());

			soup.SetNamedSoup("ProductFilter.Categories", categoriesSoup);
		}

		return soup;
	}


	public bool IsEmpty(void)
	{
		if (GetProducts().size())
			return false;

		if (GetProductCategories().size())
			return false;

		return true;
	}
};



