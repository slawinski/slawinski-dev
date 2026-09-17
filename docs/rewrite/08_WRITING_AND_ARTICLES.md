# Writing and Articles

Routes:
- `/blog`
- `/blog/[slug]`

## 1. Writing index goal

The writing experience should feel editorial and archival, with the visual personality acting as framing rather than interfering with scanning.

---

## 2. Writing index intro

Required:
- `WRITING` display heading;
- short description;
- one small annotation/stamp.

Optional:
- featured post.

Do not use the homepage-level collage density here.

---

## 3. Filters

v1 supports tag filters.

Behavior:
- tags derive from published posts;
- `All` is default;
- filtering should work with normal links/query parameters first;
- progressive enhancement may update results without reload.

Recommended URL:

```text
/blog?tag=javascript
```

This makes filtered states linkable.

Do not implement opaque client-only state.

---

## 4. Post list item

Required:
- title;
- date;
- description;
- reading time.

Optional:
- thumbnail;
- tags.

Desktop row:
```text
[small thumbnail] [title + excerpt] [date/read time] [arrow]
```

Mobile:
- thumbnail 72–96px if present;
- title dominant;
- metadata below;
- generous touch target.

Entire row may be clickable if semantics are implemented correctly.

---

## 5. Sorting

Default:
- newest published first.

Posts can optionally have `featured` but featured status does not change canonical chronology.

---

## 6. Pagination

If total post count remains modest, render all posts.

If archive grows enough to create a very long page:
- use static pagination, e.g. `/blog/2`;
- do not default to infinite scroll.

---

## 7. Article header

Structure:

```text
[Writing / tag]

Article title
Short description/deck

Published: date
Updated: optional date
Reading time
Tags
```

No giant decorative hero is required.

Optional cover image appears after metadata.

---

## 8. Article body

Target width:
- approximately 68–74ch.

Body styles:
- clear heading hierarchy;
- 1.65–1.75 line height;
- visible link underline;
- strong blockquote;
- code styling;
- responsive tables;
- figure captions;
- lists with adequate spacing.

Decorative body treatment:
- paper texture may remain;
- scribbles limited to separators/pull quotes;
- no rotated paragraphs.

---

## 9. Code blocks

Requirements:
- syntax highlighting;
- horizontal scrolling inside block only;
- visible language label when known;
- optional copy button;
- copy button must work with keyboard;
- no line numbers by default unless content benefits;
- sufficient contrast.

Use Astro/Shiki or an Astro-supported syntax-highlighting path.

Inline code must remain visually distinct but not neon.

---

## 10. Rich text mapping

Payload Lexical nodes must map explicitly.

Minimum support:
- paragraphs;
- h2–h4;
- bold;
- italic;
- inline code;
- links;
- unordered list;
- ordered list;
- blockquote;
- code block;
- image/upload;
- horizontal rule.

Custom content blocks:
- YouTube/video embed;
- social embed fallback;
- callout;
- image figure.

Unknown node/block:
- build should warn;
- production should not silently drop meaningful content.

---

## 11. Legacy embeds

The current content architecture supports YouTube and Twitter-related Markdown plugins.

Migration must identify legacy embed syntax and convert it to controlled CMS blocks.

For old tweets:
- prefer rendering a stable link + quoted context supplied by the author;
- do not make article readability depend on a third-party embed script.

For YouTube:
- use privacy-aware lazy embed where possible;
- reserve aspect ratio to avoid layout shift.

---

## 12. Reading time

Calculate from normalized article body at build time.

Display:
- rounded minutes;
- not stored manually in CMS.

---

## 13. Article metadata

CMS fields:
- title;
- slug;
- description;
- publishedAt;
- updatedAt optional;
- tags;
- body;
- cover optional;
- social image optional;
- canonical override optional;
- draft status.

---

## 14. Article footer

Include:
- short author card;
- link back to all Writing;
- 2–3 related posts if tags match;
- RSS link.

Do not add newsletter UI unless a real newsletter service is part of the current product scope.

---

## 15. RSS

Preserve `/rss.xml`.

Include:
- post title;
- canonical URL;
- date;
- description;
- full content if stable and correctly serialized, otherwise meaningful excerpt.

No draft content.

---

## 16. SEO

Retain legacy article slugs where possible.

Article metadata:
- title;
- description;
- canonical;
- OpenGraph;
- Twitter/X card metadata;
- article published/modified time;
- social image.

Generate sitemap with published posts only.

---

## 17. Acceptance criteria

- migrated legacy articles render without missing headings/code/images;
- old article URLs resolve directly or via intentional permanent redirect;
- article body remains readable at 320px;
- no page-wide horizontal scroll from code/tables;
- tag-filter URLs are shareable;
- content works with JavaScript disabled except optional enhancements;
- RSS validates.
