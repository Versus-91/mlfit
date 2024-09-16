import { asyncRun } from "@/helpers/py-worker";
import { ClassificationModel } from "../model";


export default class RandomForest extends ClassificationModel {
    constructor(options, chartController) {
        super(chartController)
        this.options = options;
        this.model = null;
        this.predictions = []
    }
    async train(x_train, y_train, x_test, y_test) {
        this.context = {
            X_train: x_train,
            y_train: y_train,
            X_test: x_test,
            y_test: y_test,

            rf_type: this.options.criteria.value,
            max_features: this.options.features.value,
            num_estimators: this.options.estimators.value <= 0 || !this.options.estimators.value ? 100 : +this.options.estimators.value,
            max_depth: this.options.depth.value <= 0 ? 5 : +this.options.depth.value
        };
        const script = `
            from sklearn.model_selection import train_test_split
            from sklearn.ensemble import RandomForestClassifier
            from sklearn.metrics import accuracy_score
            from sklearn.inspection import partial_dependence
            from sklearn.inspection import permutation_importance
            from js import X_train,y_train,X_test,y_test,rf_type,max_features,num_estimators,max_depth

            classifier = RandomForestClassifier(criterion=rf_type,max_features = max_features,n_estimators=num_estimators,max_depth = max_depth, random_state=42)
            classifier.fit(X_train, y_train)
            y_pred = classifier.predict(X_test)

            pdp_results = partial_dependence(classifier, X_train, [0])
            fi = permutation_importance(classifier,X_test,y_test)
            
            y_pred,pdp_results["average"],list(pdp_results["grid_values"][0]), list(fi.importances)
        `;
        try {
            const { results, error } = await asyncRun(script, this.context);
            if (results) {
                this.predictions = Array.from(results[0]);
                this.pdp_averages = Array.from(results[1]);
                this.pdp_grid = Array.from(results[2]);
                this.importances = Array.from(results[3]);

            } else if (error) {
                console.log("pyodideWorker error: ", error);
            }
        } catch (e) {
            console.log(
                `Error in pyodideWorker at ${e.filename}, Line: ${e.lineno}, ${e.message}`,
            );
        }
        return this.predictions
    }
    async visualize(x_test, y_test, uniqueLabels, predictions, encoder, columns) {
        await super.visualize(x_test, y_test, uniqueLabels, predictions, encoder)
        this.chartController.PFIBoxplot(this.id, this.importances, columns);
        this.chartController.plotPDP(this.id, this.pdp_averages, this.pdp_grid, uniqueLabels, columns[0]);
    }
    predict() {
        return this.predictions;
    }
}