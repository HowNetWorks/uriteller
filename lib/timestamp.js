import moment from "moment";

export function formatAbsolute(timestamp) {
    return moment(timestamp).format("YYYY-MM-DD HH:mm:ss");
}

export function formatRelative(timestamp) {
    return moment(timestamp).fromNow();
}
