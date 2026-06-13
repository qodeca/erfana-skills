# Lessons learned

Operational lessons from spec system usage that inform current rules and guardrails.

---

## Critical bug: Registry in wrong location

**Problem:** `spec-registry-manager` created `registry.json` in skill directory (`skills/managing-specs/`) instead of project directory.

**Root cause:** Agents weren't given explicit `project_path` parameter.

**Fix:**
1. Capture CWD at skill start
2. Pass `project_path` to ALL agents
3. Agents derive all paths from `project_path`

---

## Statistics not updated after init

**Problem:** After `spec-init` creates files, manifest had:
- `requirement_sequences`: all zeros
- `statistics.total_requirements`: 0
- `requirements_index`: empty

**Fix:** Add automatic RECONCILE step after INIT to update statistics.

---

## Tier detection made wrong assumptions

**Problem:** User said "comprehensive search" – agent recommended T1 based on Monaco's built-in search, but user wanted cross-view search (T3).

**Fix:** Add clarification loop when description contains ambiguous terms.

---

## Validation findings required manual fixes

**Problem:** After validation, each issue had to be fixed manually.

**Fix:** Split fixes into auto-fix (statistics, counts) and manual (content improvements).

---

## E2E integration: Agents need input contracts and deterministic paths

**Problem:** New e2e-test-designer and e2e-test-design-reviewer agents were created without `<input_contract>` sections. The designer's output path said "as agreed with user" but SKILL.md step 10c expected a deterministic path. Tool calls used relative paths that break on CWD reset.

**Root cause:** Agent template marked `<input_contract>` as "Recommended" not REQUIRED. No guidance on output path determinism or absolute path enforcement.

**Fix:**
1. Elevated `<input_contract>` and `<quality_gate>` to REQUIRED in agent templates
2. Added absolute path guidance: always use `{project_path}/target`, never relative
3. Added deterministic output path rule for automated pipelines
4. Added rejection guard pattern: agents MUST reject unsupported inputs at workflow start

---

## E2E integration: Update tier definitions when adding tier-conditional steps

**Problem:** Steps 10a–10c create `testing/` folder for T2/T3/T4 specs, but T2 and T3 tier definitions in SKILL.md didn't mention `testing/` as a component folder.

**Root cause:** When adding new tier-conditional operations, the tier definition sections weren't updated to reflect new folder structures.

**Fix:** Always update ALL tier definition sections when adding steps that create new folders or files for specific tiers.

---

## E2E integration: Decide mandatory vs optional upfront

**Problem:** E2E test design was first implemented as an optional downstream offer (step 11), then had to be rearchitected as mandatory steps (10a–10c) when the user clarified requirements.

**Root cause:** The integration scope wasn't confirmed with the user before design. "Optional" was assumed.

**Fix:** Before designing skill integrations, always ask: "Should this be mandatory (part of the core workflow) or optional (downstream offer)?"
