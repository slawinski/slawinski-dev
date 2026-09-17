# Content Migration

## 1. Goal

Move useful existing content into Payload without:
- changing article meaning;
- breaking URLs;
- losing code formatting;
- losing images;
- losing publish dates;
- silently dropping embeds.

The migration is one-time tooling, not production application logic.

---

## 2. Legacy inputs

Current architecture includes:
- Markdown posts under the repository `blog` directory;
- Gridsome filesystem content source;
- syntax highlighting;
- YouTube/Twitter remark integrations;
- project data sourced through Hasura/GraphQL;
- static assets/uploads;
- RSS.

The migration script must inspect actual source files instead of assuming all Markdown shares identical frontmatter.

---

## 3. Migration workflow

```text
1. inventory current routes
2. inventory Markdown/frontmatter variants
3. inventory referenced media
4. inventory embeds/custom syntax
5. export project data from legacy source
6. create Payload schemas
7. dry-run conversion
8. validation report
9. import media
10. import posts/projects
11. rebuild route map
12. visual/content QA
13. cutover
```

---

## 4. Scripts

Create:

```text
scripts/migration/
├── inspect-posts.ts
├── import-media.ts
├── import-posts.ts
├── import-projects.ts
├── verify-routes.ts
├── verify-content.ts
└── redirect-map.json
```

Every import script should support:
- dry run;
- idempotent/re-runnable behavior where practical;
- clear per-item logging.

---

## 5. Post frontmatter mapping

Typical mapping:

```text
legacy title        -> Posts.title
legacy description  -> Posts.description
legacy date         -> Posts.publishedAt
legacy slug/path    -> Posts.slug
legacy tags         -> Posts.tags
legacy image        -> Posts.cover/social image depending on use
markdown body       -> Posts.body
```

Do not regenerate slugs from titles if a stable legacy slug exists.

---

## 6. Markdown -> Lexical strategy

Preferred:
- parse Markdown to an AST;
- map known nodes to Lexical/Payload-supported structure;
- map special embeds to custom blocks.

Avoid:
- storing old Markdown wholesale inside a rich-text field as HTML;
- regex-only conversion for nested Markdown structures.

Validation report per post:
- heading count;
- image count;
- code block count;
- links count;
- embed count.

Compare pre/post counts where meaningful.

---

## 7. Code blocks

Preserve:
- language identifier;
- raw code;
- fenced block content.

Do not HTML-escape code twice.

Test posts with:
- JS/TS;
- shell;
- JSON;
- no language.

---

## 8. Images

For every referenced legacy image:
- locate source;
- import to Media;
- preserve meaningful alt text if available;
- update rich-text reference.

Report:
- missing file;
- remote-only asset;
- unknown format.

Do not silently hotlink an old Netlify path if media is meant to be migrated.

---

## 9. Embeds

Identify legacy YouTube/Twitter syntax from actual posts.

YouTube:
- convert to `video` block.

Twitter/social:
- convert to link/callout representation if stable first-party embed is undesirable;
- if preserving embed, ensure fallback link exists.

Create a migration report for every transformed embed.

---

## 10. Projects

Legacy projects may currently come from Hasura.

Export to JSON first.

Map into Payload Projects.

Before import, manually review:
- stale demo URLs;
- private/dead repositories;
- old role descriptions;
- screenshots that no longer represent useful work.

Migration is an opportunity to curate projects, not blindly mirror every record.

---

## 11. Route inventory

Before launch, crawl current production and store all internal indexable URLs.

After build, compare:
- existing preserved;
- intentionally redirected;
- intentionally removed.

No legacy URL should become an accidental 404 without being listed in migration review.

---

## 12. Redirects

For moved pages:
- 301 permanent;
- one hop only;
- no chains.

Article URLs should normally stay unchanged.

Potential:
```text
/projects/foo -> /work/foo
/projects     -> /work
```
only if those legacy paths actually exist.

---

## 13. Metadata

Migrate:
- titles;
- descriptions;
- dates.

Review:
- descriptions that are too weak/outdated;
- social images.

Do not invent `updatedAtEditorial` from migration date.

---

## 14. Validation

Automated:
- count posts before/after;
- count projects before/after;
- no duplicate slugs;
- no missing required fields;
- no broken internal links;
- no missing media references;
- redirect map resolves.

Manual:
- oldest post;
- newest post;
- code-heavy post;
- image-heavy post;
- embed-heavy post;
- very long post;
- at least three project details.

---

## 15. Cutover

Before cutover:
- freeze legacy content editing briefly;
- run final import;
- run build;
- run route verification;
- backup legacy repository/content;
- switch production.

Keep old repository history.

Do not delete legacy content immediately after launch.

## 16. Legacy Netlify functions and newsletter/email flows

The current repository contains two Netlify function groups:

- `functions/sendmail`
- `functions/subscribe`

These are legacy application integrations and must be inventoried before removal.

Migration rule:

1. inspect the current UI for any entry point that calls either function;
2. identify the external provider/API used by each function;
3. decide explicitly whether the behavior is still wanted in the redesigned site;
4. if not wanted, remove the UI and function together;
5. if wanted, reimplement it as a separate modern server-side integration rather than carrying the Netlify Lambda code forward unchanged.

The default v1 product scope in this specification does **not** require a newsletter form or custom contact form. Therefore these functions should be considered candidates for retirement unless the owner decides to retain those workflows.

Do not delete them before verifying whether there are still active subscribers, provider credentials, or externally linked endpoints.

---

## 17. Legacy Web Monetization

The existing Gridsome configuration includes `gridsome-plugin-monetization` driven by `PAYMENT_POINTER`.

This mechanism must **not** be migrated implicitly.

During cutover:

- verify whether Web Monetization is still intentionally used;
- if obsolete, remove the plugin/environment variable with the old stack;
- if intentionally retained, create a separate requirement and implement the contemporary equivalent in Astro.

The base rewrite specification assumes Web Monetization is retired.
