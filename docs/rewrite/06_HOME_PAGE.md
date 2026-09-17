# Home Page Specification

Route: `/`

## 1. Goal

The homepage must introduce the person, establish the visual identity, and send visitors toward Work or Writing quickly.

It is not a dashboard and not a full archive.

---

## 2. Desktop composition

Target first viewport on 1440×900:

```text
┌────────────────────────────────────────────────────────────┐
│ header                                                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  BIG NAME / IDENTITY               portrait / annotations  │
│  one-line positioning                                      │
│                                   old-dialog fragment       │
│                                                            │
│  CRT / quick links       sticky "currently"                │
│                                                            │
│                 FEATURED WORK cards                        │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

The composition may extend beyond one viewport vertically depending on content, but identity and at least part of selected work should be visible without excessive scrolling.

---

## 3. Hero content

Required:
- display name;
- concise positioning statement;
- portrait or alternate personal visual;
- Work CTA;
- Writing CTA.

Suggested copy structure:

```text
PIOTR
SŁAWIŃSKI

makes software for people
and occasionally writes about why it broke.
```

Actual copy remains editorial content and may be edited.

### Display-name treatment

- huge black grotesk;
- line-height ~0.88–0.95;
- responsive clamp;
- may have paper/print distress at low opacity;
- must remain real text, not an image.

### Highlight phrase

One short phrase may use acid/yellow marker behind text.

Do not highlight a whole paragraph.

---

## 4. Portrait object

Desktop:
- printed-photo treatment;
- approximately 28–38% of hero width;
- slight deterministic rotation;
- optional tape/corner treatment;
- descriptive alt text if photo conveys identity;
- if redundant with nearby text, alt may simply identify the person.

Mobile:
- moves below identity text;
- width ~70–90% depending on image;
- crop must remain intentional.

CMS:
- portrait can be Site Settings media or Homepage global media.

---

## 5. Annotation cluster

1–3 decorative annotations allowed around hero:
- "Developer / Speaker / Builder / Human"
- tiny stamp
- smiley/doodle
- short handwritten note.

They must:
- not duplicate critical navigation only;
- not overlap text at 1024px;
- become simplified/removed on mobile.

Implement as separate elements/SVG assets, not baked into hero image.

---

## 6. Retro dialog fragment

Optional but recommended desktop object.

Purpose:
- personality;
- small greeting;
- optional link to About.

Visual:
- late-90s neutral dialog window;
- 1–2 lines of copy;
- one button.

If button is interactive, it must have a meaningful action such as "About me".

Never implement a fake OS alert that users must dismiss to continue.

On mobile:
- omit or move to later section if space is constrained.

---

## 7. CRT quick-links object

Desktop:
- old monitor/terminal-like card;
- contains links to primary sections, e.g.:

```text
> WORK
> WRITING
> SPEAKING
> ABOUT
> CONTACT
```

This is supplementary to global navigation.

Implementation:
- semantic `<nav>`;
- real anchor links;
- green-screen visual;
- no JavaScript required.

Mobile:
- optional compact version;
- do not repeat all links if it creates redundancy with menu;
- may show only `> WORK`, `> WRITING`, `> CONTACT`.

---

## 8. "Currently" sticky note

Purpose:
- human recency signal.

Content:
- heading `Currently:`
- 1–3 short items;
- max around 160 characters total.

CMS:
- Homepage global field.

Desktop:
- overlapping but readable paper note.

Mobile:
- normal-flow card after portrait or featured work.

No automatic timestamps unless maintained.

---

## 9. Featured work

Homepage shows 2–3 selected projects.

Desktop:
- horizontal row with controlled overlap;
- each looks like a different physical/digital object variant but shares a common content contract.

Required card content:
- title;
- one-line descriptor;
- image/cover;
- optional small category/role;
- entire card is a link.

Do not put long project summaries in homepage cards.

One project may be visually dominant.

---

## 10. Selected writing section

Below hero/work composition.

Header:
- `Latest notes` or `Writing`
- link to `/blog`

Show 3–5 posts.

Preferred presentation:
- editorial index list;
- thumbnail only where useful;
- date;
- title;
- short description;
- reading time.

This area should visually calm down compared with hero.

---

## 11. Speaking teaser

Optional but recommended.

Show:
- one recent/featured talk;
- event;
- title;
- video/slides indicator if available;
- link to `/speaking`.

Visual motif:
- conference badge/ticket.

---

## 12. Bottom contact CTA

One clear statement and link.

Example pattern:

```text
Have something interesting to build or talk about?
[ Get in touch → ]
```

Keep the CTA direct.

---

## 13. Homepage decorative budget

Maximum simultaneous major decorative objects in hero desktop:
- 1 portrait;
- 1 retro dialog;
- 1 CRT/nav object;
- 1 sticky note;
- 2–3 small stamps/scribbles.

If all are present, decorative textures should be restrained.

Mobile:
- max 1–2 decorative objects visible per screenful.

---

## 14. Loading/performance

Hero LCP element must be optimized.

If portrait is LCP:
- use correct dimensions;
- preload/priority appropriately;
- do not lazy-load LCP.

Below-the-fold work images:
- lazy-load.

No autoplay video in hero.

---

## 15. Acceptance criteria

- identity is understandable without decorative objects;
- Work and Writing can be reached in one action from first viewport;
- hero does not overlap/crop critical content from 320px through 1920px;
- homepage has no horizontal scrolling;
- no client framework needed for core hero;
- all featured content comes from Payload selections;
- keyboard tab order follows reading order, not absolute visual placement.
