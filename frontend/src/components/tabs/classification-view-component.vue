<template>
    <div class="columns is-multiline">
        <div class="column is-12">
            <b-message type="is-info " has-icon icon-pack="fas" class="has-text-left" v-if="showResult">
                <p class="my-1 is-size-7">
                    <span>Dataset Name : {{ result.datasetName }} , </span>
                    <span> Target variable : {{ result.target }}</span>
                </p>

                <p class="subtitle is-6 my-1 is-size-7">Features :</p>
                <p class="ml-2 my-1 subtitle is-6 is-size-7">Categorical Features : <span
                        v-for="feature in result.categoricalFeatures " :key="feature">
                        {{ feature + ', ' }}
                    </span>
                </p>
                <p class="ml-2 my-1 subtitle is-6 is-size-7">Numerical Features : <span
                        v-for="feature in result.numericColumns " :key="feature">
                        {{ feature + ', ' }}
                    </span></p>
                <p class="ml-2 my-1 subtitle is-6 is-size-7">Transformations :
                    <span v-for="transformation in result.transformations" :key="transformation.name">
                        {{ transformation.name + ': ' + transformation.scaler + ',' }}
                    </span>
                </p>
                <p class="is-size-7" v-for="(value, key) in result.options" :key="key">
                    {{ key }}: {{ value['value'] }}
                </p>
                <p class="subtitle my-1 is-size-7">Goodness of Fit :</p>
                <p class="ml-2 my-1 subtitle is-size-7">Accuracy : {{ result.metrics[3].toFixed(2) }}</p>
                <p class="ml-2 my-1 subtitle is-size-7">f1 micro : {{ result.metrics[4].toFixed(2) }}</p>
                <p class="ml-2 my-1 subtitle is-size-7"> f1 macro :{{ result.metrics[2].toFixed(2) }}</p>
                <button class="button is-link is-outlined is-small" @click="deleteTab()">Delete </button>
                <button class="button is-link is-outlined is-small" @click="toggleHelp()">Help </button>
            </b-message>
            <b-message type="is-info " has-icon icon-pack="fas" class="has-text-left" v-else>
                <img src="/boost.png" alt="" v-if="result.name.toLowerCase().includes('boosting')">
                <img v-else-if="result.name.toLowerCase().includes('discriminant')" src="/gda.png" alt="">
                <button class="button is-link is-outlined is-small" @click="toggleHelp()">Back </button>
            </b-message>
        </div>
        <div class="column is-6" style="height: 400px;" :id="'confusion_matrix_' + result.id"></div>
        <div class="column is-6" style="height: 400px;" :id="'pca_results_' + result.id"></div>
        <div class="column is-6">
        </div>
        <div class="column is-6">
            <div class="select">
                <select name="pdp_variable" v-model="pdpFeature">
                    <option v-for="feature in settings.features" :key="feature.name"> {{
                        feature.name }}</option>
                </select>
            </div>
            <button class="button" @click="updatePartialDependencePlot">update</button>
        </div>
        <div class="column is-6 mt-0" style="height: 400px;" :id="'pfi_boxplot_' + result.id">
        </div>
        <div class="column is-6 mt-0" style="height: 400px;" :id="'pdp_plot_' + result.id">

        </div>
        <div class="column is-6" style="height: 350px;" :id="'knn_table_' + result.id"
            v-if="result.name.toString().includes('neighbour')">
        </div>
        <div class="column is-6" style="height: 350px;" :id="'roc_plot_' + result.id"
            v-if="result.name.toString().toLowerCase().includes('nai')">
        </div>
    </div>
</template>

<script>
import { settingStore } from '@/stores/settings'
import { ModelFactory } from "@/helpers/model_factory";

export default {

    setup() {
        const settings = settingStore()
        return { settings }
    },
    created() {
        this.pdpFeature = this.settings.features[0].name
    },
    data() {
        return {
            pdpFeature: null,
            showResult: true
        }
    },
    name: 'ClassificationViewComponent',
    methods: {
        toggleHelp() {
            this.showResult = !this.showResult
        },
        deleteTab() {
            this.$emit("delete-result", this.result.id)
        },
        async updatePartialDependencePlot() {
            let model_factory = new ModelFactory();
            let model = model_factory.createModel(this.result.snapshot.id, this.result.options);
            await model.train(this.result.snapshot.x, this.result.snapshot.y,
                this.result.snapshot.xt, this.result.snapshot.yt, this.result.snapshot.xFeatures, this.result.snapshot.categoricals, this.result.snapshot.xFeatures.findIndex(feature => feature == this.pdpFeature));
            model.chartController.plotPDP(this.result.id, model.pdp_averages, model.pdp_grid, this.result.snapshot.labels, this.pdpFeature);

        }
    },
    props: {
        result: {}
    },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped></style>