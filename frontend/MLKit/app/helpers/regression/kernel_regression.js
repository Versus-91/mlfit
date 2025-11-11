import { asyncRun } from "@/helpers/py-worker";


export default class KernelRegression {
    constructor(options) {
        this.options = options;
        this.model = null;
        this.hasExplaination = false;

    }
    async train(x_train, y_train, x_test, _, labels) {
        this.context = {
            X_train: x_train,
            y_train: y_train,
            X_test: x_test,
            types: this.options.types,
            labels: labels
        };
        const script = `
        import numpy as np
        import statsmodels.api as sm
        from js import X_train,y_train,X_test,labels,types
        from statsmodels.nonparametric.kernel_regression import KernelReg
        import pandas as pd

        df_test = pd.DataFrame(X_test,columns=labels)
        x_test = df_test.iloc[:,:]

        df_train = pd.DataFrame(X_train,columns=labels)
        x_train = df_train.iloc[:,:]

        model = KernelReg(endog=np.array(y_train), exog=x_train, var_type=types)
        
        preds = model.fit(x_test)

        
        preds
        `;
        try {
            const { results, error } = await asyncRun(script, this.context);
            if (results) {
                return results;
            } else if (error) {
                console.log("pyodideWorker error: ", error);
            }
        } catch (e) {
            throw Error(`Error in pyodideWorker at ${e.filename}, Line: ${e.lineno}, ${e.message}`,)

        }

    }
    predict(x_test) {
        const result = this.model.predict(x_test);
        return result
    }
}