// This is the main.js file. Import global CSS and scripts here.
// The Client API can be used here. Learn more: gridsome.org/docs/client-api

import DefaultLayout from '~/layouts/Default.vue'

require('typeface-source-sans-pro')
require('typeface-source-serif-pro')
require('typeface-aileron')
require('typeface-darker-grotesque')
require('typeface-chivo')
require('typeface-public-sans')
require('typeface-pt-sans')
require('typeface-merriweather')
require('typeface-heuristica')

export default function (Vue, { router, head, isClient }) {
  // Set default layout as a global component
  Vue.component('Layout', DefaultLayout)

  // Add attributes to HTML tag
  head.htmlAttrs = { lang: 'en' }

  // Add attributes to BODY tag
  head.bodyAttrs = { class: 'bg-background leading-normal max-w-4xl mx-auto px-4' }
}
