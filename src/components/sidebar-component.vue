<!-- eslint-disable no-unused-vars -->
<template>
    <div class="column is-3">
        <section v-if="!configureFeatures">
            <upload-component @dataframe="generateTargetDropdown"></upload-component>
            <div class="column is-12">
                <b-button @click="configureFeatures = !configureFeatures" size="is-small" type="is-primary is-light"
                    icon-pack="fas" icon-left="cog">Select Features {{ featureSettings.filter(feature =>
                        feature.selected).length }}</b-button>
                <b-field label="Target" :label-position="'on-border'">
                    <b-select :expanded="true" v-model="modelTarget" size="is-small">
                        <option v-for="option in columns" :value="option" :key="option">
                            {{ option }}
                        </option>
                    </b-select>
                </b-field>
                <b-field label="Imputation" :label-position="'on-border'">
                    <b-select :expanded="true" v-model="imputationOption" size="is-small">
                        <option v-for="option in imputationOptions" :value="option.id" :key="option.id">
                            {{ option.label }}
                        </option>
                    </b-select>
                </b-field>
                <b-field label="Cross Validation" :label-position="'on-border'">
                    <b-select :expanded="true" v-model="crossValidationOption" size="is-small">
                        <option v-for="option in crossValidationOptions" :value="option.id" :key="option.id">
                            {{ option.label }}
                        </option>
                    </b-select>
                </b-field>
                <b-field label="Model" :label-position="'on-border'">
                    <b-select :expanded="true" v-model="modelOption" size="is-small">
                        <option v-for="option in modelOptions" :value="option.id" :key="option.id">
                            {{ option.label }}
                        </option>
                    </b-select>
                </b-field>
            </div>
        </section>
        <section v-else>
            <b-button @click="configureFeatures = !configureFeatures" size="is-small" icon-pack="fas"
                icon-left="arrow-left" type="is-primary is-light">Select
                Features</b-button>
            <section>
                Configure Features :
                <table class="table is-narrow is-size-7 is-fullwidth">
                    <thead>
                        <tr>
                            <th>
                                select
                            </th>
                            <th>
                                name
                            </th>
                            <th>
                                scale
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(feature, index) in featureSettings" :key="index">
                            <td> <b-checkbox v-model="feature.selected"></b-checkbox>
                            </td>
                            <td>{{ feature.name }}</td>
                            <td>
                                <b-select :expanded="true" v-model="feature.type" size="is-small"
                                    @input="checkModelType">
                                    <option v-for="option in featureTypeOptions" :value="option.id" :key="option.id">
                                        {{ option.name }}
                                    </option>
                                </b-select>
                            </td>

                        </tr>
                    </tbody>
                </table>
            </section>
        </section>
    </div>
</template>

<script>
import UploadComponent from "./upload-component.vue";
import { Settings, FeatureCategories } from '../helpers/settings'

export default {
    name: 'SidebarComponent',
    components: {
        UploadComponent
    },
    props: {
        msg: String
    },

    data() {
        return {
            dataframe: null,
            configureFeatures: false,
            modelOptions: Settings.classification,
            imputationOption: 1,
            modelOption: 1,
            featureTypeOptions: FeatureCategories,
            crossValidationOption: 1,
            columns: [],
            modelTarget: null,
            imputationOptions: [{
                id: 1,
                label: 'Delete rows'
            },
            {
                id: 2,
                label: 'Mean and Mode'
            }, {
                id: 3,
                label: 'Linear regression'
            }, {
                id: 4,
                label: 'random forest'
            }],
            crossValidationOptions: [{
                id: 1,
                label: '70 % training - 30 % test'
            },
            {
                id: 2,
                label: 'No'
            }, {
                id: 3,
                label: 'k-fold'
            }],
            featureSettings: []
        }
    },
    methods: {
        generateTargetDropdown(e) {
            this.columns = e.columns;
            this.featureSettings = this.columns.map((column, index) => {
                return {
                    name: column,
                    selected: true,
                    type: e.dtypes[index] === 'string' ? FeatureCategories.Nominal.id : FeatureCategories.Numerical.id
                }
            })
            this.modelTarget = e.columns[e.columns.length - 1];
            this.$emit('dataframe', e);
        },
        checkModelType() {
            console.log('cc');
            let targetFeature = this.featureSettings.find(feature => feature.name == this.modelTarget);
            this.modelOptions = targetFeature.type === FeatureCategories.Numerical.id ? Settings.regression : Settings.classification;
        }
    },
    watch: {
        modelTarget: function name(target, oldVal) {
            if (target !== oldVal) {
                let targetFeature = this.featureSettings.find(feature => feature.name == target);
                this.modelOptions = targetFeature.type === FeatureCategories.Numerical.id ? Settings.regression : Settings.classification;
            }
        },


    }
}
</script>

<style></style>