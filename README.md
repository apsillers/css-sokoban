# CSS Sokoban

A generator for a CSS-only playable Sokoban game.

## General Idea

This code takes a set of Sokoban levels, fully enumerates all possible game states possible within those levels, and then generates CSS and HTML to render each of those states one at a time.

The central CSS mechanic is the [`:target`](https://developer.mozilla.org/en-US/docs/Web/CSS/:target) psuedo-class, which applies CSS rules to the element whose `id` matches the URL fragment (that's the part of the URL after the `#` sign). By clicking links with different fragment values, the user can control what state element is visible by a `:target { display: block; }` rule.

Each state is contained in an element with a unique `id` attribute, and the visibility of the active state is controlled by a `:target` CSS selector. Each state has links to different URL fragments

## Usage

Open `nethackgen.html` and open a developer console to call `explore` and `serializeStates`:

    var states = explore(["###### #@..># ######", "##### #>^0@# #####", ".@.... ...... ......"], 6);
    var html = serializeStates(states, 6);

## Functions

* `explore` takes level information and fully explores all possible states.
  * It takes a list of level strings and a width parameter.
  * It returns an object whose keys are state strings and whose values are objects with an `id` value and a `next` array showing the next possible states based on user input. (So, for 4-directional sokoban, there are 4 possible options.)

* `serializeStates` takes an object returned by `explore` and renders HTML and CSS for the playable game

## Map Features

A level map is a single string which is wrapped according to the `width` parameter into a 2D level. It can have the following features:

* `#` - wall
* `.` - empty space
* `@` - player
* `0` - boulder
* `^` - pit
* `>` - stairs

Mostly, the game follows Nethack rules, except that boulders can't be pushed onto staircases and the player can't fall into pits.

Level strings can have spaces, which are completely ignored and removed before any logic is done, but which can make your levels marginally easier to read and write.

## Future Work

* This kind of system could be used to serialize to CSS any game whose states are expressible as a [finite automata state graph](https://en.wikipedia.org/wiki/Deterministic_finite_automaton). (However, many games are intractably large.) Future work could separate the state-exploration code from the particulars of Sokoban logic, to allow different games to be serialized as CSS.

* This code renders the full text of each state in each HTML element. For games with a high volume of repeated rows of large length, it would be possible to render (some or all) rows of each state as elements with a `content` CSS rule. As a trivial example, if each state always started with `#####`, then a CSS rule could say `.state-elem::before { content: "#####"; }` and then omit the text in the HTML. This only works efficiently if the selector can be expressed more efficiently than simply repeating the text.

* This MIGHT be able to render a real-time game like Snake by using CSS animations. Each state would actually be a stack of states, which are progressively stripped away over time.

* I always thought it would be cool to do Sokoban with portals. Somebody should do Sokoban with portals in it.

## FAQ

### How does this work?

While it looks like you're moving our hero `@` around the board, you're actually clicking links to reveal and hide different states. This is, in fact, a much more complex implementation of a [tab-based view](https://archiveofourown.org/works/31474406) using the CSS `:target` selector. Each state has a board configuration, already completely rendered, plus four links to hide the current state and show a new state.

Structurally, it looks like this:

    <a id="1" name="1">
      <b>This is an initial message. Board state below.</b>
      <b>#.$..# ##.#.# #.@#.# #..#>#</b>
    </a>
    <b><a href="#2">Go Left</a><a href="#3">Go Up</a></b>
    
    <a id="2" name="2">
      <b>This is the state you get when you go left.</b>
      <b>#.$..# ##.#.# #@.#.# #..#>#</b>
    </a>
    <b><a href="#1">Go Back Right</a></b>
    
    <a id="3" name="3">
      <b>This is the state you get when you go up.</b>
      <b>#.$..# ##.#@# #..#.# #..#>#</b>
    </a>
    <b><a href="#1">Go Back Down</a></b>

Only one of these three states is displayed at one time, based on the CSS `:target` selector. This selector allows a visibility state to apply only to the element whose id property matches the URL "fragment" (that's the part after the `#` sign). When you click arrow links to navigate around, you're actually clicking on a link with a different URL fragment, which makes a different state (and a different set of navigation links for your next step) visible.

### Okay, but how did you make all these states? Surely you didn't type them out by hand?

I didn't! I wrote a computer program that could fully explore all possible Sokoban states based on an initial level setup.

It basically works like:

* Based on this board state, what happens if the player takes a step up? Or a step left? Right? Down?
* Now we have 4 additional states that we just generated. We attach them to our starting state, so we know all the ways the board can look after a single step.
* We also add those 4 steps to a list and go through them one at a time, figuring out what their next 4 states are. After we do that, we have 16 additional states!
* But some of those states are duplicates (e.g., stepping back to start after stepping only one space away) so we can skip generating those next states – we already know what all the next states look like from that position.
* Since Sokoban has finite states, eventually all states will be duplicates we've already seen before, and our process terminates.
* Finally, we take the dictionary that maps each state to its four next-states and write it out as HTML. Each state is given an ID, and those IDs are used to uniquely identify each state and the target of each link.
  * I used base 36 (basically, counting each digit through all numbers and letter, from 1 to z) but you could use any system that ensures states IDs are unique within the game
* Once we have our fully-explored states as HTML, we attach the CSS to make the magic happen!

### I looked at your HTML and the control links don't actually have arrows inside them?

I use CSS `content:` rules to populate the directional links with arrow emojis. The emojis aren't actually inside the HTML, but there's a rule that says "each first directional link always gets a left arrow, each second link gets an up arrow, etc." This saves a lot of space! It was a challenge to make all states of multiple Sokoban levels fit inside the 500,000 character limit of an AO3 work.

### One more HTML concern: it looks like your directional links aren't actually inside the `<a id="some_id">` that's supposed to be made visible by the `#some_id` URL fragment. Why isn't it in there? How does it still work?

The visibility trick works by matching element `id` to the URL fragment, but AO3 can only attach `id` attributes to `<a>` tags! No other type of element is allowed to have this property under AO3's parser.

This caused a problem: the directional links must be `<a>` tags also, but you can't put one `<a>` element inside of another one. The solution was to use the [CSS next-sibling combinator](https://developer.mozilla.org/en-US/docs/Web/CSS/Next-sibling_combinator) to say, "when you apply visibility rules to an <a> but :target, also apply a visibility rule to the element that comes immediately after it." In this case, that's always the `<b>` element holding the next-state directional links for each state.
