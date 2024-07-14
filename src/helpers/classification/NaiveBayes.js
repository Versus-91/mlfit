import { GaussianNB } from 'scikitjs'
import { asyncRun } from "@/helpers/py-worker";

export default class NaiveBayes {
    constructor(options) {
        this.options = options
        this.model = null
    }
    async train(x_train, y_train, x_test = null) {
        const priors = this.options.priors ? this.options.priors?.split(',').map((m) => parseFloat(m)) : undefined
        if (this.options.type === "Gaussian") {
            this.model = new GaussianNB({ priors: priors })
            await this.model.fit(x_train, y_train)
        } else {
            this.context = {
                nb_type: this.options.type === "Multinomial" ? 0 : 1,
                priors: this.options.priors,
                X_train: x_train,
                y_train: y_train,
                X_test: x_test,
            };
            const script = `
            from sklearn.naive_bayes import BernoulliNB
            from sklearn.naive_bayes import MultinomialNB
            from js import X_train,y_train,X_test,nb_type,priors
            if priors is not None and priors.strip():
                priors = [float(x) for x in priors.split(',')]
            else:
                priors = None
            print("priors",priors)
            if nb_type == 0:
                model = MultinomialNB(class_prior=priors)
            else:
                model = BernoulliNB(class_prior=priors)
            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)
            y_pred
        `;
            try {
                const { results, error } = await asyncRun(script, this.context);
                if (results) {
                    console.log("pyodideWorker return results: ", results);
                    return results;
                } else if (error) {
                    console.log("pyodideWorker error: ", error);
                }
            } catch (e) {
                console.log(
                    `Error in pyodideWorker at ${e.filename}, Line: ${e.lineno}, ${e.message}`,
                );
            }
        }


    }
    predict(x_test) {
        const result = this.model.predict(x_test);
        return result.dataSync()
    }
}