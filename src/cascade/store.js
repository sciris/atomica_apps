import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

const store = new Vuex.Store({
  state: {
    currentUser: {},
    activeProject: {},
    helpLinks: {
      baseURL: 'https://docs.google.com/document/d/1x4Kb3hyB8NwVziE95UhT6bXpO1uRDFxJlN8QxvrLgvg/edit#heading=', 
      linkMap: {
        'create-frameworks': 'h.8xzemda17sn7',
        'manage-frameworks': 'h.kjfpissnw4v8',
        'create-projects': 'h.wohgolfxe9ko',
        'manage-projects': 'h.fcnvzbrouon2',
        'bl-overview': 'h.e5er3h94vkjk',
        'parameter-sets': 'h.ofwmxbimr7i',
        'automatic-calibration': 'h.81g1j4y0hcp1',
        'manual-calibration': 'h.da77fbanyz1n',
        'reconciliation': 'h.ojtskhsm6lx9',
        'bl-results': 'h.f2xv432x5yv',
        'define-scenarios': 'h.6u9a8cixezwv',
        'sc-results': 'h.syuxr0k2n3yy',
        'define-optimizations': 'h.9g4agtbijsjq',
        'op-results': 'h.n581zreqeowi'
      }
    },
    sidebarLinks: [
      {
        name: 'Projects',
        icon: 'ti-view-grid',
        path: '/projects'
      },
      {
        name: 'Baseline', // CASCADE-TB DIFFERENCE
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
        name: 'Frameworks',
        path: '/frameworks'
      },
      {
        name: 'Projects',
        path: '/projects'
      },
      {
        name: 'Baseline', // CASCADE-TB DIFFERENCE
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
    ]
  },
  mutations: {
    newUser(state, user) {
      state.currentUser = user
    }, 
    newActiveProject(state, project) {
      state.activeProject = project
    }
  },
});

export default store
