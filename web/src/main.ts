import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import { router } from "./router";
import { installVizColors } from "./lib/colors";
import "katex/dist/katex.min.css";
import "./style.css";

const app = createApp(App);
app.use(createPinia());
app.use(router);

// The palette is resolved before the first component mounts. A root `onMounted`
// fires AFTER every child's, so a child reading `VIZ_COLORS` while it mounts
// would win the race and paint the authored fallback instead of the cascade's
// colour.
installVizColors();

router.isReady().then(() => app.mount("#app"));
