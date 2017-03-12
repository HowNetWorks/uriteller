import app from "./app";

const { view, state } = window.__INITIAL_STATE__;
delete window.__INITIAL_STATE__;

app(view, state).then(vm => vm.$mount("#app"));
