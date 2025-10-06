class ConstraintEngine {
    constructor() {
        this.constraints = new Map();
        this.errorMessages = {};
        this.setupDefaultConstraints();
    }

    setupDefaultConstraints() {
        this.constraints.set('noUppercase', (value, param, options = {}) => {
            return !/[A-Z]/.test(value);
        });

        this.constraints.set('noDigits', (value, param, options = {}) => {
            return !/\d/.test(value);
        });

        this.constraints.set('noSpecialChars', (value, param, options = {}) => {
            return !/[!@#$%^&*(),.?":{}|<>]/.test(value);
        });

        this.constraints.set('maxLength', (value, param) => value.length <= param);
        this.constraints.set('minLength', (value, param) => value.length >= param);
        this.constraints.set('mustStartWith', (value, param) => value.startsWith(param));
        this.constraints.set('mustEndWith', (value, param) => value.endsWith(param));
        this.constraints.set('autoStartWith', (value, param) => {
            if (!value.startsWith(param)) {
                return param + value;
            }
            return value;
        });
        this.constraints.set('disallowedWords', (value, param) => {
            return !param.some((word) => {
                const regex = new RegExp(`\\b${word}\\b`, 'i');
                return regex.test(value);
            });
        });

        this.constraints.set('mustMatchPattern', (value, param) => {
            try {
                return new RegExp(param).test(value);
            } catch {
                return false;
            }
        });

        this.constraints.set('mustNotMatchPattern', (value, param) => {
            try {
                return !new RegExp(param).test(value);
            } catch {
                return true;
            }
        });

        this.constraints.set('noEmptyMessage', (value, param) => value && value.trim().length > 0);
        this.setupDefaultErrorMessages();
    }

    setupDefaultErrorMessages() {
        this.errorMessages = {
            noUppercase: () => 'Le message ne doit pas contenir de lettres majuscules',
            noDigits: () => 'Le message ne doit pas contenir de chiffres',
            noSpecialChars: () => 'Le message ne doit pas contenir de caractères spéciaux',
            maxLength: (param) => `Le message ne doit pas dépasser ${param} caractères`,
            minLength: (param) => `Le message doit contenir au moins ${param} caractères`,
            mustStartWith: (param) => `Le message doit commencer par "${param}"`,
            mustEndWith: (param) => `Le message doit se terminer par "${param}"`,
            disallowedWords: (param) =>
                `Le message contient des mots interdits: ${Array.isArray(param) ? param.join(', ') : param}`,
            mustMatchPattern: () => 'Le message ne respecte pas le format requis',
            mustNotMatchPattern: () => 'Le message contient un motif interdit',
            noTrailingWhitespace: () => "Le message ne doit pas contenir d'espaces en fin",
            noEmptyMessage: () => 'Le message ne peut pas être vide'
        };
    }

    async validate(message, constraintsConfig, callback = null) {
        const errors = [];
        if (constraintsConfig.constraints) {
            for (const [constraintName, _] of Object.entries(constraintsConfig.constraints)) {
                if (!this.constraints.has(constraintName)) {
                    errors.push(`Contrainte inconnue: ${constraintName}`);
                    continue;
                }
            }
        }

        if (errors.length === 0 && typeof callback === 'function' && callback != null) {
            const info = await callback({
                msg: message,
                type: constraintsConfig.type,
                constraints: constraintsConfig.constraints
            });

            if (!info.isValid) errors.push(...info.errors);
        } else if (errors.length === 0 && constraintsConfig.constraints) {
            for (const [constraintName, param] of Object.entries(constraintsConfig.constraints)) {
                const validator = this.constraints.get(constraintName);
                if (!validator(message, param)) {
                    errors.push(this.getErrorMessage(constraintName, param));
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    getErrorMessage(constraintName, param) {
        if (this.errorMessages && this.errorMessages[constraintName]) {
            return this.errorMessages[constraintName](param);
        }
        return `Erreur de validation: ${constraintName}`;
    }

    addConstraint(name, validatorFn, errorMessageFn) {
        this.constraints.set(name, validatorFn);
        if (errorMessageFn) {
            this.errorMessages[name] = errorMessageFn;
        }
    }
}

const constraintEngine = new ConstraintEngine();

module.exports = {
    ConstraintEngine,
    constraintEngine
};
