# tests/

Scratch space for skill outputs produced while testing the erfana plugin locally. Each subfolder maps to one output-producing skill.

## Layout

```
tests/
├── design-direction/    – showcase scenes, philosophy explorations
├── design-prototype/    – clickable HTML prototypes
├── design-slides/       – HTML / PDF / PPTX decks
├── design-motion/       – MP4 / GIF animations + render-video temp dirs
├── design-infographic/  – vertical print-grade visualizations
└── design-review/       – critique notes, screenshots under review
```

## Convention

- One subfolder per skill. Drop your run outputs anywhere underneath.
- Naming inside a subfolder is freeform – use `YYYY-MM-DD-<slug>/` if you want to keep parallel runs side by side.
- Treat the entire tree as ephemeral. Anything here can be deleted at any time.

## Git policy

Nothing here is locally ignored – every artifact you produce is visible to `git status` and can be committed. The repo-root `.gitignore` still applies (`.DS_Store`, `.video-tmp-*/`, editor cruft), but no `tests/`-specific exclusions are in effect. Revisit this policy once the folder accumulates render binaries large enough to warrant a stricter rule.

## Not for

- Automated test suites – there are none in this plugin (verification is done via `scripts/run-all-gates.sh` against source).
- CI fixtures – CI does not read this folder.
- Anything that should be reviewed in a PR – move keepsake artifacts into `skills/design-shared/demos/` instead.
