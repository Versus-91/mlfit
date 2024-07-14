import { defineStore } from 'pinia'

export const settingStore = defineStore({
    id: 'cart',
    state: () => ({
        features: [],
        target: null,
        isClassification: true,
    }),
    getters: {
        items: (state) => {
            return state.features
        },
        modelTarget: (state) => state.target,
        modelType: (state) => state.isClassification,
    },
    actions: {
        resetFeatures() {
            this.features = []
        },
        addFeature(feature) {
            let index = this.features.findIndex(m => m.name === feature.name);
            if (index !== -1) {
                this.features[index] = feature
                return
            }
            this.features.push(feature)
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
        setModelType(type) {
            this.isClassification = type
        }
    },
})

