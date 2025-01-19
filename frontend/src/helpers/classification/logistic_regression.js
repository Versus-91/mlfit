
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
                       cvfit = cv.glmnet(as.matrix(scale_df), y, alpha = 0, family = "multinomial", type.measure = "class")
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

                    best_model <- glmnet(x, y, alpha =is_lasso,family = "multinomial", type.measure = "class", lambda = cvfit$lambda.min)
                    coefficients <- coef(best_model)
                    print(coefficients)
                    non_zero_features <- list()
                    for (class_name in names(coefficients)) {
                    class_coefficients <- coefficients[[class_name]]
                    dense_coefficients <- as.matrix(class_coefficients)
                    non_zero_indices <- which(dense_coefficients != 0, arr.ind = TRUE)
                    non_zero_features <- c(non_zero_features,rownames(dense_coefficients)[non_zero_indices[, 1]])
                    }
                    non_zero_features <- unique(non_zero_features)
                    non_zero_features <- unlist(Filter(function(x) x != "", non_zero_features))
                    print(non_zero_features)
                    x_filterd <- x[,unlist(non_zero_features)]
                    x_test_filterd <- x_test[,unlist(non_zero_features)]
                    model_lambda_min <- nnet::multinom(y ~ . , data = as.data.frame(x_filterd))
                    s <- summary(model_lambda_min)
                    coefs_lambda_min <- s$coefficients
                    stds_lambda_min <- s$standard.errors
                    z_scores_lambda_min <- coefs_lambda_min / stds_lambda_min
                    p_values_lambda_min <- 2 * (1 - pnorm(abs(z_scores_lambda_min)))
                    preds_lambda_min <- predict(model,newdata=as.data.frame(x_test_filterd))
                    preds_probs_lambda_min <- predict(model,type = 'probs',newdata=as.data.frame(x_test_filterd))
                    # confidence interval
                    z <- 1.96  
                    conf_int <- list()

                    for (class in rownames(coef(model_lambda_min))) {
                    conf_int[[class]] <- cbind(
                        class = class,
                        Estimate = coefs_lambda_min[class, ],
                        Lower = coefs_lambda_min[class, ] - z * stds_lambda_min[class, ],
                        Upper = coefs_lambda_min[class, ] + z * stds_lambda_min[class, ]
                    )
                    }



                    
                    conf_int_lambda_min_df <- do.call(rbind, conf_int)

                    best_model <- glmnet(x, y, alpha =is_lasso,family = "multinomial", type.measure = "class", lambda = cvfit$lambda.1se)
                    coefficients <- coef(best_model)
                    print(coefficients)
                    non_zero_features <- list()
                    for (class_name in names(coefficients)) {
                    class_coefficients <- coefficients[[class_name]]
                    dense_coefficients <- as.matrix(class_coefficients)
                    non_zero_indices <- which(dense_coefficients != 0, arr.ind = TRUE)
                    non_zero_features <- c(non_zero_features,rownames(dense_coefficients)[non_zero_indices[, 1]])
                    }
                    non_zero_features <- unique(non_zero_features)
                    non_zero_features <- unlist(Filter(function(x) x != "", non_zero_features))
                    print(non_zero_features)
                    x_filterd <- x[,unlist(non_zero_features)]
                    x_test_filterd <- x_test[,unlist(non_zero_features)]
                    model_lambda_1se <- nnet::multinom(y ~ . , data = as.data.frame(x_filterd))
                    s <- summary(model_lambda_1se)
                    coefs_lambda_1se <- s$coefficients
                    stds_lambda_1se <- s$standard.errors
                    z_scores_lambda_1se <- coefs_lambda_1se / stds_lambda_1se
                    p_values_lambda_1se <- 2 * (1 - pnorm(abs(z_scores_lambda_1se)))
                    preds_lambda_1se <- predict(model,newdata=as.data.frame(x_test_filterd))
                    preds_probs_lambda_1se <- predict(model,type = 'probs',newdata=as.data.frame(x_test_filterd))
                    # confidence interval
                    z <- 1.96  
                    conf_int <- list()

                    for (class in rownames(coef(model_lambda_1se))) {
                    conf_int[[class]] <- cbind(
                        class = class,
                        Estimate = coefs_lambda_1se[class, ],
                        Lower = coefs_lambda_1se[class, ] - z * stds_lambda_1se[class, ],
                        Upper = coefs_lambda_1se[class, ] + z * stds_lambda_1se[class, ]
                    )
                    }
                    conf_int_lambda_1se_df <- do.call(rbind, conf_int)


                    list(
                    plotly_json(p, pretty = FALSE)
                    ,rownames(coefs)
                    ,toJSON(coefs,pretty = TRUE)
                    ,toJSON(stds,pretty = TRUE)
                    ,toJSON(z_scores,pretty = TRUE)
                    ,toJSON(p_values,pretty = TRUE)
                    ,preds_probs
                    ,preds 
                    ,toJSON(conf_int_df)
                    ,rownames(conf_int_df)

                    ,rownames(conf_int_lambda_min_df)
                    ,toJSON(coefs_lambda_min,pretty = TRUE)
                    ,toJSON(stds_lambda_min,pretty = TRUE)
                    ,toJSON(p_values_lambda_min,pretty = TRUE)

                    ,rownames(conf_int_lambda_1se_df)
                    ,toJSON(coefs_lambda_1se,pretty = TRUE)
                    ,toJSON(stds_lambda_1se,pretty = TRUE)
                    ,toJSON(p_values_lambda_1se,pretty = TRUE)
                    ,model[["AIC"]]
                    ,model_lambda_min[["AIC"]]
                    ,model_lambda_1se[["AIC"]]
                    )

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
            aic: await results[18].toNumber(),
            best_fit_min: {
                names: await results[10].toArray(),
                coefs: JSON.parse(await results[11].toArray()),
                stds: JSON.parse(await results[12].toArray()),
                p_values: JSON.parse(await results[13].toArray()),
                aic: await results[19].toNumber(),

            },
            best_fit_1se: {
                names: await results[14].toArray(),
                coefs: JSON.parse(await results[15].toArray()),
                stds: JSON.parse(await results[16].toArray()),
                p_values: JSON.parse(await results[17].toArray()),
                aic: await results[20].toNumber(),
            }
        };
        this.model_stats_matrix = [];
        let cols = [...labels]
        cols.unshift("intercept")
        let min_ols_columns = this.summary['best_fit_min'].names;
        let se_ols_columns = this.summary['best_fit_1se'].names;



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
                    let coef = this.summary['best_fit_min']['coefs'][j][index]
                    let std = this.summary['best_fit_min']['stds'][j][index]
                    let pval = this.summary['best_fit_min']['p_values'][j][index]
                    row.push(isNaN(coef) ? 0 : coef.toFixed(2))
                    row.push(isNaN(std) ? 0 : coef.toFixed(2))
                    row.push(isNaN(pval) ? 0 : coef.toFixed(2))
                } else {
                    row.push(' ')
                    row.push(' ')
                    row.push(' ')
                }
                index = se_ols_columns.findIndex(m => m === cols[i])
                if (index !== -1) {
                    let coef = this.summary['best_fit_1se']['coefs'][j][index]
                    let std = this.summary['best_fit_1se']['stds'][j][index]
                    let pval = this.summary['best_fit_1se']['p_values'][j][index]
                    row.push(isNaN(coef) ? 0 : coef.toFixed(2))
                    row.push(isNaN(std) ? 0 : coef.toFixed(2))
                    row.push(isNaN(pval) ? 0 : coef.toFixed(2))
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
                    'BIC : ' + current.summary.aic.toFixed(2)
                );
                $(api.column(5).footer()).html(
                    'BIC : ' + current.summary["best_fit_min"].aic.toFixed(2)
                );
                $(api.column(8).footer()).html(
                    'BIC : ' + current.summary["best_fit_1se"].aic.toFixed(2)
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