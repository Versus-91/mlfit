
import { KNeighborsRegressor } from 'scikitjs'
import { RegressionModel } from '../regression_model'
import { calculateMSE } from '../utils';

export default class KNNRegressor extends RegressionModel {
    constructor(options) {
        super();
        this.options = options
        this.model = null

    }
    async fit(x_train, y_train, metric, k = 3) {
        this.model = new KNeighborsRegressor({ nNeighbors: k, metric: metric })
        await this.model.fit(x_train, y_train);
    }
    async train(x_train, y_train, x_test, y_test) {
        this.results = []

        return new Promise((resolve, reject) => {
            try {
                setTimeout(async () => {
                    try {
                        let metrics = ['manhattan', 'euclidean']
                        for (let i = 0; i < metrics.length; i++) {
                            const metric = metrics[i];
                            for (let k = this.options.min.value; k <= this.options.max.value; k++) {
                                await this.fit(x_train, y_train, metric, k)
                                let predictions_test = this.predict(x_test)
                                let predictions_train = this.predict(x_train)
                                let evaluation_test = calculateMSE(predictions_test, y_test)
                                let evaluation_train = calculateMSE(predictions_train, y_train)
                                this.results.push({ k: k, predictions: predictions_test, evaluation: evaluation_test, evaluation_train: evaluation_train, metric: metric })
                            }
                        }
                        this.optimalTestSpec = this.results[0];
                        this.optimalTrainSpec = this.results[0];
                        this.results.forEach(element => {
                            if (element.evaluation > this.optimalTestSpec.evaluation) {
                                this.optimalTestSpe = element
                            }
                            if (element.evaluation_train > this.optimalTrainSpec.evaluation_train) {
                                this.optimalTrainSpec = element
                            }
                        });
                        resolve(this.optimalTestSpec.predictions)
                    } catch (error) {
                        console.log(this.options);
                        reject(error)
                    }

                }, 500)
            } catch (error) {
                reject(error)
            }
        })
    }
    async visualize(x_test, y_test, _, predictions) {
        await super.visualize(x_test, y_test, _, predictions)
        this.chartController.KNNPerformancePlotRegression(this.results, this.optimalTrainSpec, this.optimalTestSpec, this.id)
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