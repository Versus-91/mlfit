import { asyncRun } from "../py-worker";
export default class PCA {
    constructor() {
    }
    async predict(x) {
        this.context = {
            x_train: x,

        };
        const script = `
        import matplotlib.pyplot as plt
        import numpy as np
        from sklearn.decomposition import PCA
        from js import x_train       
        # Perform t-SNE dimensionality reduction
        pca_x = PCA()
        pca = pca_x.fit_transform(np.array(x_train))
        (pca,np.arange(1, len(pca_x.explained_variance_ratio_) + 1), pca_x.explained_variance_ratio_)
    `;
        try {
            const { results, error } = await asyncRun(script, this.context);
            if (results) {
                console.log("pyodideWorker return results: ", results);
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
