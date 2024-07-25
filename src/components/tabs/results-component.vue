<template>
    <section v-if="this.settings.results?.length > 0">
        <b-tabs v-model="settings.resultActiveTab">
            <b-tab-item v-for="result in this.settings.results" :label="result.name.toString()" :key="result.id">
                <div class="columns is-multiline">
                    <classification-view-component :result="result"
                        v-if="result.modelTask"></classification-view-component>
                    <regression-view-component :result="result" v-else>
                    </regression-view-component>
                    <div class="column is-12">
                        <table :id="'predictions_table_' + result.id"
                            class="table is-bordered is-hoverable is-narrow display is-size-7" width="100%">
                        </table>
                    </div>
                </div>
            </b-tab-item>
        </b-tabs>
    </section>
    <section v-else>
        <b-message type="is-danger" has-icon icon-pack="fas">
            No result to show.
        </b-message>
    </section>
</template>

<script>
import { settingStore } from '@/stores/settings'
import ClassificationViewComponent from './classification-view-component.vue'
import RegressionViewComponent from './regression-view-component.vue'
import Plotly from 'plotly.js-dist-min';
import $ from "jquery";


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
            activeTab: null
        }
    },
    methods: {
        resize() {
            window.dispatchEvent(new Event('resize'));
            var doc = $(".tab-content .js-plotly-plot");
            for (var i = 0; i < doc.length; i++) {
                Plotly.relayout(doc[i], { autosize: true });
            }
        }
    },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped></style>