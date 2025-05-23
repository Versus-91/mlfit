/* eslint-disable no-undef */
import { asyncRun } from "./py-worker";
import { MinMaxScaler, StandardScaler, LabelEncoder, getDummies } from 'danfojs/dist/danfojs-base';
import { FeatureCategories } from '../helpers/settings'

import * as Papa from 'papaparse';
async function parseCsv(data) {
    return new Promise(resolve => {
        data = data.map((row) => {
            return Object.keys(row).sort().map(key => parseFloat(row[key]));
        });
        resolve(data);
    });
}

/**
 * Downloads and returns the csv.
 *
 * @param {string} filename Name of file to be loaded.
 *
 * @returns {Promise.Array<number[]>} Resolves to parsed csv data.
 */
export async function loadCsv(filename) {
    return new Promise(resolve => {
        const url = `${BASE_URL}${filename}.csv`;

        Papa.parse(url, {
            download: true,
            header: true,
            complete: (results) => {
                resolve(parseCsv(results['data']));
            }
        })
    });
}

/**
 * Shuffles data and label using Fisher-Yates algorithm.
 */
export async function shuffle(data, label) {
    let counter = data.length;
    let temp = 0;
    let index = 0;
    while (counter > 0) {
        index = (Math.random() * counter) | 0;
        counter--;
        // data:
        temp = data[counter];
        data[counter] = data[index];
        data[index] = temp;
        // label:
        temp = label[counter];
        label[counter] = label[index];
        label[index] = temp;
    }
}

/**
 * Calculate the arithmetic mean of a vector.
 *
 * @param {Array} vector The vector represented as an Array of Numbers.
 *
 * @returns {number} The arithmetic mean.
 */
function mean(vector) {
    let sum = 0;
    for (const x of vector) {
        sum += x;
    }
    return sum / vector.length;
}

/**
 * Calculate the standard deviation of a vector.
 *
 * @param {Array} vector The vector represented as an Array of Numbers.
 *
 * @returns {number} The standard deviation.
 */
function stddev(vector) {
    let squareSum = 0;
    const vectorMean = mean(vector);
    for (const x of vector) {
        squareSum += (x - vectorMean) * (x - vectorMean);
    }
    return Math.sqrt(squareSum / (vector.length - 1));
}

/**
 * Normalize a vector by its mean and standard deviation.
 *
 * @param {Array} vector Vector to be normalized.
 * @param {number} vectorMean Mean to be used.
 * @param {number} vectorStddev Standard Deviation to be used.
 *
 * @returns {Array} Normalized vector.
 */
const normalizeVector = (vector, vectorMean, vectorStddev) => {
    return vector.map(x => (x - vectorMean) / vectorStddev);
};

/**
 * Normalizes the dataset
 *
 * @param {Array} dataset Dataset to be normalized.
 * @param {boolean} isTrainData Whether it is training data or not.
 * @param {Array} vectorMeans Mean of each column of dataset.
 * @param {Array} vectorStddevs Standard deviation of each column of dataset.
 *
 * @returns {Object} Contains normalized dataset, mean of each vector column,
 *                   standard deviation of each vector column.
 */
export function normalizeDataset(
    dataset, isTrainData = true, vectorMeans = [], vectorStddevs = []) {
    const numFeatures = dataset[0].length;
    let vectorMean;
    let vectorStddev;

    for (let i = 0; i < numFeatures; i++) {
        const vector = dataset.map(row => row[i]);

        if (isTrainData) {
            vectorMean = mean(vector);
            vectorStddev = stddev(vector);

            vectorMeans.push(vectorMean);
            vectorStddevs.push(vectorStddev);
        } else {
            vectorMean = vectorMeans[i];
            vectorStddev = vectorStddevs[i];
        }

        const vectorNormalized =
            normalizeVector(vector, vectorMean, vectorStddev);

        vectorNormalized.forEach((value, index) => {
            dataset[index][i] = value;
        });
    }

    return { dataset, vectorMeans, vectorStddevs };
}

/**
 * Binarizes a tensor based on threshold of 0.5.
 *
 * @param {tf.Tensor} y Tensor to be binarized.
 * @param {number} threshold (default: 0.5).
 * @returns {tf.Tensor} Binarized tensor.
 */
export function binarize(y, threshold) {
    if (threshold == null) {
        threshold = 0.5;
    }
    tf.util.assert(
        threshold >= 0 && threshold <= 1,
        `Expected threshold to be >=0 and <=1, but got ${threshold}`);

    return tf.tidy(() => {
        const condition = y.greater(tf.scalar(threshold));
        return tf.where(condition, tf.onesLike(y), tf.zerosLike(y));
    });
}
export function encode_name(key) {
    let str_encoded = key.replace(/\s/g, '').replace(/[^\w-]/g, '_');
    return str_encoded
}
export function calculatePrecision(classIndex, confusionMatrix) {
    let truePositive = confusionMatrix[classIndex][classIndex];
    let falsePositive = 0;

    for (let i = 0; i < confusionMatrix.length; i++) {
        if (i !== classIndex) {
            falsePositive += confusionMatrix[i][classIndex];
        }
    }

    if (truePositive === 0 && falsePositive === 0) {
        return 1;
    }

    return truePositive / (truePositive + falsePositive);
}

export function calculateRecall(classIndex, confusionMatrix) {
    let truePositive = confusionMatrix[classIndex][classIndex];
    let falseNegative = 0;
    for (let i = 0; i < confusionMatrix.length; i++) {
        falseNegative += confusionMatrix[classIndex][i];
    }
    falseNegative -= truePositive;
    if (truePositive === 0 && falseNegative === 0) {
        return 1;
    }
    return truePositive / (truePositive + falseNegative);
}


export function calculateF1Score(classIndex, confusionMatrix) {
    const precision = calculatePrecision(classIndex, confusionMatrix);
    const recall = calculateRecall(classIndex, confusionMatrix);
    return (2 * precision * recall) / (precision + recall);
}

export async function metrics(y, y_pred, labels) {
    const context = {
        y: y,
        y_pred: y_pred,
        labels: labels
    };
    const script = `
        from sklearn.metrics import precision_recall_fscore_support, classification_report, f1_score,accuracy_score
        from js import y_pred,y,labels       
        from sklearn.metrics import recall_score,precision_score

        precision = precision_score(y, y_pred, average=None,labels=labels)
        recall = recall_score(y, y_pred, average=None,labels=labels)
        f1_micro = f1_score(y, y_pred, average='micro')
        f1_macro = f1_score(y, y_pred, average='macro')
        accuracy = accuracy_score(y, y_pred)
        (precision,recall,f1_micro,f1_macro,accuracy)
    `;
    try {
        const { results, error } = await asyncRun(script, context);
        if (results) {
            return {
                precision: results[0],
                recall: results[1],
                f1_micro: results[2],
                f1_macro: results[3],
                accuracy: results[4],

            }
        } else if (error) {
            throw error
        }
    } catch (e) {
        throw ("Something went wrong", e)
    }
}
export function calculateRSquared(actual, predicted) {
    const meanActual = mean_array(actual);
    const totalSumOfSquares = actual.reduce((acc, val) => acc + Math.pow(val - meanActual, 2), 0);
    const residualSumOfSquares = actual.reduce((acc, val, index) => acc + Math.pow(val - predicted[index], 2), 0);
    return 1 - (residualSumOfSquares / totalSumOfSquares);
}
export function calculateMSE(actualValues, predictedValues) {
    if (actualValues.length !== predictedValues.length) {
        throw new Error("The lengths of actual values and predicted values must be the same.");
    }

    const n = actualValues.length;
    let sumSquaredError = 0;

    for (let i = 0; i < n; i++) {
        const squaredError = Math.pow(actualValues[i] - predictedValues[i], 2);
        sumSquaredError += squaredError;
    }

    const meanSquaredError = sumSquaredError / n;
    return meanSquaredError;
}
function mean_array(array) {
    return array.reduce((acc, val) => acc + val, 0) / array.length;
}
export function evaluate_classification(predictions, y_test, encoder) {
    console.assert(predictions.length === y_test.length, "predictions and test should have the same length.")
    let missclassification_indexes = []
    let missclassification_preds = []
    let currect_classifications_sum = 0
    y_test.forEach((element, i) => {
        if (element === predictions[i]) {
            currect_classifications_sum++
        } else {
            missclassification_indexes.push(i)
            let label = [predictions[i]]
            let result = encoder.inverseTransform(label)
            missclassification_preds.push(result[0])

        }
    });
    return {
        accuracy: Number((currect_classifications_sum / predictions.length) * 100),
        indexes: missclassification_indexes,
        mispredictions: missclassification_preds
    }
}
export function scale_data(dataset, column, normalization_type) {
    try {


        switch (normalization_type) {
            case "0":
                {
                    break;
                }
            case "1":
                {
                    let scaler = new MinMaxScaler()
                    scaler.fit(dataset[column])
                    dataset.addColumn(column, scaler.transform(dataset[column]), { inplace: true })
                    break;
                }
            case "2":
                dataset.addColumn(column, dataset[column].apply((x) => x * x), { inplace: true })
                break;
            case "3":
                dataset.addColumn(column, dataset[column].apply((x) => {
                    let ln = Math.log(x);
                    if (isNaN(ln)) {
                        throw new Error('falied at data transformation.');
                    }
                    return Math.log(x)
                }
                ), { inplace: true })
                break;
            case "4":
                {
                    let scaler = new StandardScaler()
                    scaler.fit(dataset[column])
                    dataset.addColumn(column, scaler.transform(dataset[column]), { inplace: true })
                    break;
                }
            default:
                break;
        }
    } catch (error) {
        throw new Error('falied at data transformation.')
    }
}
export function applyDataTransformation(dataset, column_names, transformations) {
    for (let i = 0; i < column_names.length; i++) {
        const column = column_names[i];
        let transformation = transformations.find(transformation => transformation.name === column)
        if (transformation) {
            scale_data(dataset, column, transformation.scaler.toString())
        }
    }
    return dataset
}
export function handle_missing_values(data_frame, impute = false) {
    // to do normalization
    if (impute) {
        let string_columns = []
        let numeric_columns = []
        let string_column_modes = []
        let numeric_column_means = []
        data_frame.columns.forEach((item) => {
            if (data_frame.column(item)?.dtype === 'string') {
                string_columns.push(item)
            } else {
                numeric_columns.push(item)
            }
        })
        string_columns.forEach(element => {
            let mode = getCategoricalMode(data_frame.column(element).values).mode
            string_column_modes.push(mode)
        });
        numeric_columns.forEach(element => {
            let mean = data_frame.column(element).mean()
            numeric_column_means.push(mean)
        });
        data_frame = data_frame.fillNa(string_column_modes, { columns: string_columns })
        data_frame = data_frame.fillNa(numeric_column_means, { columns: numeric_columns })
    } else {
        data_frame.dropNa({ axis: 1, inplace: true })
    }
    return data_frame
}
export function getCategoricalMode(arr) {
    if (arr.length === 0) {
        return null;
    }

    const categoryCount = {};
    categoryCount['total'] = 0
    categoryCount['mode'] = ''
    for (let i = 0; i < arr.length; i++) {
        const category = arr[i];
        if (category === null || category === undefined) {
            continue
        }
        categoryCount['total']++
        if (category in categoryCount) {
            categoryCount[category]++;
        } else {
            categoryCount[category] = 1;
        }
    }

    let modeCategory = null;
    let modeCount = 0;
    for (const category in categoryCount) {
        if (category === 'total') {
            continue
        }
        if (categoryCount[category] > modeCount) {
            modeCategory = category;
            modeCount = categoryCount[category];
        }
    }
    categoryCount['mode'] = modeCategory;
    return categoryCount;
}
export function encode_dataset(data_frame, columns_types) {
    let df = data_frame.copy()

    let categorical_columns = columns_types.filter(column => column.type === FeatureCategories.Nominal.id || column.type === FeatureCategories.Ordinal.id)
    let categoriclaFeaturesAfterEncoding = []
    categorical_columns.forEach((column) => {
        if (column.type === FeatureCategories.Ordinal.id) {
            let encoder = new LabelEncoder()
            encoder.fit(df[column.name])
            let encoded_column = encoder.transform(df[column.name])
            df.addColumn(column.name, encoded_column.values, { inplace: true })
            categoriclaFeaturesAfterEncoding.push(column.name)
        } else {
            df = getDummies(df, { columns: [column.name] })
            df.drop({ columns: [df.columns.find(m => m.includes(column.name + "_"))], inplace: true });
            categoriclaFeaturesAfterEncoding.push(...df.columns.filter(m => m.includes(column.name + "_")))

        }
    })
    return [df, categoriclaFeaturesAfterEncoding]
}

export function merge_classes(classes, dataframe) {
    let newClass = classes.map(m => m.class).join('_');
    classes.forEach(cls => {
        dataframe.replace(cls.class, newClass, { columns: [this.settings.modelTarget], inplace: true })
    });
    let message = { message: 'merged classes: ' + newClass, type: 'info' }
    this.$buefy.toast.open('merged classes: ' + newClass)
    this.settings.addMessage(message)
}

