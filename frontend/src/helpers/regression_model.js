
import ChartController from '@/helpers/charts';
import UI from '@/helpers/ui';
import { calculateMSE, calculateRSquared } from './utils.js';

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
    async evaluateModel(y, predictions) {
        return [calculateMSE(y,predictions),calculateRSquared(y,predictions)];
    }
    async visualize(x_test, y_test, uniqueLabels, predictions) {
        let current = this;
        return new Promise((resolve) => {
            setTimeout(() => {
                let y = y_test
                let residuals = [];
                predictions.forEach((element, i) => {
                    residuals.push(y[i] - element)
                });
                console.log(residuals);

                current.ui.yhat_plot(y, predictions, 'regression_y_yhat_' + + current.id, 'OLS predictions')
                current.ui.residual_plot(predictions,residuals,'errors_' + + current.id, 'Residuals')
                this.ui.predictions_table_regression(x_test, y_test, predictions, this.id);
                resolve('resolved');
            }, 1000);
        });
    }
}