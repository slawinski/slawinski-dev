# Testing and QA

## 1. Test pyramid

Use the lightest test appropriate to the risk.

### Unit
- DTO mappers;
- slug utilities;
- reading-time utility;
- redirect normalization;
- rich-text block mapping.

### Integration/build
- content client;
- static path generation;
- RSS;
- sitemap;
- build failure on invalid content.

### End-to-end
- primary navigation;
- mobile menu;
- tag filtering;
- project/article navigation;
- external actions;
- 404.

### Visual
- screenshot regression on core pages/breakpoints.

---

## 2. Tooling

Suggested:
- Vitest for TypeScript unit/integration;
- Playwright for browser E2E;
- accessibility scan via axe integration;
- screenshot comparison using Playwright.

Exact tooling may adapt to current Astro ecosystem, but avoid duplicate frameworks.

---

## 3. Mandatory E2E flows

### Navigation
1. open Home;
2. use keyboard to navigate to Work;
3. open project;
4. return to Work.

### Mobile menu
1. viewport 390×844;
2. open menu;
3. verify focus inside;
4. Escape close;
5. verify focus returns;
6. reopen and select Writing.

### Writing
1. open `/blog`;
2. filter by tag;
3. open article;
4. code block scrolls/copies if copy implemented.

### Legacy route
1. open known old URL;
2. verify content or one-hop redirect.

### 404
1. unknown path;
2. clear recovery links.

---

## 4. Accessibility QA

Automated:
- axe on main templates.

Manual:
- keyboard-only;
- VoiceOver on macOS/iOS or equivalent;
- 200% zoom;
- reduced motion;
- high contrast where applicable.

Check:
- heading order;
- focus;
- menu;
- links;
- alt text;
- filter selected state.

---

## 5. Visual regression pages

Desktop 1440×900:
- Home
- Work
- one project
- Writing
- one article
- Speaking
- About
- Contact

Mobile 390×844:
- same core set;
- open mobile menu state.

Also one 768px tablet pass.

---

## 6. Content edge cases

Create fixtures:

Posts:
- extremely long title;
- no cover;
- many tags;
- code-heavy;
- embedded video;
- long unbroken URL;
- table.

Projects:
- no links;
- private;
- one image;
- many images;
- long role name;
- long technology tag.

Talks:
- no media;
- slides only;
- video only;
- long event name.

---

## 7. Browser matrix

Current stable:
- Chrome;
- Safari;
- Firefox;
- Edge.

Mobile:
- iOS Safari;
- Android Chrome.

Do not target obsolete browsers that Astro/current platform tooling does not support unless analytics demonstrate a need.

---

## 8. Responsive QA

Mandatory widths:
- 320
- 375
- 390
- 430
- 768
- 1024
- 1280
- 1440
- 1920

Test continuous resizing around:
- 767/768;
- 1023/1024.

Check:
- overlap;
- clipping;
- nav wrapping;
- horizontal scroll.

---

## 9. Content migration QA

Automated report:
- source count vs imported count;
- missing media;
- unresolved links;
- duplicate slugs;
- unsupported embeds/nodes.

Manual spot checks listed in migration spec.

---

## 10. Production smoke test

After deploy:
- Home loads;
- CSS/fonts/media load from production origins;
- one Work detail;
- one old Blog URL;
- RSS;
- sitemap;
- CMS publish triggers rebuild;
- no staging/CMS secrets in client source;
- canonical URLs point to production domain.
