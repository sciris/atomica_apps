<template>
  <th @click="updateSorting" class="sortable">
    <slot></slot>
    <span v-show="sortColumn == column && !sortReverse">
      <i class="fas fa-caret-down"></i>
    </span>
    <span v-show="sortColumn == column && sortReverse">
      <i class="fas fa-caret-up"></i>
    </span>
    <span v-show="sortColumn != column">
      <i class="fas fa-caret-up" style="visibility: hidden"></i>
    </span>
  </th>
</template>

<script>
export default {
  name: "th-sortable",
  props: {
    sortColumn: {
      type: String,
      default: 'name'
    },
    sortReverse: {
      type: Boolean,
      default: false
    },
    column: {
      type: String,
      default: 'name'
    }
  },
  methods: {
    updateSorting() {
      this.$emit("sortingUpdated", this.column);
    }
  }
}
</script>
