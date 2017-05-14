<template>
  <div id="app">

    <div id="flow">
      <!-- HEADER -->
      <header>
        <img @click="showMenu = true" src="static/icon.png" class="icon">
        <span>SUDOKU</span>
      </header>

      <span @click="isPause = true" style="cursor: pointer" id="time">⏱️ Zeit: {{ timeStr }}</span>
      <Buttons @buttonclicked="buttonClick" :helpmode="helpMode" :settings="settings" :size="size" :xSize="sudoku.xSize" id="buttons"></Buttons>
    </div>

    <!-- SETTINGS COMPONENT -->
    <Settings v-if="isSettings" @createNew="saveSettings"></Settings>

    <!-- SUDOKU COMPONENTS -->
    <v-touch @pinch="pinchMove" @rotate="pinchMove" @pinchstart="pinchStart" @pinchend="pinchEnd" @pan="touchPan">
      <Field @keyup.enter="solve" @cellclicked="cellClick" :sudoku="sudoku" :settings="settings" :transform="transform" id="field"></Field>
    </v-touch>

    <!-- MAIN MENU -->
    <div v-if="showMenu" @click="showMenu = false" class="menu">
      <span @click="toggleFullScreen"><img src="static/fullscreen.svg">Vollbild</span>
      <span @click="restart"><img src="static/new_sudoku.svg">Neues Sudoku</span>
      <span @click="isPause = true"><img src="static/pause.svg">Spiel pausieren</span>
      <span @click="isSettings = true"><img src="static/settings.svg">Einstellungen</span>
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
      sudoku: {xSize: 3, ySize: 3, field: [], elapsedTime: 0, active: -1},
      settings: {style: 0, difficulty: 50},

      helpMode: false,
      isPause: false,
      isDone: false,
      showMenu: false,
      isSettings: false,
      isLoading: false,
      isZooming: false,

      hidden: '',
      visibilityChange: '',

      worker: undefined,
      log: "",
      lastScale: 1,
      transform: {x: -1, y: -1, deltaX: 0, deltaY: 0, scale: 1},
      lastNum: {}
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
    doScroll: function(e) {
      console.log(e.clientX);
      if(e.clientX < window.innerHeight && !this.isSettings) {
        e.preventDefault();
        this.log = e.wheelDelta;
        this.transform.scale = Math.min(Math.max(this.transform.scale + e.wheelDelta/500, 1), 10);
      }
    },
    pinchMove: function(e) {
      if(this.isZooming) {
        this.transform.scale = Math.max(1, Math.min(this.lastScale * e.scale, 10));
      }
    },
    pinchStart: function(e) {
      this.isZooming = true;
    },
    pinchEnd: function(e) {
      this.isZooming = false;
      this.lastScale = this.transform.scale;
    },
    touchPan: function(e) {
      console.log(e);
      this.transform.deltaX = e.deltaX;
      this.transform.deltaY = e.deltaY;
    },
    mouseMove: function(e) {
      if(e.clientX < window.innerHeight) {
        this.transform.x = e.clientX;
        this.transform.y = e.clientY;
      }
    },
    keyDown: function(e) {
      // Keyboard input
      if(!this.isSettings) {
        if(!this.isPause) {
          if(!(e.keyCode >= 48 && e.keyCode <= 57)) this.lastNum = {};

          if(e.keyCode == 37) {
            // Left
            if(e.shiftKey) {
              this.sudoku.active--;
              if(this.sudoku.active < 0) this.sudoku.active = this.cells-1;
            } else {
              this.goToNextEmptyField(-1);
            }
          } else if(e.keyCode == 39) {
            // Right
            if(e.shiftKey) {
              this.sudoku.active++;
              if(this.sudoku.active >= this.cells) this.sudoku.active = 0;
            } else {
              this.goToNextEmptyField(1);
            }
          } else if(e.keyCode == 38) {
            // Up
            if(e.shiftKey) {
              this.sudoku.active -= this.size;
              if(this.sudoku.active < 0) this.sudoku.active = this.cells-1;
            } else {
              this.goToNextEmptyField(-this.size);
            }
          } else if(e.keyCode == 40) {
            // Down
            if(e.shiftKey) {
              this.sudoku.active += this.size;
              if(this.sudoku.active >= this.cells) this.sudoku.active = 0;
            } else {
              this.goToNextEmptyField(this.size);
            }
          } else if(e.keyCode >= 49 && e.keyCode <= 57) {
            // Number
            var num = e.keyCode - 48;
            if(this.lastNum.time + 1000 >= (new Date()).getTime()) {
              num += this.lastNum.num*10;
            }
            this.lastNum = {num: num, time: (new Date()).getTime()};
            console.log(this.lastNum);

            console.log("Number: " + num);
            this.buttonClick(num);
          } else if(e.keyCode >= 65 && e.keyCode <= 90) {
            // Letter
            var letter = e.keyCode - 64;
            console.log("Letter: " + letter);
            if(this.settings.style == 1) {
              // A is 10, B is 11, ...
              this.buttonClick(letter+9);
            } else if(this.settings.style == 2) {
              // A is 0, B is 1, ...
              this.buttonClick(letter);
            }
          } else if(e.keyCode == 8 || e.keyCode == 46) {
            // Delete/Backspace
            e.preventDefault();
            this.buttonClick(-1); // Clear cell
          }
        }
        if(e.keyCode == 13 || ((this.settings.style == 0 || this.settings.style > 2) && e.keyCode == 80)) {
          // Toggle pause
          this.isPause = !this.isPause;
        }
      }
    },
    goToNextEmptyField: function(dir) {
      for(var i = this.sudoku.active+dir; i < this.sudoku.active+this.cells; i += dir) {
        var tmp = i;

        if(tmp >= this.cells || tmp < 0) tmp += this.cells * (dir < 0 ? 1 : -1);

        if(!this.sudoku.field[tmp].fixed) {
          this.sudoku.active = tmp;
          break;
        }
      }
    },
    buttonClick: function(id) {
      if(id == 0) {
        this.helpMode = !this.helpMode;
      } else if(id == -1) {
        this.sudoku.field[this.sudoku.active].value = 0;
        this.sudoku.field[this.sudoku.active].help = [];
      } else if(id > 0 && id <= this.size) {
        if(this.sudoku.active != -1 && !this.sudoku.field[this.sudoku.active].fixed) {
          if(this.helpMode) {
            this.sudoku.field[this.sudoku.active].value = 0;
            var index = this.sudoku.field[this.sudoku.active].help.indexOf(id);
            if(index == -1) {
              this.sudoku.field[this.sudoku.active].help.push(id);
            } else {
              this.sudoku.field[this.sudoku.active].help.splice(index, 1);
            }
          } else {
            this.sudoku.field[this.sudoku.active].value = id;
            this.checkSudoku();
          }
        }
        //this.$localStorage.set('sudoku', this.sudoku.field);
      }
    },
    cellClick: function(data) {
      this.lastNum = {};
      this.sudoku.active = data.active;
    },
    /*solve: function() {
      var sudoku = new Array();
      for(var i = 0; i < this.sudoku.field.length; i++) {
        sudoku.push(this.sudoku.field[i].value);
      }

      var solver = sudoku_solver(this.xSize, this.ySize);
      var solarr = solver(sudoku, 2);
      var solved = solarr[0];

      for(var i = 0; i < solved.length; i++) {
        this.sudoku.field[i].value = solved[i];
      }
    },*/
    isSolvedSudoku: function() {
      for(var i = 0; i < this.size; i++) {
        console.log(i);
        var row = [0], col = [0], block = [0];
        for(var j = 0; j < this.size; j++) {
          var r = this.sudoku.field[this.size*i + j].value;
          if(!row.includes(r)) row.push(r);

          var c = this.sudoku.field[i + this.size*j].value;
          if(!col.includes(c)) col.push(c);
          var rowOfBlock = Math.floor(i/this.sudoku.ySize)*this.sudoku.ySize;
          var rowInBlock = Math.floor(j/this.sudoku.xSize);
          var colOfBlock = (i%this.sudoku.ySize)*this.sudoku.xSize;
          var colInBlock = j%this.sudoku.xSize;
          var cell = (rowOfBlock+rowInBlock)*this.size + colOfBlock+colInBlock;
          console.log("cell:" + cell);
          var b = this.sudoku.field[cell].value;
          if(!block.includes(b)) block.push(b);
        }
        if(row.length != this.size+1 || col.length != this.size+1 || block.length != this.size+1) {
          console.log("row=" + row.join(",") + ", col:" + col.join(",") + ", block:" + block.join(","));
          return false;
        }
      }
      return true;
    },
    toggleFullScreen: function() {
      var element = document.documentElement;
    	if(element.requestFullscreen) {
    		element.requestFullscreen();
    	} else if(element.msRequestFullscreen) {
    		element.msRequestFullscreen();
    	} else if(element.mozRequestFullScreen) {
    		element.mozRequestFullScreen();
    	} else if (element.webkitRequestFullscreen) {
    		element.webkitRequestFullscreen();
    	}
    },
    restart: function() {
      this.isLoading = true;
      this.sudoku.active = -1;

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
      console.log("check");
      if(this.isSolvedSudoku()) {
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

    window.addEventListener("mousewheel", this.doScroll, false);
    window.addEventListener("mousemove", this.mouseMove, false);
    document.addEventListener('keydown', this.keyDown);
    /*document.addEventListener('keyup', (e) => {
      if(e.keyCode == 16) {
        // Shift up: Check if active field is fixed, if so, disable selection
        if(this.sudoku.field[this.sudoku.active].fixed) this.sudoku.active = -1;
      }
    });*/

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
/*
function arraysEqual(arr1, arr2) {
    if(arr1.length !== arr2.length)
        return false;
    for(var i = arr1.length; i--;) {
        if(arr1[i] !== arr2[i])
            return false;
    }

    return true;
}*/
</script>

<style>
#app {
  font-family: "Raleway", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #111;
  background-color: white;
}

span {
  display: block;
  margin-bottom: 10px;
}


header {
  position: relative;
  top: 0px;
  margin-left: 10px;
  width: calc(100% - 20px);
  z-index: 900;
  background-color: #333;
  box-shadow: 0px 2px 10px #888;
  color: white;
  border-radius: 0px 0px 10px 10px;
  height: 4.5em;
}

header span {
  padding-top: 0.5em;
  font-size: 2em;
  font-weight: bold;
}
header img {
  padding-top: 0.5em;
  padding-left: 0.5em;
  float: left;
  height: 80%;
  cursor: pointer;
}

#time {
  padding-top: 10px;
}

.scroll {
  overflow: auto;
}

.fullpage {
  position: fixed;
  top: 0px;
  left: 0px;
  width: 100%;
  height: 100%;
  z-index: 950;
}

.menu {
  z-index: 990;
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
  max-width: 400px;
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

@media (min-aspect-ratio: 4/3) {
  /* LANDSCAPE */
  .menu {
    position: fixed;
    top: 4.8em;
    left: calc(23px + 100vh);
  }

  #field {
    position: fixed;
    background-color: #FAFAFA;
    overflow: hidden;
    top: 0px;
    left: 0px;
    min-width: 50vw;
    width: 100vh;
    max-width: 70vw;
    height: 100vh;
  }
  #flow {
    position: fixed;
    right: 0px;
    top: 0px;
    min-width: 30vw;
    width: calc(100vw - 100vh);
    max-width: 50vw;
    height: 100vh;
    box-shadow: 0px 0px 3px #444;
    background-color: white;
    z-index: 5;
    overflow: auto;
  }
}
@media (max-aspect-ratio: 4/3) {
  /* PORTRAIT */

  .menu {
    position: absolute;
    top: 5em;
    left: 20px;
  }
  #field {
    position: fixed;
    background-color: #FAFAFA;
    overflow: hidden;
    box-shadow: 0px 0px 2px #444 inset;
    top: 7em;
    left: 0px;
    width: 100vw;
    height: 100vw;
    z-index: 200;
  }
  #flow {
    position: fixed;
    left: 0px;
    top: 0px;
    width: 100%;
    height: 100%;
    box-shadow: 0px 0px 3px #444;
    background-color: white;
    z-index: 5;
    overflow: hidden;
  }
  #buttons {
    margin-top: calc(100vw + 1em);
    height: calc(100vh - 100vw - 7em);
    overflow: auto;
  }
  /*#buttons {
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
  }*/
}

@media print {
  #buttons {
    visibility: collapse;
  }
  #time {
    visibility: collapse;
  }
}

</style>
