const default_theme = {
    window_bg: "white",
    titlebar_bg: "blue",
    titlebar_fg: "white",
    titlebar_close_button_color: "red",
    desktop_background: {type: "color", color: "#ccc"},
    icon_size: 64
}

class Button {
    constructor(title, width, height, onclick, parent, session) {
        this.title = title;
        this.parent = parent;
        this.onclick = onclick;
        this.pressed = false;
        this.x = 0;
        this.y = 0;

        this.button = document.createElementNS("http://www.w3.org/2000/svg", "g");
        this.button.innerHTML = `
            <rect x=0 y=0 width=${width} height=${height} fill="lightgrey"></rect>
            <text x=${width/2} height="${height/2}" alignment-baseline="middle" text=anchor="middle">${title}</text>
            <line x1=0 y1=0 x2=${width-1} y2=0 stroke="white"></line>
            <line x1=0 y1=0 y2=${height-1} x2=0 stroke="white"></line>
            <line x1=${width} y1=1 x2=${width} y2=${height} stroke="darkgrey"></line>
            <line x1=${width} y1=${height} y2=${height} x2=1 stroke="darkgrey"></line>
        `;
        this.button.addEventListener("mousedown", () => {
            this.pressed = true;
            this.invert_shadows();
        }, false);
        this.button.addEventListener("mouseleave", () => {
            if (this.pressed) {
                this.pressed = false;
                this.invert_shadows();
            }
        }, false);
        this.button.addEventListener("mouseup", () => {
            if (this.pressed) {
                this.pressed = false;
                this.invert_shadows();
                this.onclick();
            }
        }, false);
    }

    invert_shadows() {
        let lines = this.button.getElementsByTagName("line");
        for (let line of lines) {
            let color = line.getAttribute("stroke");
            if (color == "darkgrey")
                line.setAttribute("stroke", "white");
            else
                line.setAttribute("stroke", "darkgrey");
        }
    }

    set_position(x, y) {
        this.x = x;
        this.y = y;
    }

    draw() {
        console.log(this.parent, this.button);
        this.button.setAttribute("transform", `translate(${this.x}, ${this.y})`);
        this.parent.appendChild(this.button);
    }
}

class Icon {
    constructor(title, svgicon, callback, parent) {
        this.title = title;
        this.parent = parent;
        this.callback = callback;

        this.icon = document.createElementNS("http://www.w3.org/2000/svg", "g");

        // TODO add stroke='blue' to the rect if selected
        this.icon.innerHTML = `
            <rect x=0 y=0 width=64 height=64 fill="#0000"></rect>
            <g transform="translate(32, 32)">
                ${svgicon}
            </g>
            <text transform="translate(0, ${64 + 20})">${title}</text>
        `;
        this.icon.addEventListener('dblclick', (e) => {
            this.callback();
        });
    }

    draw(x, y) {
        this.x = x;
        this.y = y;
        this.icon.setAttribute("transform", `translate(${x}, ${y})`);
        this.parent.appendChild(this.icon);
    }
}

class Menu {
    // data is a set of tuples of format: {title, callback}
    constructor(data, parent, session) {
        this.data = data;
        this.parent = parent;
        this.session = session;

        // TODO check format for data
    }

    show(x,y) {
        this.menu = document.createElementNS("http://www.w3.org/2000/svg", "g");
        this.menu.x = x;
        this.menu.y = y;

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

    clicked(event) {
        let entry = Math.floor(+(event.pageY - this.menu.y) / 30);
        if (event.buttons == 0) {
            this.data[entry][1]();
        }
    }
}

class Window {
    constructor(title, width, height, parent, session) {
        this.width = width;
        this.height = height;
        this.parent = parent;
        this.session = session;
        this.title = title;
        this.children = [];

        this.win = document.createElementNS("http://www.w3.org/2000/svg", "g");
        this.win.setAttribute("width", width);
        this.win.setAttribute("height", height);
        this.win.innerHTML = `
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

            <text x="30" y="20"
                font-size="20" font-family="Verdana"
                fill="${default_theme.titlebar_fg}">${this.title}</text>

            <g id="main_frame" transform="translate(0, 30)"
                width="${this.width}" height="${this.height - 30}px">
                <rect width="${this.width}" height="${this.height - 30}px"
                fill="${default_theme.window_bg}"></rect>
            </g>
        `;

        let close_button = this.win.querySelector("#close_button");
        close_button.addEventListener("click", (e) => {
            e.preventDefault();
            if (this.on_quit()) {
                this.parent.removeChild(this.win);
                this.session.remove_window(this);
            }
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

    on_click(e) {
        console.log(e);
    }

    // Default callback: simply returns true, which means that the window
    // should be closed.
    on_quit() {
        return true;
    }

    draw(x, y) {
        this.x = x;
        this.y = y;
        this.win.setAttribute("transform", `translate(${x}, ${y})`);
        this.parent.appendChild(this.win);

        for (let child of this.children) {
            child.draw();
        }
    }

    add_child(child) {
        if (!this.children)
            this.children = [];
        this.children.push(child);
    }
}

class Sietch {
    constructor(element) {
        this.container = element;
        this.frame = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.frame.setAttribute("width", "100%");
        this.frame.setAttribute("height", "100%");

        this.background = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        this.background.setAttribute("width", "100%");
        this.background.setAttribute("height", "100%");
        this.set_background(this.background, default_theme.desktop_background);

        this.desktop_menu = new Menu([["New...", (e) => { alert("Not yet implemented"); }]], this.frame, this);

        this.background.addEventListener("contextmenu", (e) => {
            e.preventDefault();

            if (e.buttons == 2) {
                this.desktop_menu.show(e.pageX, e.pageY);
            }
        }, false);

        // Like old Windows(tm) time
        this.last_creation_offset = 0;

        this.frame.appendChild(this.background);
    }

    go() {
        this.container.appendChild(this.frame);
    }

    remove_window(win) {
        this.windows = this.windows.filter(w => w != win);
    }

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

    add_button(width, height, title, callback, win) {
        let button = new Button(title, width, height, callback, win.main_frame);
        win.add_child(button);
        win.draw(this.last_creation_offset, this.last_creation_offset);
        return button;
    }

    create_icon(title, icon, cb) {
        let newicon = new Icon(title, icon, cb, this.frame);
        newicon.draw(10, 10);
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
}
