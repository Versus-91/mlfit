<!-- eslint-disable no-unused-vars -->
<template>
    <div class="column is-2">
        <section v-if="!configureFeatures">
            <upload-component @dataframe="generateTargetDropdown"></upload-component>
            <div class="column is-12">
                <b-field>
                    <b-button @click="configureFeatures = !configureFeatures" size="is-small" type="is-primary is-light"
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
                        :disabled="!dataframe" type=" is-light">
                        train</b-button>
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
/* eslint-disable no-unused-vars */

import UploadComponent from "./upload-component.vue";
import { Settings, FeatureCategories } from '../helpers/settings'
import { ModelFactory } from "@/helpers/model_factory";
import { settingStore } from '@/stores/settings'
import UI from '@/helpers/ui';
import { apply_data_transformation, handle_missing_values, encode_dataset, evaluate_classification } from '@/helpers/utils';
import { LabelEncoder, tensorflow } from 'danfojs/dist/danfojs-base';
import ChartController from '@/helpers/charts';

let chartController = new ChartController();
let ui = new UI(null, null)

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
            featureSettings: [],
            modelSettings: [],
        }
    },
    methods: {
        configureModel() {
            this.tuneModel = !this.tuneModel;
            for (const key in this.modelOptions) {
                const model = this.modelOptions[key];
                if (model.id === this.modelOption) {
                    for (const key in model.options) {
                        model.options[key].value = model.options[key]?.default;
                    }
                    this.modelConfigurations = model.options;
                }
            }
        },
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
            this.dataframe = e;
            this.$emit('dataframe', e)
            let selectedFeatures = this.featureSettings.filter(feature => feature.selected);
            for (let i = 0; i < selectedFeatures.length; i++) {
                this.settings.addFeature(selectedFeatures[i])
            }
        },
        checkModelType() {
            let targetFeature = this.featureSettings.find(feature => feature.name == this.modelTarget);
            this.settings.setModelType(targetFeature.type === FeatureCategories.Numerical.id ? false : true);
            this.modelOptions = targetFeature.type === FeatureCategories.Numerical.id ? Settings.regression : Settings.classification;
            let selectedFeatures = this.featureSettings.filter(feature => feature.selected);
            for (let i = 0; i < selectedFeatures.length; i++) {
                this.settings.addFeature(selectedFeatures[i])
            }
        },
        async train() {
            try {

                let len = this.dataframe.$data.length;
                let seed = this.seed;
                let dataset = await this.dataframe.sample(this.dataframe.$data.length, { seed: seed });
                let numericColumns = this.settings.items.filter(m => m.selected).map(m => m.name)
                let model_name = this.modelOption;
                const target = this.settings.modelTarget;
                dataset = handle_missing_values(dataset)
                dataset = apply_data_transformation(dataset, numericColumns);
                let selected_columns = this.settings.items.filter(m => m.selected).map(m => m.name)
                const index = selected_columns.findIndex(m => m === target)
                if (index === -1) {
                    selected_columns.push(target)
                }
                if (selected_columns.length < 2) {
                    throw new Error("most select at least 2 features")
                }
                let filterd_dataset = dataset.loc({ columns: selected_columns })
                filterd_dataset.dropNa({ axis: 1, inplace: true })
                const targets = filterd_dataset.column(target)
                filterd_dataset.drop({ columns: target, inplace: true })
                const cross_validation_setting = this.crossValidationOption;
                console.log(this.settings.items);
                filterd_dataset = encode_dataset(filterd_dataset, this.settings.items.filter(m => m.selected).filter(m => m.name !== this.settings.modelTarget).map(m => {
                    return {
                        name: m.name,
                        type: m.type
                    }
                }), model_name)
                let x_train, y_train, x_test, y_test;
                if (cross_validation_setting === 1) {
                    const limit = Math.ceil(len * 70 / 100)
                    const train_bound = `0:${limit}`
                    const test_bound = `${limit}:${len}`
                    x_train = filterd_dataset.iloc({ rows: [`0: ${limit}`] })
                    y_train = targets.iloc([train_bound])
                    x_test = filterd_dataset.iloc({ rows: [`${limit}: ${len}`] });
                    y_test = targets.iloc([test_bound]);
                } else if (cross_validation_setting === 2) {
                    x_train = filterd_dataset
                    y_train = targets
                    x_test = filterd_dataset
                    y_test = targets
                }
                
                let labelEncoder = new LabelEncoder()
                let uniqueLabels = [...new Set(y_train.values)];
                labelEncoder.fit(y_train.values)
                labelEncoder.transform(y_train.values)
                let encoded_y = labelEncoder.transform(y_train.values)
                let encoded_y_test = labelEncoder.transform(y_test.values)
                let model_factory = new ModelFactory();
                console.log(this.modelConfigurations);
                let model = model_factory.createModel(this.modelOption, this.modelConfigurations)
                let id = this.settings.getCounter
                this.training = true;
                let predictions = await model.train(x_train.values, encoded_y, x_test.values)
                this.settings.addResult({ name: this.modelOption + this.seed, type: this.settings.modelType, id: id })
                const evaluation_result = evaluate_classification(predictions, encoded_y_test, labelEncoder)
                const classes = labelEncoder.inverseTransform(Object.values(labelEncoder.$labels))
                await chartController.plot_confusion_matrix(tensorflow.tensor(predictions), tensorflow.tensor(encoded_y_test), classes, labelEncoder.transform(classes), id)
                this.settings.increaseCounter();
                await chartController.draw_classification_pca(x_test.values, y_test.values, evaluation_result, uniqueLabels, id)
                ui.predictions_table(x_test, y_test, labelEncoder, predictions, null, id);
                this.training = false;

            } catch (error) {
                this.training = false;
                throw error;
            }
        }
    },
    watch: {
        modelTarget: function name(target, oldVal) {
            if (target !== oldVal) {
                this.settings.setTarget(target)
                let targetFeature = this.featureSettings.find(feature => feature.name == target);
                this.settings.setModelType(targetFeature.type === FeatureCategories.Numerical.id ? false : true);
                this.modelOptions = targetFeature.type === FeatureCategories.Numerical.id ? Settings.regression : Settings.classification;
            }
        },


    }
}
</script>

<style>
.is-danger {
    color: red !important;
}
</style>