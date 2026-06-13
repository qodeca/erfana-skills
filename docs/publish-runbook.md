# Publish runbook — fresh public repo

The exact command sequence to take erfana from the private repo to a public, globally installable Claude Code plugin. This is the executable companion to [`oss-launch-checklist.md`](oss-launch-checklist.md): the checklist is the *what and why*; this is the *how*, copy-pasteable.

**Read first:** the only irreversible step is [§5 Publish](#5-publish). Everything before it is rehearsable and abortable. Run every command from a clean checkout of `main` after `develop` has been promoted.

Conventions below: `SRC` is your existing working clone; `PUB` is the pristine tree you build and push.

```bash
SRC=~/Projects/erfana-skills        # adjust to your path
PUB=/tmp/erfana-public              # throwaway build dir
```

## 1. Pre-flight (must all pass)

```bash
cd "$SRC"
git checkout main && git pull origin main          # main carries the develop -> main release merge
git branch --show-current                          # expect: main
git status --short                                  # expect: empty (clean tree)

bash scripts/run-all-gates.sh                       # expect: === ALL GATES PASSED ===
claude plugin validate . --strict                   # expect: Validation passed
python3 -m reuse lint                                # expect: compliant
```

Confirm the manifest version is the one you intend to ship:

```bash
grep '"version"' .claude-plugin/plugin.json          # expect: "version": "6.0.0"
```

## 2. History secret scan (rotate before publishing)

CI already runs both scanners on every push/PR (the `secret-scan` job in `verify.yml`: gitleaks over full history, trufflehog failing on verified secrets). The published tree is a single fresh commit, but scan the **old history** anyway — anything that ever leaked must be rotated regardless of how you publish.

```bash
gitleaks detect --source "$SRC" --log-opts="--all" --redact -v
# trufflehog (second scanner — install if missing: brew install trufflehog)
trufflehog git "file://$SRC" --results=verified,unknown
```

Both must report no verified secrets. Rotate anything found, then re-run.

## 3. Confirm zero forks

A fork of the private repo would keep the old 424 MB history (qodeca brandbook PDFs, employee photos) reachable even after you publish a clean tree. Must be zero before renaming.

```bash
gh api repos/qodeca/erfana-skills/forks --jq 'length'   # expect: 0
```

## 4. Build the pristine tree (no old history)

`git archive` exports exactly the tracked tree at `main` — no `.git`, no ignored files, no history. A fresh `git init` then gives a repo whose every object is reachable only from one clean commit.

```bash
rm -rf "$PUB" && mkdir -p "$PUB"
cd "$SRC"
git archive --format=tar main | tar -x -C "$PUB"

cd "$PUB"
git init -b main
git config user.name  "Marcin Obel"
git config user.email "marcin.obel@gmail.com"        # gmail identity — qodeca.com triggers no_user
git config commit.gpgsign true                        # keep the verified badge
git config gpg.format ssh
git add -A
git commit -S -m "erfana v6.0.0 — open-source release (GPL-3.0-only)"
```

### Verify the tree is clean

```bash
git rev-list --count HEAD                              # expect: 1
git log --format='%ae %ce %G?' -1                      # expect: gmail gmail G

# No large/binary blobs (the qodeca PDFs/photos must NOT be present):
git rev-list --objects HEAD \
  | git cat-file --batch-check='%(objecttype) %(objectsize) %(rest)' \
  | awk '$1=="blob" && $2>1000000 {print $2, $3}' | sort -rn | head
# expect: empty, or only intentionally-shipped assets (no */brands/qodeca/*, no *.pdf brandbook)

# Sanity: gates still pass on the pristine tree
bash scripts/run-all-gates.sh && claude plugin validate . --strict
```

Confirm the commit signature locally before publishing — no throwaway repo needed:

```bash
git log --show-signature -1     # expect: Good "git" signature for marcin.obel@gmail.com
```

The verified badge on GitHub itself is confirmed at the step 5 post-push check, and a `no_user` / unverified result is fixable by re-pushing before you announce.

## 5. Publish (point of no return)

```bash
# (a) Archive the existing private repo — keeps full history private as the record of origin.
gh repo rename erfana-skills-archive --repo qodeca/erfana-skills

# (b) Create the new public repo from the pristine tree and push the single commit.
cd "$PUB"
gh repo create qodeca/erfana-skills --public --source "$PUB" --remote origin --push
```

### Post-push verification (on the new public repo)

```bash
gh repo view qodeca/erfana-skills --json visibility,defaultBranchRef --jq '{vis:.visibility, default:.defaultBranchRef.name}'
# expect: {"vis":"PUBLIC","default":"main"}
gh api repos/qodeca/erfana-skills/commits --jq 'length'      # expect: 1
gh api repos/qodeca/erfana-skills/commits/main --jq '.commit.verification.verified'   # expect: true
```

If `verified` is `false` with reason `no_user`, the committer email is not on the account's verified-emails list — fix the email and re-push before anyone clones.

## 6. Restore branch protection + Git Flow on the public repo

The rulesets and `develop` branch do not carry over to a fresh repo. The `main-protection` ruleset to recreate enforces, on `main`: `deletion` + `non_fast_forward` + `required_signatures` + `pull_request` (squash-only merges, code-owner review required, 0 required approvals, dismiss stale reviews on push), with an admin (`RepositoryRole`) bypass so the solo maintainer can `--admin` merge. `CODEOWNERS` already ships in the tree, so code-owner review resolves to `@marcinobel`.

```bash
# (a) Recreate the develop integration branch (matches main at publish time).
git push origin main:develop

# (b) Recreate the main-protection ruleset — export it from the archived repo and
#     import to the new one (drift-free, no hand-transcription).
RID=$(gh api repos/qodeca/erfana-skills-archive/rulesets \
  --jq '.[] | select(.name=="main-protection") | .id')
gh api "repos/qodeca/erfana-skills-archive/rulesets/$RID" \
  --jq 'del(.id, .created_at, .updated_at, .node_id, .source, .source_type, ._links, .current_user_can_bypass)' \
  > /tmp/main-ruleset.json
gh api repos/qodeca/erfana-skills/rulesets --method POST --input /tmp/main-ruleset.json

# Verify it landed.
gh api repos/qodeca/erfana-skills/rulesets \
  --jq '.[] | {name, enforcement, rules: [.rules[].type]}'
# expect: main-protection / active / [deletion, non_fast_forward, required_signatures, pull_request]
```

If the archive's ruleset is unavailable, POST this minimal equivalent instead (fill the admin role `actor_id`, usually `5`):

```bash
gh api repos/qodeca/erfana-skills/rulesets --method POST --input - <<'JSON'
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

Optional hardening (not on the private repo today): add a `required_status_checks` rule so the `gates` and `secret-scan` CI jobs must pass before merge — `{"type":"required_status_checks","parameters":{"strict_required_status_checks_policy":true,"required_status_checks":[{"context":"gates"},{"context":"secret-scan"}]}}`.

Then work through the **After publishing (GitHub settings)** section of [`oss-launch-checklist.md`](oss-launch-checklist.md): private vulnerability reporting, Dependabot, secret scanning + push protection, fork-PR approval, read-only `GITHUB_TOKEN`, description + topics, social preview, Discussions, `good first issue` labels.

## 7. Release + soak

```bash
git tag -s v6.0.0-rc.1 -m "erfana v6.0.0-rc.1"
git push origin v6.0.0-rc.1
gh release create v6.0.0-rc.1 --prerelease --notes-file docs/release-notes-v6.0.0.md
```

Soak the rc for 48 h (pilot installs via `/plugin install erfana@erfana-skills@v6.0.0-rc.1`). On no reports, cut the final:

```bash
git tag -s v6.0.0 -m "erfana v6.0.0"
git push origin v6.0.0
gh release create v6.0.0 --notes-file docs/release-notes-v6.0.0.md --latest
gh release list   # confirm v6.0.0 shows Latest
```

## 8. Anyone can now install

The moment the repo is public, any Claude Code user runs:

```
/plugin marketplace add qodeca/erfana-skills
/plugin install erfana@erfana-skills
```

No central registry is required — the repo is the marketplace. For extra reach (optional), follow the **Discoverability** section of [`oss-launch-checklist.md`](oss-launch-checklist.md): submit to Anthropic's community marketplace at `clau.de/plugin-directory-submission` and PR into `awesome-claude-plugins`.
