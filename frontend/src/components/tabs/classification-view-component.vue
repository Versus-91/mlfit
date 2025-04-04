<template>
    <article class="columns is-multiline">
        <div class="column is-12 mb-1">
            <b-message type="is-info " has-icon icon-pack="fas" class="has-text-left">
                <p class="my-1 is-size-7">
                    <span>Dataset Name : {{ result.datasetName }} , </span>
                    <span> Target variable : {{ result.target }}</span>
                </p>

                <p class="subtitle is-6 my-1 is-size-7">Features :</p>
                <p class="ml-2 my-1 subtitle is-6 is-size-7">Categorical Features : <span
                        v-for="feature in result.categoricalFeatures" :key="feature">
                        {{ feature + ', ' }}
                    </span>
                </p>
                <p class="ml-2 my-1 subtitle is-6 is-size-7">Numerical Features : <span
                        v-for="feature in result.numericColumns" :key="feature">
                        {{ feature + ', ' }}
                    </span></p>
                <p class="ml-2 my-1 subtitle is-6 is-size-7" v-show="result.transformations?.length > 0">Transformations
                    :
                    <span v-for="transformation in result.transformations" :key="transformation.name">
                        {{ transformation.name + ': ' + transformation.scalerLabel + ',' }}
                    </span>
                </p>
                <p class="is-size-7" v-for="(value, key) in result.options" :key="key">
                    {{ key }}: {{ value['value'] }}
                </p>
                <p class="subtitle my-1 is-size-7">Goodness of Fit :</p>
                <p class="ml-2 my-1 subtitle is-size-7">Accuracy : {{ result.metrics.accuracy.toFixed(2) }}</p>
                <p class="ml-2 my-1 subtitle is-size-7">f1 micro : {{ result.metrics.f1_micro.toFixed(2) }}</p>
                <p class="ml-2 my-1 subtitle is-size-7"> f1 macro :{{ result.metrics.f1_macro.toFixed(2) }}</p>
                <button class="button is-danger has-text-white is-small" style="color:#fff !important"
                    @click="deleteTab()">Delete </button>
                <button class="button is-success is-small" @click="toggleHelp(result.helpSectionId)">Method description
                </button>
                <button class="button is-info is-small" @click="downloadPythonCode()">Download the code</button>
            </b-message>
        </div>
        <div class="column is-12">
            <article class="message is-info">
                <div class="message-header p-2"> Confusion Matrix and PCA of predictions</div>
                <div class="message-body mx-1">
                    <div class="columns is-multiline">
                        <div class="column is-6 my-1" style="height: 400px;" :id="'confusion_matrix_' + result.id">
                        </div>
                        <div v-show="result.showProbas" class="column is-6 my-1" style="height: 400px;"
                            :id="'proba_plot_' + result.id">
                        </div>
                        <br>
                        <div v-show="result.showProbas" class="column is-6 my-1" style="height: 400px;"
                            :id="'roc_plot_' + result.id">
                        </div>

                        <div v-show="result.hasExplaination && result.name !== 'Logistic Regression'"
                            class="column is-6 my-1" style="height: 400px;" :id="'pfi_boxplot_' + result.id">
                        </div>
                    </div>
                </div>
            </article>
        </div>
        <div class="column is-12" v-show="result.name === 'Logistic Regression'">
            <div class="columns is-multiline">
                <div class="column is-7">
                    <div class="table-container">
                        <table
                            class="table has-text-centered nowrap is-striped is-bordered is-narrow is-hoverable is-size-7"
                            :id="'metrics_table_' + result.id">
                            <thead>
                                <tr>
                                    <th colspan="1"></th>
                                    <th colspan="3" class="has-text-centered">OLS</th>
                                    <th colspan="3" class="has-text-centered">lambda min</th>
                                    <th colspan="3" class="has-text-centered">lambda 1se</th>
                                </tr>
                                <tr>
                                    <th class="has-text-centered">name</th>
                                    <th>coef</th>
                                    <th>st.d.</th>
                                    <th><i>p</i>-value</th>
                                    <th>coef</th>
                                    <th>st.d.</th>
                                    <th><i>p</i>-value</th>
                                    <th>coef</th>
                                    <th>st.d.</th>
                                    <th><i>p</i>-value</th>
                                </tr>
                            </thead>
                            <tfoot class="has-text-centered" style=" font-weight: normal">
                                <tr>
                                    <th></th>
                                    <th colspan="3" class="has-text-centered"></th>
                                    <th colspan="3" class="has-text-centered"></th>
                                    <th colspan="3" class="has-text-centered"></th>

                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
                <div class="column is-5" :id="'parameters_plot_' + result.id">
                </div>
                <div class="column is-6" :id="'errors_' + result.id" style="height:250px">
                </div>
                <div class="column is-6" :id="'regularization_' + result.id" style="height:250px">
                </div>
            </div>
        </div>
        <div class="column is-12" v-show="result.hasExplaination && result.name !== 'Logistic Regression'">
            <article class="message is-info">
                <div class="message-header p-2"> Partial Dependence Plot</div>
                <div class="message-body mx-1">
                    <div class="columns is-multiline is-gapless">
                        <div class="column is-6" style="height: 400px;" :id="'knn_table_' + result.id"
                            v-if="result.name.toString().toLowerCase().includes('knn')">
                        </div>
                        <div :id="'pdp_containers_' + result.id"></div>
                    </div>
                    <br>
                </div>
            </article>
        </div>
    </article>

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
        toggleHelp(id) {
            this.settings.setActiveTab(3);
            setTimeout(() => {
                let el = document.getElementById(id);
                el.scrollIntoView({ behavior: 'smooth' })
            }, 500);
        },
        deleteTab() {
            this.$emit("delete-result", this.result.id)
        },
        downloadPythonCode() {
            let model_factory = new ModelFactory();
            let model = model_factory.createModel(this.result.snapshot.id, this.result.options);
            let pyCode = model.generatePythonCode()
            const blob = new Blob([pyCode], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'example.py';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
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
    errorCaptured(err, vm, info) {
        console.log(`cat EC: ${err.toString()}\ninfo: ${info}`);
        return false;
    }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped></style>