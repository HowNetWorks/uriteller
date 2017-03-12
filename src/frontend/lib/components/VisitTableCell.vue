<template>
  <td :class="[name, { 'no-content': noContent }]">
    <span class="cell-header">{{ header }}</span>
    <span class="cell-content">
      <slot />
    </span>
  </td>
</template>

<script>
export default {
  props: ["header", "name"],

  computed: {
    noContent() {
      return false;
    }
  }
};
</script>
