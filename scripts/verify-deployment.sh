#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Central Gateway — Production Deployment Verification Script
# Polls live health endpoints on Render until services are healthy and updated,
# with early fail-fast on Render build crashes and live GitHub Deployments sync.
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

RENDER_API_KEY="${RENDER_API_KEY:-}"
RENDER_SERVER_SERVICE_ID="${RENDER_SERVER_SERVICE_ID:-}"
RENDER_SERVER_DEPLOY_ID="${RENDER_SERVER_DEPLOY_ID:-}"
RENDER_CLIENT_SERVICE_ID="${RENDER_CLIENT_SERVICE_ID:-}"
RENDER_CLIENT_DEPLOY_ID="${RENDER_CLIENT_DEPLOY_ID:-}"

GH_REPO="${GH_REPO:-${GITHUB_REPOSITORY:-}}"
GH_SERVER_DEPLOY_ID="${GH_SERVER_DEPLOY_ID:-}"
GH_CLIENT_DEPLOY_ID="${GH_CLIENT_DEPLOY_ID:-}"

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
    --min-rollout-wait)
      MIN_ROLLOUT_WAIT="$2"
      shift 2
      ;;
    --render-api-key)
      RENDER_API_KEY="$2"
      shift 2
      ;;
    --server-service-id)
      RENDER_SERVER_SERVICE_ID="$2"
      shift 2
      ;;
    --server-deploy-id)
      RENDER_SERVER_DEPLOY_ID="$2"
      shift 2
      ;;
    --client-service-id)
      RENDER_CLIENT_SERVICE_ID="$2"
      shift 2
      ;;
    --client-deploy-id)
      RENDER_CLIENT_DEPLOY_ID="$2"
      shift 2
      ;;
    --gh-repo)
      GH_REPO="$2"
      shift 2
      ;;
    --gh-server-deploy-id)
      GH_SERVER_DEPLOY_ID="$2"
      shift 2
      ;;
    --gh-client-deploy-id)
      GH_CLIENT_DEPLOY_ID="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

SERVICE="${SERVICE:-${TARGET_SERVICE:-all}}"
SERVER_URL="${SERVER_URL:-${RENDER_SERVER_URL:-https://central-gateway-server.onrender.com}}"
CLIENT_URL="${CLIENT_URL:-${RENDER_CLIENT_URL:-https://central-gateway-client.onrender.com}}"
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-600}"
POLL_INTERVAL="${POLL_INTERVAL:-10}"
INITIAL_DELAY="${INITIAL_DELAY:-15}"
MIN_ROLLOUT_WAIT="${MIN_ROLLOUT_WAIT:-30}"

if [ -z "$TARGET_VERSION" ]; then
  if [ -f "package.json" ]; then
    TARGET_VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "")
  fi
fi

SHORT_COMMIT=""
if [ -n "$TARGET_COMMIT" ]; then
  SHORT_COMMIT="${TARGET_COMMIT:0:7}"
fi

echo "=================================================================="
echo "🚀 Central Gateway Production Deployment Verification"
echo "=================================================================="
echo "Target Service       : $SERVICE"
echo "Target Version       : ${TARGET_VERSION:-'(any healthy)'}"
echo "Target Commit        : ${TARGET_COMMIT:-'(unspecified)'} (${SHORT_COMMIT:-'N/A'})"
echo "Server Endpoint      : $SERVER_URL/api/v1/health"
echo "Client Endpoint      : $CLIENT_URL/health"
echo "Timeout              : ${TIMEOUT_SECONDS}s (poll every ${POLL_INTERVAL}s)"
echo "Initial Delay        : ${INITIAL_DELAY}s"
echo "Min Rollout Wait     : ${MIN_ROLLOUT_WAIT}s"
echo "Render Fail-Fast     : $([ -n "$RENDER_API_KEY" ] && echo "Active" || echo "Inactive")"
echo "GitHub Live Sync     : $([ -n "$GH_REPO" ] && echo "Active" || echo "Inactive")"
echo "=================================================================="

echo "• Inspecting current live state before monitoring..."
INITIAL_SERVER_JSON=$(curl -s --max-time 10 "$SERVER_URL/api/v1/health" || echo "{}")
INITIAL_CLIENT_JSON=$(curl -s --max-time 10 "$CLIENT_URL/health" || echo "{}")

INITIAL_SERVER_VER=$(echo "$INITIAL_SERVER_JSON" | node -p "JSON.parse(require('fs').readFileSync(0,'utf-8')).version || 'unknown'" 2>/dev/null || echo "unknown")
INITIAL_CLIENT_VER=$(echo "$INITIAL_CLIENT_JSON" | node -p "JSON.parse(require('fs').readFileSync(0,'utf-8')).version || 'unknown'" 2>/dev/null || echo "unknown")

echo "  Initial Live Server Version : $INITIAL_SERVER_VER"
echo "  Initial Live Client Version : $INITIAL_CLIENT_VER"

if [ "$INITIAL_DELAY" -gt 0 ]; then
  echo "⏳ Warmup pause (${INITIAL_DELAY}s) for Render build queue initiation..."
  sleep "$INITIAL_DELAY"
fi

START_TIME=$(date +%s)
SERVER_OK=false
CLIENT_OK=false

if [ "$SERVICE" = "client" ]; then
  SERVER_OK=true
fi
if [ "$SERVICE" = "server" ]; then
  CLIENT_OK=true
fi

LAST_SERVER_STATUS=""
LAST_CLIENT_STATUS=""

while true; do
  CURRENT_TIME=$(date +%s)
  ELAPSED=$((CURRENT_TIME - START_TIME))

  # Early Fail-Fast Check via Render API
  if [ "$SERVER_OK" = false ] && [ -n "$RENDER_API_KEY" ] && [ -n "$RENDER_SERVER_SERVICE_ID" ] && [ -n "$RENDER_SERVER_DEPLOY_ID" ]; then
    SERVER_RENDER_STATUS=$(curl -s --max-time 10 -H "Authorization: Bearer $RENDER_API_KEY" \
      "https://api.render.com/v1/services/$RENDER_SERVER_SERVICE_ID/deploys/$RENDER_SERVER_DEPLOY_ID" | \
      node -p "JSON.parse(require('fs').readFileSync(0,'utf-8')).status || ''" 2>/dev/null || echo "")
    
    if [[ "$SERVER_RENDER_STATUS" =~ ^(build_failed|pre_deploy_failed|canceled|deactivated)$ ]]; then
      echo "::error::❌ Render server deployment failed early with status: $SERVER_RENDER_STATUS"
      if [ -n "$GH_SERVER_DEPLOY_ID" ] && [ -n "$GH_REPO" ]; then
        gh api -X POST "/repos/$GH_REPO/deployments/$GH_SERVER_DEPLOY_ID/statuses" \
          --input - <<< '{"state":"failure","description":"Server build failed on Render ('$SERVER_RENDER_STATUS')","log_url":"https://dashboard.render.com"}' || true
      fi
      exit 1
    fi
  fi

  if [ "$CLIENT_OK" = false ] && [ -n "$RENDER_API_KEY" ] && [ -n "$RENDER_CLIENT_SERVICE_ID" ] && [ -n "$RENDER_CLIENT_DEPLOY_ID" ]; then
    CLIENT_RENDER_STATUS=$(curl -s --max-time 10 -H "Authorization: Bearer $RENDER_API_KEY" \
      "https://api.render.com/v1/services/$RENDER_CLIENT_SERVICE_ID/deploys/$RENDER_CLIENT_DEPLOY_ID" | \
      node -p "JSON.parse(require('fs').readFileSync(0,'utf-8')).status || ''" 2>/dev/null || echo "")
    
    if [[ "$CLIENT_RENDER_STATUS" =~ ^(build_failed|pre_deploy_failed|canceled|deactivated)$ ]]; then
      echo "::error::❌ Render client deployment failed early with status: $CLIENT_RENDER_STATUS"
      if [ -n "$GH_CLIENT_DEPLOY_ID" ] && [ -n "$GH_REPO" ]; then
        gh api -X POST "/repos/$GH_REPO/deployments/$GH_CLIENT_DEPLOY_ID/statuses" \
          --input - <<< '{"state":"failure","description":"Client build failed on Render ('$CLIENT_RENDER_STATUS')","log_url":"https://dashboard.render.com"}' || true
      fi
      exit 1
    fi
  fi

  if [ "$ELAPSED" -ge "$TIMEOUT_SECONDS" ]; then
    echo "❌ Deployment verification timed out after ${ELAPSED}s!"
    echo "=================================================================="
    echo "Last known server response: $LAST_SERVER_STATUS"
    echo "Last known client response: $LAST_CLIENT_STATUS"
    echo "Please inspect build logs on Render Dashboard: https://dashboard.render.com"
    echo "=================================================================="

    if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
      cat <<EOF >> "$GITHUB_STEP_SUMMARY"
### ❌ Production Deployment Timed Out (${ELAPSED}s)
- **Target Version:** \`${TARGET_VERSION}\`
- **Target Commit:** \`${SHORT_COMMIT:-N/A}\`
- **Server URL:** [$SERVER_URL]($SERVER_URL/api/v1/health)
- **Client URL:** [$CLIENT_URL]($CLIENT_URL/health)
- **Status:** Services did not finish rollout before ${TIMEOUT_SECONDS}s timeout window.
EOF
    fi
    exit 1
  fi

  # 1. Verify Server
  if [ "$SERVER_OK" = false ]; then
    SERVER_RESP=$(curl -s --max-time 10 "$SERVER_URL/api/v1/health" || echo "{}")
    LAST_SERVER_STATUS="$SERVER_RESP"

    IS_VALID_SERVER=$(echo "$SERVER_RESP" | node -e '
      function isVersionSatisfied(current, target) {
        if (!target) return true;
        if (current === target) return true;
        const parse = v => v.replace(/^v/, "").split("-")[0].split(".").map(Number);
        const [cMaj = 0, cMin = 0, cPat = 0] = parse(current);
        const [tMaj = 0, tMin = 0, tPat = 0] = parse(target);
        if (cMaj > tMaj) return true;
        if (cMaj < tMaj) return false;
        if (cMin > tMin) return true;
        if (cMin < tMin) return false;
        return cPat >= tPat;
      }

      try {
        const d = JSON.parse(require("fs").readFileSync(0, "utf-8"));
        const targetVer = process.argv[1];
        const shortCommit = process.argv[2];
        const initialVer = process.argv[3];
        const elapsed = parseInt(process.argv[4], 10);
        const minWait = parseInt(process.argv[5], 10);

        const isOk = d.status === "ok";
        const hasDb = d.info && d.info.database && d.info.database.status === "up";
        if (!isOk || !hasDb) {
          process.stdout.write("false:unhealthy");
          process.exit(0);
        }

        if (!isVersionSatisfied(d.version, targetVer)) {
          process.stdout.write("false:version_mismatch:" + d.version);
          process.exit(0);
        }

        if (shortCommit && d.commit) {
          if (!d.commit.startsWith(shortCommit) && !isVersionSatisfied(d.version, targetVer)) {
            process.stdout.write("false:commit_mismatch:" + d.commit.substring(0, 7));
            process.exit(0);
          }
        } else if (initialVer === targetVer && elapsed < minWait) {
          process.stdout.write("false:waiting_rollout_window");
          process.exit(0);
        }

        process.stdout.write("true:" + d.version);
      } catch (e) {
        process.stdout.write("false:json_parse_error");
      }
    ' "$TARGET_VERSION" "$SHORT_COMMIT" "$INITIAL_SERVER_VER" "$ELAPSED" "$MIN_ROLLOUT_WAIT" 2>/dev/null || echo "false:exec_error")

    if [[ "$IS_VALID_SERVER" == true:* ]]; then
      SERVER_VER="${IS_VALID_SERVER#true:}"
      SERVER_OK=true
      echo "  ✅ Server is LIVE and HEALTHY (version: $SERVER_VER, elapsed: ${ELAPSED}s)"
      if [ -n "$GH_SERVER_DEPLOY_ID" ] && [ -n "$GH_REPO" ]; then
        gh api -X POST "/repos/$GH_REPO/deployments/$GH_SERVER_DEPLOY_ID/statuses" \
          --input - <<< '{"state":"success","environment_url":"'$SERVER_URL'/api/v1/health","log_url":"https://dashboard.render.com","description":"Server healthy and live on Render"}' || true
      fi
    fi
  fi

  # 2. Verify Client
  if [ "$CLIENT_OK" = false ]; then
    CLIENT_RESP=$(curl -s --max-time 10 "$CLIENT_URL/health" || echo "{}")
    LAST_CLIENT_STATUS="$CLIENT_RESP"

    IS_VALID_CLIENT=$(echo "$CLIENT_RESP" | node -e '
      function isVersionSatisfied(current, target) {
        if (!target) return true;
        if (current === target) return true;
        const parse = v => v.replace(/^v/, "").split("-")[0].split(".").map(Number);
        const [cMaj = 0, cMin = 0, cPat = 0] = parse(current);
        const [tMaj = 0, tMin = 0, tPat = 0] = parse(target);
        if (cMaj > tMaj) return true;
        if (cMaj < tMaj) return false;
        if (cMin > tMin) return true;
        if (cMin < tMin) return false;
        return cPat >= tPat;
      }

      try {
        const d = JSON.parse(require("fs").readFileSync(0, "utf-8"));
        const targetVer = process.argv[1];
        const shortCommit = process.argv[2];
        const initialVer = process.argv[3];
        const elapsed = parseInt(process.argv[4], 10);
        const minWait = parseInt(process.argv[5], 10);

        const isOk = d.status === "ok";
        if (!isOk) {
          process.stdout.write("false:unhealthy");
          process.exit(0);
        }

        if (!isVersionSatisfied(d.version, targetVer)) {
          process.stdout.write("false:version_mismatch:" + d.version);
          process.exit(0);
        }

        if (shortCommit && d.commit) {
          if (!d.commit.startsWith(shortCommit) && !isVersionSatisfied(d.version, targetVer)) {
            process.stdout.write("false:commit_mismatch:" + d.commit.substring(0, 7));
            process.exit(0);
          }
        } else if (initialVer === targetVer && elapsed < minWait) {
          process.stdout.write("false:waiting_rollout_window");
          process.exit(0);
        }

        process.stdout.write("true:" + d.version);
      } catch (e) {
        process.stdout.write("false:json_parse_error");
      }
    ' "$TARGET_VERSION" "$SHORT_COMMIT" "$INITIAL_CLIENT_VER" "$ELAPSED" "$MIN_ROLLOUT_WAIT" 2>/dev/null || echo "false:exec_error")

    if [[ "$IS_VALID_CLIENT" == true:* ]]; then
      CLIENT_VER="${IS_VALID_CLIENT#true:}"
      CLIENT_OK=true
      echo "  ✅ Client is LIVE and HEALTHY (version: $CLIENT_VER, elapsed: ${ELAPSED}s)"
      if [ -n "$GH_CLIENT_DEPLOY_ID" ] && [ -n "$GH_REPO" ]; then
        gh api -X POST "/repos/$GH_REPO/deployments/$GH_CLIENT_DEPLOY_ID/statuses" \
          --input - <<< '{"state":"success","environment_url":"'$CLIENT_URL'","log_url":"https://dashboard.render.com","description":"Client healthy and live on Render"}' || true
      fi
    fi
  fi

  if [ "$SERVER_OK" = true ] && [ "$CLIENT_OK" = true ]; then
    echo "=================================================================="
    echo "🎉 Production Deployment Verification Succeeded in ${ELAPSED}s!"
    echo "=================================================================="
    echo "• Client URL : $CLIENT_URL"
    echo "• Server URL : $SERVER_URL"
    echo "• Version    : $TARGET_VERSION"
    echo "• All services reporting status: ok with active database connection."
    echo "=================================================================="

    if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
      cat <<EOF >> "$GITHUB_STEP_SUMMARY"
### 🚀 Production Deployment Verified Successfully!

| Metric | Server | Client |
| :--- | :--- | :--- |
| **Service** | \`central-gateway-server\` | \`central-gateway-client\` |
| **Status** | 🟢 Healthy (\`status: ok\`) | 🟢 Healthy (\`status: ok\`) |
| **Database** | 🟢 Connected | N/A (Stateless) |
| **Version** | \`${TARGET_VERSION}\` | \`${TARGET_VERSION}\` |
| **Commit** | \`${SHORT_COMMIT:-N/A}\` | \`${SHORT_COMMIT:-N/A}\` |
| **Endpoint** | [$SERVER_URL/api/v1/health]($SERVER_URL/api/v1/health) | [$CLIENT_URL/health]($CLIENT_URL/health) |

- **Verification Time:** ${ELAPSED}s
- **Control Plane Client:** [$CLIENT_URL]($CLIENT_URL)
- **API Documentation:** [$SERVER_URL/api/docs]($SERVER_URL/api/docs)
EOF
    fi
    exit 0
  fi

  echo "  [${ELAPSED}s] Polling Render rollout... (Server OK: $SERVER_OK, Client OK: $CLIENT_OK)"
  sleep "$POLL_INTERVAL"
done
