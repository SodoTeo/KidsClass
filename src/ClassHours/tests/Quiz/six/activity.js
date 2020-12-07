/*
Copyright (C) 2019 
Alkis Georgopoulos <alkisg@gmail.com>,
Dimitris Nikolos <dnikolos@gmail.com>.
SPDX-License-Identifier: CC-BY-SA-4.0*/

function onError(message, source, lineno, colno, error) {
  alert(sformat('Σφάλμα προγραμματιστή!\n'
    + 'message: {}\nsource: {}\nlineno: {}\ncolno: {}\nerror: {}',
  message, source, lineno, colno, error));
}

// ES6 string templates don't work in old Android WebView
function sformat(format) {
  var args = arguments;
  var i = 0;
  return format.replace(/{(\d*)}/g, function sformatReplace(match, number) {
    i += 1;
    if (typeof args[number] !== 'undefined') {
      return args[number];
    }
    if (typeof args[i] !== 'undefined') {
      return args[i];
    }
    return match;
  });
}

// Return an integer from 0 to num-1.
function random(num) {
  return Math.floor(Math.random() * num);
}

// Return a shuffled copy of an array.
function shuffle(a) {
  var result = a;
  var i;
  var j;
  var temp;

  for (i = 0; i < result.length; i += 1) {
    j = random(result.length);
    temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

function ge(id) {
  return document.getElementById(id);
}

function onResize(event) {
  var w = window.innerWidth;
  var h = window.innerHeight;
  if (w / h < 640 / 360) {
    document.body.style.fontSize = sformat('{}px', 10 * w / 640);
  } else {
    document.body.style.fontSize = sformat('{}px', 10 * h / 360);
  }
}

function doPreventDefault(event) {
  event.preventDefault();
}

function onHome(event) {
  window.history.back();
}

function onHelp(event) {
  ge('help').style.display = 'flex';
  ge('audiohelp').currentTime = 0;
  ge('audiohelp').play();

}

function onHelpHide(event) {
  ge('help').style.display = '';
  ge('audiohelp').pause();
}

function onAbout(event) {
  window.open('credits/index_DS_II.html');
}

function onFullScreen(event) {
  var doc = window.document;
  var docEl = doc.documentElement;
  var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen
    || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
  var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen
    || doc.webkitExitFullscreen || doc.msExitFullscreen;

  if (!doc.fullscreenElement && !doc.mozFullScreenElement
    && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
    requestFullScreen.call(docEl);
  } else {
    cancelFullScreen.call(doc);
  }
}
function setAnimation(eleName,aniName,aniDur){
  /* Code for Chrome, Safari, and Opera */
  ge(eleName).classList.add(aniName);
  ge(eleName).style.animationName = aniName;
  ge(eleName).style.animationDuration = aniDur;
}

//--------------------------------------END OF VISUAL----------------------------
//--------------------------------------START LOGIC------------------------------
var maze = false;
var levels = false;
const FD = 0;
const RT = 1;
const BK = 2;
const LT = 3;

const UP = 0;
const DN = 2; //down

const NORTH = 1
const WEST = 2
const SOUTH = 4
const EAST = 8
const SET = 16

const ENDOFPROGRAM = 0;
const STOP = 1;
const PLAYING = 2;
const PAUSED = 3

const idSuffix = ['fd','rt','bk','lt'];

var act = {};
var inter,inter1,inter2;

const allCommands = 30;

function showCommand(cmdCode,cell){
  for (var i=0; i<4; i++){//for all cmdCodes
    if (i==cmdCode){
      ge('cell'+cell.toString()+idSuffix[i]).style.display = '';

    }
    else{
      ge('cell'+cell.toString()+idSuffix[i]).style.display = 'none';
    }
  }
}

function eraseCell(cell){
    for (var i=0; i<4; i++){
        ge('cell'+cell.toString()+idSuffix[i]).style.display = 'none';
    }    
}

function drawProgram(){
  for (var cell=0; cell<allCommands; cell++){
  	if (cell<act.program.length){
  		showCommand(act.program[cell],cell);
  	}
  	else{
  		eraseCell(cell);
  	}
  }

}

function highlightCommand(i){
  //highlightCommand(-1) highlights none
  for (var cell = 0; cell<allCommands; cell++){
      ge('cell'+cell.toString()).classList.remove('cellHighlight');
    }
  if (i!=-1 && i<act.program.length){
    cell = i;
    ge('cell'+cell.toString()).classList.add('cellHighlight');
  }
}

function bindCommand(cmdName,cmdCode){
  ge(cmdName).onclick = function(event){
    if (!act.play || (act.play && act.pause)){//only add command if not in play
    	if (act.selected==-1 || (ge('cdelete1') == undefined)){//add to end
      		if (act.program.length<allCommands){
        		cell = act.program.length;
        		act.program.push(cmdCode);
        		showCommand(cmdCode,cell);
      		}
    	}
    	else{
    		cell = act.selected + 1;//add to next
    		act.program.splice(cell,0,cmdCode);//insert cmdCode in index cell
    		drawProgram();
    	}
  	}
  }
}

function deleteProgram(){
  var idSuffix = ['fd','rt','bk','lt'];

  act.program = [];

  drawProgram();
}

function deleteCommand(cmdNum){
  	if (!act.play || (act.play && act.pause)){
		var idSuffix = ['fd','rt','bk','lt'];
		if (act.selected >= 0 && act.selected < act.program.length){
			act.program.splice(act.selected,1);//delete command
			drawProgram();
			stop();
		}
	}
}

function setSquare(){
  ge('eprobot').style.marginTop = sformat('{}em',act.position[1]*6);
  ge('eprobot').style.marginLeft = sformat('{}em',act.position[0]*6.1);
}

function setOrientation(){
  switch (act.orientation){
    case FD: ge('eprobot').style.transform = 'rotate(0deg)'; break;
    case RT: ge('eprobot').style.transform = 'rotate(90deg)'; break;
    case BK: ge('eprobot').style.transform = 'rotate(180deg)'; break;
    case LT: ge('eprobot').style.transform = 'rotate(270deg)'; break;
  }
}


function marginsToCanvas(){
  //margins are in ems
  point = {};
  marginTop = parseInt(ge('eprobot').style.marginTop);
  marginLeft = parseInt(ge('eprobot').style.marginLeft);
  point.y = marginTop/6*30 + 15;
  point.x = marginLeft/6*43 + 21.5;//must be the scaling
  return(point);
}

function positionToCanvas(){
  position = act.position;
  point = {};
  point.y = position[1]*30 + 15;
  point.x = position[0]*43 + 21.5;
  return(point);
}


function clearTrace(){
  c = ge('mycanvas');
  ctx = c.getContext('2d');
  ctx.clearRect(0,0,c.width,c.height);
  if (maze){
  	drawMazeonCanvas();
  }
}

function trace(startpoint,endpoint){

  if (act.pencil){
    c = ge('mycanvas');
    ctx = c.getContext('2d');
    ctx.setLineDash([]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.strokeStyle = 'darkred';
    ctx.moveTo(startpoint.x,startpoint.y+0.5);
    ctx.lineTo(endpoint.x,endpoint.y+0.5);
    
    ctx.stroke();
    ctx.closePath();
  }
}

function moveSteps(curStep,startPos,endPos,steps,hor,draw){
	//returns true if move is done
	startpoint = marginsToCanvas();
	diff = (endPos-startPos)/steps;
    if (Math.abs((startPos + curStep*diff - endPos)) < 0.01){
      if (hor){
        ge('eprobot').style.marginLeft = sformat("{}em",endPos);
      }
      else{
        ge('eprobot').style.marginTop = sformat("{}em",endPos);
      }
      endpoint = marginsToCanvas();
      if (draw){
      	trace(startpoint,endpoint);
      }
      return(true);
    }
    else{
      if (hor){
        ge('eprobot').style.marginLeft = sformat("{}em",startPos + curStep*diff);
      }
      else{
       ge('eprobot').style.marginTop = sformat("{}em",startPos + curStep*diff); 
      }
      endpoint = marginsToCanvas();
      if (draw){
      	trace(startpoint,endpoint);
  	  }
      return(false);
  	}

}


function animationNo(curPos,dir,hor){
  /*animation with set interval 
    curPos is in ems
    ladybug moves in dir and returns back in curPos
    when hor = true marginLeft
    when hor = false marginTop
    when dir = true right/down
    when dir = false left/up
  */
  var endPos;
  if (dir){
    endPos = curPos + 1.5; //grid is 6em 1.5em is 1/4 of block of grid
  }
  else{
    endPos = curPos - 1.5;
  }
  var startPos = curPos;
  steps = 5;
  let i = 0;
  inter1 = setInterval(function(){
  	if (moveSteps(i,startPos,endPos,steps,hor,false)){
  		clearInterval(inter1);
  	}
  	else{
  		i++;
  	}
  },100);
  setTimeout(function(){
  	let i = 0;
  	inter2 = setInterval(function(){
  	if (moveSteps(i,endPos,startPos,steps,hor,false)){
  		clearInterval(inter2);
   		nextCommand();
  	}
  	else{
  		i++;
  	}
  },100);
  },500);
}

function animationSi(startPos,endPos,hor){
  /*animation with set interval 
    startpos is in ems
    endpos is in ems
    when hor = true marginLeft
    when hor = false marginTop
  */
  	steps = 10;
  	let i = 0;
  	inter = setInterval(function(){
    if (moveSteps(i,startPos,endPos,steps,hor,true)){
        clearInterval(inter);
        if (maze && ge('exit')){
          if (act.position[0] == act.exit[0] && act.position[1] == act.exit[1]){
            setAnimation('exit','success','2s');
            setTimeout(function(){setAnimation('exit','reset','0s'); stop();},2100);
          }
        }
        nextCommand();
      }
      else{
      	i++;
      }
	},100);
}

function animationAn(startAngle,endAngle,clock){
  /*angle animation startAngle and endAngle are in FD,LT,RT,BK format*/
  var startAngleDeg,endAngleDeg;
  switch (startAngle){
    case UP: startAngleDeg = 0; break;
    case RT: startAngleDeg = 90; break;
    case DN: startAngleDeg = 180; break;
    case LT: startAngleDeg = 270; break;
  }
  switch (endAngle){
    case UP: endAngleDeg = 0; break;
    case RT: endAngleDeg = 90; break;
    case DN: endAngleDeg = 180; break;
    case LT: endAngleDeg = 270; break;
  }
  var diff;
  if (clock){
    diff = 9; // 90 / 10 is 9 degrees for 1/10 of a second
  }
  else{
    diff = -9;
  }

  let i=0; 
  inter = setInterval(function(){
    newAngle = startAngleDeg + i*diff;
    if (Math.abs((360 + startAngleDeg + i*diff)%360 - endAngleDeg) < 0.01){
      ge('eprobot').style.transform = sformat('rotate({}deg)',endAngleDeg);
      clearInterval(inter);
      nextCommand();
    }
    else{
      ge('eprobot').style.transform = sformat('rotate({}deg)',startAngleDeg + i*diff);
      i++;
    }
  },100);
}

function canMove(d){
  //direction is NORTH,SOUTH,WEST,EAST
  if (maze){
  	return(!(g.maze[getId(act.position[0],4-act.position[1])]&d));
  }
  else{
  	return(true);//no obstacles if not in maze
  }
      
}

function moveUp(){
  if (act.position[1] > 0 && canMove(SOUTH)){//maze is drawn upside down
    animationSi(act.position[1]*6,(--act.position[1])*6,false);
  }
  else{
    animationNo(act.position[1]*6,false,false);
  }
}
function moveDown(){
  if (act.position[1] < 4 && canMove(NORTH)){//maze is drawn upside down
    animationSi(act.position[1]*6,(++act.position[1])*6,false);
  }
  else{
    animationNo(act.position[1]*6,true,false);
  }
}
function moveRight(){
  if (act.position[0] < 6 && canMove(EAST)){//grid is 6 cells wide
    animationSi(act.position[0]*6.1,(++act.position[0])*6.1,true);
  }
  else{
    animationNo(act.position[0]*6.1,true,true);
  }
}
function moveLeft(){
 if (act.position[0] > 0 && canMove(WEST)){
    animationSi(act.position[0]*6.1,(--act.position[0])*6.1,true);
  } 
  else{
    animationNo(act.position[0]*6.1,false,true);
  }
}

function setProgramState(state,dir){
	switch (state){
		case PLAYING:
			act.play = true;
			act.pause = false;
      if (ge('cdelete1')){
			   ge('cdelete1').style.cursor = 'default';}
			ge('cdelete').style.cursor = 'default';
			ge('cpencil').style.cursor = 'default'
			break;
		case PAUSED:
			act.play = true;
			act.pause = true;
			if (ge('cdelete1')){
         ge('cdelete1').style.cursor = 'pointer';}
			ge('cdelete').style.cursor = 'pointer';
			ge('cpencil').style.cursor = 'pointer';
			break;
		case ENDOFPROGRAM:
			highlightCommand(-1);
			act.play = false;
      		act.cmdExec = 0;
      		act.position = [0,4];
      		act.orientation = DIR;
      		act.selected = -1;
      		act.outofplace = true;
			if (ge('cdelete1')){
         ge('cdelete1').style.cursor = 'pointer';}
			ge('cdelete').style.cursor = 'pointer';
			ge('cpencil').style.cursor = 'pointer';
      		break;
      	case STOP:
      		highlightCommand(-1);
      		act.play = false;
      		act.cmdExec = 0;
      		act.position = [0,4];
      		act.orientation = DIR;
      		act.selected = -1;
      		act.outofplace = false;
      if (ge('cdelete1')){
        ge('cdelete1').style.cursor = 'pointer';  
      }
			ge('cdelete').style.cursor = 'pointer';
			ge('cpencil').style.cursor = 'pointer';
      		break;
	}
}


function nextCommand(){
  if (act.play && !act.pause){
  	if (act.cmdExec == act.program.length){
      setProgramState(ENDOFPROGRAM);
  	  return(0);// end of program
  	}
    highlightCommand(act.cmdExec);
    act.selectd = act.cmdExec;
    cmdCode = act.program[act.cmdExec];
    switch (cmdCode){
      case FD:
        switch (act.orientation){
          case UP: moveUp(); break;
          case RT: moveRight(); break;
          case LT: moveLeft(); break;
          case DN: moveDown(); break;
        }
      break;
      case BK:
        switch (act.orientation){
          case UP: moveDown(); break;
          case RT: moveLeft(); break;
          case LT: moveRight(); break;
          case DN: moveUp(); break;
        }    
      break;
      case RT:
        var startAngle = act.orientation;
        act.orientation = (act.orientation + 1) % 4;
        var endAngle = act.orientation;
        animationAn(startAngle,endAngle,true);
      break;
      case LT:
        var startAngle = act.orientation;
        act.orientation = (act.orientation + 3) % 4;
        var endAngle = act.orientation;
        animationAn(startAngle,endAngle,false);
      break;
    }
    act.cmdExec++;
    act.selected++;
  }
}

function restart(){
	deleteProgram();
	setProgramState(STOP);
	setOrientation();
    setSquare();
    highlightCommand(-1);//-1 means none
    clearTrace();
}

function stop(){
  setProgramState(STOP);
  setOrientation();
  setSquare();
  clearTrace();
  clearInterval(inter);
  clearInterval(inter1);
  clearInterval(inter2);
}

function runFast(currentCommand){
  if (!act.play || (act.play && act.pause)){
  	clearTrace();
    act.position = [0,4];
    act.orientation = DIR;
    
    for (i=0; i<=currentCommand; i++){
      startpoint = positionToCanvas();
      switch (act.program[i]){
        case FD:
          switch (act.orientation){
            case FD: if (act.position[1]>0 && canMove(SOUTH)) act.position[1]--; break;
            case RT: if (act.position[0]<6 && canMove(EAST) ) act.position[0]++; break;//grid is 6 cells wide
            case LT: if (act.position[0]>0 && canMove(WEST) ) act.position[0]--; break;
            case BK: if (act.position[1]<4 && canMove(NORTH)) act.position[1]++; break;
          }
        break;
        case BK:
          switch (act.orientation){
            case FD: if (act.position[1]<4 && canMove(NORTH)) act.position[1]++; break;
            case RT: if (act.position[0]>0 && canMove(WEST)) act.position[0]--; break;
            case LT: if (act.position[0]<6 && canMove(EAST)) act.position[0]++; break;//grid is 6 cells wide
            case BK: if (act.position[1]>0 && canMove(SOUTH)) act.position[1]--; break;
          }    
        break;
        case RT:
          act.orientation = (act.orientation + 1) % 4;
        break;
        case LT:
          act.orientation = (act.orientation + 3) % 4;
        break;
      }
      endpoint = positionToCanvas();
      trace(startpoint,endpoint);
    }
    setSquare();
    setOrientation();
    act.cmdExec = currentCommand+1;
    act.selected = currentCommand;
    setProgramState(PAUSED);
  }
}

function initLevel(){
    ge('level').innerHTML = act.level + 1;
    setAnimation('exit','reset','0s');
    newLevel(act.level);
    act.position = [0,4];
    act.orientation = DIR;
    setSquare();
    setOrientation();
    deleteProgram();
    highlightCommand(-1);
    act.play = false;
  }

function onMenuNext(){
    act.level = (act.level+1)%6;
    initLevel();
}

function init(maze,levels){
  //if maze is true then there is no background
  //and there is canvas

  //if levels there are levels

  // Internal level number is zero-based; but we display it as 1-based.
  // We allow/fix newLevel if it's outside its proper range.
  onResize();
  // Create a <style> element for animations, to avoid CORS issues on Chrome
  // TODO: dynamically? document.head.appendChild(document.createElement('style'));
  // Install event handlers
  if (ge('sel')){
  	ge('sel').selectedIndex = 0;//fix selected index after refresh
  }

  document.body.onresize = onResize;
  ge('bar_home').onclick = onHome;
  ge('bar_help').onclick = onHelp;
  ge('help').onclick = onHelpHide;
  ge('bar_about').onclick = onAbout;
  ge('bar_fullscreen').onclick = onFullScreen;
  for (i = 0; i < document.images.length; i += 1) {
    document.images[i].ondragstart = doPreventDefault;
  }
  if (levels){
  	act.level = 0;
    ge('bar_next').onclick = onMenuNext;
    ge('bar_previous').onclick = function(){
      act.level = (act.level+5)%6;
      initLevel();
      };
    ge('level').innerHTML = act.level + 1;
  }

  restart();
  newMaze(0);
  if (maze){
    ge('maze0').addEventListener('click',function(){newMaze(0);});
    ge('maze1').addEventListener('click',function(){newMaze(1);});
    ge('maze2').addEventListener('click',function(){newMaze(2);});
    ge('maze3').addEventListener('click',function(){newMaze(3);});
  }


  bindCommand('cforward',FD);
  bindCommand('cbackward',BK);
  bindCommand('cleft',LT);
  bindCommand('cright',RT);

  ge('cgo').addEventListener('click',function(event){
    if (!act.play){
    	if (act.outofplace){
    		act.cmdExec = 0;
    		clearTrace();
    	}
	    setProgramState(PLAYING);
	    setSquare();
	    setOrientation();
	    setTimeout(nextCommand,100);
    }
    else{
    	if (act.pause){
		    setProgramState(PLAYING);
		    setSquare();
		    setOrientation();
		    setTimeout(nextCommand,100);
    	}
    }
  });
  
  if (ge('cdelete1')){
  ge('cdelete1').addEventListener('click',deleteCommand);}

  ge('cdelete').addEventListener('click',function(){
  	if (!act.play || (act.play && act.pause)){
  		restart();
  	}
  });

  ge('cstop').addEventListener('click',stop);

  ge('cpause').addEventListener('click',function(){
  	setProgramState(PAUSED);
    act.selected = act.cmdExec-1;
  });
  ge('cpencil').addEventListener('click',function(){
      if (!act.play || (act.play && act.pause)){
        clearTrace();
        act.pencil = !act.pencil;
        if (act.pencil){
          ge('cpencil').src = "resource/pencil-on.svg";
          if (act.outofplace){
          	runFast(act.program.length-1);
          	setProgramState(ENDOFPROGRAM);
          }
          else{
          	runFast(act.selected);
          }
        }
        else{
          ge('cpencil').src = "resource/pencil-off.svg";
          clearTrace();
        }
      }
    });
  for (let i=0; i<allCommands; i++){
    ge('cell'+i.toString()).onclick = function(){
    	if (i<act.program.length){
    		runFast(i);
    		highlightCommand(i);
    		act.selected = i;
    		act.cmdExec = i + 1;
    		act.outofplace = false;
    	}
    };
  }
  ge('main').style.display = "";
  ge('loading').style.display = "none";

}


window.onload = function(){init(maze,levels)};
window.onerror = onError;

// Call onResize even before the images are loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', onResize);
} else {  // DOMContentLoaded` already fired
  onResize();
}


function changeGrid(){
  var grids = {"empty"    		:"resource/grid.svg",
               "alpha"    		:"resource/alphabet.svg",
               "alphanotext"	:"resource/alphabet_notext.svg",
               "dice"     		:"resource/dice.svg",
               "school"   		:"resource/school.svg",
               "instrtext"    	:"resource/instr.svg",
               "instr"			:"resource/instr_notext.svg",
               "toys"    		:"resource/toys.svg",
               "signs"    		:"resource/signs.svg",
               "shapestext"   	:"resource/shapes.svg",
               "shapes"			:"resource/shapes_notext.svg",
               "froutatext"   	:"resource/frouta.svg",
               "frouta"			:"resource/frouta_notext.svg",
               "colorstext"   	:"resource/colors.svg",
               "colors"			:"resource/colors_notext.svg",
               "monuments"		:"resource/monuments.svg",
               "greekmonuments" :"resource/greekmonuments.svg",
               "greece"   		:"resource/greece.svg",
               "flags"    		:"resource/flags.svg",
               "flowers"  		:"resource/flowers.svg",
               "playground"		:"resource/playground.svg",
}
  var s = ge('sel');
  var i = s.selectedIndex;
  var sv = s.options[i].value;
  var im = grids[sv];
  var imurl = "url('" + im + "')";

  ge('stage').style.backgroundImage = imurl;
}

function changeChar(){
  var chars = {"ladybug" :"resource/ladybug.svg",
               "car" :"resource/eprobot.svg",
               "student"  :"resource/student.svg",
}
  var s = ge('selchar');
  var i = s.selectedIndex;
  var sv = s.options[i].value;
  var im = chars[sv];

  ge('eprobot').src = im;
}

