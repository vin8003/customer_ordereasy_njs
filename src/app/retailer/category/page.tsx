'use client';

import React, { useState, useEffect, Suspense, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ShoppingBag, Filter, Loader2 } from 'lucide-react';
import { apiService } from '@/services/api';
import { Button } from '@/app/components/ui/Button';
import { ProductCard } from '@/app/components/ProductCard';
import { useWishlist } from '@/hooks/useWishlist';
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
}

function CategoryProducts() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const retailerId = searchParams.get('retailerId') as string;
    const categoryId = searchParams.get('categoryId') as string;

    const [products, setProducts] = useState<Product[]>([]);
    const [categoryName, setCategoryName] = useState('Products');
    const [isLoading, setIsLoading] = useState(true);
    const [isMoreLoading, setIsMoreLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const observer = useRef<IntersectionObserver | null>(null);
    const lastProductElementRef = useCallback((node: HTMLDivElement) => {
        if (isLoading || isMoreLoading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [isLoading, isMoreLoading, hasMore]);

    const { wishlistIds, loadWishlist, toggleWishlist, isWishlisted } = useWishlist();

    useEffect(() => {
        if (retailerId && categoryId) {
            // Initial load
            setPage(1);
            setProducts([]);
            setHasMore(true);
            loadProducts(1);
            loadWishlist();
        }
    }, [retailerId, categoryId]);

    useEffect(() => {
        if (page > 1) {
            loadProducts(page);
        }
    }, [page]);

    const loadProducts = async (pageNum: number) => {
        if (pageNum === 1) setIsLoading(true);
        else setIsMoreLoading(true);

        try {
            const prodData = await apiService.getRetailerProducts(retailerId, {
                category: categoryId,
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
                unit: p.unit || 'Unit'
            }));

            setProducts(prev => {
                // Prevent duplicates just in case
                const newProducts = pageNum === 1 ? processedProducts : [...prev, ...processedProducts];
                // Simple de-dupe by ID
                return Array.from(new Map(newProducts.map((p: any) => [p.id, p])).values());
            });

            // Try to set category name from first product if possible
            if (pageNum === 1 && processedProducts.length > 0 && processedProducts[0].category_name) {
                setCategoryName(processedProducts[0].category_name);
            }
        } catch (error) {
            console.error("Failed to load products", error);
            setHasMore(false);
        } finally {
            setIsLoading(false);
            setIsMoreLoading(false);
        }
    };

    if (isLoading && products.length === 0) return <div className="p-8 text-center text-gray-500">Loading Products...</div>;

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

            {products.length === 0 && !isLoading ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <ShoppingBag size={48} className="mb-4 text-gray-300" />
                    <p>No products found in this category.</p>
                </div>
            ) : (
                <div className={styles.grid}>
                    {products.map((product, index) => {
                        if (products.length === index + 1) {
                            return (
                                <div ref={lastProductElementRef} key={product.id}>
                                    <ProductCard
                                        product={product}
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
                                            } catch (err) {
                                                console.error("Failed to add to cart", err);
                                            }
                                        }}
                                        onClick={() => router.push(`/retailer/product?retailerId=${retailerId}&productId=${product.id}`)}
                                    />
                                </div>
                            );
                        } else {
                            return (
                                <ProductCard
                                    key={product.id}
                                    product={product}
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
                                        } catch (err) {
                                            console.error("Failed to add to cart", err);
                                        }
                                    }}
                                    onClick={() => router.push(`/retailer/product?retailerId=${retailerId}&productId=${product.id}`)}
                                />
                            );
                        }
                    })}
                </div>
            )}

            {isMoreLoading && (
                <div className="flex justify-center p-4 w-full col-span-full">
                    <Loader2 className="animate-spin text-gray-400" size={24} />
                </div>
            )}
        </div>
    );
}

export default function CategoryProductsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading Products...</div>}>
            <CategoryProducts />
        </Suspense>
    );
}
