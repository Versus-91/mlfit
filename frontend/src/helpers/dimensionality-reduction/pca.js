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
        from sklearn.preprocessing import StandardScaler
        x_train = np.array(x_train)
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(x_train) 
        pca_x = PCA(n_components=n,random_state = 42)
        pca = pca_x.fit_transform(np.array(X_scaled))
        ccircle = []
        eucl_dist = []
        for i,j in enumerate(x_train.T):
            corr1 = np.corrcoef(j,pca[:,0])[0,1]
            corr2 = np.corrcoef(j,pca[:,1])[0,1]
            ccircle.append((corr1, corr2))
            eucl_dist.append(np.sqrt(corr1**2 + corr2**2))
        (pca,np.arange(1, len(pca_x.explained_variance_ratio_) + 1), pca_x.explained_variance_ratio_,ccircle,eucl_dist)
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
