import React from "react";
import classNames from "classnames";
import countryFlag from "../country-flag";

export default function CountryFlag(_props) {
    const { country, ...props } = _props;

    const flag = countryFlag(country);
    if (!flag) {
        return null;
    }

    const className = classNames(props.className, "country-flag");
    return <span className={className} {...props}>{flag}</span>;
}

CountryFlag.propTypes = {
    country: React.PropTypes.string,
    className: React.PropTypes.string,
};
