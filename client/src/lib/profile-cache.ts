/**
 * Shared profile cache — prevents duplicate /profile API calls across components.
 * Module-level singleton: ProfileDropdown and Settings both use this.
 */

import { apiFetch } from "./api";

export type ProfileData = {
  full_name: string;
  avatar_url: string;
  email_notifs: boolean;
  marketing_notifs: boolean;
  analysis_reminders: boolean;
};

type CacheEntry = {
  userId: string;
  data: ProfileData;
  timestamp: number;
};

let _cache: CacheEntry | null = null;
let _inflight: Promise<ProfileData | null> | null = null;
const CACHE_TTL = 60_000; // 1 minute

/**
 * Fetch profile data with deduplication.
 * Multiple concurrent callers for the same userId share a single in-flight request.
 */
export async function fetchProfile(userId: string): Promise<ProfileData | null> {
  // Return cached if fresh
  if (_cache && _cache.userId === userId && Date.now() - _cache.timestamp < CACHE_TTL) {
    return _cache.data;
  }

  // Deduplicate in-flight requests
  if (_inflight) return _inflight;

  _inflight = apiFetch("/api/v1/profile")
    .then((r) => (r.ok ? r.json() : null))
    .then((data: ProfileData | null) => {
      if (data) {
        _cache = { userId, data, timestamp: Date.now() };
      }
      _inflight = null;
      return data;
    })
    .catch(() => {
      _inflight = null;
      return null;
    });

  return _inflight;
}

export function invalidateProfileCache(): void {
  _cache = null;
}

export function getCachedProfile(userId: string): ProfileData | null {
  if (_cache && _cache.userId === userId && Date.now() - _cache.timestamp < CACHE_TTL) {
    return _cache.data;
  }
  return null;
}
