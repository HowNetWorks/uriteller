import React from "react";

export default function Visits(props) {
    return (
        <div className="container">
            <div className="row">
                <div className="col-sm-12">
                    <h4>Tracking visits to</h4>

                    <input type="text" className="form-control" value={props.trapUrl} readOnly />
                </div>
            </div>

            <div className="row">
                <div className="col-sm-12">
                    <h3>Visits <span className="badge">{props.visits.length}</span></h3>

                    <table className="table table-striped">
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
                                    <td>{visit.timestamp}</td>
                                    <td>{visit.country.emoji}&nbsp;{visit.ip}</td>
                                    <td>{visit.asns.map((item, index) => <span key={index}>{item.asn} {item.names}</span>)}</td>
                                    <td>{visit.userAgent}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

Visits.propTypes = {
    trapUrl: React.PropTypes.string.isRequired,
    visits: React.PropTypes.array.isRequired
};
