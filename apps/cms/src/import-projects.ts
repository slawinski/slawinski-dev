import { convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import { getPayload } from 'payload'

import config from './payload.config'

type SeedProject = {
  title: string
  slug: string
  summary: string
  year: number
  role: string
  status: 'live' | 'prototype' | 'archived'
  sortOrder: number
  tags: string[]
  github: string
  caseStudy: string
}

const PROJECTS: SeedProject[] = [
  {
    title: 'G-LOG',
    slug: 'g-log',
    summary: 'A mobile firearm inventory and shooting log with a deliberately retro terminal interface.',
    year: 2026,
    role: 'Product engineer',
    status: 'live',
    sortOrder: 10,
    tags: ['React Native', 'TypeScript', 'Expo', 'MMKV', 'Zod'],
    github: 'https://github.com/slawinski/glock-log',
    caseStudy: `## Overview

G-LOG (TriggerNote) is a React Native app for keeping firearm inventory, ammunition, range visits and shooting statistics together in one local-first tool. The project treats the logbook as an operational utility rather than a generic collection app.

## Selected capabilities

- Firearm inventory with specifications, purchase details and photos.
- Ammunition stock and consumption tracking across range visits.
- Per-firearm round counts, collection statistics and usage history.
- Local persistence and a green-on-black terminal-inspired visual system.

## Stack

React Native / TypeScript / Expo / MMKV / React Hook Form / Zod`,
  },
  {
    title: 'EGGSPEDITION',
    slug: 'eggspedition',
    summary: 'A household grocery-list app built around quick capture, shared lists and mobile-first use.',
    year: 2026,
    role: 'Product engineer',
    status: 'live',
    sortOrder: 20,
    tags: ['React', 'TanStack Start', 'TanStack Query', 'TypeScript', 'CSS Modules'],
    github: 'https://github.com/slawinski/eggspedition',
    caseStudy: `## Overview

Eggspedition is a shared household grocery application. Signed-in users work with a household-scoped list, categories, stores and activity history, while the interface is designed around fast additions and a compact mobile workflow.

## Selected capabilities

- Shared household model with onboarding and join flows.
- Fast grocery-item capture with categories and stores.
- Grouped smart views and household activity history.
- Custom claymorphism-inspired UI built without utility-first CSS.

## Stack

TanStack Start / React / TanStack Router / TanStack Query / TypeScript / CSS Modules`,
  },
  {
    title: 'SPRAY & PRAY',
    slug: 'spray-and-pray',
    summary: 'A local-first job-application engine that turns job hunting into a trackable terminal workflow.',
    year: 2026,
    role: 'Product engineer / AI tooling',
    status: 'live',
    sortOrder: 30,
    tags: ['Python', 'FastAPI', 'Textual', 'SQLite', 'LLM'],
    github: 'https://github.com/slawinski/spray-and-pray',
    caseStudy: `## Overview

Spray & Pray is a single-user job-search system that captures job descriptions, tailors CVs and cover letters, tracks application state, supports interview preparation and turns weak areas into learning material. The core workflow stays local, with external calls limited to configured LLM providers.

## Selected capabilities

- ATS-oriented CV and cover-letter generation from a master CV.
- Application pipeline with status history and Sankey visualisation.
- Browser-extension capture plus a terminal-native dashboard.
- Mock interviews, evaluation and generated deep-dive lessons.

## Stack

Python / FastAPI / Textual / SQLite / OpenAI-compatible APIs / Vanilla JS`,
  },
  {
    title: 'PODKŁAJDAL',
    slug: 'podklajdal',
    summary: 'A one-command local CLI that turns a YouTube video into vocal and instrumental MP3 tracks.',
    year: 2026,
    role: 'Product engineer',
    status: 'prototype',
    sortOrder: 40,
    tags: ['Python', 'Typer', 'Rich', 'yt-dlp', 'FFmpeg'],
    github: 'https://github.com/slawinski/podklajdal',
    caseStudy: `## Overview

Podkłajdal is intentionally narrow: paste one YouTube URL and receive two local files — vocals and instrumental. Downloading, audio preparation, source separation and encoding are handled as one staged workflow so the user does not need to understand the tools underneath it.

## Selected capabilities

- Single-command YouTube-to-stems workflow.
- Local audio processing and AI source separation.
- Stage-based progress, diagnostics and actionable failures.
- Apple Silicon macOS as the primary target with cached separation models.

## Stack

Python 3.12 / Typer / Rich / yt-dlp / FFmpeg / python-audio-separator`,
  },
]

const importProjects = async () => {
  const payload = await getPayload({ config })
  const editorConfig = await editorConfigFactory.default({ config: payload.config })
  let created = 0
  let updated = 0

  for (const project of PROJECTS) {
    const caseStudy = convertMarkdownToLexical({ editorConfig, markdown: project.caseStudy })
    const data = {
      title: project.title,
      slug: project.slug,
      summary: project.summary,
      year: project.year,
      role: project.role,
      status: project.status,
      featured: true,
      sortOrder: project.sortOrder,
      tags: project.tags.map((label) => ({ label })),
      links: [{ label: 'GitHub', url: project.github }],
      caseStudy,
      _status: 'published' as const,
    }

    const existing = await payload.find({
      collection: 'projects',
      limit: 1,
      pagination: false,
      where: { slug: { equals: project.slug } },
    })

    if (existing.docs[0]) {
      await payload.update({
        collection: 'projects',
        id: existing.docs[0].id,
        data,
        draft: false,
      })
      updated += 1
      payload.logger.info(`Updated project: ${project.slug}`)
    } else {
      await payload.create({ collection: 'projects', data, draft: false })
      created += 1
      payload.logger.info(`Created project: ${project.slug}`)
    }
  }

  payload.logger.info(`Project import complete: ${created} created, ${updated} updated, ${PROJECTS.length} total.`)
  process.exit(0)
}

await importProjects()
