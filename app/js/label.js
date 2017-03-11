const Widget = require("js/widget");

class Label extends Widget {
    constructor(text, width, height, parent, session) {
        super(parent, "g");

        this.widget.innerHTML = `
            <defs>
                <clipPath id="labellimits">
                    <rect x=0 y=0 width=${width-1} height=${height-1}></rect>
                </clipPath>
            </defs>
            <text x=0 y=15 clip-path="url(#labellimits)">${text}</text>
        `;
    }
}

module.exports = Label;
