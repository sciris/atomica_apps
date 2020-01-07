import Vue from 'vue';
import Router from 'vue-router';
import DashboardLayout from './app/DashboardLayout.vue'
import ProjectsPage from './app/ProjectsPage.vue';
import CalibrationPage from './app/CalibrationPage.vue';
import ScenariosPage from './app/ScenariosPage.vue';
import OptimizationsPage from './app/OptimizationsPage.vue';
import AboutPage from './app/AboutPage.vue';
import HelpPage from './app/HelpPage.vue';
import ContactPage from './app/ContactPage.vue';
import FrameworksPage from './app/FrameworksPage.vue';
import NotFoundPage from './app/NotFoundPage.vue';
import { views } from '../common';
import store from './store.js'

Vue.use(Router);

const appProps = {
  logo: "static/img/cascade-logo-white.png",
  homepage: "http://cascade.tools/"
}

let router = new Router({
  routes: [
    {
      path: '/mainadmin',
      name: 'Admin',
      component: views.MainAdminPage,
    },
    {
      path: '/login',
      name: 'Login',
      component: views.LoginPage,
      props: appProps 
    },
    {
      path: '/register',
      name: 'Registration',
      component: views.RegisterPage,
      props: appProps 
    },
    {
      path: '/',
      component: DashboardLayout,
      redirect: '/projects',
      children: [
        {
          path: 'optimizations',
          name: 'Create optimizations',
          component: OptimizationsPage,
          meta: { requiresAuth: true }
        },
        {
          path: '/changepassword',
          name: 'Change password',
          component: views.ChangePasswordPage,
          meta: { requiresAuth: true }
        },
        {
          path: '/changeinfo',
          name: 'Edit account',
          component: views.UserChangeInfoPage,
          meta: { requiresAuth: true }
        },
        {
          path: 'projects',
          name: 'Manage projects',
          component: ProjectsPage,
          meta: { requiresAuth: true }
        },
        {
          path: 'frameworks',  // CASCADE-TB DIFFERENCE
          name: 'Manage frameworks',
          component: FrameworksPage
        },
        {
          path: 'calibration',
          name: 'Baseline', // CASCADE-TB DIFFERENCE
          component: CalibrationPage,
          meta: { requiresAuth: true }
        },
        {
          path: 'scenarios',
          name: 'Create scenarios',
          component: ScenariosPage,
          meta: { requiresAuth: true }
        },
        {
          path: 'help',
          name: 'Help',
          component: HelpPage,
          meta: { requiresAuth: true }
        },
        {
          path: 'contact',
          name: 'Contact',
          component: ContactPage,
          meta: { requiresAuth: true }
        },
        {
          path: 'about',
          name: 'About',
          component: AboutPage,
          meta: { requiresAuth: true }
        },
      ] 
    },
    { path: '*', component: NotFoundPage }
  ]
});

router.beforeEach((to, from, next) => {
  if(to.matched.some(record => record.meta.requiresAuth)) {
    if (store.getters.isLoggedIn) {
      next()
      return
    }
    next({
      name: "Login",
      query: { loginRequired: to.fullPath }
    })
  } else {
    next()
  }
})

export default router
