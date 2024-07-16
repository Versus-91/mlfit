import { Settings } from "@/helpers/settings";
import LogisticRegression from "./classification/logistic_regression";
import LinearRegression from "./regression/linear_regression";
import BSplineRegression from "./regression/bspline_regression";
import SupportVectorMachine from './classification/svm';
import KNNModel from './classification/knn';
import KNNRegressor from './regression/knn_regressor';
import RandomForest from "./classification/random_forest";
import RandomForestRegressor from "./regression/random_forest";
import NaiveBayes from "./classification/NaiveBayes";
import DiscriminantAnalysis from "./classification/lda";
import PolynomialRegression from "./regression/polynomial_regression";
import KernelRegression from "./regression/kernel_regression";
import Boosting from "./classification/boosting";


export var ModelFactory = function () {
    this.createModel = (modelName, options) => {
        console.log(options);
        var model;
        if (modelName === Settings.classification.logistic_regression.value) {
            model = new LogisticRegression(options);
        } else if (modelName === Settings.classification.k_nearest_neighbour.value) {
            model = new KNNModel(options);
        } else if (modelName === Settings.classification.random_forest.value) {
            model = new RandomForest(options);
        } else if (modelName === Settings.classification.support_vector_machine.value) {
            model = new SupportVectorMachine(options);
        }
        else if (modelName === Settings.classification.boosting.value) {
            model = new Boosting(options);
        }
        else if (modelName === Settings.classification.discriminant_analysis.value) {
            model = new DiscriminantAnalysis(options);
        } else if (modelName === Settings.regression.linear_regression.value) {
            model = new LinearRegression(options);
        } else if (modelName === Settings.classification.naive_bayes.value) {
            model = new NaiveBayes(options);
        }
        else if (modelName === Settings.regression.k_nearest_neighbour.value) {
            model = new KNNRegressor(options);
        } else if (modelName === Settings.regression.support_vector_machine.value) {
            model = new SupportVectorMachine(options);
        }
        // else if (modelName === Settings.regression.boosting.value) {
        //     model = new BoostingRegression(options,chartControler);
        // } 
        else if (modelName === Settings.regression.random_forest.value) {
            model = new RandomForestRegressor(options);
        }
        else if (modelName === Settings.regression.polynomial_regression.value) {
            model = new PolynomialRegression(options);
        } else if (modelName === Settings.regression.kernel_regression.value) {
            model = new KernelRegression(options);
        }
        else if (modelName === Settings.regression.bspline_regression.value) {
            model = new BSplineRegression(options);
        } else {
            throw "model not supported.";
        }
        return model;
    }
}