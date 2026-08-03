# Valid fixture: author-filled critical_thinking block

Static design records are exempt — the detector must stay silent.

<critical_thinking>
Alternatives:
- Run all checklist items vs stop on first critical failure: chose stop-early for efficiency
- Strict vs lenient scoring: chose strict to maintain the quality bar

Edge cases:
- What if the frontmatter is valid YAML but missing fields? Report as metadata failure.

Adapt:
- If Section 1 fails, skip detailed validation and report immediately.
</critical_thinking>
