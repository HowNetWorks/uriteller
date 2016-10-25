import React from "react";

export default function Layout(props) {
    return (
        <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>URI:teller</title>

                {props.styles.map((href, index) => <link key={index} rel="stylesheet" href={href} />)}
            </head>

            <body>
                <nav className="navbar navbar-fixed-top navbar-light bg-faded">
                    <div className="container">
                        <a className="navbar-brand" href="/">URI:teller</a>
                    </div>
                </nav>

                <div id="app">
                    {props.children}
                </div>

                <footer className="footer text-muted">
                    <div className="container">
                        <hr />
                        <div className="float-xs-left logo">
                            HowNetWorks
                        </div>
                        <div className="float-xs-right">
                            Made with &#9986; in Finland
                        </div>
                    </div>
                </footer>

                {props.scripts.map((src, index) => <script key={index} src={src}></script>)}
            </body>
        </html>
    );
}

Layout.propTypes = {
    styles: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    scripts: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    children: React.PropTypes.node
};
