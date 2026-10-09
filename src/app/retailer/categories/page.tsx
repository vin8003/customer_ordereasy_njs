'use client';
import LoadingScreen from '@/app/components/LoadingScreen';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';
import { apiService } from '@/services/api';
import PageHeader from '@/app/components/PageHeader';
import { getCategoryIcon } from '@/utils/categoryImages';
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
    const [categoryIcons, setCategoryIcons] = useState<Record<string, string | null>>({});
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
            const cats = Array.isArray(data) ? data : data.results || [];
            setCategories(cats);

            const entries = await Promise.all(
                cats.map(async (cat: Category) => [
                    cat.id,
                    cat.image || await getCategoryIcon(retailerId, cat.id),
                ] as const)
            );
            setCategoryIcons(Object.fromEntries(entries));
        } catch (error) {
            console.error("Failed to load categories", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <LoadingScreen message="Loading Categories..." />;

    return (
        <div className={styles.container}>
            <PageHeader
                title="All categories"
                subtitle={`${categories.length} ${categories.length === 1 ? 'category' : 'categories'}`}
                onBack={() => router.back()}
            />

            <div className={styles.grid}>
                {categories.map((cat) => {
                    const iconUrl = categoryIcons[cat.id];
                    return (
                        <Link href={`/retailer/category?retailerId=${retailerId}&categoryId=${cat.id}&categoryName=${encodeURIComponent(cat.name)}`} key={cat.id} className={styles.card}>
                            <div className={styles.iconWrapper}>
                                {iconUrl ? (
                                    <img src={iconUrl} alt="" />
                                ) : (
                                    <ShoppingBag size={26} strokeWidth={1.75} />
                                )}
                            </div>
                            <span className={styles.name}>{cat.name}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

export default function CategoriesPage() {
    return (
        <Suspense fallback={<LoadingScreen message="Loading Categories..." />}>
            <Categories />
        </Suspense>
    );
}
