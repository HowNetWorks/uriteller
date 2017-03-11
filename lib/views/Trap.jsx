import React from "react";

export default function Trap({ baseUrl }) {
  return (
    <div className="container text-center">
      <section className="row">
        <div className="col-12">
          <h1>Howdy, stranger</h1>

          <p className="lead">
            This is a <strong>URI:teller</strong> trap page.
          </p>
        </div>
      </section>

      <section className="row">
        <div className="col-12">
          <p className="lead">
            Want to find out more?
          </p>
          <p>
            <a href={baseUrl} className="btn btn-primary btn-lg">Visit URI:teller now</a>
          </p>
        </div>
      </section>
    </div>
  );
}

Trap.propTypes = {
  baseUrl: React.PropTypes.string.isRequired
};
