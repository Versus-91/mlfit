
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */


import Plotly from 'danfojs/node_modules/plotly.js-dist-min';
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
                    library(jsonlite)
                    library(glmnet)
                    set.seed(123)
                    # Select all columns except the first as predictors. 
                    x <- as.matrix(xx)  
                    colnames(x) <- names
                    scale_df <- as.data.frame(x)
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
                    
                    df = with(cvfit,
                            data.frame(lambda = lambdas,MSE = cvm,MSEhi=cvup,MSElow=cvlo))

            
                    p <-ggplot(df,aes(x=lambda,y=MSE)) + 
                    geom_point(col="#f05454") + 
                    scale_x_log10("lambda") + 
                    geom_errorbar(aes(ymin = MSElow,ymax=MSEhi),col="#30475e") + 
                    geom_vline(xintercept=c(cvfit$lambda.1se,cvfit$lambda.min),
                                linetype="dashed")+
                    theme_bw()
                    colnames(x_test) <- names
                    model <- nnet::multinom(y ~ . , data = as.data.frame(x))
                    s <- summary(model)
                    coefs <- s$coefficients
                    stds <- s$standard.errors
                    z_scores <- coefs / stds
                    p_values <- 2 * (1 - pnorm(abs(z_scores)))
                    preds <- predict(model,newdata=as.data.frame(x_test))
                    preds_probs <- predict(model,type = 'probs',newdata=as.data.frame(x_test))
                    print(coefs)
                    list(
                    plotly_json(p, pretty = FALSE)
                    ,rownames(coefs)
                    ,toJSON(coefs,pretty = TRUE)
                    ,toJSON(stds,pretty = TRUE)
                    ,toJSON(z_scores,pretty = TRUE)
                    ,toJSON(p_values,pretty = TRUE)
                    ,preds_probs
                    ,preds)
                    `);
        let results = await plotlyData.toArray()

        this.summary = {
            plot: await results[0].toArray(),
            classes: await results[1].toArray(),
            coefs: JSON.parse(await results[2].toArray()),
            stds: JSON.parse(await results[3].toArray()),
            z_scores: JSON.parse(await results[4].toArray()),
            p_values: JSON.parse(await results[5].toArray()),
            probabities: await results[6].toArray(),
            predictions: (await results[7].toArray()).map(pred => pred - 1),
        };
        this.model_stats_matrix = [];
        let cols = [...labels]
        cols.unshift("intercept")
        let min_ols_columns = []
        let se_ols_columns = []
        for (let j = 0; j < this.summary.classes.length; j++) {
            for (let i = 0; i < cols.length; i++) {
                let row = [];
                row.push(cols[i])
                row.push((isNaN(this.summary['coefs'][j][i]) ? ' ' : this.summary['coefs'][j][i].toFixed(2)))
                row.push((isNaN(this.summary['stds'][j][i]) ? ' ' : this.summary['stds'][j][i].toFixed(2)))
                row.push((isNaN(this.summary['p_values'][j][i]) ? ' ' : this.summary['p_values'][j][i].toFixed(2)))

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
            if (j < this.summary.classes.length - 1) {
                let placeholder_row = this.model_stats_matrix[0].map(m => '');
                this.model_stats_matrix.push(placeholder_row)
            }
        }
        return this.summary['predictions'];
    }
    async visualize(x_test, y_test, uniqueLabels, predictions, encoder, columns, categorical_columns) {
        await super.visualize(x_test, y_test, uniqueLabels, predictions, encoder)
        let current = this;
        return new Promise((resolve) => {
            setTimeout(() => {
                new DataTable('#metrics_table_' + current.id, {
                    responsive: false,
                    "footerCallback": function (row, data, start, end, display) {
                        var api = this.api();
                        $(api.column(2).footer()).html(
                            'R2 : '
                        );
                        $(api.column(5).footer()).html(
                            'R2 : '
                        );
                        $(api.column(8).footer()).html(
                            'R2 : '
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
                resolve('resolved');
            }, 1000);
        });

    }
}