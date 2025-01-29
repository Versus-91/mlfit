import { defineStore } from 'pinia'

export const settingStore = defineStore({
    id: 'cart',
    state: () => ({
        counter: 0,
        df: {},
        rawData: {},
        features: [],
        transformations: [],
        classTransformations: [],
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
        seed: 123,
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
        getRawData: (state) => {
            return state.rawData;
        },
        currentTab: (state) => {
            return state.activeTab
        },
        mergedClases: (state) => {
            return state.classTransformations
        },
        getSeed: (state) => {
            return state.seed
        },
        outputs: (state) => state.results,
        transformationsList: (state) => state.transformations,
        modelTarget: (state) => state.target,
        classificationTask: (state) => state.isClassification,
    },
    actions: {
        setSeed(seed) {
            this.seed = seed
        },
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
        setRawData(data) {
            this.rawData = data;
        },
        addFeature(feature) {
            feature.scaler = 0;
            let index = this.features.findIndex(m => m.name === feature.name);
            if (index !== -1) {
                this.features[index] = feature
                return
            }
            this.features.push(feature)
        },
        setClassTransformation(transformations) {
            this.classTransformations = transformations
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
        removeResult(id) {
            const i = this.results.findIndex(m => m.id === id)
            if (i > -1) {
                this.results.splice(i, 1);
            }
        },
        getResultVisualizations(id) {
            const i = this.results.findIndex(m => m.id === id)
            if (i > -1) {
                let tables = this.results[i].tables;
                let plots = this.results[i].plots;
                return [tables, plots]
            }
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

