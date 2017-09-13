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

function fetchLoop(baseUrl, cursor, interval, minInterval, maxInterval, currentErr, callback) {
  const a = document.createElement("a");
  a.href = baseUrl;
  a.search = typeof cursor === "undefined" ? "" : `cursor=${cursor}`;

  const updateUrl = a.href;
  timeout(interval)
    .then(() => fetchJSON(updateUrl))
    .then(
      json => {
        const visits = json.visits;
        if (currentErr || visits.length > 0) {
          callback(null, visits);
        }
        fetchLoop(baseUrl, json.cursor, minInterval, minInterval, maxInterval, null, callback);
      },
      err => {
        if (!currentErr || String(currentErr) !== String(err)) {
          callback(err, null);
        }
        const newInterval = Math.min(interval * 2, maxInterval);
        fetchLoop(baseUrl, cursor, newInterval, minInterval, maxInterval, err, callback);
      }
    );
}

export default function(baseUrl, cursor, minInterval, maxInterval, callback) {
  fetchLoop(baseUrl, cursor, minInterval, minInterval, maxInterval, null, callback);
}
