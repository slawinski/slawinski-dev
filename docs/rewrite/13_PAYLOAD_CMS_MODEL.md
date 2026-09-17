# Payload CMS Model

## 1. CMS principles

Payload owns editorial content, not visual page composition.

Editors can:
- write;
- select;
- order;
- publish;
- attach media;
- choose from controlled variants.

Editors cannot:
- create arbitrary columns;
- set raw CSS values;
- enter HTML for layout;
- choose random colors;
- inject scripts.

---

## 2. Collections

### 2.1 Users

Slug: `users`

Fields:
- email
- name
- role optional

Access:
- admin-only;
- no public read.

Use Payload authentication.

---

### 2.2 Media

Slug: `media`

Fields:
- `alt` — required for meaningful editorial images
- `caption` — optional
- upload metadata
- optional focal point if supported/configured

Image sizes:
- thumb
- card
- wide
- social

Exact generated sizes should be tuned to deployment, but avoid dozens of derivatives.

---

### 2.3 Posts

Slug: `posts`

Fields:

```text
title: text, required
slug: text, required, unique, indexed
description: textarea, required
publishedAt: date, required when published
updatedAtEditorial: date, optional
tags: relationship hasMany -> tags
cover: upload -> media, optional
socialImage: upload -> media, optional
body: richText (Lexical), required
featured: checkbox
seo:
  title: text optional
  description: textarea optional
  canonicalUrl: text optional
```

Features:
- drafts/versions enabled;
- public API returns published only for unauthenticated reads;
- slug cannot silently change after publish without redirect handling.

---

### 2.4 Tags

Slug: `tags`

Fields:
```text
name: text, required
slug: text, required, unique
description: textarea optional
```

Use same tag collection for posts only initially.

Do not create separate category + tag taxonomies unless there is a real content distinction.

---

### 2.5 Projects

Slug: `projects`

Fields:

```text
title: text, required
slug: text, required, unique
shortDescription: textarea, required
overview: richText, optional
cover: upload -> media, required
gallery: array/media block optional
year: number optional
timeframe: text optional
role: text optional
teamContext: text optional
status: select
stack: array of text OR relationship -> technologies
links: array
featured: checkbox
sortOrder: number optional
caseNumber: text optional
cardVariant: select
accent: select
body: richText + controlled blocks
seo: group
```

Status:
```text
live
ongoing
archived
prototype
private
```

Card variant:
```text
paper
dark
photo
```

Accent:
```text
neutral
acid
blue
orange
yellow
```

Links array:
```text
label
url
kind: live | github | article | store | other
```

---

### 2.6 Talks

Slug: `talks`

Fields:

```text
title
eventName
date
location optional
description optional
thumbnail optional
videoUrl optional
slidesUrl optional
eventUrl optional
featured boolean
sortOverride optional
```

Published content can be immediate; drafts optional.

---

## 3. Globals

### 3.1 Site Settings

Slug: `site-settings`

Fields:
```text
siteTitle
siteDescription
defaultSocialImage
portrait
email
socialLinks[]
availabilityStatus
availabilityText
footerNote optional
```

Social links:
```text
platform
label
url
```

---

### 3.2 Home Page

Slug: `home-page`

Fields:
```text
headline
subheadline
highlightText optional
heroPortrait optional override
heroAnnotation optional
currentlyText optional
featuredProjects relationship hasMany max 3
featuredPosts relationship hasMany max 5
featuredTalk relationship optional
contactCtaTitle
contactCtaBody optional
```

Use explicit relationships so homepage curation does not depend only on generic `featured=true`.

---

### 3.3 About Page

Slug: `about-page`

Fields:
```text
intro
portrait optional
body richText
timeline[]
principles[]
interestNotes[] optional
contactCta
```

Timeline:
```text
period
title
description optional
```

---

## 4. Controlled rich-text blocks

Projects and posts may share some blocks.

Blocks:

### `mediaFigure`
```text
media
caption optional
presentation: raw | browser | device | photo
width: normal | wide | full
```

### `mediaPair`
```text
left media
right media
left caption optional
right caption optional
```

### `code`
```text
language
code
filename optional
```

### `callout`
```text
title optional
body
tone: note | warning | idea
```

### `video`
```text
provider: youtube | vimeo | external
url
caption optional
```

### `linkCard`
```text
title
description optional
url
```

Do not let editors nest blocks inside blocks.

---

## 5. Slug behavior

Generate initial slug from title.

After first publish:
- changing slug should require deliberate action;
- old slug should be captured for redirect generation.

Recommended hook:
- store `previousSlugs` array or write redirect record.

Optional collection:
`redirects` with `from`, `to`, `status`.

If implemented, frontend build consumes it.

---

## 6. Access control

Public unauthenticated:
- read published Posts;
- read Projects intended public;
- read Talks;
- read Tags;
- read public Globals;
- read Media.

Authenticated admin:
- create/update/delete as appropriate.

Do not expose Users publicly.

Draft content must never appear in public build queries.

---

## 7. Validation

URLs:
- valid absolute URL where external.

Dates:
- publishedAt required for published post.

Featured selections:
- Home Page max counts enforced.

Alt text:
- required by default for editorial media;
- allow empty only when explicitly marked decorative if CMS setup supports that distinction.

---

## 8. Hooks

Recommended:

### Post/project publish hook
On transition to published:
- trigger web deploy hook.

Debounce/coalesce if platform supports it.

### Slug-change hook
- record redirect mapping.

### Delete hook
- warn about linked homepage relationships;
- avoid orphaning selected references.

---

## 9. Admin UI ergonomics

Group fields into tabs:
- Content
- Media
- Metadata
- SEO

Do not show every field in one huge form.

Admin list views should show:
Posts:
- title;
- status;
- publishedAt.

Projects:
- title;
- status;
- featured.

Talks:
- title;
- event;
- date.

---

## 10. Seeding

Provide a development seed script:
- one admin user created manually or via documented env flow;
- 3 projects;
- 5 posts;
- 2 talks;
- site settings;
- homepage selections.

Seed media may use local placeholder files.

Production migration is separate from dev seed.
