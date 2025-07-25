/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import Plotly from 'danfojs/node_modules/plotly.js-dist-min';
import PCA from './dimensionality-reduction/pca';
import { binarize } from './utils'
import * as ss from "simple-statistics"
import { schemeTableau10, interpolateBlues, interpolateRainbow } from 'd3-scale-chromatic';
import { FeatureCategories } from "./settings";
import { metrics as ClassificationMetric, encode_name } from './utils.js';
import { metrics } from '@tensorflow/tfjs-vis';
import { scale_data } from './utils';
import { tensorflow, LabelEncoder } from 'danfojs/dist/danfojs-base';
import { MinMaxScaler } from 'danfojs/dist/danfojs-base';
import TSNE from './dimensionality-reduction/tsne';
const plotlyImageExportConfig = {
    toImageButtonOptions: {
        format: 'png', // one of png, svg, jpeg, webp
        height: null,
        width: null,
        scale: 2
    }
};
export default class ChartController {
    constructor() {
        this.color_scheme = schemeTableau10;
        this.color_scheme_sequential = interpolateRainbow;

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
            showlegend: false,
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
    indexToColor(index, max) {
        return this.color_scheme_sequential((index + 1) / max);
    }
    indexToColorSequential(value, min, max) {
        let normalizer_value = (value - min) / (max - min)
        return this.color_scheme_sequential(normalizer_value);
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
    async plot_tsne(data, is_classification, labels, seed, n) {
        labels = labels.flat()
        const tsne = new TSNE();
        let Y = await tsne.predict(data, n, seed)
        let tsneComponents = Y[0].length
        let tsne_traces = []
        let index = 1;
        let colors = []
        if (is_classification) {
            var uniqueLabels = [...new Set(labels.flat())];
            colors = labels.map(l => this.indexToColor(uniqueLabels.indexOf(l), uniqueLabels.length));
        } else {
            let max = Math.max(...labels)
            let min = Math.min(...labels)
            colors = labels.map(item => this.indexToColorSequential(item, min, max));
        }
        for (let i = 0; i < tsneComponents; i++) {
            for (let j = 0; j < tsneComponents; j++) {
                if (j < i) {
                    let x = Y.map(values => values[j]);
                    let y = Y.map(values => values[i]);
                    tsne_traces.push({
                        x: x,
                        y: y,
                        mode: 'markers',
                        type: 'scatter',
                        xaxis: 'x' + (index),
                        yaxis: 'y' + (index),
                        marker: {
                            color: colors,
                            size: 2,
                        },
                    })

                }
                index++;
            }
        }
        var layout = {
            width: tsneComponents * 150,
            height: tsneComponents * 150,
            spacing: 0,
            title: {
                text: 'TSNE Matrix',
                font: {
                    size: 14
                },
                xref: 'paper',
                x: 0.05,
            },
            showlegend: false,
            boxmode: 'overlay',
            grid: { rows: tsneComponents, xgap: 0.0, ygap: 0.0, columns: tsneComponents, pattern: 'independent' },
            margin: { t: 30, r: 30, l: 30, b: 40 },
        };
        for (var i = 0; i < tsneComponents; i++) {
            for (var j = 0; j < tsneComponents; j++) {
                var xAxisKey = 'xaxis' + ((i * tsneComponents) + j + 1);
                var yAxisKey = 'yaxis' + ((i * tsneComponents) + j + 1);
                let fontSize = 10;
                layout[xAxisKey] = {
                    linecolor: 'black',
                    linewidth: 1,
                    mirror: true,
                    showgrid: false,
                    showticklabels: false,
                    tickfont: {
                        size: fontSize
                    },
                };
                layout[yAxisKey] = {
                    linecolor: 'black',
                    linewidth: 1,
                    mirror: true,
                    showgrid: false,
                    showticklabels: false,
                    tickfont: {
                        size: fontSize
                    },
                };
                if (i === tsneComponents - 1) {
                    layout[xAxisKey] = {
                        linecolor: 'black',
                        linewidth: 1,
                        mirror: true,
                        tickfont: {
                            size: fontSize
                        },
                        title: {
                            text: 'Component-' + (j + 1), font: {
                                size: fontSize
                            },
                        }
                    };

                }
                if (j === 0) {
                    layout[yAxisKey] = {
                        linecolor: 'black',
                        linewidth: 1,
                        mirror: true,
                        tickfont: {
                            size: fontSize
                        },
                        title: {
                            text: 'Component-' + (i + 1), font: {
                                size: fontSize
                            },
                        }
                    };
                }
            }
        }
        Plotly.react('tsne', tsne_traces, layout, {
            ...plotlyImageExportConfig,
            staticPlot: true,
        })

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
            var colorIndices = uniqueLabels.map(label => this.indexToColor(uniqueLabels.indexOf(label), uniqueLabels.legend));
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
    downloadPlot(container) {
        Plotly.toImage(container, {
            format: 'png',
            width: null,
            height: null,
            scale: 2
        }).then(function (dataUrl) {
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = 'plot.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    }
    async classificationPCA(dataset, labels, missclassifications, uniqueLabels, index, n) {
        labels = labels.flat()
        const pca = new PCA();
        var colorIndices = labels.map(label => this.indexToColor(uniqueLabels.indexOf(label), uniqueLabels.length));
        const pca_data = await pca.predict(dataset, n)
        let x = []
        let y = []
        let x_error = []
        let y_error = []
        let error_texts = []
        let real_labels = []
        let missclassificationColors = []
        let truePredsColors = []
        pca_data[0].forEach((element, i) => {
            if (missclassifications['indexes'].includes(i)) {
                let index = missclassifications['indexes'].findIndex(index => index == i)
                error_texts.push(dataset[i].join())
                real_labels.push([labels[i], missclassifications['mispredictions'][index]])
                x_error.push(element[0])
                y_error.push(element[1])
                missclassificationColors.push(colorIndices[i])
            } else {
                x.push(element[0])
                y.push(element[1])
                truePredsColors.push(colorIndices[i])
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
                color: truePredsColors,
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
                color: missclassificationColors,
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
                y: 1,
                bgcolor: 'rgba(0,0,0,0)',

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
        }, { ...plotlyImageExportConfig, staticPlot: false, responsive: true, modeBarButtonsToRemove: ['resetScale2d', 'select2d', 'resetViews', 'sendDataToCloud', 'hoverCompareCartesian', 'lasso2d', 'drawopenpath '] });

    }
    purge_charts(id) {
        Plotly.purge(id)
    }
    async draw_pca(dataset, is_classification, labels, numberOfComponents, axes, columns, drawScreePlot = false) {
        const pca = new PCA();
        labels = labels.flat()
        const [pca_data, _, explained_variances, circels, distances] = await pca.predict(dataset, numberOfComponents)
        let pcaComponents = pca_data[0].length;

        let x = []
        let pca_traces = []
        for (let i = 0; i < axes.length; i++) {
            let principle_components = []
            let axis = axes[i]
            pca_data.forEach((element, i) => {
                principle_components.push({
                    x: element[axis[0] - 1],
                    y: element[axis[1] - 1],
                    label: labels[i]
                })
                x.push(labels[i][0])
            });
        }
        pca_traces = []
        let index = 1;
        let colors = []
        if (is_classification) {
            var uniqueLabels = [...new Set(labels)];
            colors = labels.map(l => this.indexToColor(uniqueLabels.indexOf(l), uniqueLabels.length));
        } else {
            let max = Math.max(...labels)
            let min = Math.min(...labels)
            colors = labels.map(item => this.indexToColorSequential(item, min, max));
        }
        for (let i = 0; i < pcaComponents; i++) {
            for (let j = 0; j < pcaComponents; j++) {
                if (j < i) {
                    let x = pca_data.map(pca_values => pca_values[j]);
                    let y = pca_data.map(pca_values => pca_values[i]);
                    pca_traces.push({
                        x: x,
                        y: y,
                        mode: 'markers',
                        type: 'scatter',
                        xaxis: 'x' + (index),
                        yaxis: 'y' + (index),
                        marker: {
                            color: colors,
                            size: 2,
                        },
                    })

                } else if (j > i) {
                    let x = pca_data.map(data => data[j]);
                    let y = dataset.map(data => data[i]);
                    pca_traces.push({
                        x: x,
                        y: y,
                        mode: 'markers',
                        type: 'scatter',
                        xaxis: 'x' + (index),
                        yaxis: 'y' + (index),
                        marker: {
                            color: colors,
                            size: 2,
                        },
                    })
                } else {
                    let x = pca_data.map(data => data[j]);
                    let y = dataset.map(data => data[i]);
                    pca_traces.push({
                        x: x,
                        y: y,
                        mode: 'markers',
                        type: 'scattergl',
                        xaxis: 'x' + (index),
                        yaxis: 'y' + (index),
                        marker: {
                            color: colors,
                            size: 2,
                        },
                    })
                }
                index++;
            }
        }
        var layout = {
            width: pcaComponents * 150,
            height: pcaComponents * 150,
            spacing: 0,
            title: {
                text: 'PCA Matrix',
                font: {
                    size: 14
                },
                xref: 'paper',
                x: 0.05,
            },
            showlegend: false,
            boxmode: 'overlay',
            grid: { rows: pcaComponents, xgap: 0.0, ygap: 0.0, columns: pcaComponents, pattern: 'independent' },
            margin: { t: 30, r: 30, l: 30, b: 40 },
        };
        for (var i = 0; i < pcaComponents; i++) {
            for (var j = 0; j < pcaComponents; j++) {
                var xAxisKey = 'xaxis' + ((i * pcaComponents) + j + 1);
                var yAxisKey = 'yaxis' + ((i * pcaComponents) + j + 1);
                let fontSize = 10;
                layout[xAxisKey] = {
                    linecolor: 'black',
                    linewidth: 1,
                    mirror: true,
                    showgrid: false,
                    showticklabels: false,
                    tickfont: {
                        size: fontSize
                    },
                };
                layout[yAxisKey] = {
                    linecolor: 'black',
                    linewidth: 1,
                    mirror: true,
                    showgrid: false,
                    showticklabels: false,
                    tickfont: {
                        size: fontSize
                    },
                };
                if (i === pcaComponents - 1) {
                    layout[xAxisKey] = {
                        linecolor: 'black',
                        linewidth: 1,
                        mirror: true,
                        tickfont: {
                            size: fontSize
                        },
                        title: {
                            text: 'PC-' + (j + 1), font: {
                                size: fontSize
                            },
                        }
                    };

                }
                if (j === 0) {
                    layout[yAxisKey] = {
                        linecolor: 'black',
                        linewidth: 1,
                        mirror: true,
                        tickfont: {
                            size: fontSize
                        },
                        title: {
                            text: 'PC-' + (i + 1), font: {
                                size: fontSize
                            },
                        }
                    };
                }
            }
        }
        Plotly.newPlot('pca_matrix', pca_traces, layout, {
            ...plotlyImageExportConfig,
            staticPlot: true,
        })

        let arrows = [];
        let shapes = []

        distances.forEach((distance, i) => {
            arrows.push({
                axref: 'x',
                x: 0,
                ayref: 'y',
                y: 0,
                arrowside: 'start',
                arrowcolor: this.indexToColor(i, distances.length),
                font: {
                    color: this.indexToColor(i, distances.length),
                    size: 8
                },
                xanchor: 'left',   // Align text properly
                yanchor: 'top', // Align text properly
                arrowwidth: 1.2,
                arrowhead: 5,
                text: columns[i],
                hovertext: columns[i] + `(${circels[i][0].toFixed(2)},${circels[i][1].toFixed(2)})`,
                ax: circels[i][0],
                ay: circels[i][1],
            });
        })
        shapes = [
            {
                type: 'circle',
                xref: 'x',
                yref: 'y',
                x0: -1,
                y0: -1,
                x1: 1,
                y1: 1,
                line: {
                    color: 'rgba(50, 171, 96, 1)'
                }
            },

        ]

        Plotly.newPlot('correlation_circle', [{
            x: [],
            y: [],
            type: 'scattergl',
            mode: 'markers'
        }], {
            title: {
                text: 'Biplot',
                font: {
                    size: 14
                },
                xref: 'paper',
                x: 0.05,
            },
            annotations: arrows,
            shapes: shapes,
            showlegend: true,
            height: 300,
            width: 300,
            margin: {
                l: 60,
                r: 40,
                b: 60,
                t: 40,
                pad: 10
            },
            legend: {
                x: 1,
                xanchor: 'right',
                y: 1, bgcolor: 'rgba(0,0,0,0)',

            },
            xaxis: {
                range: [-1.2, 1.2],
                linecolor: 'black',
                linewidth: 1,
                mirror: true,
                title: 'cor with PC1'
            },
            yaxis: {
                range: [-1.2, 1.2],
                linecolor: 'black',
                linewidth: 1,
                mirror: true,
                title: 'cor with PC2'
            }
        }, { ...plotlyImageExportConfig, responsive: true });

        let cumulatedExplainedVaraince = []
        let sum = 0
        let compnentsaxis = []
        explained_variances.forEach((element, i) => {
            sum = sum + element
            compnentsaxis.push(i + 1)
            cumulatedExplainedVaraince.push(sum)
        });
        var trace1 = {
            name: 'Propotional',
            x: compnentsaxis,
            y: explained_variances,
            type: 'scatter'
        };

        var trace2 = {
            name: 'Cumulative',
            x: compnentsaxis,
            y: cumulatedExplainedVaraince,
            type: 'scatter'
        };
        var trace3 = {
            showlegend: false,
            x: [1.1, 1.1],
            y: [0.92, 0.82],
            text: ['0.9', '0.8'],
            mode: 'text'
        };
        var data = [trace1, trace2, trace3];
        if (drawScreePlot) {
            Plotly.newPlot('scree_plot', data, {
                title: {
                    text: 'Scree Plot',
                    font: {
                        size: 14
                    },
                    xref: 'paper',
                    x: 0.05,
                },
                legend: {
                    x: 0.1,
                    y: 0.2,
                    traceorder: 'normal',
                    orientation: "h",
                    font: {
                        size: 8,
                    },
                    bgcolor: 'rgba(0,0,0,0)',
                },
                shapes: [
                    {
                        type: 'line',
                        x0: 1,
                        y0: 0.9,
                        x1: Math.max(...compnentsaxis),
                        y1: 0.9,
                        line: {
                            color: 'rgb(250, 0, 0)',
                            width: 1.5,
                            dash: 'dashdot'
                        }
                    }, {
                        type: 'line',
                        x0: 1,
                        y0: 0.8,
                        x1: Math.max(...compnentsaxis),
                        y1: 0.8,
                        line: {
                            color: 'rgb(50, 171, 96)',
                            width: 1.5,
                            dash: 'dashdot'
                        }
                    }],
                margin: {
                    l: 60,
                    r: 60,
                    b: 40,
                    t: 40,
                    pad: 10
                },
                xaxis: {
                    linecolor: 'black',
                    linewidth: 1,
                    tickmode: 'linear',
                    dtick: 1,
                    mirror: true,
                    zeroline: false,
                    title: 'Number of PCs'
                },
                yaxis: {
                    linecolor: 'black',
                    linewidth: 1,
                    rang: [0, 1],
                    zeroline: false,
                    mirror: true,
                    title: 'Explained variance'
                }
            }, { ...plotlyImageExportConfig, responsive: true });
        }

        // Highcharts.chart('scree_plot', {
        //     credits: {
        //         enabled: false
        //     },

        //     title: {
        //         text: 'Explained Variance',
        //     },
        //     legend: {
        //         verticalAlign: 'bottom',
        //         align: 'left',
        //         floating: true,
        //     },
        //     yAxis: {
        //         linecolor: 'black',
        //         linewidth: 2,
        //         mirror: true,
        //         min: 0,
        //         max: 1,
        //         title: {
        //             text: 'Explained variance'
        //         },
        //         plotLines: [{
        //             value: 0.9,
        //             dashStyle: 'shortdash',
        //             color: 'grey',
        //             width: 1,
        //             zIndex: 4,
        //             label: {
        //                 text: '0.9', align: "right",
        //             }
        //         }, {
        //             value: 0.8,
        //             dashStyle: 'shortdash',
        //             color: 'darkgrey',
        //             width: 1,
        //             zIndex: 4,
        //             label: {
        //                 text: '0.8', align: "right",
        //             }
        //         }]

        //     },
        //     xAxis: {
        //         linecolor: 'black',
        //         linewidth: 2,
        //         mirror: true,
        //         labels: {
        //             enabled: true,
        //             formatter: function () {
        //                 return this.value + 1;
        //             }
        //         },

        //         title: {
        //             text: 'Number of PCs'
        //         },
        //     },
        //     series: [{
        //         name: 'Propotional',
        //         color: "blue",
        //         data: explained_variances
        //     },
        //     {
        //         name: 'Cumulative',
        //         color: "red",
        //         data: cumulatedExplainedVaraince
        //     }],

        // });
        return [pca_data.map(item => Array.from(item)), cumulatedExplainedVaraince]
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
    probabilities_boxplot(probs, labels, uniqueLabels, index) {
        let traces = [];
        let probablitiesFormatted = []
        let subsets = {};
        labels.forEach((true_label, i) => {
            if (!(true_label in subsets)) {
                subsets[true_label] = [];
            }
            subsets[true_label].push(probs[i]);
        });
        for (const trueClass in subsets) {
            const classProbas = subsets[trueClass];
            classProbas.forEach((proba) => {
                const max = Math.max(...proba)
                probablitiesFormatted.push({
                    trueClass: trueClass,
                    predicted: proba.findIndex(prob => prob == max),
                    probablity: proba
                })
            })
        }
        let i = 0;
        let x = probablitiesFormatted.map(prob => prob.predicted);
        for (let true_label in subsets) {
            let classIndex = uniqueLabels.findIndex(m => m == true_label)
            traces.push({
                type: 'box',
                name: true_label,
                marker: {
                    color: this.indexToColor(classIndex, uniqueLabels.length),
                    size: 2,
                    line: {
                        outlierwidth: 0.3
                    }
                },
                line: {
                    width: 0.5
                },
                y: probablitiesFormatted.map(m => m.probablity[i]),
                x: x
            });
            i++;
        }
        // traces.forEach(trace => {
        //     trace['type'] = 'violin'
        // })
        // Plotly.newPlot("proba_violin_plot_" + index, traces, {
        //     xaxis: {
        //         linecolor: 'black',
        //         linewidth: 1,
        //         mirror: true,
        //     },
        //     yaxis: {
        //         title: 'Predicted Probability',
        //         linecolor: 'black',
        //         zeroline: false,
        //         linewidth: 1,
        //         mirror: true,
        //     },
        //     legend: {
        //         x: 1,
        //         xanchor: 'right',
        //         y: 1
        //     },
        //     violinmode: 'group'
        // }, { responsive: true });
        // traces.forEach(trace => {
        //     trace['type'] = 'box'
        // })
        Plotly.newPlot("proba_plot_" + index, traces, {
            xaxis: {
                linecolor: 'black',
                linewidth: 1,
                mirror: true,
                title: 'class'
            },
            yaxis: {
                title: 'Predicted Probability',
                linecolor: 'black',
                zeroline: false,
                linewidth: 1,
                mirror: true,
            },
            legend: {
                x: 1,
                xanchor: 'right',
                y: 1,
                bgcolor: 'rgba(0,0,0,0)',

            },
            boxmode: 'group'
        }, { responsive: true });
    }

    async plotConfusionMatrix(y, predictedLabels, labels, uniqueClasses, tab_index) {

        const confusionMatrix = await metrics.confusionMatrix(y, predictedLabels, uniqueClasses.length);
        let metric = await ClassificationMetric(y.arraySync(), predictedLabels.arraySync(), uniqueClasses)
        let accuracy = metric.accuracy.toFixed(2);
        let f1Micro = metric.f1_micro.toFixed(2)
        let f1Macro = metric.f1_macro.toFixed(2)

        let len = confusionMatrix[0].length
        let preceissions = [];
        let recalls = [];
        for (let j = 0; j < len; j++) {
            preceissions.push(parseFloat(metric.precision[j].toFixed(2)))
        }
        for (let j = 0; j < len; j++) {
            recalls.push(parseFloat(metric.recall[j].toFixed(2)))
        }
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
                    fontSize: '0.75em'
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

                        series.options.data.forEach(function (p, i) {
                            if (p[0] === x) {
                                if (p[1] < uniqueClasses.length) {
                                    sum += p[2];
                                }
                            }
                        });

                        return +sum.toFixed(2);
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
                        series.options.data.forEach(function (p, i) {
                            if (p[1] < uniqueClasses.length) {
                                if (p[1] === x) {
                                    if (p[0] < uniqueClasses.length) {
                                        sum += p[2];
                                    }

                                }
                            }
                        });
                        return +sum.toFixed(2);
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
                enabled: false,
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
                            return +(acc + cur?.value).toFixed(2);
                        }, 0);
                        var count = this.point.value;
                        var skip = this.point.index >= this.series.data.length - (1 * (uniqueClasses.length + 1));

                        if (!skip && !((this.point.index + 1) % (uniqueClasses.length + 1) === 0)) {
                            var percentage = +((count / totalCount) * 100).toFixed(2);
                            return '<p style="margin:auto; text-align:center;">' + (+count.toFixed(2)) + '<br/>(' + (+percentage).toFixed(2) + '%)</p> ';
                        } else {
                            return '<p style="margin:auto; text-align:center;">' + (+count.toFixed(2)) + '</p>';
                        }
                    }
                }
            }],
            responsive: {
                rules: [{
                    condition: {
                        maxWidth: 200
                    },
                    chartOptions: {
                        yAxis: {
                            labels: {
                                format: '{substr value 0 1}',
                                padding: 0,
                                style: {
                                    fontSize: '6px'
                                }
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
            marker: {
                color: 'blue',
                size: 4
            },
        }, {
            x: y_test,
            y: y_test,
            mode: 'lines',
            type: 'scatter',
            line: { color: 'red', dash: 'solid' },
            name: 'y = x line'
        }], {
            height: 300,
            width: 300,
            title: {
                text: title,
                font: {
                    size: 14
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
                        size: 14,
                    }
                },
            },
            yaxis: {
                linecolor: 'black',
                linewidth: 1,
                mirror: true,
                title: {
                    text: 'Predictions',
                    font: {
                        size: 14,
                    }
                }
            },
            margin: {
                l: 40,
                r: 10,
                b: 40,
                t: 40,
                pad: 0
            }
        }, {
            responsive: true, staticPlot: false, ...plotlyImageExportConfig
        });
    }
    comparison(x, y, container, title = '', yLabel = '') {
        Plotly.newPlot(container, [{
            x: x,
            y: y,
            type: 'scatter',
            name: "y",
            mode: 'line',
            marker: {
                color: 'blue',
                size: 4
            },
        }], {
            height: 300,
            width: 300,
            title: {
                text: title,
                font: {
                    size: 14
                },
                xref: 'paper',
                x: 0.05,
            },
            showlegend: false,
            xaxis: {
                linecolor: 'black',
                tickangle: -45,
                linewidth: 1,
                mirror: true,
                title: {
                    font: {
                        size: 14,
                    }
                },
            },
            yaxis: {
                linecolor: 'black',
                linewidth: 1,
                mirror: true,
                title: {
                    text: yLabel,
                    font: {
                        size: 14,
                    }
                }
            },
            margin: {
                l: 40,
                r: 10,
                b: 80,
                t: 40,
                pad: 0
            }
        }, {
            responsive: true, staticPlot: false, ...plotlyImageExportConfig
        });
    }
    residual_plot(y, residuals, container, title = '') {
        Plotly.newPlot(container, [

            {
                x: y,
                y: residuals,
                type: 'scatter',
                name: "y",
                mode: 'markers',
                marker: {
                    color: 'blue',
                    size: 4
                },
            },
            {
                x: y,
                y: y.map(m => 0),
                mode: 'lines',
                type: 'scatter',
                line: { color: 'red', dash: 'solid' },
            }
        ],
            {
                height: 300,
                width: 300,
                title: {
                    text: title,
                    font: {
                        size: 14
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
                            size: 14,
                        }
                    },
                },
                yaxis: {
                    linecolor: 'black',
                    linewidth: 1,
                    mirror: true,
                    title: {
                        text: 'Residuals',
                        font: {
                            size: 14,
                        }
                    }
                },
                margin: {
                    l: 40,
                    r: 10,
                    b: 40,
                    t: 40,
                    pad: 0
                }
            }, { responsive: true, ...plotlyImageExportConfig, staticPlot: false });
    }

    ScatterplotMatrix(items, features, labels, number_of_categoricals, is_classification = true, numeric_columns, categorical_columns, dataset) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {

                let unique_labels = [...new Set(labels)];
                if (unique_labels.length === 2) {
                    unique_labels.sort()
                }
                console.log('splom', unique_labels);

                var colors = labels.map(label => this.indexToColor(unique_labels.indexOf(label), unique_labels.length));
                let traces = []
                let index = 1;
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
                                            x: unique_labels.map(label => '' + label),
                                            y: subsets.map(set => set.length),
                                            type: 'bar',
                                            xaxis: 'x' + (index),
                                            yaxis: 'y' + (index),
                                            marker: {
                                                color: unique_labels.map((_, z) => this.indexToColor(z, unique_labels.length))
                                                , opacity: 0.7
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
                                                    color: this.indexToColor(i, unique_labels.length)
                                                    , opacity: 0.7
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
                                                color: this.indexToColor(i, unique_labels.length),
                                                opacity: 0.7,
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
                                            opacity: 0.7,
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
                                    opacity: 0.7,
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

                                let boxplot_labels = [...new Set(items.map(m => m[j]))].sort((a, b) => a - b)
                                let boxtraces = []
                                for (let m = 0; m < unique_labels.length; m++) {
                                    for (let n = 0; n < boxplot_labels.length; n++) {

                                        let box_items = items.filter(item => item[j] === boxplot_labels[n] && item[features.length - 1] === unique_labels[m])
                                        if (box_items) {
                                            boxtraces.push({
                                                y: box_items.map(item => item[i]),
                                                marker: {
                                                    color: this.indexToColor(m, unique_labels.length),
                                                    size: 2,
                                                    line: {
                                                        outlierwidth: 0.3
                                                    }
                                                },
                                                type: 'box',
                                                xaxis: 'x' + (index),
                                                yaxis: 'y' + (index),
                                                line: {
                                                    width: 0.5
                                                }
                                            })
                                        }
                                    }
                                }
                                if (j < features.length - 1) {
                                    for (let i = 0; i < (boxtraces.length) / 2; i++) {
                                        boxtraces[i]['x'] = Array(boxtraces[i]['y'].length).fill(i);
                                        if (boxtraces[((boxtraces.length) / 2) + i]) {
                                            boxtraces[((boxtraces.length) / 2) + i]['x'] = Array(boxtraces[i]['y'].length).fill(i + 0.5);
                                        }
                                    }
                                    traces = traces.concat(boxtraces)
                                } else {
                                    traces = traces.concat(boxtraces)
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
                    boxmode: 'overlay',
                    grid: { rows: features.length, xgap: 0.0, ygap: 0.0, columns: features.length, pattern: 'independent' },
                    margin: { t: 20, r: 20 },

                };
                for (var i = 0; i < features.length; i++) {
                    for (var j = 0; j < features.length; j++) {
                        var xAxisKey = 'xaxis' + ((i * features.length) + j + 1);
                        var yAxisKey = 'yaxis' + ((i * features.length) + j + 1);
                        let fontSize = 10;
                        layout[xAxisKey] = {
                            linecolor: 'black',
                            linewidth: 1,
                            mirror: true,
                            showgrid: false,
                            showticklabels: false,
                            tickfont: {
                                size: fontSize
                            },
                        };
                        layout[yAxisKey] = {
                            linecolor: 'black',
                            linewidth: 1,
                            mirror: true,
                            showgrid: false,
                            showticklabels: false,
                            tickfont: {
                                size: fontSize
                            },
                        };
                        if (i === features.length - 1) {
                            layout[xAxisKey] = {
                                linecolor: 'black',
                                linewidth: 1,
                                mirror: true,
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
                                linecolor: 'black',
                                linewidth: 1,
                                mirror: true,
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
                    ...plotlyImageExportConfig,
                    staticPlot: true,
                    modeBarButtonsToRemove: ['resetScale2d', 'select2d', 'resetViews', 'sendDataToCloud', 'hoverCompareCartesian', 'lasso2d', 'drawopenpath ']
                })
                resolve()
            }, 1000);
        })
    }

    KNNPerformancePlot(results, best_n, id, label = "Accuracy") {
        let traces = []
        traces.push({
            x: results.map(m => m[1]),
            y: results.filter(n => n[0] === 'manhattan').map(m => Number(m[2])),
            mode: 'lines',
            name: 'manhattan test set',
            line: {
                color: 'rgb(55, 128, 191)',
                width: 2
            }
        });

        traces.push({
            x: results.map(m => m[1]),
            y: results.filter(n => n[0] === 'euclidean').map(m => Number(m[2])),
            mode: 'lines',
            name: 'euclidean test set',
            line: {
                color: 'rgb(219, 64, 82)',
                width: 2
            }
        });

        var layout = {
            showlegend: true,
            legend: {
                x: 0.1,
                y: 0.2,
                traceorder: 'normal',
                orientation: "h",
                font: {
                    size: 12,
                },
                bgcolor: 'rgba(0,0,0,0)',
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
                range: [0, 1],
                linecolor: 'black',
                linewidth: 1,
                mirror: true,
                title: {
                    text: label,
                }
            },
            shapes: [
                {
                    type: 'line',
                    x0: best_n,
                    y0: 0,
                    x1: best_n,
                    y1: 1,
                    line: {
                        dash: 'dot',
                        color: 'rgb(55, 128, 191)',
                        width: 1
                    }
                },]
        };
        Plotly.newPlot("knn_table_" + id, traces, layout, { responsive: true });
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
                x: 0.1,
                y: 0.2,
                traceorder: 'normal',
                orientation: "h",
                font: {
                    size: 10,
                },
                bgcolor: 'rgba(0,0,0,0)',
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
    correaltoinMatrixColorscale(correlations) {
        let featuresCount = correlations[0].length;
        let corrs = [];

        for (let i = 0; i < featuresCount; i++) {
            corrs.push(...correlations[i])
        }
        corrs.sort()
        let countNegatives = 0
        for (let i = 0; i < corrs.length; i++) {
            if (corrs[i] < 0) {
                countNegatives += 1
            } else {
                break
            }
        }

        let portionOfNegativeValues = Math.round(((countNegatives - 1) / corrs.length) * 100) / 100

        let colorscale = [
            [0, 'rgb(0, 0, 100)'],
            [portionOfNegativeValues, 'rgb(161, 161, 255)'],
            [portionOfNegativeValues + 0.001, 'rgb(253, 237, 237)'],
            [1.0, 'rgb(255, 0, 0)']
        ]
        return colorscale
    }
    async correlationHeatmap(id, correlations, names) {

        var data = [
            {
                z: correlations,
                x: names,
                y: names,
                type: 'heatmap',
                zmin: -1,
                zmax: 1,
                hoverongaps: false,
                colorscale: [
                    [0, 'rgb(74,141,255)'],
                    [0.10, 'rgb(102,151,255)'],
                    [0.20, 'rgb(121,170,255)'],
                    [0.30, 'rgb(137,187,255)'],
                    [0.40, 'rgb(205,221,255)'],
                    [0.50, 'rgb(255,255,255)'],
                    [0.51, 'rgb(253, 237, 237)'],
                    [0.6, 'rgb(255,169,169)'],
                    [0.75, 'rgb(249,100,100)'],
                    [0.95, 'rgb(225,0,0)'],
                    [1.0, 'rgb(165,0,0)']
                ],
                showscale: false,
            }
        ];
        var layout = {

            annotations: [],
            font: {
                size: 10
            },
            xaxis: {
                ticks: '',
                side: 'bottom',
                tickangle: -90,
            },
            yaxis: {
                autorange: "reversed",
                tickangle: -45,
                ticks: '',
                ticksuffix: ' ',
            },
            autosize: true,

        };
        for (var i = 0; i < names.length; i++) {
            for (var j = names.length - 1; j >= 0; j--) {
                var currentValue = correlations[i][j];
                let textColor
                if (currentValue <= 0.0) {
                    textColor = 'black';
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

        await Plotly.newPlot(id, data, layout, { ...plotlyImageExportConfig, responsive: true });
    }
    async dendogramPlot(id, correlations, linkage, names, originalColumns) {

        var trace4 = {
            x: names,
            y: names,
            z: correlations,
            type: 'heatmap',
            zmin: -1,
            zmax: 1,
            hoverongaps: false,
            colorscale: [
                [0, 'rgb(74,141,255)'],
                [0.10, 'rgb(102,151,255)'],
                [0.20, 'rgb(121,170,255)'],
                [0.30, 'rgb(137,187,255)'],
                [0.40, 'rgb(205,221,255)'],
                [0.50, 'rgb(255,255,255)'],
                [0.51, 'rgb(253, 237, 237)'],
                [0.6, 'rgb(255,169,169)'],
                [0.75, 'rgb(249,100,100)'],
                [0.95, 'rgb(225,0,0)'],
                [1.0, 'rgb(165,0,0)']
            ],
            xaxis: 'x',
            yaxis: 'y',
            colorbar: {
                thickness: 10,
                len: 0.5,
            }
        };
        let indices = []
        let linksLength = linkage.length + 1;
        let currentLimitY = 0;
        let prevLimitY = 0;
        let clusterY = 0
        let clusterX = 0
        for (let i = 0; i < originalColumns.length; i++) {
            indices.push(names.findIndex(name => name == originalColumns[i]))
        }
        let tickValues = []
        for (let i = 0; i < linksLength; i++) {
            tickValues.push((i + 1) * 10)
        }

        let dendrogramUP = {
            'data': [],
            'layout': {
                'width': '100%', 'showlegend': false,
                'xaxis': {
                    'showticklabels': true, 'tickmode': 'array', 'ticks': 'outside',
                    'showgrid': false, 'mirror': 'allticks', 'zeroline': false, 'showline': true, 'rangemode': 'tozero',
                    'type': 'linear'
                }, 'yaxis': {
                    'showticklabels': true, 'ticks': 'outside', 'showgrid': false, 'mirror': 'allticks', 'zeroline':
                        false, 'showline': true, 'rangemode': 'tozero', 'type': 'linear'
                }, 'hovermode': 'closest', 'autosize': false, 'height': '100%'
            }
        }

        let dendrogramRIGHT = {
            'data': [],
            'layout': {
                'width': '100%', 'showlegend': false,
                'xaxis': {
                    'showticklabels': true, 'ticks': 'outside', 'showgrid': false, 'mirror': 'allticks', 'zeroline': false, 'showline': true,
                    'rangemode': 'tozero', 'type': 'linear'
                }, 'yaxis': {
                    'showticklabels': true, 'tickmode': 'array', 'ticks': 'outside', 'showgrid': false,
                    'mirror': 'allticks', 'zeroline': false, 'showline': true, 'rangemode': 'tozero',
                    'type': 'linear'
                }, 'hovermode': 'closest', 'autosize': false,
                'height': '100%'
            }
        }
        let history = {}

        linkage.forEach((link, i) => {
            let l0, l1;
            if (indices[link[0]] + 1) {
                l0 = indices[link[0]] + 1 ?? link[0] + 1
            }
            if (indices[link[1]] + 1) {
                l1 = indices[link[1]] + 1 ?? link[1] + 1
            }
            if (currentLimitY == 0) {
                currentLimitY = (parseFloat(i + 1) / linksLength);
            }
            if (l0 <= linksLength && l1 <= linksLength) {
                clusterX = ((l0 * (Math.max(...tickValues) / linksLength) + l1 * (Math.max(...tickValues) / linksLength)) / 2)
                dendrogramUP.data.push({
                    'yaxis': 'y2', 'x': [l0 * 10, l0 * 10, l1 * 10, l1 * 10],
                    'mode': 'lines', 'xaxis': 'x', 'marker': { 'color': `${this.indexToColor(i)}` },
                    'y': [
                        prevLimitY, currentLimitY,
                        currentLimitY, prevLimitY
                    ],
                    'type': 'scatter'
                })

            } else {
                prevLimitY = l0 <= linksLength ? currentLimitY : history[link[0]]?.y_current;
                currentLimitY = (parseFloat(i + 1) / linksLength);
                let x = [
                    (l0 <= linksLength ? l0 * 10. : history[link[0]]?.x),
                    (l0 <= linksLength ? l0 * 10. : history[link[0]]?.x),
                    (l1 <= linksLength ? l1 * 10. : history[link[1]]?.x),
                    (l1 <= linksLength ? l1 * 10. : history[link[1]]?.x),
                ]
                let y = [
                    history[link[0]]?.y_current ?? 0, currentLimitY,
                    currentLimitY, history[link[1]]?.y_current ?? 0
                ]
                dendrogramUP.data.push({
                    'yaxis': 'y2', 'x': x,
                    'mode': 'lines', 'xaxis': 'x', 'marker': { 'color': `${this.indexToColor(i)}` },
                    'y': y,
                    'type': 'scatter'
                })
                clusterX = x.reduce((prev, curr) => prev + curr, 0) / 4;

            }
            history[linksLength + i] = { x: clusterX, y_current: currentLimitY }

        })



        let currentLimitX = 0;
        let prevLimitX = 0;
        history = []
        linkage.forEach((link, i) => {
            let l0 = indices[link[0]] + 1
            let l1 = indices[link[1]] + 1

            if (currentLimitX == 0) {
                currentLimitX = (parseFloat(i + 1) / linksLength);
            }
            if (l0 <= linksLength && l1 <= linksLength) {
                clusterY = ((l0 * -10 + l1 * -10) / 2) - 2
                dendrogramRIGHT.data.push({
                    'yaxis': 'y', 'y': [l0 * -10, l0 * -10, l1 * -10, l1 * -10],
                    'mode': 'lines', 'xaxis': 'x2', 'marker': { 'color': `${this.indexToColor(i)}` },
                    'x': [
                        prevLimitX, currentLimitX,
                        currentLimitX, prevLimitX
                    ],
                    'type': 'scatter'
                })
            } else {
                prevLimitX = l0 <= linksLength ? currentLimitX : history[link[0]].x;
                currentLimitX = (parseFloat(i + 1) / linksLength);
                let y = [
                    (l0 <= linksLength ? l0 * -10. : history[link[0]]?.y),
                    (l0 <= linksLength ? l0 * -10. : history[link[0]]?.y),
                    (l1 <= linksLength ? l1 * -10. : history[link[1]]?.y),
                    (l1 <= linksLength ? l1 * -10. : history[link[1]]?.y),
                ]
                dendrogramRIGHT.data.push({
                    'yaxis': 'y', 'y': y,
                    'mode': 'lines', 'xaxis': 'x2', 'marker': { 'color': `${this.indexToColor(i)}` },
                    'x': [
                        history[link[0]]?.x ?? 0, currentLimitX,
                        currentLimitX, history[link[1]]?.x ?? 0
                    ],
                    'type': 'scatter'
                })
                clusterY = y.reduce((prev, curr) => prev + curr, 0) / 4
            }
            history[linksLength + i] = { y: clusterY, x: currentLimitX }
        })

        var layout2 = {
            annotations: [],
            font: {
                size: 10
            },
            autosize: true,

            yaxis: {
                domain: [0, 0.75],
                mirror: false,
                showgrid: false,
                showline: false,
                zeroline: false,
                showticklabels: true,
                ticks: "",
                tickvals: tickValues.map(tick => -tick),
                ticktext: names,
                tickangle: -45,

            },
            xaxis: {
                domain: [0, 0.75],
                mirror: false,
                showgrid: false,
                showline: false,
                zeroline: false,
                showticklabels: true,
                ticks: "",
                tickvals: tickValues,
                ticktext: names,
                tickangle: -90,

            },
            xaxis2: {
                domain: [0.75, 1],
                mirror: false,
                showgrid: false,
                showline: false,
                zeroline: false,
                showticklabels: false,
                ticks: "",
                ticktext: names,
            },
            yaxis2: {
                domain: [0.75, 1],
                mirror: false,
                showgrid: false,
                showline: false,
                zeroline: false,
                showticklabels: false,
                ticktext: names,
            },
            showlegend: false,
            coloraxis: {
                colorscale: 'YlGnBu',
                showscale: true,
                cmin: -1,
                cmax: 1
            },
            margin: { l: 60, r: 30, b: 60, t: 30 },

        };
        for (var i = 0; i < names.length; i++) {
            for (var j = names.length - 1; j >= 0; j--) {
                var currentValue = correlations[i][j];
                let textColor
                if (currentValue <= 0.0) {
                    textColor = 'black';
                } else {
                    textColor = 'black';
                }
                var result = {
                    xref: 'x',
                    yref: 'y',
                    x: tickValues[i],
                    y: -tickValues[j],
                    text: currentValue.toFixed(2),
                    font: {
                        family: 'Arial',
                        size: 8,
                        color: textColor
                    },
                    showarrow: false,
                };
                layout2.annotations.push(result);
            }
        }
        let data = dendrogramUP['data']
        data = data.concat(dendrogramRIGHT['data'])

        trace4['x'] = tickValues
        trace4['y'] = tickValues.map(tick => -tick)

        data = data.concat(trace4)

        Plotly.newPlot(id, data, layout2, { ...plotlyImageExportConfig, responsive: true });
    }
    PFIBoxplot(id, importances, columns) {
        let traces = []
        let avgs = []
        importances.forEach(importance => {
            const importancesMean = importance.reduce((a, b) => a + b, 0)
            avgs.push((importancesMean / importance.length))
        });
        let max = Math.max(...avgs)
        let min = Math.min(...avgs)

        importances.forEach((importance, index) => {

            traces.push(
                {
                    x: Array.from(importance),
                    type: 'box',
                    name: columns[index],
                    marker: { color: this.indexToColor(index, importances.length) },
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
            showlegend: false,
            xaxis: {
                linecolor: 'black',
                linewidth: 1,
                mirror: true,
                zeroline: false,

            },
            yaxis: {
                linecolor: 'black',
                linewidth: 1,
                mirror: true,
                automargin: true,
                zeroline: false,

            },
        };

        Plotly.newPlot('pfi_boxplot_' + id, traces, layout, { responsive: true });
    }
    plotPDP(id, averages, grids, labels, columns, categorical_columns) {
        let pfiChartId = 'pdp_containers_' + id;
        id = 'pdp_plot_' + id

        grids.forEach((grid, i) => {
            let element = document.getElementById(pfiChartId);
            let chartContainer = document.createElement("div");
            chartContainer.classList.add("column", "is-6");
            let chartId = id + '_' + i;
            chartContainer.id = chartId
            chartContainer.style.height = "400px";
            element.after(chartContainer)
            let traces = []
            const isCategorical = categorical_columns.includes(columns[i])
            averages[i].forEach((average, index) => {
                if (isCategorical) {
                    traces.push(
                        {
                            x: grid,
                            y: Array.from(average),
                            type: 'bar',
                            name: labels[index],
                            marker: { color: this.indexToColor(index, averages[i].length) }
                        }
                    )
                } else {
                    traces.push(
                        {
                            x: grid,
                            y: Array.from(average),
                            mode: 'line',
                            name: labels[index],
                            marker: { color: this.indexToColor(index, averages[i].length) }
                        }
                    )
                }

            });
            var layout = {

                title: {
                    text: 'Partial Dependence Plot - ' + columns[i],
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
                    zeroline: false,
                },
                yaxis: {
                    linecolor: 'black',
                    zeroline: false,
                    linewidth: 1,
                    mirror: true,
                    title: {
                        text: 'Prediction',
                    }
                },
            };

            Plotly.newPlot(chartId, traces, layout, { ...plotlyImageExportConfig, responsive: true });
        });
    }
    plotPDPRegression(id, averages, grids, labels, columns, categoricals) {
        let pfiChartId = 'pfi_boxplot_' + id;
        let element = document.getElementById(pfiChartId);
        let chartContainer = document.createElement("div");
        chartContainer.classList.add("column", "is-6");
        const chartId = id + '_number';
        chartContainer.id = chartId
        chartContainer.style.height = "400px";
        element.after(chartContainer);
        element = document.getElementById(chartId);

        chartContainer = document.createElement("div");
        chartContainer.classList.add("column", "is-6");
        const chartIdCategorical = id + '_class';
        chartContainer.id = chartIdCategorical
        chartContainer.style.height = "400px";
        element.after(chartContainer);

        let traces = []
        let traces_categoricals = []
        let allxs = []
        // grids.forEach((grid, i) => {
        //     if (!categoricals.includes(columns[i])) {
        //         allxs = allxs.concat(grid)
        //     }
        // })
        // scaler.fit(allxs)
        grids.forEach((grid, i) => {
            if (!categoricals.includes(columns[i])) {
                averages[i].forEach((average, index) => {
                    let scaler = new MinMaxScaler();
                    scaler.fit(grid)
                    // let xs = scaler.transform(grid)
                    let xs = grid

                    traces.push(
                        {
                            x: xs,
                            y: Array.from(average),
                            mode: 'line',
                            name: columns[i],
                            marker: { color: this.indexToColor(i, averages.length) }
                        }
                    )
                });
            } else {
                averages[i].forEach((average, index) => {
                    traces_categoricals.push(
                        {
                            x: grid,
                            y: Array.from(average),
                            type: 'bar',
                            name: columns[i],
                            marker: { color: this.indexToColor(i, averages.length), opacity: 0.7 }
                        }
                    )
                });
            }

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
            legend: {
                x: 0.1,
                y: 1,
                orientation: "h",
                font: {
                    size: 8
                },
                bgcolor: 'rgba(0,0,0,0)',
            },

            font: {
                size: 10
            },
            autosize: true,
            xaxis: {
                linecolor: 'black',
                linewidth: 1,
                mirror: true,
                zeroline: false,
                title: {
                    text: 'Feature',
                }
            },
            yaxis: {
                linecolor: 'black',
                linewidth: 1,
                mirror: true,
                zeroline: false,
                title: {
                    text: 'Prediction',
                }
            },
        };
        Plotly.newPlot(chartId, traces, layout, { ...plotlyImageExportConfig, responsive: true });
        var layout2 = {
            title: {
                text: 'Partial Dependence Plot',
                font: {
                    size: 14
                },
                xref: 'paper',
                x: 0.05,
            },

            barmode: 'group',
            font: {
                size: 10
            },
            autosize: true,
            xaxis: {
                linecolor: 'black',
                linewidth: 1,
                mirror: true,
                title: {
                    text: 'Feature',
                }
            },
            bargap: 0.05,
            yaxis: {
                linecolor: 'black',
                linewidth: 1,
                mirror: true,
                title: {
                    text: 'Prediction',
                }
            },
        };

        Plotly.newPlot(chartIdCategorical, traces_categoricals, layout2);
    }
    drawAutoencoder(points, xIndex = 1, yIndex = 0, labels, is_classification) {
        labels = labels.map(l => l[0])
        let colors = [];
        if (is_classification) {
            var uniqueLabels = [...new Set(labels)];
            colors = points.map((_, i) => this.indexToColor(uniqueLabels.indexOf(labels[i]), uniqueLabels.length))
        } else {
            let min = Math.min(...labels);
            let max = Math.max(...labels);
            colors = labels.map(label => this.indexToColorSequential(label, min, max))
        }
        var trace1 = {
            x: points.map(point => point[xIndex]),
            y: points.map(point => point[yIndex]),
            mode: 'markers',
            type: 'scatter',
            marker: {
                size: 3,
                color: colors
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
            xaxis: {
                linecolor: 'black',
                linewidth: 1,
                mirror: true,
                zeroline: false,

            },
            yaxis: {
                linecolor: 'black',
                linewidth: 1,
                zeroline: false,
                mirror: true,
            },
            margin: {
                l: 50,
                r: 40,
                b: 50,
                t: 40,
                pad: 20
            },
        };

        Plotly.newPlot('autoencoder', data, layout);
    }
    plotROC(id, fprs, tprs, labels, auc) {

        let traces = []
        fprs.forEach((fpr, index) => {
            traces.push(
                {
                    x: fpr,
                    y: tprs[index],
                    mode: 'line',
                    name: labels[index],
                    marker: { color: this.indexToColor(index, labels.length) }
                }
            )
        });
        traces.push(
            {
                x: [0, 1],
                y: [0, 1],
                mode: 'line',
                name: 'Chance Line',
                marker: { color: 'black' },
                line: {
                    dash: 'dot',
                    width: 1
                }
            }
        )
        var layout = {
            title: {
                text: (labels.length > 2 ? ' One-vs-Rest Strategy ROC Curve' : 'ROC Curve') + ' AUC: ' + (+auc).toFixed(2),
                font: {
                    size: 14
                },
            },
            margin: {
                b: 40,
            },
            legend: {
                x: 1,
                xanchor: 'right',
                y: 0.1,
                bgcolor: 'rgba(0,0,0,0)',

            },
            showlegend: true,
            xaxis: {
                linecolor: 'black',
                linewidth: 1,
                range: [-0.1, 1.1],
                mirror: true,
                title: {
                    text: 'False positive rate',
                },
            },
            yaxis: {
                linecolor: 'black',
                linewidth: 1,
                mirror: true,
                range: [-0.1, 1.1],
                title: {
                    text: 'True positive rate',
                }
            },
        };

        Plotly.newPlot('roc_plot_' + id, traces, layout, { responsive: true });
    }

    uniformSplist(n) {
        let numbers = []
        for (let i = 0; i < n; i++) {
            numbers.push(i / (n - 1))
        }
        return numbers;
    }
    parallelCoordinatePlot(features, labels, column_names, is_classification) {
        let labelEncoder = new LabelEncoder()
        if (is_classification) {
            labelEncoder.fit(labels)
            labels = labelEncoder.transform(labels)
        }
        var uniqueLabels = [...new Set(labels)];
        if (uniqueLabels.length === 2) {
            uniqueLabels.sort()
        }
        console.log('pc labels', uniqueLabels);

        let points = this.uniformSplist(uniqueLabels.length)
        let colorMapping = uniqueLabels.map((label, i) => [points[i], this.indexToColor(uniqueLabels.indexOf(label), uniqueLabels.length)])

        var data = [{
            type: 'parcoords',
            pad: [20, 20, 20, 20],
            line: {
                color: labels,
                colorscale: is_classification ? colorMapping : 'jet',
            },
            dimensions: []
        }];

        column_names.forEach((column_name, i) => {
            data[0].dimensions.push({
                label: column_name,
                values: features.map(m => m[i])
            })

        })
        var layout = {
            title: {
                text: 'Parallel Coordinate Plot',
                font: {
                    size: 14
                },
                xref: 'paper',
                x: 0.05,
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
        };

        Plotly.newPlot('parallel_coordinate_plot', data, layout, { ...plotlyImageExportConfig, responsive: true, modeBarButtonsToRemove: ['resetScale2d', 'select2d', 'resetViews', 'sendDataToCloud', 'hoverCompareCartesian', 'lasso2d', 'drawopenpath '] });
    }
}