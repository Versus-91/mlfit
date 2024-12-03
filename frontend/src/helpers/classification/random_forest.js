import { asyncRun } from "@/helpers/py-worker";
import { ClassificationModel } from "../model";


export default class RandomForest extends ClassificationModel {
    constructor(options, chartController) {
        super(chartController)
        this.helpSectionId = 'cart_help';
        this.options = options;
        this.model = null;
        this.predictions = []
    }
    // eslint-disable-next-line no-unused-vars
    async train(x_train, y_train, x_test, y_test, columns, __, pdpIndex) {
        this.context = {
            X_train: x_train,
            y_train: y_train,
            X_test: x_test,
            y_test: y_test,
            pdpIndex: pdpIndex,
            explain: this.hasExplaination,
            rf_type: this.options.criteria.value,
            max_features: this.options.features.value,
            num_estimators: this.options.estimators.value <= 0 || !this.options.estimators.value ? 100 : +this.options.estimators.value,
            max_depth: this.options.depth.value <= 0 ? 5 : +this.options.depth.value,
            seed: this.seed,
            features: [...Array(columns.length).keys()],
            num_classes: [...new Set(y_train)].length,


        };
        const script = `
            from sklearn.model_selection import train_test_split
            from sklearn.ensemble import RandomForestClassifier
            from sklearn.metrics import accuracy_score
            import matplotlib
            matplotlib.use("AGG")
            from sklearn.inspection import PartialDependenceDisplay
            from sklearn.inspection import permutation_importance
            from js import seed,X_train,y_train,X_test,y_test,rf_type,max_features,num_estimators,max_depth, features,explain,num_classes
            from sklearn.metrics import roc_auc_score
            from sklearn.metrics import roc_curve
            from sklearn.preprocessing import LabelBinarizer


            features_importance = []
            partial_dependence_plot_grids = []
            partial_dependence_plot_avgs = []
            model = RandomForestClassifier(criterion=rf_type,max_features = max_features,n_estimators=num_estimators,max_depth = max_depth, random_state=seed)
            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)
            
            probas = model.predict_proba(X_test)
            tprs=[]
            fprs=[]
            aucs=[]
            label_binrize = LabelBinarizer().fit(y_train)
            y_test_one_hot = label_binrize.transform(y_test)
            
            try:
                fpr,tpr,_  = roc_curve(y_test,probas[:,1])
                fprs.append(fpr)
                tprs.append(tpr)
                auc = roc_auc_score(y_test,probas[:,1])
                aucs.append(auc)
            except Exception as e:
                auc = roc_auc_score(y_test,probas,multi_class = 'ovr')
                aucs.append(auc)
                for i in range(num_classes):
                    fpr,tpr,_ = roc_curve(y_test_one_hot[:,i],probas[:,i])
                    fprs.append(fpr)
                    tprs.append(tpr)

            if explain:
                pdp = PartialDependenceDisplay.from_estimator(model, X_train, features,target=0,method ='brute')
                fi = permutation_importance(model,X_test,y_test,n_repeats=10)
                partial_dependence_plot_avgs = list(map(lambda item:item['average'],pdp.pd_results))
                grids = list(map(lambda item:item['grid_values'],pdp.pd_results))
                features_importance = list(fi.importances)
                partial_dependence_plot_grids = [item[0].tolist() for item in grids ]
            y_pred,partial_dependence_plot_avgs,partial_dependence_plot_grids,features_importance,fprs,tprs,aucs,probas
        `;
        try {
            const { results, error } = await asyncRun(script, this.context);
            if (results) {
                this.predictions = Array.from(results[0]);
                this.pdp_averages = Array.from(results[1]);
                this.pdp_grid = Array.from(results[2]);
                this.importances = Array.from(results[3]);
                this.fpr = Array.from(results[4]);
                this.tpr = Array.from(results[5]);
                this.auc = Array.from(results[6]);
                this.probas = Array.from(results[7]);

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
    async visualize(x_test, y_test, uniqueLabels, predictions, encoder, columns, categorical_columns) {
        await super.visualize(x_test, y_test, uniqueLabels, predictions, encoder)
        if (this.hasExplaination) {
            this.chartController.PFIBoxplot(this.id, this.importances, columns);
            this.chartController.plotPDP(this.id, this.pdp_averages, this.pdp_grid, uniqueLabels, columns, categorical_columns);
        }
        this.chartController.plotROC(this.id, this.fpr, this.tpr, uniqueLabels, this.auc);
        this.chartController.probabilities_boxplot(this.probas, predictions, y_test, this.id);
        this.chartController.probabilities_violin(this.probas, predictions, y_test, this.id);

    }
    predict() {
        return this.predictions;
    }
}