'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { apiService } from '@/services/api';
import { Button } from '@/app/components/ui/Button';
import styles from './Categories.module.css';

interface Category {
    id: number;
    name: string;
    image?: string;
    item_count?: number;
}

function Categories() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const retailerId = searchParams.get('retailerId') as string;

    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (retailerId) {
            loadCategories();
        }
    }, [retailerId]);

    const loadCategories = async () => {
        setIsLoading(true);
        try {
            const data = await apiService.getRetailerCategories(retailerId);
            setCategories(Array.isArray(data) ? data : data.results || []);
        } catch (error) {
            console.error("Failed to load categories", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading Categories...</div>;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft size={20} />
                </Button>
                <h1>All Categories</h1>
                <div className="h-5" />
            </header>

            <div className={styles.grid}>
                {categories.map((cat) => (
                    <Link href={`/retailer/category?retailerId=${retailerId}&categoryId=${cat.id}`} key={cat.id} className={styles.card}>
                        <div className={styles.iconWrapper}>
                            <ShoppingBag size={24} className="text-blue-500" />
                        </div>
                        <span className={styles.name}>{cat.name}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}

export default function CategoriesPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading Categories...</div>}>
            <Categories />
        </Suspense>
    );
}
