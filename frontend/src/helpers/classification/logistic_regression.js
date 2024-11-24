
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
                        cvfit = cv.glmnet(as.matrix(scale_df), y, alpha = 1, family = "multinomial", type.measure = "class")
                    }else{
                       cvfit = cv.glmnet(as.matrix(scale_df), y, alpha = 1, family = "multinomial", type.measure = "class")
                    }
                    betas = as.matrix(cvfit$glmnet.fit$beta)
                    lambdas = cvfit$lambda
                    names(lambdas) = colnames(betas)
                    
                    df  <- data.frame(
                        log_lambda = log(cvfit$lambda),       
                        mean_cv_error = cvfit$cvm,                
                        lower_error = cvfit$cvup,    
                        upper_error = cvfit$cvlo    
                        )
                    lambda_min <- log(cvfit$lambda.min) 
                    lambda_1se <- log(cvfit$lambda.1se)  
            
                    p <-ggplot(df,aes(x=log_lambda,y=mean_cv_error)) + 
                    geom_point(col="#f05454") + 
                    geom_errorbar(aes(ymin = lower_error,ymax=upper_error),col="#30475e") + 
                    geom_vline(xintercept=c(lambda_1se,lambda_min),
                                linetype="dashed")+
                    annotate("text", x = lambda_min, y = max(df$mean_cv_error), 
                            label = "Min", color = "black", hjust = -0.1) +
                    annotate("text", x = lambda_1se, y = max(df$mean_cv_error) - 0.02, 
                            label = "1-SE", color = "black", hjust = -0.1) +
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
                    # confidence interval
                    z <- 1.96  
                    conf_int <- list()

                    for (class in rownames(coef(model))) {
                    conf_int[[class]] <- cbind(
                        class = class,
                        Estimate = coefs[class, ],
                        Lower = coefs[class, ] - z * stds[class, ],
                        Upper = coefs[class, ] + z * stds[class, ]
                    )
                    }
                    conf_int_df <- do.call(rbind, conf_int)

                    print(conf_int_df)

                    list(
                    plotly_json(p, pretty = FALSE)
                    ,rownames(coefs)
                    ,toJSON(coefs,pretty = TRUE)
                    ,toJSON(stds,pretty = TRUE)
                    ,toJSON(z_scores,pretty = TRUE)
                    ,toJSON(p_values,pretty = TRUE)
                    ,preds_probs
                    ,preds ,toJSON(conf_int_df),rownames(conf_int_df))
                    `);
        let results = await plotlyData.toArray()

        this.summary = {
            regularization_plot: JSON.parse(await results[0].toString()),
            classes: await results[1].toArray(),
            coefs: JSON.parse(await results[2].toArray()),
            stds: JSON.parse(await results[3].toArray()),
            z_scores: JSON.parse(await results[4].toArray()),
            p_values: JSON.parse(await results[5].toArray()),
            probabities: await results[6].toArray(),
            predictions: (await results[7].toArray()).map(pred => pred - 1),
            confidence_intervals: JSON.parse(await results[8].toString()),
            confidence_intervals_row_names: await results[9].toArray(),
        };
        this.model_stats_matrix = [];
        let cols = [...labels]
        cols.unshift("intercept")
        let min_ols_columns = []
        let se_ols_columns = []



        this.summary.regularization_plot.layout['showlegend'] = false;
        this.summary.regularization_plot.layout.legend = {
            font: {

                size: 8,
                color: '#000'
            },
        };


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
        await Plotly.newPlot('regularization_' + current.id, current.summary.regularization_plot, { autosize: true });
        let x = []
        let y = []
        let x_low = []
        let x_high = []

        this.summary.confidence_intervals_row_names.forEach((row, i) => {
            x.push(this.summary.confidence_intervals[i][1]);
            y.push(row + this.summary.confidence_intervals[i][0]);
            x_low.push(Math.abs(this.summary.confidence_intervals[i][2]));
            x_high.push(Math.abs(this.summary.confidence_intervals[i][3]));

        })
        var data = [
            {
                x: x,
                y: y,
                error_x: {
                    type: 'data',
                    symmetric: false,
                    array: x_low,
                    arrayminus: x_high
                },
                type: 'scatter'
            }
        ];
        await Plotly.newPlot('parameters_plot_' + current.id, data);


    }
}