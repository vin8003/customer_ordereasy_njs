'use client';

import React, { InputHTMLAttributes, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input as ShadInput } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    icon,
    type = 'text',
    className,
    ...props
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';

    return (
        <div className="flex w-full flex-col gap-1.5">
            <Label className="text-muted-foreground">{label}</Label>
            <div className="relative">
                {icon && (
                    <span className="pointer-events-none absolute top-1/2 left-3 z-10 -translate-y-1/2 text-muted-foreground">
                        {icon}
                    </span>
                )}
                <ShadInput
                    type={isPassword ? (showPassword ? 'text' : 'password') : type}
                    aria-invalid={Boolean(error)}
                    className={cn(
                        'h-11 rounded-xl bg-muted/40',
                        icon && 'pl-10',
                        isPassword && 'pr-10',
                        className
                    )}
                    {...props}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}
            </div>
            {error && <span className="text-xs font-medium text-destructive">{error}</span>}
        </div>
    );
};
