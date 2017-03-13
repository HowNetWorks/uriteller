<template>
  <app name="page-monitor">
    <div class="container">
      <section class="row trap">
        <div class="col-12">
          <h4>Monitoring visits to URL</h4>
        </div>

        <div class="col-12 col-lg-8">
          <div class="input-group trap-group">
            <input class="form-control trap-url" v-model="trapUrl" readOnly />

            <span class="input-group-btn">
              <copy-button :text="trapUrl" :disabled="serverSide" />
            </span>
          </div>
        </div>

        <div class="col-12 col-lg-4 text-justify help">
          This is your <strong>trap URL</strong>. Copy-paste it to
          your favorite messaging app, URL shortener or social network
          site. This <strong>monitor page</strong> shows who visits
          the trap.
        </div>
      </section>

      <section class="row monitor">
        <div class="col-sm-12">
          <div class="clearfix visits-header">
            <h4 class="float-left">Visits</h4>
            <div class="live-updates">
              <span v-if="serverSide" class="text-muted">live updates off</span>
              <span v-else-if="liveUpdateError" class="text-warning">live updates off</span>
              <span v-else class="text-success">live updates on</span>
            </div>
          </div>

          <div v-if="visits.length === 0" class="text-muted no-visits">No-one has visited the trap yet.</div>
          <visit-table v-else :visits="sortedVisits" />
        </div>
      </section>
    </div>
  </app>
</template>

<script>
import fetchUpdates from "../lib/fetch-updates";
import VisitTable from "../components/VisitTable.vue";
import CopyButton from "../components/CopyButton.vue";

function byTimestampDescending(left, right) {
  if (left.timestamp === right.timestamp) {
    return 0;
  }
  return left.timestamp < right.timestamp ? 1 : -1;
}

export default {
  data() {
    return {
      trapUrl: null,
      visits: [],
      cursor: null,
      liveUpdateError: null,
      serverSide: true
    };
  },

  beforeMount() {
    this.serverSide = false;
  },

  mounted() {
    const baseUrl = this.updateUrl;
    const cursor = this.cursor;
    const minInterval = 1000;
    const maxInterval = 15000;

    fetchUpdates(baseUrl, cursor, minInterval, maxInterval, (err, visits) => {
      if (err) {
        this.liveUpdateError = err;
      } else {
        this.visits = this.visits.concat(visits);
        this.liveUpdateError = null;
      }
    });
  },

  methods: {
    setState({ trapUrl, visits, cursor, updateUrl }) {
      this.trapUrl = trapUrl;
      this.visits = visits;
      this.updateUrl = updateUrl;
      this.cursor = cursor;
    }
  },

  computed: {
    sortedVisits() {
      return this.visits.slice().sort(byTimestampDescending);
    }
  },

  components: {
    "visit-table": VisitTable,
    "copy-button": CopyButton
  }
};
</script>
