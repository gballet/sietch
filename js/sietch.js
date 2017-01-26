const default_theme = {
    window_bg: "white",
    titlebar_bg: "blue",
    titlebar_fg: "white",
    titlebar_close_button_color: "red",
    desktop_background: {type: "color", color: "#ccc"}
}

class Window {
    constructor(title, width, height, parent, session) {
        this.width = width;
        this.height = height;
        this.parent = parent;
        this.session = session;
        this.title = title;

        // TODO use some templating engine instead of all that dynamically
        // created stuff.
        this.win = document.createElementNS("http://www.w3.org/2000/svg", "g");
        this.win.setAttribute("width", width);
        this.win.setAttribute("height", height);

        this.titlebar = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        this.titlebar.setAttribute("width", width);
        this.titlebar.setAttribute("height", "30px");
        this.titlebar.setAttribute("fill", default_theme.titlebar_bg);
        this.titlebar.title = document.createElementNS("http://www.w3.org/2000/svg", "text");
        this.titlebar.title.innerHTML = this.title;
        this.titlebar.title.setAttribute("x", 30);
        this.titlebar.title.setAttribute("y", 20);
        this.titlebar.title.setAttribute("font-size", 20);
        this.titlebar.title.setAttribute("font-family", "Verdana");
        this.titlebar.title.setAttribute("fill", default_theme.titlebar_fg);

        this.titlebar.close = document.createElementNS("http://www.w3.org/2000/svg", "g");
        this.titlebar.close.innerHTML = `
            <circle r="10" fill="${default_theme.titlebar_close_button_color}" stroke-width=1 stroke="black"></circle>
            <g transform="rotate(45)">
                <line x1="0" y1="-10" x2="0" y2="10" stroke="black"></line>
                <line y1="0" x1="-10" y2="0" x2="10" stroke="black"></line>
            </g>`;
        this.titlebar.close.setAttribute("transform", `translate(15,15)`);
        this.titlebar.close.addEventListener("click", (e) => {
            e.preventDefault();
            if (this.on_quit()) {
                this.parent.removeChild(this.win);
                this.session.remove_window(this);
            }
        });

        this.main_frame = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        this.main_frame.setAttribute("width", width);
        this.main_frame.setAttribute("height", `${height-30}px`);
        this.main_frame.setAttribute("y", "30px");
        this.main_frame.setAttribute("fill", default_theme.window_bg);

        this.main_frame.addEventListener("click", this.on_click);

        this.win.appendChild(this.titlebar);
        this.win.appendChild(this.titlebar.title);
        this.win.appendChild(this.titlebar.close);
        this.win.appendChild(this.main_frame);
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
        this.win.setAttribute("transform", `translate(${x}, ${y})`);
        this.parent.appendChild(this.win);
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
