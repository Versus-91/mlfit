<template>
    <section v-if="this.settings?.items.length > 2">
        When $a \ne 0$, there are two solutions to \(ax^2 + bx + c = 0\) and they are
        $$x = {-b \pm \sqrt{b^2-4ac} \over 2a}.$$
        <b-message title="Principle Component Analysis" type="is-info" :closable="false">
            <b-field>
                <b-input v-model="pcaX" size="is-small" type="number" placeholder="X axis component"></b-input>
                <b-input v-model="pcaY" size="is-small" type="number" placeholder="Y axis component"></b-input>
                <p class="control">
                    <b-button :disabled="!pcaX || !pcaY" size="is-small" @click="findPCA" type="is-info"
                        :loading="findingPCA" label="Find PCA" />
                </p>
            </b-field>
            <div class="columns" v-if="hasPCA">
                <div class="column is-6">
                    <div id="pca-1" style="height: 300px;"></div>
                </div>
                <div class="column is-6">
                    <div id="scree_plot" style="height: 300px;"></div>
                </div>
            </div>
        </b-message>
        <b-message title="t-distributed stochastic neighbor embedding" type="is-info" :closable="false">
            <b-button @click="findTSNE" size="is-small" type="is-info" :loading="findingTSNE" label="find t-SNE" />
            <div class="column is-6" id="dimensionality_reduction_panel_tsne">
                <div id="tsne">
                </div>
            </div>
        </b-message>
        <b-message title="Auto Encoder" type="is-info" :closable="false">
            <b-field>
                <b-input v-model="pcaX" size="is-small" type="number" placeholder="Hidden layer size"></b-input>
                <p class="control">
                    <b-button size="is-small" @click="autoEncoder" type="is-info" :loading="findingPCA"
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
            pcaX: null,
            pcaY: null,
            findingPCA: false,
            hasPCA: false,
            findingTSNE: false

        }
    },
    methods: {
        async findPCA() {
            this.findingPCA = true;
            this.hasPCA = true;
            let numericColumns = this.settings.items.filter(column => column.selected && column.type === 1).map(column => column.name);
            console.log(numericColumns);
            await chartController.draw_pca(this.dataframe.loc({ columns: numericColumns }).values,
                this.settings.isClassification ? this.dataframe.loc({ columns: [this.settings.modelTarget] }).values : [],
                this.dataframe.loc({ columns: [this.settings.modelTarget] }).values
                , this.pcaX, this.pcaY)
            this.findingPCA = false;


        },
        async findTSNE() {
            this.findingTSNE = true;
            let numericColumns = this.settings.items.filter(column => column.selected && column.type === 1).map(column => column.name);
            await chartController.plot_tsne(this.dataframe.loc({ columns: numericColumns }).values,
                this.settings.isClassification ? this.dataframe.loc({ columns: [this.settings.modelTarget] }).values : [], this.dataframe.loc({ columns: [this.settings.modelTarget] }).values);
            this.findingTSNE = false;
        },
        async autoEncoder() {
            const model = tensorflow.sequential();
            tensorflow.random.set_seed(42)
            let numericColumns = this.settings.items.filter(m => m.type === FeatureCategories.Numerical.id).map(m => m.name);
            let values = this.settings.df.loc({ columns: numericColumns }).values
            const encoder = tensorflow.layers.dense({
                units: Math.floor(numericColumns.length / 2),
                batchInputShape: [null, numericColumns.length],
                activation: 'relu',
                kernelInitializer: tensorflow.initializers.glorotUniform(),
                biasInitializer: tensorflow.initializers.zeros()
            });
            const decoder = tensorflow.layers.dense({ units: numericColumns.length, activation: 'relu' });
            model.add(encoder);
            model.add(decoder);
            await model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });
            console.log('compliled');

            const xs = tensorflow.tensor2d(values);
            // eslint-disable-next-line no-unused-vars
            let h = await model.fit(xs, xs, { epochs: 100, batchSize: 32, shuffle: false, validationSplit: 0.2 });
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

        }
    }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped></style>