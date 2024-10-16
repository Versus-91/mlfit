import { RegressionModel } from "../regression_model";
import { asyncRun } from "@/helpers/py-worker";
const SVM_TYPES = {
    C_SVC: '0', // C support vector classification
    NU_SVC: '1', // NU support vector classification
    ONE_CLASS: '2', // ONE CLASS classification
    EPSILON_SVR: '3', // Epsilon support vector regression
    NU_SVR: '4' // Nu support vector regression
};


const KERNEL_TYPES = {
    LINEAR: '0',
    POLYNOMIAL: '1',
    RBF: '2', // Radial basis function
    SIGMOID: '3',
    PRECOMPUTED: '4'
};
export default class SupportVectorMachineRegression extends RegressionModel {
    constructor(opt) {
        super();
        // eslint-disable-next-line no-unused-vars
        this.options = {
            kernel: KERNEL_TYPES[opt.kernel.value.toUpperCase()],
            type: SVM_TYPES.C_SVC,
            coef0: opt.bias.value,
            gamma: opt.gamma.value,
            degree: opt.degree.value,
            quiet: true
        }
    }
    async train(x_train, y_train, x_test, y_test) {

        this.context = {
            X_train: x_train,
            y_train: y_train,
            X_test: x_test,
            y_test: y_test,
            kernel: this.options.kernel,
            coef: this.options.coef,
            gamma: this.options.gamma,
            degree: this.options.degree,
            seed: this.seed

        };
        const script = `
        from sklearn import svm
        from js import X_train,y_train,X_test,y_test,kernel,coef,gamma,degree,seed
        from sklearn.inspection import partial_dependence
        from sklearn.inspection import permutation_importance

        model = svm.SVR(kernel=kernel,random_state = seed)
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)

        pdp_results = partial_dependence(model, X_train, [0])
        fi = permutation_importance(model,X_test,y_test,n_repeats=10)
        y_pred,pdp_results["average"],list(pdp_results["grid_values"][0]), list(fi.importances)
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
        this.chartController.plotPDP(this.id, this.pdp_averages, this.pdp_grid, uniqueLabels, columns[0]);
    }
}