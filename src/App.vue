<template>
  <router-view />
</template>

<static-query>
query {
  metadata {
    siteName
    siteDescription
    siteUrl
    siteTagLine
  }
}
</static-query>

<script>
import getShareImage from '@jlengstorf/get-share-image';

export default {
  computed: {
    socialImage() {
      return getShareImage({
        title: this.$static.metadata.siteName,
        tagline: this.$static.metadata.siteTagline,
        cloudName: 'slawinski-dev',
        imagePublicID: 'social-image_dju5tn',
        font: 'helvetica',
        textLeftOffset: '0',
        titleLeftOffset: '50',
        titleBottomOffset: '300',
        titleExtraConfig: '_bold',
        taglineTopOffset: '400',
        taglineLeftOffset: '50',
      });
    },
  },
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
          content: this.socialImage,
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
          content: this.socialImage,
        },
      ],
    };
  },
};
</script>
