import { asyncRun } from "@/helpers/py-worker";


export default class RandomForest {
    constructor(options) {
        this.options = options;
        this.model = null;
        this.predictions = []

    }
    async train(x_train, y_train, x_test) {
        if (this.options.criteria === 'gini') {

            let worker = new Worker(
                new URL('@/workers/randomforest', import.meta.url),
                { type: 'module' }
            );
            let workerResult = new Promise((resolve) => {
                worker.onmessage = (e) => {
                    resolve(e.data.preds)
                };
                worker.onerror = (error) => { throw error };
                worker.postMessage({ x: x_train, y: y_train, x_test: x_test, options: this.options });
            });
            this.predictions = await workerResult

        } else {
            this.context = {
                X_train: x_train,
                y_train: y_train,
                X_test: x_test,
                rf_type: this.options.criteria.value,
                max_features: this.options.features.value,
                num_estimators: this.options.estimators.value <= 0 || !this.options.estimators.value ? 100 : this.options.estimators.value,
                max_depth: this.options.depth.value <= 0 ? 5 : this.options.depth.value
            };
            const script = `
            from sklearn.model_selection import train_test_split
            from sklearn.ensemble import RandomForestClassifier
            from sklearn.metrics import accuracy_score
            from js import X_train,y_train,X_test,rf_type,max_features,num_estimators,max_depth
            clf = RandomForestClassifier(criterion=rf_type,max_features = max_features,n_estimators=num_estimators,max_depth = max_depth, random_state=42)
            clf.fit(X_train, y_train)
            y_pred = clf.predict(X_test)
            y_pred
        `;
            try {
                const { results, error } = await asyncRun(script, this.context);
                if (results) {
                    this.predictions = Array.from(results);
                } else if (error) {
                    console.log("pyodideWorker error: ", error);
                }
            } catch (e) {
                console.log(
                    `Error in pyodideWorker at ${e.filename}, Line: ${e.lineno}, ${e.message}`,
                );
            }
        }
        return this.predictions
    }
    predict() {
        return this.predictions;
    }
}