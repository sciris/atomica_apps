import LoginPage from './views/LoginPage.vue';
import ChangePasswordPage from './views/ChangePasswordPage.vue';
import MainAdminPage from './views/MainAdminPage.vue';
import RegisterPage from './views/RegisterPage.vue';
import UserChangeInfoPage from './views/UserChangeInfoPage.vue';

import EventBus from './eventbus.js';
import NavigationPlugin from './plugins/navigation/index.js';
import HelpLink from './plugins/help/HelpLink.vue';
import THSortable from './plugins/sortable/THSortable.vue';

import { events } from './eventbus.js';

import Simplert from 'vue2-simplert-plugin';
import { directive as vClickOutside } from 'vue-clickaway';
import _ from 'lodash';

import utils from './utils.js';

require('vue2-simplert-plugin/dist/vue2-simplert-plugin.css')

require("bootstrap");

import mixins from "./mixins/index.js";

function install(Vue, options={}) {

  Object.defineProperty(Vue.prototype, '$_', { value: _ });

  Object.defineProperty(Vue.prototype, '$sciris', { value: options.sciris });

  Vue.use(Simplert);

  if (!options.navigation){
    options.navigation = {}
  }

  let navigationOptions = options.navigation.options || {};
  if (!navigationOptions.disabled){
    Vue.use(NavigationPlugin, navigationOptions);
  }
  Vue.component('help', HelpLink);
  Vue.component('th-sortable', THSortable);

  let afterLoginPath = options.afterLoginPath || "/"; 
  let afterPasswordChangePath = options.afterPasswordChangePath || "/"; 
  let afterRegistrationPath = options.afterRegistrationPath || "/login"; 
  let afterLogoutPath = options.afterLogoutPath || "/login"; 

  EventBus.$on(events.EVENT_LOGIN_SUCCESS, (user) => {
    options.router.push(afterLoginPath); 
  });

  EventBus.$on(events.EVENT_LOGOUT_SUCCESS, (user) => {
    options.router.push(afterLogoutPath); 
  });

  EventBus.$on(events.EVENT_REGISTER_SUCCESS, () => {
      setTimeout(function() {
        options.router.push(afterRegistrationPath)
      }, 1000); // Navigate automatically to the login page after a delay
  });

  EventBus.$on(events.EVENT_PASSWORD_CHANGE_SUCCESS, (user) => {
    options.router.push(afterPasswordChangePath);
  });
};

// Automatic installation if Vue has been added to the global scope.
if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.use({install})
}

export default {
  install
}

const views = {
  LoginPage,
  ChangePasswordPage,
  MainAdminPage,
  RegisterPage,
  UserChangeInfoPage
} 

export {
  EventBus,
  events,
  utils,
  views, 
  mixins
}
