# SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
# SPDX-License-Identifier: GPL-3.0-only
# Plugin-root Stop hook for erfana:managing-skills (Windows sibling of
# ms-grill-guard.sh). Faithful 1:1 port of the bash version.
#
# Blocks a stop whose last assistant message still carries the open marker
# end-anchored (last 3 non-empty lines after balanced fences are stripped).
# One forced continuation per stop attempt - stop_hook_active breaks the
# retry loop. Emits {"decision":"block"} on stdout; exit 0 always.

$ErrorActionPreference = 'Stop'

try {
    $raw = [Console]::In.ReadToEnd()
    if ([string]::IsNullOrWhiteSpace($raw)) { exit 0 }
    $obj = $raw | ConvertFrom-Json
} catch {
    exit 0
}

if ([string]$obj.stop_hook_active -eq 'True') { exit 0 }

$lastMsg = [string]$obj.last_assistant_message
if ([string]::IsNullOrEmpty($lastMsg)) { exit 0 }

# Strip balanced fenced code blocks; an unclosed trailing fence falls back to
# the raw body (mirrors ms-grill-guard.sh and verify-completion.ps1). Fences are
# recognised with up to three leading spaces and in both backtick and tilde
# flavours, matching the bash sibling's rationale.
$lines = $lastMsg -split "`r?`n"
$fenceRe = '^ ?[ ]?[ ]?(```|~~~)'
$fenceCount = ($lines | Where-Object { $_ -match $fenceRe }).Count
if ($fenceCount % 2 -ne 0) {
    $scrubbedLines = $lines
} else {
    $scrubbedLines = @()
    $inFence = $false
    foreach ($line in $lines) {
        if ($line -match $fenceRe) { $inFence = -not $inFence; continue }
        if ($inFence) { continue }
        $scrubbedLines += $line
    }
}

# Drop inline code spans, so a backticked prose mention of the marker - which
# the block reason below tells the model to write - is not read as an open
# marker. Mirrors the sed pass in the bash sibling.
$scrubbedLines = @($scrubbedLines | ForEach-Object { $_ -replace '`[^`]*`', '' })

# End-anchored: the marker counts only in the last 3 non-empty lines.
$tail = @($scrubbedLines | Where-Object { $_.Trim().Length -gt 0 } | Select-Object -Last 3)

foreach ($line in $tail) {
    if ($line.Contains('<!-- erfana:ms-grill-open -->')) {
        Write-Output '{"decision":"block","reason":"An erfana requirements-interview marker is still open on the last message. If an interview is running, finish the coverage map, obtain waivers, or honor an abort before stopping. If you are not in an interview, remove the trailing <!-- erfana:ms-grill-open --> marker and stop again."}'
        exit 0
    }
}

exit 0
