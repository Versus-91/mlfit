<template>
    <section>
        <b-tabs v-model="activeTab" @input="resize">
            <b-tab-item v-for="result in this.settings.results" :label="result.name.toString()" :key="result.id">
                <div class="columns is-multiline">
                    <div class="column is-6" :id="'confusion_matrix_' + result.id"></div>
                    <div class="column is-6" :id="'pca_results_' + result.id"></div>
                    <div class="column is-6" :id="'knn_table_' + result.id"
                        v-if="result.name.toString().includes('neighbour')"></div>
                    <div class="column is-12">
                        <table :id="'predictions_table_' + result.id"
                            class="table is-bordered is-hoverable is-narrow display is-size-7" width="100%">
                        </table>
                    </div>
                </div>
            </b-tab-item>
        </b-tabs>
    </section>
</template>

<script>
import { settingStore } from '@/stores/settings'

export default {
    setup() {
        const settings = settingStore()
        return { settings }
    },
    name: 'ResultsComponent',
    props: {
    },
    data() {
        return {
            activeTab: null
        }
    },
    methods: {
        resize() {
            window.dispatchEvent(new Event('resize'));
        }
    },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped></style>