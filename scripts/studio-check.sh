#!/usr/bin/env bash
# Read-only studio audit. Lists every learner grouped by studio, so you can
# confirm the Discovery cohort is actually in studio=discovery (and catch any
# returning kid left in Adventure from last year).
#
# SELECT only - touches nothing. Uses the compass_rw connection.
#
# RUN:  bash scripts/studio-check.sh
# Needs ~/.compass-rw.env (COMPASS_RW_URL). Run from the repo root, on your
# machine (the DB is not reachable from the agent sandbox).

set -euo pipefail

ENV_FILE="${HOME}/.compass-rw.env"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE (needs COMPASS_RW_URL)." >&2
  exit 1
fi
# shellcheck disable=SC1090
source "$ENV_FILE"

if [[ -z "${COMPASS_RW_URL:-}" ]]; then
  echo "COMPASS_RW_URL not set in $ENV_FILE." >&2
  exit 1
fi

echo ""
echo "=== Every learner, grouped by studio ==="
PGCONNECT_TIMEOUT=15 psql "$COMPASS_RW_URL" -P pager=off <<'SQL'
select
  coalesce(l.studio, '(no studio)')      as studio,
  split_part(p.email, '@', 1)            as hero_name,
  p.name                                 as name
from profiles p
join learners l on l.id = p.id
where p.role = 'learner'
order by studio, hero_name;

-- Count per studio (quick sanity check on the Discovery total).
select coalesce(l.studio, '(no studio)') as studio, count(*) as learners
from profiles p
join learners l on l.id = p.id
where p.role = 'learner'
group by studio
order by studio;
SQL
echo ""
echo "Scan the 'discovery' block for your 14 returning kids. Anything in"
echo "'adventure' / '(no studio)' that should be Discovery needs its studio set."
