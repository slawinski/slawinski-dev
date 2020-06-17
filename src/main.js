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
    content: `Piotr Slawinski thinks you might like it`,
  });

  head.meta.push({
    key: 'og:image',
    name: 'og:image',
    content:
      'https://res.cloudinary.com/slawinski-dev/image/upload/w_1280,h_669,c_fill,q_auto,f_auto/w_760,c_fit,co_rgb:000000,g_south_west,x_50,y_300,l_text:arial_64_bold:Setting%20up%20a%20blog%20with%20Gridsome%20and%20Netlify%20CMS/w_760,c_fit,co_rgb:000000,g_north_west,x_50,y_400,l_text:arial_48:A%20step-by-step%20guide%20to%20create%20your%20own%20blogging%20platform%20from%20scratch/social-image_ptyaka',
  });

  head.meta.push({
    key: 'twitter:description',
    name: 'twitter:description',
    content: `Piotr Slawinski thinks you might like it`,
  });

  head.meta.push({
    key: 'twitter:card',
    name: 'twitter:card',
    content: `summary_large_image`,
  });

  router.beforeEach((to, _from, next) => {
    head.meta.push({
      key: 'og:url',
      name: 'og:url',
      content: 'https://slawinski.dev' + to.path,
    });
    next();
  });
}
