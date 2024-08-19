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
            Y_test: y_test,
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
        from js import X_train,y_train,X_test,knots,degree,labels,Y_test
        reg = make_pipeline(
            SplineTransformer(n_knots=knots, degree=degree), 
            linear_model.LinearRegression()
            )
        reg.fit(X_train, y_train)
        pred_train = reg.predict(X_train)
        rmse_train = mean_squared_error(y_train, pred_train, squared=True)
        print(rmse_train)
        # Test data
        pred_test = reg.predict(X_test)
        rmse_test =mean_squared_error(Y_test, pred_test, squared=True)
        print(rmse_test)
        (pred_test,rmse_train,rmse_test)
        `;
        try {
            const { results, error } = await asyncRun(script, this.context);
            if (results) {
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
}