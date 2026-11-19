# Kind sections

Add the one matching section under "Context" in the base template. Use it with the kind label of the same name.

## refactor

### Behaviour that must not change
- <public API, output format, user-visible behaviour, performance budget>
- All existing tests pass unchanged. A refactor that needs a test change is a behaviour change – stop and ask.

## documentation

### Audience and location
- **Reader:** <developer | operator | end user>
- **Where:** `<path or page>`
- Check every command and path in the new text against the code at the starting SHA.

## dependencies

### Upgrade details
- **Package:** `<name>` from `<current>` to `<target>`
- **Why:** <security fix, needed feature, end of support>
- Read the release notes between the two versions and list the breaking changes in the PR.

## design

### Design reference
- **Source:** <link to the design file or screenshot, or "attached">
- **States to cover:** default, hover, focus, disabled, loading, empty, error
- Verification includes a screenshot of each state, compared with the design.

## security

Use this section **only** when the repository is private and has no outside collaborators (the outside-reader test in the issue guide, section 8). Otherwise, keep the issue to a neutral one-line summary, and share the details through a private channel.

### Threat and impact
- **What could go wrong:** <plain description>
- **Who could exploit it:** <role or position>
- **Impact:** <data, money, availability>
- Do not include working exploit steps.
