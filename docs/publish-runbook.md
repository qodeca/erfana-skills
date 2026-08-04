# Branch-protection recipe (residue of the publish runbook)

> **The publish was executed on 2026-06-13.** `qodeca/erfana-skills` is public, the full private history lives on in `qodeca/erfana-skills-archive`, and releases have run from v6.0.0 to the current version. The step-by-step publish sequence that used to fill this file is spent one-shot history and has been removed – it was written in the future tense and included a `gh repo rename` that would have renamed the **live public repository** if anyone followed it today. What remains is the one genuinely reusable part: the `main-protection` ruleset and how to move it between repositories. Use it for disaster recovery, or when standing up a second repo that needs the same protection. The historical narrative of the release itself is in [`release-notes-v6.0.0.md`](release-notes-v6.0.0.md) and `CHANGELOG.md`.

## The `main-protection` ruleset

Rulesets are not part of a repository's tree, so they do not travel with a clone, a fork, or a fresh `git init`. On `main` this one enforces `deletion` + `non_fast_forward` + `required_signatures` + `pull_request` (squash-only merges, code-owner review required, 0 required approvals, dismiss stale reviews on push), with an admin (`RepositoryRole`) bypass so the solo maintainer can `--admin` merge. `CODEOWNERS` ships in the tree, so code-owner review resolves to `@marcinobel`.

### Copy it from an existing repo (drift-free)

Export from a repo that already has it and import to the target – no hand-transcription:

```bash
RID=$(gh api repos/qodeca/erfana-skills-archive/rulesets \
  --jq '.[] | select(.name=="main-protection") | .id')
gh api "repos/qodeca/erfana-skills-archive/rulesets/$RID" \
  --jq 'del(.id, .created_at, .updated_at, .node_id, .source, .source_type, ._links, .current_user_can_bypass)' \
  > /tmp/main-ruleset.json
gh api repos/<owner>/<target-repo>/rulesets --method POST --input /tmp/main-ruleset.json

# Verify it landed.
gh api repos/<owner>/<target-repo>/rulesets \
  --jq '.[] | {name, enforcement, rules: [.rules[].type]}'
# expect: main-protection / active / [deletion, non_fast_forward, required_signatures, pull_request]
```

### Or POST it from scratch

If no source repo is reachable, POST this equivalent (fill the admin role `actor_id`, usually `5`):

```bash
gh api repos/<owner>/<target-repo>/rulesets --method POST --input - <<'JSON'
{
  "name": "main-protection",
  "target": "branch",
  "enforcement": "active",
  "conditions": { "ref_name": { "include": ["refs/heads/main"], "exclude": [] } },
  "bypass_actors": [{ "actor_id": 5, "actor_type": "RepositoryRole", "bypass_mode": "always" }],
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    { "type": "required_signatures" },
    { "type": "pull_request", "parameters": {
        "allowed_merge_methods": ["squash"],
        "dismiss_stale_reviews_on_push": true,
        "require_code_owner_review": true,
        "require_last_push_approval": false,
        "required_approving_review_count": 0,
        "required_review_thread_resolution": false,
        "required_reviewers": []
    }}
  ]
}
JSON
```

Optional hardening (not enabled today): add a `required_status_checks` rule so the `gates` and `secret-scan` CI jobs must pass before merge – `{"type":"required_status_checks","parameters":{"strict_required_status_checks_policy":true,"required_status_checks":[{"context":"gates"},{"context":"secret-scan"}]}}`.

### The `develop` branch

`develop` is an ordinary unprotected integration branch and is likewise absent from a fresh repo. Recreate it with `git push origin main:develop`.

## See also

- [`oss-launch-checklist.md`](oss-launch-checklist.md) – the launch obligations that are still open, plus the standing data-protection obligation for the archived private repo.
- [`../CLAUDE.md`](../CLAUDE.md) `## Release process` – the live release flow this protection ruleset shapes (signed commits, code-owner review, admin-merge for the solo maintainer).
