import SVM from "libsvm-js/asm";
import { RegressionModel } from "../regression_model";
export default class SupportVectorMachineRegression extends RegressionModel {
    constructor(opt) {
        super();
        let options = {
            kernel: SVM.KERNEL_TYPES[opt.kernel.value.toUpperCase()],
            type: SVM.SVM_TYPES.C_SVC,
            coef0: opt.bias.value,
            gamma: opt.gamma.value,
            degree: opt.degree.value,
            quiet: true
        }
        this.model = new SVM(options);
    }
    train(x_train, y_train, x_test) {

        return new Promise((resolve, reject) => {
            try {
                setTimeout(async () => {
                    this.model.train(x_train, y_train);
                    const result = this.model.predict(x_test);
                    this.model.free();
                    resolve(result)
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