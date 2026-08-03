# Valid fixture: banned phrases quoted inside backtick code spans

Mentions inside backticks are quotations, not instructions — the detector must stay silent.

- Phrases like `show your reasoning` and `reproduce your thinking` belong in the ban list.
- Config such as `display: visible` appears only as a quoted example here.
- The checklist cites `explain your chain of thought` as one of the trigger phrases.
- A grep for `surface its reasoning` finds the quoted occurrences.
