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
import BoostingRegression from "./regression/boosting";



export var ModelFactory = function () {
    this.createModel = (modelName, options) => {
        console.log(options);
        switch (modelName) {
            case Settings.classification.logistic_regression.value:
                return new LogisticRegression(options);
            case Settings.classification.k_nearest_neighbour.value:
                return new KNNModel(options);
            case Settings.classification.random_forest.value:
                return new RandomForest(options);
            case Settings.classification.support_vector_machine.value:
                return new SupportVectorMachine(options);
            case Settings.classification.boosting.value:
                return new Boosting(options);
            case Settings.regression.boosting.value:
                return new BoostingRegression(options);
            case Settings.classification.discriminant_analysis.value:
                return new DiscriminantAnalysis(options);
            case Settings.classification.naive_bayes.value:
                return new NaiveBayes(options);
            case Settings.regression.linear_regression.value:
                return new LinearRegression(options);
            case Settings.regression.k_nearest_neighbour.value:
                return new KNNRegressor(options);
            case Settings.regression.support_vector_machine.value:
                return new SupportVectorMachine(options);
            case Settings.regression.random_forest.value:
                return new RandomForestRegressor(options);
            case Settings.regression.polynomial_regression.value:
                return new PolynomialRegression(options);
            case Settings.regression.kernel_regression.value:
                return new KernelRegression(options);
            case Settings.regression.bspline_regression.value:
                return new BSplineRegression(options);
            default:
                throw new Error("Model not supported.");
        }
    }
}