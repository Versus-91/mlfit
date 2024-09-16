import { asyncRun } from "@/helpers/py-worker";


export default class CorrelationMatrix {
    constructor() {
        this.model = null;

    }
    async train(x_train, labels) {
        this.context = {
            X_train: x_train,
            labels: labels
        };
        const script = `
        import numpy as np
        import statsmodels.api as sm
        from js import X_train,labels
        from statsmodels.nonparametric.kernel_regression import KernelReg
        import seaborn as sns

        sns.clustermap(X_train)

        `;
        try {
            const { results, error } = await asyncRun(script, this.context);
            if (results) {
                return results;
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