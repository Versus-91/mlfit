import { asyncRun } from "@/helpers/py-worker";
import { ClassificationModel } from '../model';
export default class Boosting extends ClassificationModel {
    constructor(opt, chartControler) {
        super(chartControler);
        let options = {
            booster: opt.booster.value ?? "gbtree",
            objective: "multi:softmax",
            max_depth: +opt.depth.value,
            eta: +opt.eta.value,
            estimators: opt.estimators.value ?? 200
        }
        this.options = options;
        this.helpSectionId = 'cart_help';

    }
    // eslint-disable-next-line no-unused-vars
    async train(x, y, x_test, y_test, columns, __, pdpIndex) {
        this.context = {
            X_train: x,
            y_train: y,
            X_test: x_test,
            y_test: y_test,
            objective: this.options.objective,
            max_depth: this.options.max_depth,
            eta: this.options.eta,
            estimators: this.options.estimators,
            seed: this.seed,
            pdpIndex: pdpIndex,
            features: [...Array(columns.length).keys()],
            explain: this.hasExplaination
        };
        const script = `
        import matplotlib
        matplotlib.use("AGG")
        from js import X_train,y_train,X_test,y_test,objective,max_depth,eta,estimators,seed,features,explain
        from sklearn.inspection import PartialDependenceDisplay
        from sklearn.inspection import permutation_importance
        from sklearn.ensemble import GradientBoostingClassifier

        features_importance = []
        partial_dependence_plot_grids = []
        partial_dependence_plot_avgs = []

        model = GradientBoostingClassifier(learning_rate = eta,n_estimators = estimators,max_depth =max_depth,random_state = seed )
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        if explain:
            pdp = PartialDependenceDisplay.from_estimator(model, X_train, features,target=0,method ='brute')
            fi = permutation_importance(model,X_test,y_test,n_repeats=10)
            partial_dependence_plot_avgs = list(map(lambda item:item['average'],pdp.pd_results))
            grids = list(map(lambda item:item['grid_values'],pdp.pd_results))
            features_importance = list(fi.importances)
            partial_dependence_plot_grids = [item[0].tolist() for item in grids ]
        y_pred,partial_dependence_plot_avgs,partial_dependence_plot_grids, features_importance
    `;
        try {
            const { results, error } = await asyncRun(script, this.context);
            if (results) {
                this.predictions = Array.from(results[0]);
                this.pdp_averages = Array.from(results[1]);
                this.pdp_grid = Array.from(results[2]);
                this.importances = Array.from(results[3]);
                return Array.from(results[0]);
            } else if (error) {
                console.log("pyodideWorker error: ", error);
            }
        } catch (e) {
            throw Error(`Error in pyodideWorker at ${e.filename}, Line: ${e.lineno}, ${e.message}`,)

        }
    }
    generatePythonCode() {
        let model_import = "from sklearn.ensemble import GradientBoostingClassifier"
        let model_fit =
            `model = GradientBoostingClassifier(learning_rate = ${this.options.eta} ,n_estimators = ${this.options.estimators} ,max_depth =${this.options.max_depth} ,random_state = ${this.seed} )`;
        return super.generatePythonCode(model_import, model_fit)
    }
    async visualize(x_test, y_test, uniqueLabels, predictions, encoder, columns, categorical_columns) {
        await super.visualize(x_test, y_test, uniqueLabels, predictions, encoder)
        if (this.hasExplaination) {
            this.chartController.PFIBoxplot(this.id, this.importances, columns);
            this.chartController.plotPDP(this.id, this.pdp_averages, this.pdp_grid, uniqueLabels, columns, categorical_columns);
        }
    }
}
