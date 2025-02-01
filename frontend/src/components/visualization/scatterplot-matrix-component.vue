<template>
    <section style="overflow-y: auto;overflow-x: auto;">
        <article class="message is-info">
            <div class="message-header">Scatterplot Matrix</div>
            <div class="message-body">
                <div id="scatterplot_mtx"></div>
                <div class="columns my-1 ml-5 mt-5 is-multiline" :style="{ width: features.length * 100 + 'px' }">
                    <div :style="{ width: column_width + '%' }"
                        v-for="feature in this.settings.items.filter(column => column.selected)" :key="feature.id">
                        <b-field :label="feature.name" :label-position="'on-border'" v-if="feature.type == 1"
                            class="ml-1">
                            <b-select @input="scaleData()" size="is-small" v-model="feature.scaler">
                                <option v-for="option in ScaleOptions" :value="option.id" :key="option.id">
                                    {{ option.name }}
                                </option>
                            </b-select>
                        </b-field>
                        <p class="title is-size-7 mt-1" v-else>{{ feature.name }}</p>
                    </div>
                    <br>
                </div>
                <div class="column is-12">
                    <parallel-coordinate-plot-component ref="coordinate_plot">
                    </parallel-coordinate-plot-component>
                </div>
                <div class="column is-12" v-if="this.settings.isClassification && classesInfo?.length > 2">
                    <h5 class="title is-7 has-text-left">Merge classes
                    </h5>
                    <b-table class="is-size-7" :data="classesInfo" :columns="classesInfoColumns" checkable
                        :narrowed="true" :checked-rows.sync="selectedClasses"></b-table>
                    <button @click="scaleData()" class="button mt-2 is-info is-small">Merge Classes</button>
                </div>

                <b-loading :is-full-page="false" v-model="isLoading"></b-loading>
            </div>
        </article>
    </section>
</template>

<script>
import ChartController from '@/helpers/charts';
import { settingStore } from '@/stores/settings'
import { ScaleOptions } from '@/helpers/settings'
import { applyDataTransformation } from '@/helpers/utils';
import Plotly from 'danfojs/node_modules/plotly.js-dist-min';
import { DataFrame } from 'danfojs/dist/danfojs-base';
import PCPComponent from '../visualization/parallel-coordinate-plot-component.vue'

let chartController = new ChartController();
export default {
    components: {
        'parallel-coordinate-plot-component': PCPComponent,
    },
    setup() {
        const settings = settingStore()
        return { settings }
    },
    name: 'ScatterplotMatrixComponent',
    props: {
        msg: String,
        update: {}
    },
    data() {
        return {
            isLoading: false,
            ScaleOptions: ScaleOptions,
            features: [],
            df: null,
            rawData: null,
            classesInfo: [],
            selectedClasses: [],
            classesInfoColumns: [],
        }
    },
    methods: {
        async dispalySPLOM(dataframe) {
            try {
                this.isLoading = true;
                let numericColumns = this.settings.items.filter(column => column.selected && column.type === 1).map(column => column.name);
                let categorical_columns = this.settings.items.filter(column => column.selected && column.type !== 1).map(column => column.name);
                let features = numericColumns.concat(categorical_columns);
                dataframe.dropNa({ axis: 1, inplace: true })
                await chartController.ScatterplotMatrix(dataframe.loc({ columns: features }).values, features, dataframe.column(this.settings.modelTarget).values, categorical_columns.length,
                    this.settings.isClassification, numericColumns, categorical_columns, this.dataframe)
                if (this.settings.isClassification) {

                    let targetValues = this.settings.df.column(this.settings.modelTarget).values;
                    let samplesLength = targetValues.length;
                    let classes = new Set(...[targetValues]);
                    let result = []
                    classes.forEach(cls => {
                        result.push({
                            class: cls,
                            mode: (targetValues.filter(val => val === cls).length / samplesLength).toFixed(2)
                        })
                    });
                    this.classesInfo = result;
                    this.classesInfoColumns = [{
                        field: 'class',
                        label: ' class'
                    }, {
                        field: 'mode',
                        label: 'Samples in each class (%)'
                    }]
                }
                this.$refs.coordinate_plot?.ParallelCoordinatePlot()
                this.isLoading = false;

            } catch (error) {
                this.$buefy.toast.open("Somthing went wrong");
            }
        },
        async scaleData() {
            this.df = new DataFrame(this.settings.rawData);
            if (this.settings.isClassification) {
                let newClass = this.selectedClasses.map(m => m.class).join('-');
                this.selectedClasses.forEach(cls => {
                    this.df.replace(cls.class, newClass, { columns: [this.settings.modelTarget], inplace: true })
                });
                this.settings.setClassTransformation(this.selectedClasses)
            }

            let validTransformations = this.settings.items.filter(feature => feature.selected && feature.type === 1 && feature.scaler != 0)
            this.isLoading = true;
            Plotly.purge('scatterplot_mtx')
            applyDataTransformation(this.df, validTransformations.map(transformation => transformation.name), validTransformations);
            await this.dispalySPLOM(this.df)
            this.isLoading = false;
            this.selectedClasses = []

            if (validTransformations.length > 0) {
                validTransformations.forEach(transformation => {
                    let transformationInfo = Object.keys(ScaleOptions).find(key => ScaleOptions[key].id == transformation.scaler);
                    transformation.scalerLabel = transformationInfo
                    this.settings.addTransformation(transformation)
                });
            } else {
                this.settings.resetTransformations();
            }
            console.log(validTransformations);

            this.$emit('coordinate-plot', true)
        },
        async initSPLOM() {
            this.df = new DataFrame(this.settings.rawData);
            this.df = await this.df.sample(this.df.$data.length, { seed: this.settings.getSeed });
            this.df.dropNa({ axis: 1, inplace: true })
            let numericColumns = this.settings.items.filter(column => column.selected && column.type === 1).map(function (column) {
                return { 'name': column.name, type: column.type }
            });
            let categorical_columns = this.settings.items.filter(column => column.selected && column.type !== 1).map(function (column) {
                return { 'name': column.name, type: column.type }
            })
            let features = numericColumns.concat(categorical_columns);
            this.features = features.map((feature, i) => {
                return {
                    id: i,
                    name: feature.name,
                    type: feature.type,
                    scaler: 0
                }
            })
            this.dispalySPLOM(this.df)

        }
    },
    created: async function () {
        await this.initSPLOM()
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