<template>
    <div>
        <button class="button is-info"> Compare</button>
        <b-tabs v-model="activeResult" v-if="this.settings.results?.length > 0" @input="resize()">
            <template v-for="result in this.settings.results">
                <b-tab-item :label="(result.id + 1) + '.' + result.name.toString()" :key="result.id">
                    <classification-view-component @delete-result="deleteResult" :result="result"
                        v-if="result.modelTask"></classification-view-component>
                    <regression-view-component @delete-result="deleteResult" :result="result" v-else>
                    </regression-view-component>
                    <div class="column is-12">
                        <div class="table-container">
                            <table :id="'predictions_table_' + result.id"
                                class="table is-bordered is-hoverable is-narrow display is-size-7" width="100%">
                            </table>
                        </div>
                    </div>
                </b-tab-item>
            </template>
        </b-tabs>
        <b-message type="is-danger" has-icon icon-pack="fas" v-else>
            No result to show.
        </b-message>
    </div>

</template>

<script>
import { settingStore } from '@/stores/settings'
import ClassificationViewComponent from './classification-view-component.vue'
import RegressionViewComponent from './regression-view-component.vue'
import { computed } from "vue";

import Plotly from 'danfojs/node_modules/plotly.js-dist-min';
import UI from '@/helpers/ui';
let ui = new UI(null, null)


export default {
    components: {
        'classification-view-component': ClassificationViewComponent,
        'regression-view-component': RegressionViewComponent,

    },
    setup() {
        const settings = settingStore()
        const activeResult = computed({
            get: () => settings.getResultTab,
            set: (value) => settings.setResultActiveTab(value), // Mutate the state properly
        });
        return { settings, activeResult }
    },

    name: 'ResultsComponent',
    props: {
    },
    data() {
        return {
            activeTab: null,
            visitedTabs: [],
        }
    },
    methods: {
        resize() {
            console.log('resize');

            window.dispatchEvent(new Event('resize'));
        },
        deleteResult(id) {
            // eslint-disable-next-line no-unused-vars
            let [tables, plots] = this.settings.getResultVisualizations(id);
            tables.forEach(table => {
                ui.removeTable(table)
            });
            plots.forEach(plot => {
                Plotly.purge(plot);
            });
            this.settings.removeResult(id);

        },
        showMethodDetails(id) {
            alert(id)

        },
    },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped></style>