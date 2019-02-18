<!--
Definition of top navigation bar

Last update: 2018sep23

-->

<template>
  <nav class="navbar navbar-light navbar-default">
    <a v-if="logo" 
      class="navbar-brand" 
      target="_blank"
      :href="homepage">
        <img height="50px" vertical-align="middle" :src="logo">
    </a>
    <span v-if="!hideRouteName" class="navabar-route-name">{{routeName}}</span>
    <button type="button" 
      class="navbar-toggle" 
      :class="{toggled: $sidebar.showSidebar}" 
      @click="toggleSidebar">
        <span class="sr-only">Toggle navigation</span>
        <span class="icon-bar bar1"></span>
        <span class="icon-bar bar2"></span>
        <span class="icon-bar bar3"></span>
    </button>
    <ul class="navbar-nav ml-auto collapse show">
        <li v-for="link in links" class="nav-item">
          <router-link 
            class="nav-link"
            :to="link.path">
              <span>{{ link.name }}</span>
          </router-link>
        </li>
    </ul>
    <ul class="nav navbar-nav ml-auto collapse show">
      <li class="nav-item nav-item-static">
        <div class="nav-link">
          <i class="ti-view-grid"></i>
          <span>Project: {{ activeProjectName }}</span>
        </div>
      </li>
      <li class="nav-item nav-item-static">
        <dropdown v-bind:title="activeUserName" icon="ti-user dropdown-icon">
          <li><a href="#/changeinfo"><i class="ti-pencil"></i>&nbsp;&nbsp;Edit account</a></li>
          <li><a href="#/changepassword"><i class="ti-key"></i>&nbsp;&nbsp;Change password</a></li>
          <li><a href="#/help"><i class="ti-help"></i>&nbsp;&nbsp;Help</a></li>
          <li><a href="#/about"><i class="ti-shine"></i>&nbsp;&nbsp;About</a></li>
          <li><a href="#" v-on:click=logOut()><i class="ti-car"></i>&nbsp;&nbsp;Log out</a></li>
        </dropdown>
      </li>
    </ul>
  </nav>
</template>

<script>
  import EventBus from '../../eventbus.js'; 
  import { events } from '../../eventbus.js'; 

  export default {
    name: 'Navbar',

    props: {
      links: {
        type: Array,
        default: () => []
      },
      homepage: {
        type: String,
        default: ""
      },
      logo: {
        type: String,
        default: ""
      },
      showRouteName: {
        type: String,
        default: "hide" 
      }
    },

    // Health prior function
    data() {
      return {
        activePage: 'manage projects'
      }
    },

    computed: {
      // Health prior function
      hideRouteName(){
        if(this.showRouteName == "hide"){
          return true 
        } else {
          return false 
        }
      },
      currentUser(){
        return this.$store.state.currentUser
      },

      activeProjectName() {
        console.log(this.links);
        if (this.$store.state.activeProject.project === undefined) {
          return 'none'
        } else {
          return this.$store.state.activeProject.project.name
        }
      },

      activeUserName() {
        // Get the active user name -- the display name if defined; else the user name
        var username = this.$store.state.currentUser.username;
        var dispname = this.$store.state.currentUser.displayname;
        var userlabel = '';
        if (dispname === undefined || dispname === '') {
          userlabel = username;
        } else {
          userlabel = dispname;
        }
        return 'User: '+userlabel
      },

      // Theme function
      routeName () {
        const route_name = this.$route.name
        return this.capitalizeFirstLetter(route_name)
      },
    },

    // Health prior function
    created() {
      this.$sciris.getUserInfo(this.$store)
    },

    // Theme function
    data () {
      return {
        activeNotifications: false
      }
    },
    methods: {
      // Health prior functions
      checkLoggedIn() {
        this.$sciris.checkLoggedIn
      },

      checkAdminLoggedIn() {
        this.$sciris.checkAdminLoggedIn
      },

      logOut() {
        this.$sciris.logoutCall()
        .then(response => {
          // Update the user info.
          this.$sciris.getUserInfo(this.$store)

          // Clear out the active project.
          this.$store.commit('newActiveProject', {})

          // Navigate to the login page automatically.
          EventBus.$emit(events.EVENT_LOGOUT_SUCCESS); 
        })
      },

      // Theme functions
      capitalizeFirstLetter (string) {
        return string.charAt(0).toUpperCase() + string.slice(1)
      },

      toggleNotificationDropDown () {
        this.activeNotifications = !this.activeNotifications
      },

      closeDropDown () {
        this.activeNotifications = false
      },

      toggleSidebar () {
        this.$sidebar.displaySidebar(!this.$sidebar.showSidebar)
      },

      hideSidebar () {
        this.$sidebar.displaySidebar(false)
      }
    }
  }

</script>
