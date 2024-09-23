import { asyncRun } from "@/helpers/py-worker";
import { ClassificationModel } from '../model';

export default class NaiveBayes extends ClassificationModel {
    constructor(options) {
        super();
        this.options = options
        this.model = null
    }
    async train(x_train, y_train, x_test, y_test) {
        // const priors = this.options.priors.value ? this.options.priors?.value.split(',').map((m) => parseFloat(m)) : undefined
        this.context = {
            nb_type: this.options.type.value === "Multinomial" ? 0 : this.options.type.value === "Gaussian" ? 1 : 2,
            priors: this.options.priors.value,
            smoothing: +this.options.laplace.value,
            num_classes: [...new Set(y_train)].length,
            X_train: x_train,
            y_train: y_train,
            y_test: y_test,
            X_test: x_test,
        };
        const script = `
            from sklearn.naive_bayes import BernoulliNB
            from sklearn.naive_bayes import MultinomialNB
            from js import X_train,y_train,X_test,nb_type,priors,smoothing,y_test,num_classes
            from sklearn.naive_bayes import GaussianNB
            from sklearn.inspection import partial_dependence
            from sklearn.inspection import permutation_importance
            from sklearn.metrics import roc_auc_score
            from sklearn.metrics import roc_curve
            from sklearn.preprocessing import LabelBinarizer
            if priors is not None and priors.strip():
                priors = [float(x) for x in priors.split(',')]
            else:
                priors = None
            print("priors",priors)
            if nb_type == 0:
                model = MultinomialNB(class_prior=priors , alpha = smoothing)
            if nb_type == 1:
                model = GaussianNB(priors=priors)
            else:
                model = BernoulliNB(class_prior=priors , alpha = smoothing)
            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)
            probas = model.predict_proba(X_test)
            pdp_results = partial_dependence(model, X_train, [0])
            fi = permutation_importance(model,X_test,y_test,n_repeats=10)
            tprs=[]
            fprs=[]

            label_binrize = LabelBinarizer().fit(y_train)
            y_test_one_hot = label_binrize.transform(y_test)
            
            try:
                curve = roc_curve(y_test,probas)
            except:
                for i in range(num_classes):
                    fpr,tpr,_ = roc_curve(y_test_one_hot[:,i],probas[:,i])
                    fprs.append(fpr)
                    tprs.append(tpr)
            y_pred,pdp_results["average"],list(pdp_results["grid_values"][0]), list(fi.importances),fprs,tprs
        `;
        try {
            const { results, error } = await asyncRun(script, this.context);
            if (results) {
                console.log("pyodideWorker return results: ", results);
                this.predictions = Array.from(results[0]);
                this.pdp_averages = Array.from(results[1]);
                this.pdp_grid = Array.from(results[2]);
                this.importances = Array.from(results[3]);
                this.fpr = Array.from(results[4]);
                this.tpr = Array.from(results[5]);

            } else if (error) {
                console.log("pyodideWorker error: ", error);
            }
        } catch (e) {
            console.log(
                `Error in pyodideWorker at ${e.filename}, Line: ${e.lineno}, ${e.message}`,
            );
        }
        return this.predictions;
    }
    async visualize(x_test, y_test, uniqueLabels, predictions, encoder, columns) {
        await super.visualize(x_test, y_test, uniqueLabels, predictions, encoder)
        this.chartController.PFIBoxplot(this.id, this.importances, columns);
        this.chartController.plotPDP(this.id, this.pdp_averages, this.pdp_grid, uniqueLabels, columns[0]);
        this.chartController.plotROC(this.id, this.fpr, this.tpr, uniqueLabels);

    }
}