<template>
    <section v-if="this.settings?.items.length > 2">
        <div class="message is-info">
            <div class="message-header p-2">Principle Component Analysis</div>
            <div class="message-body">
                <b-field>
                    <p class="control">
                        <b-button
                            :disabled="numberOfComponents < 2 || numberOfComponents > this.settings.items.filter(column => column.selected && column.type === 1)?.length"
                            size="is-small" @click="drawPCA()" type="is-info" :loading="loadingPCA" label="Fit PCA" />
                    </p>
                </b-field>
                <div class="columns is-multiline" id="pca_container">
                    <div class="column is-6">
                        <div id="scree_plot" style="height: 300px;"></div>
                    </div>
                    <div class="column is-6">
                        <div id="correlation_circle" style="height: 300px;"></div>
                    </div>
                    <button class="button is-small mt-1" v-if="this.pcaVarianceData"
                        @click="downloadExplainedVariance()">Download
                        PCA variance data</button>
                    <div class="column is-12" v-if="hasPCA">
                        <b-field label="Number of Components" :label-position="'on-border'">
                            <b-input v-model="numberOfComponents" size="is-small" type="number" min="2"
                                placeholder="Number of Components"></b-input>
                            <p class="control">
                                <b-button
                                    :disabled="numberOfComponents < 2 || x == y || numberOfComponents > this.settings.items.filter(column => column.selected && column.type === 1)?.length"
                                    size="is-small" @click="findPCA()" type="is-info" :loading="loadingPCA"
                                    label="Draw PCA" />
                            </p>
                        </b-field>
                    </div>
                    <div class="column is-12">
                        <div id="pca_matrix" style="overflow: auto;"></div>
                        <button class="button is-small mt-1" v-if="this.pcaData" @click="downloadPCA()">Download
                            PCA
                            data</button>
                        <button class="button is-small mt-1" v-if="this.pcaData" @click="downloadPCAPlot()">Download
                            plot</button>
                    </div>
                </div>
            </div>
        </div>
        <div class="message is-info">
            <div class="message-header p-2">t-distributed stochastic neighbor embedding</div>
            <div class="message-body">

                <b-field grouped>
                    <b-field label="Number of Components" :label-position="'on-border'">
                        <b-input v-model="componentsTSNE" size="is-small" type="number"
                            placeholder="Components"></b-input>
                    </b-field>
                    <b-field label="Seed" :label-position="'on-border'">
                        <b-input v-model="seedTSNE" size="is-small" type="number" placeholder="Seed"></b-input>
                        <p class="control">
                            <b-button @click="findTSNE" size="is-small" type="is-info" :loading="loadingTSNE"
                                label="Fit t-SNE" />
                        </p>
                    </b-field>
                </b-field>

                <div class="column is-6" id="dimensionality_reduction_panel_tsne">
                    <div id="tsne">
                    </div>
                </div>
            </div>
        </div>

        <div class="message is-info">
            <div class="message-header p-2">Autoencoder</div>
            <div class="message-body">
                <b-field grouped>
                    <b-field expanded>

                        <b-field label="Hidden layers size" :label-position="'on-border'">
                            <b-input v-model="hiddenLayerSize" size="is-small" type="number"
                                placeholder="Hidden layer size"></b-input>
                        </b-field>
                        <b-field label="x axis" :label-position="'on-border'">
                            <b-input v-model="autoEncoderX" size="is-small" type="number"
                                placeholder="x axis"></b-input>
                        </b-field>
                        <b-field label="y axis" :label-position="'on-border'">
                            <b-input v-model="autoEncoderY" size="is-small" type="number"
                                placeholder="y axis"></b-input>
                        </b-field>
                        <b-field label="iterations" :label-position="'on-border'">
                            <b-input v-model="iterations" size="is-small" type="number"
                                placeholder="iterations"></b-input>
                        </b-field>
                        <b-field label="encoder" :label-position="'on-border'">
                            <b-select v-model="encoderActivationFunction" size="is-small"
                                placeholder="Encoder Activation Function">
                                <option value="linear" id="linear">
                                    linear
                                </option>
                                <option value="sigmoid" id="sigmoid">
                                    sigmoid
                                </option>
                                <option value="relu" id="relu">
                                    RELU
                                </option>
                            </b-select>
                        </b-field>
                        <b-field label="decoder" :label-position="'on-border'">
                            <b-select size="is-small" v-model="decoderActivationFunction"
                                placeholder="Decoder Activation Function">
                                <option value="linear" id="linear">
                                    linear
                                </option>
                                <option value="sigmoid" id="sigmoid">
                                    sigmoid
                                </option>
                                <option value="relu" id="relu">
                                    RELU
                                </option>
                            </b-select>
                        </b-field>

                        <b-field :label-position="'on-border'">
                            <p class="control">
                                <b-button size="is-small" @click="autoEncoder" type="is-info"
                                    :loading="loadingAutoEncoder" label="Fit Autoencoder" />
                            </p>
                        </b-field>
                    </b-field>
                </b-field>
                <div class="column is-6" id="dimensionality_reduction_panel_tsne">
                    <div id="autoencoder" style="height: 300px;">
                    </div>
                </div>
            </div>
        </div>
    </section>
    <section v-else>
        <b-message type="is-danger" has-icon icon-pack="fas">
            There is no data to show.
        </b-message>
    </section>
</template>

<script>
import ChartController from '@/helpers/charts';
import { settingStore } from '@/stores/settings'
import { tensorflow, DataFrame } from 'danfojs/dist/danfojs-base';
import { $toCSV } from 'danfojs/dist/danfojs-base/io/browser/io.csv';

import { FeatureCategories } from '@/helpers/settings'

// eslint-disable-next-line no-unused-vars
let chartController = new ChartController();
export default {
    name: 'dmensionality-reduction-component',
    setup() {
        const settings = settingStore()

        return { settings }
    },
    props: {
        msg: String,
        dataframe: Object,
        columns: []
    },
    data() {
        return {
            numberOfComponents: 2,
            loadingPCA: false,
            loadingTSNE: false,
            x: 1, y: 2,
            loadingAutoEncoder: false,
            hiddenLayerSize: 2,
            componentsTSNE: 2,
            seedTSNE: 123,
            pcaData: null,
            pcaVarianceData: null,
            iterations: 200,
            encoderActivationFunction: 'linear',
            decoderActivationFunction: 'linear',
            autoEncoderX: 1,
            autoEncoderY: 2,
            hasPCA: false,
            pcaContainers: [],
            df: null,
        }
    },
    methods: {
        prepareData() {
            this.df = new DataFrame(this.settings.rawData);
            this.df.dropNa({ axis: 1, inplace: true })
            if (this.settings.isClassification && this.settings.mergedClasses?.length > 0) {
                this.settings.mergedClasses.forEach((classes) => {
                    let newClass = classes.map(m => m.class).join('_');
                    classes.forEach(cls => {
                        this.df.replace(cls.class, newClass, { columns: [this.settings.modelTarget], inplace: true })
                    });
                })
            }
        },
        async drawPCA() {
            try {
                this.numberOfComponents = null
                await this.findPCA(true);
            } catch (error) {
                this.loadingPCA = false;
                throw error;
            }

        },
        async findPCA(drawExplainedVariance = false) {
            try {
                this.prepareData()
                this.loadingPCA = true;
                this.pcaContainers = []
                let numericColumns = this.settings.items.filter(column => column.selected && column.type === 1).map(column => column.name);
                if (drawExplainedVariance == false) {
                    if (this.numberOfComponents == 2) {
                        this.pcaContainers.push([1, 2])
                    } else {
                        if (this.numberOfComponents == 3) {
                            this.pcaContainers.push([1, 2], [1, 3], [2, 3])
                        } else if (this.numberOfComponents > 3) {
                            this.pcaContainers.push([1, 2], [1, 3], [2, 3])
                            for (let i = 4; i <= this.numberOfComponents; i++) {
                                let j = 1;
                                while (j <= i - 1) {
                                    this.pcaContainers.push([j, i])
                                    j++
                                }
                            }
                        }
                    }
                } else {
                    this.numberOfComponents = numericColumns.length
                }

                let x = this.df.loc({ columns: numericColumns }).values;
                let pcaData = await chartController.draw_pca(
                    x,
                    this.settings.isClassification,
                    this.df.loc({ columns: [this.settings.modelTarget] }).values,
                    this.numberOfComponents,
                    this.pcaContainers,
                    numericColumns,
                    drawExplainedVariance
                )
                this.pcaData = pcaData[0]
                this.pcaVarianceData = pcaData[1]
                this.hasPCA = true;
                this.loadingPCA = false;

            } catch (error) {
                this.loadingPCA = false;
                throw error;
            }

        },
        downloadPCAPlot() {
            chartController.downloadPlot('pca_matrix');
        },
        downloadPCA() {
            let df = new DataFrame(this.pcaData)
            $toCSV(df, { filePath: "pca_data.csv", download: true });
        },
        downloadExplainedVariance() {
            let varianceData = [];
            for (let i = 1; i <= this.pcaVarianceData.length; i++) {
                const element = this.pcaVarianceData[i - 1];
                varianceData.push({ Components: i, ExplainedVariace: element })
            }
            let df = new DataFrame(varianceData)
            $toCSV(df, { filePath: "variance_data.csv", download: true });
        },
        async findTSNE() {
            try {
                this.prepareData()
                this.loadingTSNE = true;
                let numericColumns = this.settings.items.filter(column => column.selected && column.type === 1).map(column => column.name);
                await chartController.plot_tsne(this.df.loc({ columns: numericColumns }).values,
                    this.settings.isClassification
                    , this.df.loc({ columns: [this.settings.modelTarget] }).values, this.seedTSNE, this.componentsTSNE);
                this.loadingTSNE = false;
            } catch (error) {
                this.loadingTSNE = false;
                throw error;
            }

        },
        async autoEncoder() {
            this.prepareData()
            this.loadingAutoEncoder = true;
            const model = tensorflow.sequential();
            let numericColumns = this.settings.items.filter(m => m.type === FeatureCategories.Numerical.id).map(m => m.name);
            let unitsLength = numericColumns.length;
            let values = this.settings.df.loc({ columns: numericColumns }).values
            const encoder = tensorflow.layers.dense({
                units: +this.hiddenLayerSize,
                batchInputShape: [null, unitsLength],
                activation: this.encoderActivationFunction,
                kernelInitializer: "randomNormal",
                biasInitializer: "ones"
            });
            const decoder = tensorflow.layers.dense({ units: unitsLength, activation: this.decoderActivationFunction });
            model.add(encoder);
            model.add(decoder);
            await model.compile({ optimizer: 'sgd', loss: 'meanSquaredError' });
            const xs = tensorflow.tensor2d(values);
            // eslint-disable-next-line no-unused-vars
            let h = await model.fit(xs, xs, { epochs: +this.iterations, batchSize: 32, shuffle: true, validationSplit: 0.1 });
            xs.dispose();
            const tidyWrapper = tensorflow.tidy(() => {
                const predictor = tensorflow.sequential();
                predictor.add(encoder);
                let xs = tensorflow.tensor2d(values);
                let ret = predictor.predict(xs);
                xs.dispose();
                return ret.arraySync();
            });
            // eslint-disable-next-line no-unused-vars
            let autoencoderPredictions = await tidyWrapper;
            chartController.drawAutoencoder(autoencoderPredictions, this.autoEncoderX - 1, this.autoEncoderY - 1,
                this.settings.df.loc({ columns: [this.settings.modelTarget] }).values
                , this.settings.isClassification
            )
            this.loadingAutoEncoder = false;

        }
    },
    errorCaptured() {

    }
}
</script>
