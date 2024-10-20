/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import Plotly from 'danfojs/node_modules/plotly.js-dist-min';
import PCA from './dimensionality-reduction/pca';
import { binarize } from './utils'
import * as ss from "simple-statistics"
import { schemeCategory10, interpolateYlGnBu } from 'd3-scale-chromatic';
import { FeatureCategories } from "./settings";
import { metrics as ClassificationMetric, encode_name } from './utils.js';
import { metrics } from '@tensorflow/tfjs-vis';
import { scale_data } from './utils';
import { tensorflow } from 'danfojs/dist/danfojs-base';

export default class ChartController {
    constructor() {
        this.color_scheme = schemeCategory10;
        this.color_scheme_sequential = interpolateYlGnBu;

    }

    // eslint-disable-next-line no-unused-vars
    classification_target_chart(values, labels, name, container, title = "") {
        var uniqueLabels = [...new Set(labels)];
        var colorIndices = labels.map(label => this.indexToColor(uniqueLabels.indexOf(label)));
        var data = [];
        data.push({
            name: "Count",
            data: values.map((item, i) => ({ y: item, color: colorIndices[i] }))
        })

        Highcharts.chart(container, {
            credits: {
                enabled: false
            },
            title: {
                text: ""
            },
            chart: {
                type: 'column'
            },
            xAxis: {
                categories: uniqueLabels,
            },
            yAxis: {
                min: 0,
            },
            plotOptions: {
                column: {
                    pointPadding: 0.1,
                    borderWidth: 0
                }
            },
            colors: colorIndices,
            series: data
        });
    }
    regression_target_chart(items, container, name) {
        let kde_data = [];
        let ys = [];
        let items_range = items
        var breaks = ss.equalIntervalBreaks(items_range, 100);
        let kde = ss.kernelDensityEstimation(items, 'gaussian', 'nrd');
        breaks.forEach((item) => {
            ys.push(kde(item, 'nrd'));
            kde_data.push([item, ys[ys.length - 1]]);
        });


        Highcharts.chart(container, {
            credits: {
                enabled: false
            },
            legend: {
                enabled: false,
                verticalAlign: 'top',
            },
            chart: {
                height: '300',
                type: "spline",
                animation: true,
            },
            title: {
                text: name // Assuming `column` is defined elsewhere
            },
            yAxis: {
                title: { text: null }
            },
            tooltip: {
                valueDecimals: 3
            },
            plotOptions: {
                series: {
                    marker: {
                        enabled: false
                    },
                    dashStyle: "shortdot",
                    area: true
                }
            },
            series: [{
                type: 'area',
                dashStyle: "solid",
                lineWidth: 2,
                data: kde_data
            }]
        });
    }
    draw_categorical_barplot(column_values, target, title) {
        const key = title + "- barplot";
        $("#categories_barplots").append(`<div class="column is-4" style="height:40vh;" id="${key}"></div>`)
        const countOccurrences = column_values.reduce((acc, val) => {
            acc[val] = (acc[val] || 0) + 1;
            return acc;
        }, {});
        const countArray = Object.entries(countOccurrences).map(([value, count]) => ({ value: value, count }));
        countArray.sort((a, b) => b.count - a.count);
        const top5 = countArray.slice(0, 5);
        new Highcharts.Chart({
            chart: {
                renderTo: key,
                type: 'column'
            },
            xAxis: {
                categories: top5.map(m => m.value),
            },
            title: {
                text: title
            },
            yAxis: {
                min: 0,
                labels: {
                    overflow: 'justify'
                }
            },
            credits: {
                enabled: false
            },
            plotOptions: {
                bar: {
                    dataLabels: {
                        enabled: true
                    }
                }
            },
            series: [{
                showInLegend: false,
                name: title,
                data: top5.map(m => m.count)
            }]
        });

    }
    roc_chart(container, true_positive_rates, false_positive_rates) {
        var trace = {
            x: false_positive_rates,
            y: true_positive_rates,
            type: 'scatter',
            mode: 'lines',
            name: 'ROC Curve',
        };
        var trace2 = {
            x: [0, 1],
            y: [0, 1],
            type: 'scatter',
            name: 'diagonal',
        };
        var layout = {
            title: 'ROC Curve',
            xaxis: { title: 'False Positive Rate' },
            yaxis: { title: 'True Positive Rate' },
        };

        var data = [trace, trace2];

        Plotly.newPlot(container, data, layout);
    }
    falsePositives(yTrue, yPred) {
        return tf.tidy(() => {
            const one = tf.scalar(1);
            const zero = tf.scalar(0);
            return tf.logicalAnd(yTrue.equal(zero), yPred.equal(one))
                .sum()
                .cast('float32');
        });
    }
    indexToColor(index) {
        return this.color_scheme[index + 1 % this.color_scheme.length];
    }
    reshape(array, shape) {
        if (shape.length === 0) return array[0];

        const [size, ...restShape] = shape;
        const result = [];
        const restSize = restShape.reduce((a, b) => a * b, 1);
        console.log(restSize);

        for (let i = 0; i < size; i++) {
            result.push(this.reshape(array.slice(i * restSize, (i + 1) * restSize), restShape));
        }

        return result;
    }
    async plot_tsne(data, labels, regression_labels) {
        document.getElementById("dimensionality_reduction_panel_tsne").style.display = "block"
        console.assert(Array.isArray(data));
        // Create some data
        // const items = tf.randomUniform([2000, 10]);

        // Get a tsne optimizer
        const tsneOpt = tsne.tsne(tensorflow.tensor2d(data));

        // Compute a T-SNE embedding, returns a promise.
        // Runs for 1000 iterations by default.
        await tsneOpt.compute();
        // tsne.coordinate returns a *tensor* with x, y coordinates of
        // the embedded data.
        const coordinates = tsneOpt.coordinates();
        // let model = new TSNE();
        // var Y = await model.train(data)
        const items = coordinates.dataSync()
        const Y = this.reshape(items, coordinates.shape)
        let x = []
        let traces = []
        if (labels.length > 0) {
            labels = labels.flat()
            var uniqueLabels = [...new Set(labels)];
            let points_labled = Y.map(function (item, i) {
                return {
                    label: labels[i],
                    'x': item[0],
                    'y': item[1]
                }
            }
            )
            uniqueLabels.forEach((label, i) => {
                var items_for_label = points_labled.filter(m => m.label === label)
                traces.push({
                    x: items_for_label.map(m => m.x),
                    y: items_for_label.map(m => m.y),
                    mode: 'markers',
                    type: 'scatter',
                    name: label,
                    marker: {
                        size: 4,
                        color: this.indexToColor(i),
                    }
                })
            })
        } else {
            let points = Y.map(function (item, i) {
                x.push(regression_labels[i][0])
                return {
                    'x': item[0],
                    'y': item[1]
                }
            })
            traces.push({
                x: x,
                y: points.map(m => m.y),
                mode: 'markers+text',
                type: 'scatter',
                colorscale: 'viridis',

                marker: {
                    size: 4,
                    color: x,
                    colorbar: {
                        title: 'Color Scale',
                        titleside: 'right'
                    }
                },
            })

        }

        var layout = {
            showlegend: true,
            margin: {
                l: 50,
                r: 40,
                b: 50,
                t: 40,
                pad: 20
            },
            xaxis: {
                linecolor: 'black',
                linewidth: 1,
                mirror: true,
            },
            yaxis: {
                linecolor: 'black',
                linewidth: 1,
                mirror: true,
            },
            legend: {
                x: 1,
                xanchor: 'right',
                y: 1
            },
        };
        Plotly.newPlot('tsne', traces, layout, { responsive: true, modeBarButtonsToRemove: ['resetScale2d', 'select2d', 'resetViews', 'sendDataToCloud', 'hoverCompareCartesian', 'lasso2d', 'drawopenpath '] });

    }
    trueNegatives(yTrue, yPred) {
        return tf.tidy(() => {
            const zero = tf.scalar(0);
            return tf.logicalAnd(yTrue.equal(zero), yPred.equal(zero))
                .sum()
                .cast('float32');
        });
    }

    // TODO(cais): Use tf.metrics.falsePositiveRate when available.
    falsePositiveRate(yTrue, yPred) {
        return tf.tidy(() => {
            const fp = this.falsePositives(yTrue, yPred);
            const tn = this.trueNegatives(yTrue, yPred);
            return fp.div(fp.add(tn));
        });
    }
    drawROC(targets, probs) {

        return tf.tidy(() => {
            const thresholds = [
                0.0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55,
                0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.92, 0.94, 0.96, 0.98, 1.0
            ];
            const tprs = [];  // True positive rates.
            const fprs = [];  // False positive rates.
            let area = 0;
            for (let i = 0; i < thresholds.length; ++i) {
                const threshold = thresholds[i];
                const threshPredictions = binarize(probs, threshold).as1D();

                const fpr = this.falsePositiveRate(targets, threshPredictions).dataSync()[0];
                const tpr = tf.metrics.recall(targets, threshPredictions).dataSync()[0];

                fprs.push(fpr);
                tprs.push(tpr);
                // Accumulate to area for AUC calculation.
                if (i > 0) {
                    area += (tprs[i] + tprs[i - 1]) * (fprs[i - 1] - fprs[i]) / 2;
                }
            }
            return [area, fprs, tprs];
        });
    }
    nrd(x) {
        let s = ss.standardDeviation(x);
        const iqr = ss.interquartileRange(x);
        if (typeof iqr === "number") {
            s = Math.min(s, iqr / 1.34);
        }
        return 1.06 * s * Math.pow(x.length, -0.2);
    }
    hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
            a: 0.5
        } : null;
    }
    kernelFunctions = {
        gaussian: function (u) {
            return Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI);
        },
        uniform: function (x) {
            return Math.abs(x) <= 1 ? 0.5 : 0;
        },
        triangular: function (x) {
            return Math.abs(x) <= 1 ? 1 - Math.abs(x) : 0;
        },
        biweight: function (x) {
            return Math.abs(x) <= 1 ? 15 / 16 * Math.pow(1 - x * x, 2) : 0;
        },
        triweight: function (x) {
            return Math.abs(x) <= 1 ? 35 / 32 * Math.pow(1 - x * x, 3) : 0;
        },
        Epanechnikov: function (x) {
            return Math.abs(x) <= 1 ? 0.75 * (1 - x * x) : 0;
        }
    };

    draw_kde(dataset, column, target_name, bandwidth = "nrd", is_classification = false, redrawing = false) {
        try {


            let items = dataset.column(column).values;
            let default_bandwidth = this.nrd(items).toFixed(2);
            let raw_values = dataset.loc({ columns: [column, target_name] });
            let uniqueLabels = [...new Set(raw_values.column(target_name).values)];
            if (uniqueLabels.length === 2) {
                uniqueLabels.sort()
            }
            let column_values = raw_values.values;
            let subsets = [];
            var colorIndices = uniqueLabels.map(label => this.indexToColor(uniqueLabels.indexOf(label)));
            if (!is_classification) {
                subsets.push(dataset[column].values);
            } else {
                for (let i = 0; i < uniqueLabels.length; i++) {
                    const label = uniqueLabels[i];
                    let subset = [];
                    for (let i = 0; i < column_values.length; i++) {
                        const item = column_values[i];
                        if (item[1] === label) {
                            subset.push(item[0])
                        }
                    }
                    subsets.push(subset);
                }
            }

            document.getElementById("kde_panel").style.display = "block";

            var newColumn = document.createElement("div");
            newColumn.className = "column is-3";
            newColumn.setAttribute("id", column + '-kde-plot');
            if (!redrawing) {
                let key = encode_name(column)

                $("#container").append(
                    `<div class="column is-4 is-size-6-tablet my-1">
                <div class="columns is-multiline">
                <div class="column is-12" >
                    <div id="${key + '-kde-plot'}"> </div>
                    <div id="${key + '-boxplot'}" style="height:20vh;width: 100%">
                    </div>
                    <div class="field has-addons has-addons-centered my-1">
                    <div class="control">
                    <span class="select is-small">
                      <select id="${key + '-kernel_type'}">
                      <option value="gaussian">gaussian</option>
                        <option value="uniform">uniform</option>
                        <option value="triangular">triangular</option>
                        <option value="biweight">biweight</option>
                        <option value="triweight">triweight</option>
                        <option value="Epanechnikov">Epanechnikov</option>
                      </select>
                    </span>
                    <p class="help is-success">Kernel</p>
                  </div>
                  <div class="control">
                        <div class="select is-small">
                            <select id="${key + '--normal'}">
                                <option value="0">No</option>
                                <option value="1">Scale</option>
                                <option value="2">x^2</option>
                                <option value="3">ln(x)</option>
                                <option value="4">Standardize </option>
                            </select>
                        </div>
                    <p class="help is-success">Normalization</p>
                    </div>
                        <div class="control">
                            <input class="input is-small" type="number"  min="0" id="${key + '-kde'}" value="${default_bandwidth}">
                            <p class="help is-success">Bandwidth</p>
                        </div>
                        <p class="control">
                            <a class="button is-success is-small" id="${key + '-kde-button'}">
                                Apply
                            </a>
                        </div>
                    </div>
                  </div>
                </div>`
                );
                document.getElementById(key + '--normal').addEventListener('change', function () {
                    const target = document.getElementById("target").value;
                    let is_classification = document.getElementById(target).value !== FeatureCategories.Numerical;
                    let data = dataset.loc({ columns: [column, target] });
                    let normalization_type = document.getElementById(key + '--normal').value
                    scale_data(data, column, normalization_type)
                    data.dropNa({ axis: 1, inplace: true })
                    var newBandwidth = parseFloat(document.getElementById(key + '-kde').value);
                    current_class.draw_kde(data, column, target, newBandwidth, is_classification, true);
                });
            }
            var current_class = this;
            let key = encode_name(column)

            document.getElementById(key + '-kde-button').addEventListener("click", function () {
                const target = document.getElementById("target").value;
                let is_classification = document.getElementById(target).value !== FeatureCategories.Numerical;
                let data = dataset.loc({ columns: [column, target] });
                let normalization_type = document.getElementById(key + '--normal').value
                scale_data(data, column, normalization_type)
                var newBandwidth = parseFloat(document.getElementById(key + '-kde').value);
                data.dropNa({ axis: 1, inplace: true })
                current_class.draw_kde(data, column, target, newBandwidth, is_classification, true);
            });
            let container_id = key + '-kde-plot';
            let items_range = [...raw_values.column(column).values]
            // let minValue = Math.min(...items_range);
            // let maxValue = Math.max(...items_range);
            // items_range.push(minValue - parseFloat(default_bandwidth))
            // items_range.push(maxValue + parseFloat(default_bandwidth))
            var breaks = ss.equalIntervalBreaks(items_range, 100);
            let allData = [];
            let kernel_type = document.getElementById(key + "-kernel_type")?.value ?? "gaussian"
            // Loop through subsets to generate data for all subsets
            let traces = []
            let kde;
            if (is_classification) {
                for (let i = 0; i < subsets.length; i++) {
                    if (subsets[i].length > 2) {
                        let ys = [];
                        kde = ss.kernelDensityEstimation(subsets[i], this.kernelFunctions[kernel_type], bandwidth);
                        let data = [];
                        breaks.forEach((item) => {
                            ys.push(kde(item, bandwidth));
                            data.push([item, ys[ys.length - 1]]);
                        });
                        allData.push(data);
                    } else {
                        allData.push([]);
                    }
                    traces.push({
                        name: uniqueLabels[i],
                        x: subsets[i],
                        marker: {
                            color: colorIndices[i]
                        },
                        type: 'box',
                    })
                }
            } else {
                for (let i = 0; i < subsets.length; i++) {
                    if (subsets[i].length > 2) {
                        let ys = [];
                        kde = ss.kernelDensityEstimation(subsets[i], this.kernelFunctions[kernel_type], bandwidth);
                        let data = [];
                        breaks.forEach((item) => {
                            ys.push(kde(item, bandwidth));
                            data.push([item, ys[ys.length - 1]]);
                        });
                        allData.push(data);
                    } else {
                        allData.push([]);
                    }
                }
                traces.push({
                    name: column,
                    x: items,
                    type: 'box',
                })
            }

            let animationDuration = 4000;

            var layout = {

                yaxis: {
                    visible: false,
                },
                showlegend: false,
                margin: {
                    l: 20,
                    r: 10,
                    b: 60,
                    t: 10,
                },
                legend: {
                    x: 1,
                    xanchor: 'right',
                    y: 1
                },
            };
            Plotly.newPlot(key + '-boxplot', traces, layout, { autosize: true, responsive: true, modeBarButtonsToRemove: ['pan', 'resetScale2d', 'select2d', 'resetViews', 'sendDataToCloud', 'hoverCompareCartesian', 'lasso2d', 'drawopenpath '] });
            Highcharts.chart(container_id, {
                credits: {
                    enabled: false
                },
                legend: {
                    enabled: is_classification ? true : false, align: 'right',
                    verticalAlign: 'top',
                },
                chart: {
                    height: '300',
                    type: "spline",
                    animation: true,
                },
                title: {
                    text: column // Assuming `column` is defined elsewhere
                },
                yAxis: {
                    title: { text: null }
                },
                tooltip: {
                    valueDecimals: 3
                },
                plotOptions: {
                    series: {
                        marker: {
                            enabled: false
                        },
                        dashStyle: "shortdot",
                        color: colorIndices,
                        animation: {
                            duration: animationDuration
                        },
                        area: true
                    }
                },
                series: allData.map((data, index) => ({
                    type: 'area',
                    name: uniqueLabels[index],
                    dashStyle: "solid",
                    lineWidth: 2,
                    color: colorIndices[index],
                    data: data
                }))
            });
            window.dispatchEvent(new Event('resize'));
        } catch (error) {
            throw new Error('falied at plotting kde.')
        }
    }

    async classificationPCA(dataset, labels, missclassifications, uniqueLabels, index) {

        const pca = new PCA(dataset, { center: true, scale: true });
        var colorIndices = labels.map(label => this.indexToColor(uniqueLabels.indexOf(label)));
        const pca_data = await pca.predict(dataset, { nComponents: 2 })
        let x = []
        let y = []
        let x_error = []
        let y_error = []
        let error_texts = []
        let real_labels = []
        pca_data[0].forEach((element, i) => {
            if (missclassifications['indexes'].includes(i)) {
                let index = missclassifications['indexes'].findIndex(index => index == i)
                error_texts.push(dataset[i].join())
                real_labels.push([labels[i], missclassifications['mispredictions'][index]])
                x_error.push(element[0])
                y_error.push(element[1])
            } else {
                x.push(element[0])
                y.push(element[1])
            }

        });
        var trace1 = {
            x: x,
            y: y,
            name: 'Predictions',
            text: labels,
            mode: 'markers',
            type: 'scatter',
            marker: {
                size: 4,
                color: colorIndices,
                symbol: 'circle'
            },
        };
        var trace2 = {
            name: 'Missclassifications',
            x: x_error,
            y: y_error,
            text: error_texts,
            customdata: real_labels,
            mode: 'markers',
            type: 'scatter',
            marker: {
                size: 7,
                color: colorIndices,
                symbol: 'cross'
            },
            hovertemplate:
                "Features : %{text}<br>" +
                "True class: %{customdata[0]}<br>" +
                "Predited class: %{customdata[1]}" +
                "<extra></extra>"

        };
        var data = [trace1, trace2];

        Plotly.newPlot('pca_results_' + index, data, {
            title: {
                text: 'Principle Component Analysis of Predictions'
            },
            hovermode: "closest",
            hoverlabel: { bgcolor: "#FFF" },
            showlegend: true,
            legend: {
                x: 1,
                xanchor: 'right',
                y: 1
            },
            xaxis: {
                linecolor: 'black',
                linewidth: 1,
                mirror: true,
                title: 'PC1'
            },
            yaxis: {
                linecolor: 'black',
                linewidth: 1,
                mirror: true,
                title: 'PC2'
            }
        }, { staticPlot: false, responsive: true, modeBarButtonsToRemove: ['resetScale2d', 'select2d', 'resetViews', 'sendDataToCloud', 'hoverCompareCartesian', 'lasso2d', 'drawopenpath '] });

    }
    async draw_pca(dataset, labels, regression_labels, x_axis, y_axis) {
        const pca = new PCA(dataset, { center: true, scale: true });

        labels = labels.flat()
        var uniqueLabels = [...new Set(labels)];

        const pca_x = await pca.predict(dataset, { nComponents: 3 })
        const pca_data = pca_x[0]

        let x = []
        let pc1 = []
        pca_data.forEach((element, i) => {
            pc1.push({
                x: element[x_axis - 1],
                y: element[y_axis - 1],
                label: labels[i]
            })
            x.push(regression_labels[i][0])
        });
        let traces1 = []
        if (uniqueLabels.length !== 0) {
            uniqueLabels.forEach((label, i) => {
                var items_for_label = pc1.filter(m => m.label === label)
                traces1.push({
                    x: items_for_label.map(m => m.x),
                    y: items_for_label.map(m => m.y),
                    mode: 'markers',
                    type: 'scatter',
                    name: label,
                    marker: {
                        size: 4,
                        color: this.indexToColor(i),
                    }
                })
            })
        } else {
            traces1.push({
                x: pc1.map(m => m.x),
                y: pc1.map(m => m.y),
                mode: 'markers',
                type: 'scatter',
                marker: {
                    color: x,
                    colorscale: 'YlOrRd',
                    size: 4,
                    colorbar: {
                        title: 'Color Scale Legend',
                        titleside: 'right'
                    }
                },

            })
        }
        let cumulatedExplainedVaraince = []
        let sum = 0
        pca_x[2].forEach(element => {
            sum = sum + element
            cumulatedExplainedVaraince.push(sum)
        });
        Highcharts.chart('scree_plot', {
            credits: {
                enabled: false
            },
            title: {
                text: '',
            },
            legend: {
                verticalAlign: 'top',
                align: 'left',
                floating: true,
            },
            yAxis: {
                linecolor: 'black',
                linewidth: 1,
                mirror: true,
                min: 0,
                max: 1,
                title: {
                    text: 'Explained variance'
                },
                plotLines: [{
                    value: 0.9,
                    dashStyle: 'shortdash',
                    color: 'grey',
                    width: 1,
                    zIndex: 4,
                    label: {
                        text: '0.9', align: "right",
                    }
                }, {
                    value: 0.8,
                    dashStyle: 'shortdash',
                    color: 'darkgrey',
                    width: 1,
                    zIndex: 4,
                    label: {
                        text: '0.8', align: "right",
                    }
                }]

            },
            xAxis: {

                labels: {
                    enabled: true,
                    formatter: function () {
                        return this.value + 1;
                    }
                },

                title: {
                    text: 'Number of components'
                },
            },
            series: [{
                name: 'Propotional',
                color: "blue",
                data: pca_x[2]
            },
            {
                name: 'Cumulative',
                color: "red",
                data: cumulatedExplainedVaraince
            }],

        });
        Plotly.newPlot('pca-1', traces1, {
            showlegend: true,
            margin: {
                l: 40,
                r: 40,
                b: 40,
                t: 40,
                pad: 10
            },
            legend: {
                x: 1,
                xanchor: 'right',
                y: 1
            },
            xaxis: {
                linecolor: 'black',
                linewidth: 1,
                mirror: true,
                title: 'PC' + x_axis
            },
            yaxis: {
                linecolor: 'black',
                linewidth: 1,
                mirror: true,
                title: 'PC' + y_axis
            }
        }, { responsive: true });
    }
    // eslint-disable-next-line no-unused-vars
    drawStackedHorizontalChart(categories, lable) {
        var trace1 = {
            x: [20, 14, 23],
            y: ['giraffes', 'orangutans', 'monkeys'],
            name: 'SF Zoo',
            orientation: 'h',
            marker: {
                color: 'rgba(55,128,191,0.6)',
                width: 1
            },
            type: 'bar'
        };

        var trace2 = {
            x: [12, 18, 29],
            y: ['giraffes', 'orangutans', 'monkeys'],
            name: 'LA Zoo',
            orientation: 'h',
            type: 'bar',
            marker: {
                color: 'rgba(255,153,51,0.6)',
                width: 1
            }
        };

        var data = [trace1, trace2];

        var layout = {
            title: 'Colored Bar Chart',
            barmode: 'stack'
        };

        Plotly.newPlot('myDiv', data, layout);

    }
    regularization_plot(xs, ys, labels) {
        const traces = []
        labels.forEach((element, i) => {
            traces.push({
                x: xs,
                y: ys.map(m => m[i]),
                type: 'scatter',
                name: element,
                mode: 'line'
            })
        });
        var layout = {
            colorway: ['#f3cec9', '#e7a4b6', '#cd7eaf', '#a262a9', '#6f4d96', '#3d3b72', '#182844'],
            title: 'Lasso Coefficients as Alpha varies',
            xaxis: {
                type: 'log',
                title: 'Alpha (Regularization Strength)'
            },
            yaxis: {
                title: 'Coefficient Value'
            }
        };
        Plotly.newPlot('lasso_plot', traces, layout);
    }
    argmax(array) {
        return array.reduce((maxIndex, currentValue, currentIndex, array) => {
            return currentValue > array[maxIndex] ? currentIndex : maxIndex;
        }, 0);
    }
    probabilities_boxplot(probs, labels, true_labels, index) {
        true_labels.filter(m => m == 0).length
        true_labels.filter(m => m == 1).length
        var colorIndices = labels.map((label, i) => this.indexToColor(i));
        const num_columns = probs[0].length;
        let traces = [];

        // Create subsets of probabilities based on the true labels
        let subsets = {};
        true_labels.forEach((true_label, i) => {
            if (!(true_label in subsets)) {
                subsets[true_label] = [];
            }
            subsets[true_label].push(probs[i]);
        });
        // Generate box plots for each true label class
        for (let true_label in subsets) {
            let subset = subsets[true_label];
            for (let j = 0; j < num_columns; j++) {
                let data = subset.map(item => item[j]);
                traces.push({
                    type: 'box',
                    name: ` class ${true_label} : Predicted ${labels[j]}`,
                    marker: {
                        color: colorIndices[j]
                    },
                    y: data
                });
            }
        }

        // Create a div for the plot
        let content = `
            <div class="column is-6" id="probs_box_plot_${index}" style="height: 350px;">
            </div>
        `;
        $("#tabs_info li[data-index='" + index + "'] #results_" + index + "").append(content);

        // Plot the box plots using Plotly
        Plotly.newPlot("probs_box_plot_" + index, traces, {
            yaxis: {
                title: 'Predicted Probability'
            },
            legend: {
                x: 1,
                xanchor: 'right',
                y: 1
            },
            margin: {
                l: 60,
                r: 30,
                b: 60,
                t: 0,
                pad: 20
            },
            boxmode: 'group'
        });
    }
    probablities_violin_plot(probs, classes, labels) {
        var colorIndices = labels.map((label, i) => this.indexToColor(i));
        const arrayColumn = (arr, n) => arr.map(x => x[n]);
        const num_columns = probs[0].length
        let traces = []
        for (let i = 0; i < num_columns; i++) {
            traces.push({
                name: classes[i],
                type: 'violin',
                y: arrayColumn(probs, i),
                points: 'none',
                box: {
                    visible: true
                },
                boxpoints: false,
                line: {
                    color: colorIndices[i]
                },
                fillcolor: colorIndices[i],
                opacity: 0.6,
                meanline: {
                    visible: true
                },

            });
        }
        var layout = {
            title: "Violin Plot",
            yaxis: {
                zeroline: false
            }
        }

        Plotly.newPlot('probs_violin_plot', traces, layout);
    }
    async plotConfusionMatrix(y, predictedLabels, labels, uniqueClasses, tab_index) {

        const confusionMatrix = await metrics.confusionMatrix(y, predictedLabels);
        let metric = await ClassificationMetric(y.arraySync(), predictedLabels.arraySync(), uniqueClasses)
        let accuracy = metric[4].toFixed(2);
        let f1Micro = metric[2].toFixed(2)
        let f1Macro = metric[3].toFixed(2)

        let len = confusionMatrix[0].length
        let preceissions = [];
        let recalls = [];
        for (let j = 0; j < len; j++) {
            preceissions.push(parseFloat(metric[0][j].toFixed(2)))
        }
        for (let j = 0; j < len; j++) {
            recalls.push(parseFloat(metric[1][j].toFixed(2)))
        }
        // div.innerHTML =
        //     `<div class="column is-12">

        //     <span class="subtitle mb-1">Accuracy: ${metric[4].toFixed(2)}, </span>
        //     <span class="subtitle mr-2">F1 micro: ${metric[3].toFixed(2)}, </span>
        //     <span class="subtitle">F1 macro: ${metric[3].toFixed(2)}</span>
        //     </div>`
        //     ;
        // $("#tabs_info li[data-index='" + tab_index + "'] #results_" + tab_index + "").append(div);
        // $("#tabs_info li[data-index='" + tab_index + "'] #results_" + tab_index + "").append(`
        // <div class="column is-6" id="confusion_matrix_${tab_index}" style="height:50vh">
        // </div>
        // `);
        tensorflow.dispose(y)
        tensorflow.dispose(predictedLabels)
        const metric_labels = ["Precession", "Recall", "F1 score", "Support"]
        labels.push("Precession")
        recalls.push(0)
        confusionMatrix.push(preceissions)
        let items_labels = labels.filter(x => !metric_labels.includes(x))
        let formatted_matrix = []
        for (let i = 0; i < confusionMatrix.length; i++) {
            const element = confusionMatrix[i];
            if (i < confusionMatrix.length - 1) {
                element.push(recalls[i])
            }
            for (let j = 0; j < element.length; j++) {
                const item = element[j];
                formatted_matrix.push([j, i, item])
            }
        }
        items_labels.push("Recall")

        Highcharts.chart("confusion_matrix_" + tab_index, {
            credits: {
                enabled: false
            },
            exporting: {
                enabled: true
            },
            chart: {
                type: 'heatmap',
                plotBorderWidth: 1
            },
            title: {
                text: '',
                style: {
                    fontSize: '1em'
                }
            },

            xAxis: [{
                categories: items_labels,
                title: {
                    text: 'Predicted Class'
                }
            }, {
                linkedTo: 0,
                opposite: true,
                tickLength: 0,
                labels: {
                    formatter: function () {
                        var chart = this.chart,
                            each = Highcharts.each,
                            series = chart.series[0],
                            sum = 0,
                            x = this.value;

                        each(series.options.data, function (p, i) {
                            if (p[0] === x) {
                                if (p[1] < uniqueClasses.length) {
                                    sum += p[2];
                                }
                            }
                        });

                        return sum;
                    }
                }
            }],
            yAxis: [{
                categories: labels,
                title: {
                    text: 'Actual Class'
                },
                reversed: true, endOnTick: false
            }, {
                linkedTo: 0,
                opposite: true,
                tickLength: 0,
                labels: {
                    formatter: function () {
                        var chart = this.chart,
                            each = Highcharts.each,
                            series = chart.series[0],
                            sum = 0,
                            x = this.value;
                        each(series.options.data, function (p, i) {
                            if (p[1] === x) {
                                if (p[1] < uniqueClasses.length) {
                                    sum += p[2];
                                }

                            }
                        });
                        return sum;
                    }
                },
                title: null
            }],
            colorAxis: {
                min: 0,
                minColor: '#FFFFFF',
                maxColor: Highcharts.getOptions().colors[0]
            },

            legend: {
                align: 'center',
                layout: 'horizontal',
                margin: 0,
                verticalAlign: 'top',
                y: 5,
                symbolHeight: 10
            },
            series: [{
                name: '',
                borderWidth: 1,
                data: formatted_matrix,
                dataLabels: {
                    enabled: true,
                    useHTML: true,
                    color: '#000000',
                    formatter: function () {
                        var totalCount = this.series.data.reduce(function (acc, cur, i) {
                            if ((i + 1) % (uniqueClasses.length + 1) === 0) {
                                return acc
                            }
                            return acc + cur?.value;
                        }, 0);
                        var count = this.point.value;
                        var skip = this.point.index >= this.series.data.length - (1 * (uniqueClasses.length + 1));

                        if (!skip && !((this.point.index + 1) % (uniqueClasses.length + 1) === 0)) {
                            var percentage = ((count / totalCount) * 100).toFixed(2);
                            return '<p style="margin:auto; text-align:center;">' + count + '<br/>(' + percentage + '%)</p> ';
                        } else {
                            return '<p style="margin:auto; text-align:center;">' + count + '</p>';
                        }
                    }
                }
            }],
            responsive: {
                rules: [{
                    condition: {
                        maxWidth: 500
                    },
                    chartOptions: {
                        yAxis: {
                            labels: {
                                format: '{substr value 0 1}'
                            }
                        }
                    }
                }]
            }
        });
        return [accuracy, f1Micro, f1Macro]
    }
    plot_regularization(weights, alphas, names, tab_index) {
        let content = `
                    <div class="column is-6" id="regularization_${tab_index}" style="height: 40vh;">
                    </div>
    `
        $("#tabs_info li[data-index='" + tab_index + "'] #results_" + tab_index + "").append(content);

        let serieses = []
        for (let i = 0; i < names.length; i++) {
            serieses.push({
                name: names[i],
                data: weights.map(m => m[i])
            })
        }
        const alphas_formatted = [];
        for (let i = 0; i < alphas.length; i++) {
            alphas_formatted.push(alphas[i].toFixed(2));
        }
        Highcharts.chart("regularization_" + tab_index, {

            title: {
                text: '',
            },
            yAxis: {
                title: {
                    text: 'Coefficients'
                }
            },
            xAxis: {
                title: {
                    text: 'penalty weight'
                },
                categories: alphas_formatted,
            },
            legend: {
                layout: 'vertical',
                align: 'right',
                verticalAlign: 'middle'
            },

            plotOptions: {
                series: {
                    label: {
                        connectorAllowed: false
                    },
                }
            },
            series: serieses,
            responsive: {
                rules: [{
                    condition: {
                        maxWidth: 500
                    },
                    chartOptions: {
                        legend: {
                            layout: 'horizontal',
                            align: 'center',
                            verticalAlign: 'bottom'
                        }
                    }
                }]
            }
        });
    }
    yhat_plot(y_test, predictions, container, title = '') {
        Plotly.newPlot(container, [{
            x: y_test,
            y: predictions,
            type: 'scatter',
            name: "y",
            mode: 'markers',
        }, {
            x: y_test,
            y: y_test,
            mode: 'lines',
            type: 'scatter',
            line: { color: 'red', dash: 'dash' },
            name: 'y = x line'
        }], {
            title: {
                text: title,
                font: {
                    family: 'sans-serif',
                    size: 10
                },
                xref: 'paper',
                x: 0.05,
            },
            showlegend: false,
            xaxis: {
                linecolor: 'black',
                linewidth: 1,
                mirror: true,
                title: {
                    text: 'y',
                    font: {
                        family: 'sans-serif',
                        size: 14,
                        color: '#7f7f7f'
                    }
                },
            },
            yaxis: {
                linecolor: 'black',
                linewidth: 1,
                mirror: true,
                title: {
                    text: 'predictions',
                    font: {
                        family: 'sans-serif',
                        size: 14,
                        color: '#7f7f7f'
                    }
                }
            },
            margin: {
                l: 40,
                r: 10,
                b: 40,
                t: 20,
                pad: 0
            }
        }, { responsive: true, });
    }
    residual_plot(y, residuals, container, title = '') {
        Plotly.newPlot(container, [{
            x: y,
            y: residuals,
            type: 'scatter',
            name: "y",
            mode: 'markers',
            marker: {
                color: 'rgb(17, 157, 255)',
                size: 7
            },
        }], {
            title: {
                text: title,
                font: {
                    family: 'sans-serif',
                    size: 10
                },
                xref: 'paper',
                x: 0.05,
            },
            showlegend: false,
            xaxis: {
                linecolor: 'black',
                linewidth: 1,
                mirror: true,
                title: {
                    text: 'y',
                    font: {
                        family: 'sans-serif',
                        size: 14,
                        color: '#7f7f7f'
                    }
                },
            },
            yaxis: {
                linecolor: 'black',
                linewidth: 1,
                mirror: true,
                title: {
                    text: 'residuals',
                    font: {
                        family: 'sans-serif',
                        size: 14,
                        color: '#7f7f7f'
                    }
                }
            },
            margin: {
                l: 40,
                r: 10,
                b: 40,
                t: 20,
                pad: 0
            }
        }, { responsive: true, });
    }

    ScatterplotMatrix(items, features, labels, number_of_categoricals, is_classification = true, numeric_columns, categorical_columns, dataset) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                let unique_labels = [...new Set(labels)];
                var colors = labels.map(label => this.indexToColor(unique_labels.indexOf(label)));
                let traces = []
                let index = 1;
                if (unique_labels.length === 2) {
                    unique_labels.sort()
                }
                for (let i = 0; i < features.length; i++) {
                    for (let j = 0; j < features.length; j++) {
                        if (i === j) {
                            let subsets = [];
                            let kde;
                            let breaks = []
                            let allData = []
                            if (is_classification) {
                                if (i >= features.length - number_of_categoricals) {
                                    if (i === features.length - 1) {
                                        for (let k = 0; k < unique_labels.length; k++) {
                                            subsets.push(items.filter(m => m[items[0].length - 1] === unique_labels[k]).map(m => m[i]));
                                        }
                                        traces.push({
                                            x: unique_labels,
                                            y: subsets.map(set => set.length),
                                            type: 'bar',
                                            xaxis: 'x' + (index),
                                            yaxis: 'y' + (index),
                                            marker: {
                                                color: unique_labels.map((_, z) => this.indexToColor(z))
                                            }
                                        })
                                    } else {
                                        let unique_labels_feature = [...new Set(items.map(m => m[i]))];
                                        for (let k = 0; k < unique_labels.length; k++) {
                                            let lablel_items = items.filter(m => m[items[0].length - 1] === unique_labels[k])
                                            let counts = [];
                                            unique_labels_feature.forEach(label =>
                                                counts.push(lablel_items.filter(m => m[i] === label).length)
                                            )
                                            subsets.push({
                                                items: lablel_items,
                                                counts: counts
                                            });
                                        }
                                        unique_labels.forEach((_, i) => {
                                            traces.push({
                                                x: unique_labels_feature,
                                                y: subsets[i].counts,
                                                type: 'bar',
                                                xaxis: 'x' + (index),
                                                yaxis: 'y' + (index),
                                                marker: {
                                                    color: this.indexToColor(i)
                                                }
                                            })
                                        })
                                    }
                                } else {
                                    for (let k = 0; k < unique_labels.length; k++) {
                                        subsets.push(items.filter(m => m[items[0].length - 1] === unique_labels[k]).map(m => m[i]));
                                    }
                                    for (let ii = 0; ii < subsets.length; ii++) {
                                        if (subsets[ii].length > 2) {
                                            let default_bandwidth = this.nrd(subsets[ii]).toFixed(2);
                                            breaks = ss.equalIntervalBreaks(subsets[ii], 100);

                                            let ys = [];
                                            kde = ss.kernelDensityEstimation(subsets[ii], 'gaussian', 'nrd');
                                            let data = [];
                                            breaks.forEach((item) => {
                                                ys.push(kde(item, default_bandwidth));
                                                data.push([item, ys[ys.length - 1]]);
                                            });
                                            allData.push(data);
                                        } else {
                                            allData.push([]);
                                        }
                                    }
                                    for (let i = 0; i < allData.length; i++) {
                                        traces.push({
                                            type: 'scatter',
                                            x: allData[i].map(m => m[0]),
                                            y: allData[i].map(m => m[1]),
                                            xaxis: 'x' + (index),
                                            yaxis: 'y' + (index),
                                            mode: 'lines',
                                            name: 'Red',
                                            fill: 'tozeroy',
                                            line: {
                                                color: this.indexToColor(i),
                                                width: 3
                                            }
                                        })

                                    }
                                }

                            } else {
                                if (categorical_columns.includes(features[i])) {
                                    let column_items = items.map(m => m[i]);
                                    let unique_classes = [...new Set(column_items)];
                                    let class_frequencies = []
                                    for (let i = 0; i < unique_classes.length; i++) {
                                        const class_label = unique_classes[i];
                                        class_frequencies.push(column_items.filter(m => m === class_label).length)
                                    }
                                    traces.push({
                                        x: unique_classes,
                                        y: class_frequencies,
                                        type: 'bar',
                                        name: 'Trace 1',
                                        xaxis: 'x' + (index),
                                        yaxis: 'y' + (index),
                                    })
                                } else {
                                    subsets.push(items.map(m => m[i]));
                                    for (let i = 0; i < subsets.length; i++) {
                                        if (subsets[i].length > 2) {
                                            let ys = [];
                                            let default_bandwidth = this.nrd(subsets[i]).toFixed(2);
                                            breaks = ss.equalIntervalBreaks(subsets[i], 100);
                                            kde = ss.kernelDensityEstimation(subsets[i], 'gaussian', 'nrd');
                                            let data = [];
                                            breaks.forEach((item) => {
                                                ys.push(kde(item, default_bandwidth));
                                                data.push([item, ys[ys.length - 1]]);
                                            });
                                            allData.push(data);
                                        } else {
                                            allData.push([]);
                                        }
                                    }
                                    traces.push({
                                        type: 'scatter',
                                        x: allData[0].map(m => m[0]),
                                        y: allData[0].map(m => m[1]),
                                        mode: 'lines',
                                        fill: 'tozeroy',
                                        xaxis: 'x' + (index),
                                        yaxis: 'y' + (index),
                                        name: 'Red',
                                        line: {
                                            color: 'rgb(219, 64, 82)',
                                            width: 3
                                        }
                                    })
                                }

                            }
                        }
                        else if (i === features.length - 1) {
                            traces.push({
                                y: items.map(m => m[i]),
                                x: items.map(m => m[j]),
                                color: colors,
                                marker: {
                                    colorscale: 'Portland',
                                    color: is_classification ? colors : labels,
                                    size: 2,
                                },
                                type: 'scattergl',
                                mode: 'markers',
                                xaxis: 'x' + (index),
                                yaxis: 'y' + (index),
                            })
                        } else if (j >= features.length - number_of_categoricals) {
                            if (!is_classification) {
                                traces.push({
                                    x: [],
                                    y: [],
                                    mode: 'lines',
                                    name: 'Trace 1'
                                })
                            } else {
                                let boxplot_labels = [...new Set(items.map(m => m[j]))]
                                for (let m = 0; m < unique_labels.length; m++) {
                                    for (let n = 0; n < boxplot_labels.length; n++) {
                                        let box_items = items.filter(item => item[j] === boxplot_labels[n] && item[features.length - 1] === unique_labels[m])
                                        if (box_items) {
                                            traces.push({
                                                orientation: 'v',
                                                offsetgroup: "1",

                                                name: boxplot_labels[n],
                                                y: box_items.map(item => item[i]),
                                                marker: {
                                                    color: this.indexToColor(m)
                                                },
                                                type: 'box',
                                                xaxis: 'x' + (index),
                                                yaxis: 'y' + (index),
                                            })
                                        }

                                    }

                                }
                            }
                        }
                        else {
                            if (j > i) {
                                let arr1 = items.map(m => m[i])
                                let arr2 = items.map(m => m[j])
                                traces.push({
                                    x: [1.5],
                                    y: [1.5],
                                    text: [jStat.corrcoeff(arr1, arr2).toFixed(2)],
                                    mode: 'text',
                                    textfont: {
                                        size: 12, // Font size for the text
                                        color: 'black'
                                    },
                                    xaxis: 'x' + (index),
                                    yaxis: 'y' + (index),
                                    type: 'scatter'
                                });

                            } else {
                                traces.push({
                                    y: items.map(m => m[i]),
                                    x: items.map(m => m[j]),
                                    color: colors,

                                    type: 'scattergl',
                                    mode: 'markers',
                                    marker: {
                                        colorscale: 'Portland',
                                        color: is_classification ? colors : labels,
                                        size: 2,
                                    },
                                    xaxis: 'x' + (index),
                                    yaxis: 'y' + (index),
                                })
                            }
                        }
                        index++
                    }

                }

                var layout = {
                    width: features.length * 100,
                    height: features.length * 100,
                    spacing: 0,
                    showlegend: false,
                    boxmode: "group",
                    grid: { rows: features.length, columns: features.length, pattern: 'independent' },
                    margin: { r: 10, t: 10, pad: 5 },

                };
                for (var i = 0; i < features.length; i++) {
                    for (var j = 0; j < features.length; j++) {
                        var xAxisKey = 'xaxis' + ((i * features.length) + j + 1);
                        var yAxisKey = 'yaxis' + ((i * features.length) + j + 1);
                        let fontSize = 10;
                        layout[xAxisKey] = {
                            showgrid: false,
                            showticklabels: false,
                            tickfont: {
                                size: fontSize
                            },
                        };
                        layout[yAxisKey] = {
                            showgrid: false,
                            showticklabels: false,
                            tickfont: {
                                size: fontSize
                            },
                        };
                        if (i === features.length - 1) {
                            layout[xAxisKey] = {
                                tickfont: {
                                    size: fontSize
                                },
                                title: {
                                    text: features[j], font: {
                                        size: fontSize
                                    },
                                }
                            };

                        }
                        if (j === 0) {
                            layout[yAxisKey] = {
                                tickfont: {
                                    size: fontSize
                                },
                                title: {
                                    text: features[i], font: {
                                        size: fontSize
                                    },
                                }
                            };
                        }
                    }
                }

                Plotly.react('scatterplot_mtx', traces, layout, {
                    staticPlot: true
                })
                resolve()
            }, 1000);
        })
    }

    KNNPerformancePlot(results, optimalTrainSpec, optimalTestSpec, id) {
        let traces = []
        traces.push({
            x: results.map(m => m.k),
            y: results.filter(n => n.metric === 'manhattan').map(m => Number((m.evaluation.accuracy / 100).toFixed(2))),
            mode: 'lines',
            name: 'manhattan test set',
            line: {
                color: 'rgb(55, 128, 191)',
                width: 2
            }
        });

        traces.push({
            x: results.map(m => m.k),
            y: results.filter(n => n.metric === 'euclidean').map(m => Number((m.evaluation.accuracy / 100).toFixed(2))),
            mode: 'lines',
            name: 'euclidean test set',
            line: {
                color: 'rgb(219, 64, 82)',
                width: 2
            }
        });
        traces.push({
            x: results.map(m => m.k),
            y: results.filter(n => n.metric === 'manhattan').map(m => Number((m.evaluation_train.accuracy / 100).toFixed(2))),
            mode: 'lines',
            name: 'manhattan train set',
            line: {
                color: 'rgb(55, 128, 191)',
                width: 1
            }
        });
        traces.push({
            x: results.map(m => m.k),
            y: results.filter(n => n.metric === 'euclidean').map(m => Number((m.evaluation_train.accuracy / 100).toFixed(2))),
            mode: 'lines',
            name: 'euclidean train set',
            line: {
                color: 'rgb(219, 64, 82)',
                width: 1
            }
        });
        var min_y = Number.POSITIVE_INFINITY;
        var max_y = Number.NEGATIVE_INFINITY;
        traces.forEach(trace => {
            let min = Math.min(...trace.y)
            let max = Math.max(...trace.y)
            if (min < min_y) {
                min_y = min
            }
            if (max > max_y) {
                max_y = max
            }

        })
        var layout = {
            showlegend: true,
            legend: {
                "orientation": "h",
                font: {
                    family: 'sans-serif',
                    size: 8,
                    color: '#000'
                },
            },
            xaxis: {
                linecolor: 'black',
                linewidth: 1,
                mirror: true,
                title: {
                    text: 'K',
                },
            },
            yaxis: {
                linecolor: 'black',
                linewidth: 1,
                mirror: true,
                title: {
                    text: 'Accuracy',
                }
            },
            shapes: [
                {
                    type: 'line',
                    x0: optimalTrainSpec.k,
                    y0: min_y,
                    x1: optimalTrainSpec.k,
                    y1: max_y,
                    line: {
                        color: 'rgb(55, 128, 191)',
                        width: 1
                    }
                }, {
                    type: 'line',
                    x0: optimalTestSpec.k,
                    y0: min_y,
                    x1: optimalTestSpec.k,
                    y1: max_y,
                    line: {
                        color: 'rgb(55, 128, 191)',
                        width: 1
                    }
                },]
        };
        Plotly.newPlot("knn_table_" + id, traces, layout);
    }
    KNNPerformancePlotRegression(results, optimalTrainSpec, optimalTestSpec, id) {
        let traces = []
        traces.push({
            x: results.map(m => m.k),
            y: results.filter(n => n.metric === 'manhattan').map(m => Number((m.evaluation).toFixed(2))),
            mode: 'lines',
            name: 'manhattan test set',
            line: {
                color: 'rgb(55, 128, 191)',
                width: 2
            }
        });

        traces.push({
            x: results.map(m => m.k),
            y: results.filter(n => n.metric === 'euclidean').map(m => Number((m.evaluation).toFixed(2))),
            mode: 'lines',
            name: 'euclidean test set',
            line: {
                color: 'rgb(219, 64, 82)',
                width: 2
            }
        });
        traces.push({
            x: results.map(m => m.k),
            y: results.filter(n => n.metric === 'manhattan').map(m => Number((m.evaluation_train).toFixed(2))),
            mode: 'lines',
            name: 'manhattan train set',
            line: {
                color: 'rgb(55, 128, 191)',
                width: 1
            }
        });
        traces.push({
            x: results.map(m => m.k),
            y: results.filter(n => n.metric === 'euclidean').map(m => Number((m.evaluation_train).toFixed(2))),
            mode: 'lines',
            name: 'euclidean train set',
            line: {
                color: 'rgb(219, 64, 82)',
                width: 1
            }
        });
        var min_y = Number.POSITIVE_INFINITY;
        var max_y = Number.NEGATIVE_INFINITY;
        traces.forEach(trace => {
            let min = Math.min(...trace.y)
            let max = Math.max(...trace.y)
            if (min < min_y) {
                min_y = min
            }
            if (max > max_y) {
                max_y = max
            }

        })
        var layout = {
            showlegend: true,
            legend: {
                "orientation": "h",
                font: {
                    family: 'sans-serif',
                    size: 8,
                    color: '#000'
                },
            },
            xaxis: {
                title: {
                    text: 'K',
                },
            },
            yaxis: {
                title: {
                    text: 'MSE',
                }
            },
            shapes: [
                {
                    type: 'line',
                    x0: optimalTrainSpec.k,
                    y0: min_y,
                    x1: optimalTrainSpec.k,
                    y1: max_y,
                    line: {
                        color: 'rgb(55, 128, 191)',
                        width: 1
                    }
                }, {
                    type: 'line',
                    x0: optimalTestSpec.k,
                    y0: min_y,
                    x1: optimalTestSpec.k,
                    y1: max_y,
                    line: {
                        color: 'rgb(55, 128, 191)',
                        width: 1
                    }
                },]
        };
        Plotly.newPlot("knn_table_" + id, traces, layout);
    }
    async correlationHeatmap(id, correlations, names, title) {
        var data = [
            {
                z: correlations,
                x: names,
                y: names,
                type: 'heatmap',
                hoverongaps: false,
                colorscale: 'YlGnBu',
                showscale: false,
            }
        ];
        var layout = {
            annotations: [],
            font: {
                size: 8
            },
            xaxis: {
                ticks: '',
                side: 'top'
            },
            yaxis: {

                ticks: '',
                ticksuffix: ' ',
            }
        };
        for (var i = 0; i < names.length; i++) {
            for (var j = names.length - 1; j >= 0; j--) {
                var currentValue = correlations[i][j];
                let textColor
                if (currentValue <= 0.0) {
                    textColor = 'white';
                } else {
                    textColor = 'black';
                }
                var result = {
                    xref: 'x1',
                    yref: 'y1',
                    x: names[i],
                    y: names[j],
                    text: currentValue.toFixed(2),
                    font: {
                        family: 'Arial',
                        size: 8,
                        color: textColor
                    },
                    showarrow: false,
                };
                layout.annotations.push(result);
            }
        }

        await Plotly.newPlot(id, data, layout);
    }
    PFIBoxplot(id, importances, columns) {
        let traces = []
        let avgs = []
        importances.forEach(importance => {
            const importancesMean = importance.reduce((a, b) => a + b, 0)
            avgs.push((importancesMean / importance.length))
        });
        let max = Math.max(...avgs)
        importances.forEach((importance, index) => {
            traces.push(
                {
                    x: Array.from(importance),
                    type: 'box',
                    name: columns[index],
                    marker: { color: this.color_scheme_sequential((avgs[index] / max) + 0.2) },

                }
            )
        });
        var layout = {
            title: {
                text: 'Permutation Feature Importance',
                font: {
                    size: 14
                },
                xref: 'paper',
                x: 0.05,
            },
            autosize: true,
            legend: { "orientation": "h" },
            xaxis: {
                linecolor: 'black',
                linewidth: 1,
                mirror: true,
            },
            yaxis: {
                linecolor: 'black',
                linewidth: 1,
                mirror: true
            },
        };

        Plotly.newPlot('pfi_boxplot_' + id, traces, layout, { responsive: true });
    }
    plotPDP(id, averages, grids, labels, column) {
        id = 'pdp_plot_' + id
        grids.forEach((grid, i) => {
            let element = document.getElementById(id);
            let chartContainer = document.createElement("div");
            chartContainer.classList.add("column", "is-6");
            let chartId = id + '_' + i;
            chartContainer.id = chartId
            chartContainer.style.height = "400px";
            element.after(chartContainer)
            let traces = []
            averages[i].forEach((average, index) => {
                traces.push(
                    {
                        x: grid,
                        y: Array.from(average),
                        mode: 'line',
                        name: labels[index],
                        marker: { color: this.indexToColor(index) }
                    }
                )
            });
            var layout = {
                title: {
                    text: 'Partial Dependence Plot - ' + column,
                    font: {
                        size: 14
                    },
                    xref: 'paper',
                    x: 0.05,
                },
                legend: { "orientation": "h" },

                font: {
                    size: 10
                },
                autosize: true,
                xaxis: {
                    linecolor: 'black',
                    linewidth: 1,
                    mirror: true,
                },
                yaxis: {
                    linecolor: 'black',
                    linewidth: 1,
                    mirror: true,
                    title: {
                        text: 'Feature',
                    }
                },
            };

            Plotly.newPlot(chartId, traces, layout, { responsive: true });
        });
    }
    plotPDPRegression(id, averages, grids, labels, columns) {
        console.log('ssss');

        id = 'pdp_plot_' + id;
        let element = document.getElementById(id);
        let chartContainer = document.createElement("div");
        chartContainer.classList.add("column", "is-6");
        let chartId = id + '_';
        chartContainer.id = chartId
        chartContainer.style.height = "400px";
        element.after(chartContainer);
        let traces = []

        grids.forEach((grid, i) => {
            averages[i].forEach((average, index) => {
                traces.push(
                    {
                        x: grid,
                        y: Array.from(average),
                        mode: 'line',
                        name: columns[i],
                        marker: { color: this.indexToColor(i) }
                    }
                )
            });
        });
        var layout = {
            title: {
                text: 'Partial Dependence Plot',
                font: {
                    size: 14
                },
                xref: 'paper',
                x: 0.05,
            },
            legend: { "orientation": "h" },

            font: {
                size: 10
            },
            autosize: true,
            xaxis: {
                linecolor: 'black',
                linewidth: 1,
                mirror: true,
            },
            yaxis: {
                linecolor: 'black',
                linewidth: 1,
                mirror: true,
                title: {
                    text: 'Feature',
                }
            },
        };

        Plotly.newPlot(chartId, traces, layout, { responsive: true });
    }
    drawAutoencoder(points, xIndex = 1, yIndex = 0, labels) {
        labels = labels.map(l => l[0])
        var uniqueLabels = [...new Set(labels)];
        const labelToIndex = Object.fromEntries(uniqueLabels.map((label, index) => [label, index]));
        console.log(this.indexToColor(labelToIndex[labels[0]]));

        var trace1 = {
            x: points.map(point => point[xIndex]),
            y: points.map(point => point[yIndex]),
            mode: 'markers',
            type: 'scatter',
            name: 'Team A',
            marker: {
                size: 4,
                color: points.map((_, i) => this.indexToColor(labelToIndex[labels[i]]))
            }
        };

        var data = [trace1];

        var layout = {
            legend: {
                y: 0.5,
                yref: 'paper',
                font: {
                    family: 'Arial, sans-serif',
                    size: 20,
                    color: 'grey',
                }
            },
        };

        Plotly.newPlot('autoencoder', data, layout);
    }
    plotROC(id, fprs, tprs, labels) {

        let traces = []
        fprs.forEach((fpr, index) => {
            traces.push(
                {
                    x: fpr,
                    y: tprs[index],
                    mode: 'line',
                    name: labels[index],
                    marker: { color: this.indexToColor(index) }
                }
            )
        });
        var layout = {
            autosize: true,
            xaxis: {
                linecolor: 'black',
                linewidth: 1,
                mirror: true,
                title: {
                    text: 'false positive rate',
                },
            },
            yaxis: {
                linecolor: 'black',
                linewidth: 1,
                mirror: true,
                title: {
                    text: 'true positive rate',
                }
            },
        };

        Plotly.newPlot('roc_plot_' + id, traces, layout, { responsive: true });
    }
}