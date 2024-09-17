import { asyncRun } from "@/helpers/py-worker";
import { RegressionModel } from "../regression_model";


export default class BSplineRegression extends RegressionModel {
    constructor(options) {
        super();
        this.options = options;
        this.model = null;
    }
    async train(x_train, y_train, x_test, y_test, labels) {
        this.context = {
            X_train: x_train,
            y_train: y_train,
            X_test: x_test,
            y_test: y_test,
            knots: +this.options.knots.value,
            degree: +this.options.degree.value,
            labels: labels

        };
        const script = `
        import numpy as np
        from patsy import dmatrix
        import statsmodels.formula.api as smf
        import statsmodels.api as sm
        from sklearn.preprocessing import SplineTransformer
        import pandas as pd
        from sklearn import linear_model
        from sklearn.metrics import mean_squared_error
        from sklearn.pipeline import make_pipeline
        from js import X_train,y_train,X_test,knots,degree,labels,y_test
        from sklearn.inspection import partial_dependence
        from sklearn.inspection import permutation_importance


        model = make_pipeline(
            SplineTransformer(n_knots=knots, degree=degree), 
            linear_model.LinearRegression()
            )
        model.fit(X_train, y_train)
        pred_train = model.predict(X_train)
        rmse_train = mean_squared_error(y_train, pred_train, squared=True)
        # Test data
        pred_test = model.predict(X_test)

        pdp_results = partial_dependence(model, X_train, [0])
        fi = permutation_importance(model,X_test,y_test)
            
        pred_test,pdp_results["average"],list(pdp_results["grid_values"][0]), list(fi.importances)
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
    async visualize(x_test, y_test, uniqueLabels, predictions, encoder, columns) {
        await super.visualize(x_test, y_test, uniqueLabels, predictions, encoder)
        this.chartController.PFIBoxplot(this.id, this.importances, columns);
        this.chartController.plotPDP(this.id, this.pdp_averages, this.pdp_grid, uniqueLabels, columns[0]);
    }
}