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
}
