# Bilingual support (Polish and English)

A project may carry Polish, English, or both. This file covers how language is recorded, why Polish prose is judged by its own norms, and how a two-language project is laid out. Slugs and transliteration are in [slug-and-paths.md](slug-and-paths.md).

## Judging Polish prose

The style targets for each language are in [review-standard.md](review-standard.md), section 4; this section gives the reasons the Polish ones differ, so a reviewer can apply them to cases the list does not name. Read the brief's `language` value before scoring, and do not apply one language's numeric targets to the other's text.

- **Voice.** Polish uses the grammatical passive far less than English. What English carries with the passive, Polish carries with impersonal `-no` / `-to` forms (`zrobiono`, `napisano`) and reflexive `się` constructions. An English-style active-voice percentage has no comparable target in Polish; flag over-use of those forms instead.
- **Sentence length.** Polish inflection packs more meaning into each word, so a well-edited Polish sentence runs longer than its English equivalent. A flat 15–20 word band would flag healthy prose; judge length through a Polish readability index.
- **Readability.** Use a Polish-calibrated index – Pisarek, Jasnopis (jasnopis.pl), or a Polish-adapted Gunning FOG – not a raw English formula.
- **Polish-specific signals.** Excessive nominalization (noun-heavy phrasing where a verb reads better) and genitive-chain pile-ups (long runs of stacked genitive nouns).

When a review states a Polish numeric target or score, it names the index that produced it. An unnamed number cannot be checked, so it is a review defect, not a pass.

## Language in metadata

`language` in `metadata.md` is a list, with the values `polish` and `english`: one element for a single-language project, both for a bilingual one.

```yaml
language: [polish, english]
```

## Bilingual file layout

All languages of an article share one project folder. The slug is derived once, from the primary-language title, and is not recomputed per language. The folder sits under `in-progress/`, `published/`, or `archived/` in the article root, as SKILL.md describes.

```text
in-progress/
  <slug>/
    article-brief.md        # shared
    metadata.md             # shared
    research-results.md     # shared – research runs once per article
    sources.md              # shared
    outline.md              # shared
    draft-v1.pl.md          # Polish draft, version 1
    draft-v1.en.md          # English draft, version 1
    review-report-v1.pl.md  # Polish review of version 1
    review-report-v1.en.md  # English review of version 1
```

- Drafts and review reports carry a two-letter language suffix (`.pl` / `.en`) before `.md`, matched to the version number.
- Every other file is shared and has no language suffix.
- A single-language project has only that language's drafts and reports; the naming is otherwise the same.

Locale formatting (Polish quotation marks, the decimal comma, day-month-year dates) is not specified here.
