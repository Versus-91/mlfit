import { asyncRun } from "@/helpers/py-worker";
export default class MissForest {
    constructor(options) {
        this.options = options
    }
    async train(x, y, x_test) {
        this.context = {
            lda_type: this.options.type.value,
            priors: this.options.priors.value,
            X_train: x,
            y_train: y,
            X_test: x_test,
        };
        const script = `
        from sklearn.impute import IterativeImputer
        from sklearn.linear_model import LinearRegression, LogisticRegression
        from sklearn.compose import ColumnTransformer
        from sklearn.preprocessing import LabelEncoder
    `;
        try {
            const { results, error } = await asyncRun(script, this.context);
            if (results) {
                console.log("pyodideWorker return results: ", results);
                return Array.from(results);
            } else if (error) {
                console.log("pyodideWorker error: ", error);
            }
        } catch (e) {
            throw Error(`Error in pyodideWorker at ${e.filename}, Line: ${e.lineno}, ${e.message}`,)

        }
    }

}
