<template>
    <section v-if="this.settings?.items.length > 2">
        <b-message title="Principle Component Analysis" type="is-info" :closable="false">
            <b-field>
                <b-input v-model="numberOfComponents" size="is-small" type="number"
                    placeholder="Number of Components"></b-input>
                <p class="control">
                    <b-button :disabled="!numberOfComponents" size="is-small" @click="findPCA" type="is-info"
                        :loading="loadingPCA" label="Find PCA" />
                </p>
            </b-field>
            <div class="columns">
                {{ this.pcaContainers }}
                <div class="column is-6" v-for="(item, index) in this.pcaContainers" :key="index">
                    {{ item }}
                    <div id="pca-1" style="height: 300px;"></div>
                </div>
                <div class="column is-6">
                    <div id="scree_plot" style="height: 300px;"></div>
                </div>
            </div>
        </b-message>
        <b-message title="t-distributed stochastic neighbor embedding" type="is-info" :closable="false">
            <b-button @click="findTSNE" size="is-small" type="is-info" :loading="loadingTSNE" label="find t-SNE" />
            <div class="column is-6" id="dimensionality_reduction_panel_tsne">
                <div id="tsne">
                </div>
            </div>
        </b-message>
        <b-message title="Auto Encoder" type="is-info" :closable="false">
            <b-field>
                <b-input v-model="hiddenLayerSize" size="is-small" type="number"
                    placeholder="Hidden layer size"></b-input>
                <p class="control">
                    <b-button size="is-small" @click="autoEncoder" type="is-info" :loading="loadingAutoEncoder"
                        label="Find Auto Encoder" />
                </p>
            </b-field>
            <div class="column is-6" id="dimensionality_reduction_panel_tsne">
                <div id="autoencoder">
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
            numberOfComponents: null,
            loadingPCA: false,
            loadingTSNE: false,
            loadingAutoEncoder: false,
            hiddenLayerSize: null,
            hasPCA: false,
            pcaContainers: []
        }
    },
    methods: {
        async findPCA() {
            this.loadingPCA = true;
            this.hasPCA = true;
            let numericColumns = this.settings.items.filter(column => column.selected && column.type === 1).map(column => column.name);
            await chartController.draw_pca(this.dataframe.loc({ columns: numericColumns }).values,
                this.settings.isClassification ? this.dataframe.loc({ columns: [this.settings.modelTarget] }).values : [],
                this.dataframe.loc({ columns: [this.settings.modelTarget] }).values
                , this.numberOfComponents)
            console.log(this.numberOfComponents);

            this.loadingPCA = false;


        },
        async findTSNE() {
            this.loadingTSNE = true;
            let numericColumns = this.settings.items.filter(column => column.selected && column.type === 1).map(column => column.name);
            await chartController.plot_tsne(this.dataframe.loc({ columns: numericColumns }).values,
                this.settings.isClassification ? this.dataframe.loc({ columns: [this.settings.modelTarget] }).values : [], this.dataframe.loc({ columns: [this.settings.modelTarget] }).values);
            this.loadingTSNE = false;
        },
        async autoEncoder() {
            this.loadingAutoEncoder = true;

            const model = tensorflow.sequential();
            let numericColumns = this.settings.items.filter(m => m.type === FeatureCategories.Numerical.id).map(m => m.name);
            let unitsLength = numericColumns.length;
            let values = this.settings.df.loc({ columns: numericColumns }).values
            const encoder = tensorflow.layers.dense({
                units: Math.floor(unitsLength / 2),
                batchInputShape: [null, unitsLength],
                activation: 'relu',
                kernelInitializer: "randomNormal",
                biasInitializer: tensorflow.initializers.ones()
            });
            const decoder = tensorflow.layers.dense({ units: unitsLength, activation: 'linear' });
            model.add(encoder);
            model.add(decoder);
            await model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });
            console.log('compliled');

            const xs = tensorflow.tensor2d(values);
            // eslint-disable-next-line no-unused-vars
            let h = await model.fit(xs, xs, { epochs: 64, batchSize: 32, shuffle: false, validationSplit: 0.2 });
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
            console.log(data);
            chartController.drawAutoencoder(data, 0, 1,
                this.settings.isClassification
                    ? this.dataframe.loc({ columns: [this.settings.modelTarget] }).values : [])
            this.loadingAutoEncoder = false;

        }
    }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped></style>