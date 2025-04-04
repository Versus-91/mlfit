export const FeatureCategories = {
    "Numerical": {
        id: 1,
        name: "Numerical"
    }
    , "Nominal": {
        id: 2,
        name: "Nominal"
    }
    , "Ordinal": {
        id: 3,
        name: "Ordinal"
    }
};
export const CV_OPTIONS = {
    SPLIT: 1,
    NO: 2,
    KFOLD: 3
}
export const REGRESSION = 1;
export const CLASSIFICATION = 2;


export const ScaleOptions = {
    "No": {
        id: 0,
        name: "No",
    },
    "Scale": {
        id: 1,
        name: "Scale"
    }
    , "x^2": {
        id: 2,
        name: "x^2"
    }
    , "ln(x)": {
        id: 3,
        name: "ln(x)"
    }, "Standardize": {
        id: 4,
        name: "Standardize"
    }
}
export const Settings = {
    "classification": {
        "logistic_regression": {
            "id": 1,
            "label": "Logistic Regression",
            "title": "Logi.Reg",
            "value": 1,
            "options": {
                "regularization": {
                    "label": "regulrization",
                    "type": "select",
                    default: "Lasso",
                    value: "Lasso",
                    "values": [{ label: "adaptive lasso", value: "Lasso" }, { label: "ridge", value: "ridge" }]
                }
            }
        },
        "discriminant_analysis": {
            "id": 2,
            "label": "Discriminant Analysis",
            "title": "DA",
            "value": 2,
            "options": {
                "type": {
                    "label": "type",
                    "type": "select",
                    default: "linear",
                    "values": [{ label: "linear", value: "linear" }, { label: "quadratic", value: "quadratic" }]
                },
                "priors": {
                    label: "priors",
                    type: "text",
                    placeholder: "comma separated priors"
                },
            }
        },
        "k_nearest_neighbour": {
            "id": 3,
            "label": "k nearest neighbour",
            "title": "KNN",
            "value": 3,
            "options": {
                "min": {
                    "label": "min",
                    type: "number",
                    default: 3
                },
                "max": {
                    "label": "max",
                    type: "number",
                    default: 9
                },
                "metric": {
                    label: "metrics",
                    type: "select",
                    default: "manhattan",
                    values: [{ label: "euclidean", value: "euclidean" }, { label: "manhattan", value: "manhattan" }]
                },
            },
        },
        "support_vector_machine": {
            "id": 4,
            "label": "Support vector machine",
            "title": "SVM",
            "value": 4,
            "options": {
                "kernel": {
                    label: 'kernel',
                    type: "select",
                    default: "rbf",
                    values: [{ label: "RBF", value: "rbf" }, { label: "Linear", value: "linear" }, { label: "Polynomial", value: "poly" }
                        , { label: "Sigmoid", value: "sigmoid" }]
                },

                "bias": {
                    "label": "bias",
                    type: "number",
                    for: ["Sigmoid", "Sigmoid"],
                    default: 0
                },
                "c": {
                    "label": "Regularization parameter",
                    type: "number",
                    default: 1
                },
                "degree": {
                    label: 'degree',
                    type: "number",
                    for: ["Polynomial"],
                    default: 3
                },
            },
        },
        "random_forest": {
            "id": 5,
            "label": "Random forest",
            "title": "RF",
            "value": 5,
            "options": {
                "estimators": {
                    label: "estimators",
                    type: "number",
                    default: 100
                },
                "features": {
                    label: "features",
                    type: "number",
                    default: "sqrt"
                },
                "depth": {
                    label: "depth",
                    type: "number",
                    default: 5
                },
                "criteria": {
                    label: "criteria",
                    type: "select",
                    default: "gini",
                    "values": [{ label: "gini", value: "gini" }, { label: "log loss", value: "log_loss" },
                    { label: "entropy", value: "entropy" }]
                }
            },
        },
        "boosting": {
            "id": 6,
            "label": "Boosting",
            "title": "Boosting",
            "value": 6,
            "options": {
                "booster": {
                    type: "select",
                    label: "booster",
                    default: "gbtree",
                    values: [{ label: "gbtree", value: "gbtree" }, { label: "gblinear", value: "gblinear" }, { label: "dart", value: "dart" }]
                },
                "eta": {
                    label: "learning rate",
                    type: "number",
                    default: 0.3
                },
                "estimators": {
                    label: "estimators",
                    type: "number",
                    default: 200
                },
                "depth": {
                    label: "depth",
                    type: "number",
                    default: 5
                },

            },
        },
        "naive_bayes": {
            "label": "Naive Bayes",
            "title": "NB",
            "value": 7,
            "id": 7,
            "options": {
                "laplace": {
                    label: "laplace smoothing",
                    type: "number",
                    default: 0.05
                },
                "priors": {
                    label: "priors",
                    type: "text",
                    placeholder: "comma separated priors"
                },
                "type": {
                    label: "type",
                    type: "select",
                    default: "Gaussian",
                    values: [{ label: "Gaussian", value: "Gaussian" }, { label: "Multinomial", value: "Multinomial" }, { label: "Bernoulli", value: "Bernoulli" }]
                }
            }

        },
    },
    "regression": {
        "linear_regression": {
            "label": "Linear Regression",
            "title": "Lin.Reg",
            "value": 9,
            "id": 9,
            "feature_selection": ["no", "Lasso", "ridge"],
            "criteria": ["AIC", "BIC", "AR2",],
            "options": {
                "regularization": {
                    label: "regularization",
                    type: "select",
                    default: "Lasso",
                    values: [{ label: "adaptive lasso", value: "Lasso" }, { label: "Ridge", value: "Ridge" }]
                }
            }
        },
        "polynomial_regression": {
            "label": "Polynomial Regression",
            "title": "Poly.Reg",
            "value": 14,
            "id": 14,
            "feature_selection": ["no", "Lasso", "ridge"],
            "criteria": ["AIC", "BIC", "AR2",],
            "options": {
                "regularization": {
                    label: "regularization",
                    type: "select",
                    default: "Lasso",
                    values: [{ label: "Lasso", value: "Lasso" }, { label: "Ridge", value: "Ridge" }]
                },
                "degree": {
                    label: "Degree",
                    type: "number",
                    default: 2,
                }
            }
        },
        "k_nearest_neighbour": {
            "label": "k nearest neighbour Regression",
            "title": "KNN",
            "value": 10,
            "id": 10,
            "options": {
                "min": {
                    label: "min",
                    type: "number",
                    default: 3
                },
                "max": {
                    label: "max",
                    type: "number",
                    default: 9
                },
            },
        },
        "boosting": {
            "label": "Boosting Regression",
            "title": "Boosting",
            "value": 11,
            "id": 11,
            "options": {
                "booster": {
                    label: "booster",
                    type: "select",
                    default: "gbtree",
                    values: [{ label: "gbtree", value: "gbtree" }, { label: "gblinear", value: "gblinear" }, { label: "dart", value: "dart" }]
                },
                "eta": {
                    label: "learning rate",
                    type: "number",
                    default: 0.3
                },
                "estimators": {
                    label: "estimators",
                    type: "number",
                    default: 200
                },
                "depth": {
                    label: "depth",
                    type: "number",
                    default: 5
                },

            },
        },
        "support_vector_machine": {
            "label": "Support vector machine Regression",
            "title": "SVM.Reg",
            "value": 12,
            "id": 12,
            "options": {
                "kernel": {
                    label: "kernel",
                    type: "select",
                    default: "rbf",
                    values: [{ label: "RBF", value: "rbf" }, { label: "Linear", value: "linear" }, { label: "Polynomial", value: "poly" }
                        , { label: "Sigmoid", value: "sigmoid" }]
                },
                "gamma": {
                    label: "gamma",
                    type: "number",
                    for: ["RBF", "Sigmoid", "Polynomial"],
                    default: 1
                },
                "bias": {
                    label: "bias",
                    type: "number",
                    for: ["Sigmoid", "Sigmoid"],
                    default: 0
                },
                "degree": {
                    label: "degree polynomial",
                    type: "number",
                    for: ["Polynomial"],
                    default: 3
                },
            },
        },
        "random_forest": {
            "label": "Random forest Regression",
            "title": "RF.Reg",
            "value": 13,
            "id": 13,
            "options": {
                "estimators": {
                    label: "num of estimators",
                    type: "number",
                    default: 100
                },
                "features": {
                    label: "features length",
                    type: "number",
                    default: "sqrt"
                },
                "depth": {
                    label: "depth",
                    type: "number",
                    default: 5
                },
                "criteria": {
                    type: "select",
                    label: "criteria",
                    default: "squared_error",
                    "values": [{ label: "squared_error", value: "squared_error" }, { label: "absolute_error", value: "absolute_error" },
                    { label: "friedman_mse", value: "friedman_mse" }, { label: "poisson", value: "poisson" }]
                }
            },
        },
        "kernel_regression": {
            "label": "Kernel Regression",
            "title": "Ker.Reg",
            "value": 15,
            "id": 15,
            "options": {
                "estimators": {
                    type: "number",
                    default: 100
                },
            },
        },
        "bspline_regression": {
            "label": "Bspline Regression",
            "title": "Bspl.Reg",
            "value": 16,
            "id": 16,

            "options": {
                "knots": {
                    label: "knots",
                    type: "number",
                    default: 5
                },
                "degree": {
                    label: "degree",
                    type: "number",
                    default: 3
                },
            },
        },
    },
};