import Vue from "vue";
import App from "./App.vue";
import Index from "./Index.vue";
import Trap from "./Trap.vue";
import Monitor from "./Monitor.vue";

Vue.component("app", App);
Vue.config.productionTip = false;

const views = new Map();
views.set("index", Index);
views.set("trap", Trap);
views.set("monitor", Monitor);

export default function(name, state) {
  const view = views.get(name);
  if (!view) {
    throw new Error("unknown view");
  }

  const vm = new Vue(view);
  if (vm.setState) {
    return Promise.resolve(vm.setState(state)).then(() => vm);
  }
  return Promise.resolve(vm);
}
