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
            seed: this.seed,
            features: [...Array(columns.length).keys()]

        };
        const script = `
        from sklearn import svm
        import matplotlib
        matplotlib.use("AGG")
        from js import X_train,y_train,X_test,y_test,kernel,gamma,degree,seed,features
        from sklearn.inspection import PartialDependenceDisplay
        from sklearn.inspection import permutation_importance

        model = svm.SVR(kernel=kernel)
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)

        pdp = PartialDependenceDisplay.from_estimator(model, X_train, features)
        fi = permutation_importance(model,X_test,y_test,n_repeats=10)
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
    async visualize(x_test, y_test, uniqueLabels, predictions, encoder, columns) {
        await super.visualize(x_test, y_test, uniqueLabels, predictions, encoder)
        this.chartController.PFIBoxplot(this.id, this.importances, columns);
        this.chartController.plotPDPRegression(this.id, this.pdp_averages, this.pdp_grid, uniqueLabels, columns);
    }
}