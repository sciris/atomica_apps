<template>
  <div :class="sidebarClasses"
       :data-background-color="backgroundColor"
       :data-active-color="activeColor">
    <!--
            Tip 1: you can change the color of the sidebar's background using: data-background-color="white | black | darkblue"
            Tip 2: you can change the color of the active button using the data-active-color="primary | info | success | warning | danger"
        -->
    <!-- -->
    <div class="sidebar-wrapper" id="style-3">
      <div class="sidebar-content">
        <div class="logo" v-if="favicon">
          <a href="#" class="simple-text">
            <div class="logo-img">
                <img :src="favicon" alt="">
            </div>
            <img :src="logo" class="logotype" :width="logoWidth" vertical-align="middle" alt>
          </a>
        </div>
        <div class="logo" v-else>
          <a href="#" class="simple-text">
              <img :src="logo" :width="logoWidth" vertical-align="middle" alt>
          </a>
        </div>

        <slot></slot>

        <ul :class="navClasses">
          <!--By default vue-router adds an active class to each route link. This way the links are colored when clicked-->
          <router-link 
            v-for="(link,index) in links" 
            tag="li" 
            class="nav-item"
            :to="link.path" 
            :ref="link.name" 
            :key="link.name + index">
              <a>
                <i :class="link.icon"></i>

                <p>{{link.name}}
                </p>
              </a>
          </router-link>
        </ul>
        <moving-arrow :move-y="arrowMovePx">

        </moving-arrow>
      </div>
    </div>
  </div>
</template>
<script>
  import MovingArrow from './MovingArrow.vue'
  export default {
    name: "Sidebar",
    props: {
      type: {
        type: String,
        default: 'sidebar',
        validator: (value) => {
          let acceptedValues = ['sidebar', 'navbar']
          return acceptedValues.indexOf(value) !== -1
        }
      },
      backgroundColor: {
        type: String,
        default: 'darkblue',
        validator: (value) => {
          let acceptedValues = ['white', 'black', 'darkblue']
          return acceptedValues.indexOf(value) !== -1
        }
      },
      activeColor: {
        type: String,
        default: 'success',
        validator: (value) => {
          let acceptedValues = ['primary', 'info', 'success', 'warning', 'danger']
          return acceptedValues.indexOf(value) !== -1
        }
      },
      favicon: {
        type: String,
        default: ""
      },
      logo: {
        type: String,
        default: ""
      },
      logoWidth: {
        type: String,
        default: "160px"
      },
      links: {
        type: Array,
        default: () => []
      }
    },
    components: {
      MovingArrow
    },
    computed: {
      sidebarClasses () {
        if (this.type === 'sidebar') {
          return 'sidebar'
        } else {
          return 'collapse navbar-collapse off-canvas-sidebar'
        }
      },
      navClasses () {
        if (this.type === 'sidebar') {
          return 'nav'
        } else {
          return 'nav navbar-nav'
        }
      },
      /**
       * Styles to animate the arrow near the current active sidebar link
       * @returns {{transform: string}}
       */
      arrowMovePx () {
        return this.linkHeight * this.activeLinkIndex
      }
    },
    data () {
      return {
        linkHeight: 50,
        activeLinkIndex: 0,

        windowWidth: 0,
        isWindows: false,
        hasAutoHeight: false
      }
    },
    methods: {
      findActiveLink () {
        this.links.find((element, index) => {
          let found = element.path === this.$route.path
          if (found) {
            this.activeLinkIndex = index
          }
          return found
        })
      }
    },
    mounted () {
      this.findActiveLink()
    },
    watch: {
      $route: function (newRoute, oldRoute) {
        this.findActiveLink()
      }
    }
  }

</script>
