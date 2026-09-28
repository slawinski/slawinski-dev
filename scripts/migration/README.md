# Legacy migration

Migration scripts belong here and must be idempotent where practical.

## Blog → Payload Posts

The implemented importer lives with the CMS at `apps/cms/src/import-blog.ts` so it can run through Payload's CLI and Local API.

From the repository root:

```bash
pnpm --filter @slawinski/cms import:blog
```

The importer:

1. Reads every legacy `blog/*.md` article.
2. Parses `title`, `description` and `date` from frontmatter.
3. Uploads referenced local Markdown images to Payload `Media` when they are not already present.
4. Converts Markdown to Payload Lexical rich text.
5. Upserts `Posts` by slug and publishes them.
6. Preserves publication dates and the original `/blog/<slug>/` route in `legacyPath`.

The command is safe to rerun: existing posts are updated by slug and existing media are reused by filename.

## Remaining migration work

1. Verify imported article count, content, images and canonical routes.
2. Export the existing Hasura project records and map them into Payload Projects.
3. Generate a redirect/parity report before legacy deletion.

Do not delete the legacy `blog/` directory until imported article counts, canonical URLs and rendered content have been verified.
