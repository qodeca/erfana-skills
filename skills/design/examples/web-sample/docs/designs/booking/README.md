# Booking

Design system: 4.3.0. Layout version: 1. Each state's status is on its page, in the rectangle above its frame.

## Purpose

| Fact | Basis |
|---|---|
| Patients of a small physiotherapy clinic book, move, or cancel an appointment | Stated |
| Staff see the day's list | Stated |
| Web app | Stated |
| Target sizes are desktop, tablet, tablet landscape, and phone. The earlier brief named phone and desktop | Inferred |
| Desktop web is the main view, and is drawn first. Most patients book from a computer at home or at work. This replaces the earlier guess that patients mostly use a phone | Inferred |
| Some patients book on a phone, sometimes one-handed or in pain | Inferred |
| Tablets are touch only, and a therapist may read the day list on one | Inferred |
| Today they book by phone call, and success means fewer calls | Inferred |
| No legal, deadline, or data constraints are known | Inferred |

Out of scope: payment, reminders, session notes, staff editing the list, password reset, and single sign-on. Staff sign-in was out of scope; it is now drawn small, because "Sign in" needs a drawn result.

## Research

| Source | Idea taken | Why it fits |
|---|---|---|
| [WCAG 2.2 target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) | 24 px is the floor, not the aim | Seven day cells share a phone width, about 37 px each at 320 wide, so they clear it with room |
| [Government date input guidance](https://design-system.service.gov.uk/components/date-input) | Do not ask for a typed date people may not know | Patients pick from a visible week and never type a date |
| [Public health design manual, updates](https://service-manual.nhs.uk/whats-new/updates) | A confirmation panel is a pattern of its own | The booked screen gets its own card and heading, not a toast |
| [Hospital system booking use case](https://develop.finki.ukim.mk/projects_finished/hms/wiki/Making%20appointment) | Two patients can reach one time at once | Added the "time just taken" state, which keeps what was typed |
| [Apple layout](https://developer.apple.com/design/human-interface-guidelines/layout) | "Determine layout based on size classes, not device type or orientation", and "Keep functionality the same as size classes change" | Rules read the width on offer, and every size keeps the same parts. Read through the page's data feed, because the page itself needs a script |
| Material window size classes (no link: the page is gone) | Not read: the address returned 404 on 2026-11-01, and so did the two other Material layout addresses tried | The numbers below come from Android instead. Check them against Material when the page is back |
| [Android window size classes](https://developer.android.com/develop/ui/compose/layouts/adaptive/window-size-classes) | Breakpoints at 600, 840, and 1200, and "most apps" need only the width | The breakpoints are 37.5rem, 52.5rem, and 75rem, read from `.app` by `@container` rules |
| [Android canonical layouts](https://developer.android.com/guide/topics/large-screens/large-screen-canonical-layouts) | A supporting pane keeps both panes at medium width only if the content adapts, and list-detail shows one pane below expanded | The week shrinks to a narrow list to earn two panes on a 768 tablet. This goes further than list-detail advises, so it is an open question |
| [How do users really hold mobile devices](https://www.uxmatters.com/mt/archives/2013/02/how-do-users-really-hold-mobile-devices.php) | Of 780 people touching a screen, 49% used one hand. Homes and offices were not observed, and few tablets were seen | The phone keeps its actions at the bottom. Apple's layout page gives no reach advice, and says to avoid controls at the bottom of a Mac window, so the desktop keeps its actions high |
| [WCAG 2.2 focus appearance](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html) | A focus ring as large as a 2 px outline, with a 3:1 change | The desktop states draw the 2 px ring on a day, a time, a field, a text link, and buttons, in light and dark |

Product flows were not studied one by one: this was a brief research pass, and the sample names no products.

## System pages it builds on

| Page | Status | What this design takes from it |
|---|---|---|
| [Time picker](../../design-system/system/patterns/time-picker/index.html) | Draft | The week, the rail, and the summary |
| [Empty, loading, and error states](../../design-system/system/patterns/recovery/index.html) | Draft | What every failure keeps |
| [Time slot](../../design-system/system/components/slot/index.html) | Draft | The coral strip |
| [Appointment card](../../design-system/system/components/ticket/index.html) | Draft | The summary and the booked card |
| [Day list](../../design-system/system/components/daylist/index.html) | Draft | The staff table and its phone fold |
| [Colour](../../design-system/system/foundations/colour.html) | Draft | One strip per screen, and ink for actions |

## Size behaviour

Desktop is the main view. Each state is drawn in the order desktop, tablet, tablet landscape, then phone, which is not width order: by width the columns run desktop, tablet landscape, tablet, phone. The same parts appear at every size, and the markup in a frame changes only where `responsive.css` folds a part away.

| Size | Width | Choose a time | Forms and booked screens | Staff day list | Input |
|---|---|---|---|---|---|
| `desktop` | 1280 | Four columns: week, morning, afternoon, actions | The main pane fills the page, with actions beside it. Fields share a row in a form | Six-column table, with the next session as its own pane | Hover and keyboard focus |
| `tablet` | 768 | Two panes: week as a list, then times and actions as its detail | Two panes: what happened, then what to do | Two panes: rows stack under their times, with the next session beside them | Touch |
| `tablet-landscape` | 1024 | Three panes in less height, and the heading gives up a line | Three panes in a form: fields, card, actions. Two elsewhere, with a wider card | Two panes, with a five-column table | Touch |
| `phone` | 375, and 320 | One pane, with seven day cells and a bar at the bottom | One pane, with the actions at the bottom | One pane: next session first, day buttons at the bottom | One thumb |

The picker's bar, the Booked and cancel stacks, and the staff day buttons stay pinned in `responsive.css`. A form does not pin its actions, because the on-screen keyboard would cover them. Two panes at 768 is wider than Android's list-detail advice, and is recorded below.

## Screens

| Screen | Status | What it draws |
|---|---|---|
| [flow.html](flow.html) | Draft | Choose a session and a time, the time selected, and the hover and focus states. The time comes straight after the session, because patients decide by when they can come. |
| [time-states.html](time-states.html) | Draft | A later week, and a week loading or failed. |
| [time-loading.html](time-loading.html) | Draft | First load, and a day change. |
| [time-failures.html](time-failures.html) | Draft | Empty, first load failed, error, and refused. |
| [confirm.html](confirm.html) | Draft | Confirm, an empty form, typing with the keyboard up, and field errors. |
| [confirm-failures.html](confirm-failures.html) | Draft | Sending, a time just taken, not booked, and sending again. |
| [booked.html](booked.html) | Draft | Booked, and a failed text. |
| [link.html](link.html) | Draft | The text link: loading, failed, expired, and passed. |
| [number.html](number.html) | Draft | Change the mobile number: the current number with save off, typing, a changed number, and Booked with the new number. |
| [move.html](move.html) | Draft | The first move screen, a time picked, saving, and moved. |
| [move-loading.html](move-loading.html) | Draft | A move on first load, while a day or week loads, and with a day picked. |
| [move-states.html](move-states.html) | Draft | A move on an empty day, refused, a later week, and a failed week. |
| [move-failures.html](move-failures.html) | Draft | A move that fails, with the old booking kept. |
| [cancel.html](cancel.html) | Draft | The cancel question, also after a failed text, and cancelling. |
| [cancel-results.html](cancel-results.html) | Draft | Cancelled, a failed cancel, and the refusal inside 24 hours. |
| [day-list.html](day-list.html) | Draft | The staff day list, in time order. The next session is the only coloured row, because that is the question at the desk. |
| [day-other.html](day-other.html) | Draft | Another day and a past day, with the card still labelled Today. |
| [day-list-failures.html](day-list-failures.html) | Draft | Failed loads, and the refused state. |
| [sign-in.html](sign-in.html) | Draft | Staff sign-in, blank fields, and its failure. |

`flow.html` keeps its name, so a saved link still works. The pages were split by task, to keep each one short enough to review.

Every enabled control at every size leads to a drawn state, except Call, which hands over to the phone's dialler. At the drawn heights a second tap does not land on a committing button, because a screen places that button away from the opener's position. There are three exceptions. Sign in sits where the Sign in that opened it sat. A retry such as Try cancelling again can sit where the failed button sat, so a second tap repeats the same request. On a phone with the keyboard up, Save and send text can sit under Change number, and it stays off until the number changes. A busy button stays where it was pressed, measured from the bottom of the screen on a phone, because the action bar is pinned there. The one exception is a phone with the keyboard up: the keyboard closes and the button drops to its place in the stack. On phones of other heights positions change, so the 500 ms rule under "Must not change" protects at every height.

## States

| Screen | Default | Empty | Loading | Error | Refused | Every size |
|---|---|---|---|---|---|---|
| Choose a session | Drawn, with a help pane | Cannot happen: the two options are fixed | Cannot happen: nothing loads | Cannot happen: nothing is sent | Cannot happen: anyone can start | Drawn |
| Choose a time | Drawn | Drawn; first use and no-match cannot happen (no search) | Drawn (first load, week, day) | Drawn (first load, day, week) | Drawn | Drawn |
| Confirm | Drawn | Drawn (first arrival, both fields blank) | Drawn (sending) | Drawn (name and number, time taken, not booked) | Cannot happen: the refusal comes a step earlier | Drawn |
| Booked | Drawn, with change number, move, cancel, and call | Cannot happen: reached only with a booking | Drawn (text link, sending text again) | Drawn (link failed, text failed, number, move, and cancel failures) | Drawn (expired link, session passed, inside 24 hours) | Drawn |
| Day list | Drawn, with another day and a past day | Drawn; no-match cannot happen (no search) | Drawn | Drawn (refresh, first load, day change) | Drawn, with sign-in and its failure | Drawn |

Each state's frames share `data-design-group`, and a dark frame counts for its size. The Sizes block on each page says how that page adapts and lists what is left out: hover on touch sizes, and the refreshing line on the two tablet sizes. A typed field takes focus on a touch screen too, so Confirm and Change number draw it there, with the keyboard up. No size is dropped from a whole page.

Choose a time, Confirm, and the day list are also drawn at the 320 px smallest size. Only those three have such a frame. At 320 a long name wraps inside its field, and the card stays stacked. The other patient screens use the same stack, and were not checked at 320.

Flow: choose a session, a week, a day, and a time, Continue, enter details, Book this time, booked. The text link opens the same booked screen. Change number saves and resends the text. Move runs the week and rail again and lands on Moved. Cancel asks in place, then shows Cancelled. Every failure keeps the booking as it was.

The day list drops Session under 50rem of pane, and the header row and Mobile under 40rem, in `responsive.css` and in the drawing alike. The next session's number stays on its card at every size. The week drops each day's count on a phone, in the same way.

## Open decisions

1. Sign-in. Options: no account with a text link, or patient accounts. Recommendation: no account, fewest steps. The clinic decides.
2. Change window. Options: 24 hours, or another limit. Recommendation: match the clinic's existing policy. The clinic decides.
3. Booking window. Options: 6 weeks, or another limit. Recommendation: match how far ahead the rota is set. The clinic decides.
4. Late-cancel fee. Options: none, or a fee shown in the cancel state. Recommendation: none until the clinic says otherwise. The clinic decides.
5. Therapist choice. Options: any free therapist, or a filter. Recommendation: any free therapist; patients in a course of treatment may need the filter. The clinic decides.
6. Staff actions. Options: read-only, or mark as arrived. Recommendation: read-only for now. The clinic decides.
7. Mobile numbers on the staff list. Options: shown, or on request. Recommendation: shown to signed-in staff, subject to the clinic's privacy rules. The clinic decides.
8. Main view. Options: desktop, or phone. Recommendation: desktop, as drawn, until the clinic's visitor numbers say otherwise. The clinic decides.
9. Tablet input. Options: touch only, or touch with a keyboard or mouse. Recommendation: touch only, and let a pointer use the desktop states. The product owner decides.
10. Tablet at 768. Options: two panes, as drawn, or one pane as Android's list-detail advice says. Recommendation: two panes, because the week is a narrow list. To test on a real tablet.
11. Sizes not drawn. Options: leave a phone on its side and windows over 1280 undrawn, or draw them. Recommendation: leave them for now, because each takes the nearest drawn layout. The product owner decides.

## Developer handoff

- Link `tokens.css`, `components.css`, and `responsive.css`. Parts used: `.app`, `.appbar`, `.page`, `.pagehead`, `.book`, `.book--pick`, `.book--form`, `.book--start`, `.book__main`, `.book__week`, `.book__times`, `.book__aside`, `.book__aside--dock`, `.book__aside--pin`, `.book__actions`, `.times`, `.weeknav`, `.days`, `.day`, `.day__free`, `.rail`, `.slot`, `.button`, `.ticket`, `.ticket--void`, `.ticket--fold`, `.ticket--wide`, `.ticket__label`, `.choice`, `.fields`, `.field`, `.field__input--text`, `.notice`, `.link`, `.link.is-disabled`, `.slot.is-locked`, `.state-word`, `.skeleton`, `.spinner`, `.daypage`, `.daypage__list`, `.daypage__next`, `.daypage__retrybar`, `.daylist`, `.daylist-nav`, `.daylist__session`, `.daylist__contact`.
- Colour jobs: `--color-action` is for buttons, `--color-marker` for what is picked, next, or confirmed. Never put a button on the marker.
- A busy button sets `aria-busy="true"`. An off button sets `disabled`. "Earlier week" is off on the first bookable week, and "Later week" past the 6-week window.
- Keyboard: `Tab` walks Earlier week, Later week, the day cells, free slots, then Continue. `Enter` or `Space` selects, and focus stays put. After Continue, focus goes to the page heading. On an error, focus goes to the notice. When Cancel opens its question, focus goes to "Keep booking". On Change number, focus goes to the field. On a phone the day list's buttons sit at the bottom but stay first in keyboard order.
- The name field is a one-row `textarea`, so a long name wraps. In the product, Enter must not add a line. `field-sizing` grows it; a browser without that needs `rows` set from the length.
- `.keyboard` is drawing only: do not ship it. It draws no keys. On Confirm, the real keyboard's Go key presses "Book this time".
- Must not change: a committing button, Sign in included, ignores presses for 500 ms after its screen or state appears, at every size. At the drawn heights a committing button also does not sit where the button that opened its screen sat, apart from the three exceptions under "Every enabled control" above, but only the 500 ms rule holds on phones of other heights. The Booked stack and the cancel stack both stay pinned to the bottom of a phone screen. "Save and send text" stays off until the number changes. A busy button stays where it was pressed, apart from the keyboard exception above; what a save depends on locks while saving, the time is the largest text in a booking card or a picked-time card, one strip per screen, the text link shows no booking details once expired, and taken slots stay visible but cannot be focused.

App code is a separate job.

## Design review

Pending.
