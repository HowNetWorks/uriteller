import crypto from "crypto";
import gcloud from "./gcloud";

const datastore = gcloud.datastore();

// Return a string id with at least `n` bits of randomness. The returned string
// will contain only characters [a-zA-Z0-9_-].
function genId(n=128) {
    const bytes = crypto.randomBytes(Math.ceil(n / 8.0));
    return bytes.toString("base64").replace(/\//g, "_").replace(/\+/g, "-").replace(/=/g, "");
}

const cache = new Map();

function getSeqId(target) {
    if (cache.has(target)) {
        return Promise.resolve(cache.get(target) + 1);
    }

    return queryMaxSeqId(target).then(seqId => {
        if (seqId === null) {
            return 0;
        }
        seenSeqId(seqId);
        return seqId + 1;
    });
}

function seenSeqId(target, seqId) {
    const cached = cache.get(target);
    if (cached === undefined || cached < seqId) {
        cache.set(target, seqId);
    }
}

function queryMaxSeqId(target) {
    const query = datastore.createQuery("Visit")
        .filter("target", target)
        .filter("seqId", ">=", 0)
        .filter("seqId", "<=", Number.MAX_SAFE_INTEGER)
        .select("seqId")
        .order("seqId", {
            descending: true
        })
        .limit(1);

    return query.run()
        .then(data => data[0])
        .then(entities => {
            if (entities.length === 0) {
                return null;
            }
            return entities[0].seqId;
        });
}


function seqIdKey(target, seqId) {
    return datastore.key(["Visit", seqId + "/" + target]);
}

export function create() {
    function tryCreate(resolve, reject) {
        const trap = genId();
        const view = genId();

        const trapKey = datastore.key(["Item", trap]);
        const viewKey = datastore.key(["Item", view]);

        const transaction = datastore.transaction();
        transaction.run(err => {
            if (err) {
                return reject(err);
            }

            transaction.insert([
                {
                    key: trapKey,
                    data: {
                        isView: false,
                        other: view
                    }
                },
                {
                    key: viewKey,
                    data: {
                        isView: true,
                        other: trap
                    }
                }
            ]);
            transaction.commit(err => {
                if (err && err.code === 409) {
                    return tryCreate(resolve, reject);
                }
                if (err) {
                    return reject(err);
                }
                return resolve(view);
            });
        });
    }

    return new Promise((resolve, reject) => {
        tryCreate(resolve, reject);
    });
}

export function get(id) {
    return datastore.get(datastore.key(["Item", id]))
        .then(data => data[0] || null);
}

const visits = new Map();
const VISIT_CHUNK_COUNT = 10;

export function visit(target, timestamp, info) {
    function insert(seqId) {
        const queue = visits.get(target);
        if (!queue) {
            return;
        }

        const chunk = queue.slice(0, VISIT_CHUNK_COUNT);
        datastore.insert({
            key: seqIdKey(target, seqId),
            data: {
                target: target,
                seqId: seqId,
                visits: chunk.map(visit => visit.data)
            }
        }, err => {
            if (err && err.code === 409) {
                seenSeqId(target, seqId);
                return insert(seqId + 1);
            }

            if (err) {
                chunk.forEach(visit => visit.reject(err));
            } else {
                seenSeqId(target, seqId);
                chunk.forEach(visit => visit.resolve());
            }

            queue.splice(0, chunk.length);
            if (queue.length === 0) {
                visits.delete(target);
            }
        });
    }

    return new Promise((resolve, reject) => {
        const queue = visits.get(target) || [];
        visits.set(target, queue);
        queue.push({
            resolve: resolve,
            reject: reject,
            data: {
                timestamp: timestamp,
                info: info
            }
        });

        if (queue.length === 1) {
            getSeqId(target).then(insert);
        }
    });
}

function getSeqIds(target, seqIds) {
    if (seqIds.length === 0) {
        return Promise.resolve([]);
    }
    const keys = seqIds.map(seqId => seqIdKey(target, seqId));
    return datastore.get(keys).then(data => data[0]);
}

export function list(target, cursor=0) {
    const query = datastore.createQuery("Visit")
        .filter("target", target)
        .filter("seqId", ">=", cursor)
        .filter("seqId", "<=", Number.MAX_SAFE_INTEGER)
        .order("seqId", { descending: true });

    return query.run()
        .then(data => data[0])
        .then(entities => {
            const nextCursor = entities.reduce((previous, entity) => {
                const seqId = entity.seqId + 1;
                return seqId > previous ? seqId : previous;
            }, cursor);

            const available = new Set(entities.map(entity => entity.seqId));
            const missing = [];
            for (var i = cursor; i < nextCursor; i++) {
                if (!available.has(i)) {
                    missing.push(i);
                }
            }

            return getSeqIds(target, missing).then(newEntities => {
                return {
                    cursor: nextCursor,
                    entities: entities.concat(newEntities)
                };
            });
        })
        .then(({ cursor, entities }) => {
            const visits = [];
            entities.forEach(entity => {
                entity.visits.forEach(visit => {
                    visits.push(visit);
                });
            });

            return {
                cursor: cursor,
                visits: visits
            };
        });
}
