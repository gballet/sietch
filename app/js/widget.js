/**
 * "Abstract" class all widgets inherit from.
 * @class
 */
class Widget {
    constructor(parent, type) {
        this.parent = parent;

        this.widget = document.createElementNS("http://www.w3.org/2000/svg", type);
    }

    set_position(x, y) {
        this.x = x;
        this.y = y;
    }

    draw() {
        this.widget.setAttribute("transform", `translate(${this.x}, ${this.y})`);
        this.parent.appendChild(this.widget);
    }
}

module.exports = Widget;
