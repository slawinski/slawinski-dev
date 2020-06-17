<template>
  <Layout>
    <div>
      <h1
        class="text-headline leading-none font-sans font-bold tracking-tight text-4xl sm:text-7xl mb-10"
      >
        {{ $page.post.title }}
      </h1>
      <h6 class="mb-10 text-lg">{{ $page.post.date }}</h6>
      <div class="markdown" v-html="$page.post.content" />
    </div>
  </Layout>
</template>

<page-query>
query Post ($path: String!) {
  post: post (path: $path) {
    title
    content
    description
    date (format: "D MMMM YYYY")

  }
}
</page-query>

<script>
import getShareImage from '@jlengstorf/get-share-image';

export default {
  computed: {
    socialImage() {
      return getShareImage({
        title: this.$page.post.title,
        tagline: this.$page.post.description,
        cloudName: 'slawinski-dev',
        imagePublicID: 'social-image_dju5tn',
        font: 'helvetica',
        textLeftOffset: '0',
        titleLeftOffset: '10',
      });
    }
  },
  metaInfo() {
    return {
      title: this.$page.post.title,
      meta: [
        {
          key: 'og:description',
          name: 'og:description',
          content: this.$page.post.description,
        },
        {
          key: 'og:image',
          name: 'og:image',
          content: this.socialImage,
        },
        {
          key: 'twitter:description',
          name: 'twitter:description',
          content: this.$page.post.description,
        },
      ],
    };
  },
};
</script>

<style>
/*@import 'https://github.githubassets.com/assets/gist-embed-d89dc96f3ab6372bb73ee45cafdd0711.css';*/

.gist .blob-code-inner {
  font-size: 1rem;
}
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
  @apply mb-4 font-body text-2xl;
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
  @apply font-mono text-lg inline bg-white rounded px-1 py-05;
}

.markdown pre {
  @apply bg-white overflow-auto rounded p-4;
}

.markdown pre code {
  @apply block bg-transparent text-lg p-0 overflow-visible rounded-none;
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

/*.markdown td {*/
/*  @apply border py-1 px-3;*/
/*}*/

/*.markdown div {*/
/*  @apply mb-10*/
/*}*/

/* Override pygments style background color. */
.markdown .highlight pre {
  @apply bg-white !important;
}
</style>
