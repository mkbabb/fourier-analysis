import { describe, expect, it } from "vitest";
import { effectScope, ref } from "vue";
import { provideDockProgress, useDockProgress } from "./useDockProgress";
import { providePageTools, usePageTools } from "./usePageTools";

describe("the page's state for the app dock", () => {
    it("a page's measure reaches the dock's rim and is released with its scope", () => {
        const rim = useDockProgress();
        expect(rim.value).toBeNull();
        const value = ref<number | null>(0.25);
        const scope = effectScope();
        scope.run(() => provideDockProgress(value));
        expect(rim.value).toBe(0.25);
        value.value = 0.8;
        expect(rim.value).toBe(0.8);
        scope.stop();
        expect(rim.value).toBeNull();
    });

    it("a later page's measure is not released by an earlier page's teardown", () => {
        const rim = useDockProgress();
        const first = effectScope();
        first.run(() => provideDockProgress(ref(0.1)));
        const second = effectScope();
        second.run(() => provideDockProgress(ref(0.6)));
        first.stop();
        expect(rim.value).toBe(0.6);
        second.stop();
        expect(rim.value).toBeNull();
    });

    it("a page's tools are declared once, with no condition, and leave with the page", () => {
        const tools = usePageTools();
        const scope = effectScope();
        scope.run(() => providePageTools("Equation tools", () => null));
        expect(tools.value?.label).toBe("Equation tools");
        expect(Object.keys(tools.value ?? {}).sort()).toEqual(["label", "owner", "render"]);
        scope.stop();
        expect(tools.value).toBeNull();
    });
});
