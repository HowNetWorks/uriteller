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
                <nav className="navbar navbar-default navbar-fixed-top">
                    <div className="container">
                        <div className="navbar-header">
                            <a className="navbar-brand" href="/">URI:teller</a>
                        </div>
                    </div>
                </nav>

                <div id="app">
                    {props.children}
                </div>

                <footer className="footer text-muted">
                    <div className="container">
                        <hr />
                        <p className="pull-right">
                            Made with <span className="glyphicon glyphicon-scissors"></span> in Finland
                        </p>
                    </div>
                </footer>

                {props.scripts.map((src, index) => <script key={index} src={src}></script>)}
            </body>
        </html>
    );
}
