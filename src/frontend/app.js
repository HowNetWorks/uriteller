import Vue from "vue";
import App from "./App.vue";
import Index from "./views/Index.vue";
import Trap from "./views/Trap.vue";
import Monitor from "./views/Monitor.vue";

Vue.component("app", App);
Vue.config.productionTip = false;

const views = new Map();
views.set("index", Index);
views.set("trap", Trap);
views.set("monitor", Monitor);

export default function(name, data) {
  const view = views.get(name);
  if (!view) {
    throw new Error("unknown view");
  }

  const vm = new Vue(view);
  if (vm.setData) {
    return Promise.resolve(vm.setData(data)).then(() => vm);
  }
  return Promise.resolve(vm);
}
