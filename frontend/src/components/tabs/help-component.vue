<template>
    <div class="content has-text-left">
        <h4>1. Dataset Selection</h4>
        <p>
            To begin, you can either select a sample dataset provided by the system or upload your own
            dataset. The supported file formats for datasets include .xlsx (Excel files), .csv (Comma
            Separated Values files), and .txt (plain text files). Ensure that your file is in one of
            these formats to avoid any issues during the upload process.
        </p>
        <figure>
            <img src="/upload.png" alt="upload_help" />
            <figcaption>Figure 1: Dataset Selection</figcaption>
        </figure>
        <h4>2. Data Analysis</h4>
        <figure>
            <img src="/stats_categorical.jpg" alt="categorical features" />
            <figcaption>Figure 2: Categorical features stats</figcaption>
        </figure>
        <p>
            After uploading the dataset an overview of the dataset would be shhown in the Data Analysis
            tab. In the first
            window we provide you witth statistical metrics of the dataset. for canotinious features we
            show the mean, std, min, max, and etc.

            In case of categorical features information such as shape, mode and percentages of smaples
            with modes option, and number of missing values.
        </p>

        <figure>
            <img src="/stats_continious.jpg" />
            <figcaption>Figure 3: Categorical features stats</figcaption>
        </figure>
        <p>
            In case of categorical features information such as shape, mode and percentages of smaples
            with modes option, and number of missing values.
        </p>
        <h4>3. Feature selection</h4>
        <p>
            After uploading the dataset, you can customize the data by selecting specific features based
            on your requirements. To do this, click on the 'Select Features' button, which will open a
            new menu. This menu allows you to choose the features that will be used in the training
            process. If there is an issue with the automatic detection of feature data types, you can
            manually adjust the data types to ensure they are correctly categorized as ordinal,
            categorical, or continuous.
        </p>
        <h4>3. Model Selection</h4>
        <figure>
            <img src="/model_selection.jpg" alt="model selection" />
            <figcaption>Figure 4: Model selection and setting for knn</figcaption>
        </figure>
        <p>
            Once you have selected all the required features and resolved any issues with feature data
            types, you can proceed to the model selection step. Use the 'Model' dropdown to
            choose the model for training. The options in this dropdown will be dynamically populated
            based on the type of data in your features: regression models will be available for
            continuous data, while classification models will be shown for categorical data.
            Additionally, you can further customize the selected model by clicking the gear icon, which
            allows you to adjust common settings and parameters specific to each model.
        </p>
    </div>
</template>
<script>



</script>