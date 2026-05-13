#!/bin/sh
# Generate config.runtime.js from Vercel env vars at deploy time.
# Local dev: this script is never run; the file stays absent and the app
# falls back to localStorage backend.

set -e

cat > config.runtime.js <<EOF
window.__HC_RUNTIME_CONFIG__ = {
  BACKEND_TYPE: "${BACKEND_TYPE:-local}",
  SUPABASE_URL: "${SUPABASE_URL:-}",
  SUPABASE_ANON_KEY: "${SUPABASE_ANON_KEY:-}"
};
EOF

echo "Generated config.runtime.js with BACKEND_TYPE=${BACKEND_TYPE:-local}"
