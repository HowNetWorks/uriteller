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

function Cell({ header, className, children, ...props }) {
    const newClassName = classNames(className, { "no-content": !hasContent(children) });

    return (
        <td className={newClassName}>
            <span className="cell-header">{header}</span>
            <span className="cell-content" {...props}>
                {children}
            </span>
        </td>
    );
}

Cell.propTypes = {
    header: React.PropTypes.string.isRequired,
    className: React.PropTypes.string,
    children: React.PropTypes.node
};

function NoVisits() {
    return (
        <div className="text-muted no-visits">No-one has visited the trap yet.</div>
    );
}

function Table({ visits, js, ...props }) {
    return (
        <table className="table table-striped" {...props}>
            <thead>
                <tr>
                    <th>Time</th>
                    <th>IP</th>
                    <th>ASN</th>
                    <th>User Agent</th>
                </tr>
            </thead>
            <tbody>
                {visits.map((visit, index) => (
                    <tr key={index}>
                        <Cell className="timestamp" header="Time">
                            <Timestamp timestamp={visit.timestamp} update={js} />
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
    );
}

Table.propTypes = {
    visits: React.PropTypes.array.isRequired,
    js: React.PropTypes.bool.isRequired
};

export default function Visits({ trapUrl, visits, js, liveUpdateError }) {
    let liveUpdates;
    if (!js) {
        liveUpdates = <noscript className="text-muted">live updates off</noscript>;
    } else if (liveUpdateError) {
        liveUpdates = <span className="text-warning">live updates off</span>;
    } else {
        liveUpdates = <span className="text-success">live updates on</span>;
    }

    return (
        <div className="container">
            <section className="row trap">
                <div className="col-xs-12">
                    <h4>Monitoring visits to URL</h4>
                </div>

                <div className="col-xs-12 col-lg-8">
                    <div className="input-group trap-group">
                        <input className="form-control trap-url" value={trapUrl} readOnly />

                        <span className="input-group-btn">
                            <CopyButton className="btn btn-primary" text={trapUrl} disabled={!js}>
                                copy
                            </CopyButton>
                        </span>
                    </div>
                </div>

                <div className="col-xs-12 col-lg-4 text-justify help">
                    This is your <strong>trap URL</strong>. Copy-paste it to
                    your favorite messaging app, URL shortener or social network
                    site. This <strong>monitor page</strong> shows who visits
                    the trap.
                </div>
            </section>

            <section className="row monitor">
                <div className="col-sm-12">
                    <div className="clearfix visits-header">
                        <h4 className="float-xs-left">Visits</h4>
                        <div className="live-updates">
                            {liveUpdates}
                        </div>
                    </div>
                    {visits.length === 0 ? <NoVisits /> : <Table visits={visits} js={js} />}
                </div>
            </section>
        </div>
    );
}

Visits.propTypes = {
    trapUrl: React.PropTypes.string.isRequired,
    visits: React.PropTypes.array.isRequired,
    js: React.PropTypes.bool.isRequired,
    liveUpdateError: React.PropTypes.instanceOf(Error)
};
