<script setup lang="ts">
/**
 * API tokens for /api/v1 (the @mkbabb/fourier client). A token is shown once,
 * in the dialog that follows its creation; the list only ever carries its
 * public key. Glass parts only: Card, Input, Button, DataTable, Dialog.
 */
import { computed, defineComponent, h, ref, type PropType } from "vue";
import { Button } from "@mkbabb/glass-ui/button";
import { Card } from "@mkbabb/glass-ui/card";
import { DataTable, type DataTableColumn } from "@mkbabb/glass-ui/data-table";
import { Input } from "@mkbabb/glass-ui/input";
import { useClipboard } from "@mkbabb/glass-ui";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@mkbabb/glass-ui/dialog";
import { useRelativeTime } from "@/lib/time";
import { errorToast } from "@/lib/toast-policy";
import { problemDetail } from "@/lib/api-problem";
import { useAuthStore } from "@/stores/auth";
import * as api from "@/lib/api";
import type { ApiToken } from "@/lib/api";

const auth = useAuthStore();
const tokens = ref<ApiToken[]>([]);
const loading = ref(true);
const name = ref("");
const minting = ref(false);
const minted = ref<{ id: string; token: string } | null>(null);
const { status: copyStatus, copy } = useClipboard({ resetMs: 2000 });
const relativeTimeOf = useRelativeTime();

function adminToken() {
    const token = auth.getAdminToken();
    if (!token) throw new Error("Admin session has expired — re-enter admin mode.");
    return token;
}

async function load() {
    loading.value = true;
    try {
        tokens.value = (await api.listApiTokens(adminToken())).tokens;
    } catch (e: unknown) {
        errorToast({ title: "Couldn’t load tokens", description: problemDetail(e) });
    } finally {
        loading.value = false;
    }
}

async function mint() {
    const label = name.value.trim();
    if (!label) return;
    minting.value = true;
    try {
        minted.value = await api.mintApiToken(adminToken(), label);
        name.value = "";
        await load();
    } catch (e: unknown) {
        errorToast({ title: "Couldn’t create the token", description: problemDetail(e) });
    } finally {
        minting.value = false;
    }
}

async function revoke(id: string) {
    try {
        await api.revokeApiToken(adminToken(), id);
        await load();
    } catch (e: unknown) {
        errorToast({ title: "Couldn’t revoke the token", description: problemDetail(e) });
    }
}

load();

type TokenRow = ApiToken & { _id: string };
const rows = computed<TokenRow[]>(() => tokens.value.map((t) => ({ ...t, _id: t.id })));

const cellProps = {
    value: { type: null, default: null },
    row: { type: Object as PropType<TokenRow>, required: true },
} as const;

const TimeCell = defineComponent({
    name: "TokenTimeCell",
    props: cellProps,
    setup: (props) => () => {
        if (!props.value) return h("span", { class: "text-muted-foreground" }, "never");
        const t = relativeTimeOf(String(props.value));
        return h("time", { datetime: t.datetime, title: t.absolute, class: "tabular-nums whitespace-nowrap" }, t.text);
    },
});

const KeyCell = defineComponent({
    name: "TokenKeyCell",
    props: cellProps,
    setup: (props) => () => h("code", { class: "font-mono whitespace-nowrap" }, `fk_${props.row.id}_…`),
});

const ActionCell = defineComponent({
    name: "TokenActionCell",
    props: cellProps,
    setup: (props) => () =>
        props.row.revoked_at
            ? h("span", { class: "text-muted-foreground whitespace-nowrap" }, "Revoked")
            : h(Button, { variant: "outline", size: "sm", onClick: () => revoke(props.row.id) }, () => "Revoke"),
});

const columns: DataTableColumn<TokenRow>[] = [
    { key: "name", label: "Name", class: "w-full [td&]:max-w-0 truncate" },
    { key: "id", label: "Key", component: KeyCell },
    { key: "rate_per_min", label: "Per minute", align: "right" },
    { key: "last_used_at", label: "Last used", component: TimeCell, headerClass: "whitespace-nowrap" },
    { key: "revoked_at", label: "", component: ActionCell, align: "right" },
];
</script>

<template>
    <div class="flex flex-col gap-3 px-[var(--page-gutter)] py-2">
        <Card class="flex flex-col gap-3 p-4">
            <p class="text-sm text-muted-foreground">
                Tokens let a server or a build script call the spectrum API. Keep them out of anything a browser loads.
            </p>
            <form class="flex gap-2" @submit.prevent="mint">
                <Input v-model="name" aria-label="Token name" placeholder="Name" class="min-w-0 flex-1" maxlength="80" />
                <Button type="submit" :disabled="minting || !name.trim()">Create token</Button>
            </form>
        </Card>

        <DataTable :columns="columns" :rows="rows" :status="loading ? 'loading' : 'ready'" responsive>
            <template #empty>No tokens yet.</template>
        </DataTable>

        <Dialog :open="minted !== null" @update:open="(open: boolean) => { if (!open) minted = null; }">
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Your new token</DialogTitle>
                    <DialogDescription>Copy it now. It won’t be shown again.</DialogDescription>
                </DialogHeader>
                <code class="block break-all rounded-md bg-muted p-3 font-mono text-sm">{{ minted?.token }}</code>
                <DialogFooter>
                    <Button variant="outline" @click="minted && copy(minted.token)">
                        {{ copyStatus === "success" ? "Copied" : copyStatus === "failure" ? "Copy failed" : "Copy" }}
                    </Button>
                    <Button @click="minted = null">Done</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
</template>
