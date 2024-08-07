<template>
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
                <p class="ml-2 my-1 subtitle is-6 ">Numerical Features : <span v-for="feature in result.numericColumns "
                        :key="feature">
                        {{ feature + ', ' }}
                    </span></p>
                <p class="ml-2 my-1 subtitle is-6 ">Transformations :
                    <span v-for="transformation in result.transformations" :key="transformation.name">
                        {{ transformation.name + ': ' + transformation.scaler + ',' }}
                    </span>
                </p>
                <hr class="has-background-dark	my-2">
                <p class="subtitle is-6 my-1">Goodness of Fit :</p>
                <p class="ml-2 my-1 subtitle is-6 ">MSE : {{ result.metrics[0].toFixed(2) }}</p>
                <p class="ml-2 my-1 subtitle is-6 ">R2 : {{ result.metrics[1].toFixed(2) }}</p>

            </b-message>
        </div>
        <div class="columns is-multiline "
            v-if="result.name === 'Linear Regression' || result.name === 'Polynomial Regression'">
            <div class="column is-7">
                <div class="table-container">
                    <table
                        class="table has-text-centered nowrap is-striped is-bordered is-narrow is-hoverable is-size-7"
                        :id="'metrics_table_' + result.id">
                        <thead>
                            <tr>
                                <th colspan="1"></th>
                                <th colspan="3">OLS</th>
                                <th colspan="3">lambda min</th>
                                <th colspan="3">lambda 1se</th>
                            </tr>
                            <tr>
                                <th>name</th>
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
                                <th colspan="3"></th>
                                <th colspan="3"></th>
                                <th colspan="3"></th>

                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
            <div class="column is-5 mt-4" :id="'parameters_plot_' + result.id">
            </div>
            <div class="column is-12" :id="'metrics_' + result.id">
            </div>

            <div class="column is-3">
                <div :id="'errors_' + result.id" width="100%" style="height:200px"></div>
            </div>
            <div class="column is-3">
                <div :id="'regression_y_yhat_' + result.id" width="100%" style="height:200px">
                </div>
            </div>
            <div class="column is-3">
                <div :id="'regression_y_yhat_min_' + result.id" width="100%" style="height:200px">
                </div>
            </div>
            <div class="column is-3">
                <div :id="'regression_y_yhat_1se_' + result.id" width="100%" style="height:200px">
                </div>
            </div>
            <div class="column is-3">
                <div :id="'regularization_' + result.id" width="100%" style="height:200px"></div>
            </div>
            <div class="column is-3">
                <div :id="'regression_residual_' + result.id" width="100%" style="height:200px">
                </div>
            </div>
            <div class="column is-3">
                <div :id="'regression_residual_min_' + result.id" width="100%" style="height:200px">
                </div>
            </div>
            <div class="column is-3">
                <div :id="'regression_residual_1se_' + result.id" width="100%" style="height:200px">
                </div>
            </div>
            <div class="column is-3">
            </div>
            <div class="column is-3">
                <div :id="'qqplot_ols_' + result.id" width="100%" style="height:200px">
                </div>
            </div>
            <div class="column is-3">
                <div :id="'qqplot_min_' + result.id" width="100%" style="height:200px">
                </div>
            </div>
            <div class="column is-3">
                <div :id="'qqplot_1se_' + result.id" width="100%" style="height:200px">
                </div>
            </div>
        </div>
        <div class="column is-12" v-else>
            <div class="columns is-multiline">
                <div class="column is-6">
                    <div :id="'regression_y_yhat_' + result.id" width="100%" style="height:300px">
                    </div>
                </div>
                <div class="column is-6">
                    <div :id="'errors_' + result.id" width="100%" style="height:300px"></div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { settingStore } from '@/stores/settings'

export default {

    setup() {
        const settings = settingStore()
        return { settings }
    },
    name: 'regression-view-component',
    props: {
        result: {}
    },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped></style>