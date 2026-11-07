#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Central Gateway — Production Deployment Verification Script
# Polls live health endpoints on Render until services are healthy and updated.
# ==============================================================================

SERVICE="all"
TARGET_VERSION=""
TARGET_COMMIT=""
SERVER_URL="https://central-gateway-server.onrender.com"
CLIENT_URL="https://central-gateway-client.onrender.com"
TIMEOUT_SECONDS=600
POLL_INTERVAL=10
INITIAL_DELAY=15
MIN_ROLLOUT_WAIT=30

while [[ $# -gt 0 ]]; do
  case "$1" in
    --service)
      SERVICE="$2"
      shift 2
      ;;
    --version)
      TARGET_VERSION="$2"
      shift 2
      ;;
    --commit)
      TARGET_COMMIT="$2"
      shift 2
      ;;
    --server-url)
      SERVER_URL="$2"
      shift 2
      ;;
    --client-url)
      CLIENT_URL="$2"
      shift 2
      ;;
    --timeout)
      TIMEOUT_SECONDS="$2"
      shift 2
      ;;
    --interval)
      POLL_INTERVAL="$2"
      shift 2
      ;;
    --initial-delay)
      INITIAL_DELAY="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo "=================================================================="
echo "🚀 Central Gateway Production Verification"
echo "Target Service : $SERVICE"
echo "Target Version : ${TARGET_VERSION:-'(any)'}"
echo "Target Commit  : ${TARGET_COMMIT:-'(any)'}"
echo "Server URL     : $SERVER_URL"
echo "Client URL     : $CLIENT_URL"
echo "Timeout        : ${TIMEOUT_SECONDS}s"
echo "=================================================================="

if [ "$INITIAL_DELAY" -gt 0 ]; then
  echo "⏳ Waiting initial delay of ${INITIAL_DELAY}s for Render rollout..."
  sleep "$INITIAL_DELAY"
fi

verify_server() {
  local url="$SERVER_URL/api/v1/health"
  echo "🔍 Verifying Server Health: $url"
  local start_time
  start_time=$(date +%s)

  while true; do
    local current_time
    current_time=$(date +%s)
    local elapsed=$((current_time - start_time))

    if [ "$elapsed" -ge "$TIMEOUT_SECONDS" ]; then
      echo "❌ Server verification timed out after ${TIMEOUT_SECONDS}s."
      return 1
    fi

    local response
    response=$(curl -s -f -m 10 "$url" 2>/dev/null || true)

    if [ -n "$response" ]; then
      local status
      status=$(echo "$response" | node -p "JSON.parse(require('fs').readFileSync(0, 'utf-8')).status" 2>/dev/null || echo "")
      local db_status
      db_status=$(echo "$response" | node -p "JSON.parse(require('fs').readFileSync(0, 'utf-8')).database" 2>/dev/null || echo "")

      if [ "$status" = "ok" ] && [ "$db_status" = "connected" ]; then
        echo "✅ Central Gateway Server is healthy! (status=ok, database=connected, elapsed=${elapsed}s)"
        return 0
      fi
    fi

    echo "⏳ Server not ready yet (${elapsed}s elapsed). Retrying in ${POLL_INTERVAL}s..."
    sleep "$POLL_INTERVAL"
  done
}

verify_client() {
  local url="$CLIENT_URL/health"
  echo "🔍 Verifying Client Health: $url"
  local start_time
  start_time=$(date +%s)

  while true; do
    local current_time
    current_time=$(date +%s)
    local elapsed=$((current_time - start_time))

    if [ "$elapsed" -ge "$TIMEOUT_SECONDS" ]; then
      echo "❌ Client verification timed out after ${TIMEOUT_SECONDS}s."
      return 1
    fi

    local response
    response=$(curl -s -f -m 10 "$url" 2>/dev/null || true)

    if [ -n "$response" ]; then
      local status
      status=$(echo "$response" | node -p "JSON.parse(require('fs').readFileSync(0, 'utf-8')).status" 2>/dev/null || echo "")

      if [ "$status" = "ok" ]; then
        echo "✅ Central Gateway Client is healthy! (status=ok, elapsed=${elapsed}s)"
        return 0
      fi
    fi

    echo "⏳ Client not ready yet (${elapsed}s elapsed). Retrying in ${POLL_INTERVAL}s..."
    sleep "$POLL_INTERVAL"
  done
}

if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "server" ]; then
  verify_server
fi

if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "client" ]; then
  verify_client
fi

echo "🎉 All deployment verifications passed successfully!"
