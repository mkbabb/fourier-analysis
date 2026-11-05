<template>
    <div class="x" />
</template>

<style scoped>
/* a comment naming @layer components is prose, not a rule */
@layer components {
    .x { color: red; }
}
@layer base, utilities;
</style>
