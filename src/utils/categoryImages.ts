import { apiService } from '@/services/api';

const categoryImageCache = new Map<string, string | null>();
const pendingRequests = new Map<string, Promise<string | null>>();

/**
 * Fetches a representative image for a category/subcategory/product group
 * by getting the first product in that category and using its image.
 * 
 * Hierarchy: Product Group -> Products
 *            Subcategory -> Product Groups -> Products
 *            Category -> Subcategories -> Product Groups -> Products
 * 
 * Since fetching products by any parent category ID returns its descendant products,
 * grabbing one product image is sufficient to represent the category at any level.
 */
export async function getCategoryIcon(retailerId: string | number, categoryId: string | number): Promise<string | null> {
    if (!retailerId || !categoryId) return null;

    const cacheKey = `${retailerId}_${categoryId}`;

    // 1. Check if we already have it in memory cache
    if (categoryImageCache.has(cacheKey)) {
        return categoryImageCache.get(cacheKey) || null;
    }

    // 2. Check if a request is already in flight for this category
    if (pendingRequests.has(cacheKey)) {
        return pendingRequests.get(cacheKey)!;
    }

    // 3. Make a new request to get just 1 product for this category
    const promise = async () => {
        try {
            // Fetch products for this category. The API should return paginated data.
            const prodData = await apiService.getRetailerProducts(retailerId, {
                category: categoryId,
                page: 1
            });

            const products = Array.isArray(prodData) ? prodData : (prodData.results || []);

            if (products.length > 0 && products[0].image) {
                const imageUrl = products[0].image;
                categoryImageCache.set(cacheKey, imageUrl);
                return imageUrl;
            }

            // Fallback: If no products or no image found, cache null so we don't keep trying
            categoryImageCache.set(cacheKey, null);
            return null;
        } catch (error) {
            console.error(`Failed to fetch representative image for category ${categoryId}:`, error);
            // Don't cache the error so we can retry later if needed
            return null;
        } finally {
            // Clean up the pending request
            pendingRequests.delete(cacheKey);
        }
    };

    const requestPromise = promise();
    pendingRequests.set(cacheKey, requestPromise);

    return requestPromise;
}

/**
 * Preloads images for a list of categories to improve perceived performance
 */
export async function preloadCategoryIcons(retailerId: string | number, categoryIds: (string | number)[]) {
    const promises = categoryIds.map(id => getCategoryIcon(retailerId, id));
    await Promise.allSettled(promises);
}
