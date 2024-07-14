import SVM from "libsvm-js/asm";
export default class SupportVectorMachine {
    constructor(options) {
        this.model = new SVM(options);
    }
    train(x_train, y_train) {

        return new Promise((resolve, reject) => {
            try {
                setTimeout(async () => {
                    this.model.train(x_train, y_train);
                    resolve()
                }, 1000)
            } catch (error) {
                reject(error)
            }
        })
    }
    predict(x_test) {
        const result = this.model.predict(x_test);
        // console.log(this.model.serializeModel());
        this.model.free();
        return result
    }
}