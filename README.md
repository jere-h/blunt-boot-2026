# The Blunt Boot Index — World Cup 2026

A cheerfully petty single-page leaderboard of the 2026 FIFA World Cup's most
wasteful, scoreless attackers, ranked by **Blunt Ratio** (shots fired per goal
actually scored, goals floored at 1, minimum 6 shots).

## How it works
- `data/players.js` holds **real** 2026 World Cup box-score data, gathered by a
  one-off agentic scrape (`scripts/scrape_blunt_boot.js`) over public stats
  sources (LiveScore, Footy Times) and hand-reconciled. It is the single source
  of truth — refresh the numbers there.
- `app.js` computes the Blunt Ratio + xG-blown, buckets attackers by workload
  (appearances, since public box scores didn't expose per-player minutes),
  writes joke captions, and wires up copy-to-clipboard.
- `index.html` / `styles.css` render it. No build step, no network calls — open
  `index.html` and it works offline.

## Data caveats
Numbers are the **final, full-tournament snapshot** — all 104 matches, with
Spain champions (beat Argentina 1–0 a.e.t. in the final). Players who scored in
the closing rounds (Ferran Torres, Bukayo Saka, Declan Rice, Anthony Gordon…)
have dropped off the goalless list. All in good fun.
