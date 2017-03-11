import net from "net";
import dns from "dns";
import ipAddress from "ip-address";

const OK_DNS_ERRORS = new Set([dns.NODATA, dns.NOTFOUND]);

export function reverse(ip) {
  if (!net.isIP(ip)) {
    return Promise.resolve([]);
  }

  return new Promise((resolve, reject) => {
    dns.reverse(ip, (err, hostnames) => {
      if (err) {
        return OK_DNS_ERRORS.has(err.code) ? resolve([]) : reject(err);
      }
      return resolve(hostnames);
    });
  });
}

export function ipToASNs(ip) {
  if (net.isIP(ip)) {
    const ipv4 = new ipAddress.Address4(ip);
    if (ipv4.isValid()) {
      return lookup(ipv4.toArray().reverse().join(".") + ".origin.asn.cymru.com");
    }

    const ipv6 = new ipAddress.Address6(ip);
    if (ipv6.isValid()) {
      return lookup(ipv6.reverseForm({ omitSuffix: true }) + ".origin6.asn.cymru.com");
    }
  }
  return Promise.resolve([]);
}

function lookup(name) {
  return lookupASNs(name).then(asns => {
    const promises = asns.map(info => {
      return lookupASNames(info.asn).then(names => {
        return { ...info, names: names };
      });
    });
    return Promise.all(promises);
  });
}

function lookupASNs(name) {
  return new Promise((resolve, reject) => {
    dns.resolveTxt(name, (err, records) => {
      if (err) {
        return OK_DNS_ERRORS.has(err.code) ? resolve([]) : reject(err);
      }

      const asns = new Map();
      records.forEach(record => {
        const fields = record.join("").split("|").map(x => x.trim());

        const asn = fields[0];
        if (!asn) {
          return;
        }
        const info = { asn: asn };

        const country = fields[2];
        if (country) {
          info.country = country;
        }
        asns.set(asn, info);
      });
      return resolve(Array.from(asns.values()));
    });
  });
}

function cleanASName(name) {
  // Remove a trailing two-character country code, if it exists. Also trim
  // away surrounding whitespace.
  return name.replace(/,\s*[A-Z]{2}\s*$/, "").trim();
}

function lookupASNames(asn) {
  return new Promise((resolve, reject) => {
    dns.resolveTxt("AS" + asn + ".asn.cymru.com", (err, records) => {
      if (err) {
        return OK_DNS_ERRORS.has(err.code) ? resolve([]) : reject(err);
      }

      const names = new Set();
      records.forEach(record => {
        const pieces = record.join("").split("|");
        if (pieces.length < 5) {
          return;
        }
        const name = cleanASName(pieces[4]);
        if (name) {
          names.add(name);
        }
      });
      return resolve(Array.from(names));
    });
  });
}
