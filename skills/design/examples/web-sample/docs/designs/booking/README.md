# Booking

Design system: 3.1.0. Layout version: 1. Each state's status is on its page, in the rectangle above its frame.

## Purpose

| Fact | Basis |
|---|---|
| Patients of a small physiotherapy clinic book, move, or cancel an appointment | Stated |
| Staff see the day's list | Stated |
| Web app, on phone and desktop | Stated |
| Patients mostly use a phone, sometimes one-handed or in pain | Inferred |
| Today they book by phone call, and success means fewer calls | Inferred |
| No legal, deadline, or data constraints are known | Inferred |

Out of scope: payment, reminders, session notes, staff editing the list, and sign-in screens.

## Research

| Source | Idea taken | Why it fits |
|---|---|---|
| [WCAG 2.2 target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) | 24 px is the floor, not the aim | Seven day cells share a phone width, about 37 px each at 320 wide, so they clear it with room |
| [Government date input guidance](https://design-system.service.gov.uk/components/date-input) | Do not ask for a typed date people may not know | Patients pick from a visible week and never type a date |
| [Public health design manual, updates](https://service-manual.nhs.uk/whats-new/updates) | A confirmation panel is a pattern of its own | The booked screen gets its own card and heading, not a toast |
| [Hospital system booking use case](https://develop.finki.ukim.mk/projects_finished/hms/wiki/Making%20appointment) | Two patients can reach one time at once | Added the "time just taken" state, which keeps what was typed |

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

## Screens

| Screen | Status | What it draws |
|---|---|---|
| [flow.html](flow.html) | Draft | Choose a session, choose a time, confirm, booked, the text link, then change number, move, or cancel. The time comes straight after the session, because patients decide by when they can come. |
| [day-list.html](day-list.html) | Draft | The staff day list, in time order. The next session is the only coloured row, because that is the question at the desk. |

## States

| Screen | Default | Empty | Loading | Error | Refused | Phone |
|---|---|---|---|---|---|---|
| Choose a session | Drawn | Cannot happen: the two options are fixed | Cannot happen: nothing loads | Cannot happen: nothing is sent | Cannot happen: anyone can start | Drawn |
| Choose a time | Drawn | Drawn; first use and no-match cannot happen (no search) | Drawn | Drawn | Drawn | Drawn |
| Confirm | Drawn | Drawn (first arrival, both fields blank) | Drawn (sending) | Drawn (name and number, time taken, not booked) | Cannot happen: the refusal comes a step earlier | Drawn |
| Booked | Drawn, with change number, move, cancel, and call | Cannot happen: reached only with a booking | Drawn (text link, sending text again) | Drawn (link failed, text failed, number, move, and cancel failures) | Drawn (expired link, session passed, inside 24 hours) | Drawn |
| Day list | Drawn | Drawn; no-match cannot happen (no search) | Drawn | Drawn (refresh, first load, day change) | Drawn | Drawn |

Choose a time and the day list are also drawn at the 320 px smallest size. Each page has one such frame, and the other patient screens use the same single-column stack.

Flow: choose a session, a week, a day, and a time, Continue, enter details, Book this time, booked. The text link opens the same booked screen. Change number saves and resends the text. Move runs the week and rail again and lands on Moved. Cancel asks in place, then shows Cancelled. Every failure keeps the booking as it was.

The phone day list drops Session and Mobile, in `responsive.css` and in the drawing alike.

## Open decisions

1. Sign-in. Options: no account with a text link, or patient accounts. Recommendation: no account, fewest steps. The clinic decides.
2. Change window. Options: 24 hours, or another limit. Recommendation: match the clinic's existing policy. The clinic decides.
3. Booking window. Options: 6 weeks, or another limit. Recommendation: match how far ahead the rota is set. The clinic decides.
4. Late-cancel fee. Options: none, or a fee shown in the cancel state. Recommendation: none until the clinic says otherwise. The clinic decides.
5. Therapist choice. Options: any free therapist, or a filter. Recommendation: any free therapist; patients in a course of treatment may need the filter. The clinic decides.
6. Staff actions. Options: read-only, or mark as arrived. Recommendation: read-only for now. The clinic decides.
7. Mobile numbers on the staff list. Options: shown, or on request. Recommendation: shown to signed-in staff, subject to the clinic's privacy rules. The clinic decides.

## Developer handoff

- Link `tokens.css`, `components.css`, and `responsive.css`. Parts used: `.app`, `.appbar`, `.page`, `.book`, `.weeknav`, `.days`, `.day`, `.rail`, `.slot`, `.button`, `.ticket`, `.ticket--void`, `.field`, `.notice`, `.link`, `.state-word`, `.skeleton`, `.spinner`, `.daylist`, `.daylist__session`, `.daylist__contact`.
- Colour jobs: `--color-action` is for buttons, `--color-marker` for what is picked, next, or confirmed. Never put a button on the marker.
- A busy button sets `aria-busy="true"`. An off button sets `disabled`. "Earlier week" is off on the first bookable week, and "Later week" past the 6-week window.
- Keyboard: `Tab` walks Earlier week, Later week, the day cells, free slots, then Continue. `Enter` or `Space` selects, and focus stays put. After Continue, focus goes to the page heading. On an error, focus goes to the notice. When Cancel opens its question, focus goes to "Keep booking". On Change number, focus goes to the field.
- Must not change: the time is the largest text on each patient screen, one strip per screen, the text link shows no booking details once expired, and taken slots stay visible but cannot be focused.

App code is a separate job.

## Design review

Pending.
