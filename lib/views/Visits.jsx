import React from "react";
import classNames from "classnames";
import { formatAbsolute, formatRelative } from "../timestamp";

function countryFlag(code) {
    // Turn two-letter ISO 3166-1 alpha-2 country codes to country flag emojis.
    // See https://en.wikipedia.org/wiki/Regional_Indicator_Symbol

    if (!code || code.length !== 2) {
        return "";
    }

    const up = code.toUpperCase();
    const a = up.charCodeAt(0) - 0x41;
    const b = up.charCodeAt(1) - 0x41;
    if (a < 0 || a >= 26 || b < 0 || b >= 26) {
        return "";
    }

    const base = 0x1f1e6;
    return String.fromCodePoint(base + a, base + b);
}

function CountryFlag(_props) {
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

function copy(text) {
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(text));

    const selection = window.getSelection();
    const oldRanges = [];
    for (var i = 0, len = selection.rangeCount; i < len; i++) {
        oldRanges.push(selection.getRangeAt(i));
    }

    document.body.appendChild(div);
    try {
        const range = document.createRange();
        range.selectNode(div);

        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        document.execCommand("copy");
    } finally {
        document.body.removeChild(div);

        selection.removeAllRanges();
        oldRanges.forEach(oldRange => {
            selection.addRange(oldRange);
        });
    }
}

function CopyButton(_props) {
    const { text, ...props } = _props;
    return <button onClick={() => copy(text)} {...props} />;
}

CopyButton.propTypes = {
    text: React.PropTypes.string.isRequired
};

function noContent(children) {
    if (!children) {
        return true;
    }
    if (Array.isArray(children)) {
        return children.length === 0;
    }
    return false;
}

function Cell(_props) {
    const { header, className, ...props } = _props;
    const newClassName = classNames(className, { "no-content": noContent(props.children) });

    return (
        <td className={newClassName}>
            <span className="cell-header">{header}</span>
            <span className="cell-content" {...props} />
        </td>
    );
}

Cell.propTypes = {
    header: React.PropTypes.string.isRequired,
    className: React.PropTypes.string,
    children: React.PropTypes.node
};

class Timestamp extends React.Component {
    constructor() {
        super();
        this._interval = null;
    }

    _check(update) {
        if (update && this._interval === null) {
            this._interval = setInterval(this._update.bind(this), 5000);
        } else if (!update && this._interval !== null) {
            clearInterval(this._interval);
            this._interval = null;
        }
    }

    _update() {
        this.setState({
            absolute: formatAbsolute(this.props.timestamp),
            relative: formatRelative(this.props.timestamp)
        });
    }

    componentWillMount() {
        this._update();
    }

    componentDidMount() {
        this._check(this.props.update);
    }

    componentWillReceiveProps(nextProps) {
        this._check(nextProps.update);
        this._update();
    }

    componentWillUnmount() {
        this._check(false);
    }

    render() {
        return (
            <span>
                <span className="absolute">{this.state.absolute}</span>
                <span className="relative">{this.state.relative}</span>
            </span>
        );
    }
}

Timestamp.propTypes = {
    update: React.PropTypes.bool.isRequired,
    timestamp: React.PropTypes.number.isRequired
};

export default function Visits(props) {
    return (
        <div className="container">
            <section className="row">
                <div className="col-sm-12">
                    <h4>Tracking visits to</h4>

                    <div className="input-group">
                        <input id="trap-url" className="form-control trap-url" value={props.trapUrl} readOnly />

                        <span className="input-group-btn">
                            <CopyButton className="btn btn-primary btn-copy" text={props.trapUrl} disabled={!props.js}>
                                copy
                            </CopyButton>
                        </span>
                    </div>
                </div>
            </section>

            <section className="row">
                <div className="col-sm-12">
                    <h4>Visits</h4>

                    <table className="table table-striped visits">
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>IP</th>
                                <th>ASN</th>
                                <th>User Agent</th>
                            </tr>
                        </thead>
                        <tbody>
                            {props.visits.map((visit, index) => (
                                <tr key={index}>
                                    <Cell className="timestamp" header="Time">
                                        <Timestamp timestamp={visit.timestamp} update={props.js} />
                                    </Cell>
                                    <Cell className="ip" header="IP">
                                        <CountryFlag country={visit.country} />{visit.ip}
                                    </Cell>
                                    <Cell header="ASN">
                                        {visit.asns.map((item, index) => (
                                            <span key={index}>{item.asn} {item.names}</span>
                                        ))}
                                    </Cell>
                                    <Cell header="User Agent">{visit.userAgent}</Cell>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

Visits.propTypes = {
    trapUrl: React.PropTypes.string.isRequired,
    visits: React.PropTypes.array.isRequired,
    js: React.PropTypes.bool.isRequired
};
