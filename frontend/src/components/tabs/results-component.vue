<template>
    <b-tabs v-model="settings.resultActiveTab" v-if="this.settings.results?.length > 0">
        <b-tab-item v-for="result in this.settings.results" :label="(result.id + 1) + '.' + result.name.toString()"
            :key="result.id" ref="resultContents">
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
    </b-tabs>
    <b-message type="is-danger" has-icon icon-pack="fas" v-else>
        No result to show.
    </b-message>
</template>

<script>
import { settingStore } from '@/stores/settings'
import ClassificationViewComponent from './classification-view-component.vue'
import RegressionViewComponent from './regression-view-component.vue'
import { jsPDF } from "jspdf";
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
        return { settings }
    },
    name: 'ResultsComponent',
    props: {
    },
    data() {
        return {
            activeTab: null,
            visitedTabs: []
        }
    },
    methods: {

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
        resize(id) {
            let isVisited = this.visitedTabs.findIndex(item => item === id);
            console.log('cccccc', isVisited);
            if (isVisited === -1) {
                this.visitedTabs.push(id);
                window.dispatchEvent(new Event('resize'));
            }
        },
        exportToPDF() {
            var pdf = new jsPDF('p', 'pt', 'letter');
            pdf.html(this.$el.innerHTML, {
                callback: function (pdf) {
                    var iframe = document.createElement('iframe');
                    iframe.setAttribute('style', 'position:absolute;right:0; top:0; bottom:0; height:100%; width:500px');
                    document.body.appendChild(iframe);
                    iframe.src = pdf.output('datauristring');
                }
            });
        }
    },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped></style>