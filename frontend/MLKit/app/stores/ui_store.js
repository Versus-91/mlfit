import { defineStore } from 'pinia'

export const uiStore = defineStore('main', {

    state: () => ({
        activeTab: 0,
        dataSizeFlag: false,
        resultActiveTab: '',
        datasetShape: {
            count: 0,
            columns: 0
        },
        target: null,
        isClassification: true,
        seed: 123,
        datasetName: '',

    }),
    getters: {
        getDatasizeFlag: (state) => {
            return state.dataSizeFlag
        },
        getCounter: (state) => {
            return state.counter
        },
        getUID: () => {
            let id = Math.random().toString(16).slice(2);
            return id;
        },
        modelTarget: (state) => state.target,
        classificationTask: (state) => state.isClassification,
        items: (state) => {
            return state.features
        },

        currentTab: (state) => {
            return state.activeTab
        },
        getSeed: (state) => {
            return state.seed
        },

    },
    actions: {
        resetFeatures() {
            this.features = []
            this.transformations = []
            this.classTransformations = []
        },
        setDatasizeFlag(flag) {
            this.dataSizeFlag = flag;
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
    }

})
