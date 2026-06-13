#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
# SPDX-License-Identifier: GPL-3.0-only
# PreToolUse hook: detect hardcoded secrets in Write/Edit/MultiEdit content.
#
# Scans tool_input for leaked credentials before the file is written.
# Exit 2 blocks the write; exit 0 allows it. Test files, fixtures,
# example configs, markdown docs, and hook scripts (which legitimately
# contain pattern strings) are skipped to avoid false positives.
#
# Pattern set informed by gitleaks v8.28+ canonical config (May 2026)
# and GitGuardian 2026 State of Secrets sprawl report. AI-service
# tokens (Hugging Face, Anthropic admin) are first-class citizens here
# as they are the fastest-growing leaked-credential class.

set -euo pipefail

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null || true)
CONTENT=""

case "$TOOL" in
  Write)
    CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // empty' 2>/dev/null || true)
    ;;
  Edit)
    CONTENT=$(echo "$INPUT" | jq -r '.tool_input.new_string // empty' 2>/dev/null || true)
    ;;
  MultiEdit)
    CONTENT=$(echo "$INPUT" | jq -r '[.tool_input.edits[].new_string // ""] | join("\n")' 2>/dev/null || true)
    ;;
  *)
    exit 0
    ;;
esac

if [ -z "$CONTENT" ]; then
  exit 0
fi

# Skip test files, fixtures, mocks, examples, samples, markdown docs.
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null || true)
FILE_BASENAME=$(basename "${FILE_PATH:-}")
if echo "$FILE_BASENAME" | grep -qiE '(test|spec|fixture|mock|example|sample|\.md$)'; then
  exit 0
fi

# Skip hook scripts themselves (they reference these patterns by name).
if echo "${FILE_PATH:-}" | grep -qE '/hooks/[^/]+\.(sh|py|js|mjs|ts|ps1)$'; then
  exit 0
fi

# --- Cloud and SaaS provider keys ---

# AWS access key
if echo "$CONTENT" | grep -qE 'AKIA[0-9A-Z]{16}'; then
  echo "BLOCKED: AWS access key detected (AKIA...)" >&2
  exit 2
fi

# Generic API key/secret/token assignment with non-placeholder value
if echo "$CONTENT" | grep -qE '(API_KEY|API_SECRET|SECRET_KEY|ACCESS_TOKEN|AUTH_TOKEN|PRIVATE_KEY)\s*[=:]\s*["'"'"'][A-Za-z0-9_/.+-]{20,}'; then
  echo "BLOCKED: Hardcoded secret detected (API key/token pattern)" >&2
  exit 2
fi

# OpenAI / Stripe live keys
if echo "$CONTENT" | grep -qE '(sk-[a-zA-Z0-9]{20,}|sk_live_[a-zA-Z0-9]{20,})'; then
  echo "BLOCKED: API key detected (OpenAI/Stripe live pattern)" >&2
  exit 2
fi

# Anthropic API/admin/session keys (extends to admin and sid variants)
if echo "$CONTENT" | grep -qE 'sk-ant-(api|admin|sid)\d{2}-[A-Za-z0-9_-]{32,}'; then
  echo "BLOCKED: Anthropic API/admin/session key detected" >&2
  exit 2
fi

# GitHub tokens (classic PAT, fine-grained PAT, OAuth, server-to-server, user-to-server)
if echo "$CONTENT" | grep -qE '(ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}|gho_[a-zA-Z0-9]{36}|ghs_[a-zA-Z0-9]{36}|ghu_[a-zA-Z0-9]{36})'; then
  echo "BLOCKED: GitHub token detected" >&2
  exit 2
fi

# GitLab personal access token (legacy + new dotted routable format)
if echo "$CONTENT" | grep -qE 'glpat-[0-9A-Za-z_-]{20,}'; then
  echo "BLOCKED: GitLab personal access token detected" >&2
  exit 2
fi

# Hugging Face user / org tokens
if echo "$CONTENT" | grep -qE 'hf_[A-Za-z]{34}\b'; then
  echo "BLOCKED: Hugging Face user token detected" >&2
  exit 2
fi
if echo "$CONTENT" | grep -qE 'api_org_[A-Za-z]{34}\b'; then
  echo "BLOCKED: Hugging Face organization token detected" >&2
  exit 2
fi

# Sentry user auth token (64-hex with sntryu_ prefix)
if echo "$CONTENT" | grep -qE 'sntryu_[a-f0-9]{64}\b'; then
  echo "BLOCKED: Sentry user auth token detected" >&2
  exit 2
fi

# Postman API key
if echo "$CONTENT" | grep -qE 'PMAK-[a-fA-F0-9]{24}-[a-fA-F0-9]{34}'; then
  echo "BLOCKED: Postman API key detected" >&2
  exit 2
fi

# PEM-armoured private key blocks (real format requires the dashes)
if echo "$CONTENT" | grep -qE -- '-----BEGIN[ A-Z]*PRIVATE KEY-----'; then
  echo "BLOCKED: PEM private key detected" >&2
  exit 2
fi

# Generic password assignment with hardcoded value
if echo "$CONTENT" | grep -qE 'PASSWORD\s*[=:]\s*["'"'"'][A-Za-z0-9!@#$%^&*]{8,}["'"'"']'; then
  if ! echo "$CONTENT" | grep -qE 'PASSWORD.*(process\.env|os\.environ|\$\{|your.password|changeme|placeholder|<password>|REDACTED)'; then
    echo "BLOCKED: Hardcoded password detected; use environment variables instead" >&2
    exit 2
  fi
fi

# Slack tokens (xoxb / xoxp / xoxa / xoxs) and webhook URLs
if echo "$CONTENT" | grep -qE 'xox[bpas]-[0-9a-zA-Z-]{10,}'; then
  echo "BLOCKED: Slack token detected" >&2
  exit 2
fi
if echo "$CONTENT" | grep -qE 'https://hooks\.slack\.com/services/T[A-Z0-9]+/B[A-Z0-9]+/[a-zA-Z0-9]{20,}'; then
  echo "BLOCKED: Slack webhook URL detected" >&2
  exit 2
fi

# npm publish tokens
if echo "$CONTENT" | grep -qE 'npm_[a-zA-Z0-9]{36}'; then
  echo "BLOCKED: npm token detected" >&2
  exit 2
fi

# Stripe restricted keys
if echo "$CONTENT" | grep -qE 'rk_live_[a-zA-Z0-9]{20,}'; then
  echo "BLOCKED: Stripe restricted key detected" >&2
  exit 2
fi

# Google API keys
if echo "$CONTENT" | grep -qE 'AIza[0-9A-Za-z_-]{35}'; then
  echo "BLOCKED: Google API key detected" >&2
  exit 2
fi

# Azure storage / SAS connection strings with embedded keys
if echo "$CONTENT" | grep -qiE 'DefaultEndpointsProtocol=https?;AccountName=[^;]+;AccountKey=[A-Za-z0-9+/=]{40,}'; then
  echo "BLOCKED: Azure storage connection string with embedded key detected" >&2
  exit 2
fi

# Database connection strings with embedded credentials
if echo "$CONTENT" | grep -qE '(postgres|postgresql|mysql|mongodb(\+srv)?|redis)://[^:/?]+:[^@/]+@'; then
  if ! echo "$CONTENT" | grep -qE '://(user|username|root):(\$\{|password|changeme|<)'; then
    echo "BLOCKED: Database connection string with embedded credentials detected" >&2
    exit 2
  fi
fi

# JWT-like tokens (loose; may produce false positives on legitimate
# JWTs in test data, but those tests should not flow through Write/Edit
# in the first place)
if echo "$CONTENT" | grep -qE 'eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}'; then
  echo "BLOCKED: JWT-shaped token detected; do not commit signed tokens" >&2
  exit 2
fi

exit 0
