// This is the main.js file. Import global CSS and scripts here.
// The Client API can be used here. Learn more: gridsome.org/docs/client-api

require('~/main.css')
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
}
