import { asyncRun } from "../py-worker";
export default class TSNE {
    constructor() {
    }
    async predict(x, n, seed = 123) {
        this.context = {
            x_train: x,
            n: +n,
            seed: seed
        };
        const script = `
        import matplotlib.pyplot as plt
        from sklearn.manifold import TSNE
        import numpy as np
        from js import x_train,n,seed
        from sklearn.preprocessing import StandardScaler
        X = np.array(x_train)
        embedded = TSNE(n_components=n, learning_rate='auto', random_state=seed).fit_transform(X)
        embedded
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
