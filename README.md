# Project description

Sietch intends to recreate Desktop-style windowing systems in the browser. It is
relying on SVG to provide a cartesian coordinate system where windows can be
placed.

# Rationale

The W3C has tried to approach the web as a collection of pages (in all fairness,
that is what it is), formalizing technologies likes CSS that are working great
as long as your so-called  _web application_ follows a document flow.

Quickly enough, however, people have tried to use the web beyond what CSS and HTML
were intended for: applications that resemble what is found on a desktop. Those
applications require a more fine-grained positioning system than CSS is able to
offer.

The goal of this project isn't to replace CSS altogether, nor should it. It
simply seeks to provide an alternative to CSS & HTML for people seeking to build
web applications that behave much like the "old" desktop apps used to.

# Status

The project is in heavy development and is by no means production-ready. Help is
therefore appreciated.

# Usage

Currently, the system is only a collection of classes. The main class, `Sietch`,
manages the user context. This is the interface used to abstract all other classes.
It is initialized as follows:

    let sietch = new Sietch(container);

where `container` is a DOM element, typically a `<div>` that is to contain the
windowing system.

Windows can then be created with:

    sietch.create_window(300, 200, "A new window");
