#!/usr/bin/env sh
# Vibrant Life Compass - database backup (captain 2026-07-21).
#
# The free Supabase tier has NO automated backups / point-in-time recovery. This is the
# substitute: a full pg_dump of the database to a local, gitignored file you control. Run
# it on a schedule (see below) AND by hand right before any migration.
#
# Data stays in YOUR hands - it writes to ./backups on this machine, not a third-party
# store. Optionally encrypts at rest. (We evoke, we never extract.)
#
# ── One-time setup ────────────────────────────────────────────────────────────
# 1. Get the connection string: Supabase Dashboard -> Project Settings -> Database ->
#    "Connection string" (URI). Use the "Session" pooler or direct connection. It looks like:
#       postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres
# 2. Put it in your shell env (NEVER commit it):
#       export VLC_DB_URL='postgresql://postgres:...@db.xxxx.supabase.co:5432/postgres'
#    (optional) a passphrase to encrypt the dump at rest:
#       export VLC_BACKUP_PASSPHRASE='a-long-random-phrase'
# 3. You need the postgres client tools installed (pg_dump):  brew install libpq   (macOS)
#    then add it to PATH, e.g.:  export PATH="/opt/homebrew/opt/libpq/bin:$PATH"
#
# ── Run ───────────────────────────────────────────────────────────────────────
#   sh scripts/backup.sh
#
# ── Schedule it (macOS, weekly + keeps the project warm) ──────────────────────
#   Easiest: a cron line (crontab -e). Runs Sundays 20:00; adjust the path + env.
#     0 20 * * 0  cd /Users/europa/Code/vibrant-life-compass && VLC_DB_URL='...' sh scripts/backup.sh >> backups/backup.log 2>&1
#
# ── Restore (into a TEST project first, to verify a backup actually works) ─────
#   gunzip -c backups/vlc-YYYY-MM-DD-HHMM.sql.gz | psql "$TEST_DB_URL"
#   (encrypted:  openssl enc -d -aes-256-cbc -pbkdf2 -pass env:VLC_BACKUP_PASSPHRASE \
#                  -in backups/vlc-....sql.gz.enc | gunzip -c | psql "$TEST_DB_URL")

set -e

if [ -z "$VLC_DB_URL" ]; then
  echo "ERROR: set VLC_DB_URL to the Supabase Postgres connection string. See the header." >&2
  exit 2
fi
if ! command -v pg_dump >/dev/null 2>&1; then
  echo "ERROR: pg_dump not found. Install with: brew install libpq  (then add its bin to PATH)." >&2
  exit 2
fi

DIR="$(cd "$(dirname "$0")/.." && pwd)/backups"
mkdir -p "$DIR"
STAMP=$(date +%Y-%m-%d-%H%M)
BASE="$DIR/vlc-$STAMP.sql.gz"

echo "Dumping database -> $BASE"
# --no-owner / --no-privileges keep the dump portable to a fresh project on restore.
pg_dump "$VLC_DB_URL" --no-owner --no-privileges | gzip > "$BASE"

if [ -n "$VLC_BACKUP_PASSPHRASE" ]; then
  ENC="$BASE.enc"
  openssl enc -aes-256-cbc -pbkdf2 -salt -pass env:VLC_BACKUP_PASSPHRASE -in "$BASE" -out "$ENC"
  rm -f "$BASE"
  echo "Encrypted at rest -> $ENC"
  BASE="$ENC"
fi

SIZE=$(du -h "$BASE" | cut -f1)
echo "Backup complete: $BASE ($SIZE)"

# Retention: keep the 30 most recent backups; prune older so ./backups doesn't grow forever.
ls -1t "$DIR"/vlc-*.sql.gz* 2>/dev/null | tail -n +31 | while read -r old; do rm -f "$old"; echo "pruned $old"; done
