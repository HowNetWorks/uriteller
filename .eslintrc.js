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
        "ecmaVersion": 2017,
        "ecmaFeatures": {
            "experimentalObjectRestSpread": true
        }
    },
    "rules": {
        // Stylistic Issues
        "camelcase": "error",
        "indent": ["error", 4],
        "linebreak-style": ["error", "unix"],
        "quotes": ["error", "double"],
        "semi": ["error", "always"],
        "no-trailing-spaces": "error",
        "eol-last": "error",
        "no-multiple-empty-lines": ["error", {"max": 1, "maxBOF": 0}],

        // Possible Errors
        "no-unsafe-negation": "error",

        // Best Practices
        "no-multi-spaces": "error",

        // ECMAScript 6
        "no-var": "error",
        "prefer-const": "error",

        // React
        "react/jsx-indent": ["error", 4],
        "react/no-unknown-property": "error",
        "react/jsx-no-target-blank": "error"
    }
};
