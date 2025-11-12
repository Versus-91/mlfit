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
import { ChartController } from '@/helpers/charts';
import { getDanfo } from '@/utils/danfo_loader';
import { applyDataTransformation } from '@/helpers/utils';

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
        async ParallelCoordinatePlot() {
            this.isLoading = true;
            const danfo = await getDanfo()
            const df = new danfo.DataFrame(this.settings.rawData);
            if (this.settings.isClassification && this.settings.classTransformations.length > 0) {
                this.settings.mergedClasses.forEach((classes) => {
                    let newClass = classes.map(m => m.class).join('_');
                    classes.forEach(cls => {
                        df.replace(cls.class, newClass, { columns: [this.settings.modelTarget], inplace: true })
                    });
                })
            }

            let validTransformations = this.settings.items.filter(column => column.selected && column.type === 1)
            window.Plotly.purge('parallel_coordinate_plot')
            applyDataTransformation(df, validTransformations.map(transformation => transformation.name), validTransformations);
            let numericColumns = this.settings.items.filter(column => column.selected && column.type === 1).map(column => column.name);
            this.chartController.parallelCoordinatePlot(df.loc({ columns: numericColumns }).values,
                df.column(this.settings.modelTarget).values, numericColumns, this.settings.isClassification)
            this.isLoading = false;

        }

    },
    mounted(){
        this.chartController = new ChartController(null, null)
    }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped></style>