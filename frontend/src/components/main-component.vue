<template>
    <div class="column is-10">
        <section>
            <b-tabs v-model="settings.activeTab" :position="'is-centered'" :animated="false" type="success">
                <b-tab-item label="Data Analysis">
                    <section v-if="this.settings.datasetShape?.count > 0">
                        <div class="message is-info" v-if="isActive" :closable="false">
                            <div class="message-header">Data summary</div>
                            <div class="message-body">
                                <div class="columns is-multiline">
                                    <div class="column is-12 has-text-left">
                                        <p class="title is-7"> Data Shape : ({{ this.settings.datasetShape.count }},{{
                                            this.settings.datasetShape.columns
                                            }})</p>
                                    </div>
                                    <div class="column is-6">
                                        <h5 class="title is-7 has-text-left">Continuous Features :</h5>
                                        <b-table class="is-size-7" :data="continuousFeaturesStats"
                                            :columns="continuousFeaturesColumns" :narrowed="true" :bordered="true"
                                            :striped="true" :hoverable="true"></b-table>
                                    </div>
                                    <div class="column is-6">
                                        <h5 class="title is-7 has-text-left">Categorical Features :</h5>
                                        <b-table class="is-size-7" :data="categoricalFeaturesStats"
                                            :columns="categoricalFeaturesColumns" :narrowed="true" :bordered="true"
                                            :striped="true" :hoverable="true"></b-table>
                                    </div>
                                    <div class="column is-6">
                                        <h5 class="title is-7 has-text-left">Sample Data :</h5>
                                        <b-table class="is-size-7" :data="sampleData" :columns="datasetColumns"
                                            :narrowed="true" :bordered="true" :striped="true"
                                            :hoverable="true"></b-table>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <section>
                            <scatterplot-matrix-component @coordinate-plot="showCoordinatePlot()"
                                ref="splom"></scatterplot-matrix-component>

                        </section>
                        <section>
                            <article class="message is-info">
                                <div class="message-header">correlation matrix and Dendrogram</div>
                                <div class="message-body">
                                    <b-field label="Linkage method, Distance Metric">
                                        <b-select placeholder="Method" v-model="method">
                                            <option value="single">single</option>
                                            <option value="complete">complete</option>
                                            <option value="average">average</option>
                                            <option value="weighted">weighted</option>
                                            <option value="centroid">centroid</option>
                                            <option value="median">median</option>
                                            <option value="ward">ward</option>
                                        </b-select>
                                        <b-select placeholder="Metric" v-model="metric">
                                            <option value="euclidean">euclidean</option>
                                            <option value="hamming">hamming</option>
                                            <option value="mahalanobis">mahalanobis</option>
                                            <option value="matching">matching</option>
                                        </b-select>
                                        <p class="control">
                                            <b-button class="is-success" @click="correlationMatrix" :disabled="loading"
                                                :loading="loading">Correlation
                                                Cluster Diagram</b-button>
                                        </p>
                                    </b-field>

                                    <div class="columns is-multiline is-centered mb-2">
                                        <div class="column is-5" id="correlation_matrix" style="height: 400px;"></div>
                                        <div class="column is-5" id="correlation_matrix_ordered" style="height: 400px;">
                                        </div>
                                    </div>
                                </div>

                            </article>
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
                <b-tab-item label="Methods">
                    <methods-tab-component></methods-tab-component>
                </b-tab-item>
                <b-tab-item label="Help">
                    <div class="content has-text-left	">
                        <h4>1. Dataset Selection</h4>
                        <p>
                            To begin, you can either select a sample dataset provided by the system or upload your own
                            dataset. The supported file formats for datasets include .xlsx (Excel files), .csv (Comma
                            Separated Values files), and .txt (plain text files). Ensure that your file is in one of
                            these formats to avoid any issues during the upload process.
                        </p>
                        <figure>
                            <img src="/upload.png" />
                            <figcaption>Figure 1: Dataset Selection</figcaption>
                        </figure>
                        <h4>2. Data Analysis</h4>
                        <figure>
                            <img src="/stats_categorical.jpg" />
                            <figcaption>Figure 2: Categorical features stats</figcaption>
                        </figure>
                        <p>
                            After uploading the dataset an overview of the dataset would be shhown in the Data Analysis
                            tab. In the first
                            window we provide you witth statistical metrics of the dataset. for canotinious features we
                            show the mean, std, min, max, and etc.

                            In case of categorical features information such as shape, mode and percentages of smaples
                            with modes option, and number of missing values.
                        </p>

                        <figure>
                            <img src="/stats_continious.jpg" />
                            <figcaption>Figure 3: Categorical features stats</figcaption>
                        </figure>
                        <p>
                            In case of categorical features information such as shape, mode and percentages of smaples
                            with modes option, and number of missing values.
                        </p>
                        <h4>3. Feature selection</h4>
                        <p>
                            After uploading the dataset, you can customize the data by selecting specific features based
                            on your requirements. To do this, click on the 'Select Features' button, which will open a
                            new menu. This menu allows you to choose the features that will be used in the training
                            process. If there is an issue with the automatic detection of feature data types, you can
                            manually adjust the data types to ensure they are correctly categorized as ordinal,
                            categorical, or continuous.
                        </p>
                        <h4>3. Model Selection</h4>
                        <figure>
                            <img src="/model_selection.jpg" />
                            <figcaption>Figure 4: Model selection and setting for knn</figcaption>
                        </figure>
                        <p>
                            Once you have selected all the required features and resolved any issues with feature data
                            types, you can proceed to the model selection step. Use the 'Model' dropdown to
                            choose the model for training. The options in this dropdown will be dynamically populated
                            based on the type of data in your features: regression models will be available for
                            continuous data, while classification models will be shown for categorical data.
                            Additionally, you can further customize the selected model by clicking the gear icon, which
                            allows you to adjust common settings and parameters specific to each model.
                        </p>
                    </div>


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
import MethodsTabComponent from './tabs/methods-tab-component.vue'

import { FeatureCategories } from '../helpers/settings'
import ChartController from '@/helpers/charts';
import { settingStore } from '@/stores/settings'
import { Matrix, correlation } from 'ml-matrix';
// eslint-disable-next-line no-unused-vars
import Clustermap from '@/helpers/correlation/correlation-matrix'

let ui = new UI(null, null);
let chartController = new ChartController(null, null)

export default {
    name: 'MainComponent',
    components: {
        'dmensionality-reduction-component': PCAComponent,
        'results-component': ResultsComponent,
        'scatterplot-matrix-component': SPLOMComponent,
        'methods-tab-component': MethodsTabComponent
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
            metric: 'euclidean',
            method: 'ward',
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
        async correlationMatrix() {
            this.loading = true;
            try {
                let numericColumns = this.settings.items.filter(m => m.selected && m.type === FeatureCategories.Numerical.id).map(m => m.name);
                let values = this.settings.df.loc({ columns: numericColumns })
                values = values.dropNa({ axis: 1 }).values
                let matrix = new Matrix(values)
                let correlations = correlation(matrix)
                this.hasCorrelationMatrix = true;
                let colorScales = chartController.correaltoinMatrixColorscale(correlations.data)
                await chartController.correlationHeatmap('correlation_matrix', correlations.data, numericColumns, colorScales);
                let mtx = new Clustermap();
                let [dendogram, orderedMatrix, columns] = await mtx.train(values, numericColumns, this.metric, this.method);
                await chartController.dendogramPlot('correlation_matrix_ordered', orderedMatrix, dendogram, columns, numericColumns, colorScales);
                this.loading = false;

            } catch (error) {
                this.loading = false;
                throw error
            }
        },
        renderStats() {
            if (this.settings.df?.columns?.length > 0) {
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
                this.$refs.splom?.initSPLOM();
                setTimeout(() => {
                    this.correlationMatrix();
                }, 500);
            }
        },
    },

}
</script>

<style></style>