import { ClassificationModel } from "../model";
import { asyncRun } from "@/helpers/py-worker";

export default class SupportVectorMachine extends ClassificationModel {
    constructor(opt) {
        super();
        // eslint-disable-next-line no-unused-vars
        this.options = {
            kernel: opt.kernel.value.toLowerCase(),
            coef: opt.bias.value,
            gamma: opt.gamma.value,
            degree: opt.degree.value,
            quiet: true
        };
        this.helpSectionId = 'svm_help';
    }
    // eslint-disable-next-line no-unused-vars
    async train(x_train, y_train, x_test, y_test, columns, __, pdpIndex) {

        this.context = {
            X_train: x_train,
            y_train: y_train,
            X_test: x_test,
            y_test: y_test,
            pdpIndex: pdpIndex,
            kernel: this.options.kernel,
            coef: this.options.coef,
            gamma: this.options.gamma,
            degree: this.options.degree,
            seed: this.seed,
            features: [...Array(columns.length).keys()]

        };
        const script = `
        from sklearn import svm
        from js import X_train,y_train,X_test,y_test,kernel,coef,gamma,degree,features,seed
        import matplotlib
        matplotlib.use("AGG")
        from sklearn.inspection import PartialDependenceDisplay
        from sklearn.inspection import permutation_importance

        model = svm.SVC(kernel=kernel,random_state = seed)
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)

        pdp = PartialDependenceDisplay.from_estimator(model, X_train, features,target=0)
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
    async visualize(x_test, y_test, uniqueLabels, predictions, encoder, columns,categorical_columns) {
        await super.visualize(x_test, y_test, uniqueLabels, predictions, encoder)
        this.chartController.PFIBoxplot(this.id, this.importances, columns);
        this.chartController.plotPDP(this.id, this.pdp_averages, this.pdp_grid, uniqueLabels, columns,categorical_columns);
    }
}