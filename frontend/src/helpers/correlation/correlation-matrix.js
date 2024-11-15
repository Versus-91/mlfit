import { asyncRun } from "@/helpers/sns-worker";


export default class Clustermap {
    constructor() {
        this.model = null;

    }
    async train(x_train, columns) {
        this.context = {
            X_train: x_train,
            columns: columns
        };
        const script = `
        import matplotlib
        matplotlib.use("AGG")
        import matplotlib.pyplot as plt
        from js import X_train,columns
        import seaborn as sns
        import pandas as pd

        sns.set(font_scale=1.5)
        df = pd.DataFrame(X_train,columns = columns)
        plt.figure(figsize=(12, 8))
        plot = sns.clustermap(df.corr(),cmap="YlGnBu_r",annot = True, fmt=".2f")
        reordered_index = plot.dendrogram_row.reordered_ind
        reordered_columns = plot.dendrogram_col.reordered_ind
        clustered_corr = df.corr().iloc[reordered_index, :].iloc[:, reordered_columns]

        Z = plot.dendrogram_col.linkage  
        Z,clustered_corr.values,clustered_corr.columns.tolist()
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