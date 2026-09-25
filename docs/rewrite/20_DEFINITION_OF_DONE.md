# Definition of Done

The rewrite is ready for production only when all applicable items below are satisfied.

## Architecture

- [ ] pnpm workspace is documented.
- [ ] Astro and Payload are separate apps.
- [ ] Payload runs in its supported Next.js environment.
- [ ] TypeScript strict passes.
- [ ] No Tailwind.
- [ ] No legacy Gridsome/Vue runtime is shipped.
- [ ] No legacy Hasura dependency remains unless explicitly required for unrelated retained data.
- [ ] Frontend components do not directly depend on Payload server internals.
- [ ] Production database/media storage is persistent and backed up.

## CMS

- [ ] Admin auth works.
- [ ] Posts can be drafted/published.
- [ ] Projects can be created/published.
- [ ] Talks can be managed.
- [ ] Home selections can be edited.
- [ ] About/Site settings can be edited.
- [ ] Media alt text workflow exists.
- [ ] Public API cannot read Users.
- [ ] Draft content does not leak into public build.
- [ ] Publish can trigger web rebuild.
- [ ] Migrations are committed.

## Global UX

- [ ] Work, Writing, Speaking, About and Contact are obvious.
- [ ] Header works desktop.
- [ ] Mobile menu works keyboard/touch/screen reader.
- [ ] Skip link works.
- [ ] Focus is visible.
- [ ] No horizontal page scroll from 320px upward.
- [ ] No novelty interaction blocks content.

## Visual system

- [ ] Page feels consistent with Developer Workbench concept.
- [ ] Tactile maximalism is strongest in hero/composition zones.
- [ ] Article body is visually calm.
- [ ] Rotations are deterministic.
- [ ] Decorative objects use documented material families.
- [ ] No generic SaaS-card visual drift.
- [ ] No excessive cutealism/Y2K/cyberpunk drift.
- [ ] Mobile is intentionally composed, not a collapsed desktop pile.

## Home

- [ ] Name/identity clear.
- [ ] Work/Writing reachable immediately.
- [ ] Portrait optimized.
- [ ] Featured projects driven by CMS.
- [ ] Currently note driven by CMS or intentionally hidden.
- [ ] Latest writing works.
- [ ] Hero stable at all test widths.

## Work

- [ ] Work index exists.
- [ ] Project cards contain meaningful visible metadata.
- [ ] Project details handle optional fields.
- [ ] Rich project media blocks render.
- [ ] No invented outcome metrics.
- [ ] Related/back navigation works.

## Writing

- [ ] Blog index exists at `/blog`.
- [ ] Tag filtering has linkable state.
- [ ] Article URLs preserve legacy paths where practical.
- [ ] Code blocks render and scroll correctly.
- [ ] Images and captions render.
- [ ] Legacy embeds have valid mapped behavior.
- [ ] RSS validates.
- [ ] Long article works at 320px.

## Speaking

- [ ] Talk list handles missing video/slides/thumb.
- [ ] No bulk iframe loading.
- [ ] Featured talk is optional.

## About/Contact

- [ ] About is narrative, not a CV dump.
- [ ] No skill percentage bars.
- [ ] Contact email is a normal link.
- [ ] Social links accessible.

## Migration

- [ ] Current route inventory captured.
- [ ] Post count reconciled.
- [ ] Project content reviewed/imported.
- [ ] Legacy media references resolved.
- [ ] Duplicate slugs resolved.
- [ ] Redirect map reviewed.
- [ ] No unexplained old indexable URL becomes 404.
- [ ] Representative migrated posts manually compared.

## Accessibility

- [ ] WCAG 2.2 AA issues from automated checks addressed.
- [ ] Keyboard-only pass completed.
- [ ] Mobile menu focus behavior verified.
- [ ] Screen-reader spot check completed.
- [ ] Reduced motion verified.
- [ ] 200% zoom pass completed.
- [ ] Meaningful images have alt text.

## Performance

- [ ] Homepage LCP element optimized.
- [ ] CLS <= 0.1 target.
- [ ] No autoplay video.
- [ ] Below-fold media lazy-loaded.
- [ ] Decorative textures appropriately compressed.
- [ ] Font payload reviewed.
- [ ] No unnecessary client framework shipped.
- [ ] Production Lighthouse/profile reviewed on representative mobile settings.

## SEO

- [ ] Unique titles/descriptions.
- [ ] Canonicals correct.
- [ ] OG/social images work.
- [ ] Sitemap works.
- [ ] RSS works.
- [ ] CMS/admin not indexed.
- [ ] Redirects are one hop.
- [ ] 404 returns correct status on hosting platform.

## Testing

- [ ] Unit tests for content mapping/utilities.
- [ ] E2E navigation flow.
- [ ] E2E mobile menu.
- [ ] E2E writing flow.
- [ ] E2E legacy route.
- [ ] Visual snapshots on desktop/mobile.
- [ ] Chrome/Safari/Firefox/Edge smoke tested.
- [ ] iOS Safari and Android Chrome smoke tested.

## Operations

- [ ] `.env.example` exists.
- [ ] production secrets are not committed.
- [ ] CMS database backup exists.
- [ ] restore procedure is documented/tested.
- [ ] manual web rebuild path exists.
- [ ] production smoke test completed after cutover.

## Final product check

A visitor who disables JavaScript must still be able to:
- read the site;
- navigate core pages;
- open projects;
- read articles;
- contact the author.

The final site should look unconventional while behaving predictably.
