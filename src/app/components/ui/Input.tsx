import React, { InputHTMLAttributes, useState } from 'react';
import styles from './Input.module.css';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, error, icon, type = 'text', className, ...props }) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';

    const togglePassword = () => setShowPassword(!showPassword);

    return (
        <div className={styles.inputContainer}>
            <label className={styles.label}>{label}</label>
            <div className={styles.inputWrapper}>
                {icon && <span className={styles.icon}>{icon}</span>}
                <input
                    type={isPassword ? (showPassword ? 'text' : 'password') : type}
                    className={`${styles.input} ${error ? styles.errorInput : ''} ${icon ? styles.withIcon : ''}`}
                    {...props}
                />
                {isPassword && (
                    <button type="button" onClick={togglePassword} className={styles.eyeBtn}>
                        {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                    </button>
                )}
            </div>
            {error && <span className={styles.errorText}>{error}</span>}
        </div>
    );
};
