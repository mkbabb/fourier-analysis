<script setup lang="ts">
import { Button } from "@mkbabb/glass-ui/button";
import { Input } from "@mkbabb/glass-ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@mkbabb/glass-ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@mkbabb/glass-ui/menu";
import { EllipsisVertical, Eraser, Search } from "@lucide/vue";

/**
 * X.F.W14V.au4 — A2-FO-L1-27: the users list's toolbar, split out of the
 * AdminUserList god module (list, search, sort, batch, pager, confirm). The
 * list owns the query and the sort; this file owns their controls.
 *
 * A2-FO-L3-1 (consumer half): at 1440 the row is one line — the search takes
 * the rest, the sort Select sits at its content width (`sm:w-auto
 * sm:flex-none`), the overflow trails. Re-measured at `a6fa84c`: one row
 * (search 1263 · sort 93 · overflow 36, all at y 164-166), so the X.F.W14U
 * UIA-F-194 move of Prune into the overflow had already cured the register's
 * three-row reading. The glass half (an inline SelectTrigger arm, so a toolbar
 * Select stops defaulting to `w-full`) is ADOPT-AT-LANDING.
 */
const query = defineModel<string>("query", { required: true });
const sort = defineModel<"newest" | "last_seen" | "entries">("sort", { required: true });

const emit = defineEmits<{ prune: [] }>();
</script>

<template>
    <!-- Search + sort + prune. X.F.W14.u — UIA-F-37: below `sm` the toolbar
         wraps and the search takes the full row (it was crushed to 68 px,
         "Se", beside a fixed 160 px Select); the Select's `h-8 w-[10rem]
         text-sm` literals are gone, so its rung and type come from the
         producer (the AA-22 note forbids the `h-*` literal). -->
    <!-- X.F.W14U.admin — UIA-F-194: the admin toolbar composition, one
         across the admin tabs (`data-admin-toolbar`): the query field(s),
         the view control, and ONE overflow menu for the global acts. Prune
         — a global, irreversible delete — is no longer a persistent peer of
         search; it sits in the overflow and still passes its confirm. -->
    <div class="flex flex-wrap items-center gap-2" data-admin-toolbar>
        <div class="relative basis-full sm:basis-0 sm:flex-1">
            <!-- FR-AUL-6 ⊕ FR-AUL-23 ⊕ FR-AUL-40 — one swap, three cures.
                 The raw `<input>` carried `outline-none` + `focus:ring-1`,
                 which annihilates the focus indicator under forced-colors:
                 the v4 forced-colors escape `.outline-hidden` is absent from
                 the build (unused), and the producer's restore block is a
                 CLOSED selector list this element was not in — while the
                 Checkbox two elements away carries `focus-ring` natively. Its
                 bare `border` drew in `currentColor` (v4 preflight resets
                 `border: 0 solid` with no colour, `.border` carries none, and
                 no base `border-color` rule exists in the stack): a near-black
                 hairline in light mode on the one field surrounded by muted
                 token edges — the classic v3→v4 casualty. And `type="text"`
                 on a machine-generated lowercase-slug datum hand-waved the
                 clear control the UA supplies for free.
                 ⊘ Census correction: the ruled cure named `./forms` → `Input`.
                 `./forms` does NOT exist at the adopted glass-ui 8.0.0 pin —
                 the export map carries `./input`, `./label`, `./labeled-field`,
                 `./search`, `./textarea`, `./number-field` in its place, and
                 the base class is `field-control glass-control-edge`, not
                 `input-pill`. Same primitive, relocated; booked in the
                 addendum. -->
            <Input
                v-model="query"
                type="search"
                size="sm"
                placeholder="Search users..."
                aria-label="Search users"
                autocapitalize="none"
                autocorrect="off"
                spellcheck="false"
                enterkeyhint="search"
                class="w-full pl-7"
            />
            <!-- X.F.W14U.admin — UIA-F-106 (consumer half): the glyph follows
                 the field in tree order. The producer's field is its own
                 stacking context (glass backdrop), so a positioned glyph
                 BEFORE it painted under it (`elementFromPoint` at the glyph
                 returned the INPUT) — GallerySearchBar's X.F.W11 `.e` idiom.
                 The leading-adornment slot is the glass half (O-59). -->
            <Search
                class="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground"
                aria-hidden="true"
            />
        </div>
        <Select v-model="sort">
            <SelectTrigger class="min-w-0 flex-1 sm:w-auto sm:flex-none" aria-label="Sort users">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="last_seen">Last seen</SelectItem>
                <SelectItem value="entries">Most entries</SelectItem>
            </SelectContent>
        </Select>
        <!-- FR-AUL-7 / FR-AUL-26 / FR-AUL-41 stand: the act keeps its
             destructive register and a name that contains its visible
             words; it moves into the overflow (UIA-F-194). -->
        <DropdownMenu :modal="false">
            <DropdownMenuTrigger as-child>
                <Button emphasis="quiet" size="sm" icon-only aria-label="More user actions">
                    <EllipsisVertical class="size-4" aria-hidden="true" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" :side-offset="6">
                <DropdownMenuItem class="text-destructive" @select="emit('prune')">
                    <Eraser class="size-3.5" aria-hidden="true" />
                    Prune empty users…
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
</template>
