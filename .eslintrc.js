module.exports = {
    "plugins": [
        "react"
    ],
    "env": {
        "browser": true,
        "es6": true,
        "node": true
    },
    "extends": [
        "eslint:recommended",
        "plugin:react/recommended"
    ],
    "parserOptions": {
        "sourceType": "module",
        "ecmaFeatures": {
            "experimentalObjectRestSpread": true
        }
    },
    "rules": {
        // Stylistic Issues
        "indent": ["error", 4],
        "linebreak-style": ["error", "unix"],
        "quotes": ["error", "double"],
        "semi": ["error", "always"],

        // Possible Errors
        "no-unsafe-negation": "error",

        // Best Practices
        "no-multi-spaces": "error",

        // ECMAScript 6
        "prefer-const": "error"
    }
};
