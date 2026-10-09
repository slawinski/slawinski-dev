# Data Access and Build Pipeline

## 1. Data boundary

All Payload access from Astro lives under:

```text
apps/web/src/lib/content/
```

Suggested modules:

```text
client.ts
mappers.ts
queries/
  posts.ts
  projects.ts
  talks.ts
  globals.ts
```

Rendering components must not assemble REST query strings.

---

## 2. Client

Use Payload REST API or the official SDK.

Choose one and keep it consistent.

Recommended: official Payload SDK if it works cleanly in the Astro build environment and preserves type safety.

Client responsibilities:
- base URL;
- auth token if build reads use one;
- timeout;
- normalized errors.

Example interface:

```ts
export interface ContentClient {
  getPosts(): Promise<PostListDTO[]>
  getPostBySlug(slug: string): Promise<PostDTO | null>
  getProjects(): Promise<ProjectCardDTO[]>
  getProjectBySlug(slug: string): Promise<ProjectDTO | null>
  getTalks(): Promise<TalkDTO[]>
  getHome(): Promise<HomeDTO>
  getSiteSettings(): Promise<SiteSettingsDTO>
}
```

---

## 3. Public vs tokened build reads

Preferred:
- published content is publicly readable;
- build fetches public published API;
- admin/draft data remains protected.

If operational policy requires authenticated reads:
- use a server-only build token;
- never expose it to browser code.

---

## 4. Build-time generation

For collection detail pages:

```ts
export async function getStaticPaths() {
  const projects = await content.getProjects()
  return projects.map(project => ({
    params: { slug: project.slug },
    props: { project }
  }))
}
```

Do analogous generation for posts.

Do not fetch the same entire collection independently from many components.

Fetch at page/data layer and pass DTOs down.

---

## 5. DTO mapping

Payload response -> validate -> map -> render.

Mapping removes:
- admin metadata;
- version fields;
- internal IDs where not needed;
- deeply nested CMS shape.

Normalize:
- media URL;
- image dimensions;
- tags;
- null/undefined;
- rich text node structure.

---

## 6. Build validation

Build must fail when:
- required Site Settings missing;
- a homepage featured relation points to unavailable unpublished content;
- duplicate slug exists;
- rich text contains unsupported required block;
- CMS is unreachable after limited retry;
- API returns malformed expected schema.

Build may warn when:
- optional alt/caption missing under allowed circumstances;
- social image absent;
- a project has no external links.

---

## 7. Retry policy

CMS fetch:
- small bounded retry, e.g. 2–3 attempts;
- exponential delay;
- no infinite retry.

After failure:
- throw contextual error.

---

## 8. Publish webhook

Payload publish event calls web deployment hook.

Requirements:
- secret webhook URL stored server-side;
- log response code;
- do not expose hook URL to browser.

If webhook fails:
- content may remain saved/published in CMS;
- admin/log must make failure discoverable;
- allow manual rebuild.

---

## 9. Draft preview

v1 does not require a production draft-preview system.

Reason:
- keeping Astro fully static simplifies architecture substantially.

Developer experience:
- local web can optionally use a CMS access token to preview draft data during development.

Production live preview can be a later feature if editorial workflow proves to need it.

Do not switch the whole public site to SSR solely for draft preview.

---

## 10. Caching

Static output is the main cache.

CMS API responses during build may use short in-process memoization to avoid duplicate requests.

Do not add Redis/CDN application caching for v1.

---

## 11. Local development

Root scripts:

```json
{
  "scripts": {
    "dev": "pnpm -r --parallel dev",
    "dev:web": "pnpm --filter web dev",
    "dev:cms": "pnpm --filter cms dev",
    "build": "pnpm -r build",
    "lint": "pnpm -r lint",
    "typecheck": "pnpm -r typecheck",
    "test": "pnpm -r test"
  }
}
```

Web waits for CMS data to be available.

Document first-run setup in repository README.

---

## 12. RSS and sitemap

Generated from the same normalized DTOs.

No separate source of truth.

RSS:
- published posts.

Sitemap:
- normal public pages;
- published posts;
- public project details.

Exclude:
- CMS;
- drafts;
- dev component route;
- preview routes.

---

## 13. Error pages

Astro build generates:
- 404 page.

Runtime CMS errors do not affect already deployed static site.

This isolation is a feature: a CMS outage does not take the public site down.
