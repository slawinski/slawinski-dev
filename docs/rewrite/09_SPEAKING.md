# Speaking

Route: `/speaking`

## 1. Goal

Show technical/community speaking as a real part of the author's work without turning the page into a logo wall.

Visual motif:
- event badge;
- ticket;
- stage pass;
- handwritten speaker notes.

---

## 2. Page intro

Required:
- `SPEAKING`;
- 1–2 sentence summary;
- optional badge/lanyard visual.

Keep the title large, but lower density than homepage hero.

---

## 3. Featured talk

If one talk is marked featured:

Desktop:
- large paper/badge card;
- title;
- event;
- date;
- description;
- thumbnail/photo;
- video/slides links.

Mobile:
- single stacked card.

If no featured talk exists, omit section without leaving a blank decorative frame.

---

## 4. Talk archive

Chronological, newest first.

Talk card/list row:
- talk title;
- event;
- date;
- location optional;
- description optional;
- `Video` link optional;
- `Slides` link optional;
- `Event` link optional.

Use an `availableAssets` pattern rather than disabled buttons.

---

## 5. Video

Do not load multiple YouTube iframes on archive page.

Use:
- image thumbnail;
- play/link CTA;
- either navigate to external video or open a single lazy embed.

Accessibility:
- thumbnail alt communicates talk/video;
- play button includes talk title.

---

## 6. Talk CMS fields

```text
title
slug/internal identifier
eventName
date
location
description
thumbnail
videoUrl
slidesUrl
eventUrl
featured
sortOverride optional
```

No talk-detail route needed in v1.

---

## 7. Empty states

If a talk has:
- no video: do not show Video action;
- no slides: do not show Slides action;
- no thumbnail: use a designed badge fallback, not a broken placeholder.

---

## 8. Acceptance criteria

- page remains useful if only text metadata exists;
- no archive row depends on hover;
- external links are identifiable;
- embeds do not dominate performance;
- layout handles long talk/event names.
