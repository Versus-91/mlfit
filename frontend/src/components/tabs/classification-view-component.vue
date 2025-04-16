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
                <p class="ml-2 my-1 subtitle is-size-7">Accuracy : {{ result.metrics?.accuracy?.toFixed(2) }}</p>
                <p class="ml-2 my-1 subtitle is-size-7">f1 micro : {{ result.metrics?.f1_micro?.toFixed(2) }}</p>
                <p class="ml-2 my-1 subtitle is-size-7"> f1 macro :{{ result.metrics?.f1_macro?.toFixed(2) }}</p>
                <button class="button is-danger has-text-white is-small" style="color:#fff !important"
                    @click="deleteTab()">Delete </button>
                <button class="button is-success is-small" @click="toggleHelp(result.helpSectionId)">Method description
                </button>
                <button class="button is-info is-small" @click="downloadPythonCode()">Download the code</button>
            </b-message>
        </div>
        <template v-if="!hide">
            <div class="column is-12">
                <article class="message is-info">
                    <div class="message-header p-2"> Confusion Matrix and PCA of predictions</div>
                    <div class="message-body mx-1">
                        <div class="columns is-multiline is-gapless">
                            <div class="column is-6 my-1" style="height: 400px;" :id="'confusion_matrix_' + result.id">
                            </div>
                            <div v-show="result.showProbas" class="column is-6 my-1" style="height: 400px;"
                                :id="'proba_plot_' + result.id">
                            </div>
                            <br>
                            <div v-show="result.showProbas" class="column is-6 my-1" style="height: 400px;"
                                :id="'roc_plot_' + result.id">
                            </div>

                            <div v-show="result.hasExplaination && result.if !== 1" class="column is-6 my-1"
                                style="height: 400px;" :id="'pfi_boxplot_' + result.id">
                            </div>
                        </div>
                    </div>
                </article>
            </div>
            <div class="column is-12" v-if="result.name.includes('Logi.Reg')">
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
            <div class="column is-12" v-show="result.hasExplaination && !result.name.includes('Logi.Reg')">
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
        </template>
        <template v-else>
            In progress...
        </template>
    </article>

</template>

<script>
import { settingStore } from '@/stores/settings';
import { ModelFactory } from "@/helpers/model_factory";
import { concat } from 'danfojs/dist/danfojs-base';

import { $toCSV } from 'danfojs/dist/danfojs-base/io/browser/io.csv';

import axios from "axios";

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
            hide: false,
            fileName: null,
            showResult: true,
            intervalId: null
        }
    },
    name: 'ClassificationViewComponent',
    methods: {
        upload() {
            let vm = this;
            let formdata = new FormData();
            let dataframe = concat({ dfList: [this.result.snapshot.x, this.result.snapshot.xt], axis: 0 })
            let target = this.result.snapshot.y.concat(this.result.snapshot.yt)
            dataframe.addColumn(this.result.target, target, { inplace: true })
            let file = $toCSV(dataframe, { filePath: "pca_data.csv" });
            const blob = new Blob([file], { type: "text/csv" });
            formdata.append('file', blob, 'main.csv');

            return axios.post('http://127.0.0.1:5000/upload', formdata, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }
            ).then(function (res) {
                vm.fileName = res.data
                console.log('SUCCESS!!', vm.fileName);
                axios.get(`http://127.0.0.1:5000/run?file_name=${vm.fileName}&job_id=${vm.result.useHPC}&target=${vm.result.target}&seed=${vm.result.seed}`).then(() => {
                    vm.intervalId = setInterval(() => {
                        axios.get(`http://127.0.0.1:5000/progress?job_id=${vm.result.useHPC}`)
                            .then((res) => {
                                if (res.data != 'ongoing') {
                                    vm.hide = false;
                                    vm.result.model.predictions = res.data.predictions;
                                    vm.result.model.pdp_averages = res.data.pdp_avgs;
                                    vm.result.model.pdp_grid = res.data.pdp_grid;
                                    vm.result.model.importances = res.data.pfi;
                                    vm.result.model.fpr = res.data.fprs;
                                    vm.result.model.tpr = res.data.tprs;
                                    vm.result.model.auc = res.data.auc;
                                    vm.result.model.probas = res.data.probas;
                                    vm.result.model.visualize(vm.result.snapshot.xt, vm.result.snapshot.yt, vm.result.snapshot.labels,
                                        res.data.predictions, vm.result.encoder, vm.result.snapshot.x.columns, vm.result.snapshot.categoricals)
                                    clearInterval(vm.intervalId);
                                }
                            });
                    }, 3 * 1000)
                }).catch(function (err) {
                    console.log('FAILURE!!', err.data);
                });
            }).catch(function () {
                console.log('FAILURE!!');
            });
        },
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
    watch: {
        result: {
            handler() {
                if (this.result.useHPC) {
                    this.hide = true;
                    this.upload()
                }
            },
            immediate: true,
        }
    },
    errorCaptured(err, vm, info) {
        console.log(`cat EC: ${err.toString()}\ninfo: ${info}`);
        return false;
    },
    unmounted() {
        clearInterval(this.intervalId)
    }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped></style>