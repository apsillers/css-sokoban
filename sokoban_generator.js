/*
MIT License

Copyright (c) 2024 Andrew Sillers

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

var template = `<html>
<head>
<style>

p {
  min-height: 100px;
}

p > span > a {
  display: block;
  width: 450px;
  max-width: 90%;
  background-color: black;
  color: white;
  font-family: monospace;
  text-align: center;
  padding: 30px 0;
  font-weight: bold;
  margin: auto;
  font-size: 18px;
}

p > span {
  display: block;
  position: absolute;
  width: 100%;
}

p > a:target {
  display: block;
  position: relative;
  width: 500px;
  max-width: 100%;
  background-color: black;
  margin: auto;
}

p > a:target b:nth-child(1):not(:only-child) {
  font-family: monospace;
  background-color: black;
  color: white;
  font-size: 14px;
  width: 100%;
  display: block;
  height: 80px;
  margin: auto;
}

p > a:target b:only-child {
  padding-top: 80px;
}

p > a:target b:last-child {
  font-family: monospace;
  background-color: black;
  color: white;
  font-size: 40px;
  overflow-wrap: anywhere;
  width: 200px;
  display: block;
  margin: auto;
  text-align: center;
  text-decoration: none;
}

p > a {
  display: none;
}

a+b {
  display: none;
}

a:target + b {
  display: block;
  width: 500px;
  max-width: 100%;
  text-align: center;
  margin: auto;
}

b a {
  padding: 5 15px;
  font-family: sans-serif;
  color: blue;
  font-size: 30pt;
}

p a i {
	color: #78F;
	font-style: normal;
}

p a s {
	color: #4F4;
	text-decoration: none;
}

p a strong {
	color: yellow;
	font-style: normal;
}

p a em {
	color: red;
	font-style: normal;
}

p a u {
	color: #F4F;
	text-decoration: none;
}

b a:nth-child(1)::after {
  content: "<";
}

b a:nth-child(2)::after {
  content: "v";
}

b a:nth-child(3)::after {
  content: "^";
}

b a:nth-child(4)::after {
  content: ">";
}
</style>
<meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
<p><span><a href="#1">#.0.^.# <u>Click to Begin...</u> #.@.$.# </a></span>`


var levelStartMsgs = [
"Welcome to Nethack, {y/n}! You are @, chaotic halfling wizard. Click arrows below to get around the walls (#) to the stairs (>).",
"Push boulders (0) out of the way to reach the stairs (>). You can't pull boulders. You feel confused!",
"You feel strong! You (@) showed the boulder (0) who's boss! Boulders (0) can't move into other boulders (0), walls (#), or stairs (>).",
"You (@) look similar to a boulder (0) but you're actually different entities! Boulders (0) fall into pits (^), you (@) can't!",
"Do you often make irreversible mistakes. Your browser's BACK functionality (button or swipe) resets to an earlier move. You feel relaxed!",
"The level is hard! You feel angry at video games! You hear the distant sound of someone touching grass.",
"You feel hopeful. You are beginning to feel hungry. You hear footsteps, or possibly just the echo of your own.",
"You were a vegetarian. You used no wishes. Your gold had meaning. It ends as it began: you (@) walking an ASCII grid, making your own purpose."
]

// HACK ALERT: I don't maintain gold state like I do level state, so you MUST ensure there is only one state in which you can collect each gold.
//  if you're allowed to pick up the gold when pit or boulders are in different states, you'll end up consuming all the gold messages pematurely
var goldCount = 0;
var goldMessages = [
"15 gold coins! You pick them up.",
"27 gold coins! You feel lucky!",
"41 gold coins! You feel doubtful you will ever spend this.",
"22 gold coins! You feel doubtful that you even exist in a universe in which this gold can be spent.",
"117 gold coins! Your pack feels heavy with the weight of your useless gold. You collect it anyway!",
"4 gold coins. It can't be spent, yet the gold still has whatever meaning you ascribe to it. It is yours alone; its meaning is known only to you.",
"22 gold coins! That's nice!",
"1 gold coin. This one feels like the most important one. You eat it. The gold coin tastes disgusting!"
]

// convert 1D string index to 2D x,y, assuming some wrapping width
function xy(index, width) {
	return [index % width, Math.floor(index/width)];
}

// convert 2D x,y into a 1D string index
function pos(x,y,width){
	return x + y*width;
}

// given a state string, width, and pos/neg/zero directions,
// make a sokoban move and return the resulting state string
function step(state, width, dX, dY) {
	var [level, message, field] = parseState(state);
	
	var startPos = field.indexOf("@");
	var [startX, startY] = xy(field.indexOf("@"), width);
	var targetPos = pos(startX+dX, startY+dY, width);
	var oneBeyondPos = pos(startX+dX*2, startY+dY*2, width);
	
	if(field[targetPos] == ">") {
		field = replacePos(field, startPos, ".");
		field = replacePos(field, targetPos, "@");
	    return [++level,"You decend the stairs... (Press any key.)",field].join("|");
	}
	// if moving into a wall, don't move
	if(field[targetPos] == "#") {
		return state;
	}
	
	if(field[targetPos] == "^") {
		if(level < 6) {
		    return [level,"You narrowly avoid falling into a deep pit!",field].join("|");
		} else {
			return [level,"",field].join("|");
		}
	}
	
	// if moving into a boulder...
	if(field[targetPos] == "0") {
		//...but past the boulder is a wall or another boulder, don't move
		if(field[oneBeyondPos] == "0" || field[oneBeyondPos] == "#" || field[oneBeyondPos] == ">") {
			return [level,"",field].join("|");
		}
		//...and the space beyond is clear, move
		if(field[oneBeyondPos] == ".") {
			field = replacePos(field, startPos, ".");
			field = replacePos(field, targetPos, "@");
			field = replacePos(field, oneBeyondPos, "0");
			return [level,"",field].join("|");
		}
		//...and the space beyond is a target, plug it up
		if(field[oneBeyondPos] == "^") {
			field = replacePos(field, startPos, ".");
			field = replacePos(field, targetPos, "@");
			field = replacePos(field, oneBeyondPos, ".");
			if(level < 6) {
			    return [level,"The boulder fills in the pit!",field].join("|");
			} else {
				return [level,"",field].join("|");
			}
		}
	}
	// if moving into an open spot, move there
	if(field[targetPos] == ".") {
		field = replacePos(field, startPos, ".");
		field = replacePos(field, targetPos, "@");
		return [level,"",field].join("|");
	}
	
	// if moving into gold, move there
	if(field[targetPos] == "$") {
		field = replacePos(field, startPos, ".");
		field = replacePos(field, targetPos, "@");
		return [level,goldMessages[goldCount++],field].join("|");
	}
	return state;
}

// replace index `pos` of a state string with the given `chr`
function replacePos(state, pos, chr) {
    return state.substr(0,pos) + chr + state.substr(pos+1);
}

// perform `step` for each cardinal direction and return all resulting states
// in [left, down, up, right] order
function stepOnceEachWay(state, width, levels) {
	return [[-1,0], [0,-1], [0,1], [1,0]].map(d=>step(state, width, d[0], d[1], levels));
}

function explore(levels, width) {
    var state = ["0",levelStartMsgs[0],levels[0].replace(/ /g,"")].join("|");
	var states = {};
	var stateId = 1;
	goldCount = 0;
	stateQueue = [state];
	while(stateQueue.length > 0) {
	    var state = stateQueue.pop();
		if(!(state in states)) {
			//console.log(state);
			var [level, message, field] = parseState(state);
			
		    //console.log(field.match(new RegExp(".{"+width+"}", "g")).join("\n"));
			
			// if this is a victoy state, all moves lead to next level
			if(state.indexOf("You decend") != -1 && levels.length) {
				var nextState = [level,levelStartMsgs[level],levels[level].replace(/ /g,"")].join("|");
				nextStates = [nextState, nextState, nextState, nextState];
			} else {
				var nextStates = stepOnceEachWay(state, width, levels);
			}
			
		    states[state] = { id: stateId++, next: nextStates }
			stateQueue.push(...nextStates);
		}
	}
	return states;
}

function serializeStates(states, width) {
    var html = "";

    for(var state in states) {
		var [level, message, field] = parseState(state);
		
	    var id = states[state].id.toString(36);
		var next = states[state].next;
		var [l, u, d, r] = next.map(s=>states[s].id.toString(36));
		
		field = field.match(new RegExp(".{"+width+"}", "g")).join(" ").replace(">","<s>&gt;</s>").replace("@","<em>@</em>").replaceAll("$","<strong>$</strong>").replaceAll("^","<u>^</u>").replaceAll("0", "<i>0</i>");
		//console.log(state.match(new RegExp(".{"+width+"}", "g")).join(" "))
		html += `<a id=${id} name=${id}>${message.length?"<b>"+message+"</b>":""}<b>${field}</b></a><b><a href=#${l} /><a href=#${d} /><a href=#${u} /><a href=#${r} /></b>`;
	}
    return template + html + "</p></body></html>";
}

function parseState(state) {
	return state.split("|");
}