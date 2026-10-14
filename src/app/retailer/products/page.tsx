'use client';
import LoadingScreen from '@/app/components/LoadingScreen';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShoppingBag, SlidersHorizontal, X, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { apiService } from '@/services/api';
import { Button } from '@/app/components/ui/Button';
import PageHeader from '@/app/components/PageHeader';
import { EmptyState } from '@/app/components/EmptyState';
import { ProductCard } from '@/app/components/ProductCard';
import { useWishlist } from '@/hooks/useWishlist';
import { processRetailerProductList } from '@/utils/productStock';
import styles from './Products.module.css';

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
    minimum_order_quantity: number;
    maximum_order_quantity: number | null;
}

function AllProducts() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const retailerId = searchParams.get('retailerId') as string;
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    const offerId = searchParams.get('offerId');
    const offerTitle = searchParams.get('title');

    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // Filter states
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState(categoryId || '');

    const { wishlistIds, loadWishlist, toggleWishlist, isWishlisted } = useWishlist();
    const [searchInput, setSearchInput] = useState(search || '');

    useEffect(() => {
        setSearchInput(search || '');
    }, [search]);

    useEffect(() => {
        if (apiService.isAuthenticated()) loadWishlist();
    }, [loadWishlist]);

    const activeFilterCount = [minPrice, maxPrice, selectedCategoryId].filter(Boolean).length;

    const submitSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const q = searchInput.trim();
        const params = new URLSearchParams(searchParams.toString());
        if (q) params.set('search', q);
        else params.delete('search');
        router.replace(`/retailer/products?${params.toString()}`);
    };

    useEffect(() => {
        if (retailerId) {
            // Reset to page 1 when filters change (except when currentPage changes manually)
            // But here we rely on the dependency array of useEffect checking currentPage
            fetchCategories();
        }
    }, [retailerId]);

    useEffect(() => {
        if (retailerId) {
            loadData(currentPage);
        }
    }, [retailerId, search, minPrice, maxPrice, selectedCategoryId, currentPage, loadWishlist]);

    // Reset page to 1 if search/filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, minPrice, maxPrice, selectedCategoryId]);

    // Helper to flatten nested categories
    const flattenCategories = (categories: any[], parentName = ''): any[] => {
        let flat: any[] = [];
        categories.forEach(cat => {
            const fullName = parentName ? `${parentName} > ${cat.name}` : cat.name;
            flat.push({ ...cat, name: fullName });
            if (cat.children && cat.children.length > 0) {
                flat = flat.concat(flattenCategories(cat.children, fullName));
            }
        });
        return flat;
    };

    const fetchCategories = async () => {
        try {
            const data = await apiService.getRetailerCategories(retailerId);
            setCategories(flattenCategories(data));
        } catch (error) {
            console.error("Failed to fetch categories", error);
        }
    };

    const loadData = async (page: number) => {
        setIsLoading(true);
        try {
            const params: any = {
                search: search || undefined,
                category: selectedCategoryId || undefined,
                min_price: minPrice || undefined,
                max_price: maxPrice || undefined,
                offer_id: offerId || undefined,
                page: page
            };

            const prodData = await apiService.getRetailerProducts(retailerId, params);

            // Handle metadata if available, otherwise assume flat list (unlikely based on new backend knowledge but just in case)
            let rawProducts = [];
            if (prodData && prodData.results) {
                rawProducts = prodData.results;
                const count = prodData.count;
                setTotalCount(count);
                // Backend default page_size is likely 20
                setTotalPages(Math.ceil(count / 20) || 1);
            } else if (Array.isArray(prodData)) {
                rawProducts = prodData;
                setTotalCount(prodData.length);
                setTotalPages(1);
            }

            setProducts(processRetailerProductList(rawProducts));
        } catch (error) {
            console.error("Failed to load products", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    if (isLoading && products.length === 0) return <LoadingScreen message="Loading Products..." />;

    return (
        <div className={styles.container}>
            <PageHeader
                title={offerTitle || (search ? `Results for “${search}”` : 'All products')}
                subtitle={totalCount > 0 ? `${totalCount} ${totalCount === 1 ? 'item' : 'items'}` : undefined}
                onBack={() => router.back()}
                right={
                    <button
                        type="button"
                        onClick={() => setShowFilters(!showFilters)}
                        className={`${styles.filterBtn} ${showFilters || activeFilterCount > 0 ? styles.filterActive : ''}`}
                        aria-label="Filters"
                        aria-expanded={showFilters}
                    >
                        <SlidersHorizontal size={18} />
                        {activeFilterCount > 0 && <span className={styles.filterCount}>{activeFilterCount}</span>}
                    </button>
                }
            />

            {!offerId && (
                <form className={styles.searchRow} onSubmit={submitSearch} role="search">
                    <Search size={18} className={styles.searchIcon} />
                    <input
                        type="search"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Search products…"
                        aria-label="Search products"
                        className={styles.searchInput}
                    />
                </form>
            )}

            {showFilters && (
                <div className={styles.filterOverlay} onClick={() => setShowFilters(false)}>
                    <div className={styles.filterSidebar} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Filters">
                        <div className={styles.filterHeader}>
                            <h3>Filters</h3>
                            <button type="button" className={styles.closeBtn} onClick={() => setShowFilters(false)} aria-label="Close filters">
                                <X size={20} />
                            </button>
                        </div>

                        <div className={styles.filterContent}>
                            <div className={styles.filterSection}>
                                <h4>Price range</h4>
                                <div className={styles.priceInputs}>
                                    <label>
                                        <span>₹</span>
                                        <input
                                            type="number"
                                            inputMode="numeric"
                                            placeholder="Min"
                                            value={minPrice}
                                            onChange={(e) => setMinPrice(e.target.value)}
                                        />
                                    </label>
                                    <span className={styles.priceDash}>–</span>
                                    <label>
                                        <span>₹</span>
                                        <input
                                            type="number"
                                            inputMode="numeric"
                                            placeholder="Max"
                                            value={maxPrice}
                                            onChange={(e) => setMaxPrice(e.target.value)}
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className={styles.filterSection}>
                                <h4>Category</h4>
                                <select
                                    value={selectedCategoryId}
                                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                                    className={styles.filterSelect}
                                >
                                    <option value="">All Categories</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className={styles.filterFooter}>
                            <Button
                                variant="outline"
                                className={styles.resetBtn}
                                onClick={() => {
                                    setMinPrice('');
                                    setMaxPrice('');
                                    setSelectedCategoryId('');
                                }}
                            >
                                Reset
                            </Button>
                            <Button className={styles.applyBtn} onClick={() => setShowFilters(false)}>
                                Show results
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.grid}>
                {products.length === 0 && !isLoading ? (
                    <div className="col-span-full">
                        <EmptyState
                            icon={ShoppingBag}
                            title="No products found"
                            description={search ? `We couldn't find anything for “${search}”. Try a different search or clear filters.` : 'Try adjusting your filters.'}
                        />
                    </div>
                ) : (
                    <>
                        {products.map(product => (
                            <ProductCard
                                key={product.id}
                                product={{
                                    ...product,
                                    price: Number(product.price),
                                    mrp: Number(product.mrp)
                                }}
                                isWishlisted={isWishlisted(product.id)}
                                onToggleWishlist={(e: React.MouseEvent) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    toggleWishlist(product.id);
                                }}
                                onClick={() => router.push(`/retailer/product?retailerId=${retailerId}&productId=${product.id}`)}
                            />
                        ))}
                    </>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className={styles.pagination}>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1 || isLoading}
                        aria-label="Previous page"
                    >
                        <ChevronLeft size={20} />
                    </Button>
                    <span className={styles.pageLabel}>
                        Page <strong>{currentPage}</strong> of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages || isLoading}
                        aria-label="Next page"
                    >
                        <ChevronRight size={20} />
                    </Button>
                </div>
            )}
        </div>
    );
}

export default function AllProductsPage() {
    return (
        <Suspense fallback={<LoadingScreen message="Loading Products..." />}>
            <AllProducts />
        </Suspense>
    );
}
