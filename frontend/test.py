from scipy.cluster.hierarchy import linkage, dendrogram, leaves_list
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
from sklearn.datasets import load_iris

# Load the Iris dataset
data = load_iris()
df = pd.DataFrame(data.data, columns=data.feature_names)

# Compute the correlation matrix
corr_matrix = df.corr()
print(corr_matrix)

# Compute the distance matrix
dist_matrix = 1 - corr_matrix.abs()

# Perform hierarchical clustering
linkage_matrix = linkage(dist_matrix, method='ward')

# Get the order of features based on clustering
order = leaves_list(linkage_matrix)

# Reorder the correlation matrix
ordered_corr_matrix = corr_matrix.iloc[order, order]
print(ordered_corr_matrix)

# Plot the clustered heatmap
plt.figure(figsize=(10, 8))
sns.heatmap(ordered_corr_matrix, cmap='coolwarm',
            annot=True, fmt='.2f', square=True)
plt.title('Clustered Correlation Matrix')
plt.show()
