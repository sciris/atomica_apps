import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

const persist = store => {
  store.subscribe((mutation, state) => {
    if (mutation.type !== 'loadStorage'){
      try {
        sessionStorage.setItem('appdata', JSON.stringify(state));
      } catch (e) {
      }
    } else {
      console.log('Loading storage')
      try {
        let storage = sessionStorage.getItem('appdata') || false;
        if (storage) {
          storage = JSON.parse(storage);
          store.commit('newUser', storage.currentUser);
          store.commit('newActiveProject', storage.activeProject);
        }
      } catch (e) {
      }
    }
  });
};


const store = new Vuex.Store({
  state: {
    currentUser: {},
    activeProject: null,
    helpLinks: {
      baseURL: 'https://docs.google.com/document/d/1UGcq-UDQKBsdmPAyYBDsxvOERI-gNF3usSrYrP16tnw/edit#heading=',
      linkMap: {
        'create-projects': 'h.mok29y1bw52s',
        'manage-projects': 'h.3whwml4',
        'databook-entry': 'h.jf0nllvvnrhi',
        'progbook-entry': 'h.ruemc46utk6q',
        'bl-overview': 'h.25b2l0r',
        'parameter-sets': 'h.kgcv8k',
        'automatic-calibration': 'h.34g0dwd',
        'manual-calibration': 'h.1jlao46',
        'reconciliation': 'h.3mzq4wv',
        'bl-results': 'h.43ky6rz',
        'define-scenarios': 'h.ijl90xrsiqu2',
        'sc-results': 'h.3ep43zb',
        'define-optimizations': 'h.1tuee74',
        'op-results': 'h.36ei31r'
      }
    },
    sidebarLinks: [
      {
        name: 'Projects',
        icon: 'ti-view-grid',
        path: '/projects'
      },
      {
        name: 'Calibration', // CASCADE-TB DIFFERENCE
        icon: 'ti-ruler-alt-2',
        path: '/calibration'
      },
      {
        name: 'Scenarios',
        icon: 'ti-control-shuffle',
        path: '/scenarios'
      },
      {
        name: 'Optimizations',
        icon: 'ti-stats-up',
        path: '/optimizations'
      },
      {
        name: 'Help',
        icon: 'ti-help',
        path: '/help'
      },
      {
        name: 'Contact',
        icon: 'ti-comment-alt',
        path: '/contact'
      },
      {
        name: 'About',
        icon: 'ti-shine',
        path: '/about'
      },
    ],
    navbarLinks: [
      {
        name: 'Projects',
        path: '/projects'
      },
      {
        name: 'Calibration', // CASCADE-TB DIFFERENCE
        path: '/calibration'
      },
      {
        name: 'Scenarios',
        path: '/scenarios'
      },
      {
        name: 'Optimizations',
        path: '/optimizations'
      }
    ],
  },
  plugins: [persist],
  mutations: {
    loadStorage(state) {
    },
    newUser(state, user) {
      state.currentUser = user
    },
    newActiveProject(state, project) {
      state.activeProject = project
    }
  },
  getters: {
    isLoggedIn: state => state.currentUser.displayname !== undefined,
    projectOpen: state => state.activeProject !== null,
  },
});

// Comment out line below to quickly disable persistent storage
store.commit('loadStorage');

export default store
