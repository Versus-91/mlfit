<template>
    <div>
        {{ comparisonMetric }}
        <button class="button is-info my-2" @click="compareResults"
            :disabled="!datasetName || isClassication == -1 || comparisonMetric == -1">
            Compare
            models</button>
        <div class="columns is-12 mt-2 is-multiline">
            <div class="column is-10">
                <div class="select">
                    <select v-model="datasetName">
                        <option>Select Dataest</option>
                        <option v-for="(dataset, index) in [...new Set(this.settings.results.map(m => m.datasetName))]"
                            :key="index">
                            {{ dataset }}
                        </option>
                    </select>
                </div>
                <div class="select">
                    <select v-model="isClassication" @change="fillMetrics()">
                        <option value="-1">Task</option>
                        <option value="0">Regression</option>
                        <option value="1">Classification</option>
                    </select>
                </div>
                <div class="select">
                    <select v-model="comparisonMetric">
                        <option>Metric</option>
                        <option v-for="m in baseMetrics" :key="m.id" :value="m.id">
                            {{ m.name }}</option>
                    </select>
                </div>
            </div>

            <div v-show="compare" class="column is-6" id="comaprison_plot" style="height:350px;"></div>
        </div>
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
            compare: false,
            datasetName: '',
            isClassication: -1,
            comparisonMetric: '',
            baseMetrics: [],
            activeTab: null,
            visitedTabs: [],
        }
    },
    methods: {
        fillMetrics() {
            if (this.isClassication == 1) {
                this.baseMetrics = [{ name: 'accuracy', id: 1 }, { name: 'f1 micro', id: 2 }, { 'name': 'f1 macro', id: 3 }]
            } else if (this.isClassication == 0) {
                this.baseMetrics = [{ name: 'R2', id: 1 }, { name: 'MSE', id: 0 }]
            }

        },
        compareResults() {
            try {
                Plotly.purge('comaprison_plot');
            } catch (error) {
                console.log('no plot to remove');

            }
            let methodResults = this.settings.getMethodResults.filter(m => m.datasetName == this.datasetName && m.modelTask == this.isClassication)
            this.compare = true;
            let x = [];
            let y = [];

            methodResults.forEach(result => {
                let metrics = result.metrics;
                x.push(result.name + '.' + result.id)
                if (this.isClassication == 1) {
                    y.push(metrics[3])
                } else if (this.isClassication == 0) {
                    y.push(metrics[this.comparisonMetric])
                }
            });
            var trace2 = {
                x: x,
                y: y,
                // eslint-disable-next-line no-unused-vars
                width: x.map(_ => 0.5),
                type: 'bar', marker: {
                    color: 'rgb(158,202,225)',
                    opacity: 0.6,
                    line: {
                        color: 'rgb(8,48,107)',
                        width: 0.2
                    }
                }
            };


            var data = [trace2];

            var layout = {
                height: 200,
                margin: {
                    l: 40,
                    r: 40,
                    b: 30,
                    t: 10,
                    pad: 4
                },
                barmode: 'group'

            };

            Plotly.newPlot('comaprison_plot', data, layout, { responsive: true });
        },
        resize() {
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