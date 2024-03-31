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
