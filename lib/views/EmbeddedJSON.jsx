import React from "react";

function stringify(obj) {
  return {
    __html: JSON.stringify(obj)
      .replace(/</g, "\\u003c")
      .replace(/>/g, "\\u003e")
      .replace(/&/g, "\\u0026")
  };
}

export default function EmbeddedJSON({ content, ...rest }) {
  return <script type="application/json" dangerouslySetInnerHTML={stringify(content)} {...rest} />;
}

EmbeddedJSON.propTypes = {
  content: function(props, propName, componentName) {
    try {
      if (JSON.stringify(props[propName]) === undefined) {
        return new Error(`Invalid prop \`${propName}\` supplied to \`${componentName}\`. Validation failed.`);
      }
    } catch (err) {
      return err;
    }
  }
};
