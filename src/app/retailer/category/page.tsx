'use client';
import LoadingScreen from '@/app/components/LoadingScreen';

import React, { useState, useEffect, Suspense, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ShoppingBag, Filter, Loader2 } from 'lucide-react';
import { apiService } from '@/services/api';
import { Button } from '@/app/components/ui/Button';
import { ProductCard } from '@/app/components/ProductCard';
import { useWishlist } from '@/hooks/useWishlist';
import { getCategoryIcon } from '@/utils/categoryImages';
import styles from './CategoryProducts.module.css';

interface Product {
    id: number;
    name: string;
    description?: string;
    price: number;
    mrp: number;
    image: string;
    category_name?: string;
    stock_quantity: number;
    unit?: string;
    minimum_order_quantity?: number;
    maximum_order_quantity?: number | null;
}

function CategoryProducts() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const retailerId = searchParams.get('retailerId') as string;
    const categoryId = searchParams.get('categoryId') as string;
    const subcategoryId = searchParams.get('subcategoryId') as string | null;
    const groupId = searchParams.get('groupId') as string | null;

    const [products, setProducts] = useState<Product[]>([]);
    const [subcategories, setSubcategories] = useState<any[]>([]); // Subcategories state
    const [subcategoryIcons, setSubcategoryIcons] = useState<Record<string, string | null>>({});
    const [productGroups, setProductGroups] = useState<any[]>([]); // Product Groups state
    const [productGroupIcons, setProductGroupIcons] = useState<Record<string, string | null>>({});

    const [categoryName, setCategoryName] = useState('Products');
    const [isLoading, setIsLoading] = useState(true);
    const [isMoreLoading, setIsMoreLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const observerTarget = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !isLoading && !isMoreLoading) {
                    setPage(prevPage => prevPage + 1);
                }
            },
            { threshold: 0.1 } // Trigger when even a small part is visible
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [hasMore, isLoading, isMoreLoading]);

    const { wishlistIds, loadWishlist, toggleWishlist, isWishlisted } = useWishlist();

    // Fetch subcategories
    useEffect(() => {
        if (retailerId && categoryId) {
            apiService.getRetailerCategories(retailerId, { parent_id: categoryId })
                .then(async data => {
                    const subs = Array.isArray(data) ? data : [];
                    setSubcategories(subs);

                    // Fetch dynamic icons for each subcategory
                    const icons: Record<string, string | null> = {};
                    for (const sub of subs) {
                        icons[sub.id] = await getCategoryIcon(retailerId, sub.id);
                    }
                    setSubcategoryIcons(prev => ({ ...prev, ...icons }));
                })
                .catch(err => console.error("Failed to fetch subcategories", err));
        }
    }, [retailerId, categoryId]);

    // Fetch product groups when a subcategory is selected
    useEffect(() => {
        if (retailerId && subcategoryId) {
            apiService.getRetailerProductGroupsByCategory(retailerId, subcategoryId)
                .then(async data => {
                    const groupNames = Array.isArray(data) ? data : [];
                    const groups = groupNames.map((name: string) => ({ id: name, name }));
                    setProductGroups(groups);

                    // Fetch dynamic icons for each group
                    const icons: Record<string, string | null> = {};
                    for (const group of groups) {
                        icons[group.id] = await getCategoryIcon(retailerId, subcategoryId, group.name);
                    }
                    setProductGroupIcons(prev => ({ ...prev, ...icons }));
                })
                .catch(err => console.error("Failed to fetch product groups", err));
        } else {
            setProductGroups([]);
        }
    }, [retailerId, subcategoryId]);

    useEffect(() => {
        if (retailerId && (categoryId || subcategoryId || groupId)) {
            // Initial load
            setPage(1);
            setProducts([]);
            setHasMore(true);
            loadProducts(1);
            loadWishlist();
        }
    }, [retailerId, categoryId, subcategoryId, groupId]);

    useEffect(() => {
        if (page > 1 && (categoryId || subcategoryId || groupId)) {
            loadProducts(page);
        }
    }, [page, categoryId, subcategoryId, groupId]);

    const loadProducts = async (pageNum: number) => {
        if (pageNum === 1) setIsLoading(true);
        else setIsMoreLoading(true);

        try {
            const prodData = await apiService.getRetailerProducts(retailerId, {
                category: subcategoryId || categoryId,
                product_group: groupId || undefined,
                page: pageNum
            });

            const rawProducts = Array.isArray(prodData) ? prodData : prodData.results || [];

            // Allow backend to signal no more data if result count is less than default page size (usually 20)
            if (rawProducts.length === 0) {
                setHasMore(false);
            } else {
                // Check total count if available
                if (prodData.count && products.length + rawProducts.length >= prodData.count) {
                    setHasMore(false);
                }
            }

            const processedProducts = rawProducts.map((p: any) => ({
                ...p,
                price: p.discounted_price || p.price,
                mrp: p.original_price || p.price,
                image: p.image || '',
                stock_quantity: p.quantity || 0,
                unit: p.unit || 'Unit',
                minimum_order_quantity: p.minimum_order_quantity || 1,
                maximum_order_quantity: p.maximum_order_quantity
            }));

            setProducts(prev => {
                // Prevent duplicates just in case
                const newProducts = pageNum === 1 ? processedProducts : [...prev, ...processedProducts];
                // Simple de-dupe by ID
                return Array.from(new Map(newProducts.map((p: Product) => [p.id, p])).values()) as Product[];
            });

            // Try to set category name from first product if possible (only on first page load without filters)
            if (pageNum === 1 && processedProducts.length > 0 && processedProducts[0].category_name) {
                if (!subcategoryId) {
                    setCategoryName(processedProducts[0].category_name);
                }
            }
        } catch (error) {
            console.error("Failed to load products", error);
            setHasMore(false);
        } finally {
            setIsLoading(false);
            setIsMoreLoading(false);
        }
    };

    if (isLoading && products.length === 0 && page === 1) return <LoadingScreen message="Loading Products..." />;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft size={20} />
                </Button>
                <h1>{categoryName}</h1>
                <Button variant="outline">
                    <Filter size={18} />
                </Button>
            </header>

            {/* Subcategories (Circular Slider) */}
            {subcategories.length > 0 && (
                <div className={styles.productGroupSlider}>
                    <div
                        className={`${styles.productGroupItem} ${!subcategoryId ? styles.productGroupItemActive : ''}`}
                        onClick={() => router.push(`/retailer/category?retailerId=${retailerId}&categoryId=${categoryId}`)}
                    >
                        <div className={styles.productGroupIcon}>
                            <ShoppingBag className="text-gray-400" size={24} />
                        </div>
                        <span className={styles.productGroupName}>All</span>
                    </div>

                    {subcategories.map(cat => {
                        const isActive = String(cat.id) === subcategoryId;
                        const iconUrl = subcategoryIcons[cat.id];

                        return (
                            <div
                                key={cat.id}
                                className={`${styles.productGroupItem} ${isActive ? styles.productGroupItemActive : ''}`}
                                onClick={() => router.push(`/retailer/category?retailerId=${retailerId}&categoryId=${categoryId}&subcategoryId=${cat.id}`)}
                            >
                                <div className={styles.productGroupIcon}>
                                    {iconUrl ? (
                                        <img src={iconUrl} alt={cat.name} />
                                    ) : (
                                        <ShoppingBag className="text-gray-400" size={24} />
                                    )}
                                </div>
                                <span className={styles.productGroupName}>{cat.name}</span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Product Groups Slider */}
            {subcategoryId && productGroups.length > 0 && (
                <div className={styles.productGroupSlider}>
                    <div
                        className={`${styles.productGroupItem} ${!groupId ? styles.productGroupItemActive : ''}`}
                        onClick={() => router.push(`/retailer/category?retailerId=${retailerId}&categoryId=${categoryId}&subcategoryId=${subcategoryId}`)}
                    >
                        <div className={styles.productGroupIcon}>
                            <ShoppingBag className="text-gray-400" size={24} />
                        </div>
                        <span className={styles.productGroupName}>All {subcategories.find(c => String(c.id) === subcategoryId)?.name}</span>
                    </div>

                    {productGroups.map(group => {
                        const isActive = String(group.id) === groupId;
                        const iconUrl = productGroupIcons[group.id];

                        return (
                            <div
                                key={group.id}
                                className={`${styles.productGroupItem} ${isActive ? styles.productGroupItemActive : ''}`}
                                onClick={() => router.push(`/retailer/category?retailerId=${retailerId}&categoryId=${categoryId}&subcategoryId=${subcategoryId}&groupId=${encodeURIComponent(group.id)}`)}
                            >
                                <div className={styles.productGroupIcon}>
                                    {iconUrl ? (
                                        <img src={iconUrl} alt={group.name} />
                                    ) : (
                                        <ShoppingBag className="text-gray-400" size={24} />
                                    )}
                                </div>
                                <span className={styles.productGroupName}>{group.name}</span>
                            </div>
                        );
                    })}
                </div>
            )}

            {products.length === 0 && !isLoading ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <ShoppingBag size={48} className="mb-4 text-gray-300" />
                    <p>No products found in this category.</p>
                </div>
            ) : (
                <div className={styles.grid}>
                    {products.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            isWishlisted={isWishlisted(product.id)}
                            onToggleWishlist={(e: React.MouseEvent) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleWishlist(product.id);
                            }}
                            onClick={() => router.push(`/retailer/product?retailerId=${retailerId}&productId=${product.id}`)}
                        />
                    ))}
                </div>
            )}

            {isMoreLoading && (
                <div className="flex justify-center p-4 w-full col-span-full">
                    <Loader2 className="animate-spin text-gray-400" size={24} />
                </div>
            )}

            {/* Sentinel element for infinite scroll */}
            <div ref={observerTarget} className="h-10 w-full" />
        </div>
    );
}

export default function CategoryProductsPage() {
    return (
        <Suspense fallback={<LoadingScreen message="Loading Products..." />}>
            <CategoryProducts />
        </Suspense>
    );
}
