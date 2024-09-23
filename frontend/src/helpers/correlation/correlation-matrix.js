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
        import io, base64
        import pandas as pd

        sns.set(font_scale=1.5)
        buffer = io.BytesIO()
        df = pd.DataFrame(X_train,columns = columns)
        plt.figure(figsize=(10, 8))
        plot = sns.clustermap(df.corr(),cmap="YlGnBu_r",annot = True, fmt=".2f")
        plot.savefig(buffer, format='png',dpi=300)
        buffer.seek(0)
        img_str = 'data:image/png;base64,' + base64.b64encode(buffer.read()).decode('UTF-8')
        img_str
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