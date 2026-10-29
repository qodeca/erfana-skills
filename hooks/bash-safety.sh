#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
# SPDX-License-Identifier: GPL-3.0-only
# Summary: Blocks shell commands that could destroy data or change your system, such as rm -rf on your home folder, a download piped into a shell, or sudo.
# PreToolUse hook: Block dangerous bash commands.
#
# Catches destructive patterns that allow/deny rules in settings.json
# cannot express on their own (compound commands, arguments mixed with
# paths, regex-only matches). Exit 2 blocks the command; exit 0 allows.
#
# Threat model informed by 2025-2026 incidents (Wolak, McAulay, Amazon Q
# supply-chain attack), CVE-2025-54794/-54795, and EC2 IMDS exfiltration
# campaigns. Personal style preferences live in user settings, not here.
#
# Kept in behavioural lockstep with bash-safety.ps1: every helper below has a
# same-named counterpart there, and tests/hooks/bash-safety/ pins both.

set -euo pipefail

INPUT=$(cat)
CMD=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null || true)

if [ -z "$CMD" ]; then
  exit 0
fi

# --- Normalisation ----------------------------------------------------------
# Drop CRs and join backslash-newline continuations, so a command split over
# lines is read whole (`rm -rf \<newline> /etc` used to slip past per-line
# matching).
CMD=${CMD//$'\r'/}
CMD=${CMD//$'\\\n'/ }

# Quoted heredoc bodies (<<'EOF' / <<"EOF" / <<\EOF) are not expanded by the
# shell. When their consumer is a file writer (cat, tee) or a non-shell
# interpreter (python, node, ruby, perl) the body is file content or program
# text, not shell, so scanning it for `sudo` or `DROP TABLE` produced false
# positives. Those bodies are dropped from the scanned text. Still scanned:
# unquoted heredocs (they expand $(...)), heredocs fed to a shell, ssh, sudo,
# a SQL client or any other command, heredocs whose line pipes on into one of
# those, interpreter bodies that also call a database API, and an
# unterminated body.
HD_START_RE="(^|[^<])<<(-?)[[:space:]]*('([A-Za-z0-9_.-]+)'|\"([A-Za-z0-9_.-]+)\"|\\\\([A-Za-z0-9_.-]+))(.*)$"
HD_PIPE_RE='\|[[:space:]]*(sudo|doas|bash|sh|zsh|dash|ksh|fish|source|eval|xargs|ssh|psql|mysql|mariadb|sqlite3|sqlcmd|python[0-9.]*|node|ruby|perl)([[:space:]]|$)'
DB_EXEC_RE='(execute|executescript|executemany|cursor|connect|query|raw)[[:space:]]*\('
ASSIGN_PREFIX_RE='^[[:space:]]*[A-Za-z_][A-Za-z0-9_]*=[^[:space:]]*[[:space:]]+(.*)$'
FIRST_WORD_RE='^[[:space:]]*([^[:space:]]+)(.*)$'

heredoc_kind() { # $1 = text before <<, $2 = text after the delimiter
  local pre=$1 post=$2 seg word
  if [[ $post =~ $HD_PIPE_RE ]]; then echo keep; return; fi
  seg=${pre##*[;&|(]}
  while [[ $seg =~ $ASSIGN_PREFIX_RE ]]; do seg=${BASH_REMATCH[1]}; done
  if ! [[ $seg =~ $FIRST_WORD_RE ]]; then echo keep; return; fi
  word=${BASH_REMATCH[1]}
  word=${word##*/}
  case $word in
    cat|tee) echo file ;;
    python|python[0-9]*|node|ruby|perl) echo interp ;;
    *) echo keep ;;
  esac
}

strip_heredocs() {
  local out="" line delim="" dashed="" kind="" body="" cmp pre post
  while IFS= read -r line || [ -n "$line" ]; do
    if [ -n "$delim" ]; then
      cmp=$line
      if [ -n "$dashed" ]; then cmp=${cmp#"${cmp%%[!$'\t']*}"}; fi
      if [ "$cmp" = "$delim" ]; then
        if [ "$kind" = keep ] || { [ "$kind" = interp ] && [[ $body =~ $DB_EXEC_RE ]]; }; then
          out+=$body
        fi
        out+=$line$'\n'
        delim=""
        body=""
      else
        body+=$line$'\n'
      fi
      continue
    fi
    out+=$line$'\n'
    if [[ $line =~ $HD_START_RE ]]; then
      dashed=${BASH_REMATCH[2]}
      delim=${BASH_REMATCH[4]}${BASH_REMATCH[5]}${BASH_REMATCH[6]}
      post=${BASH_REMATCH[7]}
      pre=${line%"${BASH_REMATCH[0]}"}${BASH_REMATCH[1]}
      kind=$(heredoc_kind "$pre" "$post")
    fi
  done <<< "$1"
  out+=$body
  printf '%s' "$out"
}

SCAN=$(strip_heredocs "$CMD")

# Here-strings, not `echo | grep -q`: grep -q exits on the first match, and on
# a command larger than the pipe buffer echo then dies of SIGPIPE, pipefail
# turns the pipeline false, and the rule silently stops matching.
has()  { grep -qE  -- "$1" <<< "$SCAN"; }
hasi() { grep -qiE -- "$1" <<< "$SCAN"; }

# --- rm argument analysis ---------------------------------------------------
# Each rm invocation's arguments are judged one by one. A leading $VAR or
# ${VAR} is resolved when the same command, earlier on, assigned VAR exactly
# one literal value (no $, backtick or command substitution). Verdicts:
#   home dir      allowed only two or more levels below it (~/Projects/x),
#                 never under a dot-directory or ~/Library, never through a
#                 glob or unresolved variable in those two levels
#   temp roots    /tmp, /private/tmp, /var/tmp, $TMPDIR: allowed one level
#                 below; /var/folders: four levels below (inside .../T/);
#                 the root itself or a glob directly at it is blocked
#   system roots  blocked (/etc, /usr, /var, /System, /Library, ...)
#   ..            blocked anywhere in an absolute or home path
GLOB_OR_VAR_RE='[][*?$`{}]'
GLOB_RE='[][*?]'
SYS_TOP_RE='^(etc|usr|bin|sbin|var|opt|System|Library|Applications|private|home|Users|root|boot|dev|lib|lib64|proc|sys)$'
TOK_RE="^[[:space:]]*((\"[^\"]*\"|'[^']*'|[^[:space:]\"']+)+)(.*)$"
LEAD_VAR_BRACE_RE='^\$\{([A-Za-z_][A-Za-z0-9_]*)\}(.*)$'
LEAD_VAR_RE='^\$([A-Za-z_][A-Za-z0-9_]*)(.*)$'
UNRESOLVED_VAR_RE='^\$\{?([A-Z_][A-Z0-9_]*)\}?/'
RM_RE='(^|[^A-Za-z0-9_.-])rm[[:space:]]+([^;&|]*)(.*)$'

# Prints the single literal value NAME was assigned in TEXT, else nothing.
lookup_var() {
  local name=$1 text=$2 vals v uniq=""
  vals=$(grep -oE "(^|[[:space:];&|(])${name}[+]?=(\"[^\"]*\"|'[^']*'|[^[:space:];&|)]*)" <<< "$text" || true)
  [ -z "$vals" ] && return 0
  while IFS= read -r v; do
    case $v in *"${name}+="*) return 0 ;; esac
    v=${v#*"${name}="}
    case $v in
      \"*) v=${v#\"}; v=${v%\"}
           case $v in *'$'*|*'`'*) return 0 ;; esac ;;
      \'*) v=${v#\'}; v=${v%\'} ;;
      *)   case $v in *'$'*|*'`'*|*'('*) return 0 ;; esac ;;
    esac
    [ -z "$v" ] && return 0
    if [ -z "$uniq" ]; then uniq=$v; elif [ "$uniq" != "$v" ]; then return 0; fi
  done <<< "$vals"
  printf '%s' "$uniq"
}

resolve_path() { # $1 = quote-stripped argument, $2 = command text before this rm
  local p=$1 i=0 name rest val
  while [ $i -lt 5 ]; do
    i=$((i + 1))
    if [[ $p =~ $LEAD_VAR_BRACE_RE ]] || [[ $p =~ $LEAD_VAR_RE ]]; then
      name=${BASH_REMATCH[1]}
      rest=${BASH_REMATCH[2]}
      case $name in HOME|TMPDIR) p="\$$name$rest"; break ;; esac
      val=$(lookup_var "$name" "$2")
      [ -z "$val" ] && break
      p=$val$rest
    else
      break
    fi
  done
  printf '%s' "$p"
}

split_path() { # sets NPARTS, P0..P3, HAS_DOTDOT
  local rest=$1 c
  NPARTS=0; P0=""; P1=""; P2=""; P3=""; HAS_DOTDOT=0
  while [ -n "$rest" ]; do
    case $rest in
      */*) c=${rest%%/*}; rest=${rest#*/} ;;
      *)   c=$rest; rest="" ;;
    esac
    case $c in
      ""|.) continue ;;
      ..) HAS_DOTDOT=1 ;;
    esac
    case $NPARTS in 0) P0=$c ;; 1) P1=$c ;; 2) P2=$c ;; 3) P3=$c ;; esac
    NPARTS=$((NPARTS + 1))
  done
}

home_rest_ok() { # $1 = path below a home directory
  split_path "$1"
  [ "$HAS_DOTDOT" = 0 ] || return 1
  [ "$NPARTS" -ge 2 ] || return 1
  case $P0 in .*|Library) return 1 ;; esac
  if [[ $P0 =~ $GLOB_OR_VAR_RE ]] || [[ $P1 =~ $GLOB_OR_VAR_RE ]]; then return 1; fi
  return 0
}

user_home_ok() { # $1 = "<user>[/rest]"
  local u=${1%%/*} r=""
  case $1 in */*) r=${1#*/} ;; esac
  [ -n "$u" ] || return 1
  if [[ $u =~ $GLOB_OR_VAR_RE ]]; then return 1; fi
  home_rest_ok "$r"
}

temp_rest_ok() { # $1 = path below a temp root, $2 = levels required
  split_path "$1"
  [ "$HAS_DOTDOT" = 0 ] || return 1
  [ "$NPARTS" -ge "$2" ] || return 1
  if [[ $P0 =~ $GLOB_RE ]]; then return 1; fi
  if [ "$2" -ge 2 ] && [[ $P1 =~ $GLOB_RE ]]; then return 1; fi
  if [ "$2" -ge 3 ] && [[ $P2 =~ $GLOB_RE ]]; then return 1; fi
  if [ "$2" -ge 4 ] && [[ $P3 =~ $GLOB_RE ]]; then return 1; fi
  return 0
}

abs_ok() { # $1 = absolute path
  local p=$1
  while [[ $p == *//* ]]; do p=${p//\/\///}; done
  while [[ $p == */./* ]]; do p=${p//\/.\///}; done
  split_path "$p"
  [ "$HAS_DOTDOT" = 0 ] || return 1
  [ "$NPARTS" -gt 0 ] || return 1
  if [[ $P0 =~ $GLOB_OR_VAR_RE ]]; then return 1; fi
  case $P0 in
    Users|home) user_home_ok "${p#/"$P0"/}" ;;
    root) home_rest_ok "${p#/root}" ;;
    tmp) temp_rest_ok "${p#/tmp}" 1 ;;
    private)
      if [ "$P1" = tmp ]; then temp_rest_ok "${p#/private/tmp}" 1
      elif [ "$P1" = var ] && [ "$P2" = tmp ]; then temp_rest_ok "${p#/private/var/tmp}" 1
      elif [ "$P1" = var ] && [ "$P2" = folders ]; then temp_rest_ok "${p#/private/var/folders}" 4
      else return 1; fi ;;
    var)
      if [ "$P1" = tmp ]; then temp_rest_ok "${p#/var/tmp}" 1
      elif [ "$P1" = folders ]; then temp_rest_ok "${p#/var/folders}" 4
      else return 1; fi ;;
    *) if [[ $P0 =~ $SYS_TOP_RE ]]; then return 1; fi ;;
  esac
}

judge_path() { # 0 = acceptable rm -f target, 1 = home/system target
  local p=$1
  case $p in
    \~|\~/*) home_rest_ok "${p#\~}" ;;
    \~*) user_home_ok "${p#\~}" ;;
    '$HOME'|'$HOME/'*) home_rest_ok "${p#\$HOME}" ;;
    '$TMPDIR'|'$TMPDIR/'*) temp_rest_ok "${p#\$TMPDIR}" 1 ;;
    /*) abs_ok "$p" ;;
    *) return 0 ;;
  esac
}

# Returns 3 for a home/system target, 4 for an unresolved unquoted $VAR/.
check_rm_args() { # $1 = argument text, $2 = command text before this rm
  local s=$1 tok p r force=0 recur=0 opts=1
  while [[ $s =~ $TOK_RE ]]; do
    tok=${BASH_REMATCH[1]}; s=${BASH_REMATCH[3]}
    p=${tok//\"/}; p=${p//\'/}
    [ "$p" = "--" ] && break
    case $p in
      --force) force=1 ;;
      --recursive) recur=1 ;;
      --*) ;;
      -?*)
        case $p in *f*) force=1 ;; esac
        case $p in *[rR]*) recur=1 ;; esac ;;
    esac
  done
  [ "$force" = 1 ] || return 0
  s=$1
  while [[ $s =~ $TOK_RE ]]; do
    tok=${BASH_REMATCH[1]}; s=${BASH_REMATCH[3]}
    p=${tok//\"/}; p=${p//\'/}
    if [ "$opts" = 1 ]; then
      if [ "$p" = "--" ]; then opts=0; continue; fi
      case $p in -?*) continue ;; esac
    fi
    r=$(resolve_path "$p" "$2")
    judge_path "$r" || return 3
    if [ "$recur" = 1 ]; then
      case $tok in
        \"*|\'*) ;;
        *) if [[ $r =~ $UNRESOLVED_VAR_RE ]]; then
             case ${BASH_REMATCH[1]} in HOME|TMPDIR) ;; *) return 4 ;; esac
           fi ;;
      esac
    fi
  done
  return 0
}

check_rm() {
  local s line seen="" m args rest rc
  while IFS= read -r line || [ -n "$line" ]; do
    s=$line
    while [[ $s =~ $RM_RE ]]; do
      m=${BASH_REMATCH[0]}; args=${BASH_REMATCH[2]}; rest=${BASH_REMATCH[3]}
      seen+=${s%"$m"}
      rc=0
      check_rm_args "$args" "$seen" || rc=$?
      [ "$rc" = 0 ] || return "$rc"
      seen+=${m%"$rest"}
      s=$rest
    done
    seen+=$s$'\n'
  done <<< "$1"
  return 0
}

# --- Network download piped into an interpreter -----------------------------
# Returns 1 when a curl/wget pipeline feeds a shell, sudo/doas, node, ruby,
# perl or php, or python reading its program from stdin. python -c '<code>'
# and python -m json.tool treat the download as data and pass, unless the
# inline code itself executes or unpickles input.
CURL_RE='(curl|wget)[[:space:]]+[^|;&]*\|(.*)$'
ENV_PREFIX_RE='^[[:space:]]*(env[[:space:]]+|[A-Za-z_][A-Za-z0-9_]*=[^[:space:]]*[[:space:]]+)(.*)$'
PY_DATA_RE='^[[:space:]]+(-[A-Za-z]+[[:space:]]+)*(-c[[:space:]]|-m[[:space:]]+json\.tool([[:space:]]|$))'
PY_EXEC_RE='(exec|eval|compile)[[:space:]]*\(|\.system[[:space:]]*\(|popen|subprocess|pty\.spawn|runpy|pickle|marshal'

check_curl() {
  local line s tail seg word args
  while IFS= read -r line || [ -n "$line" ]; do
    s=$line
    while [[ $s =~ $CURL_RE ]]; do
      tail=${BASH_REMATCH[2]}
      s=$tail
      case $tail in '|'*) continue ;; esac
      seg=$tail
      while [[ $seg =~ $ENV_PREFIX_RE ]]; do seg=${BASH_REMATCH[2]}; done
      [[ $seg =~ $FIRST_WORD_RE ]] || continue
      word=${BASH_REMATCH[1]##*/}
      args=${BASH_REMATCH[2]}
      case $word in
        bash|sh|zsh|dash|ksh|fish|sudo|doas|node|nodejs|ruby|perl|php) return 1 ;;
        python|python[0-9]*)
          if [[ $args =~ $PY_DATA_RE ]] && ! [[ $args =~ $PY_EXEC_RE ]]; then continue; fi
          return 1 ;;
      esac
    done
  done <<< "$1"
  return 0
}

# --- Destructive rm patterns ---

# rm with --no-preserve-root is the documented prompt-injection signature
if has 'rm\s+[^|;&]*--no-preserve-root\b'; then
  echo "BLOCKED: rm --no-preserve-root is a documented prompt-injection signature; never legitimate" >&2
  exit 2
fi

# rm -f / -rf against home or system paths, and rm -rf $UNSET/ (Steam-bug
# class). Both judged per argument by check_rm above.
RM_RC=0
check_rm "$SCAN" || RM_RC=$?
if [ "$RM_RC" = 3 ]; then
  echo "BLOCKED: Destructive rm targeting system or home directory" >&2
  exit 2
fi
if [ "$RM_RC" = 4 ]; then
  echo "BLOCKED: rm -rf with unquoted variable risks /-expansion if variable is unset" >&2
  exit 2
fi

# rm -rf . (a typo can wipe the working tree)
if has 'rm\s+-rf\s+\.\s*$'; then
  echo "BLOCKED: rm -rf . is too dangerous; specify exact paths" >&2
  exit 2
fi

# rm targeting root filesystem
if has 'rm\s+(-[a-zA-Z]*r[a-zA-Z]*\s+)/(\*|\s|;|$)'; then
  echo "BLOCKED: rm targeting root filesystem" >&2
  exit 2
fi

# --- find-based deletion (rm bypass) ---

# find ... -delete or find ... -exec rm with broad scope
if has 'find\s+(/|~|\$HOME|\.\.)\s.*(-delete|-exec\s+rm)'; then
  echo "BLOCKED: find with broad scope and -delete/-exec rm is a documented agent self-deletion pattern" >&2
  exit 2
fi

# --- Disk and filesystem destruction ---

# dd to a real device (sd*, nvme*, disk*); allow loop / sparse files
if has 'dd\s+.*of=/dev/(sd[a-z]|nvme[0-9]|disk[0-9]|hd[a-z])'; then
  echo "BLOCKED: dd to a physical disk device" >&2
  exit 2
fi

# mkfs of any flavour against a real device
if has '\bmkfs(\.[a-zA-Z0-9]+)?\s+/dev/(sd[a-z]|nvme[0-9]|disk[0-9]|hd[a-z])'; then
  echo "BLOCKED: mkfs against a physical disk device" >&2
  exit 2
fi

# chmod 777 / 000 against system paths
if has 'chmod\s+(-R\s+)?(777|000)\s+(/|/etc|/usr|/var|/opt)\b'; then
  echo "BLOCKED: chmod 777/000 against a system path" >&2
  exit 2
fi

# --- Privilege escalation ---
# Command position: line start, after ; & && || or a spaced pipe, inside $( )
# or backticks, after a shell keyword or a launcher (xargs, env, nohup, exec,
# time, command), and as the remote command of ssh.

if has '(^|;|&|\|\s|\$\(|`|\bthen|\bdo|\belse|\bxargs|\benv|\bnohup|\bexec|\btime|\bcommand)\s*(sudo|doas|pkexec)\b'; then
  echo "BLOCKED: Privilege escalation (sudo/doas/pkexec) is not appropriate for an automated agent" >&2
  exit 2
fi
if has '(^|[;&|]|\$\(|`)\s*ssh\s+([^;&|[:space:]]+\s+){1,6}["'"'"']?(sudo|doas|pkexec)\b'; then
  echo "BLOCKED: Privilege escalation (sudo/doas/pkexec) is not appropriate for an automated agent" >&2
  exit 2
fi

if has '(^|;|&&|\|\|)\s*su\s+(-|--login|root|--user)'; then
  echo "BLOCKED: su to switch user is not appropriate for an automated agent" >&2
  exit 2
fi

# --- Cloud metadata service exfiltration ---
# IMDSv1 endpoints across AWS/GCP/Azure; primary credential-theft path in 2025
if has '(curl|wget|http|nc|netcat)\s+[^|;&]*(169\.254\.169\.254|metadata\.google\.internal|fd00:ec2::254)'; then
  echo "BLOCKED: Access to cloud-instance metadata service (credential exfiltration vector)" >&2
  exit 2
fi

# --- Git dangerous operations ---

# Force push to protected branches (catches compound commands too)
if has 'git\s+push\s+(-f|--force|--force-with-lease)\s+(origin\s+)?(main|master|trunk|develop|release(/|\b))'; then
  echo "BLOCKED: Force push to a protected branch is prohibited" >&2
  exit 2
fi

# Hard reset
if has 'git\s+reset\s+--hard'; then
  echo "BLOCKED: git reset --hard is destructive; use git stash or git checkout instead" >&2
  exit 2
fi

# Clean with force (removes untracked files permanently)
if has 'git\s+clean\s+-[a-zA-Z]*f'; then
  echo "BLOCKED: git clean -f removes untracked files permanently" >&2
  exit 2
fi

# --- Database destruction ---
if hasi '(DROP\s+(TABLE|DATABASE|SCHEMA)|TRUNCATE\s+TABLE|DELETE\s+FROM\s+\S+\s*;?\s*$)'; then
  echo "BLOCKED: Destructive database operation detected" >&2
  exit 2
fi

# --- Cloud teardown commands ---

if has 'aws\s+s3\s+(rm\s+--recursive|rb\s+--force)\b'; then
  echo "BLOCKED: aws s3 recursive delete; require human-typed command" >&2
  exit 2
fi
if has 'aws\s+ec2\s+terminate-instances\b'; then
  echo "BLOCKED: aws ec2 terminate-instances; require human-typed command" >&2
  exit 2
fi
if has 'gcloud\s+\S+\s+\S+\s+delete\s+.*--quiet\b'; then
  echo "BLOCKED: gcloud --quiet delete; require human-typed command" >&2
  exit 2
fi
if has 'az\s+group\s+delete\s+.*(--yes|-y)\b'; then
  echo "BLOCKED: az group delete --yes; require human-typed command" >&2
  exit 2
fi

# --- Process and system manipulation ---

if has 'kill\s+-9\s+(-1|1)\b|killall\s+-(9|KILL|SIGKILL)'; then
  echo "BLOCKED: Broad or forceful process killing is dangerous" >&2
  exit 2
fi

# Fork bomb (textbook bash form + python equivalent)
if has ':\(\)\{.*\}'; then
  echo "BLOCKED: Fork bomb pattern detected" >&2
  exit 2
fi
if has 'while\s+True.*os.*fork|while\s+1.*fork'; then
  echo "BLOCKED: Python fork bomb pattern detected" >&2
  exit 2
fi

# --- Tar with absolute paths ---
# --absolute-names / -P lets the archive write to /etc, /usr, etc. on
# extract. Block unconditionally; legitimate use is essentially nil
# and the agent should never reach for it without human review.
if has 'tar\s+[^|;&]*(--absolute-names|\s-P\b|\s-[a-zA-Z]*P[a-zA-Z]*\b)'; then
  echo "BLOCKED: tar with --absolute-names / -P can write outside the tree on extract" >&2
  exit 2
fi

# --- Untrusted code execution ---
# Curl/wget piped to an interpreter (judged by check_curl above), plus
# process-substitution and eval variants
if ! check_curl "$SCAN"; then
  echo "BLOCKED: Piping a network download into a shell is a supply-chain risk" >&2
  exit 2
fi
if has '(bash|sh|zsh|source|\.\s)\s+<\(\s*(curl|wget)\b'; then
  echo "BLOCKED: Process substitution from network download into a shell is a supply-chain risk" >&2
  exit 2
fi
if has 'eval\s+"?\$\(\s*(curl|wget)\b'; then
  echo "BLOCKED: eval of network-downloaded content is a supply-chain risk" >&2
  exit 2
fi

# --- Persistence backdoors ---
# Writing to dotfiles or authorized_keys (Bitwarden CLI 2026 attack pattern)
if has '>>?\s*(~|\$HOME|\$\{HOME\})/?\.(bashrc|zshrc|bash_profile|zprofile|profile|bash_login)\b'; then
  echo "BLOCKED: Writing to shell rc files is a persistence-backdoor pattern" >&2
  exit 2
fi
if has '>>?\s*(~|\$HOME|\$\{HOME\})/?\.ssh/authorized_keys\b'; then
  echo "BLOCKED: Writing to authorized_keys is a persistence-backdoor pattern" >&2
  exit 2
fi

exit 0
