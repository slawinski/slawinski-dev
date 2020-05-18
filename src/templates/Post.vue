<template>
  <Layout>
    <div>
      <h1 v-html="$page.post.title" class="text-headline leading-none font-sans font-bold tracking-tight text-4xl sm:text-7xl mb-10"/>
      <h6 class="mb-10 text-lg" v-html="$page.post.date"/>
      <div v-html="$page.post.content" class="markdown"/>
    </div>
  </Layout>
</template>

<page-query>
query Post ($path: String!) {
  post: post (path: $path) {
    title
    content
    date (format: "D MMMM YYYY")

  }
}
</page-query>

<style>
  /* Additional vertical padding used by kbd tag. */
  .py-05 {
    padding-top: 0.125rem;
    padding-bottom: 0.125rem;
  }

  .markdown {
    @apply text-gray-900 leading-tight break-words;
  }

  .markdown > * + * {
    @apply mt-0 mb-4;
  }

  .markdown li + li {
    @apply mt-10;
  }

  .markdown li > p + p {
    @apply mt-6;
  }

  .markdown p {
    @apply mb-10 font-body text-2xl;
  }

  .markdown strong {
    @apply font-semibold;
  }

  .markdown a {
    @apply text-button;
  }

  .markdown a:hover {
    @apply text-button underline;
  }

  .markdown strong a {
    @apply font-bold;
  }

  .markdown h1 {
    @apply leading-tight font-sans text-4xl font-semibold mb-10 mt-6 pb-2;
  }

  .markdown h2 {
    @apply leading-tight font-sans text-2xl font-semibold mb-10 mt-6 pb-2;
  }

  .markdown h3 {
    @apply leading-snug font-sans text-lg font-semibold mb-10 mt-6;
  }

  .markdown h4 {
    @apply leading-none font-sans text-base font-semibold mb-10 mt-6;
  }

  .markdown h5 {
    @apply leading-tight font-sans text-sm font-semibold mb-10 mt-6;
  }

  .markdown h6 {
    @apply leading-tight font-sans text-sm font-semibold text-gray-600 mb-4 mt-6;
  }

  .markdown blockquote {
    @apply text-base border-l-4 border-gray-300 pl-4 pr-4 text-gray-600;
  }

  .markdown code {
    @apply font-mono text-base inline bg-gray-200 rounded px-1 py-05;
  }

  .markdown pre {
    @apply bg-gray-100 rounded p-4;
  }

  .markdown pre code {
    @apply block bg-transparent p-0 overflow-visible rounded-none;
  }

  .markdown ul {
    @apply font-body text-2xl mb-10 pl-8 list-disc;
  }

  .markdown ol {
    @apply font-body text-2xl mb-10 pl-8 list-decimal;
  }

  .markdown kbd {
    @apply text-xs inline-block rounded border px-1 py-05 align-middle font-normal font-mono shadow;
  }

  .markdown table {
    @apply text-base border-gray-600;
  }

  .markdown th {
    @apply border py-1 px-3;
  }

  .markdown td {
    @apply border py-1 px-3;
  }

  .markdown div {
    @apply mb-10
  }

  /* Override pygments style background color. */
  .markdown .highlight pre {
    @apply bg-gray-100 !important;
  }
</style>