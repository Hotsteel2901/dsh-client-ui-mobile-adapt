<#
.SYNOPSIS
    dsh-client-ui-mobile-adapt — one-shot installer for Windows (PowerShell 5.1+ / 7+).

.DESCRIPTION
    Installs the mobile-adapt plugin into a DeepSeek Harness (dsh) profile.

    The script reproduces the manual steps that make a dsh profile actually
    boot, including the mandatory `autoInstallPeers: true` fix: dsh writes
    pnpm-workspace.yaml with peer auto-install disabled, and because every
    @deepseek-ai/dsh-* package declares its siblings as peer dependencies,
    pnpm then silently omits packages such as `dsh-session-title-llm`, and
    the runtime dies at boot with
        Cannot find package '@deepseek-ai/dsh-session-title-llm'

.EXAMPLE
    .\install.ps1
    .\install.ps1 -Profile webmobile -Version 0.1.5-rc.2
    .\install.ps1 -FromNpm
    .\install.ps1 -Check
#>
[CmdletBinding()]
param(
    # NOTE: the backing variable is $ProfileName, NOT $Profile — `$PROFILE` is a
    # PowerShell automatic variable (path to the user's PS profile script), and
    # a parameter named $Profile would shadow it. The alias keeps -Profile working.
    [Alias('p', 'Profile')]
    [string] $ProfileName = 'webmobile',

    [Alias('v')]
    [string] $Version = '',

    # Install the plugin from the npm registry rather than this checkout.
    [switch] $FromNpm,

    # Explicit plugin source: local directory, tarball, or npm spec.
    [string] $Src = '',

    # Verify an existing install without changing anything.
    [switch] $Check,

    [switch] $Quiet
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
$PluginName = 'dsh-client-ui-mobile-adapt'
$MirrorPkg  = '@deepseek-ai/dsh-web-app'
$BasePkg    = '@deepseek-ai/dsh-base'
$RepoUrl    = 'https://github.com/Hotsteel2901/dsh-client-ui-mobile-adapt.git'
# Used only when every detection method fails. Never `latest`: that tag points
# at a broken 0.0.1-rc.1 whose own dependency was never published.
$FallbackVersion = '0.1.5-rc.2'

# Packages that must exist for the runtime to boot. These are pulled in as
# PEER dependencies; with autoInstallPeers disabled they go missing.
#
# NOTE: `@deepseek-ai/dsh-client-runtime` is deliberately NOT in this list.
# It is a client-only module resolved from within the harness binary itself and
# is not installed into any profile — not even into a known-good one. Listing it
# here produces a false failure.
$RequiredPackages = @(
    $BasePkg,
    $MirrorPkg,
    $PluginName,
    '@deepseek-ai/dsh-session-title',
    '@deepseek-ai/dsh-session-title-llm',
    '@deepseek-ai/dsh-session-title-first-prompt-llm',
    '@deepseek-ai/dsh-client-ui-layout',
    '@deepseek-ai/dsh-client-ui-slots',
    '@deepseek-ai/dsh-client-locale'
)

# ---------------------------------------------------------------------------
# Output helpers
# ---------------------------------------------------------------------------
$script:UseColor = -not $env:NO_COLOR

function Write-Info { param([string] $Message)
    if ($script:UseColor) { Write-Host "==> $Message" -ForegroundColor Cyan }
    else { Write-Host "==> $Message" }
}
function Write-Ok { param([string] $Message)
    if ($script:UseColor) { Write-Host "  [ok] $Message" -ForegroundColor Green }
    else { Write-Host "  [ok] $Message" }
}
function Write-Warn { param([string] $Message)
    if ($script:UseColor) { Write-Host "  [!!] $Message" -ForegroundColor Yellow }
    else { Write-Host "  [!!] $Message" }
}
function Write-Step {
    param([string] $Message)
    Write-Host ''
    Write-Host $Message -ForegroundColor White
}
function Stop-Fatal { param([string] $Message)
    if ($script:UseColor) { Write-Host "  [xx] $Message" -ForegroundColor Red }
    else { Write-Host "  [xx] $Message" }
    exit 1
}

# ---------------------------------------------------------------------------
# 1. Locate the dsh executable
# ---------------------------------------------------------------------------
Write-Step '[1/6] Locating DeepSeek Harness (dsh)'

$DshBin = $null

# a) already on PATH
$cmd = Get-Command dsh -ErrorAction SilentlyContinue
if ($cmd) { $DshBin = $cmd.Source }

# b) common virtualenv / user-local locations
if (-not $DshBin) {
    # Guard the env vars: under StrictMode, Join-Path with a null root throws.
    $localAppData = if ($env:LOCALAPPDATA) { $env:LOCALAPPDATA } else { $null }
    $appData      = if ($env:APPDATA)      { $env:APPDATA }      else { $null }
    $candidateList = @(
        (Join-Path $HOME '.dsh-venv\Scripts\dsh.exe'),
        (Join-Path $HOME '.dsh-venv\bin\dsh'),
        (Join-Path $HOME '.local\bin\dsh.exe'),
        (Join-Path $HOME '.deepseek\bin\dsh.exe'),
        'C:\Program Files\DeepSeek\dsh.exe'
    )
    if ($localAppData) { $candidateList += (Join-Path $localAppData 'Programs\Python\Scripts\dsh.exe') }
    if ($appData)      { $candidateList += (Join-Path $appData 'Python\Scripts\dsh.exe') }

    $candidates = $candidateList | Where-Object { $_ }
    foreach ($cand in $candidates) {
        if (Test-Path -LiteralPath $cand) { $DshBin = $cand; break }
    }
}

# c) brute-force search under the user profile
if (-not $DshBin) {
    $found = Get-ChildItem -Path $HOME -Filter 'dsh*' -Recurse -ErrorAction SilentlyContinue -Depth 6 |
             Where-Object { $_.Name -in @('dsh', 'dsh.exe') -and $_.Directory.Name -in @('bin', 'Scripts') } |
             Select-Object -First 1
    if ($found) { $DshBin = $found.FullName }
}

if (-not $DshBin) {
    Stop-Fatal @"
could not find the 'dsh' command.
Please install DeepSeek Harness first, then re-run this script.
If dsh lives somewhere unusual, add its folder to PATH.
"@
}
Write-Ok "dsh: $DshBin"

# Make sure the harness's own wrappers are reachable from subprocesses.
$DshBinDir = Split-Path -Parent $DshBin
if ($env:PATH -notlike "*$DshBinDir*") {
    $env:PATH = "$DshBinDir;$env:PATH"
}

# ---------------------------------------------------------------------------
# 2. Resolve DSH_HOME
# ---------------------------------------------------------------------------
Write-Step '[2/6] Resolving DSH_HOME'

if (-not $env:DSH_HOME) {
    $preferred = @(
        (Join-Path $HOME '.dsh'),
        (Join-Path $HOME '.deepseek')
    ) | Where-Object { Test-Path -LiteralPath (Join-Path $_ 'profiles') }

    if ($preferred.Count -gt 0) { $env:DSH_HOME = $preferred[0] }
    else { $env:DSH_HOME = Join-Path $HOME '.dsh' }
}
Write-Ok "DSH_HOME: $($env:DSH_HOME)"

$ProfileDir = Join-Path $env:DSH_HOME "profiles\$ProfileName"

# ---------------------------------------------------------------------------
# 3. -Check fast path
# ---------------------------------------------------------------------------
if ($Check) {
    Write-Step '[3/6] Verifying existing install (-Check)'
    if (-not (Test-Path -LiteralPath $ProfileDir)) {
        Stop-Fatal "profile '$ProfileName' not found at $ProfileDir"
    }
    $failed = 0
    foreach ($pkg in $RequiredPackages) {
        $a = Join-Path $ProfileDir "node_modules\$pkg"
        $b = Join-Path $env:DSH_HOME "profiles\node_modules\$pkg"
        if ((Test-Path -LiteralPath $a) -or (Test-Path -LiteralPath $b)) { Write-Ok $pkg }
        else { Write-Warn "MISSING: $pkg"; $failed++ }
    }
    $ws = Join-Path $ProfileDir 'pnpm-workspace.yaml'
    if ((Test-Path -LiteralPath $ws) -and ((Get-Content -LiteralPath $ws -Raw) -match 'autoInstallPeers:\s*true')) {
        Write-Ok 'autoInstallPeers: true'
    } else {
        Write-Warn 'autoInstallPeers is not true in pnpm-workspace.yaml'; $failed++
    }
    if ($failed -eq 0) { Write-Ok "profile '$ProfileName' looks healthy"; exit 0 }
    Stop-Fatal "profile '$ProfileName' has problems; re-run without -Check"
}

# ---------------------------------------------------------------------------
# 4. Create / open the profile
# ---------------------------------------------------------------------------
Write-Step "[4/6] Preparing profile '$ProfileName'"

if (-not (Test-Path -LiteralPath $ProfileDir)) {
    New-Item -ItemType Directory -Path $ProfileDir -Force | Out-Null
}
Set-Location -LiteralPath $ProfileDir

$pkgJsonPath = Join-Path $ProfileDir 'package.json'
if (-not (Test-Path -LiteralPath $pkgJsonPath)) {
    Write-Info 'creating a new profile'
    $seed = [ordered]@{
        name         = "dsh-profile-$ProfileName"
        private      = $true
        dependencies = [ordered]@{}
        dsh          = [ordered]@{
            profile = [ordered]@{
                bundles     = @()
                patchReload = 'live'
            }
        }
    }
    $seed | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $pkgJsonPath -Encoding UTF8
    Write-Ok 'package.json created'
} else {
    Write-Ok 'existing package.json found'
}

# --- CRITICAL FIX ---------------------------------------------------------
# dsh generates pnpm-workspace.yaml with `autoInstallPeers: false`. Because
# every @deepseek-ai/dsh-* package declares its siblings as PEER dependencies,
# pnpm silently omits packages such as `dsh-session-title-llm`, and the
# runtime then fails at boot with a "Cannot find package" error.
# --------------------------------------------------------------------------
$wsPath = Join-Path $ProfileDir 'pnpm-workspace.yaml'
@"
packages:
  - .

nodeLinker: hoisted
autoInstallPeers: true
"@ | Set-Content -LiteralPath $wsPath -Encoding UTF8
Write-Ok 'pnpm-workspace.yaml written (nodeLinker=hoisted, autoInstallPeers=true)'

# ---------------------------------------------------------------------------
# 5. Resolve versions and install
# ---------------------------------------------------------------------------
Write-Step '[5/6] Installing packages'

# `dsh plugin` is a thin wrapper around pnpm. The dsh SEA build bundles pnpm,
# but an npm-installed dsh shells out to whatever `pnpm` is on PATH and fails
# with "pnpm not found on PATH" when there is none. Without pnpm every
# `dsh plugin` call fails — including the `view` used for version detection.
function Ensure-Pnpm {
    if (Get-Command pnpm -ErrorAction SilentlyContinue) {
        Write-Ok "pnpm: $((Get-Command pnpm).Source)"
        return
    }
    try {
        & $DshBin plugin --profile $ProfileName -v *> $null
        if ($LASTEXITCODE -eq 0) {
            Write-Ok 'pnpm: bundled inside the dsh binary'
            return
        }
    } catch { }

    Write-Warn 'pnpm not found — dsh needs it to manage profile plugins'
    $npm = Get-Command npm -ErrorAction SilentlyContinue
    if ($npm) {
        Write-Info 'installing pnpm via npm'
        & $npm install -g pnpm@10 *> $null
        if ($LASTEXITCODE -ne 0) { & $npm install -g pnpm *> $null }
    } else {
        Write-Warn 'npm not found either; trying corepack'
        $corepack = Get-Command corepack -ErrorAction SilentlyContinue
        if ($corepack) {
            & $corepack enable pnpm *> $null
            & $corepack prepare pnpm@10 --activate *> $null
        }
    }
    if (Get-Command pnpm -ErrorAction SilentlyContinue) {
        Write-Ok "pnpm installed: $((Get-Command pnpm).Source)"
        return
    }
    Stop-Fatal @'
pnpm is required but could not be installed automatically.
Install it yourself, then re-run this script:

    npm install -g pnpm
'@
}
Ensure-Pnpm

# ---- 5a. work out which dsh version to target -----------------------------
# Order matters: the registry `latest` dist-tag for @deepseek-ai/dsh-base
# points at an ancient, BROKEN 0.0.1-rc.1 whose own dependency
# (@deepseek-ai/dsh-fs-policy) was never published. Never fall back to `latest`.
if (-not $Version -and (Test-Path -LiteralPath $pkgJsonPath)) {
    try {
        $doc = Get-Content -LiteralPath $pkgJsonPath -Raw | ConvertFrom-Json
        $existing = $doc.dependencies.$BasePkg
        if ($existing) {
            $Version = [string] $existing
            Write-Info "reusing version already pinned in this profile: $Version"
        }
    } catch { }
}

if (-not $Version) {
    $raw = (& $DshBin --version 2>$null | Select-Object -First 1)
    if ($raw) {
        $harnessVer = [string] (($raw -replace '\s', '') -replace '^[^\d]*', '')
        if ($harnessVer -match '^\d+\.\d+\.\d+') {
            Write-Info "harness reports version: $harnessVer"
            & $DshBin plugin --profile $ProfileName view "$BasePkg@$harnessVer" version *> $null
            if ($LASTEXITCODE -eq 0) {
                $Version = $harnessVer
                Write-Info 'matched the installed harness version'
            }
        }
    }
}

if (-not $Version) {
    try {
        $raw = (& $DshBin plugin --profile $ProfileName view "$BasePkg@next" version 2>$null | Select-Object -Last 1)
        if ($raw) {
            $nextVer = ($raw -replace '\s', '')
            if ($nextVer -match '^\d') {
                $Version = $nextVer
                Write-Info "using the registry 'next' dist-tag"
            }
        }
    } catch { }
}

# Last resort: a known-good version. Trying something reasonable beats bailing
# out before doing anything at all.
if (-not $Version -or $Version -notmatch '^\d') {
    Write-Warn "could not detect the harness version (registry unreachable?)"
    Write-Warn "falling back to $FallbackVersion — override with -Version"
    $Version = $FallbackVersion
}
Write-Ok "target dsh version: $Version"

function Invoke-DshPlugin {
    # NOTE: the parameter is $PluginArgs, NOT $Args — `$args` is a PowerShell
    # automatic variable holding unbound arguments; binding it as a named
    # parameter silently breaks the call.
    param([Parameter(ValueFromRemainingArguments = $true)][string[]] $PluginArgs)
    if ($Quiet) {
        & $DshBin plugin --profile $ProfileName @PluginArgs *> $null
    } else {
        & $DshBin plugin --profile $ProfileName @PluginArgs 2>&1 | ForEach-Object { "      $_" }
    }
    if ($LASTEXITCODE -ne 0) { Stop-Fatal "dsh plugin $($PluginArgs -join ' ') failed (exit $LASTEXITCODE)" }
}

# ---- 5b. install the harness bundles -------------------------------------
Write-Info "installing $BasePkg@$Version"
Invoke-DshPlugin add "$BasePkg@$Version"
Write-Info "installing $MirrorPkg@$Version"
Invoke-DshPlugin add "$MirrorPkg@$Version"

# ---- 5c. install the plugin itself ---------------------------------------
if ($Src) {
    $PluginSpec = $Src
} elseif ($FromNpm) {
    $PluginSpec = $PluginName
} else {
    # When run from a clone, $PSScriptRoot points at the checkout. When invoked
    # straight from the web there is no checkout (and the package is NOT on
    # npm), so clone the repo to a temp dir instead.
    $ScriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
    $srcPkg = Join-Path $ScriptDir 'package.json'
    $isCheckout = $false
    if (Test-Path -LiteralPath $srcPkg) {
        try {
            $d = Get-Content -LiteralPath $srcPkg -Raw | ConvertFrom-Json
            $isCheckout = ($d.name -eq $PluginName)
        } catch { }
    }
    if ($isCheckout) {
        # pnpm wants forward slashes / a file: URL on Windows.
        $PluginSpec = 'file:' + ($ScriptDir -replace '\\', '/')
    } else {
        Write-Warn 'no local plugin checkout next to this script'
        $git = Get-Command git -ErrorAction SilentlyContinue
        if ($git) {
            $tmp = Join-Path ([System.IO.Path]::GetTempPath()) ([System.Guid]::NewGuid().ToString('N'))
            $cloneDir = Join-Path $tmp $PluginName
            Write-Info "cloning $RepoUrl"
            & git clone --depth 1 $RepoUrl $cloneDir *> $null
            if ($LASTEXITCODE -eq 0 -and (Test-Path -LiteralPath (Join-Path $cloneDir 'package.json'))) {
                Write-Ok "cloned into $cloneDir"
                $PluginSpec = 'file:' + ($cloneDir -replace '\\', '/')
            } else {
                Stop-Fatal 'git clone failed. Clone the repo manually and run .\install.ps1 from it.'
            }
        } else {
            Stop-Fatal 'git is not available. Clone the repo and run .\install.ps1 from inside it.'
        }
    }
}
Write-Info "installing $PluginSpec"
Invoke-DshPlugin add $PluginSpec

# ---- 5d. re-run install so peer resolution settles ------------------------
Write-Info 'reconciling the dependency closure'
Invoke-DshPlugin install

# ---------------------------------------------------------------------------
# 6. Register the plugin in dsh.profile.bundles + verify
# ---------------------------------------------------------------------------
Write-Step '[6/6] Verifying'

$doc = Get-Content -LiteralPath $pkgJsonPath -Raw | ConvertFrom-Json
if (-not $doc.PSObject.Properties['dsh']) {
    $doc | Add-Member -NotePropertyName dsh -NotePropertyValue ([pscustomobject]@{})
}
if (-not $doc.dsh.PSObject.Properties['profile']) {
    $doc.dsh | Add-Member -NotePropertyName profile -NotePropertyValue ([pscustomobject]@{})
}

$bundles = @()
if ($doc.dsh.profile.PSObject.Properties['bundles'] -and $doc.dsh.profile.bundles) {
    $bundles = @($doc.dsh.profile.bundles)
}
foreach ($item in @($BasePkg, $MirrorPkg, $PluginName)) {
    if ($bundles -notcontains $item) { $bundles += $item }
}

$profileNode = [pscustomobject]@{
    bundles     = $bundles
    patchReload = 'live'
}
$doc.dsh | Add-Member -NotePropertyName profile -NotePropertyValue $profileNode -Force

$doc | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $pkgJsonPath -Encoding UTF8
Write-Ok "dsh.profile.bundles = $($bundles -join ', ')"

$missing = 0
foreach ($pkg in $RequiredPackages) {
    $a = Join-Path $ProfileDir "node_modules\$pkg"
    $b = Join-Path $env:DSH_HOME "profiles\node_modules\$pkg"
    if ((Test-Path -LiteralPath $a) -or (Test-Path -LiteralPath $b)) { Write-Ok $pkg }
    else { Write-Warn "MISSING: $pkg"; $missing++ }
}

$dsDir = Join-Path $ProfileDir 'node_modules\@deepseek-ai'
$dsCount = 0
if (Test-Path -LiteralPath $dsDir) {
    $dsCount = (Get-ChildItem -LiteralPath $dsDir -Directory).Count
}
Write-Info "@deepseek-ai packages installed: $dsCount"

if ($missing -gt 0) {
    Stop-Fatal "$missing required package(s) missing. Re-run the installer; if it persists, please report it."
}

Write-Host ''
Write-Host 'Installation complete.' -ForegroundColor Green
Write-Host ''
Write-Host "  profile   : $ProfileName"
Write-Host "  directory : $ProfileDir"
Write-Host ''
Write-Host 'Start the Web UI with:'
Write-Host ''
Write-Host "  dsh --profile $ProfileName" -ForegroundColor White
Write-Host ''
Write-Host 'Then open the URL it prints (it contains an access token).'
Write-Host 'Resize the window below 768px to see the mobile layout.'
