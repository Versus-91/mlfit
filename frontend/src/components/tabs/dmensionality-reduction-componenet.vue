<template>
    <section v-if="this.settings?.items.length > 2">
        <b-message title="Principle Component Analysis" :type="'is-info'" :closable="false">
            <b-field>
                <b-input v-model="numberOfComponents" size="is-small" type="number" min="2"
                    placeholder="Number of Components"></b-input>
                <p class="control">
                    <b-button
                        :disabled="numberOfComponents < 2 || numberOfComponents > this.settings.items.filter(column => column.selected && column.type === 1)?.length"
                        size="is-small" @click="findPCA" type="is-info" :loading="loadingPCA" label="Fit PCA" />
                </p>
            </b-field>
            <div class="columns is-multiline" id="pca_container">
                <div class="column is-6">
                    <div id="scree_plot" style="height: 300px;"></div>
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
            <b-field label="Hidden layers size, plot x axis, plot y axis">
                <b-input v-model="hiddenLayerSize" size="is-small" type="number"
                    placeholder="Hidden layer size"></b-input>
                <b-input v-model="autoEncoderX" size="is-small" type="number" placeholder="Hidden layer size"></b-input>
                <b-input v-model="autoEncoderY" size="is-small" type="number" placeholder="Hidden layer size"></b-input>
                <p class="control">
                    <b-button size="is-small" @click="autoEncoder" type="is-info" :loading="loadingAutoEncoder"
                        label="Fit Autoencoder" />
                </p>
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
            loadingAutoEncoder: false,
            hiddenLayerSize: 2,
            iterationsTSNE: 200,
            autoEncoderX: 1,
            autoEncoderY: 2,
            hasPCA: false,
            pcaContainers: []
        }
    },
    methods: {
        async findPCA() {
            this.loadingPCA = true;
            this.hasPCA = true;
            for (let i = 0; i < this.pcaContainers.length; i++) {
                chartController.purge_charts('pca_' + i)
            }
            for (let i = 0; i < this.numberOfComponents; i++) {
                for (let j = i + 1; j < this.numberOfComponents; j++) {
                    let index = this.pcaContainers.findIndex(m => m[0] == i + 1 && m[1] == j + 1)
                    if (index === -1) {
                        this.pcaContainers.push([i + 1, j + 1]);
                    }
                }
            }
            let numericColumns = this.settings.items.filter(column => column.selected && column.type === 1).map(column => column.name);
            await chartController.draw_pca(
                this.dataframe.loc({ columns: numericColumns }).values,
                this.settings.isClassification ? this.dataframe.loc({ columns: [this.settings.modelTarget] }).values : [],
                this.dataframe.loc({ columns: [this.settings.modelTarget] }).values,
                this.numberOfComponents,
                this.pcaContainers)

            this.loadingPCA = false;


        },
        async findTSNE() {
            this.loadingTSNE = true;
            let numericColumns = this.settings.items.filter(column => column.selected && column.type === 1).map(column => column.name);
            await chartController.plot_tsne(this.dataframe.loc({ columns: numericColumns }).values,
                this.settings.isClassification ? this.dataframe.loc({ columns: [this.settings.modelTarget] }).values : []
                , this.dataframe.loc({ columns: [this.settings.modelTarget] }).values, this.iterationsTSNE);
            this.loadingTSNE = false;
        },
        async autoEncoder() {
            this.loadingAutoEncoder = true;
            const model = tensorflow.sequential();
            let numericColumns = this.settings.items.filter(m => m.type === FeatureCategories.Numerical.id).map(m => m.name);
            let unitsLength = numericColumns.length;
            let values = this.settings.df.loc({ columns: numericColumns }).values
            const encoder = tensorflow.layers.dense({
                units: +this.hiddenLayerSize,
                batchInputShape: [null, unitsLength],
                activation: 'relu',
                kernelInitializer: "glorotNormal",
                biasInitializer: "zeros"
            });
            const decoder = tensorflow.layers.dense({ units: unitsLength, activation: 'sigmoid' });
            model.add(encoder);
            model.add(decoder);
            await model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });
            const xs = tensorflow.tensor2d(values);
            // eslint-disable-next-line no-unused-vars
            let h = await model.fit(xs, xs, { epochs: 512, batchSize: 64, shuffle: false, validationSplit: 0.1 });
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
                this.dataframe.loc({ columns: [this.settings.modelTarget] }).values
                , this.settings.isClassification
            )
            this.loadingAutoEncoder = false;

        }
    }
}
</script>
