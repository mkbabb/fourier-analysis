<script setup lang="ts">
import MathBlock from "./MathBlock.vue";
import MathInline from "./MathInline.vue";
import PaperSection from "./PaperSection.vue";
import Theorem from "./Theorem.vue";
import { ArrowRight } from "lucide-vue-next";
import { paperSections } from "@/lib/paperContent";
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { useKatex } from "@/composables/useKatex";

const { renderInline } = useKatex();

/** Render inline $...$ LaTeX within a plain text string to HTML */
function renderParagraph(text: string): string {
    return text.replace(/\$([^$]+)\$/g, (_, tex) => {
        return `<span class="math-inline">${renderInline(tex)}</span>`;
    });
}

const sections = computed(() => paperSections);

// ── Scroll-tracked active section ──────────────────────────
const activeSection = ref<string | null>(paperSections[0]?.id ?? null);
let observer: IntersectionObserver | null = null;
const sectionVisibility = new Map<string, boolean>();

function updateActive() {
    // Pick topmost visible section
    for (const s of paperSections) {
        if (sectionVisibility.get(s.id)) {
            activeSection.value = s.id;
            return;
        }
    }
}

onMounted(() => {
    observer = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                const id = (entry.target as HTMLElement).id;
                sectionVisibility.set(id, entry.isIntersecting);
            }
            updateActive();
        },
        { rootMargin: "-20% 0px -60% 0px", threshold: 0 },
    );

    nextTick(() => {
        for (const s of paperSections) {
            const el = document.getElementById(s.id);
            if (el) observer!.observe(el);
        }
    });
});

onUnmounted(() => {
    observer?.disconnect();
});

// Scroll sidebar active item into view
function scrollToSection(id: string) {
    const el = document.getElementById(id);
    if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}
</script>

<template>
    <div class="paper-layout mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <div class="paper-grid">
            <!-- Desktop sidebar TOC -->
            <aside class="paper-sidebar">
                <nav class="sidebar-nav">
                    <p class="sidebar-label cm-serif">Contents</p>
                    <ol class="sidebar-list">
                        <li v-for="section in sections" :key="section.id">
                            <button
                                @click="scrollToSection(section.id)"
                                class="sidebar-link cm-serif"
                                :class="{ 'is-active': activeSection === section.id }"
                            >
                                <span class="sidebar-number fira-code">{{ section.number }}.</span>
                                {{ section.title }}
                            </button>
                        </li>
                    </ol>
                </nav>
            </aside>

            <!-- Main article -->
            <article class="paper-article leading-relaxed animate-fade-in">
                <!-- Title block -->
                <header class="mb-20 text-center">
                    <h1
                        class="cm-serif text-4xl font-bold tracking-tight sm:text-5xl md:text-[3.25rem] depth-text leading-[1.15]"
                    >
                        An Introduction to<br />Fourier Analysis
                    </h1>
                    <p class="mt-5 text-lg tracking-wide text-muted-foreground cm-serif" style="font-variant: small-caps;">
                        From Heat Equations to Epicycles — An Interactive Companion
                    </p>
                </header>

                <!-- Mobile-only inline TOC -->
                <nav class="mb-14 cm-serif text-sm text-muted-foreground lg:hidden">
                    <ol class="list-none space-y-1.5 pl-0">
                        <li v-for="section in sections" :key="section.id">
                            <a :href="'#' + section.id" class="hover:text-foreground transition-colors duration-150">
                                {{ section.number }}. {{ section.title }}
                            </a>
                        </li>
                    </ol>
                </nav>

                <!-- Dynamic sections from paperContent.ts -->
                <PaperSection
                    v-for="section in sections"
                    :key="section.id"
                    :id="section.id"
                    :number="section.number"
                    :title="section.title"
                >
                    <!-- Paragraphs with inline math -->
                    <p
                        v-for="(para, pi) in section.paragraphs"
                        :key="pi"
                        :class="{ 'mt-4': pi > 0 }"
                        v-html="renderParagraph(para)"
                    />

                    <!-- Theorems -->
                    <template v-if="section.theorems">
                        <Theorem
                            v-for="(thm, ti) in section.theorems"
                            :key="ti"
                            :type="thm.type"
                            :name="thm.name"
                        >
                            <p v-html="renderParagraph(thm.body)" />
                            <MathBlock
                                v-for="(eq, ei) in thm.math"
                                :key="ei"
                                :tex="eq"
                            />
                        </Theorem>
                    </template>

                    <!-- Interactive callout -->
                    <div v-if="section.callout" class="interactive-callout">
                        <p class="font-medium text-foreground mb-2">Interactive: {{ section.callout.text }}</p>
                        <router-link
                            :to="section.callout.link"
                            class="inline-flex items-center gap-1.5 text-sm text-primary hover:underline transition-colors"
                        >
                            Open in Visualize tab
                            <ArrowRight class="h-3.5 w-3.5" />
                        </router-link>
                    </div>
                </PaperSection>
            </article>
        </div>
    </div>
</template>

<style scoped>
.paper-article {
    font-feature-settings: "liga", "kern";
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    hyphens: auto;
    max-width: 48rem; /* prose width */
}

/* ── Grid layout ────────────────────────────────────────── */
.paper-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
}

@media (min-width: 1024px) {
    .paper-grid {
        grid-template-columns: 200px 1fr;
        gap: 3rem;
    }
}

/* ── Desktop sidebar ────────────────────────────────────── */
.paper-sidebar {
    display: none;
}

@media (min-width: 1024px) {
    .paper-sidebar {
        display: block;
    }
}

.sidebar-nav {
    position: sticky;
    top: 5rem; /* below app header */
    max-height: calc(100vh - 7rem);
    overflow-y: auto;
    padding: 0.75rem 0;
}

.sidebar-label {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: hsl(var(--muted-foreground) / 0.6);
    padding: 0 0.75rem;
    margin-bottom: 0.75rem;
}

.sidebar-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
}

.sidebar-link {
    display: block;
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.8125rem;
    line-height: 1.45;
    padding: 0.375rem 0.75rem;
    border-radius: calc(var(--radius) - 2px);
    color: hsl(var(--muted-foreground));
    transition: color 0.15s ease, background-color 0.15s ease;
}

.sidebar-link:hover {
    color: hsl(var(--foreground));
    background: hsl(var(--muted) / 0.5);
}

.sidebar-link.is-active {
    color: hsl(var(--foreground));
    background: hsl(var(--muted));
    font-weight: 500;
}

.sidebar-number {
    font-size: 0.6875rem;
    margin-right: 0.25rem;
    opacity: 0.5;
}

.sidebar-link.is-active .sidebar-number {
    opacity: 0.7;
}

/* ── Interactive callout cards ──────────────────────────── */
.interactive-callout {
    margin: 2rem 0;
    padding: 1.25rem 1.5rem;
    border-radius: var(--radius);
    border: 1px solid hsl(var(--border));
    background: hsl(var(--card));
    text-align: center;
    font-size: 0.875rem;
    color: hsl(var(--muted-foreground));
    transition: transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1),
                box-shadow 0.3s cubic-bezier(0.25, 0.1, 0.25, 1),
                border-color 0.3s ease;
}

.interactive-callout:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.05);
    border-color: hsl(var(--primary) / 0.2);
}

:deep(.dark) .interactive-callout:hover {
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}
</style>
