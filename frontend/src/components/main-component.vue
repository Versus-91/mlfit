<template>
    <div class="column is-10">
        <section>
            <b-tabs v-model="settings.activeTab" :position="'is-centered'" :animated="false" type="success"
                @input="resize()">
                <b-tab-item label="Data Analysis" icon="search" icon-pack="fas">
                    <section v-if="this.settings.datasetShape?.count > 0">
                        <div class="message is-info" v-if="isActive" :closable="false">
                            <div class="message-header p-2">Data summary</div>
                            <div class="message-body">
                                <div class="columns is-multiline">
                                    <div class="column is-12 has-text-left">
                                        <p class="title is-6"> Data Shape : ({{ this.settings.datasetShape.count }},{{
                                            this.settings.datasetShape.columns
                                        }})</p>
                                    </div>
                                    <div class="column is-6">
                                        <h5 class="title is-6 has-text-left">Numerical Features:
                                        </h5>
                                        <div class="table-container">

                                            <table class="table is-size-7">
                                                <thead>
                                                    <tr>
                                                        <th class="is-success"></th>
                                                        <th class="is-success">Name</th>
                                                        <th class="is-success">Min</th>
                                                        <th class="is-success">Max</th>
                                                        <th class="is-success">Mean</th>
                                                        <th class="is-success">Median</th>
                                                        <th class="is-success">st.d</th>
                                                        <th class="is-success">#NAs</th>
                                                        <th class="is-success">Type</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr v-for="feature in continuousFeaturesStats" :key="feature.name">
                                                        <td> <b-checkbox v-model="feature.selected"></b-checkbox>
                                                        </td>
                                                        <td>{{ feature.name }}</td>
                                                        <td>{{ feature.min }}</td>
                                                        <td>{{ feature.max }}</td>
                                                        <td>{{ feature.median }}</td>
                                                        <td>{{ feature.mean }}</td>
                                                        <td>{{ feature.std }}</td>
                                                        <td>{{ feature.missingValuesCount }}</td>
                                                        <td> <b-select :expanded="true" v-model="feature.type"
                                                                size="is-small">
                                                                <option v-for="option in featureTypeOptions"
                                                                    :value="option.id" :key="option.id">
                                                                    {{ option.name }}
                                                                </option>
                                                            </b-select></td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                        <button class="button is-small" @click="applyChanges()">Apply changes</button>
                                    </div>
                                    <div class="column is-6">
                                        <h5 class="title is-6 has-text-left">Categorical Features(Nominal/Ordinal):</h5>
                                        <div class="table-container">

                                            <table class="table is-size-7 mb-1">
                                                <thead>
                                                    <tr>
                                                        <th class="is-success"></th>
                                                        <th class="is-success">Name</th>
                                                        <th class="is-success">Shape</th>
                                                        <th class="is-success">Mode</th>
                                                        <th class="is-success">Mode percentage</th>
                                                        <th class="is-success">#NAs</th>
                                                        <th class="is-success">Typs</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr v-for="feature in categoricalFeaturesStats" :key="feature.name">
                                                        <td> <b-checkbox v-model="feature.selected"></b-checkbox>
                                                        </td>
                                                        <td>{{ feature.name }}</td>
                                                        <td>{{ feature.shape }}</td>
                                                        <td>{{ feature.mode }}</td>
                                                        <td>{{ feature.percentage }}</td>
                                                        <td>{{ feature.missingValuesCount }}</td>

                                                        <td> <b-select :expanded="true" v-model="feature.type"
                                                                size="is-small">
                                                                <option v-for="option in featureTypeOptions"
                                                                    :value="option.id" :key="option.id">
                                                                    {{ option.name }}
                                                                </option>
                                                            </b-select></td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <p class="subtitle is-7 m-0 p-0"> Nominal features are one hot encoded and
                                                ordinal
                                                features are encoded in one column.</p>
                                        </div>

                                    </div>
                                    <div class="column is-6">
                                        <h5 class="title is-6 has-text-left">Sample Data :</h5>
                                        <b-table class="is-size-7" :data="sampleData" :columns="datasetColumns"
                                            :narrowed="true" :bordered="true" :striped="true"
                                            :hoverable="true"></b-table>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <section>
                            <scatterplot-matrix-component ref="splom"></scatterplot-matrix-component>

                        </section>
                        <section>
                            <article class="message is-info mt-2">
                                <div class="message-header p-2">Correlation Matrix and Dendrogram <b-tooltip
                                        append-to-body label="Ward method requires euclidean distance" multilined>
                                        <b-button icon-left="info" icon-pack="fas" size="is-small" type="is-dark" />
                                    </b-tooltip></div>
                                <div class="message-body">
                                    <div class="columns is-gapless">
                                        <div class="column is-6 mx-1"></div>
                                        <div class="column is-6 mx-1">
                                            <b-field label="Linkage method, Distance Metric" custom-class="is-small">
                                                <b-select size="is-small" placeholder="Method" v-model="method">
                                                    <option value="single">single</option>
                                                    <option value="complete">complete</option>
                                                    <option value="average">average</option>
                                                    <option value="weighted">weighted</option>
                                                    <option value="centroid">centroid</option>
                                                    <option value="median">median</option>
                                                    <option value="ward">ward</option>
                                                </b-select>
                                                <b-select size="is-small" placeholder="Metric" v-model="metric">
                                                    <option value="euclidean">euclidean</option>
                                                    <option value="correlation">correlation</option>
                                                    <option value="mahalanobis">mahalanobis</option>
                                                    <option value="cosine">cosine</option>
                                                </b-select>
                                                <p class="control">
                                                    <b-button class="is-success is-small" @click="correlationMatrix"
                                                        :disabled="loading" :loading="loading">Correlation
                                                        Cluster Diagram</b-button>
                                                </p>
                                            </b-field>

                                        </div>

                                    </div>

                                    <div class="columns is-multiline is-centered mb-2 p-0 is-gapless">
                                        <div class="column is-6" id="correlation_matrix" style="height: 400px;"></div>
                                        <div class="column is-6" id="correlation_matrix_ordered" style="height: 400px;">
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

                <b-tab-item label="Dimensionality Reduction" icon="compress-arrows-alt" icon-pack="fas">
                    <dmensionality-reduction-component :dataframe="this.settings.df"
                        :columns="selectedFeatures"></dmensionality-reduction-component>
                </b-tab-item>
                <b-tab-item label="Results Analysis" icon="chart-pie" icon-pack="fas">
                    <results-component ref="results"></results-component>
                </b-tab-item>
                <b-tab-item label="Methods Details" icon="list" icon-pack="fas">
                    <methods-tab-component></methods-tab-component>
                </b-tab-item>
                <b-tab-item label="Help" icon="question" icon-pack="fas">
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
                <b-tab-item label="Messages Log" icon="history" icon-pack="fas">
                    <b-notification aria-close-label="Close notification" icon-pack="fas"
                        :type="m.type == 'warning' ? 'is-warning' : m.type == 'danger' ? 'is-danger' : 'is-info'"
                        has-icon :closable="false" v-for="(m, i) in this.settings.getMessages" :key="i">
                        {{ m.message?.toLowerCase() }}
                        <br>
                        {{ m.date }}

                    </b-notification>
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
import { DataFrame } from 'danfojs/dist/danfojs-base';

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
        selectedFeatures: [],
    },
    errorCaptured(err, vm, info) {
        console.log(`cat EC: ${err.toString()}\ninfo: ${info}`);
        let message = { message: 'Encountered unexpected error', type: 'warning' }
        this.$buefy.toast.open({ message: 'Encountered unexpected error', type: 'is-warning' })
        this.settings.addMessage(message)
        return false;
    },
    data() {
        return {
            featureTypeOptions: FeatureCategories,
            checkedRows: [],
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
        resize() {
            window.dispatchEvent(new Event('resize'));
        },
        async correlationMatrix() {
            this.loading = true;
            try {
                let numericColumns = this.settings.items.filter(m => m.selected && m.type === FeatureCategories.Numerical.id).map(m => m.name);
                let values = this.settings.df.loc({ columns: numericColumns })
                values = values.dropNa({ axis: 1 }).values
                let matrix = new Matrix(values)
                let correlations = correlation(matrix)
                this.hasCorrelationMatrix = true;
                await chartController.correlationHeatmap('correlation_matrix', correlations.data, numericColumns);
                let mtx = new Clustermap();
                let [dendogram, orderedMatrix, columns] = await mtx.train(values, numericColumns, this.metric, this.method);
                await chartController.dendogramPlot('correlation_matrix_ordered', orderedMatrix, dendogram, columns, numericColumns);
                this.loading = false;
                setTimeout(() => {
                    window.dispatchEvent(new Event('resize'));
                }, 500);
            } catch (error) {
                this.loading = false;
                throw error
            }
        },
        applyChanges() {
            this.renderStats(true)
        },
        renderStats(update = false) {
            if (this.settings.df?.columns?.length > 0) {
                let numericColumns, categoricalColumns;
                if (!update) {
                    numericColumns = this.settings.items.filter(m => m?.type === FeatureCategories.Numerical.id).map(function (m) {
                        return {
                            name: m.name,
                            selected: true
                        }
                    });
                    categoricalColumns = this.settings.items.filter(m => m?.type !== FeatureCategories.Numerical.id).map(function (m) {
                        return {
                            name: m.name,
                            selected: true
                        }
                    });
                } else {
                    console.log(this.continuousFeaturesStats);
                    let features = this.continuousFeaturesStats.concat(this.categoricalFeaturesStats)
                    numericColumns = features.filter(m => m?.type === FeatureCategories.Numerical.id).map(function (m) {
                        return {
                            name: m.name,
                            selected: m.selected,
                            scaler: m.sclaer ?? 0
                        }
                    });
                    categoricalColumns = features.filter(m => m?.type
                        === FeatureCategories.Nominal.id
                        || m?.type === FeatureCategories.Ordinal.id).map(function (m) {
                            return {
                                name: m.name,
                                selected: m.selected
                            }
                        });

                    let selectedFeatures = features;
                    for (let i = 0; i < selectedFeatures.length; i++) {
                        this.settings.addFeature(selectedFeatures[i])
                    }
                    this.$emit('check-target')

                }


                let df = new DataFrame(this.settings.rawData);
                let datasetStats = ui.renderDatasetStats(df, numericColumns, categoricalColumns);
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