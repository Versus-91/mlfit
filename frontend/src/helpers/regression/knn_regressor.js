
import { KNeighborsRegressor } from 'scikitjs'
import { RegressionModel } from '../regression_model'
export default class KNNRegressor extends RegressionModel {
    constructor(options) {
        super();
        this.options = options
        this.model = null

    }
    async train(x_train, y_train, x_test) {
        return new Promise((resolve, reject) => {
            try {
                setTimeout(async () => {
                    try {
                        this.model = new KNeighborsRegressor({ nNeighbors: 3, metric: this.options.metric.value })
                        await this.model.fit(x_train, y_train);
                        resolve()
                    } catch (error) {
                        console.log(this.options);
                        reject(error)
                    }

                }, 1000)
            } catch (error) {
                reject(error)
            }
        }).then(() => this.predict(x_test))
    }
    predict(x_test) {

        if (this.model === null || this.model === undefined) {
            throw "model not found."
        }
        var ans = window.tf.tidy(() => {
            let results = this.model.predict(x_test);
            return Array.from(results.dataSync())
        })
        return ans
    }
}