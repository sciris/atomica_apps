<template>
  <div class="moving-arrow" :style="arrowStyle">
  </div>
</template>
<script>
  export default {
    props: {
      moveY: {
        type: Number,
        default: 0
      }
    },
    computed: {
      /**
       * Styles to animate the arrow
       * @returns {{transform: string}}
       */
      arrowStyle () {
        return {
          transform: `translate3d(0px, ${this.moveY}px, 0px)`
        }
      }
    }
  }

</script>
