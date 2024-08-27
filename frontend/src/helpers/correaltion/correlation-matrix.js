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
        import pandas as pd
        from scipy.cluster.hierarchy import linkage, dendrogram, leaves_list,fcluster
        from scipy.spatial.distance import squareform

        def flatten_numpy(arr):
            return np.concatenate([np.array(x).flatten() for x in arr])
        from sklearn.datasets import load_iris
        df = pd.DataFrame(X_train,columns=labels)
        correaltion_matrix = df.corr()

        dissimilarity = 1 - abs(correaltion_matrix)
        Z = linkage(squareform(dissimilarity), 'complete')
        threshold = 0.8
        labels = fcluster(Z, threshold, criterion='distance')
        labels_order = np.argsort(labels)

        # Build a new dataframe with the sorted columns
        for idx, i in enumerate(df.columns[labels_order]):
            if idx == 0:
                clustered = pd.DataFrame(df[i])
            else:
                df_to_append = pd.DataFrame(df[i])
                clustered = pd.concat([clustered, df_to_append], axis=1)
        correlations = clustered.corr()

        correaltion_matrix.values,correaltion_matrix.columns.tolist(),correlations.values,correlations.columns.tolist()
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