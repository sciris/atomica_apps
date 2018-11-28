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
import { views } from 'sciris-uikit';

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
          path: 'frameworks',  // CASCADE-TB DIFFERENCE
          name: 'Manage frameworks',
          component: FrameworksPage
        },
        {
          path: 'calibration',
          name: 'Baseline', // CASCADE-TB DIFFERENCE
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
