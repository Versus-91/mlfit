import textwrap


class CommandWriter():
    def __init__(self):
        pass

    def get_command(request, parameters):
        code = f"""
        import pandas as pd
        from sklearn.discriminant_analysis import QuadraticDiscriminantAnalysis
        from sklearn.discriminant_analysis import LinearDiscriminantAnalysis
        from sklearn.inspection import PartialDependenceDisplay
        from sklearn.model_selection import train_test_split
        from sklearn.inspection import permutation_importance
        from sklearn.metrics import roc_auc_score
        from sklearn.metrics import roc_curve
        from sklearn.preprocessing import LabelBinarizer
        from sklearn.preprocessing import LabelEncoder
        import json

        data = pd.read_csv("main.csv")
        data.dropna(inplace=True)
        X_train, X_test, y_train, y_test = train_test_split(data.loc[:, data.columns != "{parameters.get("target")}"], data.loc[:, data.columns == "{parameters.get("target")}"], test_size=0.30, random_state={parameters.get("seed")})
        lda_type= {parameters.get("lda_type")}
        priors= {parameters.get("priors")}
        features= X_train.columns.values
        explain= {parameters.get("explain")}
        num_classes = len(set(y_train))
        features_importance = []
        partial_dependence_plot_grids = []
        partial_dependence_plot_avgs = []
        if priors is not None and priors.strip():
            priors = [float(x) for x in priors.split(',')]
        else:
            priors = None
        print("priors", priors)
        if lda_type == 0:
            model = LinearDiscriminantAnalysis(priors=priors)
        else:
            model = QuadraticDiscriminantAnalysis(priors=priors)
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        probas = model.predict_proba(X_test)
        tprs = []
        fprs = []
        aucs = []
        label_binrize = LabelBinarizer().fit(y_train)
        y_test_one_hot = label_binrize.transform(y_test)

        try:
            fpr, tpr, _ = roc_curve(y_test, probas[:, 1])
            auc = roc_auc_score(y_test, probas[:, 1])
            aucs.append(auc)
            fprs.append(fpr.tolist())
            tprs.append(tpr.tolist())

        except Exception as e:
            auc = roc_auc_score(y_test, probas, multi_class='ovr')
            aucs.append(auc)
            for i in range(num_classes):
                fpr, tpr, _ = roc_curve(y_test_one_hot[:, i], probas[:, i])
                fprs.append(fpr.tolist())
                tprs.append(tpr.tolist())

        if explain:
            pdp = PartialDependenceDisplay.from_estimator(
                model, X_train, features, target=0, method='brute')
            fi = permutation_importance(model, X_test, y_test, n_repeats=10)
            partial_dependence_plot_avgs = list(
                map(lambda item: item['average'].tolist(), pdp.pd_results))
            grids = list(map(lambda item: item['grid_values'], pdp.pd_results))
            features_importance = list(fi.importances.tolist())
            partial_dependence_plot_grids = [
                item[0].tolist() for item in grids]
        content = json.dumps({{"predictions": y_pred.tolist(
        ), "pdp_avgs": partial_dependence_plot_avgs,"fprs":fprs,"tprs":tprs,"probas":probas.tolist(), "pdp_grid": partial_dependence_plot_grids,"pfi":features_importance}})
        with open('res.json', 'w') as f:
            f.write(content)
        """
        return textwrap.dedent(code)
