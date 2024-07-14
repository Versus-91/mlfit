import { RandomForestClassifier as RFClassifier } from 'ml-random-forest';


onmessage = (event) => {
    try {
        let model = new RFClassifier(event.data.options);
        model.train(event.data.x, event.data.y);
        let preds = model.predict(event.data.x_test);
        self.postMessage({ success: true, preds: preds });
    } catch (error) {
        self.postMessage({ success: false, error: error.message });
    }
}