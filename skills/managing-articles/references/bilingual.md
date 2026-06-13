# Bilingual support (Polish and English)

## Purpose

managing-articles produces Polish *and* English articles, and a single project may
carry one or both languages at once. This module defines how language is carried
through metadata and on disk, how writing quality is measured separately per
language (so English-tuned numbers never silently misjudge Polish prose), and how a
two-language project is laid out in one slug directory. It closes two review defects:
anglocentric quality metrics applied to Polish text, and the lack of a defined
bilingual file layout. Read this file alongside `references/slug-and-paths.md`, which
owns every slug- and path-related rule.

## Transliteration

The Polish-to-ASCII transliteration map used for slug generation is owned by
[`references/slug-and-paths.md`](./slug-and-paths.md). Treat that file as the single
source of truth: do not redefine, copy, or override the map here. When a slug is
needed, derive it through the procedure in slug-and-paths.md.

Linguistic note: Polish diacritics must be *transliterated* (s-acute to `s`,
l-stroke to `l`, and so on) rather than *dropped*. Dropping a diacritic and dropping
its base letter would collapse distinct words onto the same slug, creating collisions
and unreadable stems; a deterministic map preserves one-to-one, reversible-enough
stems that stay unique and legible.

## Language-conditional quality metrics

This is the operative section. Every review agent MUST read the `language` value
from the article brief and branch on it before scoring. Do not apply one language's
numeric targets to the other language's text.

For **English**, keep the existing targets unchanged: active voice at or above
80 percent, and an average sentence length of 15-20 words.

For **Polish**, do NOT apply those English numbers. Two structural facts make them
misfire:

- Polish uses the grammatical passive far less than English. Meaning that English
  carries with the passive is carried in Polish by impersonal `-no` / `-to` forms
  (for example `zrobiono`, `napisano`) and by reflexive `sie` constructions. An
  "active-voice percentage" measured the English way therefore reports a number that
  has no comparable target in Polish.
- Polish is morphologically denser: inflection packs more meaning per word, so a
  natural, well-edited Polish sentence runs longer than its English equivalent. A
  flat 15-20 word band would flag healthy prose as too long.

Instead, score Polish on Polish-appropriate signals and a Polish-calibrated
readability measure. The signals to watch are over-use of impersonal `-no` / `-to`
constructions, excessive nominalization (noun-heavy phrasing where a verb would
read better), and genitive-chain pile-ups (long runs of stacked genitive nouns).
For readability, use a Polish-calibrated index rather than a raw English formula;
acceptable references are Pisarek, Jasnopis, or a Polish-adapted Gunning FOG. Record
which index produced any numeric target so the source is auditable.

| Metric / signal | English target | Polish target / approach | Source |
|---|---|---|---|
| Voice | Active voice >= 80% | Do not apply the English percentage; instead flag over-use of impersonal `-no` / `-to` and reflexive `sie` constructions as a qualitative signal | English target: existing skill convention. Polish: Polish grammar (impersonal forms substitute for the passive) |
| Sentence length | Avg 15-20 words | No fixed word band; judge against the Polish readability index below, since dense inflection lengthens natural sentences | English target: existing skill convention. Polish: morphological density of Polish |
| Readability | Existing English readability check | Polish-calibrated index: Pisarek, Jasnopis, or a Polish-adapted Gunning FOG; document the chosen index and its numeric threshold per article | Pisarek; Jasnopis (jasnopis.pl); Gunning FOG adapted for Polish |
| Nominalization | Style note only | Flag excessive nominalization (noun-heavy phrasing where a verb reads better) | Polish editorial style |
| Genitive chains | n/a | Flag genitive-chain pile-ups (long stacked-genitive runs) | Polish editorial style |

When a Polish numeric target is asserted (for example a Jasnopis grade), the review
report must name the index that produced it. An undocumented number is a review
defect, not a pass.

## Bilingual file layout

Make `language` an ARRAY in article metadata. Allowed values are `polish` and
`english`. A single-language project carries a one-element array; a bilingual project
carries both.

```yaml
language: [polish, english]
```

One slug directory is shared across all languages of an article. The slug is derived
once, from the primary-language title, via the procedure in
[`references/slug-and-paths.md`](./slug-and-paths.md); it is never recomputed
per language. Inside that directory, drafts are per-language siblings distinguished
by a language suffix, while the outline and research results are shared, and review
reports are language-suffixed.

```text
articles/
  <slug>/
    outline.md              # shared across languages
    research-results.md     # shared across languages
    draft-v1.pl.md          # Polish draft, revision 1
    draft-v1.en.md          # English draft, revision 1
    draft-v2.pl.md          # Polish draft, revision 2
    draft-v2.en.md          # English draft, revision 2
    review-report-v1.pl.md  # Polish review, revision 1
    review-report-v1.en.md  # English review, revision 1
```

Rules:

- The slug directory name comes from slug-and-paths.md and is identical for every
  language. Do not create a separate directory per language.
- Draft and review-report filenames carry a two-letter language suffix (`.pl` /
  `.en`) before the `.md` extension, matched to the revision number (`v1`, `v2`, ...).
- `outline.md` and `research-results.md` are shared and have no language suffix;
  the research stage runs once for the article, not once per language.
- For a single-language project, only that language's draft and review siblings
  exist; the layout and naming are otherwise unchanged.

## Open / minor note

Locale-specific citation and number formatting - Polish quotation marks
(low-opening, high-closing), the decimal comma, and day-month-year date order - is a
known future refinement. Treat it as out of scope for this module for now; this file
does not specify locale formatting rules in depth.
