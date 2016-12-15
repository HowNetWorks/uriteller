import crypto from "crypto";
import gcloud from "./gcloud";

const datastore = gcloud.datastore();

// Return a string id with at least `n` bits of randomness. The returned string
// will contain only characters [a-zA-Z0-9_-].
function genPageId(n=128) {
    const bytes = crypto.randomBytes(Math.ceil(n / 8.0));
    return bytes.toString("base64").replace(/\//g, "_").replace(/\+/g, "-").replace(/=/g, "");
}

const pageIdCache = new Map();

export function get(id) {
    if (pageIdCache.has(id)) {
        return Promise.resolve(pageIdCache.get(id));
    }

    return datastore.get(datastore.key(["Item", id]))
        .then(data => {
            const result = data[0] || null;
            if (result !== null) {
                pageIdCache.set(id, result);
            }
            return result;
        });
}

export function create() {
    function tryCreate(resolve, reject) {
        const trapId = genPageId();
        const viewId = genPageId();

        const trapKey = datastore.key(["Item", trapId]);
        const viewKey = datastore.key(["Item", viewId]);

        const transaction = datastore.transaction();
        transaction.run(err => {
            if (err) {
                return reject(err);
            }

            const trapData = {
                isView: false,
                other: viewId
            };
            const viewData = {
                isView: true,
                other: trapId
            };

            transaction.insert([
                {
                    key: trapKey,
                    data: trapData
                },
                {
                    key: viewKey,
                    data: viewData
                }
            ]);
            transaction.commit(err => {
                if (err && err.code === 409) {
                    return tryCreate(resolve, reject);
                }
                if (err) {
                    return reject(err);
                }
                pageIdCache.set(trapId, trapData);
                pageIdCache.set(viewId, viewData);
                return resolve(viewId);
            });
        });
    }

    return new Promise((resolve, reject) => {
        tryCreate(resolve, reject);
    });
}

const seqIdCache = new Map();

function getSeqId(target) {
    if (seqIdCache.has(target)) {
        return Promise.resolve(seqIdCache.get(target) + 1);
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
    const cached = seqIdCache.get(target);
    if (cached === undefined || cached < seqId) {
        seqIdCache.set(target, seqId);
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
            } else {
                getSeqId(target).then(insert);
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
