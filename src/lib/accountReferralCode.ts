/** Optional top-level `referral_code` on customer account/profile. Display only. */

export function visibleAccountReferralCode(account: unknown): string | null {
    if (!account || typeof account !== 'object') return null;
    const code = (account as { referral_code?: unknown }).referral_code;
    if (typeof code !== 'string') return null;
    const trimmed = code.trim();
    return trimmed === '' ? null : trimmed;
}
