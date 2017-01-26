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

        this.win = document.createElementNS("http://www.w3.org/2000/svg", "g");
        this.win.setAttribute("width", width);
        this.win.setAttribute("height", height);
        this.win.innerHTML = `
            <rect width="${this.width}" height="30px" fill="${default_theme.titlebar_bg}"></rect>

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

            <rect y="30px" id="main_frame"
                width="${this.width}" height="${this.height - 30}px"
                fill="${default_theme.window_bg}"></rect>
        `;

        let close_button = this.win.querySelector("#close_button");
        close_button.addEventListener("click", (e) => {
            e.preventDefault();
            if (this.on_quit()) {
                this.parent.removeChild(this.win);
                this.session.remove_window(this);
            }
        });

        let main_frame = this.win.querySelector("#main_frame");
        main_frame.addEventListener("click", this.on_click);
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
