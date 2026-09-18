# Information Architecture

## 1. Primary navigation

Global navigation labels:

- Work
- Writing
- Speaking
- About
- Contact

Desktop order must remain stable on every page.

Mobile uses the same order in the full-screen/menu-panel navigation.

The logo/monogram always returns to `/`.

---

## 2. Canonical routes

```text
/                       Home
/work                   Work index
/work/[slug]            Project case study
/blog                   Writing index
/blog/[slug]            Article
/speaking                Speaking index
/about                   About
/contact                 Contact
/rss.xml                 RSS
/404                     Not found
```

### Why `/blog` remains canonical

The existing site already exposes articles under `/blog/...`. Preserve those URLs where possible to avoid unnecessary redirects and external-link breakage.

The **navigation label is "Writing"** even though the route remains `/blog`.

---

## 3. Legacy route policy

During migration, crawl the current production site and build a route map.

Rules:

1. If old and new content are semantically the same, retain the old URL.
2. If a project moves from a legacy route to `/work/[slug]`, create a permanent redirect.
3. Never redirect every unknown legacy page to `/`; use a real 404 if no equivalent exists.
4. Preserve query parameters unless known to be obsolete tracking parameters.
5. Redirects must be tested before DNS/deployment cutover.

Create `scripts/migration/redirect-map.json` with:

```json
[
  {
    "from": "/old-path",
    "to": "/new-path",
    "status": 301
  }
]
```

---

## 4. Homepage hierarchy

Priority order:

1. identity / role statement;
2. primary navigation;
3. selected work;
4. short "currently" signal;
5. latest/selected writing;
6. speaking/community signal;
7. compact about/contact CTA.

Homepage is a sampler, not a replacement for archive pages.

---

## 5. Work hierarchy

`/work` must support:
- featured work;
- other projects;
- project status;
- role;
- high-level technology tags;
- year/timeframe.

Do not require filters in v1.

Project detail structure:

1. project title and summary;
2. hero media;
3. role / timeframe / status / links;
4. context/problem;
5. contribution/approach;
6. selected implementation or product decisions;
7. outcomes/lessons;
8. gallery/media as available;
9. related project or return-to-work CTA.

Sections with no real content should be omitted, not filled with boilerplate.

---

## 6. Writing hierarchy

`/blog`:

1. page title + short description;
2. optional featured/latest post;
3. tag filters;
4. chronological list;
5. pagination or "load more" only if archive size makes it necessary.

Article:

1. title;
2. description/deck;
3. date;
4. reading time;
5. tags;
6. body;
7. optional article metadata/updated date;
8. related posts or archive CTA.

---

## 7. Speaking hierarchy

`/speaking`:

- intro;
- featured/recent talk;
- chronological talks;
- event name;
- date;
- talk title;
- optional video;
- optional slides;
- optional event link;
- short description.

No separate talk-detail route is required in v1 unless a talk has enough material to justify it.

---

## 8. About hierarchy

`/about`:

- short human introduction;
- portrait;
- professional narrative;
- compact career/experience timeline;
- selected principles/working style;
- personal-interest fragments where desired;
- links to GitHub/LinkedIn/other public profiles;
- contact CTA.

Avoid:
- skill percentage bars;
- giant technology-logo wall;
- duplicating an entire CV.

---

## 9. Contact hierarchy

`/contact` should be intentionally simple:

- short invitation to get in touch;
- primary email CTA;
- social/profile links;
- optional availability note managed from CMS.

No custom contact form is required for v1 unless there is a concrete need. Prefer `mailto:` over maintaining an email backend.

---

## 10. Footer

Footer contains:

- monogram/name;
- copyright year;
- GitHub;
- LinkedIn;
- RSS;
- email/contact;
- optional "built with Astro + Payload" microcopy.

Do not repeat the entire primary navigation if it makes the footer visually crowded; primary links are acceptable if balanced.

---

## 11. 404

The 404 page may be playful, but must clearly state that the page does not exist and provide:
- Home
- Work
- Writing

Do not implement a fake crash screen that obscures recovery actions.
