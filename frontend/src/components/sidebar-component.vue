<!-- eslint-disable no-unused-vars -->
<template>
    <div class="column is-2  has-background-light" style="height: 100%;">
        <!-- <button @click="impute()">Impute</button> -->
        <section v-if="!configureFeatures">
            <upload-component @uploaded="generateTargetDropdown"></upload-component>
            <div class="column is-12">
                <b-field>
                    <b-button @click="configureFeatures = true" size="is-small" type="is-primary is-light"
                        icon-pack="fas" icon-left="cog">Select Features {{ featureSettings.filter(feature =>
                            feature.selected).length }}</b-button>
                </b-field>
                <b-field label="Seed" :label-position="'on-border'">
                    <b-input v-model="seed" size="is-small" placeholder="Seed" type="number" min="0">
                    </b-input>
                </b-field>
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
                    <b-select :disabled="tuneModel" :expanded="true" v-model="modelOption" size="is-small">
                        <option v-for="option in modelOptions" :value="option.id" :key="option.id">
                            {{ option.label }}
                        </option>
                    </b-select>
                    <b-button @click="configureModel" size="is-small" icon-pack="fas"
                        :icon-left="!this.tuneModel ? 'cog' : 'arrow-left'"></b-button>
                </b-field>
                <section v-if="tuneModel" class="mx-1">
                    <b-field v-for="(option, i) in modelConfigurations" :key="i" :label="option.label"
                        :label-position="'on-border'">
                        <b-select v-model="option.value" :expanded="true" size="is-small"
                            v-if="option.type === 'select'">
                            <option v-for="(item, index) in option.values" :value="item.value" :key="index">
                                {{ item.label }}
                            </option>
                        </b-select>
                        <b-input size="is-small" v-model="option.value" type="number"
                            v-else-if="option.type === 'number'"></b-input>
                        <b-input size="is-small" v-model="option.value" type="text"
                            v-else-if="option.type === 'text'"></b-input>
                    </b-field>
                </section>
                <b-field>
                    <b-button @click="train" size="is-small" icon-pack="fas" icon-left="play" :loading="training"
                        :disabled="!dataframe">
                        train</b-button>
                </b-field>
                <b-loading :is-full-page="false" v-model="training"></b-loading>

            </div>
        </section>
        <section v-else>
            <b-button @click="updateFeatures()" size="is-small" icon-pack="fas" icon-left="arrow-left"
                type="is-primary is-light">{{ configureFeatures ? 'settings' : '' }}
            </b-button>
            <section>

                <p class="my-2 title is-size-7">Configure Features :</p>

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
                                    @input="checkmodelTask">
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
/* eslint-disable no-unused-vars */

import UploadComponent from "./upload-component.vue";
import { Settings, FeatureCategories, CV_OPTIONS } from '../helpers/settings'
import { ModelFactory } from "@/helpers/model_factory";
import { settingStore } from '@/stores/settings'
import { applyDataTransformation, handle_missing_values, encode_dataset, evaluate_classification } from '@/helpers/utils';
import { LabelEncoder, tensorflow } from 'danfojs/dist/danfojs-base';
import { toJSON, DataFrame } from 'danfojs';
import axios from "axios";

export default {
    name: 'SidebarComponent',
    setup() {
        const settings = settingStore()

        return { settings }
    },
    components: {
        UploadComponent
    },
    props: {
        msg: String
    },

    data() {
        return {
            training: false,
            tuneModel: false,
            seed: 1,
            dataframe: null,
            configureFeatures: false,
            modelOptions: Settings.classification,
            imputationOption: 1,
            modelOption: 1,
            featureTypeOptions: FeatureCategories,
            crossValidationOption: 1,
            columns: [],
            modelTarget: null,
            modelConfigurations: null,
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
                id: CV_OPTIONS.SPLIT,
                label: '70 % training - 30 % test'
            },
            {
                id: CV_OPTIONS.NO,
                label: 'No'
            }, {
                id: CV_OPTIONS.KFOLD,
                label: 'k-fold'
            }],
            featureSettings: [],
            modelSettings: [],
            modelName: ''
        }
    },
    methods: {
        updateFeatures() {
            this.configureFeatures = false;
            this.$emit('updateFeatures', true)
        },
        toggleTraining() {
            this.training = !this.training;
            this.$buefy.toast.open(
                {
                    duration: 3000,
                    message: this.training ? 'started training ' + this.modelName : 'Successully fited ' + this.modelName,
                    type: this.training ? 'is-info' : 'is-success',
                })
        },
        getDefaultModelConfiguration() {
            for (const key in this.modelOptions) {
                const model = this.modelOptions[key];
                if (model.id === this.modelOption) {
                    for (const key in model.options) {
                        model.options[key].value = model.options[key]?.default;
                    }
                    this.modelConfigurations = model.options;
                    this.modelName = model.label
                }
            }
        },
        configureModel() {
            this.tuneModel = !this.tuneModel;
            this.getDefaultModelConfiguration()
        },
        generateTargetDropdown() {
            this.dataframe = this.settings.getDataset;
            this.columns = this.dataframe.columns;
            this.featureSettings = this.columns.map((column, index) => {
                return {
                    name: column,
                    selected: true,
                    type: this.dataframe.dtypes[index] === 'string' ? FeatureCategories.Nominal.id : FeatureCategories.Numerical.id
                }
            })
            this.modelTarget = this.dataframe.columns[this.dataframe.columns.length - 1];
            let selectedFeatures = this.featureSettings.filter(feature => feature.selected);
            for (let i = 0; i < selectedFeatures.length; i++) {
                this.settings.addFeature(selectedFeatures[i])
            }
            this.$emit('updateFeatures', true)

        },
        checkmodelTask() {
            let targetFeature = this.featureSettings.find(feature => feature.name == this.modelTarget);
            this.settings.setmodelTask(targetFeature.type === FeatureCategories.Numerical.id ? false : true);
            this.modelOptions = targetFeature.type === FeatureCategories.Numerical.id ? Settings.regression : Settings.classification;
            let selectedFeatures = this.featureSettings.filter(feature => feature.selected);
            for (let i = 0; i < selectedFeatures.length; i++) {
                this.settings.addFeature(selectedFeatures[i])
            }
        },
        async train() {
            try {
                if (!this.modelConfigurations) {
                    this.getDefaultModelConfiguration()
                }
                let seed = this.seed;
                let categoricalFeatures = []
                let dataset = await this.dataframe.sample(this.dataframe.$data.length, { seed: seed });
                let numericColumns = this.settings.items.filter(m => m.selected && m.type === FeatureCategories.Numerical.id).map(m => m.name);
                const target = this.settings.modelTarget;
                dataset = handle_missing_values(dataset)
                dataset = applyDataTransformation(dataset, numericColumns, this.settings.transformationsList);
                let selected_columns = this.settings.items.filter(m => m.selected).map(m => m.name)
                const index = selected_columns.findIndex(m => m === target)
                if (index === -1) {
                    selected_columns.push(target)
                }
                let filterd_dataset = dataset.loc({ columns: selected_columns })
                const targets = filterd_dataset.column(target)
                filterd_dataset.drop({ columns: target, inplace: true })
                const cross_validation_setting = this.crossValidationOption;
                [filterd_dataset, categoricalFeatures] = encode_dataset(filterd_dataset, this.settings.items.filter(m => m.selected).filter(m => m.name !== this.settings.modelTarget).map(m => {
                    return {
                        name: m.name,
                        type: m.type
                    }
                }), this.modelName)

                let [x_train, y_train, x_test, y_test] = this.splitData(cross_validation_setting, filterd_dataset, targets);
                let uniqueLabels = [...new Set(y_train.values)];
                let labelEncoder, encoded_y, encoded_y_test;
                if (this.settings.classificationTask) {
                    [labelEncoder, encoded_y, encoded_y_test] = this.encodeTarget(y_train.values, y_test.values)
                } else {
                    encoded_y = y_train.values;
                    encoded_y_test = y_test.values;
                }
                let model_factory = new ModelFactory();
                let model = model_factory.createModel(this.modelOption, this.modelConfigurations)
                model.id = this.settings.getCounter
                this.toggleTraining()
                let predictions = await model.train(x_train.values, encoded_y, x_test.values, encoded_y_test, x_train.columns, categoricalFeatures, 0);
                let metrics = await model.evaluateModel(encoded_y_test, predictions, uniqueLabels)

                this.settings.addResult({
                    id: model.id,
                    helpSectionId: model.helpSectionId,
                    snapshot: {
                        x: x_train.values,
                        y: encoded_y,
                        xt: x_test.values,
                        yt: encoded_y_test,
                        xFeatures: x_train.columns,
                        categoricals: categoricalFeatures,
                        id: this.modelOption,
                        labels: uniqueLabels
                    },
                    name: this.modelName,
                    datasetName: this.settings.getDatasetName,
                    modelTask: this.settings.classificationTask,
                    metrics: metrics,
                    options: this.modelConfigurations,
                    target: target,
                    categoricalFeatures: this.settings.items.filter(m => m.selected && m.type !== FeatureCategories.Numerical.id).map(m => m.name),
                    numericColumns: numericColumns,
                    transformations: [...this.settings.transformationsList.filter(feature => feature.type != 0)],
                    tables: model.tables,
                    plots: model.plots,

                });
                this.settings.setActiveTab(2);
                setTimeout(async () => {
                    this.settings.setResultActiveTab(model.id);
                    window.dispatchEvent(new Event('resize'));
                }, 500);
                await model.visualize(x_test, encoded_y_test, uniqueLabels, predictions, labelEncoder, x_train.columns, categoricalFeatures)
                this.settings.increaseCounter();
                this.toggleTraining();
            } catch (error) {
                this.training = false;
                this.$buefy.toast.open(
                    {
                        duration: 3000,
                        message: 'Failed to fit the model',
                        type: 'is-warning',
                    })
                throw error;
            }
        },
        impute() {
            this.training = true;
            axios.post('http://127.0.0.1:5000/missforest', {
                data: toJSON(this.dataframe),
                categoricalFeatures: this.settings.items.filter(m => m.selected && m.type !== FeatureCategories.Numerical.id).map(m => m.name)
            }).then(res => {
                let df = new DataFrame(res.data);
                this.dataframe = df
                this.settings.setDataframe(df);
                this.training = false;
            })
        }
    },
    created: function () {
        let x_train, y_train, x_test, y_test;
        this.splitData = function (cross_validation_setting, filterd_dataset, targets) {
            let len = filterd_dataset.$data.length
            if (cross_validation_setting === CV_OPTIONS.SPLIT) {
                const limit = Math.ceil(len * 70 / 100)
                const train_bound = `0:${limit}`
                const test_bound = `${limit}:${len}`
                x_train = filterd_dataset.iloc({ rows: [`0: ${limit}`] })
                y_train = targets.iloc([train_bound])
                x_test = filterd_dataset.iloc({ rows: [`${limit}: ${len}`] });
                y_test = targets.iloc([test_bound]);
            } else if (cross_validation_setting === CV_OPTIONS.NO) {
                x_train = filterd_dataset
                y_train = targets
                x_test = filterd_dataset
                y_test = targets
            }
            return [x_train, y_train, x_test, y_test]
        }
        this.encodeTarget = function (y_train, y_test) {
            let labelEncoder = new LabelEncoder()
            labelEncoder.fit(y_train)
            labelEncoder.transform(y_train)
            let encoded_y = labelEncoder.transform(y_train)
            let encoded_y_test = labelEncoder.transform(y_test)
            return [labelEncoder, encoded_y, encoded_y_test]
        }
    },
    watch: {
        modelTarget: function name(target, oldVal) {
            if (target !== oldVal && target) {
                this.settings.setTarget(target)
                let targetFeature = this.featureSettings.find(feature => feature.name == target);
                this.settings.setmodelTask(targetFeature.type === FeatureCategories.Numerical.id ? false : true);
                this.modelOptions = targetFeature.type === FeatureCategories.Numerical.id ? Settings.regression : Settings.classification;
            }
        },
        modelOption: function () {
            this.modelConfigurations = null
        },


    }
}
</script>

<style>
.is-danger {
    color: red !important;
}
</style>