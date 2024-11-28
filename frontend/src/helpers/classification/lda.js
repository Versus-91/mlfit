import { asyncRun } from "@/helpers/py-worker";
import { ClassificationModel } from "../model";
export default class DiscriminantAnalysis extends ClassificationModel {
    constructor(options) {
        super();
        this.options = options
        this.helpSectionId = 'discriminant_analysis_help';

    }
    async train(x, y, x_test, y_test, columns, __, pdpIndex) {
        this.context = {
            lda_type: this.options.type.value,
            priors: this.options.priors.value,
            X_train: x,
            y_train: y,
            X_test: x_test,
            y_test: y_test,
            pdpIndex: pdpIndex,
            explain: this.hasExplaination,
            features: [...Array(columns.length).keys()]

        };
        const script = `
        import matplotlib
        matplotlib.use("AGG")
        from sklearn.discriminant_analysis import QuadraticDiscriminantAnalysis
        from sklearn.discriminant_analysis import LinearDiscriminantAnalysis
        from js import X_train,y_train,X_test,lda_type,priors,y_test,features,explain
        from sklearn.inspection import PartialDependenceDisplay
        from sklearn.inspection import permutation_importance

        features_importance = []
        partial_dependence_plot_grids = []
        partial_dependence_plot_avgs = []
        if priors is not None and priors.strip():
            priors = [float(x) for x in priors.split(',')]
        else:
            priors = None
        print("priors",priors)
        if lda_type == 0:
            model = LinearDiscriminantAnalysis(priors=priors)
        else:
            model = QuadraticDiscriminantAnalysis(priors=priors)
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
            console.log(
                `Error in pyodideWorker at ${e.filename}, Line: ${e.lineno}, ${e.message}`,
            );
        }
    }
    async visualize(x_test, y_test, uniqueLabels, predictions, encoder, columns, categorical_columns) {
        await super.visualize(x_test, y_test, uniqueLabels, predictions, encoder)
        this.chartController.PFIBoxplot(this.id, this.importances, columns);
        this.chartController.plotPDP(this.id, this.pdp_averages, this.pdp_grid, uniqueLabels, columns, categorical_columns);
    }

}
