
import ChartController from '@/helpers/charts';
import { tensorflow } from '@/utils/danfo_loader';
import UI from '@/helpers/ui';
import { metrics } from './utils.js';

export class ClassificationModel {

    constructor() {
        this.chartController = new ChartController();
        this.ui = new UI(null, null)
        this.task = null;
        this.predictions = [];
        this.hasProbability = false;
        this.plots = [];
        this.tables = [];
        this.seed = 1;
        this.hasExplaination = true;
        this.id = null;
        this.helpSectionId = 'help';

    }
    async train(x, y, x_test, y_test) {
        throw new Error('Not implemented', x, y, x_test, y_test)
    }
    async evaluateModel(y, predictions, uniqueClasses) {
        return await metrics(y, predictions, uniqueClasses);
    }
    generatePythonCode(model_import, model_fit) {
        return `
from sklearn.datasets import load_iris
${model_import}
from sklearn.inspection import partial_dependence, PartialDependenceDisplay, permutation_importance
from sklearn.model_selection import train_test_split
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay
from sklearn.decomposition import PCA
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

# Load the Iris dataset
iris = load_iris()
X, y = iris.data, iris.target
feature_names = iris.feature_names
class_names = iris.target_names

# Split the data into train and test sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Fit the model
${model_fit}
model.fit(X_train,y_train)
# Confusion Matrix
y_pred = model.predict(X_test)
conf_matrix = confusion_matrix(y_test, y_pred, labels=np.unique(y))
disp = ConfusionMatrixDisplay(confusion_matrix=conf_matrix, display_labels=class_names)
disp.plot(cmap=plt.cm.Blues, values_format="d")
plt.title("Confusion Matrix")
plt.show()

# PCA of Results
pca = PCA(n_components=2)
X_test_pca = pca.fit_transform(X_test)

# Plot PCA results with true labels and predicted labels
plt.figure(figsize=(12, 6))

# Subplot 1: PCA with True Labels
plt.subplot(1, 2, 1)
scatter = plt.scatter(X_test_pca[:, 0], X_test_pca[:, 1], c=y_test, cmap='viridis', s=50)
plt.colorbar(scatter, ticks=np.arange(len(class_names)), label="True Labels")
plt.title("PCA of Test Set (True Labels)")
plt.xlabel("Principal Component 1")
plt.ylabel("Principal Component 2")


plt.tight_layout()
plt.show()
# Compute and plot Partial Dependence Plot (PDP)
fig, ax = plt.subplots(figsize=(12, 8))
PartialDependenceDisplay.from_estimator(
    model, X_train, [0, 1,2,3], feature_names=feature_names, ax=ax,target=0
)
plt.show()

# Compute and plot Permutation Feature Importance (PFI)
pfi = permutation_importance(model, X_test, y_test, n_repeats=10, random_state=42)
# Convert PFI results to a DataFrame for easier manipulation
pfi_df = pd.DataFrame({
    "Feature": np.repeat(feature_names, repeats=pfi.importances.shape[1]),
    "Importance": pfi.importances.ravel()
})

# Create boxplots for Permutation Feature Importance
plt.figure(figsize=(10, 6))
pfi_df.boxplot(by="Feature", column="Importance", grid=False, vert=False, showmeans=False)
plt.xlabel("Permutation Importance")
plt.ylabel("Feature")
plt.title("Permutation Feature Importance (PFI)")
plt.suptitle("")  # Remove automatic suptitle from boxplot
plt.show()
        `.trim()
    }
    async visualize(x_test, y_test, uniqueLabels, predictions, encoder) {
        // const evaluation_result = evaluate_classification(predictions, y_test, encoder);
        const classes = Object.keys(encoder.$labels);

        await this.chartController.plotConfusionMatrix(tensorflow.tensor(predictions), tensorflow.tensor(y_test), classes, Object.values(encoder.$labels), this.id);
        // await this.chartController.classificationPCA(x_test.values, encoder.inverseTransform(y_test), evaluation_result, uniqueLabels, this.id, 2);
        this.ui.predictions_table(x_test, encoder.inverseTransform(y_test), encoder.inverseTransform(predictions), null, this.id);
        // this.plots.push('pca_results_' + this.id);
        this.tables.push('#predictions_table_' + this.id);

    }
}