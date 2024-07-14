import xgb from './xgboost/index';
export default class Boosting {
    constructor(options) {
        this.options = options
    }
    async init(options) {
        const XGBoost = await xgb;
        this.model = new XGBoost(options);
    }
    async train(x_train, y_train) {
        if (!this.model) {
            await this.init(this.options);
        }
        this.model.train(x_train, y_train);


    }
    async predict(x_test) {
        if (!this.model) {
            await this.init(this.options);
        }
        const result = this.model.predict(x_test);
        this.model.free()
        return result
    }
}
