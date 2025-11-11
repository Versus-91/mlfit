import { asyncRun } from "../py-worker";
export default class PCA {

    async predict(x, n, x_test = []) {
        this.context = {
            x_train: x,
            x_test: x_test,
            has_test_set: x_test.length > 0,
            n: +n,
        };
        const script = `
        import matplotlib.pyplot as plt
        import numpy as np
        from sklearn.decomposition import PCA
        from js import x_train,n,x_test,has_test_set
        from sklearn.preprocessing import StandardScaler
        x_train = np.array(x_train)
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(x_train) 
        pca_x = PCA(n_components=n,random_state = 42)
        pca = pca_x.fit_transform(np.array(X_scaled))
        pca_test=[]
        if has_test_set:
            x_test = np.array(x_test)
            x_test_scaled= scaler.transform(x_test) 
            pca_test = pca_x.fit_transform(np.array(x_test_scaled))
        ccircle = []
        eucl_dist = []
        for i,j in enumerate(x_train.T):
            corr1 = np.corrcoef(j,pca[:,0])[0,1]
            corr2 = np.corrcoef(j,pca[:,1])[0,1]
            ccircle.append((corr1, corr2))
            eucl_dist.append(np.sqrt(corr1**2 + corr2**2))
        (pca,np.arange(1, len(pca_x.explained_variance_ratio_) + 1), pca_x.explained_variance_ratio_,ccircle,eucl_dist,pca_test)
    `;
        try {
            const { results, error } = await asyncRun(script, this.context);
            if (results) {
                return results;
            } else if (error) {
                throw Error("Faced errot fitting PCA")
            }
        } catch (e) {
            throw Error("Failed to fit PCA")
        }
    }

}
