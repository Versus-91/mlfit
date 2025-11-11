<template>
    <section>
        <b-tabs type="is-boxed">
            <b-tab-item v-for="tab in tabs" :label="tab.name" :icon="tab.icon"></b-tab-item>
        </b-tabs>
    </section>
</template>

<script setup lang="ts">
import { BTabs, BTabItem } from "buefy";
const tabs = [{ name: 'Data Analysis', icon: '' }, { name: 'Dimensionality Reduction', icon: '' },
{ name: 'Results Analysis', icon: '' }, { name: 'Methods Info', icon: '' }, { name: 'Help', icon: '' }, { name: 'Messages', icon: '' }]
</script>