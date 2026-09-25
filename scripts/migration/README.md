# Legacy migration

Migration scripts belong here and must be idempotent where practical.

Planned order:

1. Parse legacy `blog/*.md` frontmatter/content.
2. Upload referenced media into Payload Media.
3. Import posts while preserving legacy slugs/routes and publication dates.
4. Export the existing Hasura project records and map them into Payload Projects.
5. Generate a redirect/parity report before legacy deletion.

Do not delete the legacy `blog/` directory until imported article counts, canonical URLs and rendered content have been verified.
