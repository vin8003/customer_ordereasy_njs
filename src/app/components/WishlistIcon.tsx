import React from 'react';
import { Heart } from 'lucide-react';

interface WishlistIconProps {
    isWishlisted: boolean;
    onClick?: (e: React.MouseEvent) => void;
    size?: number;
    className?: string;
}

export const WishlistIcon: React.FC<WishlistIconProps> = ({
    isWishlisted,
    onClick,
    size = 18,
    className = ""
}) => {
    return (
        <Heart
            size={size}
            onClick={onClick}
            className={className}
            style={{
                fill: isWishlisted ? '#e11d48' : 'transparent',
                color: isWishlisted ? '#e11d48' : '#5b6b83',
                strokeWidth: isWishlisted ? 0 : 2.2,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
            }}
        />
    );
};
