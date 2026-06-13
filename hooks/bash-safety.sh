#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
# SPDX-License-Identifier: GPL-3.0-only
# PreToolUse hook: Block dangerous bash commands.
#
# Catches destructive patterns that allow/deny rules in settings.json
# cannot express on their own (compound commands, arguments mixed with
# paths, regex-only matches). Exit 2 blocks the command; exit 0 allows.
#
# Threat model informed by 2025-2026 incidents (Wolak, McAulay, Amazon Q
# supply-chain attack), CVE-2025-54794/-54795, and EC2 IMDS exfiltration
# campaigns. Personal style preferences live in user settings, not here.

set -euo pipefail

INPUT=$(cat)
CMD=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null || true)

if [ -z "$CMD" ]; then
  exit 0
fi

# --- Destructive rm patterns ---

# rm with --no-preserve-root is the documented prompt-injection signature
if echo "$CMD" | grep -qE 'rm\s+[^|;&]*--no-preserve-root\b'; then
  echo "BLOCKED: rm --no-preserve-root is a documented prompt-injection signature; never legitimate" >&2
  exit 2
fi

# rm -rf with home/system targets
if echo "$CMD" | grep -qE 'rm\s+(-[a-zA-Z]*f[a-zA-Z]*\s+|--force\s+).*(/Users/|~/|\$HOME|\$\{HOME\}|/home/|/var/|/etc/|/opt/)'; then
  echo "BLOCKED: Destructive rm targeting system or home directory" >&2
  exit 2
fi

# rm -rf with unquoted variable expansion (Steam-bug class)
if echo "$CMD" | grep -qE 'rm\s+-[a-zA-Z]*r[a-zA-Z]*[fF][a-zA-Z]*\s+\$[A-Z_]+/'; then
  echo "BLOCKED: rm -rf with unquoted variable risks /-expansion if variable is unset" >&2
  exit 2
fi

# rm -rf . (a typo can wipe the working tree)
if echo "$CMD" | grep -qE 'rm\s+-rf\s+\.\s*$'; then
  echo "BLOCKED: rm -rf . is too dangerous; specify exact paths" >&2
  exit 2
fi

# rm targeting root filesystem
if echo "$CMD" | grep -qE 'rm\s+(-[a-zA-Z]*r[a-zA-Z]*\s+)/(\*|\s|;|$)'; then
  echo "BLOCKED: rm targeting root filesystem" >&2
  exit 2
fi

# --- find-based deletion (rm bypass) ---

# find ... -delete or find ... -exec rm with broad scope
if echo "$CMD" | grep -qE 'find\s+(/|~|\$HOME|\.\.)\s.*(-delete|-exec\s+rm)'; then
  echo "BLOCKED: find with broad scope and -delete/-exec rm is a documented agent self-deletion pattern" >&2
  exit 2
fi

# --- Disk and filesystem destruction ---

# dd to a real device (sd*, nvme*, disk*); allow loop / sparse files
if echo "$CMD" | grep -qE 'dd\s+.*of=/dev/(sd[a-z]|nvme[0-9]|disk[0-9]|hd[a-z])'; then
  echo "BLOCKED: dd to a physical disk device" >&2
  exit 2
fi

# mkfs of any flavour against a real device
if echo "$CMD" | grep -qE '\bmkfs(\.[a-zA-Z0-9]+)?\s+/dev/(sd[a-z]|nvme[0-9]|disk[0-9]|hd[a-z])'; then
  echo "BLOCKED: mkfs against a physical disk device" >&2
  exit 2
fi

# chmod 777 / 000 against system paths
if echo "$CMD" | grep -qE 'chmod\s+(-R\s+)?(777|000)\s+(/|/etc|/usr|/var|/opt)\b'; then
  echo "BLOCKED: chmod 777/000 against a system path" >&2
  exit 2
fi

# --- Privilege escalation ---

if echo "$CMD" | grep -qE '(^|;|&&|\|\|)\s*(sudo|doas|pkexec)\b'; then
  echo "BLOCKED: Privilege escalation (sudo/doas/pkexec) is not appropriate for an automated agent" >&2
  exit 2
fi

if echo "$CMD" | grep -qE '(^|;|&&|\|\|)\s*su\s+(-|--login|root|--user)'; then
  echo "BLOCKED: su to switch user is not appropriate for an automated agent" >&2
  exit 2
fi

# --- Cloud metadata service exfiltration ---
# IMDSv1 endpoints across AWS/GCP/Azure; primary credential-theft path in 2025
if echo "$CMD" | grep -qE '(curl|wget|http|nc|netcat)\s+[^|;&]*(169\.254\.169\.254|metadata\.google\.internal|fd00:ec2::254)'; then
  echo "BLOCKED: Access to cloud-instance metadata service (credential exfiltration vector)" >&2
  exit 2
fi

# --- Git dangerous operations ---

# Force push to protected branches (catches compound commands too)
if echo "$CMD" | grep -qE 'git\s+push\s+(-f|--force|--force-with-lease)\s+(origin\s+)?(main|master|trunk|develop|release(/|\b))'; then
  echo "BLOCKED: Force push to a protected branch is prohibited" >&2
  exit 2
fi

# Hard reset
if echo "$CMD" | grep -qE 'git\s+reset\s+--hard'; then
  echo "BLOCKED: git reset --hard is destructive; use git stash or git checkout instead" >&2
  exit 2
fi

# Clean with force (removes untracked files permanently)
if echo "$CMD" | grep -qE 'git\s+clean\s+-[a-zA-Z]*f'; then
  echo "BLOCKED: git clean -f removes untracked files permanently" >&2
  exit 2
fi

# --- Database destruction ---
if echo "$CMD" | grep -qiE '(DROP\s+(TABLE|DATABASE|SCHEMA)|TRUNCATE\s+TABLE|DELETE\s+FROM\s+\S+\s*;?\s*$)'; then
  echo "BLOCKED: Destructive database operation detected" >&2
  exit 2
fi

# --- Cloud teardown commands ---

if echo "$CMD" | grep -qE 'aws\s+s3\s+(rm\s+--recursive|rb\s+--force)\b'; then
  echo "BLOCKED: aws s3 recursive delete; require human-typed command" >&2
  exit 2
fi
if echo "$CMD" | grep -qE 'aws\s+ec2\s+terminate-instances\b'; then
  echo "BLOCKED: aws ec2 terminate-instances; require human-typed command" >&2
  exit 2
fi
if echo "$CMD" | grep -qE 'gcloud\s+\S+\s+\S+\s+delete\s+.*--quiet\b'; then
  echo "BLOCKED: gcloud --quiet delete; require human-typed command" >&2
  exit 2
fi
if echo "$CMD" | grep -qE 'az\s+group\s+delete\s+.*(--yes|-y)\b'; then
  echo "BLOCKED: az group delete --yes; require human-typed command" >&2
  exit 2
fi

# --- Process and system manipulation ---

if echo "$CMD" | grep -qE 'kill\s+-9\s+(-1|1)\b|killall\s+-(9|KILL|SIGKILL)'; then
  echo "BLOCKED: Broad or forceful process killing is dangerous" >&2
  exit 2
fi

# Fork bomb (textbook bash form + python equivalent)
if echo "$CMD" | grep -qE ':\(\)\{.*\}'; then
  echo "BLOCKED: Fork bomb pattern detected" >&2
  exit 2
fi
if echo "$CMD" | grep -qE 'while\s+True.*os.*fork|while\s+1.*fork'; then
  echo "BLOCKED: Python fork bomb pattern detected" >&2
  exit 2
fi

# --- Tar with absolute paths ---
# --absolute-names / -P lets the archive write to /etc, /usr, etc. on
# extract. Block unconditionally; legitimate use is essentially nil
# and the agent should never reach for it without human review.
if echo "$CMD" | grep -qE 'tar\s+[^|;&]*(--absolute-names|\s-P\b|\s-[a-zA-Z]*P[a-zA-Z]*\b)'; then
  echo "BLOCKED: tar with --absolute-names / -P can write outside the tree on extract" >&2
  exit 2
fi

# --- Untrusted code execution ---
# Curl/wget piped to shell, plus process-substitution variants
if echo "$CMD" | grep -qE '(curl|wget)\s+[^|;&]*\|\s*(bash|sh|zsh|python|python3|node|ruby)\b'; then
  echo "BLOCKED: Piping a network download into a shell is a supply-chain risk" >&2
  exit 2
fi
if echo "$CMD" | grep -qE '(bash|sh|zsh|source|\.\s)\s+<\(\s*(curl|wget)\b'; then
  echo "BLOCKED: Process substitution from network download into a shell is a supply-chain risk" >&2
  exit 2
fi
if echo "$CMD" | grep -qE 'eval\s+"?\$\(\s*(curl|wget)\b'; then
  echo "BLOCKED: eval of network-downloaded content is a supply-chain risk" >&2
  exit 2
fi

# --- Persistence backdoors ---
# Writing to dotfiles or authorized_keys (Bitwarden CLI 2026 attack pattern)
if echo "$CMD" | grep -qE '>>?\s*(~|\$HOME|\$\{HOME\})/?\.(bashrc|zshrc|bash_profile|zprofile|profile|bash_login)\b'; then
  echo "BLOCKED: Writing to shell rc files is a persistence-backdoor pattern" >&2
  exit 2
fi
if echo "$CMD" | grep -qE '>>?\s*(~|\$HOME|\$\{HOME\})/?\.ssh/authorized_keys\b'; then
  echo "BLOCKED: Writing to authorized_keys is a persistence-backdoor pattern" >&2
  exit 2
fi

exit 0
