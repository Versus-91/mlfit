<template>
    <section class="has-text-left content">
        <h4 class="title is-medium is-5">Classification metrics
        </h4>
        <p>
            In a context of a binary classification, here are the main metrics that are important to track in order to
            assess the performance of the model.
        </p>
        <ul>
            <li>
                Confusion matrix: The confusion matrix is used to have a more complete picture when assessing the
                performance of a model. It is defined as follows:
            </li>
            <li>
                Main metrics: The following metrics are commonly used to assess the performance of classification
                models:
            </li>
            <li>
                The receiver operating curve, also noted ROC, is the plot of TPR versus FPR by varying the threshold.
                These metrics are are summed up in the table below:
            </li>
            <li>
                The area under the receiving operating curve, also noted AUC or AUROC, is the area below the ROC as
                shown in the following figure:
            </li>
        </ul>
        <h4 class="title is-medium is-5">Regression metrics
        </h4>
        <ul>
            <li>
                Basic metricsGiven a regression model <i>f</i>, the following metrics are commonly used to assess the
                performance of the model:
                <table class="table is-bordered">
                    <thead>
                        <tr>
                            <th class="is-success">Total sum of squares</th>
                            <th class="is-success">Explained sum of squares </th>
                            <th class="is-success">Residual sum of squares </th>

                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <vue-mathjax
                                    :formula="'$$ SS_{tot}= \\sum_{i=1}^{m} (y_i - \\hat{y}_i)^2$$'"></vue-mathjax>
                            </td>
                            <td> <vue-mathjax
                                    :formula="'$$ SS_{reg}= \\sum_{i=1}^{m} (f (x_i) - \\hat{y}_i)^2$$'"></vue-mathjax>
                            </td>
                            <td> <vue-mathjax
                                    :formula="'$$ SS_{res}= \\sum_{i=1}^{m} (y_i - f (x_i))^2$$'"></vue-mathjax></td>

                        </tr>
                    </tbody>
                </table>
            </li>
            <li>
                Coefficient of determination: The coefficient of determination, often noted
                <i>R</i><sup>2</sup>
                , provides a measure of how well the observed outcomes are replicated by the model and is defined as
                follows:
                <vue-mathjax :formula="'$$ R^2 = 1 - \\frac{SS_{res}}{SS_{tot}}$$'"></vue-mathjax>
            </li>
            <li>
                Main metrics: The following metrics are commonly used to assess the performance of regression models, by
                taking into account the number of variables
                n that they take into consideration:
                <table class="table is-bordered">
                    <thead>
                        <tr>
                            <th class="is-success">AIC</th>
                            <th class="is-success">BIC</th>
                            <th class="is-success">Adjusted R2 </th>

                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <vue-mathjax :formula="'$$ 2[n + 2 - \\log (L)]$$'"></vue-mathjax>
                            </td>
                            <td> <vue-mathjax :formula="'$$ \\log (m)(n + 2) - 2 \\log (L)$$'"></vue-mathjax>
                            </td>
                            <td> <vue-mathjax :formula="'$$ 1 - \\frac{(1-R^2)(m-1)}{m-n-1}$$'"></vue-mathjax></td>

                        </tr>
                    </tbody>
                </table>
            </li>
        </ul>
        <h4 class="title is-medium is-5" id="1_help">Model Selection
        </h4>
        <h5>
            When selecting a model, we distinguish 3 different parts of the data that we have as follows:
        </h5>
        <table class="table is-bordered">
            <thead>
                <tr>
                    <th class="is-success">Training set</th>
                    <th class="is-success">Validation set </th>
                    <th class="is-success">Testing set
                    </th>

                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        <ul>
                            <li> Model is trained</li>
                            <li> Usually 80% of the dataset</li>
                        </ul>
                    </td>
                    <td>
                        <ul>
                            <li>Model is assessed</li>
                            <li>Usually 20% of the dataset</li>
                            <li>Also called hold-out or development set</li>
                        </ul>
                    </td>
                    <td>
                        <ul>
                            <li> Model gives predictions</li>
                            <li>Unseen data</li>
                        </ul>
                    </td>
                </tr>
            </tbody>
        </table>
        <p> Once the model has been chosen, it is trained on the entire dataset and tested on the unseen test set.
            These
            are represented in the figure below:</p>
        <p>
            Cross-validation, also noted CV, is a method that is used to select a model that does not rely too much on
            the initial training set. The different types are summed up in the table below:
        </p>
        <table class="table is-bordered">
            <thead>
                <tr>
                    <th class="is-success">k-fold</th>
                    <th class="is-success">Leave-p-out</th>

                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        <ul>
                            <li> Model is trained</li>
                            <li> Usually 80% of the dataset</li>
                        </ul>
                    </td>
                    <td>
                        <ul>
                            <li>Model is assessed</li>
                            <li>Usually 20% of the dataset</li>
                            <li>Also called hold-out or development set</li>
                        </ul>
                    </td>
                </tr>
            </tbody>
        </table>
        <p>
            The most commonly used method is called
            k-fold cross-validation and splits the training data into
            k folds to validate the model on one fold while training the model on the k−1 other folds, all of this
            k times. The error is then averaged over the k folds and is named cross-validation error.
            <img class="image" src="/cross-validation-en.png" alt="">
        </p>
        <p>
            regularization: The regularization procedure aims at avoiding the model to overfit the data and thus deals
            with high
            variance issues. The following table sums up the different types of commonly used regularization techniques:
        </p>
        <h4 class="title is-medium is-5">Supervised Learning
        </h4>
        <ul>
            <li>Type of prediction: The different types of predictive models are summed up in the table below:

                <table class="table is-bordered">
                    <thead>
                        <tr>
                            <th class="is-success"></th>
                            <th class="is-success">Regression</th>
                            <th class="is-success">Classification</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Outcome</td>
                            <td>Continuous</td>
                            <td>Class</td>
                        </tr>
                        <tr>
                            <td>Examples</td>
                            <td>Linear regression </td>
                            <td>Logistic regression, SVM, Naive Bayes
                            </td>
                        </tr>
                    </tbody>
                </table>
            </li>
        </ul>
        <h4 class="title is-medium is-5" id="svm_help">Support Vector Machine</h4>
        <p>
            The goal of support vector machines is to find the line that maximizes the minimum distance to the line.
        </p>
        Optimal margin classifier: The optimal margin classifier (h) is such that:
        <vue-mathjax :formula="'$$ h(x) = sign(w^T x - b) $$'"></vue-mathjax>
        where (w,b \in R^2) is the solution of the following optimization problem:
        <img src="/svm-en.png" height="150px" width="70%">

        <h4 class="title is-medium is-5" id="naive_bayes_help">Naive Bayes</h4>
        <ul>
            <li>
                Assumption: The Naive Bayes model supposes that the features of each data point are all independent:
                <vue-mathjax :formula="'$$ P(x | y) = P(x_1,x_2,...|y) = P(x_1 |y )  P(x_2 |y ) $$'"></vue-mathjax>

            </li>
        </ul>
        <h4 class="title is-medium is-5" id="cart_help">Tree-based and ensemble methods</h4>
        <p> These methods can be used for both regression and classification problems.
        </p>
        <ul>
            <li>
                Classification and Regression Trees (CART), commonly known as decision trees, can be represented as
                binary
                trees. They have the advantage to be very interpretable.
            </li>
            <li>
                Random forestIt is a tree-based technique that uses a high number of decision trees built out of
                randomly
                selected
                sets of features. Contrary to the simple decision tree, it is highly uninterpretable but its generally
                good
                performance makes it a popular algorithm.
            </li>
            <li>

                BoostingThe idea of boosting methods is to combine several weak learners to form a stronger one. The
                main
                ones are
                summed up in the table below:
            </li>
            <li> Adaptive boosting Gradient boosting
                • High weights are put on errors to improve at the next boosting step
                • Known as Adaboost •
                Weak learners are trained on residuals
                • Examples include XGBoost
            </li>
        </ul>
        <h4 class="title is-medium" id="knn_help">(k)-nearest neighbors</h4>
        <p>
            (k)-nearest neighbors: The
            (k)-nearest neighbors algorithm, commonly known as
            (k)-NN, is a non-parametric approach where the response of a data point is determined by the nature of its
            (k) neighbors from the training set. It can be used in both classification and regression settings.
        </p>
        <img src="/knn.png" class="image">
    </section>









</template>

<script>
export default {
    name: 'MethodsTabComponent',
    data() {
        return {
            formula: '$$x = {-b \\pm \\sqrt{b^2-4ac} \\over 2a}.$$',
            sserror: '$$ SS_{tot}= \\sum_{i=1}^{m} (y_i - \\hat{y}_i)^2$$'
        }
    }
}
</script>
<style>
.demo-container {
    text-align: center;
}
</style>
