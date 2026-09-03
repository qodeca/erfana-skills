# SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
# SPDX-License-Identifier: GPL-3.0-only
# Windows sibling of slow-hook.sh. Test fixture, not a shipped hook.
#
# Without this file the Windows CI job resolved the watchdog fixture to a
# missing .ps1, PowerShell exited 127, and Gate 16's assertion ("non-zero exit
# inside ten seconds") accepted that as a pass - the test reported success
# because the hook did not exist. The gate now also rejects 127 and requires
# the run to have actually taken time, but the real fix is that there is
# something here to run.
#
# Wedges the same way the bash version does: a background job inherits stdout
# and outlives the foreground process, so a watchdog that signals only the leaf
# leaves the stream open and bounds nothing.

Start-Job -ScriptBlock { Start-Sleep -Seconds 120 } | Out-Null
Write-Output "slow-hook: started, now wedging"
Start-Sleep -Seconds 120
