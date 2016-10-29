import React from "react";

export default function Layout(_props) {
    const { styles, scripts, children, ...props } = _props;

    return (
        <html {...props}>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>URI:teller</title>

                {styles.map((href, index) => <link key={index} rel="stylesheet" href={href} />)}
            </head>

            <body>
                <nav className="navbar navbar-fixed-top navbar-light bg-faded">
                    <div className="container">
                        <a className="navbar-brand" href="/">URI:teller</a>
                    </div>
                </nav>

                <div id="app">
                    {children}
                </div>

                <footer className="footer text-muted">
                    <div className="container text-xs-center">
                        <hr />

                        <div className="float-xs-left logo">
                            HowNetWorks
                        </div>

                        <div className="float-xs-right blurb">
                            Made with &#9986; in Finland
                        </div>

                        <div className="social">
                            <a className="icon github" href="https://github.com/HowNetWorks/uriteller" target="_blank"/>
                            <a className="icon twitter" href="https://twitter.com/HowNetWorksIO" target="_blank" />
                        </div>
                    </div>
                </footer>

                {scripts.map((src, index) => <script key={index} src={src}></script>)}
            </body>
        </html>
    );
}

Layout.propTypes = {
    styles: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    scripts: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    children: React.PropTypes.node
};
