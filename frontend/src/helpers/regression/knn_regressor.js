
import { RegressionModel } from '../regression_model'
import { asyncRun } from "@/helpers/py-worker";

export default class KNNRegressor extends RegressionModel {
    constructor(options) {
        super();
        this.options = options
        this.model = null;
        this.helpSectionId = 'knn_help';


    }
    // eslint-disable-next-line no-unused-vars
    async train(x, y, x_test, y_test, columns, __, pdpIndex) {
        this.context = {
            X_train: x,
            y_train: y,
            X_test: x_test,
            y_test: y_test,
            min: +this.options.min.value,
            max: +this.options.max.value,
            explain: this.hasExplaination,
            features: [...Array(columns.length).keys()]
        };
        const script = `
        import matplotlib
        matplotlib.use("AGG")
        from js import X_train,y_train,X_test,y_test,features,min,max,explain
        from sklearn.inspection import PartialDependenceDisplay
        from sklearn.inspection import permutation_importance
        from sklearn.neighbors import KNeighborsRegressor

        features_importance = []
        partial_dependence_plot_grids = []
        partial_dependence_plot_avgs = []
        k_neighbor_results=[]
        best_model = None
        best_r2 = 0
        best_preds = []

        for i,metric in enumerate(['manhattan','euclidean']):
            for n in range(min,max+1):
                model = KNeighborsRegressor(n_neighbors=n,metric=metric)
                model.fit(X_train, y_train)
                preds = model.predict(X_test)
                r2 = model.score(X_test,y_test)
                k_neighbor_results.append([metric,n,r2])
                if r2 > best_r2:
                    best_r2 = r2
                    best_model = model
                    best_n = n
                    best_preds = preds

        if explain:
            pdp = PartialDependenceDisplay.from_estimator(best_model, X_train, features)
            fi = permutation_importance(best_model,X_test,y_test,n_repeats=10)
            partial_dependence_plot_avgs = list(map(lambda item:item['average'],pdp.pd_results))
            grids = list(map(lambda item:item['grid_values'],pdp.pd_results))
            features_importance = list(fi.importances)
            partial_dependence_plot_grids = [item[0].tolist() for item in grids ]
        best_preds,partial_dependence_plot_avgs,partial_dependence_plot_grids, features_importance,k_neighbor_results,best_n
    `;
        try {
            const { results, error } = await asyncRun(script, this.context);
            if (results) {
                this.predictions = Array.from(results[0]);
                this.pdp_averages = Array.from(results[1]);
                this.pdp_grid = Array.from(results[2]);
                this.importances = Array.from(results[3]);
                this.k_neighbor_results = Array.from(results[4]);
                this.best_n = results[5];
                return Array.from(results[0]);
            } else if (error) {
                console.log("pyodideWorker error: ", error);
            }
        } catch (e) {
            throw Error(`Error in pyodideWorker at ${e.filename}, Line: ${e.lineno}, ${e.message}`,)

        }
    }
    async visualize(x_test, y_test, uniqueLabels, predictions, encoder, columns, categorical_columns) {
        await super.visualize(x_test, y_test, uniqueLabels, predictions, encoder)
        this.chartController.KNNPerformancePlot(this.k_neighbor_results, this.best_n, this.id, "MSE");
        this.plots.push('knn_table_' + this.id);
        if (this.hasExplaination) {
            this.chartController.PFIBoxplot(this.id, this.importances, columns);
            this.chartController.plotPDPRegression(this.id, this.pdp_averages, this.pdp_grid, uniqueLabels, columns, categorical_columns);
        }
    }
}