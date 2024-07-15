import xgb from '@/helpers/xgboost/index';
export default class Boosting {
    constructor(opt) {
        let options = {
            booster: opt.booster.value ?? "gbtree",
            objective: "multi:softmax",
            max_depth: opt.depth.value,
            eta: opt.eta.value,
            min_child_weight: 1,
            subsample: 0.5,
            colsample_bytree: 1,
            silent: 1,
            iterations: opt.iterations.value ?? 200
        }
        this.options = options
    }
    async init(options) {
        const XGBoost = await xgb;
        this.model = new XGBoost(options);
    }
    async train(x_train, y_train, x_test) {
        if (!this.model) {
            await this.init(this.options);
        }
        this.model.train(x_train, y_train);
        const result = this.model.predict(x_test);
        this.model.free()
        return result

    }

}
