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
        from sklearn.discriminant_analysis import QuadraticDiscriminantAnalysis
        from sklearn.discriminant_analysis import LinearDiscriminantAnalysis
        from js import X_train,y_train,X_test,lda_type,priors
        if priors is not None and priors.strip():
            priors = [float(x) for x in priors.split(',')]
        else:
            priors = None
        print("priors",priors)
        if lda_type == 0:
            da = LinearDiscriminantAnalysis(priors=priors)
        else:
            da = QuadraticDiscriminantAnalysis(priors=priors)
        da.fit(X_train, y_train)
        y_pred = da.predict(X_test)
        y_pred
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
            console.log(
                `Error in pyodideWorker at ${e.filename}, Line: ${e.lineno}, ${e.message}`,
            );
        }
    }

}
