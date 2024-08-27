<template>
    <section>
        <div class="columns is-multiline">
            <div class="column is-12">
                <b-message type="is-info" has-icon icon-pack="fas" class="has-text-left">
                    <p class="my-1">
                        <span>Dataset Name : {{ result.datasetName }} , </span>
                        <span> Target variable : {{ result.target }}</span>
                    </p>

                    <p class="subtitle is-6 my-1">Features :</p>
                    <p class="ml-2 my-1 subtitle is-6 ">Categorical Features : <span
                            v-for="feature in result.categoricalFeatures " :key="feature">
                            {{ feature + ', ' }}
                        </span>
                    </p>
                    <p class="ml-2 my-1 subtitle is-6 ">Numerical Features : <span
                            v-for="feature in result.numericColumns " :key="feature">
                            {{ feature + ', ' }}
                        </span></p>
                    <p class="ml-2 my-1 subtitle is-6 ">Transformations :
                        <span v-for="transformation in result.transformations" :key="transformation.name">
                            {{ transformation.name + ': ' + transformation.scaler + ',' }}
                        </span>
                    </p>
                    <p v-for="(value, key) in result.options" :key="key">
                        {{ key }}: {{ value['value'] }}
                    </p>
                    <p class="subtitle is-6 my-1">Goodness of Fit :</p>
                    <p class="ml-2 my-1 subtitle is-6 ">Accuracy : {{ result.metrics[3].toFixed(2) }}</p>
                    <p class="ml-2 my-1 subtitle is-6 ">f1 micro : {{ result.metrics[4].toFixed(2) }}</p>
                    <p class="ml-2 my-1 subtitle is-6 "> f1 macro :{{ result.metrics[2].toFixed(2) }}</p>
                </b-message>
            </div>
            <div class="column is-6" style="height: 4%;" :id="'confusion_matrix_' + result.id"></div>
            <div class="column is-6" style="height: 400px;" :id="'pca_results_' + result.id"></div>
            <div class="column is-6" style="height: 350px;" :id="'knn_table_' + result.id"
                v-if="result.name.toString().includes('neighbour')">
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