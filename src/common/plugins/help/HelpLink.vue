<!--
HelpLink component

Last update: 2018-08-23
-->

<template>
  <span>
      <div v-if="label!==''" class="helplink-label">{{ label }}</div> 
      <button class="btn __blue small-button btn-helplink" @click="openLink(reflink)" data-tooltip="Help">
        <i class="ti-help"></i>
      </button>
  </span>
</template>

<script>
  export default {
    name: 'help',
    
    props: {
      reflink: {
        type: String,
        default: ''
      }, 

      label: {
        type: String,
        default: ''
      },
    },

    data() {
      return {
        baseURL: this.$store.state.helpLinks.baseURL,
        linkMap: this.$store.state.helpLinks.linkMap,
      }
    },

    methods: {
      openLink(linkKey) {
        // Build the full link from the base URL and the specific link info.
        let fullLink = this.baseURL + this.linkMap[linkKey]
        
        // Set the parameters for a new browser window.
        let scrh = screen.height
        let scrw = screen.width
        let h = scrh * 0.8  // Height of window
        let w = scrw * 0.6  // Width of window
        let t = scrh * 0.1  // Position from top of screen -- centered
        let l = scrw * 0.37 // Position from left of screen -- almost all the way right

        // Open a new browser window.        
        let newWindow = window.open(fullLink, 
          'Reference manual', 'width=' + w + ', height=' + h + ', top=' + t + ',left=' + l)
          
        // If the main browser window is in focus, cause the new window to come into focus.
        if (window.focus) {
          newWindow.focus()
        }        
      }
    }
  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
.btn-helplink {
  padding: 4px 4px 2px 2px;
  margin-bottom: 5px;
}
.helplink-label {
  display:inline-block; 
  font-size:1.4em; 
  margin: 0px 5px 10px 0px;
}
</style>
