<template>
    <div class="columns is-multiline">
        <div class="column is-12">
            <b-message type="is-info" has-icon icon-pack="fas" class="has-text-left">
                {{ result.name }}
                <p>Target variable : {{ result.target }}</p>
                <p>Dataset Name : {{ result.target }}</p>
                <p>Categorical Features : {{ result.categoricalFeatures }}</p>
                <p>Numerical Features : {{ result.numericColumns }}</p>
                <p>Transformations :
                    <span v-for="transformation in result.transformations" :key="transformation.name">
                        {{ transformation.name + ': ' + transformation.scaler + ',' }}
                    </span>
                </p>
            </b-message>
        </div>
        <div class="column is-7">
            <div class="table-container">
                <table class="table has-text-centered nowrap is-striped is-bordered is-narrow is-hoverable is-size-7"
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