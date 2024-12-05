
import ChartController from '@/helpers/charts';
import { tensorflow } from 'danfojs/dist/danfojs-base';
import UI from '@/helpers/ui';
import { evaluate_classification } from '@/helpers/utils';
import { metrics } from './utils.js';

export class ClassificationModel {

    constructor() {
        this.chartController = new ChartController();
        this.ui = new UI(null, null)
        this.task = null;
        this.predictions = [];
        this.hasProbability = false;
        this.plots = [];
        this.tables = [];
        this.seed = 1;
        this.hasExplaination = true;
        this.id = null;
        this.helpSectionId = 'help';

    }
    async train(x, y, x_test, y_test) {
        throw new Error('Not implemented', x, y, x_test, y_test)
    }
    async evaluateModel(y, predictions, uniqueClasses) {
        return await metrics(y, predictions, uniqueClasses);
    }
    async visualize(x_test, y_test, uniqueLabels, predictions, encoder) {


        const evaluation_result = evaluate_classification(predictions, y_test, encoder);
        const classes = encoder.inverseTransform(Object.values(encoder.$labels));

        await this.chartController.plotConfusionMatrix(tensorflow.tensor(predictions), tensorflow.tensor(y_test), classes, Object.values(encoder.$labels), this.id);
        await this.chartController.classificationPCA(x_test.values, encoder.inverseTransform(y_test), evaluation_result, uniqueLabels, this.id);
        this.ui.predictions_table(x_test, encoder.inverseTransform(y_test), encoder.inverseTransform(predictions), null, this.id);
        this.plots.push('pca_results_' + this.id);
        this.tables.push('#predictions_table_' + this.id);

    }
}