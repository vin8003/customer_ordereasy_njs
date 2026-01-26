'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ShoppingBag, Filter, X } from 'lucide-react';
import { apiService } from '@/services/api';
import { Button } from '@/app/components/ui/Button';
import { ProductCard } from '@/app/components/ProductCard';
import { useWishlist } from '@/hooks/useWishlist';
import { WishlistIcon } from '@/app/components/WishlistIcon';
import { ProductImage } from '@/app/components/ProductImage';
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

    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);

    // Filter states
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [inStock, setInStock] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState(categoryId || '');

    const { wishlistIds, loadWishlist, toggleWishlist, isWishlisted } = useWishlist();

    useEffect(() => {
        if (retailerId) {
            loadData();
            loadWishlist();
            fetchCategories();
        }
    }, [retailerId, search, categoryId, minPrice, maxPrice, inStock, selectedCategoryId, loadWishlist]);

    const fetchCategories = async () => {
        try {
            const data = await apiService.getRetailerCategories(retailerId);
            setCategories(data);
        } catch (error) {
            console.error("Failed to fetch categories", error);
        }
    };

    const loadData = async () => {
        setIsLoading(true);
        try {
            const params: any = {
                search: search || undefined,
                category: selectedCategoryId || undefined,
                min_price: minPrice || undefined,
                max_price: maxPrice || undefined,
                in_stock: inStock ? 'true' : undefined
            };

            const prodData = await apiService.getRetailerProducts(retailerId, params);

            const rawProducts = Array.isArray(prodData) ? prodData : prodData.results || [];

            const processedProducts = rawProducts.map((p: any) => ({
                ...p,
                price: p.discounted_price || p.price,
                mrp: p.original_price || p.price,
                image: p.image || p.image_url || '',
                stock_quantity: p.quantity || 0,
                unit: p.unit || 'Unit',
                minimum_order_quantity: p.minimum_order_quantity || 1,
                maximum_order_quantity: p.maximum_order_quantity
            }));

            setProducts(processedProducts);
        } catch (error) {
            console.error("Failed to load products", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading Products...</div>;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Button variant="ghost" onClick={() => router.back()} className="p-0">
                    <ArrowLeft size={24} />
                </Button>
                <h1>{search ? `Search: ${search}` : 'Products'}</h1>
                <Button
                    variant="ghost"
                    onClick={() => setShowFilters(!showFilters)}
                    className={showFilters ? styles.filterActive : ''}
                >
                    <Filter size={20} />
                </Button>
            </header>

            {showFilters && (
                <div className={styles.filterSidebar}>
                    <div className={styles.filterHeader}>
                        <h3>Filters</h3>
                        <Button variant="ghost" onClick={() => setShowFilters(false)}>
                            <X size={20} />
                        </Button>
                    </div>

                    <div className={styles.filterContent}>
                        <div className={styles.filterSection}>
                            <h4>Price Range</h4>
                            <div className={styles.priceInputs}>
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={minPrice}
                                    onChange={(e) => setMinPrice(e.target.value)}
                                />
                                <span>-</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(e.target.value)}
                                />
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

                        <div className={styles.filterSection}>
                            <label className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={inStock}
                                    onChange={(e) => setInStock(e.target.checked)}
                                />
                                <span>In Stock Only</span>
                            </label>
                        </div>

                        <Button
                            className={styles.resetBtn}
                            onClick={() => {
                                setMinPrice('');
                                setMaxPrice('');
                                setInStock(false);
                                setSelectedCategoryId('');
                            }}
                        >
                            Reset Filters
                        </Button>
                    </div>
                </div>
            )}

            <div className={styles.grid}>
                {products.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-gray-400">
                        <ShoppingBag size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No products found {search && `for "${search}"`}</p>
                    </div>
                ) : (
                    products.map(product => (
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
                            onAdd={async (e: React.MouseEvent) => {
                                e.preventDefault();
                                e.stopPropagation();
                                try {
                                    await apiService.addToCart(product.id, 1);
                                    alert("Added to cart!");
                                } catch (err: any) {
                                    console.error("Add to cart failed", err);
                                    alert(err.response?.data?.error || "Failed to add to cart");
                                }
                            }}
                            onClick={() => router.push(`/retailer/product?retailerId=${retailerId}&productId=${product.id}`)}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

export default function AllProductsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading Products...</div>}>
            <AllProducts />
        </Suspense>
    );
}
