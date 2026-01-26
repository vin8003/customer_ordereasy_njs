'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ShoppingBag, Filter } from 'lucide-react';
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

    const { wishlistIds, loadWishlist, toggleWishlist, isWishlisted } = useWishlist();

    useEffect(() => {
        if (retailerId && categoryId) {
            loadProducts();
            loadWishlist();
        }
    }, [retailerId, categoryId, loadWishlist]);

    const loadProducts = async () => {
        setIsLoading(true);
        try {
            const prodData = await apiService.getRetailerProducts(retailerId, { category: categoryId });
            const rawProducts = Array.isArray(prodData) ? prodData : prodData.results || [];

            const processedProducts = rawProducts.map((p: any) => ({
                ...p,
                price: p.discounted_price || p.price,
                mrp: p.original_price || p.price,
                image: p.image || '',
                stock_quantity: p.quantity || 0,
                unit: p.unit || 'Unit'
            }));

            setProducts(processedProducts);

            // Try to set category name from first product if possible
            if (processedProducts.length > 0 && processedProducts[0].category_name) {
                setCategoryName(processedProducts[0].category_name);
            }
        } catch (error) {
            console.error("Failed to load products", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center">Loading Products...</div>;

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

            {products.length === 0 ? (
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
                    ))}
                </div>
            )}
        </div>
    );
}

export default function CategoryProductsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center">Loading Products...</div>}>
            <CategoryProducts />
        </Suspense>
    );
}
