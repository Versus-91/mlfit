
import Plotly from 'plotly.js-dist-min';

export default class PolynomialRegression {
    constructor(options) {
        this.options = options;
        this.model = null;

    }
    async train_test(x_train, y_train, x_test, y_test, labels, container_regularization, container_errors, container_coefs) {
        this.context = {
            X_train: x_train,
            y_train: y_train,
            y_test: y_test,
            X_test: x_test,
            regularization_type: this.options.regularization === "Lasso" ? 1 : 0,
            labels: labels
        };
        async ({ WebR }) => {
            const webR = new WebR({ interactive: false });
            await webR.init();
            await webR.installPackages(['jsonlite', 'ggplot2', 'plotly', 'tidyr', 'dplyr', 'ggrepel', 'glmnet', 'modelsummary'], { quiet: true });
            await webR.objs.globalEnv.bind('xx', x_train);
            await webR.objs.globalEnv.bind('x_test', x_test);

            await webR.objs.globalEnv.bind('y', y_train);
            await webR.objs.globalEnv.bind('names', labels);
            await webR.objs.globalEnv.bind('is_lasso', this.context.regularization_type);


            const plotlyData = await webR.evalR(`
                    library(plotly)
                    library(ggplot2)
                    library(tidyr)
                    library(dplyr)
                    library(ggrepel)
                    library(modelsummary)
                    library(glmnet)
                    degree <- 2
                    x <-   as.matrix(xx)

                    lam = 10 ^ seq (-2,3, length =100)    
                    cvfit = cv.glmnet(x, y, alpha = is_lasso)
                    
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
                      scale_x_log10()
                    
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
                    predictions <- predict(model, newdata = as.data.frame(x))
                    # Get coefficients, p-values, and standard errors
                    coefs <- coef(model)
                    print(coefs)
                    pvals <- summary(model)$coefficients[,4]
                    std_error <- summary(model)$coefficients[,2]
                    aic_value <- AIC(model)
                    bic_value <- BIC(model)
                    rsquared <- summary(model)$r.squared
                    residuals_ols <- resid(model)
                    fitted_values_ols <- fitted(model)


                    best_lambda <- cvfit$lambda.min
                    x <- as.matrix(xx)
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
                    x <- x[, nonzero_features]
                    predictions_min <- predict(linear_model_min, newdata = as.data.frame(x))
                    x <- as.matrix(xx)
                    nonzero_coef <- coefficients[coefficients != 0]
                    
                    nonzero_features <- rownames(coefficients)[coefficients != 0 & rownames(coefficients) != "(Intercept)"]
                    X_reduced <- x[, nonzero_features]
                    linear_model_1se_features <- nonzero_features
                    linear_model_1se <- lm(y ~ ., data = as.data.frame(X_reduced))
                    print(coef(linear_model_1se))
                    coefs_1se <- coef(linear_model_1se)
                    pvals_1se <- summary(linear_model_1se)$coefficients[,4]
                    aic_1se<- AIC(linear_model_1se)
                    rsquared_1se <- summary(linear_model_1se)$r.squared
                    std_error_1se <- summary(linear_model_1se)$coefficients[,2]
                    residuals_1se <- resid(linear_model_1se)
                    fitted_values_1se <- fitted(linear_model_1se)
                    x <- as.matrix(x_test)
                    x <- x[, nonzero_features]
                    predictions_1se <- predict(linear_model_1se, newdata = as.data.frame(x))
                    models <- list(
                        "OLS" = model,
                        "Min OLS" = linear_model_min,
                        "1se OLS" = linear_model_1se
                        )
                    z <- modelplot(models =models,coef_omit = 'Interc')
                    term_labels <- attr(terms(model), "term.labels")
                    qqplot_ols <-ggplot(data.frame(residuals = residuals_ols), aes(sample = residuals_ols)) +
                        stat_qq() +
                        stat_qq_line(col = "red") +
                        labs(title = "QQ Plot of Residuals",
                            x = "Theoretical Quantiles",
                            y = "Sample Quantiles") +
                        theme_minimal()
                    qqplot_1se <-ggplot(data.frame(residuals = residuals_1se), aes(sample = residuals_1se)) +
                        stat_qq() +
                        stat_qq_line(col = "red") +
                        labs(title = "QQ Plot of Residuals",
                            x = "Theoretical Quantiles",
                            y = "Sample Quantiles") +
                        theme_minimal()
                    qqplot_min <-ggplot(data.frame(residuals = residuals_min), aes(sample = residuals_min)) +
                        stat_qq() +
                        stat_qq_line(col = "red") +
                        labs(title = "QQ Plot of Residuals",
                            x = "Theoretical Quantiles",
                            y = "Sample Quantiles") +
                        theme_minimal()
                    list(plotly_json(p, pretty = FALSE),plotly_json(p2, pretty = FALSE),coefs,pvals,std_error,predictions,aic_value,bic_value,rsquared,coefs_min,pvals_min,std_error_min
                    ,coefs_1se,pvals_1se,std_error_1se,plotly_json(z, pretty = FALSE),linear_model_min_features,linear_model_1se_features
                    ,residuals_ols,residuals_1se,residuals_min,predictions_1se,predictions_min,rsquared_1se,aic_1se,rsquared_min,aic_min,term_labels
                    ,plotly_json(qqplot_ols, pretty = FALSE)
                    ,plotly_json(qqplot_1se, pretty = FALSE)
                    ,plotly_json(qqplot_min, pretty = FALSE))
                    `);
            let results = await plotlyData.toArray()
            let reg_plot = JSON.parse(await results[0].toString())
            reg_plot.layout.legend["orientation"] = 'h'
            reg_plot.layout['showlegend'] = false;
            Plotly.newPlot(container_regularization, reg_plot, {
            });
            Plotly.newPlot(container_errors, JSON.parse(await results[1].toString()), {});
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
            Plotly.newPlot(container_coefs, coefs_plot, {});

            let summary = {
                labels: await results[27].toArray(),
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
            return summary;
        }
    }
    predict(x_test) {
        const result = this.model.predict(x_test);
        return result
    }
}