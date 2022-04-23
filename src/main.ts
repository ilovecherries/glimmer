import { createApp } from "vue";
import { createPinia } from "pinia";
import piniaPluginPersistedState from "pinia-plugin-persistedstate";
import { PiniaSharedState } from "pinia-shared-state";

import App from "./App.vue";
import router from "./router";

const app = createApp(App);

const pinia = createPinia();
pinia.use(piniaPluginPersistedState);
pinia.use(
  PiniaSharedState({ enable: false, initialize: false, type: "native" })
);

app.use(pinia);
app.use(router);

app.mount("#app");
