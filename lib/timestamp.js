const PAD_TWO = "00";
const PAD_FOUR = "0000";

function pad(number, padding) {
    const result = String(number);
    return padding.substr(result.length) + result;
}

export function formatAbsolute(timestamp) {
    const date = new Date(timestamp);
    const year = pad(date.getFullYear(), PAD_FOUR);
    const month = pad(date.getMonth() + 1, PAD_TWO);
    const day = pad(date.getDate(), PAD_TWO);
    const hour = pad(date.getHours(), PAD_TWO);
    const minute = pad(date.getMinutes(), PAD_TWO);
    const second = pad(date.getSeconds(), PAD_TWO);
    return year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second;
}

function formatSpan(delta) {
    const seconds = Math.round(delta / 1000);
    if (seconds < 45) {
        return "a few seconds";
    }
    if (seconds < 90) {
        return "a minute";
    }

    const minutes = Math.round(seconds / 60);
    if (minutes < 45) {
        return minutes + " minutes";
    }
    if (minutes < 90) {
        return "an hour";
    }

    const hours = Math.round(minutes / 60);
    if (hours < 22) {
        return hours + " hours";
    }
    if (hours < 36) {
        return "a day";
    }

    const days = Math.round(hours / 24);
    if (days < 26) {
        return days + " days";
    }
    if (days < 45) {
        return "a month";
    }
    if (days < 320) {
        return Math.round(days / 30) + " months";
    }
    if (days < 548) {
        return "a year";
    }
    return Math.round(days / 365) + " years";
}

export function formatRelative(timestamp, origin=Date.now()) {
    // Return a relatively formatted time. The implementation aims to follow the
    // formatting described in the documentation of Moment.js 2.15.1. See
    // https://momentjs.com/docs/#/displaying/fromnow/ and
    // https://momentjs.com/docs/#/displaying/tonow/

    if (timestamp > origin) {
        return "in " + formatSpan(timestamp - origin);
    }
    return formatSpan(origin - timestamp) + " ago";
}
