# Lifetime tab

Screenshots for the pull request. Captured against a local backend seeded with
Grubby#1278's real per-season timelines pulled from production, then marked as
migrated so the calibration-aware peaks are visible — in production those stay
hidden until the backfill job has run.

| | |
| --- | --- |
| `overview.png` | The whole tab. |
| `lifetime-mmr.png` | Every race on one chart across six years, with season boundaries, peak markers and per-race peaks in the legend. |
| `season-peak-bars.png` | Best rating per season, coloured by the race that reached it. |
| `season-games-bars.png` | Games per season, coloured by the most played race — season 24 stands out as Undead. |
| `season-games-tooltip.png` | A season tooltip, listing every race rather than only the leader. |
| `race-record.png` | Lifetime record per race, from data the profile already returned. |
| `level-chart.png` | Level, current scale only. |
| `activity.png` | Days played, coloured by the race played most that day and shaded by volume, with a race filter. |

| `non-race-mode.png` | Direct Strike, where one rating covers every race: a single combined series, no race filter, and the record table marked as all-modes. |
| `non-race-mmr.png`, `non-race-activity.png` | The combined series taking the theme's primary — gold on dark, blue on light. |

The `light-*.png` files are the same sections on a light theme, where the season
boundary markers and the win/loss colours needed their own values.
