<template>
    <section v-if="this.settings?.items.length > 2">
        <b-message title="Principle Component Analysis" :type="'is-info'" :closable="false">
            <b-field>
                <p class="control">
                    <b-button
                        :disabled="numberOfComponents < 2 || numberOfComponents > this.settings.items.filter(column => column.selected && column.type === 1)?.length"
                        size="is-small" @click="findPCA()" type="is-info" :loading="loadingPCA" label="Fit PCA" />
                </p>
            </b-field>
            <div class="columns is-multiline" id="pca_container">
                <div class="column is-6">
                    <div id="scree_plot" style="height: 300px;"></div>
                </div>
                <div class="column is-6">
                    <div id="correlation_circle" style="height: 300px;"></div>
                </div>
                <div class="column is-12" v-if="hasPCA">
                    <b-field label="Number of Components">
                        <b-input v-model="numberOfComponents" size="is-small" type="number" min="2"
                            placeholder="Number of Components"></b-input>
                        <p class="control">
                            <b-button
                                :disabled="numberOfComponents < 2 || x == y || numberOfComponents > this.settings.items.filter(column => column.selected && column.type === 1)?.length"
                                size="is-small" @click="drawPCA()" type="is-info" :loading="loadingPCA"
                                label="Draw PCA" />
                        </p>
                    </b-field>
                </div>
                <div class="column is-4" v-for="(item, index) in this.pcaContainers" :key="index">
                    <div :id="'pca_' + index" style="height: 300px;"></div>
                </div>
            </div>

        </b-message>
        <b-message title="t-distributed stochastic neighbor embedding" :type="'is-info'" :closable="false">

            <b-field label="Iterations">
                <b-input v-model="iterationsTSNE" size="is-small" type="number"
                    placeholder="number of iterations"></b-input>
                <p class="control">
                    <b-button @click="findTSNE" size="is-small" type="is-info" :loading="loadingTSNE"
                        label="Fit t-SNE" />
                </p>
            </b-field>
            <div class="column is-6" id="dimensionality_reduction_panel_tsne">
                <div id="tsne">
                </div>
            </div>
        </b-message>
        <b-message title="Autoencoder" :closable="false" :type="'is-info'">
            <b-field grouped>
                <b-field expanded>

                    <b-field label="Hidden layers size" custom-class="is-small">
                        <b-input v-model="hiddenLayerSize" size="is-small" type="number"
                            placeholder="Hidden layer size"></b-input>
                    </b-field>
                    <b-field label="x axis" custom-class="is-small">
                        <b-input v-model="autoEncoderX" size="is-small" type="number" placeholder="x axis"></b-input>
                    </b-field>
                    <b-field label="y axis" custom-class="is-small">
                        <b-input v-model="autoEncoderY" size="is-small" type="number" placeholder="y axis"></b-input>
                    </b-field>
                    <b-field label="iterations" custom-class="is-small">
                        <b-input v-model="iterations" size="is-small" type="number" placeholder="iterations"></b-input>
                    </b-field>
                    <b-field label="encoder" custom-class="is-small">
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
                    <b-field label="decoder" custom-class="is-small">
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

                    <b-field custom-class="is-small">
                        <p class="control">
                            <b-button size="is-small" @click="autoEncoder" type="is-info" :loading="loadingAutoEncoder"
                                label="Fit Autoencoder" />
                        </p>
                    </b-field>
                </b-field>
            </b-field>


            <div class="column is-6" id="dimensionality_reduction_panel_tsne">
                <div id="autoencoder" style="height: 300px;">
                </div>
            </div>

        </b-message>
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
import { tensorflow } from 'danfojs/dist/danfojs-base';
import { FeatureCategories } from '@/helpers/settings'
import { DataFrame } from 'danfojs/dist/danfojs-base';

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
            iterationsTSNE: 200,
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
                let newClass = this.settings.mergedClasses.map(m => m.class).join('-');
                this.settings.mergedClasses.forEach(cls => {
                    this.df.replace(cls.class, newClass, { columns: [this.settings.modelTarget], inplace: true })
                });
            }
        },
        async drawPCA(x = 1, y = 2) {
            await this.findPCA([[x, y]]);
        },
        async findPCA() {
            try {
                this.prepareData()
                this.loadingPCA = true;

                for (let i = 0; i < this.pcaContainers.length; i++) {
                    chartController.purge_charts('pca_' + i)
                }
                this.pcaContainers = []
                // for (let i = 0; i < this.numberOfComponents; i++) {
                //     for (let j = i + 1; j < this.numberOfComponents; j++) {
                //         let index = this.pcaContainers?.findIndex(m => m[0] == i + 1 && m[1] == j + 1)
                //         if (index != -1) {
                //             this.pcaContainers.push([i + 1, j + 1]);
                //         }
                //     }
                // }
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
                let numericColumns = this.settings.items.filter(column => column.selected && column.type === 1).map(column => column.name);
                let x = this.df.loc({ columns: numericColumns }).values;
                await chartController.draw_pca(
                    x,
                    this.settings.isClassification ? this.df.loc({ columns: [this.settings.modelTarget] }).values : [],
                    this.df.loc({ columns: [this.settings.modelTarget] }).values,
                    this.numberOfComponents,
                    this.pcaContainers,
                    numericColumns
                )
                this.hasPCA = true;
                this.loadingPCA = false;

            } catch (error) {
                this.loadingPCA = false;
                throw error;
            }

        },
        async findTSNE() {
            try {
                this.prepareData()
                this.loadingTSNE = true;
                let numericColumns = this.settings.items.filter(column => column.selected && column.type === 1).map(column => column.name);
                await chartController.plot_tsne(this.df.loc({ columns: numericColumns }).values,
                    this.settings.isClassification ? this.df.loc({ columns: [this.settings.modelTarget] }).values : []
                    , this.df.loc({ columns: [this.settings.modelTarget] }).values, this.iterationsTSNE);
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
                kernelInitializer: "glorotNormal",
                biasInitializer: "zeros"
            });
            const decoder = tensorflow.layers.dense({ units: unitsLength, activation: this.decoderActivationFunction });
            model.add(encoder);
            model.add(decoder);
            await model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });
            const xs = tensorflow.tensor2d(values);
            // eslint-disable-next-line no-unused-vars
            let h = await model.fit(xs, xs, { epochs: +this.iterations, batchSize: 64, shuffle: false, validationSplit: 0.1 });
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
            let data = await tidyWrapper;
            chartController.drawAutoencoder(data, this.autoEncoderX - 1, this.autoEncoderY - 1,
                this.df.loc({ columns: [this.settings.modelTarget] }).values
                , this.settings.isClassification
            )
            this.loadingAutoEncoder = false;

        }
    },
    errorCaptured() {

    }
}
</script>
