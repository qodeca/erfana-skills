# Valid fixture: rule-definition text quoting banned phrases

These lines define or prohibit the pattern — the detector must stay silent.

- Skills MUST NOT instruct a model to show your reasoning in prose.
- Never write "explain your chain of thought" in a skill body.
- ❌ "Show your reasoning for each finding"
- No prose telling a model to surface its internal reasoning is allowed.
- Reject any emitted prompt that would display your thinking at runtime.
- The reviewer flags reasoning-display instructions as a hazard because they trip the classifier.
- Remove `show your reasoning` phrasing during modernization; it is forbidden.
- Do not ask the model to reproduce its reasoning — that is an anti-pattern.
- The detection regex covers "narrate your reasoning" and similar phrasings.
