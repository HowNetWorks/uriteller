import React from "react";

export default function Index() {
    return (
        <div className="container">
            <div className="row heading">
                <div className="col-xs-12 col-md-7 col-lg-6 offset-lg-1 logo" />

                <div className="col-xs-12 col-md-5 col-lg-4 col-xl-3 blurb">
                    <p className="lead">
                        Are <strong>they</strong> calling back <strong>from beyond the cloud</strong>?
                    </p>

                    <a className="btn btn-primary btn-lg" href="/new">Let's find out!</a>
                </div>
            </div>

            <div className="row comics">
                <div className="col-sm-6 col-md-6 col-lg-4 comic comic-1" />
                <div className="col-sm-6 col-md-6 col-lg-4 comic comic-2" />
                <div className="col-sm-12 col-md-12 col-lg-4 comic comic-3" />
            </div>
        </div>
    );
}
