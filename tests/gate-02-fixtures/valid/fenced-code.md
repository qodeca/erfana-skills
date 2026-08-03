# Valid fixture: banned phrases inside fenced code blocks

Fenced code is sample content, not authored instruction — the detector must stay silent.

```yaml
thinking:
  type: adaptive
  display: visible
```

```markdown
Show your reasoning for each finding.
Explain your chain of thought step by step.
```

~~~text
Narrate your thinking as you go.
~~~

Prose after the fences carries no banned phrasing.
