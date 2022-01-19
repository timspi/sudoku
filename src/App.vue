<template>
  <div id="app">

    <div id="flow">
      <!-- HEADER -->
      <header id="header">
        <img @click="showMenu = true" src="static/icon.png" class="icon">
        <span>SUDOKU</span>
      </header>

      <span @click="isPause = true" style="cursor: pointer" id="time">⏱️ Zeit: {{ timeStr }}</span>

      <!-- SUDOKU COMPONENTS -->
      <v-touch @pinch="pinchMove" @rotate="pinchMove" @pinchstart="pinchStart" @pinchend="pinchEnd" @pan="touchPan" @panend="touchPanEnd">
        <Field :blur="isPause && !isDone" @keyup.enter="solve" @cellclicked="cellClick" :sudoku="sudoku" :settings="settings" :transform="transform" id="field"></Field>
      </v-touch>

      <Buttons @buttonclicked="buttonClick" :helpmode="helpMode" :settings="settings" :size="size" :xSize="sudoku.xSize" id="buttons"></Buttons>
    </div>

    <!-- SETTINGS COMPONENT -->
    <Settings v-if="isSettings" @createNew="saveSettings"></Settings>

    <!-- MAIN MENU -->
    <div v-if="showMenu" @click="showMenu = false" class="menu">
      <div style="overflow: auto; max-height: calc(100vh - 5.5em);">
        <span @click="toggleFullScreen"><img src="static/fullscreen.svg">Vollbild</span>
        <span @click="restart"><img src="static/new_sudoku.svg">Neues Sudoku</span>
        <span @click="isPause = true"><img src="static/pause.svg">Spiel pausieren</span>
        <span @click="getHint"><img src="static/hint.svg">Hinweis zeigen</span>
        <span @click="showAbout = true"><img src="static/about.svg">Über</span>
        <span @click="isSettings = true"><img src="static/settings.svg">Einstellungen</span>
      </div>
    </div>
    <div @click="showMenu = false" v-if="showMenu" class="fullpage"></div>

    <!-- INFO DIALOG -->
    <!--@click=""-->
    <w3-dialog closeButton="Fortsetzen" @close="isPause = false" :cancelable="!isDone" :title="(isDone ? 'Herzlichen Glückwunsch' : 'Pause')" :show="isPause && !isSettings">
      <div>{{ (isDone ? 'Sudoku in ' + timeStr + ' gelöst.' : 'Das Spiel ist pausiert.') }}</div>
      <!--<div class="score">
        <i>{{this.size}}x{{this.size}} Highscores:</i>
        <table>
          <tr v-for="score in scores" :class="{bold: (settings.difficulty==score.difficulty?true:false)}">
            <td>{{ {0:"Gelöst", 20:"Sehr leicht", 35:"Leicht", 50:"Mittel", 62:"Schwer", 75:"Sehr schwer"}[score.difficulty] }}</td>
            <td>{{score.user}}</td>
            <td>{{formTime(score.time)}}</td>
          </tr>
        </table>
      </div>-->
      <button @click="isPause = false; restart();" v-if="isDone">Neues Sudoku</button>
    </w3-dialog>

    <!-- LOADING DIALOG -->
    <w3-dialog title="Bitte Warten" :show="isLoading">
      <img src="static/loading.gif">
      <span>Sudoku wird generiert</span>
      <button @click="cancel">Abbrechen</button>
    </w3-dialog>

    <!-- Username prompt -->
    <!--<w3-dialog title="Benutzername" :show="promptUsername">
      <div>Wähle einen Benutzernamen:</div>
      <input type="text" v-model="username" placeholder="Name"></input>
      <button @click="setUsername()" :disabled="(username.length<3?true:false)">Speichern</button>
    </w3-dialog>-->

    <!-- Hint -->
    <w3-dialog :title="hint.title" @close="hint={};" :show="(hint.title?true:false)" :cancelable="true">
      <div v-html="hint.hint"></div><br>
      <div v-if="hint.show" v-html="hint.strategy"></div>
      <div v-else @click="hint.show = true" class="button" style="cursor:pointer;">Lösungsansatz einblenden</div>
    </w3-dialog>

    <!-- About -->
    <w3-dialog title="Über" @close="showAbout = false" :show="showAbout" :cancelable="true">
      <p>Sudoku von <b>Tim Spickermann</b></p>
      <p>Anregungen und Fehler an <a href="mailto:sudoku@timsp.de">sudoku@timsp.de</a></p>
      <p>Open Source: Quellcode auf <a href="https://github.com/timsp97/sudoku">GitHub</a></p>

      <h4>Attribution</h4>
      <p>
        Lösungsalgorithmus: <a href="https://attractivechaos.github.io/plb/kudoku.html">Kudoku</a><br>
        Framework: <a href="https://vuejs.org/">Vue.js</a><br>

        Icons made by
        <a href="http://www.flaticon.com/authors/freepik">Freepik</a>,
        <a href="https://www.flaticon.com/authors/gregor-cresnar">Gregor Cresnar</a>,
        <a href="http://www.flaticon.com/authors/dave-gandy">Dave Gandy</a>,
        <a href="http://www.flaticon.com/authors/egor-rumyantsev">Egor Rumyantsev</a>,
        <a href="http://www.flaticon.com/authors/hanan">Hanan</a>,
        from <a href="http://www.flaticon.com">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/">CC BY 3.0</a>.
      </p>
    </w3-dialog>
  </div>
</template>

<script>
import Field from './components/Field'
import Buttons from './components/Buttons'
import Settings from './components/Settings'
import Statistics from './components/Statistics'
import w3Dialog from './components/w3-dialog'

export default {
  name: 'app',
  components: {
    Field, Buttons, Settings, w3Dialog
  },
  data () {
    return {
      sudoku: {
        xSize: 3,
        ySize: 3,
        field: [],
        elapsedTime: 0,
        active: -1,
        difficulty: 50,
        options: false,
        hints: 0
      },
      settings: {style: 0, difficulty: 50, showMistakes: false},

      helpMode: false,
      isPause: false,
      isDone: false,
      showMenu: false,
      isSettings: false,
      isStatistics: false,
      isLoading: false,
      isZooming: false,

      hidden: '',
      visibilityChange: '',

      worker: undefined,
      log: "",
      lastScale: 1,
      transform: {x: -1, y: -1, deltaX: 0, deltaY: 0, scale: 1},
      lastNum: {},

      /*username: "",
      promptUsername: false,
      scores: {},*/

      hint: {},
      showAbout: false,
      delta: {x:0,y:0},

      games: [],
    }
  },
  computed: {
    timeStr: function() {
      var time = this.sudoku.elapsedTime;
      var m = Math.floor(time/60);
      return (m ? m  + " min " : '') + time % 60 + " sek";
    },
    size: function() {
      return this.sudoku.xSize*this.sudoku.ySize;
    },
    cells: function() {
      return Math.pow(this.size, 2);
    }
  },
  methods: {
    getHint() {
      if(this.sudoku.hints) this.sudoku.hints++;
      else this.sudoku.hints = 1;

      this.hint.title = "Berechne..."
      this.worker.postMessage({
        cmd: 'hint',
        xSize: this.sudoku.xSize,
        ySize: this.sudoku.ySize,
        field: this.sudoku.field
      });
    },
    checkMistakes() {
      var active = this.sudoku.active;
      var value = this.sudoku.field[this.sudoku.active].value;

      var row = Math.floor(active/9);
      var col = active%9;

      for(var i = 0; i < this.size; i++) {
        //console.log(i);
        if(this.sudoku.field[9*row + i].value == value) {
          //console.log("col", i);
          this.sudoku.field[9*row + i].mistake = true;
        }
        if(this.sudoku.field[9*i + col].value == value) {
          //console.log("row", i);
          this.sudoku.field[9*i + col].mistake = true;
        }

        /*var row = [0], col = [0], block = [0];
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
          //console.log("cell:" + cell);
          var b = this.sudoku.field[cell].value;
          if(!block.includes(b)) block.push(b);
        }
        if(row.length != this.size+1 || col.length != this.size+1 || block.length != this.size+1) {
          //console.log("row=" + row.join(",") + ", col:" + col.join(",") + ", block:" + block.join(","));
          return false;
        }*/
      }
    },
    formTime(time) {
      var m = Math.floor(time/60);
      return (m ? m  + ":" : '') + time % 60 + (m?' m':' s');
    },
    /*setUsername() {
      this.promptUsername = false;
      console.log("Username set to " + this.username);
      this.$localStorage.set('username', this.username);

      // Now add the event listener
      document.addEventListener('keydown', this.keyDown);
    },*/
    doScroll: function(e) {
      if(window.innerHeight/window.innerWidth < 3/4 && e.clientX < window.innerHeight && !this.isSettings && !this.isStatistics) {
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
      //console.log("delta", this.delta.x + e.deltaX);
      this.transform.deltaX = this.delta.x + e.deltaX;
      this.transform.deltaY = this.delta.y + e.deltaY;
    },
    touchPanEnd: function(e) {
      //console.log("end", e);
      this.delta.x += e.deltaX;
      this.delta.y += e.deltaY;
    },
    mouseMove: function(e) {
      if(window.innerHeight/window.innerWidth < 3/4 && e.clientX < window.innerHeight) {
        this.transform.x = e.clientX;
        this.transform.y = e.clientY;
      }
    },
    keyDown: function(e) {
      // Keyboard input
      if(!this.isSettings) {
        if(!this.isPause) {
          if(!(e.keyCode >= 48 && e.keyCode <= 57)) this.lastNum = {};

          if(e.key == 'h') this.getHint(); // FIXME remove debugging line

          if(e.keyCode == 37) {
            // Left
            if(e.shiftKey) {
              this.goToNextEmptyField(-1);
            } else {
              this.sudoku.active--;
              if(this.sudoku.active < 0) this.sudoku.active = this.cells-1;
            }
          } else if(e.keyCode == 39) {
            // Right
            if(e.shiftKey) {
              this.goToNextEmptyField(1);
            } else {
              this.sudoku.active++;
              if(this.sudoku.active >= this.cells) this.sudoku.active = 0;
            }
          } else if(e.keyCode == 38) {
            // Up
            if(e.shiftKey) {
              this.goToNextEmptyField(-this.size);
            } else {
              this.sudoku.active -= this.size;
              if(this.sudoku.active < 0) this.sudoku.active = this.cells-1;
            }
          } else if(e.keyCode == 40) {
            // Down
            if(e.shiftKey) {
              this.goToNextEmptyField(this.size);
            } else {
              this.sudoku.active += this.size;
              if(this.sudoku.active >= this.cells) this.sudoku.active = 0;
            }
          } else if(e.keyCode >= 49 && e.keyCode <= 57) {
            // Number
            var num = e.keyCode - 48;
            if(this.size > 9 && this.lastNum.time + 1000 >= (new Date()).getTime()) {
              num += this.lastNum.num*10;
            }
            this.lastNum = {num: num, time: (new Date()).getTime()};
            //console.log(this.lastNum);

            //console.log("Number: " + num);
            this.buttonClick(num);
          } else if(e.keyCode >= 65 && e.keyCode <= 90) {
            // Letter
            var letter = e.keyCode - 64;
            //console.log("Letter: " + letter);
            if(this.settings.style == 1) {
              // A is 10, B is 11, ...
              this.buttonClick(letter+9);
            } else if(this.settings.style == 2) {
              // A is 0, B is 1, ...
              this.buttonClick(letter);
            }
          } else if(e.keyCode == 8 || e.keyCode == 46) {
            // Delete/Backspace
            if(!this.sudoku.field[this.sudoku.active].fixed) {
              e.preventDefault();
              this.buttonClick(-1); // Clear cell
            }
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
        this.isSolvedSudoku(); // To update mistakes
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
      //console.log("check sudoku");
      // Reset mistakes
      for(var i = 0; i < this.size*this.size; i++) {
        this.sudoku.field[i].mistake = false;
      }
      var isSolved = true;
      for(var i = 0; i < this.size; i++) {
        //console.log(i);
        var row = [], rowIndex = [],
            col = [], colIndex = [],
            block = [], blockIndex = [];
        for(var j = 0; j < this.size; j++) {
          var r = this.sudoku.field[this.size*i + j].value;
          if(r>0) {
            if(!row.includes(r)) {
              row.push(r);
              rowIndex.push(this.size*i + j);
            } else {
              this.sudoku.field[this.size*i + j].mistake = true;
              this.sudoku.field[rowIndex[row.indexOf(r)]].mistake = true;
            }
          }

          var c = this.sudoku.field[i + this.size*j].value;
          if(c>0) {
            if(!col.includes(c)) {
              col.push(c);
              colIndex.push(i + this.size*j);
            } else {
              this.sudoku.field[i + this.size*j].mistake = true;
              this.sudoku.field[colIndex[col.indexOf(c)]].mistake = true;
            }
          }

          var rowOfBlock = Math.floor(i/this.sudoku.ySize)*this.sudoku.ySize;
          var rowInBlock = Math.floor(j/this.sudoku.xSize);
          var colOfBlock = (i%this.sudoku.ySize)*this.sudoku.xSize;
          var colInBlock = j%this.sudoku.xSize;
          var cell = (rowOfBlock+rowInBlock)*this.size + colOfBlock+colInBlock;
          //console.log("cell:" + cell);
          var b = this.sudoku.field[cell].value;
          if(b>0) {
            if(!block.includes(b)) {
              block.push(b);
              blockIndex.push(cell);
            } else {
              this.sudoku.field[cell].mistake = true;
              this.sudoku.field[blockIndex[block.indexOf(b)]].mistake = true;
            }
          }
        }
        if(row.length != this.size || col.length != this.size || block.length != this.size) {
          //console.log("row=" + row.join(",") + ", col:" + col.join(",") + ", block:" + block.join(","));
          isSolved = false;

          if(this.settings.removeNotes) {
            for(var j = 0; j < this.size; j++) {
              if(this.sudoku.field[this.size*i + j].help)
              row.forEach((val) => {
                var index = this.sudoku.field[this.size*i + j].help.indexOf(val);
                if(index != -1) {
                	this.sudoku.field[this.size*i + j].help.splice(index, 1);
                }
              });
              if(this.sudoku.field[i + this.size*j].help)
              col.forEach((val) => {
                var index = this.sudoku.field[i + this.size*j].help.indexOf(val);
                if(index != -1) {
                	this.sudoku.field[i + this.size*j].help.splice(index, 1);
                }
              });
              var rowOfBlock = Math.floor(i/this.sudoku.ySize)*this.sudoku.ySize;
              var rowInBlock = Math.floor(j/this.sudoku.xSize);
              var colOfBlock = (i%this.sudoku.ySize)*this.sudoku.xSize;
              var colInBlock = j%this.sudoku.xSize;
              var cell = (rowOfBlock+rowInBlock)*this.size + colOfBlock+colInBlock;
              if(this.sudoku.field[cell].help)
              block.forEach((val) => {
                var index = this.sudoku.field[cell].help.indexOf(val);
                if(index != -1) {
                	this.sudoku.field[cell].help.splice(index, 1);
                }
              });
            }
          }
        }
      }
      return isSolved;
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
      var x = this.sudoku.xSize, y = this.sudoku.ySize;
      this.sudoku = {xSize: x, ySize: y, field: [], elapsedTime: 0, active: -1, options: false, hints: 0};
      this.sudoku.difficulty = this.settings.difficulty;
      this.checkHelpOptions();

      this.worker.postMessage({
        cmd: 'start',
        xSize: this.sudoku.xSize,
        ySize: this.sudoku.ySize,
        emptyCells: Math.floor(this.sudoku.difficulty*this.cells/100)
      });

    },
    cancel: function() {
      this.worker.postMessage('stop');
      this.worker.terminate();
      this.$localStorage.remove("sudoku");
      location.reload();
    },
    checkSudoku: function() {
      //console.log("check");
      if(this.isSolvedSudoku()) {
        this.isPause = true;
        this.isDone = true;

        //if(!this.sudoku.wasScored) this.saveScore();
        this.logGame();
      }
    },
    logGame() {
      if(!this.sudoku.wasLogged) {
        var log = JSON.parse(JSON.stringify(this.sudoku));
        delete log.field;
        delete log.active;
        log.timestamp = Date.now();
        this.games.push(log);
        this.$localStorage.set("games", this.games);
        console.log("Logged game", this.games);

        this.sudoku.wasLogged = true;
      }
    },
    /*saveScore() {
      console.log("Saving score");
      var str = JSON.stringify({
        user: this.username,
        difficulty: this.sudoku.difficulty,
        time: this.sudoku.elapsedTime,
        size: this.size,
      });
      var e = "";
      for(var i=0; i<str.length;i++) {
          var a = str.charCodeAt(i);
          var b = a ^ 42;
          e += String.fromCharCode(b);
      }

      this.$axios.post(this.$scrUrl, {
        data: e
      }).then((res) => {
        if(res.status == 200) {
          this.scores = res.data;
          this.sudoku.wasScored = true;
        }
      });
    },*/
    saveSettings: function(data) {
      this.isSettings = false;
      if(data.save) {
        //console.log(data);
        this.settings.style = data.style;
        this.settings.difficulty = data.difficulty;
        this.settings.customStyle = data.customStyle;

        this.settings.showMistakes = data.showMistakes;
        this.settings.removeNotes = data.removeNotes;
        this.settings.highlightNumbers = data.highlightNumbers;
        this.checkHelpOptions();

        if(data.xSize != this.sudoku.xSize || data.ySize != this.sudoku.ySize) {
          this.sudoku.xSize = data.xSize;
          this.sudoku.ySize = data.ySize;

          // Clear scores because they're for the old size
          /*this.scores = {};
          this.updateScores();*/

          console.log("Changed settings -> create new sudoku");
          this.sudoku.field = [];
          this.restart();
        }
      }
    },
    checkHelpOptions() {
      if(this.settings.showMistakes ||
         this.settings.removeNotes ||
         this.settings.highlightNumbers) {
           // Avoid saving the highscore
           this.sudoku.options = true;
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
    },
    /*updateScores() {
      this.$axios.post("/sudokuscore.php", {
        size: this.size
      }).then((res) => {
        //console.log(res);
        if(res.status == 200) {
          this.scores = res.data;
        }
      });
    }*/
  },
  created: function() {
    //this.updateScores();

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
      } else if(e.data.status == 'ok hint') {
        this.hint = e.data.hint;
      } else {
        //console.log("generator: " + e.data);
      }
    }, false);

    window.addEventListener("mousewheel", this.doScroll, false);
    window.addEventListener("mousemove", this.mouseMove, false);

    this.sudoku = this.$localStorage.get("sudoku");
    this.settings = this.$localStorage.get("settings");
    this.username = this.$localStorage.get("username") || "";
    this.games = this.$localStorage.get("games");
    this.promptUsername = this.username.length < 3;

    //if(!this.promptUsername) {
      // Register the handler after the user entered the name
      document.addEventListener('keydown', this.keyDown);
    //}

    //this.updateScores();

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
        //console.log("Saved settings");
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

.button {
  margin: 0px 15px;
  border: 1px solid black;
  border-radius: 5px;
}
.button:hover {
  background-color: #CCC;
}

span {
  display: block;
  margin-bottom: 10px;
}

a {
  text-decoration: none;
  color: #555;
  font-weight: bold;
  font-style: italic;
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

.score {
  width: 90%;
  margin: auto;
  margin-top: 8px;
  border: 1px solid black;
  border-radius: 8px;
}

.score table {
  width: 90%;
  margin: 5%;
  padding: 2px;
  border-collapse: collapse;
}
.score i {
  border-bottom: 1px solid black;
}
.bold {
  font-weight: bold;
}
.score tr:nth-child(2n) {
  background-color: #EEE;
}
.score tr:nth-child(2n+1) {
  background-color: #CCC;
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
    max-width: calc(100vw - 300px);
    height: 100vh;
    box-shadow: 0px 0px 2px #444 inset;
  }
  #flow {
    position: fixed;
    right: 0px;
    top: 0px;
    min-width: 300px;
    width: calc(100vw - 100vh);
    max-width: 50vw;
    height: 100vh;
    box-shadow: 0px 0px 3px #444;
    background-color: white;
    z-index: 5;
    overflow: auto;
  }
}
@media (min-aspect-ratio: 3/4) and (max-aspect-ratio: 4/3)  {
  /* QUADRATIC (approx) */
  #flow {
    position: fixed;
    top: 0px;
    left: 0px;
    width: 100vw;
    height: 100vh;
  }
  .menu {
    position: absolute;
    top: 4.8em;
    left: 0px;
  }
  #field {
    position: relative;
    float: left;
    background-color: #FAFAFA;
    overflow: hidden;
    width: 50vw;
    height: calc(100vh - 5.5em - 20px);
  }
  #buttons {
    position: absolute;
    left: 50vw;
    background-color: #FAFAFA;
    width: 50vw;
    top: calc(50vh + 2.25em + 10px);
    transform: translateY(-50%);

  }
}
@media (max-aspect-ratio: 3/4) {
  /* PORTRAIT */

  .menu {
    position: absolute;
    top: 5em;
    left: 20px;
  }
  #field {
    position: relative;
    background-color: #FAFAFA;
    overflow: hidden;
    box-shadow: 0px 0px 2px #444 inset;
    /*top: 7em;
    left: 0px;*/
    width: 100vw;
    height: 100vw;
    max-height: calc(100vh - 7em - 200px);
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

    height: calc(100vh - 100vw - 7em);
    min-height: 200px;
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
