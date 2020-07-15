// This is the main.js file. Import global CSS and scripts here.
// The Client API can be used here. Learn more: gridsome.org/docs/client-api

import DefaultLayout from '~/layouts/Default.vue';

require('typeface-public-sans');
require('typeface-pt-sans');

export default function (Vue, { router, head, isClient }) {
  // Set default layout as a global component
  Vue.component('Layout', DefaultLayout);

  // Add attributes to HTML tag
  head.htmlAttrs = { lang: 'en' };

  // Add attributes to BODY tag
  head.bodyAttrs = { class: 'bg-background leading-normal' };

  head.meta.push({
    key: 'og:type',
    name: 'og:type',
    content: `article`,
  });

  head.meta.push({
    key: 'og:description',
    name: 'og:description',
    content: 'Piotr Slawinski thinks you might like it',
  });

  head.meta.push({
    key: 'og:image',
    name: 'og:image',
    content: process.env.SOCIAL_IMAGE_LINK,
  });

  head.meta.push({
    key: 'twitter:description',
    name: 'twitter:description',
    content: 'Piotr Slawinski thinks you might like it',
  });

  head.meta.push({
    key: 'twitter:card',
    name: 'twitter:card',
    content: 'summary_large_image',
  });

  head.meta.push({
    key: 'twitter:image',
    name: 'twitter:image',
    content: process.env.SOCIAL_IMAGE_LINK,
  });

  router.beforeEach((to, _from, next) => {
    head.meta.push({
      key: 'og:url',
      name: 'og:url',
      content: `https://slawinski.dev${to.path}`,
    });
    next();
  });
}
