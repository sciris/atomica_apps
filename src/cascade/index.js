import Vue from 'vue';
import './styles/index.scss';
import router from './router.js'
import store from './store.js'
import sciris from 'sciris-js';
import App from './app/App.vue';
import common from '../common';

Vue.prototype.$toolName = 'cascade'

Vue.use(sciris.ScirisVue, {
  progressbar: {
    options: {
      color: "#00267a"
    }
  }
});

Vue.use(common, {
	router: router,
  sciris: sciris
});

new Vue({
  el: '#app',
  router: router,
  store: store,
  render: h => h(App),
})
