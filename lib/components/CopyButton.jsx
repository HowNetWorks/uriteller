import React from "react";
import copyToClipboard from "../copy-to-clipboard";

export default function CopyButton({ text, ...props }) {
    return <button onClick={() => copyToClipboard(text)} {...props} />;
}

CopyButton.propTypes = {
    text: React.PropTypes.string.isRequired
};
