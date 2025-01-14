import { asyncRun } from "../py-worker";
export default class PCA {
    constructor() {
    }
    async predict(x, n = null) {
        this.context = {
            x_train: x,
            n: +n,
        };
        const script = `
        import matplotlib.pyplot as plt
        import numpy as np
        from sklearn.decomposition import PCA
        from js import x_train,n   
        # Perform t-SNE dimensionality reduction
        pca_x = PCA(n_components=n)
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
            throw Error("Failed to find PCA")
        }
    }

}
