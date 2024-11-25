
import { ClassificationModel } from '../model';
import { asyncRun } from "@/helpers/py-worker";

export default class KNNModel extends ClassificationModel {
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

            features: [...Array(columns.length).keys()]
        };
        const script = `
        import matplotlib
        matplotlib.use("AGG")
        from js import X_train,y_train,X_test,y_test,features,min,max
        from sklearn.inspection import PartialDependenceDisplay
        from sklearn.inspection import permutation_importance
        from sklearn.neighbors import KNeighborsClassifier
        from sklearn.metrics import accuracy_score

        k_neighbor_results=[]
        best_model = None
        best_accuracy = 0
        best_preds = []
        for i,metric in enumerate(['manhattan','euclidean']):
            for n in range(min,max+1):
                model = KNeighborsClassifier(n_neighbors=n,metric=metric)
                model.fit(X_train, y_train)
                preds = model.predict(X_test)
                accuracy = accuracy_score(y_test,preds)
                k_neighbor_results.append([metric,n,accuracy])
                if accuracy > best_accuracy:
                    best_accuracy = accuracy
                    best_model = model
                    best_n = n
                    best_preds = preds
    
        pdp = PartialDependenceDisplay.from_estimator(best_model, X_train, features,target=0)
        fi = permutation_importance(best_model,X_test,y_test,n_repeats=10)
        avgs = list(map(lambda item:item['average'],pdp.pd_results))
        grids = list(map(lambda item:item['grid_values'],pdp.pd_results))
        best_preds,avgs,[item[0].tolist() for item in grids ], list(fi.importances),k_neighbor_results,best_n
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
            console.log(
                `Error in pyodideWorker at ${e.filename}, Line: ${e.lineno}, ${e.message}`,
            );
        }
    }
    async visualize(x_test, y_test, uniqueLabels, predictions, encoder, columns, categorical_columns) {
        await super.visualize(x_test, y_test, uniqueLabels, predictions, encoder)
        this.chartController.KNNPerformancePlot(this.k_neighbor_results, this.best_n, this.id);
        this.plots.push('knn_table_' + this.id);
        this.chartController.PFIBoxplot(this.id, this.importances, columns);
        this.chartController.plotPDP(this.id, this.pdp_averages, this.pdp_grid, uniqueLabels, columns, categorical_columns);

    }

}