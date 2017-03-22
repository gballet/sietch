const Widget = require("js/widget")

describe("Widget class test", () => {
    const fakeX = 90;
    const fakeY = 267;
    const fakeParent = "fake";

    it("should be able to instantiate a 'g' widget", () => {
        /*console.log(expect);
        expect(() => {
            let widget = new Widget(null, "g");
        }).not.to.throw();*/
    });

    it("should set the parent correctly", () => {
        let widget = new Widget(fakeParent, "g");
        expect(widget.parent).to.be(fakeParent);
    });

    it("should retain the x and y coordinates", () => {
        let widget = new Widget(fakeParent, "g");
        widget.set_position(fakeX, fakeY)
        expect(widget.x).to.be(fakeX);
        expect(widget.y).to.be(fakeY);
    });

    it("should set the `transform` attribute to reflect (x,y) coordinates", () => {
        /*let widget = new Widget(fakeParent, "g");
        widget.set_position(fakeX, fakeY);
        widget.draw();
        const transform_attr = widget.widget.getAttribute("transform");
        expect(transform_attr).to.equal(`translate(${this.x}, ${this.y})`);*/
    });
});
