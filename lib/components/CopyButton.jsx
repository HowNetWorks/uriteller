import React from "react";

function copy(text) {
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(text));

    const selection = window.getSelection();
    const oldRanges = [];
    for (var i = 0, len = selection.rangeCount; i < len; i++) {
        oldRanges.push(selection.getRangeAt(i));
    }

    document.body.appendChild(div);
    try {
        const range = document.createRange();
        range.selectNode(div);

        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        document.execCommand("copy");
    } finally {
        document.body.removeChild(div);

        selection.removeAllRanges();
        oldRanges.forEach(oldRange => {
            selection.addRange(oldRange);
        });
    }
}

export default function CopyButton(_props) {
    const { text, ...props } = _props;
    return <button onClick={() => copy(text)} {...props} />;
}

CopyButton.propTypes = {
    text: React.PropTypes.string.isRequired
};
