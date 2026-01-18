'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, ChevronRight, Clock } from 'lucide-react';
import { apiService } from '@/services/api';
import { Button } from '@/app/components/ui/Button';
import styles from './Orders.module.css';

interface Order {
    id: number;
    order_number: string;
    total_amount: string;
    status: string;
    created_at: string;
    retailer_name?: string;
}

export default function OrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        setIsLoading(true);
        try {
            const data = await apiService.getOrders();
            setOrders(Array.isArray(data) ? data : data.results || []);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'delivered': return 'text-green-600 bg-green-50';
            case 'cancelled': return 'text-red-600 bg-red-50';
            case 'pending': return 'text-yellow-600 bg-yellow-50';
            default: return 'text-blue-600 bg-blue-50';
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft size={20} />
                </Button>
                <h1>My Orders</h1>
                <div className="h-5" />
            </header>

            <div className={styles.list}>
                {orders.length === 0 && !isLoading && (
                    <div className="flex flex-col items-center justify-center flex-1 py-20 text-gray-500">
                        <Package size={48} className="mb-4 text-gray-300" />
                        <p>No orders found.</p>
                    </div>
                )}

                {orders.map(order => (
                    <div
                        key={order.id}
                        className={`${styles.card} cursor-pointer active:scale-[0.98] transition-all`}
                        onClick={() => router.push(`/orders/detail?id=${order.id}`)}
                    >
                        <div className={styles.cardHeader}>
                            <div>
                                <h3 className="font-bold text-gray-800">Order #{order.order_number}</h3>
                                <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                    <Clock size={12} />
                                    {new Date(order.created_at).toLocaleDateString()}
                                </div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)} uppercase`}>
                                {order.status}
                            </span>
                        </div>

                        <div className="mt-3 flex justify-between items-end">
                            <div>
                                <p className="text-xs text-gray-500">Retailer</p>
                                <p className="font-medium text-sm">{order.retailer_name || 'Retailer'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 text-right">Total Amount</p>
                                <p className="font-bold text-primary">₹{order.total_amount}</p>
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-center">
                            <span className="text-xs font-bold text-primary flex items-center gap-1">
                                View Details <ChevronRight size={14} />
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
