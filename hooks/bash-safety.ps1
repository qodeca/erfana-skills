# SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
# SPDX-License-Identifier: GPL-3.0-only
# PreToolUse hook (Windows sibling of bash-safety.sh): block dangerous bash
# commands. Faithful 1:1 port of the bash version's pattern set.
#
# PowerShell -cmatch is case-SENSITIVE (mirrors `grep -E`); -match is
# case-INSENSITIVE (mirrors `grep -iE`). Patterns that relied on grep's
# per-line anchoring carry an inline (?m) flag so ^/$ match per line, not
# just per whole string. Exit 2 blocks the command; exit 0 allows it.

$ErrorActionPreference = 'Stop'

function Block([string]$message) {
    [Console]::Error.WriteLine($message)
    exit 2
}

try {
    $raw = [Console]::In.ReadToEnd()
    if ([string]::IsNullOrWhiteSpace($raw)) { exit 0 }
    $obj = $raw | ConvertFrom-Json
} catch {
    exit 0  # fail-open, mirrors bash `|| true` on malformed input
}

$cmd = [string]$obj.tool_input.command
if ([string]::IsNullOrEmpty($cmd)) { exit 0 }

# --- Destructive rm patterns ---

if ($cmd -cmatch 'rm\s+[^|;&\r\n]*--no-preserve-root\b') {
    Block 'BLOCKED: rm --no-preserve-root is a documented prompt-injection signature; never legitimate'
}
if ($cmd -cmatch 'rm\s+(-[a-zA-Z]*f[a-zA-Z]*\s+|--force\s+).*(/Users/|~/|\$HOME|\$\{HOME\}|/home/|/var/|/etc/|/opt/)') {
    Block 'BLOCKED: Destructive rm targeting system or home directory'
}
if ($cmd -cmatch 'rm\s+-[a-zA-Z]*r[a-zA-Z]*[fF][a-zA-Z]*\s+\$[A-Z_]+/') {
    Block 'BLOCKED: rm -rf with unquoted variable risks /-expansion if variable is unset'
}
if ($cmd -cmatch '(?m)rm\s+-rf\s+\.\s*$') {
    Block 'BLOCKED: rm -rf . is too dangerous; specify exact paths'
}
if ($cmd -cmatch '(?m)rm\s+(-[a-zA-Z]*r[a-zA-Z]*\s+)/(\*|\s|;|$)') {
    Block 'BLOCKED: rm targeting root filesystem'
}

# --- find-based deletion (rm bypass) ---

if ($cmd -cmatch 'find\s+(/|~|\$HOME|\.\.)\s.*(-delete|-exec\s+rm)') {
    Block 'BLOCKED: find with broad scope and -delete/-exec rm is a documented agent self-deletion pattern'
}

# --- Disk and filesystem destruction ---

if ($cmd -cmatch 'dd\s+.*of=/dev/(sd[a-z]|nvme[0-9]|disk[0-9]|hd[a-z])') {
    Block 'BLOCKED: dd to a physical disk device'
}
if ($cmd -cmatch '\bmkfs(\.[a-zA-Z0-9]+)?\s+/dev/(sd[a-z]|nvme[0-9]|disk[0-9]|hd[a-z])') {
    Block 'BLOCKED: mkfs against a physical disk device'
}
if ($cmd -cmatch 'chmod\s+(-R\s+)?(777|000)\s+(/|/etc|/usr|/var|/opt)\b') {
    Block 'BLOCKED: chmod 777/000 against a system path'
}

# --- Privilege escalation ---

if ($cmd -cmatch '(?m)(^|;|&&|\|\|)\s*(sudo|doas|pkexec)\b') {
    Block 'BLOCKED: Privilege escalation (sudo/doas/pkexec) is not appropriate for an automated agent'
}
if ($cmd -cmatch '(?m)(^|;|&&|\|\|)\s*su\s+(-|--login|root|--user)') {
    Block 'BLOCKED: su to switch user is not appropriate for an automated agent'
}

# --- Cloud metadata service exfiltration ---

if ($cmd -cmatch '(curl|wget|http|nc|netcat)\s+[^|;&\r\n]*(169\.254\.169\.254|metadata\.google\.internal|fd00:ec2::254)') {
    Block 'BLOCKED: Access to cloud-instance metadata service (credential exfiltration vector)'
}

# --- Git dangerous operations ---

if ($cmd -cmatch 'git\s+push\s+(-f|--force|--force-with-lease)\s+(origin\s+)?(main|master|trunk|develop|release(/|\b))') {
    Block 'BLOCKED: Force push to a protected branch is prohibited'
}
if ($cmd -cmatch 'git\s+reset\s+--hard') {
    Block 'BLOCKED: git reset --hard is destructive; use git stash or git checkout instead'
}
if ($cmd -cmatch 'git\s+clean\s+-[a-zA-Z]*f') {
    Block 'BLOCKED: git clean -f removes untracked files permanently'
}

# --- Database destruction (case-insensitive, mirrors grep -iE) ---

if ($cmd -match '(?m)(DROP\s+(TABLE|DATABASE|SCHEMA)|TRUNCATE\s+TABLE|DELETE\s+FROM\s+\S+\s*;?\s*$)') {
    Block 'BLOCKED: Destructive database operation detected'
}

# --- Cloud teardown commands ---

if ($cmd -cmatch 'aws\s+s3\s+(rm\s+--recursive|rb\s+--force)\b') {
    Block 'BLOCKED: aws s3 recursive delete; require human-typed command'
}
if ($cmd -cmatch 'aws\s+ec2\s+terminate-instances\b') {
    Block 'BLOCKED: aws ec2 terminate-instances; require human-typed command'
}
if ($cmd -cmatch 'gcloud\s+\S+\s+\S+\s+delete\s+.*--quiet\b') {
    Block 'BLOCKED: gcloud --quiet delete; require human-typed command'
}
if ($cmd -cmatch 'az\s+group\s+delete\s+.*(--yes|-y)\b') {
    Block 'BLOCKED: az group delete --yes; require human-typed command'
}

# --- Process and system manipulation ---

if ($cmd -cmatch 'kill\s+-9\s+(-1|1)\b|killall\s+-(9|KILL|SIGKILL)') {
    Block 'BLOCKED: Broad or forceful process killing is dangerous'
}
if ($cmd -cmatch ':\(\)\{.*\}') {
    Block 'BLOCKED: Fork bomb pattern detected'
}
if ($cmd -cmatch 'while\s+True.*os.*fork|while\s+1.*fork') {
    Block 'BLOCKED: Python fork bomb pattern detected'
}

# --- Tar with absolute paths ---

if ($cmd -cmatch 'tar\s+[^|;&\r\n]*(--absolute-names|\s-P\b|\s-[a-zA-Z]*P[a-zA-Z]*\b)') {
    Block 'BLOCKED: tar with --absolute-names / -P can write outside the tree on extract'
}

# --- Untrusted code execution ---

if ($cmd -cmatch '(curl|wget)\s+[^|;&\r\n]*\|\s*(bash|sh|zsh|python|python3|node|ruby)\b') {
    Block 'BLOCKED: Piping a network download into a shell is a supply-chain risk'
}
if ($cmd -cmatch '(bash|sh|zsh|source|\.\s)\s+<\(\s*(curl|wget)\b') {
    Block 'BLOCKED: Process substitution from network download into a shell is a supply-chain risk'
}
if ($cmd -cmatch 'eval\s+"?\$\(\s*(curl|wget)\b') {
    Block 'BLOCKED: eval of network-downloaded content is a supply-chain risk'
}

# --- Persistence backdoors ---

if ($cmd -cmatch '>>?\s*(~|\$HOME|\$\{HOME\})/?\.(bashrc|zshrc|bash_profile|zprofile|profile|bash_login)\b') {
    Block 'BLOCKED: Writing to shell rc files is a persistence-backdoor pattern'
}
if ($cmd -cmatch '>>?\s*(~|\$HOME|\$\{HOME\})/?\.ssh/authorized_keys\b') {
    Block 'BLOCKED: Writing to authorized_keys is a persistence-backdoor pattern'
}

exit 0
