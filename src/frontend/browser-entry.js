import app from "./app";

const element = document.getElementById("initial-state");

let state = {};
if (element) {
  state = JSON.parse(element.innerHTML);
}

const { view, data } = state;
app(view, data).then(vm => vm.$mount("#app"));
