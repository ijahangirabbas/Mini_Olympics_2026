'use client';

import { useEffect, useState } from 'react';
import { GAMES_DATA, GameInfo, mergeLiveGamesWithCatalog } from './games-data';

/**
 * Fetches live games & pricing from `/api/games` (`cache: 'no-store'`) and merges
 * with catalog metadata so admin updates to names, prices, or team sizes
 * immediately propagate to the public frontend.
 */
export function useLiveGames() {
  const [games, setGames] = useState<GameInfo[]>(GAMES_DATA);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/games?t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (data?.success && Array.isArray(data.data) && data.data.length > 0) {
          setGames(mergeLiveGamesWithCatalog(data.data));
        }
      })
      .catch(() => {
        // Fallback to static GAMES_DATA when offline
      })
      .finally(() => {
        if (active) setLoaded(true);
      });

    return () => {
      active = false;
    };
  }, []);

  return { games, loaded };
}
