
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
        this.plots = [];
        this.tables = [];
        this.helpSectionId = 'help';
        this.hasExplaination = true;
        this.seed = 123;

    }
    async train(x, y, x_test, y_test) {
        throw new Error('Not implemented', x, y, x_test, y_test)
    }
    async evaluateModel(y, predictions) {
        return { mse: calculateMSE(y, predictions), rsquared: calculateRSquared(y, predictions) };
    }
    async visualize(x_test, y_test, _, predictions) {
        let current = this;
        return new Promise((resolve) => {
            setTimeout(() => {
                let y = y_test
                let residuals = [];
                predictions.forEach((element, i) => {
                    residuals.push(y[i] - element)
                });
                current.ui.yhat_plot(y, predictions, 'regression_y_yhat_' + current.id, 'Predictions')
                current.ui.residual_plot(predictions, residuals, 'errors_' + current.id, 'Residuals')
                this.ui.predictions_table_regression(x_test, y_test, predictions, this.id);
                this.plots.push('regression_y_yhat_' + current.id);
                this.plots.push('errors_' + current.id);
                this.tables.push('#predictions_table_' + this.id);
                resolve('resolved');
            }, 500);
        });
    }
}