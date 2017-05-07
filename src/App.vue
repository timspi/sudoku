<template>
  <div id="app">
    <!-- HEADER -->
    <header>
      <img @click="showMenu = true" src="static/icon.png" class="icon left">
      <img @click="redirect" src="/icon.png" class="icon right">
      <span>SUDOKU</span>
    </header>

    <!-- SETTINGS COMPONENT -->
    <Settings v-if="isSettings" @createNew="saveSettings"></Settings>

    <!-- SUDOKU COMPONENTS -->
    <div v-if="!isSettings" class="container">
      <span @click="isPause = true" style="cursor: pointer" id="time">⏱️ Zeit: {{ timeStr }}</span>
      <Field @keyup.enter="solve" @cellclicked="cellClick" :sudoku="sudoku" :settings="settings" id="field"></Field>
      <Buttons @buttonclicked="buttonClick" :helpmode="helpMode"
                :settings="settings" :size="size" id="buttons"></Buttons>
    </div>

    <!-- MAIN MENU -->
    <div v-if="showMenu" @click="showMenu = false" class="menu">
      <span @click="solve"><img src="https://image.flaticon.com/icons/svg/13/13845.svg">Lösung zeigen</span>
      <span @click="restart"><img src="https://image.flaticon.com/icons/svg/103/103253.svg">Neues Sudoku</span>
      <span @click="isPause = true"><img src="https://image.flaticon.com/icons/svg/109/109500.svg">Spiel pausieren</span>
      <span @click="isSettings = true"><img src="https://image.flaticon.com/icons/svg/70/70367.svg">Einstellungen</span>
    </div>
    <div @click="showMenu = false" v-if="showMenu" class="fullpage"></div>

    <!-- INFO DIALOG -->
    <div @click="isPause = false" v-if="isPause && !isSettings" class="shadow fullpage"></div>
    <div v-if="isPause && !isSettings" class="dialog">
      <h2>{{ (isDone ? 'Herzlichen Glückwunsch' : 'Pause') }}</h2>
      <div>{{ (isDone ? 'Sudoku in ' + timeStr + ' gelöst.' : 'Das Spiel ist pausiert.') }}</div>
      <button @click="isPause = false">{{ (isDone ? 'Schließen' : 'Fortsetzen') }}</button>
    </div>

    <!-- LOADING DIALOG -->
    <div v-if="isLoading" class="shadow fullpage"></div>
    <div v-if="isLoading" class="dialog">
      <h2>Bitte Warten</h2>
      <img src="static/loading.gif">
      <span>Sudoku wird generiert</span>
      <button @click="cancel">Abbrechen</button>
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
      sudoku: {},
      settings: {},

      helpMode: false,
      isPause: false,
      isDone: false,
      showMenu: false,
      isSettings: false,
      isLoading: false,

      hidden: '',
      visibilityChange: '',

      worker: undefined
    }
  },
  computed: {
    timeStr: function() {
      var m = Math.floor(this.sudoku.elapsedTime/60);
      return (m ? m  + " min " : '') + this.sudoku.elapsedTime % 60 + " sek";
    },
    size: function() {
      return this.sudoku.xSize*this.sudoku.ySize;
    },
    cells: function() {
      return Math.pow(this.size, 2);
    }
  },
  methods: {
    buttonClick: function(data) {
      if(data.id == 0) {
        this.helpMode = !this.helpMode;
      } else if(data.id == -1) {
        this.sudoku.field[this.sudoku.active].value = 0;
        this.sudoku.field[this.sudoku.active].help = [];
      } else {
        if(this.sudoku.active != -1) {
          if(this.helpMode) {
            this.sudoku.field[this.sudoku.active].value = 0;
            var index = this.sudoku.field[this.sudoku.active].help.indexOf(data.id);
            if(index == -1) {
              this.sudoku.field[this.sudoku.active].help.push(data.id);
            } else {
              this.sudoku.field[this.sudoku.active].help.splice(index, 1);
            }
          } else {
            this.sudoku.field[this.sudoku.active].value = data.id;
            this.checkSudoku();
          }
        }
        //this.$localStorage.set('sudoku', this.sudoku.field);
      }
    },
    cellClick: function(data) {
      this.sudoku.active = data.active;
    },
    solve: function() {
      var sudoku = new Array();
      for(var i = 0; i < this.sudoku.field.length; i++) {
        sudoku.push(this.sudoku.field[i].value);
      }

      var solver = sudoku_solver(this.xSize, this.ySize);
      var solarr = solver(sudoku, 2);
      var solved = solarr[0];
      /*var solved = solve(sudoku);
      console.log(solved);*/
      for(var i = 0; i < solved.length; i++) {
        this.sudoku.field[i].value = solved[i];
      }

    },
    restart: function() {
      this.isLoading = true;

      this.worker.postMessage({
        cmd: 'start',
        xSize: this.sudoku.xSize,
        ySize: this.sudoku.ySize,
        emptyCells: Math.floor(this.settings.difficulty*this.cells/100)
      });

    },
    cancel: function() {
      this.worker.postMessage('stop');
      this.worker.terminate();
      this.$localStorage.remove("sudoku");
      location.reload();
    },
    checkSudoku: function() {
      var sudoku = new Array();
      for(var i = 0; i < this.sudoku.field.length; i++) {
        sudoku.push(this.sudoku.field[i].value);
      }
      if(isSolvedSudoku(sudoku)) {
        this.isPause = true;
        this.isDone = true;
      }
    },
    saveSettings: function(data) {
      this.isSettings = false;
      if(data.save) {
        console.log(data);
        this.settings.style = data.style;
        this.settings.difficulty = data.difficulty;
        this.settings.customStyle = data.customStyle;
        //if(this.style == 4) this.$localStorage.set('custom', this.custom);

        if(data.xSize != this.sudoku.xSize || data.ySize != this.sudoku.ySize) {
          this.sudoku.xSize = data.xSize;
          this.sudoku.ySize = data.ySize;

          console.log("Changed settings -> create new sudoku");
          this.sudoku.field = [];
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

    this.worker = new Worker('static/kudoku.js');

    this.worker.addEventListener('message', (e) => {
      if(e.data.status == 'ok') {
        var arr = e.data.sudoku;

        this.sudoku.field = [];
        for(var i = 0; i < this.cells; i++) {
          var val = arr[i];
          this.sudoku.field.push({id: i, value: val, fixed: val != 0, help: []});
        }
        /*this.sudoku.field = this.$localStorage.set("sudoku", this.sudoku.field);
        this.$localStorage.set("sudokuElapsedTime", 0);*/
        this.sudoku.elapsedTime = 0;
        this.isPause = false;
        this.isDone = false;
        this.isLoading = false;
      } else {
        console.log("generator: " + e.data);
      }
    }, false);


    this.sudoku = this.$localStorage.get("sudoku");
    this.settings = this.$localStorage.get("settings");

    if(this.sudoku.field.length == 0) {
      this.restart();
    } else {
      this.checkSudoku();
    }

    window.setInterval(() => {
      if(!(this.isPause || this.isDone || this.isLoading)) {
        this.sudoku.elapsedTime += 1; //Math.trunc((new Date()).getTime() / 1000);
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
  },
  watch: {
    sudoku: {
      handler: function(val) {
        this.$localStorage.set("sudoku", val);
      },
      deep: true
    },
    settings: {
      handler: function(val) {
        console.log("Saved settings");
        this.$localStorage.set("settings", val);
      },
      deep: true
    }
  }
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

span {
  display: block;
  margin-bottom: 10px;
}


header {
  background-color: #333;
  box-shadow: 0px 2px 10px #888;
  color: white;
  border-radius: 0px 0px 10px 10px;;
}

header span {
  padding-top: 5%;
  font-size: 2em;
  font-weight: bold;
}
header img {
  padding: 10px;
  width: 15%;
  max-width: 80px;
}

.left {
  float: left;
}

.right {
  float: right;
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
  z-index: 1000;
  box-shadow: 0px 2px 10px #444;
  background-color: #FFF;
}
.menu:after {
    content:'';
    position: absolute;
    top: 0px;
    left: 13px;
    margin-top: -10px;
    width: 0;
    height: 0;
    border-bottom: solid 10px white;
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

.dialog img {
  display: inline;
  width: 2em;
  height: 2em;
}

.dialog span {
  position: relative;
  top: -8px;
  left: 8px;
  display: inline;
}

@media (min-aspect-ratio: 1/1) {
  .container {
    width: 100%;
  }
  .menu {
    position: fixed;
    top: 4.3em;
    left: calc(20px + 100vh);
  }
  header {
    position: absolute;
    left: calc(100vh + 10px);
    top: 0px;
    width: calc(100vw - 100vh - 20px);
  }
  #field {
    position: absolute;
    background-color: #FAFAFA;
    overflow: auto;
    box-shadow: 0px 0px 2px #444 inset;
    top: 0px;
    left: 0px;
    width: 100vh;
    height: 100vh;
  }
  #buttons {
    position: absolute;
    left: 100vh;
    top: 7em;
    width: calc(100vw - 100vh);
    height: 50%;
  }
  #time {
    position: absolute;
    left: 100vh;
    top: 5em;
    width: calc(100vw - 100vh);
  }
}
@media (max-aspect-ratio: 1/1) {
  .container {
    width: 100%;
  }
  header {
    position: absolute;
    left: 10px;
    top: 0px;
    width: calc(100vw - 20px);
  }
  .menu {
    position: absolute;
    top: 5em;
    left: 20px;
  }
  #field {
    position: absolute;
    background-color: #FAFAFA;
    overflow: auto;
    box-shadow: 0px 0px 2px #444 inset;
    top: 7em;
    left: 0px;
    width: 100vw;
    height: 100vw;
  }
  #buttons {
    position: absolute;
    left: 0px;
    top: calc(100vw + 7.5em);
    width: 100vw;
    height: 30%;
  }
  #time {
    position: absolute;
    left: 0px;
    top: 5.4em;
    width: 100vw;
  }
}

</style>
