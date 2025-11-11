<template>
    <section style="overflow-y: auto;overflow-x: auto;">
        <article class="message is-info">
            <div class="message-header p-2">Scatterplot Matrix <b-tooltip append-to-body
                    label="nrd method and guassian kernel is used for kernel density estimation." multilined>
                    <b-button icon-left="info" icon-pack="fas" size="is-small" type="is-dark" />
                </b-tooltip></div>
            <div class="message-body">
                <div id="scatterplot_mtx"></div>
                <button class="button is-small" @click="downlaodSPLOM()">Download plot</button>
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
                <div class="column is-12" v-if="this.settings.isClassification">
                    <h5 class="title is-7 has-text-left">Merge classes
                    </h5>
                    <b-table class="is-size-7" :data="classesInfo" :columns="classesInfoColumns" checkable
                        :row-class="(row, index) => row.mode <= 0.10 && 'has-text-danger'" :narrowed="true"
                        :checked-rows.sync="selectedClasses"></b-table>
                    <button @click="scaleData()" class="button mt-2 is-info is-small"
                        :disabled="selectedClasses?.length >= classesInfo?.length">Merge
                        Classes</button>
                    <button @click="scaleData(true)" class="button mt-2 mx-1 is-success is-small">reset</button>
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
import PCPComponent from '../visualization/parallel-coordinate-plot-component.vue'
import { getDanfo } from '@/utils/danfo_loader';

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
        downlaodSPLOM() {
            chartController.downloadPlot('scatterplot_mtx')
        },
        async updateClassesInfo() {
            const danfo = await getDanfo()

            this.df = new danfo.DataFrame(this.settings.rawData);
            this.settings.mergedClasses.forEach((classes) => {
                let newClass = classes.map(m => m.class).join('_');
                classes.forEach(cls => {
                    this.df.replace(cls.class, newClass, { columns: [this.settings.modelTarget], inplace: true })
                });
            })
            let targetValues = this.df.column(this.settings.modelTarget).values;
            let samplesLength = targetValues.length;
            let classes = new Set(...[targetValues]);
            let result = []
            classes.forEach(cls => {
                result.push({
                    class: cls,
                    mode: +(targetValues.filter(val => val === cls).length / samplesLength).toFixed(2)
                })
            });
            this.classesInfo = result.concat();
            this.classesInfoColumns = [{
                field: 'class',
                label: ' class'
            }, {
                field: 'mode',
                label: 'Samples in each class (%)'
            }]
        },
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
                    this.updateClassesInfo();
                }
                await this.$refs.coordinate_plot?.ParallelCoordinatePlot()
                this.isLoading = false;

            } catch (error) {
                let message = 'Something went wrong drawing data analysis plots' + error.toString()
                this.$buefy.toast.open(message);
                this.settings.addMessage({ message: message, type: 'warning' })
            }
        },
        async scaleData(reset = false) {
            const danfo = await getDanfo()

            this.df = new danfo.DataFrame(this.settings.rawData);
            if (reset) {
                this.settings.resetClassTransformations([]);
                this.updateClassesInfo();
                console.log(this.settings.mergedClasses);

            }
            if (this.settings.isClassification && this.selectedClasses?.length > 0) {
                let newClass = this.selectedClasses.map(m => m.class).join('_');
                this.selectedClasses.forEach(cls => {
                    this.df.replace(cls.class, newClass, { columns: [this.settings.modelTarget], inplace: true })
                });
                this.settings.setClassTransformation(this.selectedClasses)
                let message = { message: 'merged classes: ' + newClass, type: 'info' }
                this.$buefy.toast.open('merged classes: ' + newClass)
                this.settings.addMessage(message)
            }


            let validTransformations = this.settings.items.filter(feature => feature.selected && feature.type === 1 && feature.scaler != 0)
            this.isLoading = true;
            window.Plotly.purge('scatterplot_mtx')
            this.updateClassesInfo()
            applyDataTransformation(this.df, validTransformations.map(transformation => transformation.name), validTransformations);
            await this.dispalySPLOM(this.df)
            this.isLoading = false;
            this.selectedClasses = []

            if (validTransformations.length > 0) {
                let transformations = []
                validTransformations.forEach(transformation => {
                    let transformationInfo = Object.keys(ScaleOptions).find(key => ScaleOptions[key].id == transformation.scaler);
                    transformation.scalerLabel = transformationInfo
                    this.settings.addTransformation(transformation)
                    transformations.push(`feature: ${transformation['name']} ,scaler: ${transformation['scalerLabel']} `)
                });

                let message = { message: 'scaled fetures: <br> ' + transformations.join('_'), type: 'info' }
                this.$buefy.toast.open('scaled fetures: ' + transformations)
                this.settings.addMessage(message)
            } else {
                this.settings.resetTransformations();
            }

            this.$emit('coordinate-plot', true)
        },
        async initSPLOM() {
            const danfo = await getDanfo()

            this.df = new danfo.DataFrame(this.settings.rawData);
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