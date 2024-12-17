<template>
    <section class="my-1">
        <article class="message is-info">
            <div class="message-header">Parallel Coordinate Plot</div>
            <div class="message-body">
                <div id="parallel_coordinate_plot"></div>
                <button class="button is-info is-small" @click="ParallelCoordinatePlot()">
                    Parallel Coordinate Plot
                </button>
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
            const df = new DataFrame(this.settings.rawData);
            let numericColumns = this.settings.items.filter(column => column.selected && column.type === 1).map(column => column.name);
            chartController.parallelCoordinatePlot(df.loc({ columns: numericColumns }).values,
                df.column(this.settings.modelTarget).values, numericColumns, this.settings.isClassification)
        }

    },


}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped></style>