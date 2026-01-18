import React, { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline';
    isLoading?: boolean;
    fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    isLoading = false,
    fullWidth = false,
    className,
    disabled,
    ...props
}) => {
    return (
        <button
            className={`
        ${styles.button} 
        ${styles[variant]} 
        ${fullWidth ? styles.fullWidth : ''} 
        ${isLoading ? styles.loading : ''}
        ${className || ''}
      `}
            disabled={isLoading || disabled}
            {...props}
        >
            {isLoading ? (
                <span className={styles.spinner} />
            ) : (
                children
            )}
        </button>
    );
};
