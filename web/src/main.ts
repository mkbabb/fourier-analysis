import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import { router } from "./router";
import { installVizColors } from "./lib/colors";
import { sunMoonShapesReady } from "./lib/sun-moon-shapes";
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

// X·OD19 ALL — the header toggle's sun and moon load in parallel with the
// route's chunk (`lib/sun-moon-shapes.ts`); the app mounts once both have
// landed. A shape chunk that cannot load stops the boot exactly as it did when
// the shapes were part of the entry chunk.
Promise.all([router.isReady(), sunMoonShapesReady]).then(() => app.mount("#app"));
