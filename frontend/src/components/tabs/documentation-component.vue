<template>
    <section class="has-text-left content">
        <h4 class="title is-medium is-5" id="help">Classification metrics
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
        <h4 class="title is-medium" id="linear_regression_help">Linear Regression</h4>
        <p>
            Linear regression is a statistical method used to predict a continuous numeric value based on one or more
            input features. It assumes a linear relationship between the inputs (independent variables) and the output
            (dependent variable). The model fits a straight line through the data by minimizing the difference between
            predicted and actual values, often using a method called least squares. The equation of a linear regression
            model looks like:
            <vue-mathjax
                :formula="'$$ y = \\beta_0 x_0+  \\beta_1 x_1 + \\beta_2 x_2+ ...+\\beta_n x_n+ intercept $$'"></vue-mathjax>

            Here, y is the predicted value,(x_i)
            are the input features, and(β_i)
            are the learned coefficients. Linear regression is commonly used in scenarios like predicting house prices,
            exam scores, or sales revenue. It is evaluated using metrics such as Mean Squared Error (MSE) and R² score,
            and assumes things like normally distributed errors and consistent variance across predictions.
        </p>
        <h4 class="title is-medium" id="logistic_regression_help">Logistic Regression</h4>
        <p>
            Logistic Regression is used when the output is categorical, especially for binary classification (e.g.,
            yes/no, 0/1). Instead of predicting a continuous value, it predicts the probability that an input belongs to
            a certain class. To do this, it uses the sigmoid function, which squashes any real number output into a
            range between 0 and 1:
            <vue-mathjax :formula="'$$ y= \\frac{1}{1 + e^{-z}} $$'"></vue-mathjax>
            where
            z is the linear combination of inputs (same as in linear regression). If the resulting probability is
            greater than 0.5, the output is classified as 1; otherwise, it's classified as 0.
            If the probability is above a certain threshold (usually 0.5), the model classifies the input as one class;
            otherwise, it classifies it as the other. The output of the model represents the log-odds of the outcome,
            and logistic regression is evaluated using classification metrics like accuracy, precision, recall, F1
            score, and ROC-AUC. Though it shares structural similarity with linear regression, its purpose and behavior
            are quite different.
        </p>
        <h4 class="title is-medium" id="polynomial_regression_help">Polynomial Regression</h4>
        <p>
            Polynomial regression is an extension of linear regression that models the relationship between the input
            variable
            𝑥
            x and the output variable
            𝑦
            y as an nth-degree polynomial. While linear regression fits a straight line, polynomial regression fits a
            curved line, which allows it to capture more complex, non-linear patterns in the data. The general form of
            the equation is:
            <vue-mathjax :formula="'$$ y = \\beta_0 +  \\beta_1 x + \\beta_2 x^2+ ...+\\beta_n x^n $$'"></vue-mathjax>
            Here, the model includes powers of the input variable (like
            𝑥^2, 𝑥^3, etc.) as additional features. For example, a second-degree polynomial (quadratic regression) can
            model
            U-shaped or inverted U-shaped curves. Polynomial regression is still considered a linear model in terms of
            the coefficients, but it allows for non-linear relationships between x and y. It can be very effective for
            modeling curved trends, but if the degree of the polynomial is too high, it
            can lead to overfitting, where the model fits the training data too closely and performs poorly on new data.
        </p>

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


        <h4 class="title is-medium" id="discriminant_analysis_help"> Gaussian Discriminant Anallysis </h4>
        <p>
            Gaussian Discriminant Analysis
            SettingThe Gaussian Discriminant Analysis assumes that
            (y) and (x ∣ y = 0) and (x|y = 1) are such that:
            <vue-mathjax
                :formula="'$$ y \\sim Bernoulli(\\phi)   ,   x|y = 0 \\sim \\mathcal{N(\\mu_0,\\Sigma)}$$'"></vue-mathjax>

        </p>
        <h4>Partial Dependence Plot</h4>
        <p>
            The partial dependence plot (short PDP or PD plot) shows the marginal effect one or two features have on the
            predicted outcome of a machine learning model. A partial dependence plot can show
            whether the relationship between the target and a feature is linear, monotonic or more complex. For example,
            when applied to a linear regression model, partial dependence plots always show a linear relationship.

            The partial dependence function for regression is defined as:
            <vue-mathjax :formula="'$$ f_s(x_s) = \\int{f(x_s,x_c)dP(x_c)}$$'"></vue-mathjax>
            The x<sub>s</sub>
            are the features for which the partial dependence function should be plotted and
            X<sub>c</sub>
            are the other features used in the machine learning model
            ^
            f
            , which are here treated as random variables. Usually, there are only one or two features in the set S. The
            feature(s) in S are those for which we want to know the effect on the prediction. The feature vectors
            X<sub>s</sub>
            and
            X<sub>c</sub>
            combined make up the total feature space x. Partial dependence works by marginalizing the machine learning
            model output over the distribution of the features in set C, so that the function shows the relationship
            between the features in set S we are interested in and the predicted outcome. By marginalizing over the
            other features, we get a function that depends only on features in S, interactions with other features
            included.

            The partial function
            ^
            f
            S
            is estimated by calculating averages in the training data, also known as Monte Carlo method:

            <vue-mathjax :formula="'$$ f_s(x_s) = \\frac{1}{n} \\sum_{n = 1}^{n} f(x_s,x_c)$$'"></vue-mathjax>

            The partial function tells us for given value(s) of features S what the average marginal effect on the
            prediction is. In this formula,
            x
            (
            i
            )
            C
            are actual feature values from the dataset for the features in which we are not interested, and n is the
            number of instances in the dataset. An assumption of the PDP is that the features in C are not correlated
            with the features in S. If this assumption is violated, the averages calculated for the partial dependence
            plot will include data points that are very unlikely or even impossible (see disadvantages).

            For classification where the machine learning model outputs probabilities, the partial dependence plot
            displays the probability for a certain class given different values for feature(s) in S. An easy way to deal
            with multiple classes is to draw one line or plot per class.

            The partial dependence plot is a global method: The method considers all instances and gives a statement
            about the global relationship of a feature with the predicted outcome.
        </p>
        <h4>Categorical features</h4>
        <p>
            So far, we have only considered numerical features. For categorical features, the partial dependence is very
            easy to calculate. For each of the categories, we get a PDP estimate by forcing all data instances to have
            the same category. For example, if we look at the bike rental dataset and are interested in the partial
            dependence plot for the season, we get four numbers, one for each season. To compute the value for “summer”,
            we replace the season of all data instances with “summer” and average the predictions.
        </p>
        <h4>Permutation Feature Importance</h4>
        <p>
            Permutation feature importance is a powerful and intuitive method used to evaluate the impact of each
            feature on a machine learning model’s performance. After a model has been trained, this technique works by
            randomly shuffling the values of one feature at a time in the validation or test dataset. By doing so, the
            relationship between that feature and the target variable is disrupted, while all other features remain
            unchanged. The model is then used to make predictions on this altered dataset, and the drop in performance
            (measured by accuracy, F1 score, RMSE, or any other metric) is recorded. A large drop indicates that the
            feature was important to the model’s predictions, while a small or no change suggests that the feature had
            little influence. This method is model-agnostic, meaning it can be used with any type of machine learning
            algorithm, from decision trees to neural networks. However, one limitation is that it can be misleading when
            features are highly correlated, as the importance may be shared among multiple features, making individual
            effects harder to isolate.
        </p>
    </section>

</template>

<script>
export default {
    name: 'DocumentationComponent',
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
