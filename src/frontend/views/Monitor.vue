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
import url from "url";
import VisitTable from "../components/VisitTable.vue";
import CopyButton from "../components/CopyButton.vue";

function byTimestampDescending(left, right) {
  if (left.timestamp === right.timestamp) {
    return 0;
  }
  return left.timestamp < right.timestamp ? 1 : -1;
}

function timeout(delay) {
  return new Promise(resolve => {
    setTimeout(resolve, delay);
  });
}

class ConnectionFailed extends Error {}
class RequestFailed extends Error {}
class ParsingFailed extends Error {}
class Timeout extends Error {}

function fetchJSON(url, timeout=15000) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.timeout = timeout;

    xhr.addEventListener("load", () => {
      if (xhr.status !== 200) {
        return reject(new RequestFailed(`status ${xhr.status} (${xhr.statusText})`));
      }

      const response = xhr.response;
      let json;
      try {
        json = JSON.parse(response);
      } catch (err) {
        return reject(new ParsingFailed("parsing the request response failed"));
      }
      resolve(json);
    }, false);

    xhr.addEventListener("error", () => {
      reject(new ConnectionFailed("connection failed"));
    }, false);

    xhr.addEventListener("timeout", () => {
      reject(new Timeout("timeout"));
    }, false);

    xhr.send();
  });
}

function fetchUpdates(baseUrl, cursor, interval, minInterval, maxInterval, currentErr, callback) {
  const parsedUrl = url.parse(baseUrl, true);
  parsedUrl.query.cursor = cursor;

  const updateUrl = url.format(parsedUrl);
  timeout(interval)
    .then(() => fetchJSON(updateUrl))
    .then(
      json => {
        const visits = json.visits;
        if (currentErr || visits.length > 0) {
          callback(null, visits);
        }
        fetchUpdates(baseUrl, json.cursor, minInterval, minInterval, maxInterval, null, callback);
      },
      err => {
        if (!currentErr || String(currentErr) !== String(err)) {
          callback(err, null);
        }
        const newInterval = Math.min(interval * 2, maxInterval);
        fetchUpdates(baseUrl, cursor, newInterval, minInterval, maxInterval, err, callback);
      }
    );
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

    fetchUpdates(baseUrl, cursor, minInterval, minInterval, maxInterval, null, (err, visits) => {
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
