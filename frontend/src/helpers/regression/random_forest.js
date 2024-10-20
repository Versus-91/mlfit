
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

import { asyncRun } from "@/helpers/py-worker";
import { RegressionModel } from "../regression_model";


export default class RandomForestRegressor extends RegressionModel {
    constructor(options) {
        super();
        this.options = options;
        this.model = null;

    }
    async train(x_train, y_train, x_test, y_test, _, __, pdpIndex) {
        this.context = {
            X_train: x_train,
            y_train: y_train,
            X_test: x_test,
            y_test: y_test,
            rf_type: this.options.criteria.value,
            max_features: this.options.features.value,
            num_estimators: this.options.estimators.value <= 0 || !this.options.estimators.value ? 100 : +this.options.estimators.value,
            max_depth: this.options.depth.value <= 0 ? 5 : +this.options.depth.value,
            seed: this.seed,
        };
        const script = `
            from sklearn.model_selection import train_test_split
            from sklearn.ensemble import RandomForestRegressor
            from sklearn.metrics import accuracy_score
            from js import X_train,y_train,X_test,y_test,rf_type,max_features,num_estimators,max_depth,seed
            from sklearn.inspection import partial_dependence
            from sklearn.inspection import permutation_importance

            model = RandomForestRegressor(criterion=rf_type,max_features = max_features,n_estimators=num_estimators,max_depth = max_depth, random_state=seed)
            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)
            pdp_results = partial_dependence(model, X_train,[0,1])
            fi = permutation_importance(model,X_test,y_test,n_repeats=10)
            
            y_pred,pdp_results["average"],[arr.tolist() for arr in pdp_results['grid_values']], list(fi.importances)
            
        `;
        try {
            const { results, error } = await asyncRun(script, this.context);
            if (results) {
                this.predictions = Array.from(results[0]);
                this.pdp_averages = Array.from(results[1]);
                this.pdp_grid = Array.from(results[2]);
                this.importances = Array.from(results[3]);
                return Array.from(results[0]);
            } else if (error) {
                console.log("pyodideWorker error: ", error);
            }
        } catch (e) {
            console.log(
                `Error in pyodideWorker at ${e.filename}, Line: ${e.lineno}, ${e.message}`,
            );
        }

    }

    predict(x_test) {
        const result = this.model.predict(x_test);
        return result
    }
    async visualize(x_test, y_test, uniqueLabels, predictions, encoder, columns) {
        await super.visualize(x_test, y_test, uniqueLabels, predictions, encoder)
        this.chartController.PFIBoxplot(this.id, this.importances, columns);
        this.chartController.plotPDP(this.id, this.pdp_averages, this.pdp_grid, uniqueLabels, columns[0]);
    }
}