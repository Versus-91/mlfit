<template>
    <div>

        <b-tabs v-model="activeResult" v-if="this.settings.results?.length > 0" @input="resize">
            <b-tab-item label="Comparison" @click="compareResultsDraw()">
                <button v-for="(item, index) in metricsCollection" :key="index"
                    class="button is-small ml-1 is-success my-2" @click="compareResultsDraw(item)">{{
                        item.name + '-' + (item.task ? 'cls' : 'reg') }}</button>
                <div class="message is-info ">
                    <div class="message-header p-2">
                        Methods Comparison
                    </div>
                    <div class="message-body">
                        <div class="columns is-multiline is-gapless">
                            <div v-for="(value, index) in metrics" :key="index" class="column is-4">
                                <div class="column is-4">
                                    <div :id="index"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-show="compare" class="column is-12" id="comaprison_plot" style="height:400px;"></div>
            </b-tab-item>
            <template v-for="result in this.settings.results">
                <b-tab-item :label="(result.id) + '.' + result.name.toString()" :key="result.id">
                    <classification-view-component @delete-result="deleteResult" :result="result"
                        v-if="result.modelTask"></classification-view-component>
                    <regression-view-component @delete-result="deleteResult" :result="result" v-else>
                    </regression-view-component>
                    <div class="column is-12">
                        <div class="table-container" v-if="!result.useHPC">
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
import ChartController from '@/helpers/charts';

let chartController = new ChartController(null, null)

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
            metricsCollection: [],
            compare: false,
            datasetName: '',
            isClassication: -1,
            comparisonMetric: '',
            baseMetrics: [],
            activeTab: null,
            visitedTabs: [],
            metrics: {},
            xTicks: {},
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
        compareResults(dataset) {
            let datasetName = this.settings.datasetName
            let task = this.settings.classificationTask;
            try {
                Plotly.purge('comaprison_plot');
            } catch (error) {
                console.log('no plot to remove');
            }
            if (dataset) {
                datasetName = dataset.name
                task = dataset.task
            }
            let methodResults = this.settings.getMethodResults.filter(m => m.datasetName == datasetName && task == m.modelTask)
            this.compare = true;
            let x = [];
            let y = {};
            methodResults.forEach((result, i) => {
                let metrics = result.metrics;
                if (i === 0) {
                    x.push('Theoretical best');
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
            this.metrics = y;
            this.xTicks = x;
        },
        draw() {
            for (const k in this.metrics) {
                chartController.comparison(this.xTicks, this.metrics[k], k, k)
            }
        },
        compareResultsDraw(dataset) {
            let results = [];
            this.compareResults(dataset);
            for (let i = 0; i < this.settings.getMethodResults.length; i++) {
                const res = this.settings.getMethodResults[i];
                let index = results.findIndex(m => m.task === res.modelTask && m.name === res.datasetName)
                if (index == -1) {
                    results.push({ name: res.datasetName, task: res.modelTask })
                }

            }
            //  results = [...new Set(this.settings.getMethodResults.map(m => m.datasetName))];

            this.metricsCollection = results;

            setTimeout(() => {
                this.draw()
            }, 500);
        },
        resize(v) {
            if (v === 0) {
                this.compareResultsDraw()
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