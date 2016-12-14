if (!process.env.GCLOUD_PROJECT) {
    process.env.GCLOUD_PROJECT = process.env.GAE_LONG_APP_ID;
}

export const errors = require("@google/cloud-errors").start();

if (process.env.NODE_ENV === "production") {
    require("@google/cloud-trace").start();
}

export default require("google-cloud")({
    projectId: process.env.GCLOUD_PROJECT || process.env.GAE_LONG_APP_ID
});
