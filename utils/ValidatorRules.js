const isObject = function (a) {
    return (!!a) && (a.constructor === Object);
};

class ValidatorRules {
    required(value) {
        if (!value) {
            return false;
        }
        if (typeof value === 'string' && value.trim() === '') {
            return false;
        }
        if (Array.isArray(value) && value.length < 1) {
            return false;
        }

        return true;
    }

    string(value) {
        if (value === undefined) {
            return true;
        }
        if (typeof value !== 'string') {
            return false;
        }

        return true;
    }

    integer(value) {
        return new RegExp(/^-?\d+$/).test(value);
    }

    nullable() {
        return true;
    }

    // in(optionValue, values) {
    //     return values.includes(optionValue);
    // }

    object(value) {
        if (!value) return false;
        return isObject(value);
    }

    isValidPublicKey(pubKey) {
        return /^([A-Fa-f0-9]{65})$/.test(pubKey);
    }

    isValidSignature(signature) {
        return /^([A-Fa-f0-9]{64})$/.test(signature);
    }

    isValidTransactionHash(transaction) {
        return /^([A-Fa-f0-9]{64})$/.test(transaction);
    }

    isValidAddress(address) {
        if (!address) return false;
        return /^([A-Fa-f0-9]{40})$/.test(address.replace(/^0x/, ''));
    }


    isValidUrl(url) {
        if (!url) return false;

        if (/^(http|https)\:\/\/[a-z0-9\.-]+\.[a-z]{2,4}(\:[0-9]{1,4})?/gi.test(url)
            || /^(http|https)\:\/\/[a-z0-9\.-]+(\:[0-9]{1,4})?/gi.test(url)
            || /^(http|https)\:\/\/[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+(\:[0-9]{1,4})?/gi.test(url)) {
            return true;
        }
        return false;
    }
}

module.exports = ValidatorRules;