
import { KNeighborsClassifier } from 'scikitjs'
import { ClassificationModel } from '../model';
import { evaluate_classification } from '@/helpers/utils';
import { LabelEncoder } from 'danfojs/dist/danfojs-base';

export default class KNNModel extends ClassificationModel {
    constructor(options) {
        super();
        this.options = options
        this.model = null;

    }
    async fit(x_train, y_train, metric, k = 3) {
        this.model = new KNeighborsClassifier({ nNeighbors: k, metric: metric })
        await this.model.fit(x_train, y_train);
    }
    predict(x_test) {
        if (this.model === null || this.model === undefined) {
            throw "model not found."
        }
        var predictions = window.tf.tidy(() => {
            let results = this.model.predict(x_test);
            return Array.from(results.dataSync())
        })
        return predictions
    }
    async train(x_train, y_train, x_test, y_test) {
        this.results = []
        let encoder = new LabelEncoder()
        encoder.fit(y_train)
        let encoded_y_train = encoder.transform(y_train)
        let encoded_y_test = encoder.transform(y_test)
        let metrics = ['manhattan', 'euclidean']
        for (let i = 0; i < metrics.length; i++) {
            const metric = metrics[i];
            for (let k = this.options.min.value; k <= this.options.max.value; k++) {
                await this.fit(x_train, encoded_y_train, metric, k)
                let predictions_test = this.predict(x_test)
                let predictions_train = this.predict(x_train)
                let pobas = this.predict_probas(x_test)
                let evaluation_test = evaluate_classification(predictions_test, encoded_y_test, encoder)
                let evaluation_train = evaluate_classification(predictions_train, encoded_y_train, encoder)
                this.results.push({ k: k, predictions: predictions_test, evaluation: evaluation_test, evaluation_train: evaluation_train, probas: pobas, metric: metric })
            }
        }

        this.optimalTestSpec = this.results[0];
        this.optimalTrainSpec = this.results[0];

        this.results.forEach(element => {
            if (element.evaluation.accuracy > this.optimalTestSpec.evaluation.accuracy) {
                this.optimalTestSpec = element
            }
            if (element.evaluation_train.accuracy > this.optimalTrainSpec.evaluation_train.accuracy) {
                this.optimalTrainSpec = element
            }
        });

        return this.optimalTestSpec.predictions
    }
    predict_probas(x_test) {
        if (this.model === null || this.model === undefined) {
            throw "model not found."
        }
        var predictions = window.tf.tidy(() => {
            let results = this.model.predictProba(x_test);
            return Array.from(results.arraySync())
        })
        return predictions
    }
    async visualize(x_test, y_test, uniqueLabels, predictions, encoder) {
        await super.visualize(x_test, y_test, uniqueLabels, predictions, encoder)
        this.chartController.KNNPerformancePlot(this.results, this.optimalTrainSpec, this.optimalTestSpec, this.id);
        this.plots.push('knn_table_' + this.id);

    }

}