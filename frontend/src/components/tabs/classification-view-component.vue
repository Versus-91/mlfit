<template>
    <section>
        <div class="columns is-multiline">
            <div class="column is-12">
                <b-message type="is-info" has-icon icon-pack="fas" class="has-text-left">
                    <p>Target variable : {{ result.target }}</p>
                    <p>Dataset Name : {{ result.target }}</p>
                    <p>Categorical Features : {{ result.categoricalFeatures }}</p>
                    <p>Numerical Features : {{ result.numericColumns }}</p>
                    <p>Transformations :
                        <span v-for="transformation in result.transformations" :key="transformation.name">
                            {{ transformation.name + ': ' + transformation.scaler + ',' }}
                        </span>
                    </p>
                    <p>Accuracy : {{ result.metrics[3].toFixed(2) }}</p>
                    <p>f1 micro : {{ result.metrics[4].toFixed(2) }}</p>
                    <p> f1 macro :{{ result.metrics[2].toFixed(2) }}</p>
                </b-message>
            </div>
            <div class="column is-6" :id="'confusion_matrix_' + result.id"></div>
            <div class="column is-6" :id="'pca_results_' + result.id"></div>
            <div class="column is-6" :id="'knn_table_' + result.id" v-if="result.name.toString().includes('neighbour')">
            </div>
        </div>
    </section>
</template>

<script>
import { settingStore } from '@/stores/settings'

export default {

    setup() {
        const settings = settingStore()
        return { settings }
    },
    name: 'ClassificationViewComponent',
    props: {
        result: {}
    },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped></style>