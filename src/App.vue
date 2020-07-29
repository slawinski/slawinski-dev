<template>
  <router-view />
</template>

<static-query>
query {
  metadata {
    siteName
    siteDescription
    siteUrl
    siteOgImage
  }
}
</static-query>

<script>
export default {
  metaInfo() {
    return {
      link: [
        {
          key: `canonical`,
          rel: `canonical`,
          href: this.$static.metadata.siteUrl,
        },
      ],
      meta: [
        {
          key: 'og:title',
          property: 'og:title',
          content: this.$static.metadata.siteName,
        },
        {
          key: 'og:type',
          property: 'og:type',
          content: 'article',
        },
        {
          key: 'og:description',
          property: 'og:description',
          content: this.$static.metadata.siteDescription,
        },
        {
          key: 'og:image',
          property: 'og:image',
          content: this.$static.metadata.siteOgImage,
        },
        {
          key: 'twitter:description',
          name: 'twitter:description',
          content: this.$static.metadata.siteDescription,
        },
        {
          key: 'twitter:card',
          name: 'twitter:card',
          content: 'summary_large_image',
        },
        {
          key: 'twitter:image',
          name: 'twitter:image',
          content: this.$static.metadata.siteOgImage,
        },
      ],
    };
  },
};
</script>
