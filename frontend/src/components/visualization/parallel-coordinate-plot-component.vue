<template>
    <section class="my-1">
        <article class="message">
            <div class="message-header p-2">Parallel Coordinate Plot</div>
            <div class="message-body">
                <div id="parallel_coordinate_plot"></div>
            </div>
        </article>
    </section>
</template>

<script>
import { settingStore } from '@/stores/settings'
import { ScaleOptions } from '@/helpers/settings'
import ChartController from '@/helpers/charts';
let chartController = new ChartController();
import { DataFrame } from 'danfojs/dist/danfojs-base';
import { applyDataTransformation } from '@/helpers/utils';
import Plotly from 'danfojs/node_modules/plotly.js-dist-min';

export default {
    setup() {
        const settings = settingStore()
        return { settings }
    },
    name: 'ParallelCoordinatePlotComponent',
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
        }
    },
    methods: {
        ParallelCoordinatePlot() {
            console.log('ssss');

            this.isLoading = true;
            const df = new DataFrame(this.settings.rawData);
            if (this.settings.isClassification && this.settings.classTransformations.length > 0) {
                this.settings.mergedClasses.forEach((classes) => {
                    let newClass = classes.map(m => m.class).join('_');
                    classes.forEach(cls => {
                        df.replace(cls.class, newClass, { columns: [this.settings.modelTarget], inplace: true })
                    });
                })
            }

            let validTransformations = this.settings.items.filter(column => column.selected && column.type === 1)
            Plotly.purge('parallel_coordinate_plot')
            applyDataTransformation(df, validTransformations.map(transformation => transformation.name), validTransformations);
            let numericColumns = this.settings.items.filter(column => column.selected && column.type === 1).map(column => column.name);
            chartController.parallelCoordinatePlot(df.loc({ columns: numericColumns }).values,
                df.column(this.settings.modelTarget).values, numericColumns, this.settings.isClassification)
            this.isLoading = false;

        }

    },


}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped></style>