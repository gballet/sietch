const Widget = require("./widget");

class Button extends Widget {
    constructor(title, width, height, onclick, parent, session) {
        super(parent, "g");

        this.title = title;
        this.onclick = onclick;
        this.pressed = false;
        this.set_position(0, 0);

        this.widget.innerHTML = `
            <defs>
                <clipPath id="buttonlimits">
                    <rect x=1 y=1 width=${width-1} height=${height-1}></rect>
                </clipPath>
            </defs>
            <rect x=0 y=0 width=${width} height=${height} fill="lightgrey"></rect>
            <text x=${width/2} y="${height/2}" alignment-baseline="middle" text-anchor="middle" clip-path="url(#buttonlimits)">${title}</text>
            <line x1=0 y1=0 x2=${width-1} y2=0 stroke="white"></line>
            <line x1=0 y1=0 y2=${height-1} x2=0 stroke="white"></line>
            <line x1=${width} y1=1 x2=${width} y2=${height} stroke="darkgrey"></line>
            <line x1=${width} y1=${height} y2=${height} x2=1 stroke="darkgrey"></line>
        `;
        this.widget.addEventListener("mousedown", (e) => {
            if (e.buttons == 1) {
                this.pressed = true;
                this.invert_shadows();
            }
        }, false);
        this.widget.addEventListener("mouseleave", () => {
            if (this.pressed) {
                this.pressed = false;
                this.invert_shadows();
            }
        }, false);
        this.widget.addEventListener("mouseup", () => {
            if (this.pressed) {
                this.pressed = false;
                this.invert_shadows();
                this.onclick();
            }
        }, false);
    }

    invert_shadows() {
        let lines = this.widget.getElementsByTagName("line");
        for (let line of lines) {
            let color = line.getAttribute("stroke");
            if (color == "darkgrey")
                line.setAttribute("stroke", "white");
            else
                line.setAttribute("stroke", "darkgrey");
        }
    }
}

module.exports = Button;
