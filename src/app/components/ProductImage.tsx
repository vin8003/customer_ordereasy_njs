import React, { useState } from 'react';
import Image from 'next/image';
import { ShoppingBag } from 'lucide-react';

interface ProductImageProps {
    src: string;
    alt: string;
    className?: string;
    priority?: boolean;
}

export const ProductImage: React.FC<ProductImageProps> = ({
    src,
    alt,
    className = "",
    priority = false
}) => {
    const [error, setError] = useState(false);

    if (!src || error) {
        return (
            <div className={`flex items-center justify-center bg-gray-50 ${className}`}>
                <ShoppingBag size={24} className="text-gray-200" />
            </div>
        );
    }

    return (
        <div
            className={`${className}`}
            style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}
        >
            <Image
                src={src}
                alt={alt}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                style={{ objectFit: 'contain' }}
                className={`object-contain ${className}`}
                onError={() => setError(true)}
                priority={priority}
            />
        </div>
    );
};
