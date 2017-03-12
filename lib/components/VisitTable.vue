<template>
  <table class="table table-striped">
    <thead>
      <tr>
        <th>Time</th>
        <th>IP</th>
        <th>ASN</th>
        <th>User Agent</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="visit in visits">
        <cell name="timestamp" header="Time">
          <timestamp :timestamp="visit.timestamp" />
        </cell>
        <cell name="ip" header="IP">
          <country-flag :country="visit.country" />{{ visit.ip }}
        </cell>
        <cell header="ASN">
          <span v-for="item in visit.asns">
            {{ item.asn }} {{ item.names.join() }}
          </span>
        </cell>
        <cell header="User Agent">
          {{ visit.userAgent }}
        </cell>
      </tr>
    </tbody>
  </table>
</template>

<script>
import VisitTableCell from "./VisitTableCell.vue";
import Timestamp from "./Timestamp.vue";
import CountryFlag from "./CountryFlag.vue";

export default {
  props: ["visits"],

  components: {
    "cell": VisitTableCell,
    "timestamp": Timestamp,
    "country-flag": CountryFlag
  }
};
</script>
