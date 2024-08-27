
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */


import Plotly from 'plotly.js-dist-min';
import { ClassificationModel } from '../model';

export default class LinearRegression extends ClassificationModel {
    constructor(options) {
        super();
        this.options = options;
        this.model = null;
        this.summary = null;
        this.model_stats_matrix = null;

    }

    async train(x_train, y_train, x_test, y_test, labels, categorical_columns) {
        this.context = {
            X_train: x_train,
            y_train: y_train,
            y_test: y_test,
            X_test: x_test,
            regularization_type: this.options.regularization.value === "Lasso" ? 1 : 0,
            labels: labels
        };

        const webR = window.webr;
        await webR.init();
        await webR.installPackages(['jsonlite', 'ggplot2', 'plotly', 'nnet', 'tidyr', 'dplyr', 'ggrepel', 'glmnet', 'modelsummary'], { quiet: true });
        await webR.objs.globalEnv.bind('xx', x_train);
        await webR.objs.globalEnv.bind('x_test', x_test);

        await webR.objs.globalEnv.bind('y', y_train);
        await webR.objs.globalEnv.bind('names', labels);
        await webR.objs.globalEnv.bind('categorical_columns', categorical_columns?.length === 0 ? ['empty'] : categorical_columns);

        await webR.objs.globalEnv.bind('is_lasso', this.context.regularization_type);


        const plotlyData = await webR.evalR(`
                    library(plotly)
                    library(ggplot2)
                    library(tidyr)
                    library(dplyr)
                    library(ggrepel)
                    library(modelsummary)
                    library(glmnet)

                    # Select all columns except the first as predictors. 
                    x <- as.matrix(xx)  
                    colnames(x) <- names
                    scale_df <- as.data.frame(x)
                    y <- as.factor(y)
                    cols_to_scale <- setdiff(names, categorical_columns)
                    scale_df[cols_to_scale] <- scale(scale_df[cols_to_scale])
                    if(is_lasso){
                        cvfit = cv.glmnet(as.matrix(scale_df), y, alpha = 1, family = "multinomial", type.multinomial = "ungrouped")
                    }else{
                       cvfit = cv.glmnet(as.matrix(scale_df), y, alpha = 0, family = "multinomial", type.multinomial = "ungrouped")
                    }
                    betas = as.matrix(cvfit$glmnet.fit$beta)
                    lambdas = cvfit$lambda
                    names(lambdas) = colnames(betas)
                    
                    
                    p <- as.data.frame(betas) %>% 
                      tibble::rownames_to_column("variable") %>% 
                      pivot_longer(-variable) %>% 
                      mutate(lambda=lambdas[name]) %>% 
                    ggplot(aes(x=lambda,y=value,col=variable)) + 
                      geom_line() + 
                      geom_label_repel(data=~subset(.x,lambda==min(lambda)),
                                       aes(label=variable),nudge_x=-0.5) +
                      geom_vline(xintercept=c(cvfit$lambda.1se,cvfit$lambda.min),
                                linetype="dashed")+
                    scale_color_discrete(name = "variable") +  
                      scale_x_log10()
                    
                    df = with(cvfit,
                            data.frame(lambda = lambdas,MSE = cvm,MSEhi=cvup,MSElow=cvlo))

            
                    p2 <-ggplot(df,aes(x=lambda,y=MSE)) + 
                    geom_point(col="#f05454") + 
                    scale_x_log10("lambda") + 
                    geom_errorbar(aes(ymin = MSElow,ymax=MSEhi),col="#30475e") + 
                    geom_vline(xintercept=c(cvfit$lambda.1se,cvfit$lambda.min),
                                linetype="dashed")+
                    theme_bw()

 
                    list(plotly_json(p, pretty = FALSE))
                    `);
        let results = await plotlyData.toArray()

        this.summary = {
            params: await results[2].toArray(),
            bse: await results[4].toArray(),
            pvalues: await results[3].toArray(),
            predictions: await results[5].toArray(),
            predictions1se: await results[21].toArray(),
            predictionsmin: await results[22].toArray(),
            residuals_ols: await results[18].toArray(),
            residuals_1se: await results[19].toArray(),
            residuals_min: await results[20].toArray(),
            aic: await results[6].toNumber(),
            bic: await results[7].toNumber(),
            r2: await results[8].toNumber(),
            best_fit_min: {
                r2: await results[25].toNumber(),
                aic: await results[26].toNumber(),
                names: await results[16].toArray(),
                coefs: await results[9].toArray(),
                bse: await results[11].toArray(),
                pvalues: await results[10].toArray(),
            },
            best_fit_1se: {
                r2: await results[23].toNumber(),
                aic: await results[24].toNumber(),
                names: await results[17].toArray(),
                coefs: await results[12].toArray(),
                bse: await results[14].toArray(),
                pvalues: await results[13].toArray(),
            },
        };
        this.model_stats_matrix = [];
        let cols = [...labels]
        cols.unshift("intercept")
        let min_ols_columns = this.summary['best_fit_min'].names;

        min_ols_columns.unshift('intercept');
        let se_ols_columns = this.summary['best_fit_1se'].names;
        se_ols_columns.unshift('intercept');

        for (let i = 0; i < cols.length; i++) {
            let row = [];
            row.push(cols[i])
            row.push(this.summary['params'][i]?.toFixed(2) ?? ' ')
            row.push(this.summary['bse'][i]?.toFixed(2) ?? ' ')
            row.push(this.summary['pvalues'][i]?.toFixed(2) ?? ' ')
            let index = min_ols_columns.findIndex(m => m === cols[i])
            if (index !== -1) {
                row.push(this.summary['best_fit_min']['coefs'][index]?.toFixed(2) ?? ' ')
                row.push(this.summary['best_fit_min']['bse'][index]?.toFixed(2) ?? ' ')
                row.push(this.summary['best_fit_min']['pvalues'][index]?.toFixed(2) ?? ' ')
            } else {
                row.push(' ')
                row.push(' ')
                row.push(' ')
            }
            index = se_ols_columns.findIndex(m => m === cols[i])
            if (index !== -1) {
                row.push(this.summary['best_fit_1se']['coefs'][index]?.toFixed(2) ?? ' ')
                row.push(this.summary['best_fit_1se']['bse'][index]?.toFixed(2) ?? ' ')
                row.push(this.summary['best_fit_1se']['pvalues'][index]?.toFixed(2) ?? ' ')
            } else {
                row.push(' ')
                row.push(' ')
                row.push(' ')
            }
            this.model_stats_matrix.push(row)
        }
        this.model_stats_matrix.reverse()
        let reg_plot = JSON.parse(await results[0].toString())
        reg_plot.layout.legend["orientation"] = 'h'
        reg_plot.layout['showlegend'] = false;

        let coefs_plot = JSON.parse(await results[15].toString())
        coefs_plot.layout.legend = {
            x: 0,
            y: 1,
            traceorder: 'normal',
            font: {
                family: 'sans-serif',
                size: 8,
                color: '#000'
            },
        };
        this.summary.coefs_plot = coefs_plot;
        this.summary.regularization_plot = reg_plot;
        this.summary.regularization_plot.layout['autosize'] = true
        this.summary.regularization_plot.layout['staticPlot'] = true
        this.summary.regularization_plot.layout['responsive'] = true
        this.summary.errors_plot = JSON.parse(await results[1].toString());
        this.summary.qqplot_ols_plot = JSON.parse(await results[27].toString());
        this.summary.qqplot_1se_plot = JSON.parse(await results[28].toString());
        this.summary.qqplot_min_plot = JSON.parse(await results[29].toString());

        return this.summary['predictions'];
    }
    async visualize(x_test, y_test, uniqueLabels, predictions, encoder) {
        let current = this;
        return new Promise((resolve) => {
            setTimeout(() => {
                new DataTable('#metrics_table_' + current.id, {
                    responsive: false,
                    "footerCallback": function (row, data, start, end, display) {
                        var api = this.api();
                        $(api.column(2).footer()).html(
                            'R2 : ' + current.summary.r2.toFixed(2) + ' AIC: ' + current.summary.aic.toFixed(2)
                        );
                        $(api.column(5).footer()).html(
                            'R2 : ' + current.summary['best_fit_min'].r2.toFixed(2) + ' AIC: ' + current.summary['best_fit_min'].aic.toFixed(2)
                        );
                        $(api.column(8).footer()).html(
                            'R2 : ' + current.summary['best_fit_1se'].r2.toFixed(2) + ' AIC: ' + current.summary['best_fit_1se'].aic.toFixed(2)
                        );
                    },
                    data: current.model_stats_matrix,
                    info: false,
                    search: false,
                    ordering: false,
                    searching: false,
                    paging: false,
                    bDestroy: true,
                });

                Plotly.newPlot('parameters_plot_' + current.id, current.summary.coefs_plot, { staticPlot: false });
                Plotly.newPlot('regularization_' + current.id, current.summary.regularization_plot, { staticPlot: true });
                Plotly.newPlot('errors_' + current.id, current.summary.errors_plot, { staticPlot: true });
                Plotly.newPlot('qqplot_ols_' + current.id, current.summary.qqplot_ols_plot, { staticPlot: true });
                Plotly.newPlot('qqplot_min_' + current.id, current.summary.qqplot_min_plot, { staticPlot: true });
                Plotly.newPlot('qqplot_1se_' + current.id, current.summary.qqplot_1se_plot, { staticPlot: true });
                current.ui.yhat_plot(y_test, this.summary['predictions'], 'regression_y_yhat_' + + current.id, 'OLS predictions')
                current.ui.yhat_plot(y_test, this.summary['predictionsmin'], 'regression_y_yhat_min_' + + current.id, 'OLS min predictions')
                current.ui.yhat_plot(y_test, this.summary['predictions1se'], 'regression_y_yhat_1se_' + + current.id, 'OLS 1se predictions')
                current.ui.residual_plot(y_test, this.summary['residuals_ols'], 'regression_residual_' + + current.id, 'OLS residuals')
                current.ui.residual_plot(y_test, this.summary['residuals_min'], 'regression_residual_min_' + + current.id, 'OLS min residuals')
                current.ui.residual_plot(y_test, this.summary['residuals_1se'], 'regression_residual_1se_' + + current.id, 'OLS 1se residuals')
                this.ui.predictions_table_regression(x_test, y_test, predictions, this.id);
                resolve('resolved');
            }, 1000);
        });

    }
}