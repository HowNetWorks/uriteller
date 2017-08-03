<template>
  <span>
    <span v-if="flag" class="country-flag">{{ flag }}</span>
  </span>
</template>

<script>
import countryFlag from "../lib/country-flag";

export default {
  props: ["country"],

  computed: {
    flag() {
      return countryFlag(this.country);
    }
  }
};
</script>
