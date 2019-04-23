import Vue from "vue";
import Vuex from "vuex";

import story from "./story";

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    story: story
  },
  state: {
    spatialUnit: "districts",
    mapFocusBoundary: null
  },
  mutations: {
    /**
     * Initialize the state with essential map data from local storage.
     * https://www.mikestreety.co.uk/blog/vue-js-using-localstorage-with-the-vuex-store
     * TODO: Implement vuex-persistedstate if need more options
     * @param {*} context 
     */
    initializeState(context) {
      if (localStorage.getItem('store')) {
        this.replaceState(
          Object.assign(state, JSON.parse(localStorage.getItem('store')))
        )
      }
    }
  },
  actions: {}
});