
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */


import Plotly from 'danfojs/node_modules/plotly.js-dist-min';
import { RegressionModel } from '../regression_model';

export default class LinearRegression extends RegressionModel {
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
        await webR.installPackages(['jsonlite', 'iml', 'ggplot2', 'plotly', 'tidyr', 'dplyr', 'ggrepel', 'glmnet', 'modelsummary'], { quiet: true });
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
                    library(iml)
                    library(dplyr)
                    library(ggrepel)
                    library(modelsummary)
                    library(glmnet)

                    # Select all columns except the first as predictors. 
                    x <- as.matrix(xx)  
                    colnames(x) <- names
                    scale_df <- as.data.frame(x)

                    cols_to_scale <- setdiff(names, categorical_columns)
                    scale_df[cols_to_scale] <- scale(scale_df[cols_to_scale])
                    scaled_y <- scale(y)
                    base_model = cv.glmnet(as.matrix(scale_df), scaled_y)
                    weights <- 1 / abs(coef(base_model)[-1])
                    if(is_lasso){
                        cvfit = cv.glmnet(as.matrix(scale_df), scaled_y, alpha = 1,penalty.factor = weights)
                    }else{
                       cvfit = cv.glmnet(as.matrix(scale_df), scaled_y, alpha = 0)
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
                      scale_x_log10()+ labs(y = "Coefficients") + theme_bw()
                    df = with(cvfit,
                            data.frame(lambda = lambdas,MSE = cvm,MSEhi=cvup,MSElow=cvlo))

                    p2<-ggplot(df,aes(x=lambda,y=MSE)) + 
                    geom_point(col="#f05454") + 
                    scale_x_log10("lambda") + 
                    geom_errorbar(aes(ymin = MSElow,ymax=MSEhi),col="#30475e") + 
                    geom_vline(xintercept=c(cvfit$lambda.1se,cvfit$lambda.min),
                                linetype="dashed")+
                    theme_bw()

 
                    model <- lm(y ~ ., data = as.data.frame(x))
                    x <- as.matrix(x_test)  
                    colnames(x) <- names
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


                    best_lambda <- cvfit$lambda.min
                    x <- as.matrix(xx) 
                    colnames(x) <- names
                    # Get the coefficients for the best lambda
                    best_model <- glmnet(x, y, alpha =is_lasso, lambda = best_lambda)
                    coefficients <- as.matrix(coef(best_model))
                    nonzero_coef <- coefficients[coefficients != 0]
                    nonzero_features <- rownames(coefficients)[coefficients != 0 & rownames(coefficients) != "(Intercept)"]

                    X_reduced <- x[, nonzero_features]
                    linear_model_min_features <- nonzero_features

                    # Fit a linear regression model using the non-zero features
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


                    x <- as.matrix(x_test)  
                    colnames(x) <- names
                    x <- x[, nonzero_features]
                    predictions_min <- predict(linear_model_min, newdata = as.data.frame(x))
                    x <- as.matrix(xx)  
                    colnames(x) <- names
                    nonzero_coef <- coefficients[coefficients != 0]
                    
                    nonzero_features <- rownames(coefficients)[coefficients != 0 & rownames(coefficients) != "(Intercept)"]
                    X_reduced <- x[, nonzero_features]
                    linear_model_1se_features <- nonzero_features
                    linear_model_1se <- lm(y ~ ., data = as.data.frame(X_reduced))
                    coefs_1se <- coef(linear_model_1se)
                    print(coefs_1se)
                    pvals_1se <- summary(linear_model_1se)$coefficients[,4]
                    aic_1se<- AIC(linear_model_1se)
                    rsquared_1se <- summary(linear_model_1se)$r.squared
                    std_error_1se <- summary(linear_model_1se)$coefficients[,2]
                    residuals_1se <- resid(linear_model_1se)
                    fitted_values_1se <- fitted(linear_model_1se)
                    x <- as.matrix(x_test)  
                    colnames(x) <- names
                    x <- x[, nonzero_features]
                    predictions_1se <- predict(linear_model_1se, newdata = as.data.frame(x))


                    models <- list(
                        "OLS" = model,
                        "Lasso Min " = linear_model_min,
                        "Lasso 1se " = linear_model_1se
                        )
                    z <- modelplot(models =models,coef_omit = 'Interc')
                    qqplot_ols <-ggplot(data.frame(residuals = residuals_ols), aes(sample = residuals_ols)) +
                        stat_qq() +
                        stat_qq_line(col = "red") +
                        labs(title = "QQ Plot of Residuals",
                            x = "Theoretical Quantiles",
                            y = "Sample Quantiles") +
                        theme_bw()
                    qqplot_1se <-ggplot(data.frame(residuals = residuals_1se), aes(sample = residuals_1se)) +
                        stat_qq() +
                        stat_qq_line(col = "red") +
                        labs(title = "QQ Plot of Residuals",
                            x = "Theoretical Quantiles",
                            y = "Sample Quantiles") +
                        theme_bw()
                    qqplot_min <-ggplot(data.frame(residuals = residuals_min), aes(sample = residuals_min)) +
                        stat_qq() +
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

        reg_plot.layout['showlegend'] = false;
        reg_plot.layout.legend = {
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
        this.summary.coefs_plot.layout.xaxis.title.font = {
            size: 10
        };
        this.summary.regularization_plot = reg_plot;
        this.summary.errors_plot = JSON.parse(await results[1].toString());
        this.summary.qqplot_ols_plot = JSON.parse(await results[27].toString());
        this.summary.qqplot_1se_plot = JSON.parse(await results[28].toString());
        this.summary.qqplot_min_plot = JSON.parse(await results[29].toString());
        this.summary.qqplot_ols_plot.layout.title.font = {

            size: 10
        };



        this.summary.qqplot_ols_plot.data[0].marker.size = 2;
        this.summary.qqplot_ols_plot.layout.height = 300
        this.summary.qqplot_ols_plot.layout.width = 300

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
        this.summary.qqplot_1se_plot.data[0].marker.size = 2;

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


        this.summary.qqplot_min_plot.data[0].marker.size = 2;
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

        await Plotly.newPlot('parameters_plot_' + current.id, current.summary.coefs_plot, { autosize: true });
        await Plotly.newPlot('regularization_' + current.id, current.summary.regularization_plot, { autosize: true });
        await Plotly.newPlot('errors_' + current.id, current.summary.errors_plot, { autosize: true });
        await Plotly.newPlot('qqplot_ols_' + current.id, current.summary.qqplot_ols_plot, { autosize: true });
        await Plotly.newPlot('qqplot_min_' + current.id, current.summary.qqplot_min_plot, { autosize: true });
        await Plotly.newPlot('qqplot_1se_' + current.id, current.summary.qqplot_1se_plot, { autosize: true });
        current.ui.yhat_plot(y_test, this.summary['predictions'], 'regression_y_yhat_' + current.id, 'OLS predictions')
        current.ui.yhat_plot(y_test, this.summary['predictionsmin'], 'regression_y_yhat_min_' + current.id, 'lasso min predictions')
        current.ui.yhat_plot(y_test, this.summary['predictions1se'], 'regression_y_yhat_1se_' + current.id, 'lasso 1se predictions')
        current.ui.residual_plot(y_test, this.summary['residuals_ols'], 'regression_residual_' + current.id, 'OLS residuals')
        current.ui.residual_plot(y_test, this.summary['residuals_min'], 'regression_residual_min_' + current.id, 'lasso min residuals')
        current.ui.residual_plot(y_test, this.summary['residuals_1se'], 'regression_residual_1se_' + current.id, 'lasso 1se residuals')
        this.ui.predictions_table_regression(x_test, y_test, predictions, this.id);
        window.dispatchEvent(new Event('resize'));

    }
}