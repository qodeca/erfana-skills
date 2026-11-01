# Swap

Design system: 3.1.0. Layout version: 1. Each state's status is on its page, in the rectangle above its frame.

## Purpose

- **Who (stated):** hospital nurses, and the managers who approve their swaps.
- **Device (stated):** iOS and Android phones.
- **Setting (inferred):** in a corridor, on a break, or at home after a shift; tired, hurried, one-handed, sometimes in a dark ward.
- **How often (inferred):** a few times a month for a nurse; several times a week for a manager.
- **The job (stated):** offer a shift, find a colleague to take it, and get a manager's approval.
- **How it is done today (inferred):** group chats and paper forms, then a conversation with the manager.
- **Business goal (inferred):** fewer unfilled shifts and less manager time spent on swaps. Success would show as more swaps completed without a phone call.
- **Constraints (stated):** one design for iOS and Android. **Inferred:** working-time, skill, and staffing rules decide what is allowed.
- **Out of scope:** roster editing, mutual exchanges, tablets, and notifications. **Existing screen outside this area:** My shifts, drawn in no sample. "Back to my shifts" ends there.

Every inferred line is an open decision below, because this run had no interview.

## Research

| Source | Idea taken | Why it fits |
|---|---|---|
| [Workforce.com: shift swaps](https://help.workforce.com/en/articles/8708492-shift-swaps) | A colleague accepts before a manager is involved | Sets the baton's order, and means a manager never reads a request with nobody on it |
| [Nursa: shift swap policy examples](https://nursa.com/facility/articles/shift-swap-policy-examples) | A manager checks skills, cover, overtime, and rest | These became the four checks on the request screen |
| NAVBLUE: requesting a duty trade (aviation, outside the category) | A rule breach shows as a message before the trade goes through | Move it earlier still: nurses see who can't take a shift, with the reason, before they ask |
| [When I Work, via Software Finder](https://softwarefinder.com/resources/when-i-work-drop-shift) | A denied request leaves the person on the shift | Led to "You are still on this shift" as the headline of every failure |
| [Hypercare: night mode](https://hypercare.com/blog/hypercare-night-mode) | Overnight clinical staff get their own theme | Supports dark as a first-class theme. Its post gives no outcome data, so this is for comfort, and no health claim is made |

Apple's and Material's pages returned no readable content in this run, so the touch sizes come from the skill's reference: 44 pt on iOS and 48 dp on Android.

## System pages it builds on

| Page | Status | What this design takes from it |
|---|---|---|
| [Colour](../../design-system/system/foundations/colour.html) | In review | Sand surfaces, one marigold action, measured pairs |
| [Type](../../design-system/system/foundations/type.html) | In review | The time as the largest text |
| [Space and touch](../../design-system/system/foundations/space.html) | In review | 48 minimum, 56 for the main action |
| [Surfaces and focus](../../design-system/system/foundations/surfaces.html) | In review | Layers without shadows |
| [Focus](../../design-system/system/foundations/focus.html) | In review | One ring on every control |
| [Motion](../../design-system/system/foundations/motion.html) | In review | Press feedback and reduced motion |
| [Screen](../../design-system/system/components/screen/index.html) | In review | App bar, action bar, and sheet |
| [Text](../../design-system/system/components/text/index.html) | In review | Title, heading, lede, and caption |
| [Icon](../../design-system/system/components/icon/index.html) | In review | Icons beside words |
| [Button](../../design-system/system/components/button/index.html) | In review | Main, secondary, and danger actions |
| [Shift ticket](../../design-system/system/components/ticket/index.html) | In review | The shift, led by its time |
| [Row](../../design-system/system/components/row/index.html) | In review | People and requests |
| [Baton](../../design-system/system/components/baton/index.html) | In review | Who holds the shift |
| [Tag](../../design-system/system/components/tag/index.html) | In review | Short statuses |
| [Notice](../../design-system/system/components/notice/index.html) | In review | What happened and what next |
| [Check](../../design-system/system/components/check/index.html) | In review | The manager's rules |
| [Field](../../design-system/system/components/field/index.html) | In review | Search, notes, and reasons |
| [Saying no](../../design-system/system/patterns/saying-no/index.html) | In review | Refused and empty states |
| [Loading and keeping data](../../design-system/system/patterns/loading/index.html) | In review | First load and reload |

## Screens

| Screen | Status | What it draws |
|---|---|---|
| [Offer a shift](offer.html) | In review | The nurse first sees their shifts by time, because they already know which one they want rid of |
| [Your offer](status.html) | In review | The nurse first sees the status and the baton, because they came to learn who holds the shift |
| [Accept a shift](accept.html) | In review | The colleague first sees the time, then whether they can take it and what happens next |
| [Swap requests](approval.html) | In review | The manager first sees the soonest shift, with its time largest, then the time, people, and checks on one request |
| [Large text](large-text.html) | In review | The three busiest screens and both sheets at 200% text |

## States

| Screen | Default | Empty | Loading | Error | Refused | Smallest size |
|---|---|---|---|---|---|---|
| Pick a shift | Yes, plus tapping an offered shift | Yes | First load and reload | Yes | Too close to the start | 320 frame |
| Find a colleague | Yes, plus one chosen | Nobody can take it; no search match | Checking | Yes | Swaps closed | Same parts as Pick a shift |
| Check and send | Yes, plus longest data and 40% longer words | Cannot happen: a shift is always chosen | Sending | Yes | Colleague no longer free | 320 frame |
| Your offer | Seven outcomes | Cannot happen: it opens from a sent offer | First load, reload, and cancelling | Could not update; could not cancel, before and after someone accepts | Cancel after approval | 320 frames |
| Accept a shift | To everyone, to one person, and approved after accepting | Cannot happen: it opens from an offer | First load, reload, and accepting | Could not open, could not accept, and could not say no | Taken, can't take it, ended, and after accepting: declined, not decided, or cancelled | 320 frame |
| Swap requests | Yes | Yes | First load and reload | Yes | Not a manager here | 320 frame |
| One request | Pass, and stopped by hours or rest | Cannot happen: it opens from a request | First load, approving, and declining | Checks failed; approving held; could not approve; decline failed | Already handled | 320 frames |

Every state is drawn in light and dark, as two side-by-side states (the dark one's `id` ends in `-dark`), except on the large-text page, which is light only. Frames show the layout iOS and Android share, and each difference is drawn as its own state under [iOS and Android differences](offer.html#platform).

## Flows

1. **Offer:** pick a shift, then choose who gets the offer, then check and send, then follow it on Your offer. A shift already offered opens Your offer from the same list.
2. **Accept:** the colleague opens the offer, reads their checks, then accepts or says no. An accepted offer goes to the manager.
3. **Follow:** You offered it, then a colleague accepts, then your manager approves. It can stop at the second or third step, and the nurse stays on the shift.
4. **Approve:** open the request from the list, read the checks, then approve, or decline with a reason.

## Open decisions

1. **When do offers close?** Options: 24 hours, 48 hours, or set per hospital. Recommend per hospital, defaulting to 24. Nursing management decides.
2. **What is the rest rule?** Options: 11 hours, or local rules. Recommend reading it from the roster system. HR decides.
3. **What may colleagues see?** Options: a general reason, no reason, or the full reason. Recommend a general reason, as drawn. HR decides.
4. **Who gets an offer?** Options: everyone or one person (as drawn), one person only, or everyone only. Recommend as drawn. Ward team decides.
5. **Who approves on nights and weekends?** Options: the ward manager only, a stand-in, or the charge nurse. Recommend a named stand-in. Nursing management decides.
6. **Who holds the shift until approval?** Options: the offering nurse (as drawn), or the colleague once they accept. Recommend as drawn. Nursing management decides.
7. **What happens when an offer ends?** Options: it ends silently (as drawn), or it escalates to the manager. Recommend escalating, once a manager has confirmed they want it. The same question applies when a manager misses their deadline, drawn as ending the offer. Ward team decides.
8. **What opens the colleague's offer?** The screens are drawn on [Accept a shift](accept.html), and the notification that opens them is not. Options: a push notification, or a notification plus a list of offers. Recommend a push notification first. Product owner decides.
9. **Which rules can a manager override?** Options: none, so over hours and too little rest both stop (as drawn), or over hours becomes a warning a manager can override. Recommend as drawn, pending legal review. An override would need new states on Find a colleague and One request. HR and the union decide.
10. **Must a manager give a reason to decline, and who reads it?** Options: required (as drawn), or optional. Recommend required. As drawn, only the nurse who offered reads it, and the colleague who accepted is told without it. Nursing management decides.
11. **Do managers approve on the phone?** Options: phone only, or also a desktop screen. Recommend watching one first. Product owner decides.
12. **How large must text go?** Options: 200%, or the largest system size. Recommend device testing at the largest size. Design and engineering decide.
13. **Is there a brand?** None was given, so marigold, sand, and the name are placeholders until the product owner confirms them. Check that marigold has no meaning in the hospital's own colour codes.
14. **Has anyone seen real Android type?** Not yet: review pages ship no font, so without Roboto installed a Mac shows Android frames in a fallback. Options: check on an Android device, or review on a machine with Roboto. Recommend a device. Design decides.

## Developer handoff

- **Tokens:** `docs/design-system/tokens.json` is the contract. Native apps read it; `components.css` is the specification and does not ship in them.
- **Reading the tokens:** sizes are numbers in px, read as pt on iOS, dp on Android, and sp for text. Colour and alpha are separate, so `component.sheet.scrim` pairs with `component.sheet.scrim-opacity`. Each part has its own colour tokens, and `component.text-style.*` gives size, weight, and leading. `$value` is light; `$extensions.design.modes.dark` is dark. The design system README covers the modes.
- **Fonts:** `semantic.typeface.ios` and `semantic.typeface.android`.
- **Components:** `.screen`, `.app-bar`, `.action-bar`, `.sheet`, `.button`, `.ticket`, `.row`, `.baton`, `.tag`, `.notice`, `.check`, `.field`, `.empty`, `.refresh`, `.skeleton`.
- **Shared layout:** the frames show one layout for both platforms. Each row below marked Drawn has its own state under [iOS and Android differences](offer.html#platform).

| Part | iOS | Android | Drawn |
|---|---|---|---|
| Font | SF Pro, with Dynamic Type | Roboto, with the system text size | iOS yes; Android in a fallback, see decision 14 |
| App bar title | Centred | Starts at the back arrow | Yes |
| Back | Chevron and edge swipe | Arrow and system back | Icon yes; the gesture is not drawable |
| Sheet | Native sheet with a grabber | Modal bottom sheet | Yes |
| Target | 48 pt, above iOS's 44 pt minimum | 48 dp | Same on both, so no separate state |
| Press feedback | Colour and 98% scale | Colour and 98% scale, with no ripple colour change | Same on both, so no separate state |

- **Screen readers:** a frame is a picture, so meaning is listed here. Each ticket reads as "Saturday 14 November, night shift, 19:00 to 07:00". A tappable offered ticket adds "offered, opens your offer", and a too-close ticket adds "starts in under 24 hours, opens the reason". The baton reads as a list of three steps with their state, and it is not a button. Notices are announced when they appear.
- **Paired keyboard:** Tab moves through controls in reading order, Enter runs them, and Escape closes a sheet and returns focus to what opened it.
- **Must not change:** the time stays the largest text; Approve stays off while a check stops a swap; a failed check is never hidden; every failure says what was saved; the safe action is at the bottom of every sheet; the note label says who reads it; filled marigold is only ever the next tap; and the action bar stops being pinned once text is too large for it to fit.
- **Large text:** a full-size ticket uses the compact time once the text size makes the full time wider than the ticket, and a time only ever breaks after its dash.
- **Pinned bar:** drawn at the end of the content, because a review page hides nothing. In the product it is pinned to the bottom until large text makes that impossible.
- **Sheet backdrop:** the frames show the scrim alone. In the product the scrim sits over the screen that opened the sheet, and past the top of the phone a sheet scrolls.

App code is a separate job.

## Design review

Pending. Not run in this session: someone else runs `ux-reviewer` and `ui-reviewer`. Every frame was rendered in headless Chrome and measured for sideways overflow, and the main states were checked by eye.
