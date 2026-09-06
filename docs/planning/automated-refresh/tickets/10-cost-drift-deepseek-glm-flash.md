# 10: Average cost differs from the DeepSWE site for deepseek-v4-pro and glm-5-3-flash

Type: task
Status: needs-triage

## Problem

Seen 2026-09-05 while comparing the Best view against the site. Both entries are at max effort with cost adjustment factor 1 in our snapshot, so the Best rule is not the cause.

| Entry | DeepSWE site | Our snapshot |
|---|---|---|
| deepseek-v4-pro [max] | $1.67 | $0.24 |
| glm-5-3-flash [max] | $0.24 | $0.48 |

## To find out

- Whether the site's dehydrated data now carries different `average_cost_usd` values (snapshot drift, fixed by the next Refresh PR) or the site applies a cost adjustment factor for these models that `data/cost-adjustments.json` lacks.
- If a factor is missing, add it and refresh; if drift, confirm the refresh picks it up.
