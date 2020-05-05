---
title: test post
description: Lorem ipsum
draft: true
date: 2020-01-01T00:00:00.000Z
---
1. Install gridsome `npm install --global @gridsome/cli`
2. Run `gridsome create xxx`
3. Run `npm install @gridsome/source-filesystem @gridsome/transformer-remark`
4. Edit `gridsome.config.js`
4. Create `Post.vue` in `src/templates` and `PostList.vue` in `src/components` and `test.md` in `/blog`
5. Create repo and push
6. Go to netlify, create new, add form github, build command `gridsome build`, publish directory `dist`
7. Create `config.yml` and `index.html` in `/static/admin` and `index.html` in `/src`
8. Commit and push
9. On netlify indentity > enable identity > settings and usage > invite only 
                                                               > enable git gateway
                        > invite users
10. Confirm email, set a password and go to `/admin` url