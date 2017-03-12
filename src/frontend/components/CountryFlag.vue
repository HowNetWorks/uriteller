<template>
  <span v-if="flag" class="country-flag">{{ flag }}</span>
  <span v-else></span>
</template>

<script>
import countryFlag from "../country-flag";

export default {
  props: ["country"],

  computed: {
    flag() {
      return countryFlag(this.country);
    }
  }
};
</script>
