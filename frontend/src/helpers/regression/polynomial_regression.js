
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */


import Plotly from 'danfojs/node_modules/plotly.js-dist-min';
import { RegressionModel } from '../regression_model';

export default class PolynomialRegression extends RegressionModel {
    constructor(options) {
        super();
        this.options = options;
        this.model = null;
        this.hasExplaination = false
        this.summary = null;
        this.model_stats_matrix = null;

    }

    async train(x_train, y_train, x_test, y_test, labels, categorical_columns) {

        let regularization_type = this.options?.regularization?.value === "Lasso" ? 1 : 0;
        let degree = +this.options?.degree?.value;

        const webR = window.webr;
        await webR.init();
        await webR.installPackages(['jsonlite', 'ggplot2', 'plotly', 'tidyr', 'broom', 'dplyr', 'ggrepel', 'glmnet', 'modelsummary'], { quiet: true });
        await webR.objs.globalEnv.bind('xx', x_train);
        await webR.objs.globalEnv.bind('x_test', x_test);
        await webR.objs.globalEnv.bind('random_seed', this.seed);

        await webR.objs.globalEnv.bind('y', y_train);
        await webR.objs.globalEnv.bind('degree', degree);
        await webR.objs.globalEnv.bind('names', labels);
        await webR.objs.globalEnv.bind('categorical_columns', categorical_columns?.length === 0 ? ['empty'] : categorical_columns);

        await webR.objs.globalEnv.bind('is_lasso', regularization_type);


        const plotlyData = await webR.evalR(`
                    library(plotly)
                    library(ggplot2)
                    library(tidyr)
                    library(dplyr)
                    library(broom)

                    library(ggrepel)
                    library(modelsummary)
                    library(glmnet)
                    set.seed(random_seed)

                    # Select all columns except the first as predictors. 
                    add_powers <- function(df, degree,columns) {
                            new_df <- df  # Copy the original data frame
                            for (col in columns) {
                                for (d in 2:degree){
                                    new_col_name <- paste0(col, "_", d)
                                    new_df[[new_col_name]] <- df[[col]]^d
                                }
                            }
                            return(new_df)
                        }
                        
                    x <- as.matrix(xx)  
                    colnames(x) <- names
                    cols_numerical <- setdiff(names, categorical_columns)
                    df_main <- add_powers(as.data.frame(x), degree,cols_numerical)
                    scale_df <- add_powers(as.data.frame(x), degree,cols_numerical)
                    all_column_names <- colnames(scale_df)
                    cols_to_scale <- setdiff(all_column_names, categorical_columns)
                    scale_df[cols_to_scale] <- scale(scale_df[cols_to_scale])
                    
                    x <- as.matrix(x_test)  
                    colnames(x) <- names
                    df_test <- add_powers(as.data.frame(x), degree,cols_numerical)
                    base_model = cv.glmnet(as.matrix(scale_df), y)
                    weights <- 1 / abs(coef(base_model)[-1])

                    if(is_lasso){
                        cvfit = cv.glmnet(as.matrix(scale_df), y, alpha = 1)
                    }else{
                       cvfit = cv.glmnet(as.matrix(scale_df), y, alpha = 0)
                    }
                    betas = as.matrix(cvfit$glmnet.fit$beta)
                    lambdas = cvfit$lambda
                    names(lambdas) = colnames(betas)
                    
                    p <- as.data.frame(betas) %>% 
                      tibble::rownames_to_column("variable") %>% 
                      pivot_longer(-variable) %>% 
                      mutate(lambda=lambdas[name]) %>% 
                      mutate(variable = factor(variable, levels = sort(unique(variable)))) %>%

                    ggplot(aes(x=lambda,y=value,col=variable)) + 
                      geom_line() + 
                      geom_label_repel(data=~subset(.x,lambda==min(lambda)),
                                       aes(label=variable),nudge_x=-0.5) +
                      geom_vline(xintercept=c(cvfit$lambda.1se,cvfit$lambda.min),
                                linetype="dashed")+
                      scale_x_log10() +
                      labs(y = "Coefficient") +
                    theme_bw()
                    
                    df = with(cvfit,
                            data.frame(lambda = lambdas,MSE = cvm,MSEhi=cvup,MSElow=cvlo))

                    p2<-ggplot(df,aes(x=lambda,y=MSE)) + 
                    geom_point(col="#f05454") + 
                    scale_x_log10("lambda") + 
                    geom_errorbar(aes(ymin = MSElow,ymax=MSEhi),col="#30475e") + 
                    geom_vline(xintercept=c(cvfit$lambda.1se,cvfit$lambda.min),
                                linetype="dashed")+
                    theme_bw()

                     # Get lambda.min and lambda.1se
                    lambda_min = cvfit$lambda.min
                    lambda_1se = cvfit$lambda.1se

                    # Get the coefficients at lambda.min and lambda.1se
                    coef_lambda_min = coef(cvfit, s = "lambda.min")
                    coef_lambda_1se = coef(cvfit, s = "lambda.1se")

                    # Convert the sparse matrix to a regular matrix to make indexing easier
                    coef_lambda_min_matrix = as.matrix(coef_lambda_min)
                    coef_lambda_1se_matrix = as.matrix(coef_lambda_1se)
                    coef_lambda_min_matrix = coef_lambda_min_matrix[-1, , drop = FALSE]
                    coef_lambda_1se_matrix = coef_lambda_1se_matrix[-1, , drop = FALSE]
                    # Find the non-zero features at lambda.min and lambda.1se
                    non_zero_features_min = rownames(coef_lambda_min_matrix)[coef_lambda_min_matrix != 0]
                    non_zero_features_1se = rownames(coef_lambda_1se_matrix)[coef_lambda_1se_matrix != 0]
                    print(non_zero_features_min)
                    print(non_zero_features_1se)
                    x <- as.matrix(df_main)
                    colnames(x) <- all_column_names

                    model <- lm(y ~ ., data = as.data.frame(x))

                    x <- as.matrix(df_test)  
                    colnames(x) <- all_column_names

                    predictions <- predict(model, newdata = as.data.frame(x))
                    # Get coefficients, p-values, and standard errors
                    coefs <- coef(model)
                    pvals <- summary(model)$coefficients[,4]
                    std_error <- summary(model)$coefficients[,2]
                    aic_value <- AIC(model)
                    bic_value <- BIC(model)
                    rsquared <- summary(model)$r.squared
                    residuals_ols <- resid(model)
                    fitted_values_ols <- fitted(model)

                    x <- as.matrix(df_main)  
                    colnames(x) <- all_column_names
                    X_reduced <- x[, non_zero_features_min]
                    linear_model_min_features <- non_zero_features_min
                    # Fit a linear regression model using the non-zero features
                    print(colnames(X_reduced))
                    linear_model_min <- lm(y ~ ., data = as.data.frame(X_reduced))
                    coefs_min <- coef(linear_model_min)
                    pvals_min <- summary(linear_model_min)$coefficients[,4]
                    std_error_min <- summary(linear_model_min)$coefficients[,2]
                    aic_min <- AIC(linear_model_min)
                    rsquared_min <- summary(linear_model_min)$r.squared
                    best_lambda <- cvfit$lambda.1se
                    best_model <- glmnet(x, y, alpha =is_lasso, lambda = best_lambda)
                    coefficients <- as.matrix(coef(best_model))
                    residuals_min <- resid(linear_model_min)
                    fitted_values_min <- fitted(linear_model_min)
                    x <- as.matrix(df_test)  
                    colnames(x) <- all_column_names
                    predictions_min <- predict(linear_model_min, newdata = as.data.frame(x))





                    x <- as.matrix(df_main)  
                    colnames(x) <- all_column_names
                    
                    X_reduced <- x[, non_zero_features_1se]
                    linear_model_1se_features <- non_zero_features_1se
                    print(colnames(X_reduced))
                    linear_model_1se <- lm(y ~ ., data = as.data.frame(X_reduced))
                    coefs_1se <- coef(linear_model_1se)
                    print(coefs_1se)
                    pvals_1se <- summary(linear_model_1se)$coefficients[,4]
                    aic_1se<- AIC(linear_model_1se)
                    rsquared_1se <- summary(linear_model_1se)$r.squared
                    std_error_1se <- summary(linear_model_1se)$coefficients[,2]
                    residuals_1se <- resid(linear_model_1se)
                    fitted_values_1se <- fitted(linear_model_1se)
                    x <- as.matrix(df_test) 
                    colnames(x) <- all_column_names 
                    x <- x[, linear_model_1se_features]
                    predictions_1se <- predict(linear_model_1se, newdata = as.data.frame(x))
                    models <- list(
                        "OLS" = model,
                        "Lasso Min " = linear_model_min,
                        "Lasso 1se " = linear_model_1se
                        )

                    z <- modelplot(models =models,coef_omit = 'Interc')
                    qqplot_ols <-ggplot(data.frame(residuals = residuals_ols), aes(sample = residuals_ols)) +
                        stat_qq(color = "blue") +
                        stat_qq_line(col = "red") +
                        labs(title = "QQ Plot of Residuals",
                            x = "Theoretical Quantiles",
                            y = "Sample Quantiles") +
                        theme_bw()
                    qqplot_1se <-ggplot(data.frame(residuals = residuals_1se), aes(sample = residuals_1se)) +
                        stat_qq(color = "blue") +
                        stat_qq_line(col = "red") +
                        labs(title = "QQ Plot of Residuals",
                            x = "Theoretical Quantiles",
                            y = "Sample Quantiles") +
                        theme_bw()
                    qqplot_min <-ggplot(data.frame(residuals = residuals_min), aes(sample = residuals_min)) +
                        stat_qq(color = "blue") +
                        stat_qq_line(col = "red") +
                        labs(title = "QQ Plot of Residuals",
                            x = "Theoretical Quantiles",
                            y = "Sample Quantiles") +
                        theme_bw()
                    list(plotly_json(p, pretty = FALSE),plotly_json(p2, pretty = FALSE),coefs,
                    pvals,std_error,predictions,aic_value,bic_value,rsquared
                    ,coefs_min,pvals_min,std_error_min
                    ,coefs_1se,pvals_1se,std_error_1se,plotly_json(z, pretty = FALSE),linear_model_min_features,linear_model_1se_features
                    ,residuals_ols,residuals_1se,residuals_min,predictions_1se,predictions_min,rsquared_1se,aic_1se,rsquared_min,aic_min
                    ,plotly_json(qqplot_ols, pretty = FALSE)
                    ,plotly_json(qqplot_1se, pretty = FALSE)
                    ,plotly_json(qqplot_min, pretty = FALSE)
                    ,all_column_names
                    )
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
            columnNames: await results[30].toArray()
        };
        this.model_stats_matrix = [];
        let cols = this.summary.columnNames
        cols.unshift("intercept")
        let min_ols_columns = this.summary['best_fit_min'].names;

        min_ols_columns.unshift('intercept');
        let se_ols_columns = this.summary['best_fit_1se'].names;
        se_ols_columns.unshift('intercept');
        function isNumeric(value) {
            return /^-?\d+$/.test(value);
        }

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
        this.model_stats_matrix = this.model_stats_matrix.sort(function (a, b) {
            if (a[0] > b[0]) {
                return 1
            }
            if (a[0] < b[0]) {
                return -1
            }
            return 0
        })
        this.model_stats_matrix.reverse()
        let reg_plot = JSON.parse(await results[0].toString())
        reg_plot.layout['showlegend'] = true;
        reg_plot.layout['autosize'] = true;
        reg_plot.layout['responsive'] = true;
        reg_plot.layout.xaxis['side'] = 'top';
        reg_plot.layout.legend = {
            orientation: 'h',
            font: {

                size: 8,
                color: '#000'
            },
        };
        let coefs_plot = JSON.parse(await results[15].toString())
        coefs_plot.layout.legend = {
            x: 0,
            y: 1,
            traceorder: 'normal',
            font: {

                size: 8,
                color: '#000'
            },
        };
        this.summary.coefs_plot = coefs_plot;
        this.summary.coefs_plot.layout['autosize'] = true;
        this.summary.coefs_plot.layout['responsive'] = true;
        this.summary.coefs_plot.layout.xaxis.title.font = {
            size: 10
        };
        this.summary.regularization_plot = reg_plot;
        this.summary.errors_plot = JSON.parse(await results[1].toString());
        this.summary.qqplot_ols_plot = JSON.parse(await results[27].toString());
        this.summary.qqplot_1se_plot = JSON.parse(await results[28].toString());
        this.summary.qqplot_min_plot = JSON.parse(await results[29].toString());

        this.summary.qqplot_ols_plot.layout.height = 300
        this.summary.qqplot_ols_plot.layout.width = 300
        this.summary.qqplot_ols_plot.layout.title.font = {

            size: 10
        };
        this.summary.qqplot_ols_plot.data[0].marker.size = 3;
        this.summary.qqplot_ols_plot.layout.xaxis.title.font = {

            size: 10
        };
        this.summary.qqplot_ols_plot.layout.yaxis.title.font = {

            size: 10
        };

        this.summary.qqplot_1se_plot.layout.height = 300
        this.summary.qqplot_1se_plot.layout.width = 300
        this.summary.qqplot_1se_plot.layout.title.font = {

            size: 10
        };
        this.summary.qqplot_1se_plot.data[0].marker.size = 3;

        this.summary.qqplot_1se_plot.layout.xaxis.title.font = {

            size: 10
        };
        this.summary.qqplot_1se_plot.layout.yaxis.title.font = {

            size: 10
        };

        this.summary.qqplot_min_plot.layout.height = 300
        this.summary.qqplot_min_plot.layout.width = 300
        this.summary.qqplot_min_plot.layout.title.font = {

            size: 10
        };
        this.summary.qqplot_min_plot.layout.xaxis.title.font = {

            size: 10
        };
        this.summary.qqplot_min_plot.layout.yaxis.title.font = {

            size: 10
        };
        this.summary.qqplot_min_plot.data[0].marker.size = 3;
        return this.summary['predictions'];
    }
    async visualize(x_test, y_test, uniqueLabels, predictions, encoder) {
        await super.visualize(x_test, y_test, uniqueLabels, predictions)
        let current = this;

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
            columnDefs: [
                {
                    "targets": 3,
                    "createdCell": function (td, cellData, rowData, row, col) {
                        if (rowData[3] <= 0.05) {
                            $(td).css('color', 'red')
                        }
                    }
                },
                {
                    "targets": 6,
                    "createdCell": function (td, cellData, rowData, row, col) {
                        if (rowData[6] <= 0.05) {
                            $(td).css('color', 'red')
                        }
                    }
                },
                {
                    "targets": 9,
                    "createdCell": function (td, cellData, rowData, row, col) {
                        if (rowData[9] <= 0.05) {
                            $(td).css('color', 'red')
                        }
                    }
                }
            ],
        });

        Plotly.newPlot('regularization_' + current.id, current.summary.regularization_plot, { autosize: true, responsive: true });
        Plotly.newPlot('parameters_plot_' + current.id, current.summary.coefs_plot, { autosize: true, responsive: true });
        Plotly.newPlot('errors_' + current.id, current.summary.errors_plot, { autosize: true, responsive: true });
        Plotly.newPlot('qqplot_ols_' + current.id, current.summary.qqplot_ols_plot);
        Plotly.newPlot('qqplot_min_' + current.id, current.summary.qqplot_min_plot);
        Plotly.newPlot('qqplot_1se_' + current.id, current.summary.qqplot_1se_plot);
        current.ui.yhat_plot(y_test, this.summary['predictions'], 'regression_y_yhat_' + + current.id, 'OLS predictions')
        current.ui.yhat_plot(y_test, this.summary['predictionsmin'], 'regression_y_yhat_min_' + + current.id, 'lasso min predictions')
        current.ui.yhat_plot(y_test, this.summary['predictions1se'], 'regression_y_yhat_1se_' + + current.id, 'lasso 1se predictions')
        current.ui.residual_plot(y_test, this.summary['residuals_ols'], 'regression_residual_' + + current.id, 'OLS residuals')
        current.ui.residual_plot(y_test, this.summary['residuals_min'], 'regression_residual_min_' + + current.id, 'lasso min residuals')
        current.ui.residual_plot(y_test, this.summary['residuals_1se'], 'regression_residual_1se_' + + current.id, 'lasso 1se residuals')
        this.ui.predictions_table_regression(x_test, y_test, predictions, this.id);
    }

}