# Component Library

## 1. Component architecture

Components are grouped by responsibility, not by page.

```text
components/
├── chrome/
├── primitives/
├── decorative/
├── content/
└── sections/
```

Avoid a `components/common` dumping ground.

---

## 2. Chrome components

### `SiteHeader.astro`

Props:
```ts
{
  currentPath: string
}
```

Responsibilities:
- logo;
- desktop nav;
- mobile menu trigger.

### `MobileMenu.astro`

Responsibilities:
- accessible overlay/dialog;
- primary nav;
- social links.

Client JS:
- only open/close/focus behavior.

### `SiteFooter.astro`

Props:
- site settings/social DTO.

---

## 3. Primitive components

### `ButtonLink.astro`

Props:
```ts
{
  href: string
  variant?: 'primary' | 'secondary' | 'text'
  external?: boolean
}
```

Rules:
- use `<a>` for navigation;
- never render a button just for link styling.

### `Tag.astro`

Props:
```ts
{
  label: string
  href?: string
  active?: boolean
}
```

### `SectionHeading.astro`

Props:
```ts
{
  eyebrow?: string
  title: string
  annotation?: string
}
```

### `ExternalLinkIcon.astro`

Decorative/accessibility behavior consistent site-wide.

### `Picture.astro`

Wrapper around responsive image output with:
- dimensions;
- alt;
- loading;
- presentation variant.

---

## 4. Decorative components

Decorative components have `aria-hidden="true"` unless they include real content.

### `StickyNote.astro`

Props:
```ts
{
  title?: string
  variant?: 'yellow' | 'paper'
  rotation?: 'left' | 'right' | 'none'
}
```

If it contains meaningful copy, it is not aria-hidden.

### `Stamp.astro`

Props:
```ts
{
  text: string
  tone?: 'blue' | 'ink' | 'red'
}
```

### `Scribble.astro`

Use predefined SVG variants:
- arrow;
- circle;
- underline;
- star;
- smile.

No runtime freehand generator.

### `Tape.astro`

Decorative only.

### `RetroDialog.astro`

Props:
```ts
{
  title?: string
  body: string
  href?: string
  actionLabel?: string
}
```

### `CrtPanel.astro`

Can contain links/slot.
Must remain semantic.

### `CaseFileLabel.astro`

Props:
```ts
{
  number?: string
  status?: string
}
```

---

## 5. Content components

### `ProjectCard.astro`

Props:
```ts
{
  project: ProjectCardDTO
  variant?: 'paper' | 'dark' | 'photo'
  emphasis?: 'normal' | 'featured'
}
```

Card variant can be assigned deterministically by project field or index.

### `PostListItem.astro`

Props:
```ts
{
  post: PostListDTO
  showImage?: boolean
}
```

### `TalkCard.astro`

Props:
```ts
{
  talk: TalkDTO
  featured?: boolean
}
```

### `ArticleMeta.astro`

### `RichTextRenderer.astro`

Maps known Payload content nodes/blocks.

### `CodeBlock.astro`

Props:
- code;
- language;
- filename optional.

### `MediaFigure.astro`

Props:
- image;
- caption;
- presentation.

---

## 6. Section components

### `HomeHero.astro`
### `FeaturedProjects.astro`
### `LatestPosts.astro`
### `SpeakingTeaser.astro`
### `ContactCTA.astro`
### `ProjectFacts.astro`
### `RelatedProjects.astro`
### `AuthorCard.astro`

Section components may compose primitives/decorative objects but should not embed global layout concerns.

---

## 7. Variant rule

A component gets a variant only if:
- structure is shared;
- differences are visual/limited;
- variant has a named design meaning.

Do not create props like:
```text
paddingTop
borderWidth
rotateDegrees
backgroundHex
shadowX
shadowY
```

Those are page-builder escape hatches and will destroy consistency.

---

## 8. Class naming

For scoped Astro CSS, local semantic class names are enough.

For CSS Modules:
- use camelCase;
- avoid utility-class recreation.

Global utility classes should be very limited:
- visually hidden;
- page shell/container;
- prose;
- no-js/js flags if needed.

---

## 9. Decorative determinism

Cards may appear slightly varied, but selection must be deterministic.

Good:
```ts
const variants = ['paper', 'dark', 'photo'] as const
const variant = project.cardVariant ?? variants[index % variants.length]
```

Better: store controlled `cardVariant` for featured projects if visual curation matters.

Do not use `Math.random()` in rendering.

---

## 10. Storybook

Not required in v1.

Instead create an internal development route:
`/dev/components`

Only in development.

Show:
- buttons;
- tags;
- project cards;
- notes;
- stamps;
- typography;
- rich-text examples.

Exclude this route from production build or guard via environment.

---

## 11. Component acceptance rules

Every component:
- has one clear responsibility;
- does not fetch CMS data directly unless it is explicitly a data boundary component;
- accepts typed props;
- works without hover;
- has accessibility semantics documented where non-obvious;
- has no magic global z-index;
- avoids layout shift.
