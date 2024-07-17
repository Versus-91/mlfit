<template>
    <div class="column is-10">
        <section>
            <b-tabs type="is-toggle" v-model="activeTab" :position="'is-centered'">
                <b-tab-item label="Data Anaysis">
                    <section v-if="dataframe">
                        <b-message title="Data summary" v-model="isActive" type="is-info" :closable="false">
                            <div class="columns is-multiline">
                                <div class="column is-6">
                                    <h5 class="title is-6 has-text-left">Continuous Features :</h5>
                                    <b-table class="is-size-7" :data="continuousFeaturesStats"
                                        :columns="continuousFeaturesColumns" :narrowed="true"></b-table>
                                </div>
                                <div class="column is-6">
                                    <h5 class="title is-6 has-text-left">Categorical Features :</h5>
                                    <b-table class="is-size-7" :data="categoricalFeaturesStats"
                                        :columns="categoricalFeaturesColumns" :narrowed="true"></b-table>
                                </div>
                                <div class="column is-6">
                                    <h5 class="title is-6 has-text-left">Sample Data :</h5>
                                    <b-table class="is-size-7" :data="sampleData" :columns="datasetColumns"
                                        :narrowed="true"></b-table>
                                </div>
                            </div>
                        </b-message>
                        <section>
                            <scatterplot-matrix-component :dataframe="dataframe?.copy()"></scatterplot-matrix-component>
                        </section>
                    </section>
                    <section v-else>
                        <b-message type="is-danger" has-icon icon-pack="fas">
                            Upload a dataset or select a sample from sidebar.
                        </b-message>
                    </section>

                </b-tab-item>

                <b-tab-item label="Dimensionality Reduction">
                    <dmensionality-reduction-component :dataframe="dataframe"
                        :columns="selectedFeatures"></dmensionality-reduction-component>
                </b-tab-item>
                <b-tab-item label="Results Analysis">
                    <results-component></results-component>
                </b-tab-item>
                <b-tab-item label="Details" disabled>
                    Nunc nec velit nec libero vestibulum eleifend.
                    Curabitur pulvinar congue luctus.
                    Nullam hendrerit iaculis augue vitae ornare.
                    Maecenas vehicula pulvinar tellus, id sodales felis lobortis eget.
                </b-tab-item>
            </b-tabs>

        </section>
    </div>
</template>

<script>
import UI from '@/helpers/ui';
import { toJSON } from 'danfojs';
import PCAComponent from './tabs/dmensionality-reduction-componenet.vue'
import ScatterplotMatrixComponent from './visualization/scatterplot-matrix-component.vue'
import ResultsComponent from './tabs/results-component.vue'
let ui = new UI(null, null)
export default {
    name: 'MainComponent',
    components: {
        'dmensionality-reduction-component': PCAComponent,
        'scatterplot-matrix-component': ScatterplotMatrixComponent,
        'results-component': ResultsComponent,
    },
    props: {
        msg: String,
        dataframe: Object,
        selectedFeatures: []
    },
    data() {
        return {
            continuousFeaturesStats: [
            ],
            continuousFeaturesColumns: [
            ],
            categoricalFeaturesStats: [
            ],
            categoricalFeaturesColumns: [
            ],
            sampleData: [
            ],
            datasetColumns: [
            ],
            isActive: true,
            activeTab: 0,
        }
    },
    methods: {

    },
    watch: {
        dataframe: async function (val) {
            let datasetStats = ui.renderDatasetStats(val);
            this.continuousFeaturesColumns = datasetStats[0];
            this.continuousFeaturesStats = datasetStats[1];
            this.categoricalFeaturesColumns = datasetStats[2];
            this.categoricalFeaturesStats = datasetStats[3];
            this.datasetColumns = val.columns.map(column => {
                return {
                    field: column,
                    label: column

                }
            });
            this.sampleData = toJSON(val.head(5));
        }
    },
}
</script>

<style></style>