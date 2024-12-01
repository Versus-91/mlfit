import { RegressionModel } from "../regression_model";
import { asyncRun } from "@/helpers/py-worker";
export default class SupportVectorMachineRegression extends RegressionModel {
    constructor(opt, chartControler) {
        super(chartControler);
        let options = {
            kernel: opt.kernel.value ?? "linear",
            gamma: opt.gamma.value,
            degree: opt.degree.value,
        }
        this.options = options;
        this.helpSectionId = 'svm_help';

    }
    async train(x_train, y_train, x_test, y_test, columns) {

        this.context = {
            X_train: x_train,
            y_train: y_train,
            X_test: x_test,
            y_test: y_test,
            kernel: this.options.kernel,
            gamma: this.options.gamma,
            degree: this.options.degree,
            explain: this.hasExplaination,
            seed: this.seed,
            features: [...Array(columns.length).keys()]
        };
        const script = `
        from sklearn import svm
        import matplotlib
        matplotlib.use("AGG")
        from js import X_train,y_train,X_test,y_test,kernel,gamma,degree,seed,features,explain
        from sklearn.inspection import PartialDependenceDisplay
        from sklearn.inspection import permutation_importance

        
        features_importance = []
        partial_dependence_plot_grids = []
        partial_dependence_plot_avgs = []
        model = svm.SVR(kernel=kernel)
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)

        if explain:
            pdp = PartialDependenceDisplay.from_estimator(model, X_train, features)
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
            console.log(
                `Error in pyodideWorker at ${e.filename}, Line: ${e.lineno}, ${e.message}`,
            );
        }
    }
    async visualize(x_test, y_test, uniqueLabels, predictions, encoder, columns, categorical_columns) {
        await super.visualize(x_test, y_test, uniqueLabels, predictions, encoder)
        if (this.hasExplaination) {
            this.chartController.PFIBoxplot(this.id, this.importances, columns);
            this.chartController.plotPDPRegression(this.id, this.pdp_averages, this.pdp_grid, uniqueLabels, columns, categorical_columns);
        }
    }
}