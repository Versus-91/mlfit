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
            "value": 1,
            "options": {
                "regularization": {
                    "label": "regulrization",
                    "type": "select",
                    default: "no",
                    "values": [{ label: "No", value: "No" }, { label: "lasso", value: "lasso" }, { label: "ridge", value: "ridge" }]
                }
            }
        },
        "discriminant_analysis": {
            "id": 2,
            "label": "Discriminant Analysis",
            "value": 2,
            "options": {
                "type": {
                    "label": "type",
                    "type": "select",
                    default: "linear",
                    "values": [{ label: "linear", value: "linear" }, { label: "quadratic", value: "quadratic" }]
                },
                "priors": {
                    type: "text",
                    placeholder: "comma separated priors"
                },
            }
        },
        "k_nearest_neighbour": {
            "id": 3,
            "label": "k nearest neighbour",
            "value": 3,
            "options": {
                "min": {
                    type: "number",
                    default: 3
                },
                "max": {
                    type: "number",
                    default: 9
                },
                "metric": {
                    type: "select",
                    default: "manhattan",
                    values: [{ label: "euclidean", value: "euclidean" }, { label: "manhattan", value: "manhattan" }]
                },
            },
        },
        "support_vector_machine": {
            "id": 4,
            "label": "Support vector machine",
            "value": 4,
            "options": {
                "kernel": {
                    type: "select",
                    default: "RBF",
                    values: [{ label: "RBF", value: "RBF" }, { label: "Linear", value: "Linear" }, { label: "Polynomial", value: "Polynomial" }
                        , { label: "Sigmoid", value: "Sigmoid" }]
                },
                "gamma": {
                    type: "number",
                    for: ["RBF", "Sigmoid", "Polynomial"],
                    default: 1
                },
                "bias": {
                    type: "number",
                    for: ["Sigmoid", "Sigmoid"],
                    default: 0
                },
                "degree": {
                    type: "number",
                    for: ["Polynomial"],
                    default: 3
                },
            },
        },
        "random_forest": {
            "id": 5,
            "label": "Random forest",
            "value": 5,
            "options": {
                "estimators": {
                    type: "number",
                    default: 100
                },
                "features": {
                    type: "number",
                    default: "sqrt"
                },
                "depth": {
                    type: "number",
                    default: 5
                },
                "criteria": {
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
            "value": 6,
            "options": {
                "booster": {
                    type: "select",
                    default: "gbtree",
                    values: [{ label: "gbtree", value: "gbtree" }, { label: "gblinear", value: "gblinear" }, { label: "dart", value: "dart" }]
                },
                "eta": {
                    type: "number",
                    default: 0.3
                },
                "iterations": {
                    type: "number",
                    default: 200
                },
                "depth": {
                    type: "number",
                    default: 5
                },

            },
        },
        "naive_bayes": {
            "label": "Naive Bayes",
            "value": 7,
            "options": {
                "laplace": {
                    type: "number",
                    default: 0.05
                },
                "priors": {
                    type: "text",
                    placeholder: "comma separated priors"
                },
                "type": {
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
            "value": 9,
            "feature_selection": ["no", "Lasso", "ridge"],
            "criteria": ["AIC", "BIC", "AR2",],
            "options": {
                "regularization": {
                    type: "select",
                    default: "Lasso",
                    values: [{ label: "Lasso", value: "Lasso" }, { label: "Ridge", value: "Ridge" }]
                }
            }
        },
        "polynomial_regression": {
            "label": "Polynomial Regression",
            "value": 14,
            "feature_selection": ["no", "Lasso", "ridge"],
            "criteria": ["AIC", "BIC", "AR2",],
            "options": {
                "alpha": {
                    type: "number",
                    default: 0.0
                },
                "l1": {
                    type: "number",
                    default: 0.0
                },
                "degree": {
                    type: "number",
                    default: 2
                },
            }
        },
        "k_nearest_neighbour": {
            "label": "k nearest neighbour Regression",
            "value": 10,
            "options": {
                "min": {
                    type: "number",
                    default: 3
                },
                "max": {
                    type: "number",
                    default: 9
                },
            },
        },
        "boosting": {
            "label": "Boosting Regression",
            "value": 11,
            "options": {
                "booster": {
                    type: "select",
                    default: "gbtree",
                    values: [{ label: "gbtree", value: "gbtree" }, { label: "gblinear", value: "gblinear" }, { label: "dart", value: "dart" }]
                },
                "eta": {
                    type: "number",
                    default: 0.3
                },
                "iterations": {
                    type: "number",
                    default: 200
                },
                "depth": {
                    type: "number",
                    default: 5
                },

            },
        },
        "support_vector_machine": {
            "label": "Support vector machine Regression",
            "value": 12,
            "options": {
                "kernel": {
                    type: "select",
                    default: "RBF",
                    values: [{ label: "RBF", value: "RBF" }, { label: "Linear", value: "Linear" }, { label: "Polynomial", value: "Polynomial" }
                        , { label: "Sigmoid", value: "Sigmoid" }]
                },
                "gamma": {
                    type: "number",
                    for: ["RBF", "Sigmoid", "Polynomial"],
                    default: 1
                },
                "bias": {
                    type: "number",
                    for: ["Sigmoid", "Sigmoid"],
                    default: 0
                },
                "degree": {
                    type: "number",
                    for: ["Polynomial"],
                    default: 3
                },
            },
        },
        "random_forest": {
            "label": "Random forest Regression",
            "value": 13,
            "options": {
                "estimators": {
                    type: "number",
                    default: 100
                },
                "features": {
                    type: "number",
                    default: "sqrt"
                },
                "depth": {
                    type: "number",
                    default: 5
                },
                "criteria": {
                    type: "select",
                    default: "squared_error",
                    "values": [{ label: "squared_error", value: "squared_error" }, { label: "absolute_error", value: "absolute_error" },
                    { label: "friedman_mse", value: "friedman_mse" }, { label: "poisson", value: "poisson" }]
                }
            },
        },
        "kernel_regression": {
            "label": "Kernel Regression",
            "value": 15,
            "options": {
                "estimators": {
                    type: "number",
                    default: 100
                },
            },
        },
        "bspline_regression": {
            "label": "Bspline Regression",
            "value": 16,
            "options": {
                "knots": {
                    type: "number",
                    default: 5
                },
                "degree": {
                    type: "number",
                    default: 3
                },
            },
        },
    },
};