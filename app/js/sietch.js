const default_theme = {
    window_bg: "white",
    titlebar_bg: "blue",
    titlebar_fg: "white",
    titlebar_close_button_color: "red",
    titlebar_max_button_color: "yellow",
    desktop_background: {type: "color", color: "#ccc"},
    icon_size: 64
}

const Widget = require("js/widget");
const Button = require("js/button");
const Label = require("js/label");

class Icon extends Widget {
    constructor(title, svgicon, callback, parent) {
        super(parent, "g");

        this.title = title;
        this.callback = callback;

        // TODO add stroke='blue' to the rect if selected
        this.widget.innerHTML = `
            <rect x=0 y=0 width=64 height=64 fill="rgba(0,0,0,0)"></rect>
            <g transform="translate(32, 32)">
                ${svgicon}
            </g>
            <text transform="translate(0, ${64 + 20})">${title}</text>
        `;
        this.widget.addEventListener('dblclick', (e) => {
            this.callback();
        });
    }
}

class Menu {
    // data is a set of tuples of format: {title, callback}
    constructor(data, parent, session) {
        this.data = data;
        this.parent = parent;
        this.session = session;
        this.visible = false;

        // TODO check format for data
    }

    is_visible() {
        return this.visible;
    }

    show(x,y) {
        this.menu = document.createElementNS("http://www.w3.org/2000/svg", "g");
        this.menu.x = x;
        this.menu.y = y;
        this.visible = true;

        let entries = "";
        for (let i in this.data) {
            entries += `<text transform="translate(5, ${(i+1)*20})">${this.data[i][0]}</text>`;
        }

        this.menu.innerHTML = `
            <rect x=0 y=0 width=${100} height=${this.data.length * 30} fill="darkgrey" stroke="black"></rect>
            ${entries}
        `;
        this.menu.setAttribute("transform", `translate(${x},${y})`);
        this.menu.addEventListener("click", (e) => { e.preventDefault(); this.clicked(e); }, false);

        this.parent.appendChild(this.menu);
    }

    hide() {
        this.parent.removeChild(this.menu);
        this.visible = false;
    }

    clicked(event) {
        let entry = Math.floor(+(event.pageY - this.menu.y) / 30);
        if (event.buttons == 0) {
            this.data[entry][1]();
            this.hide();
        }
    }
}

/**
 * Represents a window.
 * @class
 */
class Window {
    /**
     * @param title Window title
     * @param width Window width
     * @param height Window height
     * @param parent The parent of this window
     * @param session A reference to the session this window is a part of
     */
    constructor(title, width, height, parent, session) {
        this.width = width;
        this.height = height;
        this.parent = parent;
        this.session = session;
        this.title = title;
        this.children = [];
        this.maximized = false;

        this.win = document.createElementNS("http://www.w3.org/2000/svg", "g");
        this.win.setAttribute("width", width);
        this.win.setAttribute("height", height);
        this.win.innerHTML = `
            <defs>
                <clipPath id="windowlimits">
                    <rect x=0 y=0 width=${width-1} height=${height-1}></rect>
                </clipPath>
            </defs>
            <rect width="${this.width}" height="30px"
                id="titlebar"
                fill="${default_theme.titlebar_bg}"></rect>

            <g transform="translate(15, 15)" id="close_button">
                <circle r="10" fill="${default_theme.titlebar_close_button_color}" stroke-width=1 stroke="black"></circle>
                <g transform="rotate(45)">
                    <line x1="0" y1="-10" x2="0" y2="10" stroke="black"></line>
                    <line y1="0" x1="-10" y2="0" x2="10" stroke="black"></line>
                </g>
            </g>

            <g transform="translate(35, 15)" id="max_button">
                <circle r="10" fill="${default_theme.titlebar_max_button_color}" stroke-width=1 stroke="black"></circle>
                <rect width="10" height="10" x="-5" y="-5" fill="none" stroke="black"></rect>
            </g>

            <text x="50" y="20"
                clip-path="url(#windowlimits)"
                font-size="20" font-family="Verdana"
                fill="${default_theme.titlebar_fg}">${this.title}</text>

            <g id="main_frame" transform="translate(0, 30)"
                width="${this.width}" height="${this.height - 30}px">
                <rect width="${this.width}" height="${this.height - 30}px"
                id="body"
                fill="${default_theme.window_bg}"></rect>
            </g>
        `;

        this.body = this.win.querySelector("#body");

        let close_button = this.win.querySelector("#close_button");
        close_button.addEventListener("click", (e) => {
            e.preventDefault();
            if (this.on_quit()) {
                this.parent.removeChild(this.win);
                this.session.remove_window(this);
            }
        });

        let max_button = this.win.querySelector("#max_button");
        max_button.addEventListener("click", (e) => {
            e.preventDefault();
            if (this.maximized) {
                this.titlebar.setAttribute("width", this.width);
                this.body.setAttribute("width", this.width);
                this.body.setAttribute("height", this.height);
                this.win.setAttribute("transform", `translate(${this.x}, ${this.y})`);
                this.maximized = false;
            } else {
                // BUG the clip-path needs to be removed for the title
                this.titlebar.setAttribute("width", this.session.max_window_width());
                this.body.setAttribute("width", this.session.max_window_width());
                this.body.setAttribute("height", this.session.max_window_height());
                this.win.setAttribute("transform", "translate(0, 0)");
                this.maximized = true;
            }
        })

        this.win.addEventListener("click", () => {
            // Bring the window to the foreground if clicked. This is done by
            // removing it from the parent and re-adding it there, as SVG draws
            // children bottom-up.
            this.parent.removeChild(this.win);
            this.parent.appendChild(this.win);
        });

        this.titlebar = this.win.querySelector("#titlebar");
        this.titlebar.addEventListener("mousedown", (e) => {
            this.move_x = e.clientX;
            this.move_y = e.clientY;

            this.titlebar.parentElement.onmousemove = (e) => {
                let offsetx = e.clientX - this.move_x;
                let offsety = e.clientY - this.move_y;
                this.titlebar.parentElement.setAttribute("transform", `translate(${offsetx + this.x}, ${offsety + this.y})`);
            };

            // For many reasons, the mouse can get out of the window. The mouseup
            // event might therefore be received by other components, which means
            // it should be caught by the root window.
            this.parent.onmouseup = (e) => {
                this.x += e.clientX - this.move_x;
                this.y += e.clientY - this.move_y;
                this.titlebar.parentElement.onmousemove = null;
                this.parent.onmouseup = null;
                this.parent.onmouseleave = null;
            };

            // If the cursor leaves the desktop area, it is as if the mouse had
            // been released.
            this.parent.onmouseleave = (e) => {
                this.x += e.clientX - this.move_x;
                this.y += e.clientY - this.move_y;
                this.titlebar.parentElement.onmousemove = null;
                this.parent.onmouseup = null;
                this.parent.onmouseleave = null;
            };
        }, false);

        this.main_frame = this.win.querySelector("#main_frame");
        this.main_frame.addEventListener("click", this.on_click);
    }

    /** Overload if you want to catch a click on the window */
    on_click(e) {
        console.log(e);
    }

    /**
     * Overload if you want to catch a window close event. Return `true` if
     * the window can be closed.
     */
    on_quit() {
        return true;
    }

    /** Draw the window, with its children */
    draw(x, y) {
        this.x = x;
        this.y = y;
        this.win.setAttribute("transform", `translate(${x}, ${y})`);
        this.parent.appendChild(this.win);

        for (let child of this.children) {
            child.draw();
        }
    }

    /** Add a child of type widget to the window */
    add_child(child) {
        if (!this.children)
            this.children = [];
        this.children.push(child);
    }
}

/**  This is the main interface to the windowing system. All windows, menus and
 *   so on need to be created through these interface methods.
 *   @constructor(element) Takes the name of a DOM element the system will be drawn in.
 */
class Sietch {
    constructor(element) {
        this.container = element;
        this.frame = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.frame.setAttribute("width", "100%");
        this.frame.setAttribute("height", "100%");

        // Context menu for the background
        this.desktop_menu = new Menu([["New...", (e) => { alert("Not yet implemented"); }]], this.frame, this);

        // The background, which covers the entire space. It should be the furthest
        // back and thus, is added first.
        this.background = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        this.background.setAttribute("width", "100%");
        this.background.setAttribute("height", "100%");
        this.set_background(this.background, default_theme.desktop_background);

        // Handle the context menu. It is shown by clicking on the right button.
        this.background.addEventListener("contextmenu", (e) => {
            e.preventDefault();

            if (e.buttons == 2) {
                if (this.desktop_menu.is_visible()) {
                    this.desktop_menu.hide();
                }

                this.desktop_menu.show(e.pageX, e.pageY);
            }
        }, false);

        // Show windows at increasing offset from the top left corner. Like old
        // Windows(tm) time
        this.last_creation_offset = 0;

        this.frame.appendChild(this.background);
    }

    /**
     * The function that starts it all, by adding the system to the DOM.
     */
    go() {
        this.container.appendChild(this.frame);
    }

    remove_window(win) {
        this.windows = this.windows.filter(w => w != win);
    }

    /**
     * Interface helper to create a window.
     * @param width Window width, in pixels
     * @param height Window height, in pixels
     * @param title Window title (string)
     * @returns A window object
     */
    create_window(width, height, title) {
        if (!this.windows) {
            this.windows = [];
        }

        let newwin = new Window(title, width, height, this.frame, this);

        this.windows.push(newwin);

        newwin.draw(this.last_creation_offset, this.last_creation_offset);

        this.last_creation_offset = (this.last_creation_offset + 30) % 120;

        return newwin;
    }

    /**
     * Interface helper to create a button.
     * @param width Button width, in pixels
     * @param height Button height, in pixels
     * @param title Button title (string)
     * @param callback A function to be called when the button is clicked.
     * @param win The parent window
     * @returns A button object
     */
    add_button(x, y, width, height, title, callback, win) {
        let button = new Button(title, width, height, callback, win.main_frame);
        button.set_position(x, y);
        win.add_child(button);
        win.draw(this.last_creation_offset, this.last_creation_offset);
        return button;
    }

    add_label(text, x, y, width, height, win) {
        let label = new Label(text, width, height, win.main_frame);
        label.set_position(x, y);
        win.add_child(label);
        win.draw(this.last_creation_offset, this.last_creation_offset);
        return label;
    }

    /**
     * Interface helper to create a icon.
     * @param title Icon title (string)
     * @param icon SVG data to use as icon.
     * @param cb A function to be called when the icon is double-clicked.
     * @param parent If specified, the parent window. Otherwise, the background
     *               is used as parent.
     * @returns An icon object
     */
    create_icon(title, icon, cb) {
        let newicon = new Icon(title, icon, cb, this.frame);
        newicon.set_position(10, 10);
        newicon.draw();
        return newicon;
    }

    set_background(element, background_info) {
        switch(background_info.type) {
            case "color":
                element.setAttribute("fill", background_info.color);
                break;
            default:
                alert(`Unsupported background type ${background_info.type}`);
                break;
        }
    }

    max_window_width() {
        return this.background.width.baseVal.value;
    }

    max_window_height() {
        return this.background.height.baseVal.value;
    }
}

module.exports = Sietch;
