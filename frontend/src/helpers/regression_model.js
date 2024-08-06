
import ChartController from '@/helpers/charts';
import UI from '@/helpers/ui';
import { metrics } from './utils.js';

export class RegressionModel {

    constructor() {
        this.chartController = new ChartController();
        this.ui = new UI(null, null)
        this.task = null;
        this.predictions = [];
        this.id = null;
    }
    async train(x, y, x_test, y_test) {
        throw new Error('Not implemented', x, y, x_test, y_test)
    }
    async evaluateModel(y, predictions, _, uniqueClasses) {
        return await metrics(y, predictions, uniqueClasses);
    }
    async visualize(x_test, y_test, uniqueLabels, predictions) {
        return new Promise((resolve) => {
            setTimeout(() => {
                this.ui.predictions_table_regression(x_test, y_test, predictions, this.id);
                resolve('resolved');
            }, 1000);
        });
    }
}