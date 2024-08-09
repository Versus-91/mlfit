import { defineStore } from 'pinia'

export const settingStore = defineStore({
    id: 'cart',
    state: () => ({
        counter: 0,
        df: {},
        features: [],
        transformations: [],
        results: [],
        datasetName: '',
        activeTab: 0,
        resultActiveTab: 0,
        datasetShape: {
            count: 0,
            columns: 0
        },
        target: null,
        isClassification: true,
    }),
    getters: {
        items: (state) => {
            return state.features
        },
        getCounter: (state) => {
            return state.counter
        },
        getDatasetName: (state) => {
            return state.datasetName
        },
        getDatasetShape: (state) => {
            return state.datasetShape
        },
        getDataset: (state) => {
            return state.df;
        },
        currentTab: (state) => {
            return state.activeTab
        },
        outputs: (state) => state.results,
        transformationsList: (state) => state.transformations,
        modelTarget: (state) => state.target,
        classificationTask: (state) => state.isClassification,
    },
    actions: {
        setDatasetName(name) {
            this.datasetName = name;
        },
        setDatasetShape(shape) {
            this.datasetShape = shape;
        },
        resetFeatures() {
            this.features = []
        },
        resetTransformations() {
            this.transformations = []
        },
        resetDataset() {
            this.datasetName = '';
            this.datasetShape = {
                count: 0,
                columns: 0
            };

        },
        increaseCounter() {
            this.counter++;
        },
        setDataframe(data) {
            this.df = data;
        },
        addFeature(feature) {
            let index = this.features.findIndex(m => m.name === feature.name);
            if (index !== -1) {
                this.features[index] = feature
                return
            }
            this.features.push(feature)
        },
        addTransformation(transformation) {
            let index = this.transformations.findIndex(m => m.name === transformation.name);
            if (index !== -1) {
                this.transformations[index] = transformation
                return
            }
            this.transformations.push(transformation)
        },
        addResult(result) {
            this.results.push(result)
        },
        resetDF() {
            this.df = {}
        },
        updateFeature(feature) {
            let index = this.features.findIndex(m => m.name === feature.name);
            if (index !== -1) {
                this.features[index] = feature
            }
        },
        removeItem(name) {
            const i = this.features.lastIndexOf(name)
            if (i > -1) this.features.splice(i, 1)
        },
        setTarget(target) {
            this.target = target
        },
        setmodelTask(type) {
            this.isClassification = type
        },
        setActiveTab(index) {
            this.activeTab = index
        },
        setResultActiveTab(index) {
            this.resultActiveTab = index
        }
    },
})

