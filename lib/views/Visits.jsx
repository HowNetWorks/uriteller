import React from "react";
import classNames from "classnames";
import Timestamp from "../components/Timestamp.jsx";
import CopyButton from "../components/CopyButton.jsx";
import CountryFlag from "../components/CountryFlag.jsx";

function hasContent(children) {
    return React.Children.toArray(children).some(child => {
        return typeof child !== "string" || child.trim();
    });
}

function Cell(_props) {
    const { header, className, ...props } = _props;
    const newClassName = classNames(className, { "no-content": !hasContent(props.children) });

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
