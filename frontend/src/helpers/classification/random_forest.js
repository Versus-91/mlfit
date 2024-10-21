import { asyncRun } from "@/helpers/py-worker";
import { ClassificationModel } from "../model";


export default class RandomForest extends ClassificationModel {
    constructor(options, chartController) {
        super(chartController)
        this.options = options;
        this.model = null;
        this.predictions = []
    }
    // eslint-disable-next-line no-unused-vars
    async train(x_train, y_train, x_test, y_test, _, __, pdpIndex) {
        this.context = {
            X_train: x_train,
            y_train: y_train,
            X_test: x_test,
            y_test: y_test,
            pdpIndex: pdpIndex,
            rf_type: this.options.criteria.value,
            max_features: this.options.features.value,
            num_estimators: this.options.estimators.value <= 0 || !this.options.estimators.value ? 100 : +this.options.estimators.value,
            max_depth: this.options.depth.value <= 0 ? 5 : +this.options.depth.value,
            seed: this.seed,
        };
        const script = `
            from sklearn.model_selection import train_test_split
            from sklearn.ensemble import RandomForestClassifier
            from sklearn.metrics import accuracy_score
            import matplotlib
            matplotlib.use("AGG")
            from sklearn.inspection import PartialDependenceDisplay
            from sklearn.inspection import permutation_importance
            from js import seed,X_train,y_train,X_test,y_test,rf_type,max_features,num_estimators,max_depth, pdpIndex

            classifier = RandomForestClassifier(criterion=rf_type,max_features = max_features,n_estimators=num_estimators,max_depth = max_depth, random_state=seed)
            classifier.fit(X_train, y_train)
            y_pred = classifier.predict(X_test)

            pdp = PartialDependenceDisplay.from_estimator(classifier, X_train, [0,1,2],target=0)
            fi = permutation_importance(classifier,X_test,y_test,n_repeats=10)
            avgs = list(map(lambda item:item['average'],pdp.pd_results))
            grids = list(map(lambda item:item['grid_values'],pdp.pd_results))
            y_pred,avgs,[item[0].tolist() for item in grids ], list(fi.importances)
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