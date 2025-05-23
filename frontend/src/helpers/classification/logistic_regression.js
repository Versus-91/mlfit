
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */


import Plotly from 'danfojs/node_modules/plotly.js-dist-min';
import { ClassificationModel } from '../model';

export default class LogisticRegression extends ClassificationModel {
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
            seed: this.seed,
            regularization_type: this.options.regularization.value === "Lasso" ? 1 : 0,
            labels: labels
        };

        const webR = window.webr;
        await webR.init();
        await webR.installPackages(['jsonlite', 'ggplot2', 'plotly', 'nnet', 'purrr', 'dplyr', 'ggrepel', 'glmnet', 'modelsummary', 'broom'], { quiet: true });
        await webR.objs.globalEnv.bind('xx', x_train);
        await webR.objs.globalEnv.bind('random_seed', this.seed);
        await webR.objs.globalEnv.bind('x_test', x_test);

        await webR.objs.globalEnv.bind('y', y_train);
        await webR.objs.globalEnv.bind('names', labels);
        await webR.objs.globalEnv.bind('categorical_columns', categorical_columns?.length === 0 ? ['empty'] : categorical_columns);

        await webR.objs.globalEnv.bind('is_lasso', this.context.regularization_type);


        const plotlyData = await webR.evalR(`
                    library(plotly)
                    library(ggplot2)
                    library(purrr)
                    library(dplyr)
                    library(ggrepel)
                    library(modelsummary)
                    library(jsonlite)
                    library(glmnet)
                    library(broom)
                    set.seed(random_seed)
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
                    xlab("log lambda") +
                    ylab("Error")+
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

                    non_zero_features <- list()
                    for (class_name in names(coefficients)) {
                    class_coefficients <- coefficients[[class_name]]
                    dense_coefficients <- as.matrix(class_coefficients)
                    non_zero_indices <- which(dense_coefficients != 0, arr.ind = TRUE)
                    non_zero_features <- c(non_zero_features,rownames(dense_coefficients)[non_zero_indices[, 1]])
                    }
                    non_zero_features <- unique(non_zero_features)
                    non_zero_features <- unlist(Filter(function(x) x != "", non_zero_features))
                    x_filterd <- x[,unlist(non_zero_features)]
                    x_test_filterd <- x_test[,unlist(non_zero_features)]


                    model_lambda_min <- nnet::multinom(y ~ . , data = as.data.frame(x_filterd))
                    s <- summary(model_lambda_min)
                    coefs_lambda_min <- s$coefficients
                    stds_lambda_min <- s$standard.errors
                    z_scores_lambda_min <- coefs_lambda_min / stds_lambda_min
                    p_values_lambda_min <- 2 * (1 - pnorm(abs(z_scores_lambda_min)))
                    preds_lambda_min <- predict(model_lambda_min,newdata=as.data.frame(x_test_filterd))
                    preds_probs_lambda_min <- predict(model_lambda_min,type = 'probs',newdata=as.data.frame(x_test_filterd))
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
                    print("got here")
                    non_zero_features <- list()
                    for (class_name in names(coefficients)) {
                    class_coefficients <- coefficients[[class_name]]
                    dense_coefficients <- as.matrix(class_coefficients)
                    non_zero_indices <- which(dense_coefficients != 0, arr.ind = TRUE)
                    non_zero_features <- c(non_zero_features,rownames(dense_coefficients)[non_zero_indices[, 1]])
                    }
                    non_zero_features <- unique(non_zero_features)
                    non_zero_features <- unlist(Filter(function(x) x != "", non_zero_features))

                    x_filterd <- x[,unlist(non_zero_features)]
                    x_test_filterd <- x_test[,unlist(non_zero_features)]
                    model_lambda_1se <- nnet::multinom(y ~ . , data = as.data.frame(x_filterd))
                    s <- summary(model_lambda_1se)
                    coefs_lambda_1se <- s$coefficients
                    stds_lambda_1se <- s$standard.errors
                    z_scores_lambda_1se <- coefs_lambda_1se / stds_lambda_1se
                    p_values_lambda_1se <- 2 * (1 - pnorm(abs(z_scores_lambda_1se)))
                    preds_lambda_1se <- predict(model_lambda_1se,newdata=as.data.frame(x_test_filterd))
                    preds_probs_lambda_1se <- predict(model_lambda_1se,type = 'probs',newdata=as.data.frame(x_test_filterd))
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

                    lambda_values <- cvfit$glmnet.fit$lambda

                    coef_list <- coef(cvfit$glmnet.fit)

                    cv_summary <- map_df(names(coef_list), function(class) {
                    coef_matrix <- as.matrix(coef_list[[class]])[-1, ]  # Remove intercept
                    data.frame(
                        lambda = rep(lambda_values, each = nrow(coef_matrix)),
                        predictor = rep(rownames(coef_matrix), length(lambda_values)),
                        coefficient = as.vector(coef_matrix),
                        class = class
                    )
                    })

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
                    ,toJSON(cv_summary)
                    ,toJSON(conf_int_lambda_min_df)
                    ,toJSON(conf_int_lambda_1se_df)
                    ,lambda_min
                    ,lambda_1se
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
                confidence_intervals: JSON.parse(await results[22].toString()),
                coefs: JSON.parse(await results[11].toArray()),
                stds: JSON.parse(await results[12].toArray()),
                p_values: JSON.parse(await results[13].toArray()),
                aic: await results[19].toNumber(),

            },
            best_fit_1se: {
                names: await results[14].toArray(),
                confidence_intervals: JSON.parse(await results[23].toString()),
                coefs: JSON.parse(await results[15].toArray()),
                stds: JSON.parse(await results[16].toArray()),
                p_values: JSON.parse(await results[17].toArray()),
                aic: await results[20].toNumber(),
            },
            fit: JSON.parse(await results[21].toArray()),
            lambda_min: await results[24].toNumber(),
            lambda_1se: await results[25].toNumber(),

        };

        this.model_stats_matrix = [];
        let cols = [...labels]
        cols.unshift("(Intercept)")
        let min_ols_columns = [...new Set(this.summary['best_fit_min'].names)].map(m => m.replace(/^`|`$/g, ''));
        let se_ols_columns = [...new Set(this.summary['best_fit_1se'].names)].map(m => m.replace(/^`|`$/g, ''));



        this.summary.regularization_plot.layout['showlegend'] = false;
        this.summary.regularization_plot.layout['autosize'] = true;
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
                    row.push(isNaN(std) ? 0 : std.toFixed(2))
                    row.push(isNaN(pval) ? 0 : pval.toFixed(2))
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
                    row.push(isNaN(std) ? 0 : std.toFixed(2))
                    row.push(isNaN(pval) ? 0 : pval.toFixed(2))
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
        setTimeout(async () => {
            let current = this;
            new DataTable('#metrics_table_' + current.id, {
                responsive: false,
                "footerCallback": function (row, data, start, end, display) {
                    var api = this.api();
                    $(api.column(2).footer()).html(
                        'AIC : ' + current.summary.aic.toFixed(2)
                    );
                    $(api.column(5).footer()).html(
                        'AIC : ' + current.summary["best_fit_min"].aic.toFixed(2)
                    );
                    $(api.column(8).footer()).html(
                        'AIC : ' + current.summary["best_fit_1se"].aic.toFixed(2)
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
            let y_classes = this.summary.confidence_intervals_row_names
                .map((item, i) => item + '_' + this.summary.confidence_intervals[i][0]).reverse()
            let conf_intervals = this.summary.confidence_intervals.reverse()
            let traces_params = []
            let ols_y = y_classes.map((m, i) => i);
            traces_params.push({
                name: 'OLS',
                x: conf_intervals.map(item => item[1]),
                y: ols_y,
                error_x: {
                    type: 'data',
                    array: conf_intervals.map(item => Math.abs(item[3] - item[1])),
                },
                type: 'scatter', mode: 'markers',
                showlegend: true,  // Make sure the trace appears in the legend
            })
            let y_classes_min = this.summary.best_fit_min.names
                .map((item, i) => item + '_' + this.summary.best_fit_min.confidence_intervals[i][0]).reverse()
            let conf_intervals_min = this.summary.best_fit_min.confidence_intervals.reverse()
            let lasso_y = y_classes_min.map((m, i) => i + 0.2);
            traces_params.push({
                name: 'lasso min',
                x: conf_intervals_min.map(item => item[1]),
                y: lasso_y,
                error_x: {
                    type: 'data',
                    array: conf_intervals_min.map(item => Math.abs(item[3] - item[1])),
                },
                type: 'scatter', mode: 'markers',
                showlegend: true,  // Make sure the trace appears in the legend
            })
            let _1se_y = y_classes_min.map((m, i) => i + 0.4);
            let y_classes_1se = this.summary.best_fit_1se.names
                .map((item, i) => item + '_' + this.summary.best_fit_1se.confidence_intervals[i][0]).reverse()
            let conf_intervals_1se = this.summary.best_fit_1se.confidence_intervals.reverse()
            traces_params.push({
                name: 'lasso 1se',
                x: conf_intervals_1se.map(item => item[1]),
                y: _1se_y,
                error_x: {
                    type: 'data',
                    array: conf_intervals_1se.map(item => Math.abs(item[3] - item[1])),
                },
                type: 'scatter', mode: 'markers',
                showlegend: true,  // Make sure the trace appears in the legend
            })
            await Plotly.newPlot('parameters_plot_' + current.id, {
                'data': traces_params,
                'layout': {
                    margin: {
                        l: 80,
                        r: 40,
                        b: 40,
                        t: 40,
                        pad: 10
                    },
                    showlegend: true,
                    legend: {
                        xanchor: 'left',
                        yanchor: 'top',
                        x: 0.02,
                        y: 0.98,
                        font: {
                            size: 8,  // Set font size for legend
                            color: "black" // Change font color if needed
                        },
                        bgcolor: "rgba(0,0,0,0)"
                    },
                    xaxis: {
                        linecolor: 'black',
                        linewidth: 1,
                        zeroline: true,
                        mirror: true,
                        title: 'Confidence interval',
                    },
                    yaxis: {
                        linecolor: 'black',
                        linewidth: 1,
                        zeroline: false,
                        mirror: true,
                        tickvals: lasso_y,
                        ticktext: y_classes_1se,
                        tickfont: { size: 10 }
                    },
                }
            });

            this.summary.fit.sort((a, b) => a.lambda - b.lambda);
            let subset = this.summary.fit.filter(m => m.class == '1')
            let params = new Set(...[subset.filter(m => !!m.predictor).map(m => m.predictor)])
            let traces = []
            let annotations = []
            params.forEach(param => {
                let coefs = subset.filter(m => m.predictor == param).map(m => m.coefficient)
                let lambdas = subset.filter(m => m.predictor == param).map(m => Math.log(m.lambda))
                traces.push({
                    name: param,
                    y: coefs,
                    x: lambdas,
                    mode: 'lines',
                });
                annotations.push({
                    xref: 'paper',
                    x: .01,
                    y: coefs[0],
                    xanchor: 'left',
                    yanchor: 'middle',
                    text: param,
                    font: {
                        family: 'Arial',
                        size: 8,
                        color: 'black'
                    },
                    showarrow: false
                });
                annotations = annotations.concat([
                    {
                        x: this.summary.lambda_min,
                        y: 0.5, // Center the text along the line
                        xref: 'x',
                        yref: 'paper',
                        text: "Lambda min",
                        showarrow: false,
                        font: {
                            size: 8,
                            color: "black"
                        },
                        textangle: -90, // Rotate text to be vertical
                        align: "center"
                    },
                    {
                        x: this.summary.lambda_1se,
                        y: 0.5, // Center the text along the line
                        xref: 'x',
                        yref: 'paper',
                        text: "Lambda 1se",
                        showarrow: false,
                        font: {
                            size: 8,
                            color: "black"
                        },
                        textangle: -90, // Rotate text to be vertical
                        align: "center"
                    }
                ])
            });

            await Plotly.newPlot('errors_' + current.id, {

                'data': traces,
                'layout': {
                    shapes: [
                        {
                            type: 'line',
                            x0: this.summary.lambda_min,
                            x1: this.summary.lambda_min,
                            y0: 0,
                            y1: 1,
                            xref: 'x',
                            yref: 'paper',
                            line: {
                                color: 'black',
                                dash: 'dashdot',
                                width: 1
                            }
                        },
                        {
                            type: 'line',
                            x0: this.summary.lambda_1se,
                            x1: this.summary.lambda_1se,
                            y0: 0,
                            y1: 1,
                            xref: 'x',
                            yref: 'paper',
                            line: {
                                color: 'black',
                                dash: 'dashdot',
                                width: 1
                            }
                        },
                    ],
                    annotations: annotations,
                    showlegend: false,
                    margin: {
                        l: 40,
                        r: 40,
                        b: 40,
                        t: 40,
                        pad: 10
                    },
                    autosize: true,
                    xaxis: {
                        linecolor: 'black',
                        linewidth: 1,
                        zeroline: false,
                        mirror: true,
                        title: 'log lambda'
                    },
                    yaxis: {
                        linecolor: 'black',
                        linewidth: 1,
                        zeroline: false,
                        mirror: true,
                        title: 'coefficient'
                    }
                }
            });
            window.dispatchEvent(new Event('resize'));
        }, 500);

    }
}