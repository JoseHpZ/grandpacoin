const messages = require('./validatorMessages');
const ValidatorRules = require('./ValidatorRules');


class Validator extends ValidatorRules {
    constructor(data, message = null) {
        super();
        this.setData(data, message);
        this.existsError = false;
        this.errors = {};
        this.validInputs = {};
    }

    setData(data, message) {
        this.data = data;
        this.generalMessage = message;
    }

    resetValidations() {
        this.existsError = false;
        this.errors = {};
    }

    validate() {
        this.resetValidations();
        this.data.forEach(inputData => {
            if (inputData.names && inputData.values) {
                this.multipleInputValidation(inputData)
            } else {
                this.singleInputValidation(inputData)
            }
        });
        return this;
    }

    multipleInputValidation(inputData) {
        for (let name of inputData.names) {
            if (inputData.validations) {
                inputData.validations.forEach(validation => {
                    if (!this.isValidValidation(validation))
                        throw new Error('Invalid validation rule.');
                    
                    const passValidation = this.check(validation, inputData.values[name]);
                    if (passValidation) {
                        this.validInputs[name] = inputData.values[name];
                        return;
                    }
                    
                    this.existsError = true;
                    const message = this.getErrorMessage(
                        {
                            name,
                            customMessages: inputData.customMessages
                        },
                        validation,
                    );
                    if (!this.errors[name]) {
                        this.errors[name] = [message]
                    } else {
                        this.errors[name].push(message)
                    }
                })
            }
            if (inputData.customValidations) {
                inputData.customValidations.forEach(validation => {
                    // execute custom validation and pass the value for params
                    const passValidation = validation.validation(inputData.values[name]);
                    if (passValidation) {
                        this.validInputs[name] = inputData.values[name];
                        return;
                    }
    
                    this.existsError = true;
                    if (!this.errors[name]) {
                        this.errors[name] = [validation.message]
                    } else {
                        this.errors[name].push(validation.message)
                    }
                })
            }
        }
    }

    singleInputValidation(inputData) {
        if (inputData.validations) {
            inputData.validations.forEach(validation => {
                if (!this.isValidValidation(validation))
                    throw new Error('Invalid validation rule.');
                
                const passValidation = this.check(validation, inputData.value);
                
                if (passValidation || this.haveNullableOptions(inputData)) {
                    this.validInputs[inputData.name] = inputData.value;
                    return;
                }
                
                this.existsError = true;
                const validationName = validation.name || validation;
                const message = this.getErrorMessage(inputData, validationName);
                if (!this.errors[inputData.name]) {
                    this.errors[inputData.name] = [message]
                } else {
                    this.errors[inputData.name].push(message)
                }
            })

        }
        if (inputData.customValidations) {
            inputData.customValidations.forEach(validation => {
                const passValidation = validation.validation(inputData.value);
    
                if (passValidation) {
                    this.validInputs[inputData.name] = inputData.value;
                    return;
                }
                
                this.existsError = true;
                if (!this.errors[inputData.name]) {
                    this.errors[inputData.name] = [validation.message]
                } else {
                    this.errors[inputData.name].push(validation.message)
                }
            })
        }
    }
    
    getErrors() {
        return {
            message: this.generalMessage || 'Input validation errors.',
            errors: this.errors,
        };
    }

    hasError() {
        return this.existsError;
    }

    getErrorMessage(inputData, validation) {
        if ( inputData.customMessages && inputData.customMessages[validation]) {
            return inputData.customMessages[validation];
        }
        const name = inputData.name.replace(/([a-z])([A-Z])/g, '$1 $2');
        return messages[validation].replace(/@input/g, name)
    }

    getValidated() {
        return this.validInputs;
    }

    check(validation, value) {
        return this[validation](value);
    }

    isValidValidation(validation) {
        return messages.hasOwnProperty(validation);
    }

    haveNullableOptions(inputData) {
        return (inputData.value === undefined || inputData.value === null) && inputData.validations.includes('nullable');
    }
}


/**
 * EXAMPLE OF USAGE WITH MULTIPLE INPUTS
 * 
 *  const validator = new Validator([
            {
                validations: ['required', 'string'],
                names: ['fee', 'sender public Key', 'data', 'sender signature'],
                values: {
                    fee,
                    'sender public Key': senderPubKey,
                    data,
                    'sender signature': senderSignature,
                },
            }
        ]);
 */

/**
 * EXAMPLE OF USAGE WITH SINGLE INPUTS
 * 
 *  const validator = new Validator([
            {
                validations: ['required', 'string'],
                name: 'fee',
                value: 5465
            },
            customMessages: {
                required: 'The fee is required bebex'
            }
        ]);
 */

/**
 * EXAMPLE OF USAGE WITH CUSTOM RULE
 * 
 *  const validator = new Validator([
            {
                validations: ['required', 'string'],
                customValidations: [
                    {
                        validation: () => a > b,
                        message: 'a need to be more than b',
                    },
                    {
                        validation: () => b < 100,
                        message: 'b need to be less than 100',
                    }
                ],
                name: 'fee',
                value: fee,
            }
        ]);
 */

module.exports = Validator;