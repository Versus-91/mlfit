import { asyncRun } from "@/helpers/py-worker";
import { ClassificationModel } from "../model";
export default class DiscriminantAnalysis extends ClassificationModel {
    constructor(options) {
        super();
        this.options = options
        this.helpSectionId = 'discriminant_analysis_help';

    }
    async train(x, y, x_test, y_test, _, __, pdpIndex) {
        this.context = {
            lda_type: this.options.type.value,
            priors: this.options.priors.value,
            X_train: x,
            y_train: y,
            X_test: x_test,
            y_test: y_test,
            pdpIndex: pdpIndex
        };
        const script = `
        import matplotlib
        matplotlib.use("AGG")
        from sklearn.discriminant_analysis import QuadraticDiscriminantAnalysis
        from sklearn.discriminant_analysis import LinearDiscriminantAnalysis
        from js import X_train,y_train,X_test,lda_type,priors,y_test,pdpIndex
        from sklearn.inspection import PartialDependenceDisplay
        from sklearn.inspection import permutation_importance


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
        pdp = PartialDependenceDisplay.from_estimator(model, X_train, [0,1,2],target=0)
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
        this.chartController.plotPDP(this.id, this.pdp_averages, this.pdp_grid, uniqueLabels, columns[0]);
    }

}
