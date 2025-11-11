<!-- eslint-disable no-unused-vars -->
<template>
    <div class="column is-2  has-background-info-light	" style="height: 100%;">
        <!-- <button @click="impute()">Impute</button> -->
        <figure class="image is-96x96">
            <img src="/logo.png" />
        </figure>
        <section>
            <upload-component @uploaded="generateTargetDropdown" @uploaded-file="setFile"></upload-component>
            <div class="column is-12">
                <b-field label="Seed" :label-position="'on-border'">
                    <b-input v-model="seed" size="is-small" placeholder="Seed" type="number" min="0">
                    </b-input>
                </b-field>
                <b-field label="Target" :label-position="'on-border'">
                    <b-select :expanded="true" v-model="modelTarget" @input="checkmodelTask" size="is-small">
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
                            {{ option.title }}
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
                    <b-checkbox v-model="dataScalingBehavior" size="is-small">Standardize by default</b-checkbox>
                </b-field>
                <b-field>
                    <b-checkbox v-model="explainModel" size="is-small">Explain the model</b-checkbox>
                </b-field>
                <b-field>
                    <b-checkbox v-model="usePCAs" size="is-small">Use PC components</b-checkbox>
                </b-field>
                <b-field v-if="usePCAs" label="Number of Components" :label-position="'on-border'">
                    <b-input size="is-small" v-model="numberOfComponents" type="number"></b-input>
                </b-field>
                <b-field>
                    <b-checkbox v-model="useHPC" size="is-small">Use HPC resources</b-checkbox>
                </b-field>
                <b-field>
                    <b-button @click="train" size="is-small" icon-pack="fas" icon-left="play" :loading="training"
                        :disabled="!dataframe || modelOption == null">
                        train</b-button>
                    <button :disabled="!useHPC" class="button is-small" @click="upload()">Upload to HPC</button>
                </b-field>
                <b-loading :is-full-page="false" v-model="training"></b-loading>
            </div>
        </section>
    </div>
</template>

<script>
/* eslint-disable no-unused-vars */

import UploadComponent from "./upload-component.vue";
import { Settings, FeatureCategories, CV_OPTIONS } from '../helpers/settings'
import PCA from '@/helpers/dimensionality-reduction/pca';

import { ModelFactory } from "@/helpers/model_factory";
import { settingStore } from '@/stores/settings'
import { applyDataTransformation, handle_missing_values, encode_dataset, evaluate_classification } from '@/helpers/utils';
import { LabelEncoder, concat, DataFrame, toJSON } from 'danfojs';
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
            dataScalingBehavior: false,
            explainModel: true,
            training: false,
            tuneModel: false,
            numberOfComponents: 0,
            usePCAs: false,
            useHPC: false,
            seed: 123,
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
            modelName: '',
            file: null
        }
    },
    methods: {
        setFile(e) {
            this.file = e
        },
        upload() {
            let formdata = new FormData();
            this.settings.rawData
            formdata.append('file', this.file);
            console.log(this.file);

            axios.post('http://127.0.0.1:5000/upload', formdata, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }
            ).then(function () {
                console.log('SUCCESS!!');
            }).catch(function () {
                console.log('FAILURE!!');
            });
        },
        updateFeatures() {
            this.configureFeatures = false;
            this.$emit('updateFeatures', true)
        },
        toggleTraining() {
            this.training = !this.training;
            let message = this.training ? 'Started training ' + this.modelName : 'Successully fitted ' + this.modelName;
            this.$buefy.toast.open(
                {
                    duration: 5000,
                    message: this.training ? 'Started training ' + this.modelName : 'Successully fitted ' + this.modelName,
                    type: this.training ? 'is-info' : 'is-success',
                })
            this.settings.addMessage({ message: message, type: 'info' });
        },
        getDefaultModelConfiguration() {
            for (const key in this.modelOptions) {
                const model = this.modelOptions[key];
                if (model.id === this.modelOption) {
                    for (const key in model.options) {
                        model.options[key].value = model.options[key]?.default;
                    }
                    this.modelConfigurations = model.options;
                    this.modelName = model.title
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
            this.settings.setTarget(this.modelTarget)
            let selectedFeatures = this.featureSettings.filter(feature => feature.selected);
            for (let i = 0; i < selectedFeatures.length; i++) {
                this.settings.addFeature(selectedFeatures[i])
            }
            this.$emit('updateFeatures', true)

        },
        checkmodelTask() {
            console.log(this.modelTarget);

            this.settings.setTarget(this.modelTarget)
            let targetFeature = this.settings.items.find(feature => feature.name == this.modelTarget);
            if (!targetFeature.selected) {
                let message = 'Target is not selected'
                this.$buefy.toast.open(
                    {
                        duration: 3000,
                        message: message,
                        type: 'is-warning',
                    })
                this.settings.addMessage({ message: message, type: 'warning' });
                return
            }
            this.settings.setmodelTask(targetFeature.type === FeatureCategories.Numerical.id ? false : true);
            this.modelOptions = targetFeature.type === FeatureCategories.Numerical.id ? Settings.regression : Settings.classification;
            // let selectedFeatures = this.featureSettings.filter(feature => feature.selected);
            // for (let i = 0; i < selectedFeatures.length; i++) {
            //     this.settings.addFeature(selectedFeatures[i])
            // }
        },
        async train() {
            try {
                if (!this.modelConfigurations) {
                    this.getDefaultModelConfiguration()
                }
                let seed = +this.seed;
                this.settings.setSeed(seed)
                let categoricalFeatures = []
                let dataset = null;
                this.dataframe = new DataFrame(this.settings.rawData);
                dataset = await this.dataframe.sample(this.dataframe.$data.length, { seed: seed });

                let numericColumns = this.settings.items.filter(m => m.selected && m.type === FeatureCategories.Numerical.id).map(m => m.name);
                const target = this.settings.modelTarget;
                dataset = handle_missing_values(dataset)
                dataset = applyDataTransformation(dataset, numericColumns, this.settings.transformationsList);
                if (this.dataScalingBehavior) {
                    let transformations = []
                    for (let i = 0; i < numericColumns.length; i++) {
                        transformations.push({ name: numericColumns[i], scaler: '1' })
                    }
                    dataset = applyDataTransformation(dataset, numericColumns, transformations);
                }
                let selected_columns = this.settings.items.filter(m => m.selected).map(m => m.name)
                const index = selected_columns.findIndex(m => m === target)
                if (index === -1) {
                    selected_columns.push(target)
                }

                let filterd_dataset = dataset.loc({ columns: selected_columns })
                // add class transformation
                if (this.settings.isClassification) {
                    let selectedClasses = this.settings.mergedClasses
                    if (selectedClasses?.length > 0) {
                        this.settings.mergedClasses.forEach((classes) => {
                            let newClass = classes.map(m => m.class).join('_');
                            classes.forEach(cls => {
                                filterd_dataset.replace(cls.class, newClass, { columns: [this.settings.modelTarget], inplace: true })
                            });
                        })
                    }
                }


                const targets = filterd_dataset.column(target)
                filterd_dataset.drop({ columns: target, inplace: true })



                const cross_validation_setting = this.crossValidationOption;

                [filterd_dataset, categoricalFeatures] = encode_dataset(filterd_dataset, this.settings.items.filter(m => m.selected).filter(m => m.name !== this.settings.modelTarget).map(m => {
                    return {
                        name: m.name,
                        type: m.type
                    }
                }))
                let x_train, y_train, x_test, y_test;
                if (cross_validation_setting === CV_OPTIONS.KFOLD &&
                    (this.modelName != Settings.classification.logistic_regression.title || this.modelName != Settings.regression.linear_regression.title)) {
                    let performances = [];
                    for (let i = 1; i < 6; i++) {
                        [x_train, y_train, x_test, y_test] = this.kfoldSplit(filterd_dataset, targets, i);
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
                        model.hasExplaination = false;
                        model.id = this.settings.getCounter
                        this.toggleTraining()
                        let predictions = await model.train(x_train.values, encoded_y, x_test.values, encoded_y_test, x_train.columns, categoricalFeatures, 0);
                        let metrics = await model.evaluateModel(encoded_y_test, predictions, uniqueLabels)
                        if (this.settings.classificationTask) {
                            metrics = metrics[4]
                        } else {
                            metrics = metrics[0]
                        }
                        this.training = false;
                        performances.push(metrics)
                    }
                } else {
                    [x_train, y_train, x_test, y_test] = this.splitData(cross_validation_setting, filterd_dataset, targets);
                }


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
                model.seed = seed;
                model.id = this.settings.getCounter
                this.toggleTraining()
                model.hasExplaination = this.explainModel;
                if (this.usePCAs) {
                    const pca = new PCA();
                    let numericColumns = this.settings.items.filter(column => column.selected && column.type === 1 && column.name != this.modelTarget).map(column => column.name);
                    let [pca_train, _, __, ___, ____, pca_test] = await pca.predict(x_train.loc({ columns: numericColumns }).values,
                        this.numberOfComponents, x_test.loc({ columns: numericColumns }).values)
                    pca_train = pca_train.map(m => [].slice.call(m))
                    pca_test = pca_test.map(m => [].slice.call(m))
                    let cols = pca_train[0].map((_, i) => 'PC_' + (i + 1))
                    x_train = new DataFrame(pca_train, { columns: cols })
                    x_test = new DataFrame(pca_test, { columns: cols })
                }
                console.log(new Set(encoded_y));
                let predictions = this.useHPC ? [] : await model.train(x_train.values, encoded_y, x_test.values, encoded_y_test, x_train.columns, categoricalFeatures, 0);
                let metrics = this.useHPC ? [] : await model.evaluateModel(encoded_y_test, predictions, uniqueLabels)
                if (predictions?.length > 0 || this.useHPC) {

                    this.settings.addResult({
                        id: model.id,
                        useHPC: this.useHPC ? Math.random().toString(16).slice(2) : 0,
                        showProbas: model.hasProbability,
                        helpSectionId: model.helpSectionId,
                        hasExplaination: model.hasExplaination,
                        snapshot: {
                            x: x_train,
                            y: encoded_y,
                            xt: x_test,
                            yt: encoded_y_test,
                            xFeatures: x_train.columns,
                            categoricals: categoricalFeatures,
                            id: this.modelOption,
                            labels: uniqueLabels
                        },
                        seed: seed,
                        encoder: labelEncoder,
                        name: this.usePCAs ? 'PC.' + this.modelName : this.modelName,
                        datasetName: this.settings.getDatasetName,
                        modelTask: this.settings.classificationTask,
                        metrics: metrics,
                        options: JSON.parse(JSON.stringify(this.modelConfigurations)),
                        target: target,
                        categoricalFeatures: this.settings.items.filter(m => m.selected && m.type !== FeatureCategories.Numerical.id).map(m => m.name),
                        numericColumns: numericColumns,
                        transformations: [...this.settings.transformationsList.filter(feature => feature.type != 0)],
                        tables: model.tables,
                        plots: model.plots,
                        predictions: predictions,
                        model: model

                    });
                    this.settings.setActiveTab(2);
                    setTimeout(async () => {
                        this.settings.setResultActiveTab(model.id + 1);
                        window.dispatchEvent(new Event('resize'));
                    }, 100);
                    if (!this.useHPC) {
                        await model.visualize(x_test, encoded_y_test, uniqueLabels, predictions, labelEncoder, x_train.columns, categoricalFeatures)
                    }
                    this.settings.increaseCounter();
                    this.toggleTraining();
                }
            } catch (error) {
                this.training = false;
                let message = 'Failed to fit the ' + this.modelName
                this.$buefy.toast.open(
                    {
                        duration: 3000,
                        message: message,
                        type: 'is-warning',
                    })
                this.settings.addMessage({ message: message, type: 'warning' });
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
        this.splitData = function (cross_validation_setting, filterd_dataset, targets, stepSize = 0.7) {
            let x_train, y_train, x_test, y_test;
            let len = filterd_dataset.$data.length
            if (cross_validation_setting === CV_OPTIONS.SPLIT) {
                const limit = Math.ceil(len * stepSize)
                const train_bound = `0:${limit}`
                const test_bound = `${limit}:${len}`
                x_train = filterd_dataset.iloc({ rows: [train_bound] })
                y_train = targets.iloc([train_bound])
                x_test = filterd_dataset.iloc({ rows: [test_bound] });
                y_test = targets.iloc([test_bound]);
            } else if (cross_validation_setting === CV_OPTIONS.NO) {
                x_train = filterd_dataset
                y_train = targets
                x_test = filterd_dataset
                y_test = targets
            }
            return [x_train, y_train, x_test, y_test]
        }
        this.kfoldSplit = function (filterd_dataset, targets, fold = 1) {
            let x_train, y_train, x_test, y_test;
            let len = filterd_dataset.$data.length
            const lowerLimit = Math.ceil(len * ((fold - 1) * 0.2))
            const upperLimit = Math.ceil(len * (fold * 0.2))
            const train_bound_lower = lowerLimit != 0 ? `:${lowerLimit}` : null
            const train_bound_upper = upperLimit != len ? `${upperLimit}:` : null
            const test_bound = `${lowerLimit}:${upperLimit}`


            let x_train_upper = train_bound_upper != null ? filterd_dataset.iloc({ rows: [train_bound_upper] }) : null
            let y_train_upper = train_bound_upper != null ? targets.iloc([train_bound_upper]) : null
            x_test = filterd_dataset.iloc({ rows: [test_bound] });
            y_test = targets.iloc([test_bound]);
            let x_train_lower = train_bound_lower != null ? filterd_dataset.iloc({ rows: [train_bound_lower] }) : null
            let y_train_lower = train_bound_lower != null ? targets.iloc([train_bound_lower]) : null
            if (x_train_lower && x_train_upper) {
                x_train = concat({ dfList: [x_train_lower, x_train_upper], axis: 0 })
                y_train = concat({ dfList: [y_train_lower, y_train_upper], axis: 0 })
            } else {
                x_train = x_train_lower == null ? x_train_upper : x_train_lower
                y_train = x_train_lower == null ? y_train_upper : y_train_lower
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