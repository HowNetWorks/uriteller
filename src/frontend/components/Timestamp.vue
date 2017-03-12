<template>
  <span>
    <span class="absolute">{{ absolute }}</span>
    <span class="relative">{{ relative() }}</span>
  </span>
</template>

<script>
import { formatAbsolute, formatRelative } from "../timestamp";

export default {
  props: ["timestamp"],

  created() {
    this._interval = null;
  },

  mounted() {
    this._interval = setInterval(() => {
      this.$forceUpdate();
    }, 5000);
  },

  beforeDestroy() {
    clearInterval(this._interval);
    this._interval = null;
  },

  methods: {
    relative() {
      return formatRelative(this.timestamp);
    }
  },

  computed: {
    absolute() {
      return formatAbsolute(this.timestamp);
    }
  }
};
</script>
