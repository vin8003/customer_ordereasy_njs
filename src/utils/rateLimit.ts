interface RateLimitState {
    attempts: number;
    lastSent: number;
    cooldownEnd: number;
}

const getRateLimitState = (key: string): RateLimitState => {
    if (typeof window === 'undefined') return { attempts: 0, lastSent: 0, cooldownEnd: 0 };
    const data = localStorage.getItem(key);
    if (!data) return { attempts: 0, lastSent: 0, cooldownEnd: 0 };
    
    try {
        const parsed = JSON.parse(data);
        const now = Date.now();
        
        let attempts = parsed.attempts || 0;
        let lastSent = parsed.lastSent || 0;
        let cooldownEnd = parsed.cooldownEnd || 0;

        // 1. Reset if 10-minute cooldown has passed
        if (cooldownEnd > 0 && cooldownEnd <= now) {
            attempts = 0;
            cooldownEnd = 0;
        }

        // 2. Reset if inactive for more than 10 minutes (Window expiry)
        const timeSinceLast = now - lastSent;
        if (lastSent > 0 && timeSinceLast > 10 * 60 * 1000 && cooldownEnd === 0) {
            attempts = 0;
        }

        return { attempts, lastSent, cooldownEnd };
    } catch (e) {
        return { attempts: 0, lastSent: 0, cooldownEnd: 0 };
    }
};

const saveRateLimitState = (key: string, state: RateLimitState) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(state));
    }
};

export const canRequestOTP = (key: string): { allowed: boolean; remaining: number; reason?: 'cooldown' | 'attempts' } => {
    const state = getRateLimitState(key);
    const now = Date.now();

    // 1. Check 10-minute cooldown (Max attempts hit)
    if (state.cooldownEnd > now) {
        return {
            allowed: false,
            remaining: Math.ceil((state.cooldownEnd - now) / 1000),
            reason: 'attempts'
        };
    }

    // 2. Check 60-second cooldown (Per click)
    const timeSinceLast = now - state.lastSent;
    if (state.lastSent > 0 && timeSinceLast < 60000) {
        return {
            allowed: false,
            remaining: Math.ceil((60000 - timeSinceLast) / 1000),
            reason: 'cooldown'
        };
    }

    return { allowed: true, remaining: 0 };
};

export const recordOTPRequest = (key: string) => {
    const state = getRateLimitState(key);
    const now = Date.now();

    const newAttempts = state.attempts + 1;
    let cooldownEnd = state.cooldownEnd;

    if (newAttempts >= 3) {
        cooldownEnd = now + 10 * 60 * 1000; // 10 minutes from now
    }

    saveRateLimitState(key, {
        attempts: newAttempts,
        lastSent: now,
        cooldownEnd: cooldownEnd
    });
};

export const resetRateLimit = (key: string) => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
    }
};
