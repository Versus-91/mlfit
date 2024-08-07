
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import xgb from '../xgboost/index';
import { RegressionModel } from '../regression_model';

export default class BoostingRegression extends RegressionModel {
    constructor(options) {
        super();
        this.options = {
            objective: "reg:linear",
            iterations: options.iterations.value ?? 200
        }
    }
    async init(options) {
        const XGBoost = await xgb;
        this.model = new XGBoost(options);
    }
    async train(x_train, y_train, x_test) {
        if (!this.model) {
            await this.init(this.options);
        }
        return new Promise((resolve, reject) => {
            try {
                setTimeout(async () => {
                    this.model.train(x_train, y_train);
                    resolve()
                }, 1000)
            } catch (error) {
                reject(error)
            }
        }).then(() => this.model.predict(x_test))

    }
    async predict(x_test) {
        if (!this.model) {
            await this.init(this.options);
        }
        const result = this.model.predict(x_test);
        return result
    }
}