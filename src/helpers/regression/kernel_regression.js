import { asyncRun } from "@/helpers/py-worker";


export default class KernelRegression {
    constructor(options) {
        this.options = options;
        this.model = null;

    }
    async train_test(x_train, y_train, x_test, labels) {
        this.context = {
            X_train: x_train,
            Y_train: y_train,
            X_test: x_test,
            types: this.options.types,
            labels: labels
        };
        const script = `
        import numpy as np
        import statsmodels.api as sm
        from js import X_train,Y_train,X_test,labels,types
        from statsmodels.nonparametric.kernel_regression import KernelReg
        import pandas as pd
        import re
        from abc import ABC, abstractmethod
        
        import numpy as np
        
        
        class KernelBase(ABC):
            def __init__(self):
                super().__init__()
                self.parameters = {}
                self.hyperparameters = {}
        
            @abstractmethod
            def _kernel(self, X, Y):
                raise NotImplementedError
        
            def __call__(self, X, Y=None):
                return self._kernel(X, Y)
        
            def __str__(self):
                P, H = self.parameters, self.hyperparameters
                p_str = ", ".join(["{}={}".format(k, v) for k, v in P.items()])
                return "{}({})".format(H["id"], p_str)
        
            def summary(self):
                return {
                    "id": self.hyperparameters["id"],
                    "parameters": self.parameters,
                    "hyperparameters": self.hyperparameters,
                }
        
            def set_params(self, summary_dict):
                kr, sd = self, summary_dict
                flatten_keys = ["parameters", "hyperparameters"]
                for k in flatten_keys:
                    if k in sd:
                        entry = sd[k]
                        sd.update(entry)
                        del sd[k]
        
                for k, v in sd.items():
                    if k in self.parameters:
                        kr.parameters[k] = v
                    if k in self.hyperparameters:
                        kr.hyperparameters[k] = v
                return kr
        
        
        class LinearKernel(KernelBase):
            def __init__(self, c0=0):
                super().__init__()
                self.hyperparameters = {"id": "LinearKernel"}
                self.parameters = {"c0": c0}
        
            def _kernel(self, X, Y=None):
                X, Y = kernel_checks(X, Y)
                return X @ Y.T + self.parameters["c0"]
        
        
        class PolynomialKernel(KernelBase):
            def __init__(self, d=3, gamma=None, c0=1):
                super().__init__()
                self.hyperparameters = {"id": "PolynomialKernel"}
                self.parameters = {"d": d, "c0": c0, "gamma": gamma}
        
            def _kernel(self, X, Y=None):
                P = self.parameters
                X, Y = kernel_checks(X, Y)
                gamma = 1 / X.shape[1] if P["gamma"] is None else P["gamma"]
                return (gamma * (X @ Y.T) + P["c0"]) ** P["d"]
        
        
        class RBFKernel(KernelBase):
            def __init__(self, sigma=None):
                super().__init__()
                self.hyperparameters = {"id": "RBFKernel"}
                self.parameters = {"sigma": sigma}
        
            def _kernel(self, X, Y=None):
                P = self.parameters
                X, Y = kernel_checks(X, Y)
                sigma = np.sqrt(X.shape[1] / 2) if P["sigma"] is None else P["sigma"]
                return np.exp(-0.5 * pairwise_l2_distances(X / sigma, Y / sigma) ** 2)
        
        
        class KernelInitializer(object):
            def __init__(self, param=None):
                self.param = param
        
            def __call__(self):
                param = self.param
                if param is None:
                    kernel = LinearKernel()
                elif isinstance(param, KernelBase):
                    kernel = param
                elif isinstance(param, str):
                    kernel = self.init_from_str()
                elif isinstance(param, dict):
                    kernel = self.init_from_dict()
                return kernel
        
            def init_from_str(self):
                r = r"([a-zA-Z0-9]*)=([^,)]*)"
                kr_str = self.param.lower()
                kwargs = dict([(i, eval(j)) for (i, j) in re.findall(r, self.param)])
        
                if "linear" in kr_str:
                    kernel = LinearKernel(**kwargs)
                elif "polynomial" in kr_str:
                    kernel = PolynomialKernel(**kwargs)
                elif "rbf" in kr_str:
                    kernel = RBFKernel(**kwargs)
                else:
                    raise NotImplementedError("{}".format(kr_str))
                return kernel
        
            def init_from_dict(self):
                S = self.param
                sc = S["hyperparameters"] if "hyperparameters" in S else None
        
                if sc is None:
                    raise ValueError("Must have hyperparameters")
        
                if sc and sc["id"] == "LinearKernel":
                    scheduler = LinearKernel().set_params(S)
                elif sc and sc["id"] == "PolynomialKernel":
                    scheduler = PolynomialKernel().set_params(S)
                elif sc and sc["id"] == "RBFKernel":
                    scheduler = RBFKernel().set_params(S)
                elif sc:
                    raise NotImplementedError("{}".format(sc["id"]))
                return scheduler
        
        
        def kernel_checks(X, Y):
            X = X.reshape(-1, 1) if X.ndim == 1 else X
            Y = X if Y is None else Y
            Y = Y.reshape(-1, 1) if Y.ndim == 1 else Y
        
            assert X.ndim == 2, "X must have 2 dimensions, but got {}".format(X.ndim)
            assert Y.ndim == 2, "Y must have 2 dimensions, but got {}".format(Y.ndim)
            assert X.shape[1] == Y.shape[1], "X and Y must have the same number of columns"
            return X, Y
        
        
        def pairwise_l2_distances(X, Y):
            D = -2 * X @ Y.T + np.sum(Y ** 2, axis=1) + np.sum(X ** 2, axis=1)[:, np.newaxis]
            D[D < 0] = 0  # clip any value less than 0 (a result of numerical imprecision)
            return np.sqrt(D)
    
        df_test = pd.DataFrame(X_test,columns=labels)
        x_test = df_test.iloc[:,:]

        df_train = pd.DataFrame(X_train,columns=labels)
        x_train = df_train.iloc[:,:]

        class KernelRegression:
            def __init__(self, kernel=None):
                self.parameters = {"X": None, "y": None}
                self.hyperparameters = {"kernel": str(kernel)}
                self.kernel = KernelInitializer(kernel)()
        
            def fit(self, X, y):
                self.parameters = {"X": X, "y": y}
        
            def predict(self, X):
                K = self.kernel
                P = self.parameters
                sim = K(P["X"], X)
                return (sim * P["y"][:, None]).sum(axis=0) / sim.sum(axis=0)
        train = np.array(X_train)
        test = np.array(X_test)
        y_train= np.array(Y_train)
        print(train.shape)
        print(test.shape)
        print(y_train.ndim)

        model = KernelRegression()
        model.fit(train,y_train)
        preds = model.predict(test)
        preds
        `;
        try {
            const { results, error } = await asyncRun(script, this.context);
            if (results) {
                return results;
            } else if (error) {
                console.log("pyodideWorker error: ", error);
            }
        } catch (e) {
            console.log(
                `Error in pyodideWorker at ${e.filename}, Line: ${e.lineno}, ${e.message}`,
            );
        }

    }
    predict(x_test) {
        const result = this.model.predict(x_test);
        return result
    }
}