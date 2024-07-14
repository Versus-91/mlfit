<template>
    <section>
        <b-message title="Scatterplot Matrix" type="is-info" :closable="false">
            <button @click="dispalySPLOM">SPLOM</button>
            <div id="scatterplot_mtx" style="overflow-y: auto;"></div>
            <div class="columns my-1 ml-5 mt-5 is-multiline" :style="{ width: features.length * 100 + 'px' }">
                <div :style="{ width: column_width + '%' }" v-for="feature in features" :key="feature.id">
                    <b-field :label="feature.name" :label-position="'on-border'">
                        <b-select size="is-small" v-model="feature.scalerOption">
                            <option v-for="option in ScaleOptions" :value="option.id" :key="option.id">
                                {{ option.name }}
                            </option>
                        </b-select>
                    </b-field>
                </div>
            </div>
        </b-message>

    </section>
</template>

<script>
import ChartController from '@/helpers/charts';
import { settingStore } from '@/stores/settings'
import { ScaleOptions } from '@/helpers/settings'

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
            ScaleOptions: ScaleOptions,
            features: [],
        }
    },
    methods: {
        async dispalySPLOM() {
            let numericColumns = this.settings.items.filter(column => column.selected && column.type === 1).map(column => column.name);
            let categorical_columns = this.settings.items.filter(column => column.selected && column.type !== 1).map(column => column.name);
            let features = numericColumns.concat(categorical_columns);
            await chartController.ScatterplotMatrix(this.dataframe.loc({ columns: features }).values, features, this.dataframe.column(this.settings.modelTarget).values, categorical_columns.length,
                this.settings.modelType, numericColumns, categorical_columns, this.dataframe)
            this.features = features.map((feature, i) => {
                return {
                    id: i,
                    name: feature,
                    scalerOption: 0
                }
            })
        }
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