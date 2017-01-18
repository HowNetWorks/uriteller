import React from "react";
import classNames from "classnames";
import countryFlag from "../country-flag";

export default function CountryFlag({ country, className, ...props }) {
    const flag = countryFlag(country);
    if (!flag) {
        return null;
    }

    const cn = classNames(className, "country-flag");
    return <span className={cn} {...props}>{flag}</span>;
}

CountryFlag.propTypes = {
    country: React.PropTypes.string,
    className: React.PropTypes.string
};
