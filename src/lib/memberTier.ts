/** Optional member_tier on the customer account header. Display only. */

export type OptionalMemberTier = string | null | undefined;

export interface AccountProfileMemberTier {
    member_tier?: OptionalMemberTier;
    /** Allowed on payloads / tests; never used to invent a header tier. */
    membership?: { tier?: string | null } | null;
    tier?: string | null;
    loyalty_tier?: string | null;
}

function optionalTrimmedText(raw: unknown): string | null {
    if (typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    return trimmed ? trimmed : null;
}

/**
 * Member-tier label from top-level `member_tier` only.
 * Absent / undefined / null / blank / non-string → do not show.
 * Never derived from nested `membership`, `tier`, or `loyalty_tier`.
 */
export function getVisibleMemberTier(profile: AccountProfileMemberTier): string | null {
    return optionalTrimmedText(profile.member_tier);
}
