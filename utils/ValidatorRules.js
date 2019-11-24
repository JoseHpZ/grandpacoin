const isObject = function (a) {
    return (!!a) && (a.constructor === Object);
};

class ValidatorRules {
    required(value) {
        if (value === undefined || value === null) {
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
        if (!this.array(signature) || signature.length !== 2) 
            return false;
        if (signature[0] === signature[1])
            return false;
        return /^([A-Fa-f0-9]{64})$/.test(signature[0]) && /^([A-Fa-f0-9]{64})$/.test(signature[1]);
    }

    isValidTransactionHash(transaction) {
        return /^([A-Fa-f0-9]{64})$/.test(transaction);
    }

    isValidAddress(address) {
        if (!address) return false;
        return /^([A-Fa-f0-9]{40})$/.test(address.replace(/^0x/, ''));
    }
    
    array(value) {
        return Array.isArray(value);
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

    date(value) {
        if (value instanceof Date) {
            return true;
        }

        if (typeof value !== 'string' && typeof value !== 'number') {
            return false;
        }

        return !isNaN(Date.parse(value));
    }

    boolean(value) {
        if (typeof value === 'boolean') {
            return true;
        }
        return false;
    }
}

module.exports = ValidatorRules;