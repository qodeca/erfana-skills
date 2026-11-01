# Swap

Design system: 3.2.0. Layout version: 1. Each state's status is on its page, in the rectangle above its frame.

## Purpose

- **Who (stated):** hospital nurses, and the managers who approve their swaps.
- **Device (stated):** iOS and Android phones and tablets.
- **Setting (inferred):** on a phone, in a corridor, on a break, or at home after a shift; tired, hurried, one-handed, sometimes in a dark ward. On a tablet, either their own at home or a shared ward tablet at the nurses' station, propped in landscape, and for managers in the ward office. Who uses a tablet, and where, is decision 15.
- **How often (inferred):** a few times a month for a nurse; several times a week for a manager.
- **The job (stated):** offer a shift, find a colleague to take it, and get a manager's approval.
- **How it is done today (inferred):** group chats and paper forms, then a conversation with the manager.
- **Business goal (inferred):** fewer unfilled shifts and less manager time spent on swaps. Success would show as more swaps completed without a phone call.
- **Constraints (stated):** one design for iOS and Android, and for phone, tablet, and tablet landscape. **Inferred:** working-time, skill, and staffing rules decide what is allowed.
- **Out of scope:** roster editing, mutual exchanges, notifications, and desktop. Sign-in and switching person on a shared tablet are not drawn; see decision 16. **Existing screen outside this area:** My shifts, drawn in no sample. "Back to my shifts" ends there.

Every inferred line is an open decision below, because this run had no interview.

## Research

| Source | Idea taken | Why it fits |
|---|---|---|
| [Workforce.com: shift swaps](https://help.workforce.com/en/articles/8708492-shift-swaps) | A colleague accepts before a manager is involved | Sets the baton's order, and means a manager never reads a request with nobody on it |
| [Nursa: shift swap policy examples](https://nursa.com/facility/articles/shift-swap-policy-examples) | A manager checks skills, cover, overtime, and rest | These became the four checks on the request screen |
| NAVBLUE: requesting a duty trade (aviation, outside the category) | A rule breach shows as a message before the trade goes through | Move it earlier still: nurses see who can't take a shift, with the reason, before they ask |
| [When I Work, via Software Finder](https://softwarefinder.com/resources/when-i-work-drop-shift) | A denied request leaves the person on the shift | Led to "You are still on this shift" as the headline of every failure |
| [Hypercare: night mode](https://hypercare.com/blog/hypercare-night-mode) | Overnight clinical staff get their own theme | Supports dark as a first-class theme. Its post gives no outcome data, so this is for comfort, and no health claim is made |

| [Apple: Layout](https://developer.apple.com/design/human-interface-guidelines/layout) | "Determine layout based on size classes, not device type or orientation", and keep functionality the same as size classes change | The rules read width only. Every action on a phone is on a tablet, in the same words |
| [Apple: Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets) | iPadOS centres page and form sheets on a dimmed view, and a grabber belongs on a resizable sheet | The centred sheet, and no grabber on it, because it does not resize |
| [Android: window size classes](https://developer.android.com/develop/ui/compose/layouts/adaptive/window-size-classes) | Compact under 600, Medium to 839, Expanded to 1199, by width | The 600 breakpoint. 768 is Medium and 1024 is Expanded. Three panes wait for 960, because at 840 the main pane would be too narrow |
| [Android: canonical layouts](https://developer.android.com/develop/ui/compose/layouts/adaptive/canonical-layouts) | List-detail shows both at Expanded and one at Medium or Compact. A supporting pane goes below the main content when narrow | Three columns in landscape, and the status under the detail in portrait. Two panes at 768 goes further than this page: see decision 17 |
| [Android: list-detail](https://developer.android.com/develop/ui/compose/layouts/adaptive/list-detail) | The list marks what is open, and a detail pane with nothing selected shows a placeholder | The selected ticket and row, and "Pick a shift to offer" |
| [Material: Breakpoints](https://m3.material.io/foundations/layout/applying-layout) | Material now calls window size classes breakpoints, and allows two panes at Medium as an alternative to one | Supports two panes at 768, but see the note below |

**What could not be read in this run:**

- `m3.material.io/foundations/layout/applying-layout/window-size-classes` returned 404. The Material breakpoints page and `foundations/layout/scaffold/panes` returned only a title, as did `components/bottom-sheets/guidelines`, so the Material row comes from a search summary, not from reading the page. Its widths agree with the Android page, which was read.
- `m3.material.io/foundations/layout/canonical-layouts/list-detail` returned 404. List-detail guidance comes from the two Android pages.
- Apple's pages returned an empty shell at their public address, so both were read from Apple's own data files at `developer.apple.com/tutorials/data/design/human-interface-guidelines/`.
- The Android sheet width of 640 is not confirmed. Compose names a default, `SheetMaxWidth`, but no page read gave its number: 640 comes from a search result about a Flutter change. See decision 21.
- The touch sizes still come from the skill's reference: 44 pt on iOS and 48 dp on Android.

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
| [Panes](../../design-system/system/components/panes/index.html) | In review | One, two, or three panes, by width |
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
| [iOS and Android differences](platform.html) | In review | Where the platforms really differ, at every size |
| [Decline with the keyboard up](keyboard.html) | In review | The decline sheet while a reason is typed, and the hold as the sheet moves |
| [Large text](large-text.html) | In review | The three busiest screens and both sheets at 200% text |

## How each screen adapts

The parts are the same at every size, and one set of CSS places them. A pane with nothing to show is not drawn.

| Screen | Phone | Tablet | Tablet landscape |
|---|---|---|---|
| Offer a shift | One step per screen, with the action at the bottom | My shifts beside the current step, with what happens next under it | My shifts, the step, and what happens next |
| Your offer | Everything in one column | My shifts beside the offer, with the baton under it | My shifts, the offer, and the baton |
| Accept a shift | Everything in one column | Two columns: the shift and who offered it, then the checks and the answer | Three: the shift, the checks, and what happens next |
| Swap requests | List, then one request | Requests beside the open request, with the checks under it | Requests, the open request, and its checks, or who has been told |
| Nothing to show yet | One column | The list pane stays and says why, and the pane beside it says what comes next | The same, with a third pane where there is something to say |
| Sheets | Full width, from the bottom | 480, centred over the dimmed screen. Android: 640, at the bottom. With the keyboard up, the sheet sits on it | The same, with the buttons in a row above the keyboard |
| Large text | One column | Two equal columns. Pick a shift is one pane, with tickets across | The same, with three tickets across. Sheets stand on the scrim alone at every size |

- **Reach:** on a phone the main action is at the bottom, in reach of one thumb. On a tablet buttons share a row under the main pane, with the main button at the inline end. A row with a commit splits evenly, and in other rows the longer label takes more of the row. Both stay the same height, and a pair too long for the pane stacks.
- **Touch only:** no hover is drawn at any size, and pressed states are drawn where they teach something.
- **Reaching someone:** a phone offers Call. A tablet offers Message, shows the number above it, and its words say contact, not call, because many tablets cannot call. See decision 22.
- **Always-visible list:** tapping another shift mid-offer saves the first as a draft, note included, drawn in [Switching shift](offer.html#switching). A phone reaches the same list by going back, with the same Draft mark. On Your offer, tapping a shift with no offer opens step 2 of Offer a shift, and the offer does not change.
- **Repeat taps:** a repeat tap must never land on a different commit, or on a commit for a different record. A repeat tap may retry the same commit on the same record, so a failed Approve, Accept, Decline swap, or Cancel offer keeps its place, with Try again there. That is an exact slot on a phone and in a tablet bar. A centred tablet sheet grows when its notice appears, so there it is the same button in the same order, but not the same point on the screen. A retry that reloads data takes its own row above the action row, and on a tablet a failed list keeps Try again in the list pane, in Pick a shift as in Swap requests. Next request and Continue take the half that Decline and Go back will use, and Cancel offer takes Go back's half when it is alone. On a tablet a row with a commit splits evenly, so each slot is known in advance. On a phone the buttons stack, and a sheet's bottom button sits in Decline's slot.
- **Holds:** Approve swap stays off for half a second after any sheet closes, whichever way it closed, and after a request opens on a phone or on a tablet at 200% text, drawn in [Request – just settled](approval.html#detail-settling) and [Large text](large-text.html#large-approve-settling). At normal text size a tablet needs no hold when a request opens, because the list sits beside the action bar, so a row cannot reach Approve. Next request at normal size sits in Decline's slot, so it cannot reach Approve either. At 200% text the bar scrolls, so a request opened by Next request takes the same hold. Decline swap and Keep request stay off for half a second after the keyboard moves the sheet, drawn in [Decline – keyboard rising](keyboard.html#decline-keyboard-settling). At 200% text the bar scrolls, so a sheet's commit stays off for half a second after the sheet opens, drawn in [Large text](large-text.html#large-cancel-settling), and Send offer stays off for half a second after Check and send opens, drawn in [Large text](large-text.html#large-send-settling). Send offer stays off on a reopened draft until the colleague check finishes, and for half a second at least, drawn in [Check and send – draft reopened](offer.html#send-draft). The finished check goes to Check and send, to colleague no longer free, or to nobody can take it, and a failed check is [Check and send – draft check failed](offer.html#send-draft-error). See decision 28.
- **What the repeat-tap walk covers:** a script, not shipped, read all 426 frames and the 1,736 live controls in them, against a hand-written table of where each control leads. Bars are pinned at the bottom of the screen, except at 200% text, where they scroll, so the walk also treats them as pinned there and leans on the 200% holds. It compared the tapped control's rectangle with every commit in the next state and any in-between state after it, and read an exception's named frame in its place. That includes the 150 sheet buttons and reason fields, and the 807 list rows and tickets. A live control here is an enabled button or a sheet's reason field that can be tapped. Controls on the dimmed screen behind a sheet are not counted, so a plain count of the markup finds more: 923 rows and tickets, not 807. It does not prove real timing, a tap outside a sheet, or a row scrolled to some other height: those rest on the holds. 18 tap paths are safe only because of a hold.
- **Done:** where My shifts is beside the work, `Back to my shifts` would go nowhere, so a tablet says Done, which closes the open pane. On a phone My shifts is its own screen, so the words stay. Pick a shift – no shifts has no Done on a tablet, because nothing is open to close.
- **Offer it again:** opens step 2 of Offer a shift for the same shift, as does Choose someone else.
- **Tablet list reload:** Approve and Decline are off until the list finishes updating.
- **Phone action bar:** drawn at the end of the content, and pinned to the bottom in the product.
- **Shorter height:** in landscape a list ticket folds to two lines. Six shifts almost fill the screen height, and the worst frames run past it because a review page hides nothing. Each pane scrolls alone in the product.

## States

| Screen | Default | Empty | Loading | Error | Refused | Smallest size |
|---|---|---|---|---|---|---|
| Pick a shift | Yes, plus tapping an offered shift | Yes | First load and reload | Yes | Too close to the start | 320 frame |
| Find a colleague | Yes, plus one chosen | Nobody can take it; no search match | Checking | Yes | Swaps closed | Same parts as Pick a shift |
| Check and send | Yes, plus longest data and 40% longer words | Cannot happen: a shift is always chosen | Sending | Yes | Colleague no longer free | 320 frame |
| Your offer | Seven outcomes | Cannot happen: it opens from a sent offer | First load, reload, and cancelling | Could not update; could not cancel, before and after someone accepts | Cancel after approval | 320 frames |
| Accept a shift | To everyone, to one person, and approved after accepting | Cannot happen: it opens from an offer | First load, reload, accepting, and saying no | Could not open, could not accept, and could not say no | Taken, can't take it, ended, and after accepting: declined, not decided, or cancelled | 320 frame |
| Swap requests | Yes | Yes | First load and reload | Yes | Not a manager here | 320 frame |
| One request | Pass, stopped by hours or rest, and the last request after approving, declining, or already handled | Cannot happen: it opens from a request | First load, approving, and declining | Checks failed; approving held; could not approve; decline failed | Already handled | 320 frames |

Every state is drawn on a phone in light and dark, except on the large-text page, which is light only. The figures for one state share `data-design-group`, in the order phone, tablet, tablet landscape, then dark. A state's phone frame keeps the state's name as its `id`, and the others add `-tablet`, `-tablet-landscape`, and `-dark`. Each page has one dark tablet frame and one dark landscape frame, except large text and iOS and Android differences, whose dark frames are phones. Default, main-task, and error-recovery states are drawn at every size. A size with nothing new is listed under Sizes on the page, naming the state that shows the layout. Frames show the layout iOS and Android share, and each difference is drawn as its own state under [iOS and Android differences](platform.html).

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
11. **Where do managers approve?** Options: phone and tablet, as drawn, or also a desktop screen. Recommend watching one first. Product owner decides.
12. **How large must text go?** Options: 200%, or the largest system size. Recommend device testing at the largest size. Design and engineering decide.
13. **Is there a brand?** None was given, so marigold, sand, and the name are placeholders until the product owner confirms them. Check that marigold has no meaning in the hospital's own colour codes.
14. **Has anyone seen real Android type?** Not yet: review pages ship no font, so without Roboto installed a Mac shows Android frames in a fallback. Options: check on an Android device, or review on a machine with Roboto. Recommend a device. Design decides.
15. **Who uses a tablet, and where?** Options: a nurse's own tablet, a shared ward tablet, or both, as drawn. Recommend asking nurses and one ward team before building for both. Product owner decides.
16. **How does a shared ward tablet know who is using it?** Sign-in, switching person, and locking are not drawn. Options: sign in for each use, badge tap, or personal devices only. Recommend personal devices first, because a shared tablet changes the privacy rules too. Ward team and IT decide.
17. **Is 768 two panes or one?** Android's guide shows one pane at Medium width, and Material allows two. Options: two, as drawn, or one until 840. Recommend two, because the list is short and a nurse moves between shifts, and testing it on a real tablet. Design decides.
18. **What may a shared screen show?** Names, "Needs more rest", and a manager's reason are all readable over a shoulder. Options: as drawn, hide people's reasons on shared tablets, or leave colleagues' details off. Recommend deciding with decision 16. HR decides.
19. **What opens first on a tablet?** As drawn, nothing opens on its own for a nurse, because the shift is their choice, and the soonest request opens for a manager, because it is always next. Options: as drawn, or a placeholder for both. Recommend as drawn. Product owner decides.
20. **Are tablets touch only?** As drawn, there is no hover. An iPad with a trackpad has a pointer. Options: touch only, or add hover states. Recommend touch only until a ward has keyboards. Design decides.
21. **What is Android's sheet limit?** 640 is drawn, unconfirmed. Options: keep 640, or use the platform default. Recommend the platform default, once engineering reads it from `SheetMaxWidth`. Engineering decides.
22. **What does a tablet do instead of calling?** Call is the main way forward in several states, and many tablets cannot call. Options: Message and the number, as drawn, the number only, or call where the device can. Recommend as drawn. The drawn phone number is invented, and Message hands over to another app, so it has no failure state here. IT decides.
23. **What happens to a half-finished offer when a nurse taps another shift?** As drawn, it stays as a draft with its note, and no question is asked. Options: as drawn, ask first, or discard it. Recommend as drawn, because a tap in a list should not cost typed words. How long a draft lasts is still open. Product owner decides.
24. **What does the on-screen keyboard cover?** Only the decline sheet is drawn with it, and its heights are stand-ins. Options: check the note field and search field on a device, or draw each. Recommend checking on a device first. Design and engineering decide.
25. **What survives rotating a tablet mid-task?** As assumed, the open item, typed text, and any open sheet. Options: as assumed, or rotate only between screens. Recommend as assumed. Rotation changes width, so the layout moves between two and three panes. Engineering decides.
26. **Can people reach the bar in landscape?** As drawn it sits under the main pane, in the middle of a propped tablet. Options: as drawn, or at the side nearest a hand. Not tested. Recommend testing on a ward. Design decides.
27. **What does a tap outside a sheet do?** Decided for now: with a typed reason it does nothing, so words are never lost, and otherwise it works like Keep. Keep request with a typed reason discards it, and so does Escape on a paired keyboard. Options: as drawn, or ask first. Recommend as drawn. Design decides.
28. **How long should a hold last?** Decided for now: half a second at least, for Approve swap after a sheet closes or a request opens on a phone or at 200% text, for Send offer on a reopened draft, for a decline sheet's buttons as the keyboard moves it, and for a sheet's commit or Send offer at 200% text. Too short lets a repeat tap through, and too long feels broken. The length is a stand-in. Options: half a second, or test on a device first. Recommend half a second until tested. Design decides.

## Developer handoff

- **Tokens:** `docs/design-system/tokens.json` is the contract. Native apps read it; `components.css` is the specification and does not ship in them.
- **Reading the tokens:** sizes are numbers in px, read as pt on iOS, dp on Android, and sp for text. Colour and alpha are separate, so `component.sheet.scrim` pairs with `component.sheet.scrim-opacity`. Each part has its own colour tokens, and `component.text-style.*` gives size, weight, and leading. `$value` is light; `$extensions.design.modes.dark` is dark. The design system README covers the modes.
- **Fonts:** `semantic.typeface.ios` and `semantic.typeface.android`.
- **Layout:** read width, not device or orientation. Under 600 is one pane, 600 to 959 is two, and 960 and up is three. On the web, `components.css` does this with `@container`; native teams use size classes, with the same parts. See Breakpoints in the design system README.
- **Components:** `.screen`, `.panes`, `.pane`, `.app-bar`, `.action-bar`, `.sheet`, `.button`, `.ticket`, `.row`, `.baton`, `.tag`, `.notice`, `.check`, `.field`, `.empty`, `.refresh`, `.skeleton`.
- **Shared layout:** the frames show one layout for both platforms. Each row below marked Drawn has its own state under [iOS and Android differences](platform.html).

| Part | iOS | Android | Drawn |
|---|---|---|---|
| Font | SF Pro, with Dynamic Type | Roboto, with the system text size | iOS yes; Android in a fallback, see decision 14 |
| App bar title | Centred | Starts at the back arrow | Yes |
| Back | Chevron and edge swipe | Arrow and system back | Icon yes; the gesture is not drawable |
| Sheet | Native sheet with a grabber | Modal bottom sheet | Yes |
| Sheet on a tablet | Form sheet, centred, 480, no grabber | Modal bottom sheet, 640 at most, see decision 21 | Yes |
| Target | 48 pt, above iOS's 44 pt minimum | 48 dp | Same on both, so no separate state |
| Press feedback | Colour and 98% scale | Colour and 98% scale, with no ripple colour change | Same on both, so no separate state |

- **Screen readers:** a frame is a picture, so meaning is listed here. Each ticket reads as "Saturday 14 November, night shift, 19:00 to 07:00". A tappable offered ticket adds "offered, opens your offer", and a too-close ticket adds "starts in under 24 hours, opens the reason". The baton reads as a list of three steps with their state, and it is not a button. Notices are announced when they appear.
- **Paired keyboard:** Tab moves through controls in reading order, Enter runs them, and Escape closes a sheet, as Keep does, and returns focus to what opened it. So on the decline sheet, Escape drops a typed reason, as Keep request does: see decision 27.
- **Must not change:** the list stays beside the work whenever there is width for both; the time stays the largest text; Approve stays off while a check stops a swap; a failed check is never hidden; every failure says what was saved; the safe action is at the bottom of every sheet, except in landscape with the keyboard up, where it shares a row; the note label says who reads it; filled marigold is only ever the next tap; and the action bar stops being pinned once text is too large for it to fit.
- **Large text:** a full-size ticket uses the compact time once the text size makes the full time wider than the ticket, and a time only ever breaks after its dash.
- **Pinned bar:** drawn at the end of the content, because a review page hides nothing. In the product it is pinned to the bottom until large text makes that impossible. On a tablet it is pinned under the main pane, and each pane scrolls alone.
- **Sheet backdrop:** phone frames show the scrim alone, and tablet frames show the screen behind it, dimmed. In the product the scrim always sits over the screen that opened the sheet, and past the top of the screen a sheet scrolls.
- **Slots:** `.button--retry` takes its own row in the states that reload data, `.button--half` takes the inline-start half, and `.action-bar--even` splits a row with a commit evenly. Native teams keep the same positions.
- **Say no again:** after a failed no, the retry keeps Say no's slot at every size, so a repeat tap can never land on Accept shift.
- **Selection:** a selected ticket or row doubles its edge, so selection is shape as well as colour. Screen readers hear "selected".

App code is a separate job.

## Design review

Pending. Not run in this session: someone else runs `ux-reviewer` and `ui-reviewer`. Every frame was rendered in Chrome and measured for sideways overflow, and every tablet and landscape frame was checked by eye.
