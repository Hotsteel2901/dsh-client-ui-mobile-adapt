#!/usr/bin/env bash
#
# dsh-client-ui-mobile-adapt — one-shot installer (Linux / macOS / WSL / Git-Bash)
#
# Installs the mobile-adapt plugin into a DeepSeek Harness (dsh) profile.
#
#   curl -fsSL https://raw.githubusercontent.com/Hotsteel2901/dsh-client-ui-mobile-adapt/main/install.sh | bash
#
#   ./install.sh                      # install into profile "webmobile"
#   ./install.sh --profile my-ui      # custom profile name
#   ./install.sh --from-npm           # install from the npm registry instead of this checkout
#   ./install.sh --check              # verify an existing install, change nothing
#
set -euo pipefail

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
PLUGIN_NAME="dsh-client-ui-mobile-adapt"
MIRROR="@deepseek-ai/dsh-web-app"
BASE_PKG="@deepseek-ai/dsh-base"
DEFAULT_PROFILE="webmobile"
DEFAULT_VERSION=""          # empty => derive from the running harness
# Used only when every detection method fails (offline, registry unreachable).
FALLBACK_VERSION="0.1.5-rc.2"

# Capture the script's own directory BEFORE any `cd` happens. Later steps chdir
# into the profile directory, which would otherwise break relative resolution
# and make the script fall back to the (largely unpublished) npm registry.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"

# ---------------------------------------------------------------------------
# Output helpers
# ---------------------------------------------------------------------------
if [ -t 1 ] && command -v tput >/dev/null 2>&1 && [ "$(tput colors 2>/dev/null || echo 0)" -ge 8 ]; then
  C_RESET="$(tput sgr0)"; C_BOLD="$(tput bold)"
  C_RED="$(tput setaf 1)"; C_GREEN="$(tput setaf 2)"
  C_YELLOW="$(tput setaf 3)"; C_BLUE="$(tput setaf 4)"
else
  C_RESET=""; C_BOLD=""; C_RED=""; C_GREEN=""; C_YELLOW=""; C_BLUE=""
fi

info()  { printf '%s\n' "${C_BLUE}==>${C_RESET} $*"; }
ok()    { printf '%s\n' "${C_GREEN}  ✓${C_RESET} $*"; }
warn()  { printf '%s\n' "${C_YELLOW}  !${C_RESET} $*" >&2; }
die()   { printf '%s\n' "${C_RED}  ✗ $*${C_RESET}" >&2; exit 1; }
step()  { printf '\n%s\n' "${C_BOLD}$*${C_RESET}"; }

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
PROFILE="$DEFAULT_PROFILE"
FROM_NPM=0
CHECK_ONLY=0
VERSION="$DEFAULT_VERSION"
PLUGIN_SRC=""
QUIET=0

usage() {
  cat <<'EOF'
dsh-client-ui-mobile-adapt installer

Usage: install.sh [options]

Options:
  -p, --profile <name>   dsh profile to install into (default: webmobile)
  -v, --version <ver>    dsh version to pin, e.g. 0.1.5-rc.2 (default: latest)
      --from-npm         install the plugin from the npm registry
                         (default: from the directory containing this script)
      --src <path|spec>  explicit plugin source (local dir, tarball, or npm spec)
      --check            verify an existing install without modifying anything
  -q, --quiet            reduce output
  -h, --help             show this help

Examples:
  ./install.sh
  ./install.sh --profile webmobile --version 0.1.5-rc.2
  ./install.sh --from-npm
  ./install.sh --check
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    -p|--profile)  [ $# -ge 2 ] || die "--profile needs a value"; PROFILE="$2"; shift 2 ;;
    -v|--version)  [ $# -ge 2 ] || die "--version needs a value"; VERSION="$2"; shift 2 ;;
    --from-npm)    FROM_NPM=1; shift ;;
    --src)         [ $# -ge 2 ] || die "--src needs a value"; PLUGIN_SRC="$2"; shift 2 ;;
    --check)       CHECK_ONLY=1; shift ;;
    -q|--quiet)    QUIET=1; shift ;;
    -h|--help)     usage; exit 0 ;;
    *)             die "unknown option: $1 (try --help)" ;;
  esac
done

# ---------------------------------------------------------------------------
# 1. Locate the dsh executable
# ---------------------------------------------------------------------------
step "[1/6] Locating DeepSeek Harness (dsh)"

DSH_BIN=""
find_dsh() {
  # a) already on PATH
  if command -v dsh >/dev/null 2>&1; then
    DSH_BIN="$(command -v dsh)"; return 0
  fi
  # b) common virtualenv / user-local locations
  local cand
  for cand in \
    "$HOME/.dsh-venv/bin/dsh" \
    "/workspace/.dsh-venv/bin/dsh" \
    "$HOME/.local/bin/dsh" \
    "$HOME/.deepseek/bin/dsh" \
    "/usr/local/bin/dsh" \
    "$HOME/.local/share/pipx/venvs/deepseek-harness/bin/dsh"
  do
    [ -x "$cand" ] && { DSH_BIN="$cand"; return 0; }
  done
  # c) brute-force search inside any *dsh*venv* directory
  cand="$(find "$HOME" -maxdepth 6 -type f -name dsh -perm -u+x \
            -path '*bin*' 2>/dev/null | head -n 1 || true)"
  [ -n "$cand" ] && { DSH_BIN="$cand"; return 0; }
  return 1
}

if ! find_dsh; then
  die "could not find the 'dsh' command.
      Install DeepSeek Harness first, then re-run this script.
      If dsh is installed somewhere unusual, add it to PATH:
        export PATH=\"/path/to/dsh/bin:\$PATH\""
fi
DSH_BIN="$(cd "$(dirname "$DSH_BIN")" && pwd)/$(basename "$DSH_BIN")"
ok "dsh: $DSH_BIN"

# Make sure the venv's node/pnpm wrappers are reachable from subprocesses.
DSH_BIN_DIR="$(dirname "$DSH_BIN")"
case ":$PATH:" in
  *":$DSH_BIN_DIR:"*) ;;
  *) PATH="$DSH_BIN_DIR:$PATH"; export PATH ;;
esac

# ---------------------------------------------------------------------------
# 2. Resolve DSH_HOME
# ---------------------------------------------------------------------------
step "[2/6] Resolving DSH_HOME"

if [ -z "${DSH_HOME:-}" ]; then
  # dsh itself defaults to ~/.dsh ; mirror that but prefer an existing dir.
  if [ -d "$HOME/.dsh/profiles" ]; then
    DSH_HOME="$HOME/.dsh"
  elif [ -d "$HOME/.deepseek/profiles" ]; then
    DSH_HOME="$HOME/.deepseek"
  else
    DSH_HOME="$HOME/.dsh"
  fi
fi
export DSH_HOME
ok "DSH_HOME: $DSH_HOME"
PROFILE_DIR="$DSH_HOME/profiles/$PROFILE"

# ---------------------------------------------------------------------------
# 3. --check fast path
# ---------------------------------------------------------------------------
if [ "$CHECK_ONLY" -eq 1 ]; then
  step "[3/6] Verifying existing install (--check)"
  [ -d "$PROFILE_DIR" ] || die "profile '$PROFILE' not found at $PROFILE_DIR"
  fail=0
  for p in "$BASE_PKG" "$MIRROR" "$PLUGIN_NAME" \
           "@deepseek-ai/dsh-session-title" \
           "@deepseek-ai/dsh-session-title-llm" \
           "@deepseek-ai/dsh-session-title-first-prompt-llm"; do
    if [ -e "$PROFILE_DIR/node_modules/${p}" ] || [ -e "$DSH_HOME/profiles/node_modules/${p}" ]; then
      ok "$p"
    else
      warn "MISSING: $p"; fail=1
    fi
  done
  if grep -q 'autoInstallPeers:[[:space:]]*true' "$PROFILE_DIR/pnpm-workspace.yaml" 2>/dev/null; then
    ok "autoInstallPeers: true"
  else
    warn "autoInstallPeers is not true in pnpm-workspace.yaml"; fail=1
  fi
  [ "$fail" -eq 0 ] && ok "profile '$PROFILE' looks healthy" \
                    || die "profile '$PROFILE' has problems; re-run without --check"
  exit 0
fi

# ---------------------------------------------------------------------------
# 4. Create / open the profile
# ---------------------------------------------------------------------------
step "[4/6] Preparing profile '$PROFILE'"

mkdir -p "$PROFILE_DIR"
cd "$PROFILE_DIR"

if [ ! -f package.json ]; then
  info "creating a new profile"
  cat > package.json <<EOF
{
  "name": "dsh-profile-$PROFILE",
  "private": true,
  "dependencies": {},
  "dsh": {
    "profile": {
      "bundles": [],
      "patchReload": "live"
    }
  }
}
EOF
  ok "package.json created"
else
  ok "existing package.json found"
fi

# --- CRITICAL FIX ---------------------------------------------------------
# dsh generates pnpm-workspace.yaml with `autoInstallPeers: false`.
# Every @deepseek-ai/dsh-* package declares its siblings as PEER dependencies,
# so with peers off pnpm silently omits packages such as
# `dsh-session-title-llm` and the runtime then dies at boot with:
#   Cannot find package '@deepseek-ai/dsh-session-title-llm'
# Turning peers on makes the dependency closure complete.
# --------------------------------------------------------------------------
cat > pnpm-workspace.yaml <<'EOF'
packages:
  - .

nodeLinker: hoisted
autoInstallPeers: true
EOF
ok "pnpm-workspace.yaml written (nodeLinker=hoisted, autoInstallPeers=true)"

# ---------------------------------------------------------------------------
# 5. Resolve versions and install
# ---------------------------------------------------------------------------
step "[5/6] Installing packages"

# ---- 5a-0. make sure pnpm exists -----------------------------------------
#
# `dsh plugin` is a thin wrapper around pnpm. The SEA build of dsh bundles
# pnpm, but an npm-installed dsh shells out to whatever `pnpm` is on PATH and
# fails with "pnpm not found on PATH" if there is none. Without pnpm every
# `dsh plugin` call (including the `view` used for version detection) fails,
# which is why version detection collapses too. Bootstrap pnpm first.
ensure_pnpm() {
  if command -v pnpm >/dev/null 2>&1; then
    ok "pnpm: $(command -v pnpm) ($(pnpm --version 2>/dev/null | head -n1))"
    return 0
  fi
  # The dsh SEA binary may carry its own pnpm even if none is on PATH.
  if "$DSH_BIN" plugin --profile "$PROFILE" -v >/dev/null 2>&1; then
    ok "pnpm: bundled inside the dsh binary"
    return 0
  fi

  warn "pnpm not found — dsh needs it to manage profile plugins"
  if command -v corepack >/dev/null 2>&1; then
    info "enabling pnpm via corepack"
    corepack enable pnpm >/dev/null 2>&1 || true
    corepack prepare pnpm@10 --activate >/dev/null 2>&1 || true
    hash -r 2>/dev/null || true
  fi
  if ! command -v pnpm >/dev/null 2>&1; then
    if command -v npm >/dev/null 2>&1; then
      info "installing pnpm via npm"
      npm install -g pnpm@10 >/dev/null 2>&1 || npm install -g pnpm >/dev/null 2>&1 || true
      hash -r 2>/dev/null || true
    fi
  fi
  if command -v pnpm >/dev/null 2>&1; then
    ok "pnpm installed: $(command -v pnpm)"
    return 0
  fi
  die "pnpm is required but could not be installed automatically.
      Install it yourself and re-run:
        corepack enable pnpm      # or:  npm install -g pnpm
      Then: ./install.sh"
}
ensure_pnpm

# ---- 5a. work out which dsh version to target -----------------------------
#
# Version resolution order matters. The registry's `latest` dist-tag for
# @deepseek-ai/dsh-base currently points at an ancient, BROKEN 0.0.1-rc.1
# release whose own dependencies (e.g. @deepseek-ai/dsh-fs-policy) were never
# published. So `latest` must NOT be trusted.
#
# The authoritative answer is the running harness itself: `dsh --version`
# reports the version of the binary the user actually has, and the plugins
# must match it. Only if that fails do we fall back to the `next` dist-tag.

pkg_exists() {   # pkg_exists <spec> -> 0 if resolvable
  "$DSH_BIN" plugin --profile "$PROFILE" view "$1" version >/dev/null 2>&1
}

if [ -z "$VERSION" ]; then
  if [ -f "$PROFILE_DIR/package.json" ] && grep -q '"@deepseek-ai/dsh-base"' "$PROFILE_DIR/package.json"; then
    VERSION="$(grep -o '"@deepseek-ai/dsh-base"[[:space:]]*:[[:space:]]*"[^"]*"' "$PROFILE_DIR/package.json" \
                | head -n1 | sed 's/.*"\([^"]*\)"$/\1/')"
    info "reusing version already pinned in this profile: $VERSION"
  fi
fi

if [ -z "$VERSION" ]; then
  harness_ver="$("$DSH_BIN" --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.]+)?' | head -n1 || true)"
  if [ -n "$harness_ver" ]; then
    info "harness reports version: $harness_ver"
    if pkg_exists "$BASE_PKG@$harness_ver"; then
      VERSION="$harness_ver"
      info "matched the installed harness version"
    fi
  fi
fi

if [ -z "$VERSION" ]; then
  next_ver="$("$DSH_BIN" plugin --profile "$PROFILE" view "$BASE_PKG@next" version 2>/dev/null \
              | tr -d '[:space:]' | tail -n1 || true)"
  if [ -n "$next_ver" ] && printf '%s' "$next_ver" | grep -Eq '^[0-9]'; then
    VERSION="$next_ver"
    info "using the registry 'next' dist-tag"
  fi
fi

# Last resort: a known-good version. Better to try something reasonable and
# let `pnpm add` report a real error than to bail out before doing anything.
if [ -z "$VERSION" ]; then
  warn "could not detect the harness version (registry unreachable?)"
  warn "falling back to $FALLBACK_VERSION — override with --version"
  VERSION="$FALLBACK_VERSION"
fi
ok "target dsh version: $VERSION"

# ---- 5b. install the harness bundles -------------------------------------
install_pkg() {
  local spec="$1" rc=0
  if [ "$QUIET" -eq 1 ]; then
    "$DSH_BIN" plugin --profile "$PROFILE" add "$spec" >/dev/null 2>&1 || rc=$?
  else
    "$DSH_BIN" plugin --profile "$PROFILE" add "$spec" 2>&1 | sed 's/^/      /' || rc=$?
  fi
  if [ "$rc" -ne 0 ]; then
    die "failed to install '$spec' (exit $rc)"
  fi
}

info "installing $BASE_PKG@$VERSION"
install_pkg "$BASE_PKG@$VERSION"
info "installing $MIRROR@$VERSION"
install_pkg "$MIRROR@$VERSION"

REPO_URL="https://github.com/Hotsteel2901/dsh-client-ui-mobile-adapt.git"

# ---- 5c. install the plugin itself ---------------------------------------
if [ -n "$PLUGIN_SRC" ]; then
  PLUGIN_SPEC="$PLUGIN_SRC"
elif [ "$FROM_NPM" -eq 1 ]; then
  PLUGIN_SPEC="$PLUGIN_NAME"
else
  # Default: install from the checkout that contains this script. When the
  # script is piped straight from curl there is no such checkout (and the
  # package is NOT on npm), so clone the repo to a temp dir instead.
  if [ -f "$SCRIPT_DIR/package.json" ] && grep -q "\"name\"[[:space:]]*:[[:space:]]*\"$PLUGIN_NAME\"" "$SCRIPT_DIR/package.json"; then
    PLUGIN_SPEC="file:$SCRIPT_DIR"
  else
    warn "no local plugin checkout next to this script (piped from curl?)"
    if command -v git >/dev/null 2>&1; then
      CLONE_DIR="$(mktemp -d)/$PLUGIN_NAME"
      info "cloning $REPO_URL"
      if git clone --depth 1 "$REPO_URL" "$CLONE_DIR" >/dev/null 2>&1; then
        ok "cloned into $CLONE_DIR"
        PLUGIN_SPEC="file:$CLONE_DIR"
      else
        die "git clone failed. Clone the repo manually and run ./install.sh from it."
      fi
    else
      die "git is not available. Clone the repo and run ./install.sh from inside it."
    fi
  fi
fi
info "installing $PLUGIN_SPEC"
install_pkg "$PLUGIN_SPEC"

# ---- 5d. re-run install so peer resolution settles ------------------------
info "reconciling the dependency closure"
if [ "$QUIET" -eq 1 ]; then
  "$DSH_BIN" plugin --profile "$PROFILE" install >/dev/null 2>&1 || true
else
  "$DSH_BIN" plugin --profile "$PROFILE" install 2>&1 | sed 's/^/      /' || true
fi

# ---------------------------------------------------------------------------
# 6. Register the plugin in dsh.profile.bundles + verify
# ---------------------------------------------------------------------------
step "[6/6] Verifying"

python3 - "$PROFILE_DIR/package.json" "$PLUGIN_NAME" "$BASE_PKG" "$MIRROR" <<'PY'
import json, sys
path, plugin, base, mirror = sys.argv[1:5]
with open(path, encoding='utf-8') as fh:
    doc = json.load(fh)
profile = doc.setdefault('dsh', {}).setdefault('profile', {})
bundles = profile.setdefault('bundles', [])
# Preserve order: base, mirror, plugin. Only append what is absent.
for item in (base, mirror, plugin):
    if item not in bundles:
        bundles.append(item)
profile.setdefault('patchReload', 'live')
with open(path, 'w', encoding='utf-8') as fh:
    json.dump(doc, fh, indent=2, ensure_ascii=False)
    fh.write('\n')
print('bundles =', bundles)
PY
ok "dsh.profile.bundles updated"

# verify every package that the runtime needs at boot
#
# NOTE: `@deepseek-ai/dsh-client-runtime` is deliberately NOT in this list.
# It is a client-only module resolved from within the harness binary itself and
# is not installed into any profile — not even into a known-good one. Listing it
# here produces a false failure.
missing=0
for p in "$BASE_PKG" "$MIRROR" "$PLUGIN_NAME" \
         "@deepseek-ai/dsh-session-title" \
         "@deepseek-ai/dsh-session-title-llm" \
         "@deepseek-ai/dsh-session-title-first-prompt-llm" \
         "@deepseek-ai/dsh-client-ui-layout" \
         "@deepseek-ai/dsh-client-ui-slots" \
         "@deepseek-ai/dsh-client-locale"; do
  if [ -e "$PROFILE_DIR/node_modules/${p}" ] || [ -e "$DSH_HOME/profiles/node_modules/${p}" ]; then
    ok "$p"
  else
    warn "MISSING: $p"; missing=$((missing + 1))
  fi
done

ds_count="$(ls -d "$PROFILE_DIR/node_modules/@deepseek-ai/"* 2>/dev/null | wc -l | tr -d ' ')"
info "@deepseek-ai packages installed: $ds_count"

if [ "$missing" -gt 0 ]; then
  die "$missing required package(s) missing. Re-run the installer; if it persists, please report it."
fi

cat <<EOF

${C_GREEN}${C_BOLD}Installation complete.${C_RESET}

  profile   : $PROFILE
  directory : $PROFILE_DIR

Start the Web UI with:

  ${C_BOLD}dsh --profile $PROFILE${C_RESET}

Then open the URL it prints (it contains an access token).
Resize the window below 768px to see the mobile layout.
EOF
