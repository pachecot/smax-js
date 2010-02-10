# sax js

A sax-style parser for XML and HTML.

Designed with [node](http://nodejs.org/) in mind, but should work fine in the
browser or other CommonJS implementations.

## Usage

    var sax = require("./lib/sax"),
      strict = true, // set to false for html-mode
      parser = sax.parser(strict);
    
    parser.onerror = function (e) {
      // an error happened. 
    };
    parser.ontext = function (t) {
      // got some text.  t is the string of text.
    };
    parser.onopentag = function (node) {
      // opened a tag.  node has "name" and "attributes"
    };
    parser.onattribute = function (attr) {
      // an attribute.  attr has "name" and "value"
    };
    parser.onend = function () {
      // parser stream is done, and ready to have more stuff written to it.
    };
    
    parser.write('<xml>Hello, <who name="world">world</who>!</xml>').close();

## Arguments

Pass the following arguments to the parser function.  All are optional.

`strict` - Boolean. Whether or not to be a jerk. Default: `false`.

`opt` - Object bag of settings regarding string formatting.  All default to `false`.
Settings supported:

* `trim` - Boolean. Whether or not to trim text and comment nodes.
* `normalize` - Boolean. If true, then turn any whitespace into a single space.
* `lowercasetags` - Boolean. If true, then lowercase tags in loose mode, rather
  than uppercasing them.

## Methods

`write` - Write bytes onto the stream. You don't have to do this all at once. You
can keep writing as much as you want.

`close` - Close the stream. Once closed, no more data may be written until it is
done processing the buffer, which is signaled by the `end` event.

## Members

At all times, the parser object will have the following members:

`line`, `column`, `position` - Indications of the position in the XML document where
the parser currently is looking.

`closed` - Boolean indicating whether or not the parser can be written to.  If it's 
`true`, then wait for the `ready` event to write again.

`strict` - Boolean indicating whether or not the parser is a jerk.

`opt` - The options you passed into the constructor (or the defaults.)

And a bunch of other stuff that you probably shouldn't touch.

## Events

All events emit with a single argument. To listen to an event, assign a function to
`on<eventname>`. Functions get executed in the this-context of the parser object.
The list of supported events are also in the exported `EVENTS` array.

`error` - Indication that something bad happened. The error will be hanging out on
`parser.error`, and must be deleted before parsing can continue. By listening to
this event, you can keep an eye on that kind of stuff. Note: this happens *much*
more in strict mode. Argument: instance of `Error`.

`text` - Text node. Argument: string of text.

`doctype` - The `<!DOCTYPE` declaration. Argument: doctype body string.

`processinginstruction` - Stuff like `<?xml foo="blerg" ?>`. Argument: object with
`name` and `body` members. Attributes are not parsed, as processing instructions
have implementation dependent semantics.

`sgmldeclaration` - Random SGML declarations.  Stuff like `<!ENTITY p>` would trigger
this kind of event.  This is a weird thing to support, so it might go away at some
point.  SAX isn't intended to be used to parse SGML, after all.

`opentag` - An opening tag. Argument: object with `name` and `attributes`. In
non-strict mode, tag names are uppercased.

`closetag` - A closing tag. In loose mode, tags are auto-closed if their parent
closes. In strict mode, well-formedness is enforced.  Note that self-closing tags
will have `closeTag` emitted immediately after `openTag`.  Argument: tag name.

`attribute` - An attribute node.  Argument: object with `name` and `value`.

`comment` - A comment node.  Argument: the string of the comment.

`cdata` - A `<![CDATA[` block.  Argument: the string of random character data.

`end` - Indication that the closed stream has ended.

`ready` - Indication that the stream has reset, and is ready to be written to.

## Todo

Build an HTML parser on top of this.