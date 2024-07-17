<template>
    <section style="overflow-y: auto;overflow-x: auto;">
        <div id="scatterplot_mtx"></div>
        <div class="columns my-1 ml-5 mt-5 is-multiline" :style="{ width: features.length * 100 + 'px' }">
            <div :style="{ width: column_width + '%' }" v-for="feature in features" :key="feature.id">
                <b-field :label="feature.name" :label-position="'on-border'">
                    <b-select size="is-small" v-model="feature.scaler">
                        <option v-for="option in ScaleOptions" :value="option.id" :key="option.id">
                            {{ option.name }}
                        </option>
                    </b-select>
                </b-field>
            </div>
            <button @click="scaleData(dataframe?.copy())" class="button mt-2 is-info is-small">update</button>
        </div>
        <b-loading :is-full-page="false" v-model="isLoading"></b-loading>
    </section>
</template>

<script>
import ChartController from '@/helpers/charts';
import { settingStore } from '@/stores/settings'
import { ScaleOptions } from '@/helpers/settings'
import { applyDataTransformation } from '@/helpers/utils';
import Plotly from 'plotly.js-dist-min';

let chartController = new ChartController();
export default {
    setup() {
        const settings = settingStore()
        return { settings }
    },
    name: 'ScatterplotMatrixComponent',
    props: {
        msg: String,
        dataframe: Object
    },
    data() {
        return {
            isLoading: false,
            ScaleOptions: ScaleOptions,
            features: [],
        }
    },
    methods: {
        async dispalySPLOM(dataframe) {
            let numericColumns = this.settings.items.filter(column => column.selected && column.type === 1).map(column => column.name);
            let categorical_columns = this.settings.items.filter(column => column.selected && column.type !== 1).map(column => column.name);
            let features = numericColumns.concat(categorical_columns);
            dataframe.dropNa({ axis: 1, inplace: true })
            await chartController.ScatterplotMatrix(dataframe.loc({ columns: features }).values, features, this.dataframe.column(this.settings.modelTarget).values, categorical_columns.length,
                this.settings.modelTask, numericColumns, categorical_columns, dataframe)
        },
        async scaleData(dataframe) {
            let validTransformations = this.features.filter(m => m.scaler !== 0);
            if (validTransformations?.length > 0) {
                this.isLoading = true;
                Plotly.purge('scatterplot_mtx')
                applyDataTransformation(dataframe, validTransformations.map(transformation => transformation.name), validTransformations);
                await this.dispalySPLOM(dataframe)
                this.isLoading = false;
                validTransformations.forEach(transformation => {
                    this.settings.addTransformation(transformation)
                });
                return;
            }
            this.$buefy.toast.open("No transformation available.")
        }
    },
    created: function () {
        let numericColumns = this.settings.items.filter(column => column.selected && column.type === 1).map(column => column.name);
        let categorical_columns = this.settings.items.filter(column => column.selected && column.type !== 1).map(column => column.name);
        let features = numericColumns.concat(categorical_columns);
        this.features = features.map((feature, i) => {
            return {
                id: i,
                name: feature,
                scaler: 0
            }
        })
        this.dispalySPLOM(this.dataframe.copy())
    },
    computed: {
        column_width: {
            get() {
                return this.features.length === 0 ? 0 : 100 / this.features.length
            }
        }
    }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped></style>