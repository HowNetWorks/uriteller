import React from "react";

export default function Layout({ title, styles, scripts, children, ...props }) {
  return (
    <html {...props}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <title>{title}</title>

        {styles.map((href, index) => <link key={index} rel="stylesheet" href={href} />)}
      </head>

      <body>
        <nav className="navbar fixed-top navbar-light bg-faded">
          <div className="container">
            <a className="navbar-brand" href="/">URI:teller</a>
          </div>
        </nav>

        <div id="app">
          {children}
        </div>

        <footer className="footer text-muted">
          <div className="container text-center">
            <hr />

            <div className="float-left logo">
              HowNetWorks
            </div>

            <div className="float-right blurb">
              Made with &#9986; in Finland
            </div>

            <div className="social">
              <a className="icon github" href="https://github.com/HowNetWorks/uriteller" title="URI:teller GitHub repository" target="_blank" rel="noopener noreferrer" />
              <a className="icon twitter" href="https://twitter.com/HowNetWorksIO" title="HowNetWorks in Twitter" target="_blank" rel="noopener noreferrer" />
            </div>
          </div>
        </footer>

        {scripts.map((src, index) => <script key={index} src={src}></script>)}
      </body>
    </html>
  );
}

Layout.propTypes = {
  title: React.PropTypes.string.isRequired,
  styles: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
  scripts: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
  children: React.PropTypes.node
};
