<template>
    <div class="column is-10">
        <section>

            <b-tabs type="is-toggle" v-model="settings.activeTab" :position="'is-centered'" :animated="false">
                <b-tab-item label="Data Anaysis">
                    <section v-if="this.settings.datasetShape?.count > 0">
                        <b-message title="Data summary" v-model="isActive" type="is-info" :closable="false">
                            <div class="columns is-multiline">
                                <div class="column is-12 has-text-left">
                                    <p class="title is-6"> Data Shape : ({{ this.settings.datasetShape.count }},{{
                                        this.settings.datasetShape.columns
                                    }})</p>
                                </div>
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
                            <scatterplot-matrix-component v-if="this.settings.df"
                                :dataframe="this.settings.df?.copy()"></scatterplot-matrix-component>
                        </section>
                        <section>
                            <div class="column is-12"> <button class="button is-success" :disabled="loading"
                                    @click="correlationMatrix">Correlation Matrix</button>
                            </div>
                            <b-message>
                                <div class="columns is-multiline is-centered mb-2">
                                    <div class="column is-5" id="correlation_matrix" style="height: 400px;"></div>
                                    <div class="column is-5">
                                        <div class=" colmun is-12" id="test">
                                            <img :src="img">
                                        </div>
                                    </div>
                                </div>
                            </b-message>
                        </section>
                    </section>
                    <section v-else>
                        <b-message type="is-danger" has-icon icon-pack="fas">
                            Upload a dataset or select a sample from sidebar.
                        </b-message>
                    </section>

                </b-tab-item>

                <b-tab-item label="Dimensionality Reduction">
                    <dmensionality-reduction-component :dataframe="this.settings.df"
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
import ResultsComponent from './tabs/results-component.vue'
import SPLOMComponent from './visualization/scatterplot-matrix-component.vue'
import { FeatureCategories } from '../helpers/settings'
import ChartController from '@/helpers/charts';
import { settingStore } from '@/stores/settings'
import { Matrix, correlation } from 'ml-matrix';
import Clustermap from '@/helpers/correlation/correlation-matrix'
let ui = new UI(null, null);
let chartController = new ChartController(null, null)

export default {
    name: 'MainComponent',
    components: {
        'dmensionality-reduction-component': PCAComponent,
        'results-component': ResultsComponent,
        'scatterplot-matrix-component': SPLOMComponent,

    },
    setup() {
        const settings = settingStore()
        return { settings }
    },
    props: {
        msg: String,
        selectedFeatures: []
    },
    data() {
        return {
            img: null,
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
            hasCorrelationMatrix: false,
            loading: false
        }
    },
    methods: {
        renderStats() {
            let numericColumns = this.settings.items.filter(m => m.type === FeatureCategories.Numerical.id).map(m => m.name);
            let categoricalColumns = this.settings.items.filter(m => m.type !== FeatureCategories.Numerical.id).map(m => m.name);

            let datasetStats = ui.renderDatasetStats(this.settings.df, numericColumns, categoricalColumns);
            this.continuousFeaturesColumns = datasetStats[0];
            this.continuousFeaturesStats = datasetStats[1];
            this.categoricalFeaturesColumns = datasetStats[2];
            this.categoricalFeaturesStats = datasetStats[3];
            this.datasetColumns = this.settings.df.columns.map(column => {
                return {
                    field: column,
                    label: column

                }
            });
            this.sampleData = toJSON(this.settings.df.head(5));
        },
        async correlationMatrix() {
            this.loading = true;
            let numericColumns = this.settings.items.filter(m => m.type === FeatureCategories.Numerical.id).map(m => m.name);
            let values = this.settings.df.loc({ columns: numericColumns }).values
            let matrix = new Matrix(values)
            let correlations = correlation(matrix)
            this.hasCorrelationMatrix = true;
            await chartController.correlationHeatmap('correlation_matrix', correlations.data, numericColumns, 'Correlation Matrix');
            let mtx = new Clustermap();
            this.img = await mtx.train(values, numericColumns);
            this.loading = false;

        }
    },

}
</script>

<style></style>