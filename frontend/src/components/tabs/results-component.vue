<template>
    <div>

        <b-tabs v-model="activeResult" v-if="this.settings.results?.length > 0" @input="resize">
            <b-tab-item label="Comparison" @click="compareResults">
                <button class="button is-info my-2" @click="compareResults">
                    Compare
                    models</button>

                <div v-show="compare" class="column is-12" id="comaprison_plot" style="height:400px;"></div>
            </b-tab-item>
            <template v-for="result in this.settings.results">
                <b-tab-item :label="(result.id) + '.' + result.name.toString()" :key="result.id">
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
            let methodResults = this.settings.getMethodResults.filter(m => m.datasetName == this.settings.datasetName && this.settings.classificationTask == m.modelTask)
            this.compare = true;
            let x = [];
            let y = {};
            let traces = [];
            methodResults.forEach((result, i) => {

                let metrics = result.metrics;
                if (i === 0) {
                    x.push('best');
                }
                x.push(result.id + '.' + result.name)

                for (const key in result.metrics) {
                    if (key != 'precision' && key != 'recall') {
                        const metric = metrics[key];
                        if (key in y) {
                            y[key].push(metric);
                        } else {
                            y[key] = [];
                            y[key].push(1);
                            y[key].push(metric);
                        }
                    }
                }
            });
            let i = 1;
            for (const key in y) {
                let trace = {
                    x: x,
                    y: y[key],
                    name: key,
                    xaxis: 'x' + i,
                    yaxis: 'y' + i,
                    type: 'scatter',
                    marker: {
                        color: 'rgb(158,202,225)',
                        opacity: 0.6,
                        line: {
                            color: 'rgb(8,48,107)',
                            width: 0.2
                        }
                    }
                };
                traces.push(trace);
                i++;
            }

            var layout = {
                grid: { rows: 1, columns: Object.keys(y).length, pattern: 'independent' },
                xaxis: {
                    tickfont: {
                        size: 8
                    }
                },
                height: 300,
                margin: {
                    l: 40,
                    r: 40,
                    b: 80,
                    t: 10,
                    pad: 10
                },
            };
            for (let i = 1; i < Object.keys(y).length + 1; i++) {
                layout[`xaxis${i === 1 ? '' : i}`] = {
                    tickfont: { size: 10 }
                };
            }
            Plotly.newPlot('comaprison_plot', traces, layout, { responsive: true });
        },
        resize(v) {
            if (v === 0) {
                this.compareResults()
            }

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