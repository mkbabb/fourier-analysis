<template>
    <div class="x" />
</template>

<style scoped>
/* glass-ui's own `@layer components` recipe is beaten BY ORDER here */
@layer glass-overrides {
    .x { color: red; }
}
</style>
