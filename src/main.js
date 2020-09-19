// This is the main.js file. Import global CSS and scripts here.
// The Client API can be used here. Learn more: gridsome.org/docs/client-api

import DefaultLayout from '~/layouts/Default.vue';
import Vuex from 'vuex';
import axios from 'axios';

require('typeface-public-sans');
require('typeface-pt-sans');

export default function (Vue, { router, head, isClient, appOptions }) {
  // Set default layout as a global component
  Vue.component('Layout', DefaultLayout);

  // Add attributes to HTML tag
  head.htmlAttrs = { lang: 'en' };

  // Add attributes to BODY tag
  head.bodyAttrs = { class: 'bg-background leading-normal' };

  // Add Vuex store to the Vue instance
  Vue.use(Vuex);

  appOptions.store = new Vuex.Store({
    state: {
      button: 'Submit',
    },
    actions: {
      submit({ commit }, payload) {
        commit('SET_SUBMITTING');
        setTimeout(async () => {
          try {
            await axios.post(`/api/${payload.lambda}`, payload.data);
            commit('SET_SUBSCRIBED');
          } catch (err) {
            console.error(err);
            return commit('SET_ERROR');
          }
        }, 1000);
      },
    },
    mutations: {
      SET_ERROR(state) {
        state.button = 'Error!';
      },
      SET_SUBSCRIBED(state) {
        state.button = 'Submitted!';
      },
      SET_SUBMITTING(state) {
        state.button = 'Submitting...';
      },
    },
  });
}
