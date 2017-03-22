const Widget = require("js/widget")

describe("Widget class test", () => {
    const fakeX = 90;
    const fakeY = 267;

    beforeEach(() => {
        this.fakeParent = document.createElement("div");
    });

    afterEach(() => {
        delete this.fakeParent;
    });

    it("should be able to instantiate a 'g' widget", () => {
        expect(() => {
            let widget = new Widget(null, "g");
        }).not.to.throwException();
    });

    it("should set the parent correctly", () => {
        let widget = new Widget(this.fakeParent, "g");
        expect(widget.parent).to.be(fakeParent);
    });

    it("should retain the x and y coordinates", () => {
        let widget = new Widget(this.fakeParent, "g");
        widget.set_position(fakeX, fakeY)
        expect(widget.x).to.be(fakeX);
        expect(widget.y).to.be(fakeY);
    });

    it("should set the `transform` attribute to reflect (x,y) coordinates", () => {
        let widget = new Widget(this.fakeParent, "g");
        widget.set_position(fakeX, fakeY);
        widget.draw();
        const transform_attr = widget.widget.getAttribute("transform");
        expect(transform_attr).to.equal(`translate(${fakeX}, ${fakeY})`);
    });

    it("should append the widget as a child of the parent", () => {
        let widget = new Widget(this.fakeParent, "g");
        widget.set_position(fakeX, fakeY);

        let gs_before = fakeParent.getElementsByTagName("g");
        expect(gs_before.length).to.be(0);

        widget.draw();
        let gs_after = fakeParent.getElementsByTagName("g");
        expect(gs_after.length).to.be(1);
    });
});
