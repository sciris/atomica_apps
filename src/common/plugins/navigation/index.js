import Sidebar from './Sidebar.vue'
import Navbar from './Navbar.vue'

const SidebarStore = {

  showSidebar: false,

  displaySidebar (value) {
    this.showSidebar = value
  },
}

const NavigationPlugin = {

  install (Vue, options) {

    Vue.mixin({
      data () {
        return {
          sidebarStore: SidebarStore
        }
      }
    })

    Object.defineProperty(Vue.prototype, '$sidebar', {
      get () {
        return this.$root.sidebarStore
      }
    })

    Vue.component('sidebar', Sidebar)
    Vue.component('navbar', Navbar)
  }
}

export default NavigationPlugin 
