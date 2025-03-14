import { asyncRun } from "@/helpers/py-worker";
import { RegressionModel } from "../regression_model";


export default class BSplineRegression extends RegressionModel {
    constructor(options) {
        super();
        this.options = options;
        this.model = null;
        this.hasExplaination = false;

    }
    async train(x_train, y_train, x_test, y_test, columns) {
        this.context = {
            X_train: x_train,
            y_train: y_train,
            X_test: x_test,
            y_test: y_test,
            knots: +this.options.knots.value,
            explain: this.hasExplaination,
            degree: +this.options.degree.value,
            features: [...Array(columns.length).keys()]


        };
        const script = `
        from sklearn.preprocessing import SplineTransformer
        from sklearn.inspection import PartialDependenceDisplay
        from sklearn.inspection import permutation_importance
        from sklearn.ensemble import GradientBoostingRegressor
        import pandas as pd
        import matplotlib
        matplotlib.use("AGG")
        from sklearn import linear_model
        from sklearn.metrics import mean_squared_error
        from sklearn.pipeline import make_pipeline
        from js import X_train,y_train,X_test,knots,degree,y_test,features,explain


        features_importance = []
        partial_dependence_plot_grids = []
        partial_dependence_plot_avgs = []
        
        model = make_pipeline(
            SplineTransformer(n_knots=knots, degree=degree), 
            linear_model.LinearRegression()
            )
        model.fit(X_train, y_train)
        pred_train = model.predict(X_train)
        rmse_train = mean_squared_error(y_train, pred_train, squared=True)
        y_pred = model.predict(X_test)
        if explain:
            pdp = PartialDependenceDisplay.from_estimator(model, X_train, features,method ='brute')
            fi = permutation_importance(model,X_test,y_test,n_repeats=10)
            partial_dependence_plot_avgs = list(map(lambda item:item['average'],pdp.pd_results))
            grids = list(map(lambda item:item['grid_values'],pdp.pd_results))
            features_importance = list(fi.importances)
            partial_dependence_plot_grids = [item[0].tolist() for item in grids ]
        y_pred,partial_dependence_plot_avgs,partial_dependence_plot_grids, features_importance

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
            throw Error(`Error in pyodideWorker at ${e.filename}, Line: ${e.lineno}, ${e.message}`,)

        }
    }
    async visualize(x_test, y_test, uniqueLabels, predictions, encoder, columns, categorical_columns) {
        await super.visualize(x_test, y_test, uniqueLabels, predictions, encoder)
        if (this.hasExplaination) {
            this.chartController.PFIBoxplot(this.id, this.importances, columns);
            this.chartController.plotPDPRegression(this.id, this.pdp_averages, this.pdp_grid, uniqueLabels, columns, categorical_columns);
        }
    }
}