const mazeColumns = 7;
const mazeRows = 5;




var g = {maze:[], cmds:[], positions:[]};
var solved;
var visited;
var path;
var endX, endY;

function check(x, y) {
    if (g.maze[getId(x, y)] & SET)
        return 1
    return 0
}

function getId(x, y) {
    return x + y * mazeColumns
}


function isPossible(x, y) {
    var wall = g.maze[getId(x, y)];
    var pos = [];
    wall = wall ^ SET;
    pos[0] = 0;
    if (x === 0) {
        wall = wall ^ WEST;
    }
    if (y === 0) {
        wall = wall ^ NORTH;
    }
    if (x === mazeColumns - 1) {
        wall = wall ^ EAST;
    }
    if (y === mazeRows - 1) {
        wall = wall ^ SOUTH;
    }
    if (wall & EAST) {
        if (check(x + 1, y) === 0) {
            pos[0] = pos[0] + 1;
            pos[pos[0]] = EAST;
        }
    }
    if (wall & SOUTH) {
        if (check(x, y + 1) === 0) {
            pos[0] = pos[0] + 1;
            pos[pos[0]] = SOUTH;
        }
    }
    if (wall & WEST) {
        if (check(x - 1, y) === 0) {
            pos[0] = pos[0] + 1;
            pos[pos[0]] = WEST;
        }
    }
    if (wall & NORTH) {
        if (check(x, y - 1) === 0) {
            pos[0] = pos[0] + 1;
            pos[pos[0]] = NORTH;
        }
    }
    return pos;
}



function drawSquare(squareX,squareY,squareCode){//thanks @alkisg
    var c = document.getElementById("mycanvas");
    var ctx = c.getContext("2d");
    var gWidth = 42.3;//must be the scaling
    var gHeight = 30;
    ctx.lineWidth = 0.2;
    ctx.setLineDash([5,15]);
    ctx.beginPath();
    ctx.strokeRect(squareX,squareY,gWidth,gHeight);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.setLineDash([]);
    ctx.beginPath();
    if (squareCode & 1) {
        ctx.moveTo(squareX,squareY+gHeight);
        ctx.lineTo(squareX+gWidth,squareY+gHeight);
    }
    if (squareCode & 2) {
        ctx.moveTo(squareX,squareY);
        ctx.lineTo(squareX,squareY+gHeight);
    }
    if (squareCode & 4) {
        ctx.moveTo(squareX,squareY);
        ctx.lineTo(squareX+gWidth,squareY);
    }
    if (squareCode & 8) {
        ctx.moveTo(squareX+gWidth,squareY);
        ctx.lineTo(squareX+gWidth,squareY+gHeight);
    }
    ctx.stroke();
    ctx.closePath();
}

function generateMaze(x, y) {
    g.maze[getId(x, y)] = g.maze[getId(x, y)] + SET;
    var po = isPossible(x, y);
    while (po[0] > 0) {
        var ran = po[Math.floor(Math.random() * po[0]) + 1];
        switch (ran) {
        case EAST:
            g.maze[getId(x, y)] = g.maze[getId(x, y)] ^ EAST;
            g.maze[getId(x + 1, y)] = g.maze[getId(x + 1, y)] ^ WEST;
            generateMaze(x + 1, y);
            break
        case SOUTH:
            g.maze[getId(x, y)] = g.maze[getId(x, y)] ^ SOUTH;
            g.maze[getId(x, y + 1)] = g.maze[getId(x, y + 1)] ^ NORTH;
            generateMaze(x, y + 1);
            break
        case WEST:
            g.maze[getId(x, y)] = g.maze[getId(x, y)] ^ WEST;
            g.maze[getId(x - 1, y)] = g.maze[getId(x - 1, y)] ^ EAST;
            generateMaze(x - 1, y);
            break
        case NORTH:
            g.maze[getId(x, y)] = g.maze[getId(x, y)] ^ NORTH;
            g.maze[getId(x, y - 1)] = g.maze[getId(x, y - 1)] ^ SOUTH;
            generateMaze(x, y - 1);
            break
        }
        po = isPossible(x, y);
    }
}

function drawMazeonCanvas(){
    ge('stage').style.background = "none";
    ge('stage').style.backgroundColor = "white";
    c = document.getElementById('mycanvas');
    ctx = c.getContext("2d");
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.fillRect(0,0,c.width-2,c.height);

    ctx.strokeRect(0.5,0.5,c.width-3,c.height-1);
    
    for (var i=0; i<mazeColumns-1; i++)
    {
        xaxis = (i+1)*42.5+i%2*0.5;
        ctx.beginPath();
        ctx.setLineDash([5]);
        ctx.lineWidth = 0.5;
        ctx.strokeStyle = 'gray';
        ctx.moveTo(xaxis,0);
        ctx.lineTo(xaxis,c.height-1)
        ctx.stroke();
        ctx.closePath();
        ctx.beginPath();
        ctx.setLineDash([]);
        ctx.lineWidth = 1;
        ctx.lineCap = 'round'
        ctx.strokeStyle = 'black';
        inVerLine = false;
        for (var j=0; j<mazeRows; j++){
            /*drawSquare(i*42.6,120-j*30,g.maze[getId(i,j)]);*/
            
            if (g.maze[getId(i,j)]&8){
                if (!inVerLine){
                    ctx.moveTo(xaxis,120-j*30+30);
                    inVerLine = true;
                }
            }
            else{
                if (inVerLine){
                    ctx.lineTo(xaxis,120-j*30+30)
                    inVerLine = false;
                }
            }

        }
        if (inVerLine){
            ctx.lineTo(xaxis,120-j*30+30)
            inVerLine = false;
        }
        ctx.stroke();
        ctx.closePath();
    }
    

    ctx.beginPath();
    for (var j=0; j<mazeRows; j++)
    {
        yaxis = 120-j*30+0.5+30;
        ctx.beginPath();
        ctx.setLineDash([5]);
        ctx.lineWidth = 0.5;
        ctx.strokeStyle = 'gray';
        ctx.moveTo(0,yaxis);
        ctx.lineTo(c.width-1,yaxis);
        ctx.stroke();
        ctx.closePath();
        ctx.beginPath();
        ctx.setLineDash([]);
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'black';
        inHorLine = false;
        for (var i=0; i<mazeColumns; i++){
            if (g.maze[getId(i,j)]&1){
                if (!inHorLine){
                    ctx.moveTo(i*42.5,yaxis);
                    inHorLine = true;
                }
            }
            else{
                if (inHorLine){
                    ctx.lineTo(i*42.5,yaxis)
                    inHorLine = false;
                }
            }

        }
        if (inHorLine){
            ctx.lineTo(i*42.5,yaxis)
            inHorLine = false;
        }
        ctx.stroke();
        ctx.closePath();

    }
}

function newMaze(mazenum){
    
	level = 0;
	act.level  = 0;
    g = null;
    g = {maze: []};
    for (var id = 0; id < mazeColumns * mazeRows; ++id) {
        g.maze[id] = 15;
    }
    switch (mazenum){
        case 0: 
            // Generate g.maze 
            generateMaze(Math.floor(Math.random() * mazeColumns),
                     Math.floor(Math.random() * mazeRows));
            
            // Remove set 
            for (var id = 0; id < mazeColumns * mazeRows; ++id) {
                g.maze[id] = g.maze[id] ^ SET
            }
            break;
        case 1:
            g.maze = [ 3,13, 7, 5, 1, 5, 9,10, 3, 5, 5,12,11,10, 6,12, 3, 5, 5, 4,12, 3, 9,10, 3, 9, 7, 9,14, 6, 4,12, 6, 5,12];
            break;
        case 2:
            g.maze = [ 3, 1, 9, 3, 1, 5, 9,14,10,10,14,10, 3,12, 3,12, 6, 5,12, 6, 9, 6, 9,11, 3, 5, 5,12, 7,12, 6, 4, 5, 5,13];
            break;
        case 3:
            g.maze = [ 3,13, 3, 5, 5, 1,13, 6, 9, 2, 5,13, 6, 9, 3,12,10, 3, 5, 5, 8, 2, 5,12,10, 3,13,10,14, 7, 5,12, 6, 5,12];
            break;
        }    

    
        console.log(g.maze);
    //debug    
    //g.maze = [3,13,7,5,1,5,9,10,3,5,5,12,11,10,6,12,3,5,5,4,12,3,9,10,3,9,7,9,14,6,4,12,6,5,12];
    drawMazeonCanvas();

    //that's the door x,y in the original
    endX = 6;
    endY = 4;
    solved = false;

    visited = [];
    for (var id = 0; id < mazeColumns * mazeRows; ++id) {
       visited[id] = false;
    }
    path = [];

    recursiveSolve(0,0);
    g.positions = [];
    g.cmds = pathtoCommands(path);
    if (mazenum == 0){//when everything is random we allow some random flower position
	    switch(level){
	        case 0: pIndex = 2+Math.floor(Math.random()*2); break;
	        case 1: pIndex = 4+Math.floor(Math.random()*3); break;
	        case 2: pIndex = 8+Math.floor(Math.random()*3); break;
	        case 3: pIndex = 12+Math.floor(Math.random()*3); break;
	        case 4: pIndex = 16+Math.floor(Math.random()*3); break;
	        case 5: pIndex = 20+Math.floor(Math.random()*3); break;
	    }
	}
	else{
		switch(level){//same flower positions in the fix mazes
	        case 0: pIndex = 3; break;
	        case 1: pIndex = 6; break;
	        case 2: pIndex = 10; break;
	        case 3: pIndex = 15; break;
	        case 4: pIndex = 18; break;
	        case 5: pIndex = 22; break;
		}
	}
    if (pIndex > g.positions.length-1){
        pIndex = g.positions.length-1;
    }
    act.exit = [g.positions[pIndex].x,4-g.positions[pIndex].y];
    ge('exit').style.marginLeft = sformat('{}em',act.exit[0]*6);
    ge('exit').style.marginTop = sformat('{}em',act.exit[1]*6);
    if (levels){
        ge('level').innerHTML = act.level + 1;
    }
}


function newLevel(level){
    var pIndex;
    drawMazeonCanvas();
    //that's the door x,y in the original
    endX = 6;
    endY = 4;
    solved = false;

    visited = [];
    for (var id = 0; id < mazeColumns * mazeRows; ++id) {
       visited[id] = false;
    }
    path = [];

    recursiveSolve(0,0);
    g.positions = [];
    g.cmds = pathtoCommands(path);
    switch(level){
        case 0: pIndex = 2+Math.floor(Math.random()*2); break;
        case 1: pIndex = 4+Math.floor(Math.random()*3); break;
        case 2: pIndex = 8+Math.floor(Math.random()*3); break;
        case 3: pIndex = 12+Math.floor(Math.random()*3); break;
        case 4: pIndex = 16+Math.floor(Math.random()*3); break;
        case 5: pIndex = 20+Math.floor(Math.random()*3); break;
    }
    if (pIndex > g.positions.length-1){
        pIndex = g.positions.length-1;
    }
    act.exit = [g.positions[pIndex].x,4-g.positions[pIndex].y];
    ge('exit').style.marginLeft = sformat('{}em',act.exit[0]*6.2);
    ge('exit').style.marginTop = sformat('{}em',act.exit[1]*6);
    if (levels){
        ge('level').innerHTML = act.level + 1;
    }

}




function addToPath(cx,cy){
    path.unshift({x:cx,y:cy});
}
function recursiveSolve(x, y) {
    if ((x == endX) && (y == endY)){
        addToPath(x,y);
        return(true); // If you reached the end
    } 
    if (visited[getId(x,y)]){
        return(false);
    }
    visited[getId(x,y)] = true;
    if ((x != 0) && ((g.maze[getId(x,y)] & WEST) == 0)){ // Checks if i can go left
        if (recursiveSolve(x-1, y)) { // Recalls method one to the left
            addToPath(x,y);
            return(true);
        }
    }
    if ((x != mazeColumns - 1) && ((g.maze[getId(x,y)] & EAST) == 0)){ // Checks if i can go right
        if (recursiveSolve(x+1, y)) { // Recalls method one to the right
            addToPath(x,y);
            return(true);
        }
    }
    if ((y != 0) && ((g.maze[getId(x,y)] & NORTH) ==0)) { // Checks if i can go up
        if (recursiveSolve(x, y-1)) { // Recalls method one up
            addToPath(x,y);
            return(true);
        }
    }
    if ((y != mazeRows - 1) && ((g.maze[getId(x,y)] & SOUTH)==0)){ // Checks if i can go down
        if (recursiveSolve(x, y+1)) { // Recalls method one down
            addToPath(x,y);
            return(true);
        }
    }
    return false;
}

function pathtoCommands(p){
    cmds = [];
    //assume starting from (0,0) and looking up
    direction = FD;
    i=0;
    while (i<p.length-1){
        var diff = [p[i+1].x - p[i].x, p[i+1].y - p[i].y];
        if ((diff[0] == 1) && (diff[1] == 0)){
            switch (direction){
                case FD: cmds.push('RT'); direction = RT; break;
                case RT: cmds.push('FD'); i++; break;
                case LT: cmds.push('RT'); direction = FD; break;
                case BK: cmds.push('LT'); direction = RT; break;
            }
        }
        if ((diff[0] == -1) && (diff[1] == 0)){
            switch (direction){
                case FD: cmds.push('LT'); direction = LT; break;
                case RT: cmds.push('LT'); direction = BK; break;
                case LT: cmds.push('FD'); i++; break;
                case BK: cmds.push('RT'); direction = LT; break;
            }
        }
        if ((diff[0] == 0) && (diff[1] == 1)){
            switch (direction){
                case FD: cmds.push('FD'); i++; break;
                case RT: cmds.push('LT'); direction = FD; break;
                case LT: cmds.push('RT'); direction = FD; break;
                case BK: cmds.push('RT'); direction = LT; break;
            }

        }
        if ((diff[0] == 0) && (diff[1] == -1)){
            switch (direction){
                case FD: cmds.push('RT'); direction = RT; break;
                case RT: cmds.push('RT'); direction = BK; break;
                case LT: cmds.push('LT'); direction = BK; break;
                case BK: cmds.push('FD'); i++; break;
            }

        }
        g.positions.push({x:p[i].x,y:p[i].y});
    }
    return(cmds);
}








