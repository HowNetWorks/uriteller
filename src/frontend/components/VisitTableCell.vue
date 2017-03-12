<template>
  <td :class="[name, { 'no-content': noContent() }]">
    <span class="cell-header">{{ header }}</span>
    <span class="cell-content">
      <slot />
    </span>
  </td>
</template>

<script>
export default {
  props: ["header", "name"],

  methods: {
    noContent() {
      const slot = this.$slots.default;
      return !slot || slot.length === 0;
    }
  }
};
</script>
