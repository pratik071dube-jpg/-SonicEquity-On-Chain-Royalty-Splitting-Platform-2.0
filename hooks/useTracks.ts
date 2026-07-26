'use client';

import { useCallback, useEffect, useState } from 'react';

export interface Track {
  track_id: string;
  split_contract: string;
  creator: string;
  created_at: number;
}

const STORAGE_KEY = 'sonicequity:tracks';
const UPDATE_EVENT = 'sonicequity:tracks-updated';

function readStoredTracks(): Track[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Track[]) : [];
  } catch {
    return [];
  }
}

/** Persist a newly registered track split for this browser session (demo storage, mirrors the mocked contract deployment). */
export function saveTrack(track: Track): void {
  if (typeof window === 'undefined') return;
  const existing = readStoredTracks().filter((t) => t.track_id !== track.track_id);
  const updated = [track, ...existing];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

/** React hook exposing the locally registered tracks. */
export function useTracks(): { tracks: Track[] } {
  const [tracks, setTracks] = useState<Track[]>([]);

  const refresh = useCallback(() => {
    setTracks(readStoredTracks());
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(UPDATE_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(UPDATE_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);

  return { tracks };
}
