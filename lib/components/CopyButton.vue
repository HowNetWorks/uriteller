<template>
  <button class="btn btn-primary" @click="click" :disabled="disabled">
    copy
  </button>
</template>

<script>
import copyToClipboard from "../copy-to-clipboard";

export default {
  props: ["text", "disabled"],

  methods: {
    click() {
      copyToClipboard(this.text);
    }
  }
};
</script>
