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
import NotFoundPage from './app/NotFoundPage.vue';
import { views } from '../common';

Vue.use(Router);

const appProps = {
  logo: "static/img/optima-inverted-logo-tb.png",
  homepage: "http://ocds.co" 
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
          component: OptimizationsPage
        },
        {
          path: '/changepassword',
          name: 'Change password',
          component: views.ChangePasswordPage,
        }, {
          path: '/changeinfo',
          name: 'Edit account',
          component: views.UserChangeInfoPage,
        },
        {
          path: 'projects',
          name: 'Manage projects',
          component: ProjectsPage
        },
        {
          path: 'calibration',
          name: 'Calibration', // CASCADE-TB DIFFERENCE
          component: CalibrationPage
        },
        {
          path: 'scenarios',
          name: 'Create scenarios',
          component: ScenariosPage
        },
        {
          path: 'help',
          name: 'Help',
          component: HelpPage
        },
        {
          path: 'contact',
          name: 'Contact',
          component: ContactPage
        },
        {
          path: 'about',
          name: 'About',
          component: AboutPage
        },
      ] 
    },
    { path: '*', component: NotFoundPage }
  ]
});

export default router
