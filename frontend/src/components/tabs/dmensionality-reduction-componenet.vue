<template>
    <section v-if="this.settings?.items.length > 2">
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
            <div class="column is-6" id="dimensionality_reduction_panel_tsne">
                <b-field position="is-left">
                    <p class="control">
                        <b-button @click="findTSNE" size="is-small" type="is-info" :loading="findingTSNE"
                            label="Find PCA" />
                    </p>
                </b-field>
                <div id="tsne">
                </div>
            </div>
        </b-message>
    </section>
    <section v-else>
        <b-message type="is-danger" has-icon icon-pack="fas">
            Not enough data fro drawing plots.
        </b-message>
    </section>
</template>

<script>
import ChartController from '@/helpers/charts';
import { settingStore } from '@/stores/settings'

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
                this.settings.modelTask ? this.dataframe.loc({ columns: [this.settings.modelTarget] }).values : [],
                this.dataframe.loc({ columns: [this.settings.modelTarget] }).values
                , this.pcaX, this.pcaY)
            this.findingPCA = false;


        },
        async findTSNE() {
            this.findingTSNE = true;
            let numericColumns = this.settings.items.filter(column => column.selected && column.type === 1).map(column => column.name);
            await chartController.plot_tsne(this.dataframe.loc({ columns: numericColumns }).values,
                this.settings.modelTask ? this.dataframe.loc({ columns: [this.settings.modelTarget] }).values : [], this.dataframe.loc({ columns: [this.settings.modelTarget] }).values);
            this.findingTSNE = false;

        }
    }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped></style>