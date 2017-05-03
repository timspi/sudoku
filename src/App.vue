tui<template>
  <div id="app">
    <header>
      <img @click="showMenu = true" src="static/icon.png" class="icon left">
      <img @click="redirect" src="/icon.png" class="icon right">
      <h1>SUDOKU</h1>
    </header>

    <Settings v-if="isSettings" @createNew="createNew"></Settings>
    <div v-if="!isSettings">
      <span @click="isPause = true" style="cursor: pointer">⏱️ Zeit: {{ timeStr }}</span>
      <Field @keyup.enter="solve" @cellclicked="cellClick" :sudoku="sudokuField"
              :xSize="xSize" :ySize="ySize" :styleIndex="style" :custom="custom"></Field>
      <Buttons @buttonclicked="buttonClick" :helpmode="helpMode"
                 :styleIndex="style" :custom="custom"></Buttons>
    </div>

    <div v-if="showMenu" @click="showMenu = false" class="menu">
      <span @click="solve"><img src="https://image.flaticon.com/icons/svg/13/13845.svg">Lösung zeigen</span>
      <span @click="restart"><img src="https://image.flaticon.com/icons/svg/103/103253.svg">Neues Sudoku</span>
      <span @click="isPause = true"><img src="https://image.flaticon.com/icons/svg/109/109500.svg">Spiel pausieren</span>
      <span @click="isSettings = true"><img src="https://image.flaticon.com/icons/svg/70/70367.svg">Einstellungen</span>
    </div>
    <div @click="showMenu = false" v-if="showMenu" class="fullpage"></div>
    <div @click="isPause = false" v-if="isPause && !isSettings" class="shadow fullpage"></div>
    <div v-if="isPause && !isSettings" class="dialog">
      <h2>{{ (isDone ? 'Herzlichen Glückwunsch' : 'Pause') }}</h2>
      <div>{{ (isDone ? 'Sudoku in ' + timeStr + ' gelöst.' : 'Das Spiel ist pausiert.') }}</div>
      <button @click="isPause = false">{{ (isDone ? 'Schließen' : 'Fortsetzen') }}</button>
    </div>
  </div>
</template>

<script>
import Field from './components/Field'
import Buttons from './components/Buttons'
import Settings from './components/Settings'

export default {
  name: 'app',
  components: {
    Field, Buttons, Settings
  },
  data () {
    return {
      sudokuField: [],
      active: -1,
      helpMode: false,
      isPause: false,
      isDone: false,
      showMenu: false,
      isSettings: false,
      sudokuElapsedTime: 0,
      hidden: '',
      visibilityChange: '',
      xSize: 3,
      ySize: 2,
      emptyCells: 40,
      style: 0,
      custom: []
    }
  },
  computed: {
    timeStr: function() {
      var m = Math.floor(this.sudokuElapsedTime/60);
      return (m ? m  + " min " : '') + this.sudokuElapsedTime % 60 + " sek";
    },
    size: function() {
      return this.xSize*this.ySize;
    },
    cells: function() {
      return Math.pow(this.size, 2);
    }
  },
  methods: {
    buttonClick: function(data) {
      if(data.id == 0) {
        this.helpMode = !this.helpMode;
      } else {
        if(this.active != -1) {
          if(this.helpMode) {
            this.sudokuField[this.active].value = 0;
            var index = this.sudokuField[this.active].help.indexOf(data.id);
            if(index == -1) {
              this.sudokuField[this.active].help.push(data.id);
            } else {
              this.sudokuField[this.active].help.splice(index, 1);
            }
          } else {
            this.sudokuField[this.active].value = data.id;
            this.checkSudoku();
          }
        }
        this.$localStorage.set('sudoku', this.sudokuField);
      }
    },
    cellClick: function(data) {
      this.active = data.active;
    },
    solve: function() {
      var sudoku = new Array();
      for(var i = 0; i < this.sudokuField.length; i++) {
        sudoku.push(this.sudokuField[i].value);
      }

      var solver = sudoku_solver(this.xSize, this.ySize);
      var solarr = solver(sudoku, 2);
      var solved = solarr[0];
      /*var solved = solve(sudoku);
      console.log(solved);*/
      for(var i = 0; i < solved.length; i++) {
        this.sudokuField[i].value = solved[i];
      }

    },
    restart: function() {
      var solver = sudoku_solver(this.xSize, this.ySize);

      // Create an empty field
      var arr = [];
      var totalTries = 0;

      // Try to generate a sudoku
      outer:
      while(totalTries < 1000) {
        totalTries++;

        // Fill array with zeros
        arr = [];
        for(var i = 0; i < 81; i++) {
          arr.push(0);
        }

        // Add (e.g. 9x9: 81/3=27) random numbers without rule conflicts
        for(var i = 0; i < this.cells/3; i++) {
          while(true) {
            var pos = getRandomInt(0, this.cells);
            var val = getRandomInt(0, this.size);
            if(this.isPossibleCell(val, pos, arr)) {
              //console.log("Put " + val + " in arr at pos " + pos);
              arr[pos] = val;
              break;
            }
          }
        }

        // Try to solve sudoku
        console.log("Try to solve sudoku");
        var solarr = solver(arr.slice(), 2);
        console.log("=> Solutions: " + solarr.length);
        if(solarr.length > 0) {
          arr = solarr[0];
          break outer;
        }
      }

      console.log("Generated sudoku in " + totalTries + " tries.");
      console.log(arr);

      // Solve it, this will generate a random solved sudoku
      //arr = solve(arr);

      // Now remove values until it has only one solution
      var counter = 0;
      var tries = 0;

      while(counter < this.emptyCells && tries < this.cells * 50) {
        tries++;
        var index = Math.floor(Math.random() * arr.length);
        var val = arr[index];
        if(val != 0) {
          arr[index] = 0;

          var solarr = solver(arr.slice(), 2)
          //if(arraysEqual(solarr[0], solarr[1])) {
          if(solarr.length == 1) {
            // Exactly one solution -> proceed
            counter++;
          } else {
            // Sudoku cannot be solved exactly anymore, put number back in arr and try another
            arr[index] = val;
          }
        }
      }

      console.log("Removed " + counter + " in " + tries + " tries.");


      this.sudokuField = [];
      for(var i = 0; i < this.cells; i++) {
        var val = arr[i];
        this.sudokuField.push({id: i, value: val, fixed: val != 0, help: []});
      }
      this.sudokuField = this.$localStorage.set("sudoku", this.sudokuField);
      this.$localStorage.set("sudokuElapsedTime", 0);
      this.sudokuElapsedTime = 0;
      this.isPause = false;
      this.isDone = false;
    },
    isPossibleCell: function(number, cell, sudoku) {
      var row = Math.floor(cell / this.size);
      var col = cell % this.size;
      var block = (Math.floor(row) / this.xSize) * this.xSize + Math.floor(col / this.ySize);

    	for(var i = 0; i < this.size; i++) {
    		if(sudoku[row*this.size + i] == number || // Check row
            sudoku[col + this.size*i] == number || // Check col
            sudoku[Math.floor(block/this.xSize)*this.xSize*this.size + i%this.ySize + this.size*Math.floor(i/this.ySize) + this.ySize*(block%this.ySize)] == number) { // Check block
    			return false;
    		}
    	}

    	return true;
    },
    checkSudoku: function() {
      var sudoku = new Array();
      for(var i = 0; i < this.sudokuField.length; i++) {
        sudoku.push(this.sudokuField[i].value);
      }
      if(isSolvedSudoku(sudoku)) {
        this.isPause = true;
        this.isDone = true;
      }
    },
    createNew: function(data) {
      this.isSettings = false;
      if(data) {
        console.log(data);
        this.style = data.style;
        this.$localStorage.set('style', this.style);

        this.emptyCells = data.emptyCells;
        this.$localStorage.set('emptyCells', this.emptyCells);

        this.custom = data.custom;
        if(this.style == 4) this.$localStorage.set('custom', this.custom);

        if(data.xSize != this.xSize) {
          this.xSize = data.xSize;
          this.$localStorage.set('xSize', this.xSize);

          this.ySize = data.ySize;
          this.$localStorage.set('ySize', this.ySize);

          this.sudokuField = [];
          this.restart();
        }
      }
    },
    handleVisibilityChange: function() {
      if (document[this.hidden]) {
        this.isPause = true;
      } else {
        //this.isPause = false;
      }
    },
    redirect: function() {
      location.href='/';
    }
  },
  created: function() {

    this.sudokuField = this.$localStorage.get("sudoku");
    this.xSize = this.$localStorage.get("xSize");
    this.ySize = this.$localStorage.get("ySize");

    this.style = this.$localStorage.get("style");
    this.custom = this.$localStorage.get("custom");
    this.emptyCells = this.$localStorage.get('emptyCells');

    if(this.sudokuField.length == 0) {
      this.restart();
    } else {
      this.checkSudoku();
    }
    this.sudokuElapsedTime = this.$localStorage.get("sudokuElapsedTime");
    window.setInterval(() => {
      if(!(this.isPause || this.isDone)) {
        this.sudokuElapsedTime += 1; //Math.trunc((new Date()).getTime() / 1000);
        this.$localStorage.set("sudokuElapsedTime", this.sudokuElapsedTime);
      }
    },1000);

    // Handle visibility changes
    if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support
      this.hidden = "hidden";
      this.visibilityChange = "visibilitychange";
    } else if (typeof document.msHidden !== "undefined") {
      this.hidden = "msHidden";
      this.visibilityChange = "msvisibilitychange";
    } else if (typeof document.webkitHidden !== "undefined") {
      this.hidden = "webkitHidden";
      this.visibilityChange = "webkitvisibilitychange";
    }

    // Warn if the browser doesn't support addEventListener or the Page Visibility API
    if (typeof document.addEventListener === "undefined" || typeof document[this.hidden] === "undefined") {
      console.error("The auto pause requires a browser, such as Google Chrome or Firefox, that supports the Page Visibility API.");
    } else {
      // Handle page visibility change
      document.addEventListener(this.visibilityChange, this.handleVisibilityChange, false);
    }
  }
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

function arraysEqual(arr1, arr2) {
    if(arr1.length !== arr2.length)
        return false;
    for(var i = arr1.length; i--;) {
        if(arr1[i] !== arr2[i])
            return false;
    }

    return true;
}


// RUBBISH from here !!!

// given a sudoku cell, returns the row
function returnRow(cell) {
	return Math.floor(cell / 9);
}

// given a sudoku cell, returns the column
function returnCol(cell) {
	return cell % 9;
}

// given a sudoku cell, returns the 3x3 block
function returnBlock(cell) {
	return Math.floor(returnRow(cell) / 3) * 3 + Math.floor(returnCol(cell) / 3);
}

// given a number, a row and a sudoku, returns true if the number can be placed in the row
function isPossibleRow(number,row,sudoku) {
	for (var i=0; i<=8; i++) {
		if (sudoku[row*9+i] == number) {
			return false;
		}
	}
	return true;
}

// given a number, a column and a sudoku, returns true if the number can be placed in the column
function isPossibleCol(number,col,sudoku) {
	for (var i=0; i<=8; i++) {
		if (sudoku[col+9*i] == number) {
			return false;
		}
	}
	return true;
}

// given a number, a 3x3 block and a sudoku, returns true if the number can be placed in the block
function isPossibleBlock(number,block,sudoku) {
	for (var i=0; i<=8; i++) {
		if (sudoku[Math.floor(block/3)*27+i%3+9*Math.floor(i/3)+3*(block%3)] == number) {
			return false;
		}
	}
	return true;
}

// given a cell, a number and a sudoku, returns true if the number can be placed in the cell
function isPossibleNumber(cell,number,sudoku) {
	var row = returnRow(cell);
	var col = returnCol(cell);
	var block = returnBlock(cell);
	return isPossibleRow(number,row,sudoku) && isPossibleCol(number,col,sudoku) && isPossibleBlock(number,block,sudoku);
}

// given a row and a sudoku, returns true if it's a legal row
function isCorrectRow(row,sudoku) {
	var rightSequence = new Array(1,2,3,4,5,6,7,8,9);
	var rowTemp= new Array();
	for (var i=0; i<=8; i++) {
		rowTemp[i] = sudoku[row*9+i];
	}
	rowTemp.sort();
	return rowTemp.join() == rightSequence.join();
}

// given a column and a sudoku, returns true if it's a legal column
function isCorrectCol(col,sudoku) {
	var rightSequence = new Array(1,2,3,4,5,6,7,8,9);
	var colTemp= new Array();
	for (var i=0; i<=8; i++) {
		colTemp[i] = sudoku[col+i*9];
	}
	colTemp.sort();
	return colTemp.join() == rightSequence.join();
}

// given a 3x3 block and a sudoku, returns true if it's a legal block
function isCorrectBlock(block,sudoku) {
	var rightSequence = new Array(1,2,3,4,5,6,7,8,9);
	var blockTemp= new Array();
	for (var i=0; i<=8; i++) {
		blockTemp[i] = sudoku[Math.floor(block/3)*27+i%3+9*Math.floor(i/3)+3*(block%3)];
	}
	blockTemp.sort();
	return blockTemp.join() == rightSequence.join();
}

// given a sudoku, returns true if the sudoku is solved
function isSolvedSudoku(sudoku) {
	for (var i=0; i<=8; i++) {
		if (!isCorrectBlock(i,sudoku) || !isCorrectRow(i,sudoku) || !isCorrectCol(i,sudoku)) {
			return false;
		}
	}
	return true;
}

// given a cell and a sudoku, returns an array with all possible values we can write in the cell
function determinePossibleValues(cell,sudoku) {
	var possible = new Array();
	for (var i=1; i<=9; i++) {
		if (isPossibleNumber(cell,i,sudoku)) {
			possible.unshift(i);
		}
	}
	return possible;
}

// given an array of possible values assignable to a cell, returns a random value picked from the array
function determineRandomPossibleValue(possible,cell) {
	var randomPicked = Math.floor(Math.random() * possible[cell].length);
	return possible[cell][randomPicked];
}

// given a sudoku, returns a two dimension array with all possible values
function scanSudokuForUnique(sudoku) {
	var possible = new Array();
	for (var i=0; i<=80; i++) {
		if (sudoku[i] == 0) {
			possible[i] = new Array();
			possible[i] = determinePossibleValues(i,sudoku);
			if (possible[i].length==0) {
				return false;
			}
		}
	}
	return possible;
}

// given an array and a number, removes the number from the array
function removeAttempt(attemptArray,number) {
	var newArray = new Array();
	for (var i=0; i<attemptArray.length; i++) {
		if (attemptArray[i] != number) {
			newArray.unshift(attemptArray[i]);
		}
	}
	return newArray;
}

// given a two dimension array of possible values, returns the index of a cell where there are the less possible numbers to choose from
function nextRandom(possible) {
	var max = 9;
	var minChoices = 0;
	for (var i=0; i<=80; i++) {
		if (possible[i]!=undefined) {
			if ((possible[i].length<=max) && (possible[i].length>0)) {
				max = possible[i].length;
				minChoices = i;
			}
		}
	}
	return minChoices;
}

// given a sudoku, solves it
function solve(sudoku) {
	var saved = new Array();
	var savedSudoku = new Array();
	var i=0;
	var nextMove;
	var whatToTry;
	var attempt;
	while (!isSolvedSudoku(sudoku)) {
		i++;
		nextMove = scanSudokuForUnique(sudoku);
		if (nextMove == false) {
			nextMove = saved.pop();
			sudoku = savedSudoku.pop();
		}
		whatToTry = nextRandom(nextMove);
		attempt = determineRandomPossibleValue(nextMove,whatToTry);
		if (nextMove[whatToTry].length>1) {
			nextMove[whatToTry] = removeAttempt(nextMove[whatToTry],attempt);
			saved.push(nextMove.slice());
			savedSudoku.push(sudoku.slice());
		}
		sudoku[whatToTry] = attempt;
	}
	//showSudoku(sudoku,i);
  return sudoku;
}


// given a solved sudoku and the number of steps, prints out the sudoku
function showSudoku(sudoku,i) {
  //console.log(sudoku);
	/*var sudokuText = [;
	var solved = "\n\nSolved in "+i+" steps";
	for (var i=0; i<=8; i++) {
		for (var j=0; j<=8; j++) {
			sudokuText+=sudoku[i*9+j];
			if (j!=8) {
				sudokuText+=",";
			}
		}
		if (i!=8) {
			sudokuText+="],[";
		}
	}
	//sudokuText+=solved;
	console.log(sudokuText);
  //console.log(JSON.parse(sudokuText));*/
}
</script>

<style>
#app {
  font-family: "Raleway", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #111;
}

h1 {
  font-size: 7vmin;
  margin-bottom: 0px;
}

span {
  display: block;
  margin-bottom: 10px;
}

.fullpage {
  position: fixed;
  top: 0px;
  left: 0px;
  width: 100%;
  height: 100%;
  z-index: 999;
}

.menu {
  position: fixed;
  top: 14.5vmin;
  left: 20px;
  z-index: 1000;
  box-shadow: 0px 2px 10px #444;
  background-color: #FFF;
}
.menu:after {
    content:'';
    position: absolute;
    top: 0px;
    left: 5px;
    margin-top: -10px;
    width: 0;
    height: 0;
    border-bottom: solid 10px #444;
    border-left: solid 10px transparent;
    border-right: solid 10px transparent;
}
.menu span {
  text-align: left;
  padding: 20px;
  margin: 0px;
  font-size: 1.2em;
  cursor: pointer;
}
.menu span img {
  width: 1em;
  height: 1em;
  float: left;
  margin-top: 2px;
  padding-right: 10px;
}

.shadow {
  background-color: rgba(0,0,0,0.5);
}
.dialog {
  position: fixed;
  top: 20%;
  left: 20%;
  z-index: 1000;
  width: 60%;
  padding-bottom: 20px;
  box-shadow: 0px 2px 10px #444;
  background-color: #FFF;
}
.dialog button {
  width: 90%;
  height: 10%;
  background-color: #555;
  color: #EEE;
  font-size: 1.2em;
  border: none;
  text-align: center;
  text-decoration: none;
  box-shadow: 0px 2px 5px #888888;
  padding: 4px;
  margin: 10px;
  margin-top: 20px;
}


.icon {
  width: 7vmin;
  height: 7vmin;
}

.left {
  float: left;
  padding-left: 10px;
}

.right {
  float: right;
  padding-right: 10px;
}

</style>
