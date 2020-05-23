// This is the main.js file. Import global CSS and scripts here.
// The Client API can be used here. Learn more: gridsome.org/docs/client-api

require('typeface-public-sans')
require('typeface-pt-sans')

import DefaultLayout from '~/layouts/Default.vue'

export default function (Vue, { router, head, isClient }) {
  // Set default layout as a global component
  Vue.component('Layout', DefaultLayout)

  // Add attributes to HTML tag
  head.htmlAttrs = { lang: 'en' }

  // Add attributes to BODY tag
  head.bodyAttrs = { class: 'bg-background leading-normal' }

  // head.meta.push({
  //   key: "og:description",
  //   name: "og:description",
  //   content: `Piotr Slawinski thinks you might like it`,
  // });

  // head.meta.push({
  //   key: "og:image",
  //   property: "og:image",
  //   content: "./assets/slawinski-dev.png" || "",
  // });

  // head.meta.push({
  //   key: "twitter:description",
  //   name: "twitter:description",
  //   content: `Piotr Slawinski thinks you might like it`,
  // });

  // head.meta.push({
  //   key: "twitter:image",
  //   name: "twitter:image",
  //   content: "./assets/slawinski-dev.png" || "",
  // });

  // router.beforeEach((to, _from, next) => {
  //   head.meta.push({
  //     key: "og:url",
  //     name: "og:url",
  //     content: process.env.GRIDSOME_BASE_PATH + to.path,
  //   });
  //   next();
  // });
}
