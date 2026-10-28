# SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
# SPDX-License-Identifier: GPL-3.0-only
# PreToolUse hook (Windows sibling of bash-safety.sh): block dangerous bash
# commands. Faithful 1:1 port of the bash version's pattern set and helper
# logic; each helper here names its bash counterpart.
#
# PowerShell -cmatch is case-SENSITIVE (mirrors `grep -E`); -match is
# case-INSENSITIVE (mirrors `grep -iE`). Patterns that relied on grep's
# per-line anchoring carry an inline (?m) flag so ^/$ match per line, not
# just per whole string; the helper functions walk the text line by line,
# as the bash `while read` loops do. Exit 2 blocks the command; exit 0
# allows it.

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

# --- Normalisation (see bash-safety.sh for the rationale) ---

$cmd = $cmd.Replace("`r", '')
$cmd = $cmd.Replace("\`n", ' ')

$hdStartRe = '(^|[^<])<<(-?)[ \t]*(''([A-Za-z0-9_.-]+)''|"([A-Za-z0-9_.-]+)"|\\([A-Za-z0-9_.-]+))(.*)$'
$hdPipeRe = '\|[ \t]*(sudo|doas|bash|sh|zsh|dash|ksh|fish|source|eval|xargs|ssh|psql|mysql|mariadb|sqlite3|sqlcmd|python[0-9.]*|node|ruby|perl)([ \t]|$)'
$dbExecRe = '(execute|executescript|executemany|cursor|connect|query|raw)\s*\('
$assignPrefixRe = '^[ \t]*[A-Za-z_][A-Za-z0-9_]*=\S*[ \t]+(.*)$'
$firstWordRe = '^[ \t]*(\S+)(.*)$'

# bash: heredoc_kind
function Get-HeredocKind([string]$pre, [string]$post) {
    if ($post -cmatch $hdPipeRe) { return 'keep' }
    $seg = $pre.Substring($pre.LastIndexOfAny([char[]]';&|(') + 1)
    while ($true) {
        $m = [regex]::Match($seg, $assignPrefixRe)
        if (-not $m.Success) { break }
        $seg = $m.Groups[1].Value
    }
    $m = [regex]::Match($seg, $firstWordRe)
    if (-not $m.Success) { return 'keep' }
    $word = $m.Groups[1].Value
    $word = $word.Substring($word.LastIndexOf('/') + 1)
    if ($word -cmatch '^(cat|tee)$') { return 'file' }
    if ($word -cmatch '^(python|python[0-9].*|node|ruby|perl)$') { return 'interp' }
    return 'keep'
}

# bash: strip_heredocs
function Remove-QuotedHeredocBodies([string]$text) {
    $out = New-Object System.Text.StringBuilder
    $body = New-Object System.Text.StringBuilder
    $delim = ''
    $dashed = ''
    $kind = ''
    foreach ($line in ($text -split "`n")) {
        if ($delim -ne '') {
            $cmp = $line
            if ($dashed -ne '') { $cmp = $cmp.TrimStart("`t") }
            if ($cmp -ceq $delim) {
                $b = $body.ToString()
                if ($kind -eq 'keep' -or ($kind -eq 'interp' -and $b -cmatch $dbExecRe)) {
                    [void]$out.Append($b)
                }
                [void]$out.Append($line + "`n")
                $delim = ''
                $body = New-Object System.Text.StringBuilder
            } else {
                [void]$body.Append($line + "`n")
            }
            continue
        }
        [void]$out.Append($line + "`n")
        $m = [regex]::Match($line, $hdStartRe)
        if ($m.Success) {
            $dashed = $m.Groups[2].Value
            $delim = $m.Groups[4].Value + $m.Groups[5].Value + $m.Groups[6].Value
            $post = $m.Groups[7].Value
            $pre = $line.Substring(0, $m.Index) + $m.Groups[1].Value
            $kind = Get-HeredocKind $pre $post
        }
    }
    [void]$out.Append($body.ToString())
    return $out.ToString().TrimEnd("`n")
}

$scan = Remove-QuotedHeredocBodies $cmd

# --- rm argument analysis (see bash-safety.sh for the verdict table) ---

$globOrVarRe = '[\]\[*?$`{}]'
$globRe = '[\]\[*?]'
$sysTopRe = '^(etc|usr|bin|sbin|var|opt|System|Library|Applications|private|home|Users|root|boot|dev|lib|lib64|proc|sys)$'
$tokRe = '^\s*((?:"[^"]*"|''[^'']*''|[^\s"'']+)+)(.*)$'
$leadVarBraceRe = '^\$\{([A-Za-z_][A-Za-z0-9_]*)\}(.*)$'
$leadVarRe = '^\$([A-Za-z_][A-Za-z0-9_]*)(.*)$'
$unresolvedVarRe = '^\$\{?([A-Z_][A-Z0-9_]*)\}?/'
$rmRe = '(^|[^A-Za-z0-9_.-])rm\s+([^;&|]*)(.*)$'

# bash: lookup_var
function Get-AssignedLiteral([string]$name, [string]$text) {
    $re = '(?m)(^|[ \t;&|(])' + $name + '[+]?=("[^"\n]*"|''[^''\n]*''|[^\s;&|)]*)'
    $uniq = ''
    foreach ($m in [regex]::Matches($text, $re)) {
        $v = $m.Value
        if ($v.Contains($name + '+=')) { return '' }
        $v = $v.Substring($v.IndexOf($name + '=') + $name.Length + 1)
        if ($v.StartsWith('"')) {
            $v = $v.Substring(1)
            if ($v.EndsWith('"')) { $v = $v.Substring(0, $v.Length - 1) }
            if ($v.Contains('$') -or $v.Contains('`')) { return '' }
        } elseif ($v.StartsWith("'")) {
            $v = $v.Substring(1)
            if ($v.EndsWith("'")) { $v = $v.Substring(0, $v.Length - 1) }
        } else {
            if ($v.Contains('$') -or $v.Contains('`') -or $v.Contains('(')) { return '' }
        }
        if ($v -eq '') { return '' }
        if ($uniq -eq '') { $uniq = $v } elseif ($uniq -cne $v) { return '' }
    }
    return $uniq
}

# bash: resolve_path
function Resolve-RmPath([string]$p, [string]$seen) {
    for ($i = 0; $i -lt 5; $i++) {
        $m = [regex]::Match($p, $leadVarBraceRe)
        if (-not $m.Success) { $m = [regex]::Match($p, $leadVarRe) }
        if (-not $m.Success) { break }
        $name = $m.Groups[1].Value
        $rest = $m.Groups[2].Value
        if ($name -ceq 'HOME' -or $name -ceq 'TMPDIR') { $p = '$' + $name + $rest; break }
        $val = Get-AssignedLiteral $name $seen
        if ($val -eq '') { break }
        $p = $val + $rest
    }
    return $p
}

# bash: split_path (returns the parts and the .. flag instead of globals)
function Split-RmPath([string]$p) {
    $parts = New-Object System.Collections.ArrayList
    $dotdot = $false
    foreach ($c in $p.Split('/')) {
        if ($c -eq '' -or $c -eq '.') { continue }
        if ($c -eq '..') { $dotdot = $true }
        [void]$parts.Add($c)
    }
    return @{ Parts = $parts; DotDot = $dotdot }
}

function Get-Part($sp, [int]$i) {
    if ($sp.Parts.Count -gt $i) { return [string]$sp.Parts[$i] }
    return ''
}

# bash: home_rest_ok
function Test-HomeRest([string]$rest) {
    $sp = Split-RmPath $rest
    if ($sp.DotDot) { return $false }
    if ($sp.Parts.Count -lt 2) { return $false }
    $p0 = Get-Part $sp 0
    $p1 = Get-Part $sp 1
    if ($p0.StartsWith('.') -or $p0 -ceq 'Library') { return $false }
    if ($p0 -cmatch $globOrVarRe -or $p1 -cmatch $globOrVarRe) { return $false }
    return $true
}

# bash: user_home_ok
function Test-UserHome([string]$s) {
    $u = $s.Split('/')[0]
    $r = ''
    if ($s.Contains('/')) { $r = $s.Substring($s.IndexOf('/') + 1) }
    if ($u -eq '') { return $false }
    if ($u -cmatch $globOrVarRe) { return $false }
    return (Test-HomeRest $r)
}

# bash: temp_rest_ok
function Test-TempRest([string]$rest, [int]$min) {
    $sp = Split-RmPath $rest
    if ($sp.DotDot) { return $false }
    if ($sp.Parts.Count -lt $min) { return $false }
    for ($i = 0; $i -lt [Math]::Min($min, 4); $i++) {
        if ((Get-Part $sp $i) -cmatch $globRe) { return $false }
    }
    return $true
}

function Get-After([string]$p, [string]$prefix) {
    if ($p.StartsWith($prefix)) { return $p.Substring($prefix.Length) }
    return $p
}

# bash: abs_ok
function Test-AbsPath([string]$p) {
    while ($p.Contains('//')) { $p = $p.Replace('//', '/') }
    while ($p.Contains('/./')) { $p = $p.Replace('/./', '/') }
    $sp = Split-RmPath $p
    if ($sp.DotDot) { return $false }
    if ($sp.Parts.Count -eq 0) { return $false }
    $p0 = Get-Part $sp 0
    $p1 = Get-Part $sp 1
    $p2 = Get-Part $sp 2
    if ($p0 -cmatch $globOrVarRe) { return $false }
    if ($p0 -ceq 'Users' -or $p0 -ceq 'home') { return (Test-UserHome (Get-After $p ('/' + $p0 + '/'))) }
    if ($p0 -ceq 'root') { return (Test-HomeRest (Get-After $p '/root')) }
    if ($p0 -ceq 'tmp') { return (Test-TempRest (Get-After $p '/tmp') 1) }
    if ($p0 -ceq 'private') {
        if ($p1 -ceq 'tmp') { return (Test-TempRest (Get-After $p '/private/tmp') 1) }
        if ($p1 -ceq 'var' -and $p2 -ceq 'tmp') { return (Test-TempRest (Get-After $p '/private/var/tmp') 1) }
        if ($p1 -ceq 'var' -and $p2 -ceq 'folders') { return (Test-TempRest (Get-After $p '/private/var/folders') 4) }
        return $false
    }
    if ($p0 -ceq 'var') {
        if ($p1 -ceq 'tmp') { return (Test-TempRest (Get-After $p '/var/tmp') 1) }
        if ($p1 -ceq 'folders') { return (Test-TempRest (Get-After $p '/var/folders') 4) }
        return $false
    }
    return (-not ($p0 -cmatch $sysTopRe))
}

# bash: judge_path
function Test-RmTarget([string]$p) {
    if ($p -ceq '~' -or $p.StartsWith('~/')) { return (Test-HomeRest $p.Substring(1)) }
    if ($p.StartsWith('~')) { return (Test-UserHome $p.Substring(1)) }
    if ($p -ceq '$HOME' -or $p.StartsWith('$HOME/')) { return (Test-HomeRest $p.Substring(5)) }
    if ($p -ceq '$TMPDIR' -or $p.StartsWith('$TMPDIR/')) { return (Test-TempRest $p.Substring(7) 1) }
    if ($p.StartsWith('/')) { return (Test-AbsPath $p) }
    return $true
}

# bash: check_rm_args. 3 = home/system target, 4 = unresolved unquoted $VAR/.
function Test-RmArgs([string]$argText, [string]$seen) {
    $force = $false
    $recur = $false
    $s = $argText
    while ($true) {
        $m = [regex]::Match($s, $tokRe)
        if (-not $m.Success) { break }
        $s = $m.Groups[2].Value
        $p = $m.Groups[1].Value.Replace('"', '').Replace("'", '')
        if ($p -ceq '--') { break }
        if ($p -ceq '--force') { $force = $true }
        elseif ($p -ceq '--recursive') { $recur = $true }
        elseif ($p.StartsWith('--')) { }
        elseif ($p.StartsWith('-') -and $p.Length -ge 2) {
            if ($p.Contains('f')) { $force = $true }
            if ($p -cmatch '[rR]') { $recur = $true }
        }
    }
    if (-not $force) { return 0 }
    $opts = $true
    $s = $argText
    while ($true) {
        $m = [regex]::Match($s, $tokRe)
        if (-not $m.Success) { break }
        $tok = $m.Groups[1].Value
        $s = $m.Groups[2].Value
        $p = $tok.Replace('"', '').Replace("'", '')
        if ($opts) {
            if ($p -ceq '--') { $opts = $false; continue }
            if ($p.StartsWith('-') -and $p.Length -ge 2) { continue }
        }
        $r = Resolve-RmPath $p $seen
        if (-not (Test-RmTarget $r)) { return 3 }
        if ($recur -and -not ($tok.StartsWith('"') -or $tok.StartsWith("'"))) {
            $u = [regex]::Match($r, $unresolvedVarRe)
            if ($u.Success -and $u.Groups[1].Value -cne 'HOME' -and $u.Groups[1].Value -cne 'TMPDIR') { return 4 }
        }
    }
    return 0
}

# bash: check_rm
function Test-RmCommand([string]$text) {
    $seen = ''
    foreach ($line in ($text -split "`n")) {
        $s = $line
        while ($true) {
            $m = [regex]::Match($s, $rmRe)
            if (-not $m.Success) { break }
            $rest = $m.Groups[3].Value
            $seen += $s.Substring(0, $m.Index)
            $rc = Test-RmArgs $m.Groups[2].Value $seen
            if ($rc -ne 0) { return $rc }
            $seen += $m.Value.Substring(0, $m.Value.Length - $rest.Length)
            $s = $rest
        }
        $seen += $s + "`n"
    }
    return 0
}

# --- Network download piped into an interpreter (bash: check_curl) ---

$curlRe = '(curl|wget)\s+[^|;&]*\|(.*)$'
$envPrefixRe = '^[ \t]*(env[ \t]+|[A-Za-z_][A-Za-z0-9_]*=\S*[ \t]+)(.*)$'
$pyDataRe = '^\s+(-[A-Za-z]+\s+)*(-c\s|-m\s+json\.tool(\s|$))'
$pyExecRe = '(exec|eval|compile)\s*\(|\.system\s*\(|popen|subprocess|pty\.spawn|runpy|pickle|marshal'

function Test-CurlPipe([string]$text) {
    foreach ($line in ($text -split "`n")) {
        $s = $line
        while ($true) {
            $m = [regex]::Match($s, $curlRe)
            if (-not $m.Success) { break }
            $tail = $m.Groups[2].Value
            $s = $tail
            if ($tail.StartsWith('|')) { continue }
            $seg = $tail
            while ($true) {
                $e = [regex]::Match($seg, $envPrefixRe)
                if (-not $e.Success) { break }
                $seg = $e.Groups[2].Value
            }
            $w = [regex]::Match($seg, $firstWordRe)
            if (-not $w.Success) { continue }
            $word = $w.Groups[1].Value
            $word = $word.Substring($word.LastIndexOf('/') + 1)
            $rest = $w.Groups[2].Value
            if ($word -cmatch '^(bash|sh|zsh|dash|ksh|fish|sudo|doas|node|nodejs|ruby|perl|php)$') { return $true }
            if ($word -cmatch '^(python|python[0-9].*)$') {
                if (($rest -cmatch $pyDataRe) -and -not ($rest -cmatch $pyExecRe)) { continue }
                return $true
            }
        }
    }
    return $false
}

# --- Destructive rm patterns ---

if ($scan -cmatch 'rm\s+[^|;&\r\n]*--no-preserve-root\b') {
    Block 'BLOCKED: rm --no-preserve-root is a documented prompt-injection signature; never legitimate'
}
$rmRc = Test-RmCommand $scan
if ($rmRc -eq 3) {
    Block 'BLOCKED: Destructive rm targeting system or home directory'
}
if ($rmRc -eq 4) {
    Block 'BLOCKED: rm -rf with unquoted variable risks /-expansion if variable is unset'
}
if ($scan -cmatch '(?m)rm\s+-rf\s+\.\s*$') {
    Block 'BLOCKED: rm -rf . is too dangerous; specify exact paths'
}
if ($scan -cmatch '(?m)rm\s+(-[a-zA-Z]*r[a-zA-Z]*\s+)/(\*|\s|;|$)') {
    Block 'BLOCKED: rm targeting root filesystem'
}

# --- find-based deletion (rm bypass) ---

if ($scan -cmatch 'find\s+(/|~|\$HOME|\.\.)\s.*(-delete|-exec\s+rm)') {
    Block 'BLOCKED: find with broad scope and -delete/-exec rm is a documented agent self-deletion pattern'
}

# --- Disk and filesystem destruction ---

if ($scan -cmatch 'dd\s+.*of=/dev/(sd[a-z]|nvme[0-9]|disk[0-9]|hd[a-z])') {
    Block 'BLOCKED: dd to a physical disk device'
}
if ($scan -cmatch '\bmkfs(\.[a-zA-Z0-9]+)?\s+/dev/(sd[a-z]|nvme[0-9]|disk[0-9]|hd[a-z])') {
    Block 'BLOCKED: mkfs against a physical disk device'
}
if ($scan -cmatch 'chmod\s+(-R\s+)?(777|000)\s+(/|/etc|/usr|/var|/opt)\b') {
    Block 'BLOCKED: chmod 777/000 against a system path'
}

# --- Privilege escalation ---

if ($scan -cmatch '(?m)(^|;|&|\|[ \t]|\$\(|`|\bthen|\bdo|\belse|\bxargs|\benv|\bnohup|\bexec|\btime|\bcommand)[ \t]*(sudo|doas|pkexec)\b') {
    Block 'BLOCKED: Privilege escalation (sudo/doas/pkexec) is not appropriate for an automated agent'
}
if ($scan -cmatch '(?m)(^|[;&|]|\$\(|`)[ \t]*ssh[ \t]+([^;&|\s]+[ \t]+){1,6}["'']?(sudo|doas|pkexec)\b') {
    Block 'BLOCKED: Privilege escalation (sudo/doas/pkexec) is not appropriate for an automated agent'
}
if ($scan -cmatch '(?m)(^|;|&&|\|\|)\s*su\s+(-|--login|root|--user)') {
    Block 'BLOCKED: su to switch user is not appropriate for an automated agent'
}

# --- Cloud metadata service exfiltration ---

if ($scan -cmatch '(curl|wget|http|nc|netcat)\s+[^|;&\r\n]*(169\.254\.169\.254|metadata\.google\.internal|fd00:ec2::254)') {
    Block 'BLOCKED: Access to cloud-instance metadata service (credential exfiltration vector)'
}

# --- Git dangerous operations ---

if ($scan -cmatch 'git\s+push\s+(-f|--force|--force-with-lease)\s+(origin\s+)?(main|master|trunk|develop|release(/|\b))') {
    Block 'BLOCKED: Force push to a protected branch is prohibited'
}
if ($scan -cmatch 'git\s+reset\s+--hard') {
    Block 'BLOCKED: git reset --hard is destructive; use git stash or git checkout instead'
}
if ($scan -cmatch 'git\s+clean\s+-[a-zA-Z]*f') {
    Block 'BLOCKED: git clean -f removes untracked files permanently'
}

# --- Database destruction (case-insensitive, mirrors grep -iE) ---

if ($scan -match '(?m)(DROP\s+(TABLE|DATABASE|SCHEMA)|TRUNCATE\s+TABLE|DELETE\s+FROM\s+\S+\s*;?\s*$)') {
    Block 'BLOCKED: Destructive database operation detected'
}

# --- Cloud teardown commands ---

if ($scan -cmatch 'aws\s+s3\s+(rm\s+--recursive|rb\s+--force)\b') {
    Block 'BLOCKED: aws s3 recursive delete; require human-typed command'
}
if ($scan -cmatch 'aws\s+ec2\s+terminate-instances\b') {
    Block 'BLOCKED: aws ec2 terminate-instances; require human-typed command'
}
if ($scan -cmatch 'gcloud\s+\S+\s+\S+\s+delete\s+.*--quiet\b') {
    Block 'BLOCKED: gcloud --quiet delete; require human-typed command'
}
if ($scan -cmatch 'az\s+group\s+delete\s+.*(--yes|-y)\b') {
    Block 'BLOCKED: az group delete --yes; require human-typed command'
}

# --- Process and system manipulation ---

if ($scan -cmatch 'kill\s+-9\s+(-1|1)\b|killall\s+-(9|KILL|SIGKILL)') {
    Block 'BLOCKED: Broad or forceful process killing is dangerous'
}
if ($scan -cmatch ':\(\)\{.*\}') {
    Block 'BLOCKED: Fork bomb pattern detected'
}
if ($scan -cmatch 'while\s+True.*os.*fork|while\s+1.*fork') {
    Block 'BLOCKED: Python fork bomb pattern detected'
}

# --- Tar with absolute paths ---

if ($scan -cmatch 'tar\s+[^|;&\r\n]*(--absolute-names|\s-P\b|\s-[a-zA-Z]*P[a-zA-Z]*\b)') {
    Block 'BLOCKED: tar with --absolute-names / -P can write outside the tree on extract'
}

# --- Untrusted code execution ---

if (Test-CurlPipe $scan) {
    Block 'BLOCKED: Piping a network download into a shell is a supply-chain risk'
}
if ($scan -cmatch '(bash|sh|zsh|source|\.\s)\s+<\(\s*(curl|wget)\b') {
    Block 'BLOCKED: Process substitution from network download into a shell is a supply-chain risk'
}
if ($scan -cmatch 'eval\s+"?\$\(\s*(curl|wget)\b') {
    Block 'BLOCKED: eval of network-downloaded content is a supply-chain risk'
}

# --- Persistence backdoors ---

if ($scan -cmatch '>>?\s*(~|\$HOME|\$\{HOME\})/?\.(bashrc|zshrc|bash_profile|zprofile|profile|bash_login)\b') {
    Block 'BLOCKED: Writing to shell rc files is a persistence-backdoor pattern'
}
if ($scan -cmatch '>>?\s*(~|\$HOME|\$\{HOME\})/?\.ssh/authorized_keys\b') {
    Block 'BLOCKED: Writing to authorized_keys is a persistence-backdoor pattern'
}

exit 0
