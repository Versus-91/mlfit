
import { KNeighborsClassifier } from 'scikitjs'
export default class KNNModel {
    constructor(options) {
        this.options = options
        this.model = null

    }
    async train(x_train, y_train, metric, k = 3) {
        this.model = new KNeighborsClassifier({ nNeighbors: k, metric: metric })
        await this.model.fit(x_train, y_train);
    }
    predict(x_test) {
        if (this.model === null || this.model === undefined) {
            throw "model not found."
        }
        var predictions = window.tf.tidy(() => {
            let results = this.model.predict(x_test);
            return Array.from(results.dataSync())
        })
        return predictions
    }
    predict_probas(x_test) {
        if (this.model === null || this.model === undefined) {
            throw "model not found."
        }
        var predictions = window.tf.tidy(() => {
            let results = this.model.predictProba(x_test);
            return Array.from(results.arraySync())
        })
        return predictions
    }
}