import { defineStore } from 'pinia'

export const settingStore = defineStore({
    id: 'cart',
    state: () => ({
        counter: 0,
        features: [],
        transformations: [],
        results: [],
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
        outputs: (state) => state.results,
        modelTarget: (state) => state.target,
        modelTask: (state) => state.isClassification,
    },
    actions: {
        resetFeatures() {
            this.features = []
        },
        increaseCounter() {
            this.counter++;
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
        }
    },
})

