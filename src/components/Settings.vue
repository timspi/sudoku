<template>
  <div class="container">
    <h1>Einstellungen</h1>
    <div class="card">
      <h2>Sudokugröße</h2>
      <!--<img @click="cancel" src="static/cancel.svg">-->
      <button class="small minus" @click="minusSize" :disabled="xSize <= 2 ? true:false">-</button>
      <button class="small plus" @click="plusSize">+</button>
      <span>{{xSize}}x{{ySize}}</span><br>
      <span>Feldgröße: {{size}}x{{size}}, Feldanzahl: {{size*size}}</span>
    </div>
    <div class="card">
      <h2>Schwierigkeit</h2>
      <button class="small minus" @click="difficulty--" :disabled="difficulty <= 0 ? true:false">-</button>
      <button class="small plus" @click="difficulty++" :disabled="difficulty >= 5 ? true:false">+</button>
      <span>{{ difficultyStr }}</span><br>
      <span>Etwa {{ emptyCells }} freie Felder</span>
    </div>

    <div class="card">
      <h2>Stil</h2>
      <button class="small minus" @click="style--" :disabled="style <= 0 ? true:false">←</button>
      <button class="small plus" @click="style++" :disabled="style >= 4 ? true:false">→</button>
      <span>{{ styleStr }}</span>
      <input placeholder="Zeichen durch Komma trennen" v-model="custom" type="text" v-if="style == 4"></input>
      <br><span style="display: inline">Vorschau: </span>
      <span style="display: inline-block; text-transform: uppercase; font-family: sans">{{ stylePreview }}</span>
      <span v-if="styleErr" style="color: #F00">Stil enthält zu wenig Zeichen für gewählte Größe</span>
    </div>

    <div class="card">
      <h2>Optionen</h2>
      <div class="check">
        <input class="checkbox" type="checkbox" v-model="showMistakes" id="showMistakes">
        <label for="showMistakes">Fehler direkt anzeigen</label>
      </div>
      <div class="check">
        <input class="checkbox" type="checkbox" v-model="removeNotes" id="removeNotes">
        <label for="removeNotes">Notizen automatisch löschen</label>
      </div>
      <div class="check">
        <input class="checkbox" type="checkbox" v-model="highlightNumbers" id="highlightNumbers">
        <label for="highlightNumbers">Gleiche Zahlen hervorheben</label>
      </div>
      <!--<div v-if="showMistakes || removeNotes || highlightNumbers">
        <u>Achtung:</u><br>
        Highscores werden bei aktivierten Zusatzoptionen nicht gespeichert
      </div>-->
    </div>

    <div v-if="size >= 36" class="card">
      <span class="warning">Achtung</span>
      <span>Die Berechnung kann mehrere Minuten dauern.</span>
      <span>Exponentieller Anstieg der Rechenzeit mit der Sudokugröße.</span>
    </div>
    <br>
    <button class="" @click="createNew" :disabled="styleErr">Speichern</button>
    <button class="" @click="cancel">Abbrechen</button>
    <br><br><br><br><br><br><br><br>
  </div>
</template>

<script>
export default {
  name: 'settings',
  data () {
    return {
      xSize: 3,
      ySize: 3,
      difficulty: 3,
      style: 0,
      custom: "",
      emoji: "😀,😁,😂,😃,😄,😅,😆,😇,😈,😉,😊,😋,😌,😍,😎,😏,😐,😑,😒,😓,😔,😕,😖,😗,😘,😙,😚,😛,😜,😝,😞,😟,😠,😡,😢,😣,😤,😥,😦,😧,😨,😩,😪,😫,😬,😭,😮,😯,😰,😱,😲,😳,😴,😵,😶,😷,😸,😹,😺,😻,😼,😽,😾,😿,🙀,🙁,🙂,🙃,🙄,🙅,🙆,🙇,🙈,🙉,🙊,🙋,🙌,🙍,🙎,🙏",
      percentages: [0,20,35,50,62,75],
      showMistakes: false,
      removeNotes: false,
      highlightNumbers: false,
    }
  },
  methods: {
    createNew: function(id) {
      this.$emit('createNew', {
        save: true,
        showMistakes: this.showMistakes,
        removeNotes: this.removeNotes,
        highlightNumbers: this.highlightNumbers,
        xSize: this.xSize,
        ySize: this.ySize,
        difficulty: this.percentages[this.difficulty],
        style: this.style,
        customStyle: ( this.style == 4 ? this.customArr : this.emoji.split(",").slice(0,this.size) )});
    },
    cancel: function() {
      this.$emit('createNew', {});
    },
    plusSize: function() {
      if(this.xSize <= this.ySize) this.xSize++;
      else this.ySize++;
    },
    minusSize: function() {
      if(this.xSize <= this.ySize) this.ySize--;
      else this.xSize--;
    },
    changeStyle: function(newStyle) {
      if(newStyle == 'l' && this.size > 26) return;
      if(newStyle == 'n+l' && this.size > 35) return;
      this.style = newStyle;
    }
  },
  computed: {
    stylePreview: function() {
      if(this.style == 1) return "1 2 3 4 5 6 7 8 9 a b c d e f g h i j k l m n o p q r s t u v w x y z".substr(0,2*this.size);
      if(this.style == 2) return "a b c d e f g h i j k l m n o p q r s t u v w x y z".substr(0,2*this.size);
      if(this.style == 3) return this.emoji.split(",").slice(0,this.size).join(" ");
      if(this.style == 4) return this.customArr.slice(0,this.size).join(" ");
      var out = "";
      for(var i = 1; i <= this.size; i++) {
        out += i + " ";
      }
      return out;
    },
    styleStr: function() {
      return ["Zahlen","Zahlen und Buchstaben","Buchstaben","Emojis","Benutzerdefiniert"][this.style];
    },
    styleErr: function() {
      switch (this.style) {
        case 1: if(this.size > 35) return true; break;
        case 2: if(this.size > 26) return true; break;
        case 3: if(this.size > 80) return true; break;
        case 4: if(this.size > this.customArr.length) return true; break;
      }
      return false;
    },
    difficultyStr: function() {
      return ["Gelöst", "Sehr leicht", "Leicht", "Mittel", "Schwer", "Sehr schwer"][this.difficulty];
    },
    size: function() {
      return this.xSize*this.ySize;
    },
    emptyCells: function() {
      return Math.floor(this.percentages[this.difficulty]*this.size*this.size/100);
    },
    customArr: function() {
      return this.custom.split(",");
    }
  },
  created: function() {
    var sudoku = this.$localStorage.get("sudoku");
    var settings = this.$localStorage.get("settings");

    this.showMistakes = settings.showMistakes;
    this.removeNotes = settings.removeNotes;
    this.highlightNumbers = settings.highlightNumbers;

    this.xSize = sudoku.xSize;
    this.ySize = sudoku.ySize;

    this.style = settings.style;
    for(var i = 0; i < this.percentages.length; i++) {
      if(settings.difficulty == this.percentages[i]) {
        this.difficulty = i;
        break;
      }
    }

    this.custom = this.$localStorage.get("custom");
  },
  watch: {
    custom: function(val) {
      this.$localStorage.set("custom", val);
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

.container {
  position: fixed;
  top: 0px;
  left: 0px;
  width: 100%;
  height: 100%;
  z-index: 1000;
  background-color: white;
  overflow: auto;
  box-shadow: 0px 0px 10px 3px #000;
}

img {
  position: absolute;;
  top: 1.2em;
  right: 20px;
  width: 2em;
  height: 2em;
}

h2 {
  text-decoration: underline;
}

button {
  width: 45%;
  background-color: #555;
  margin: 2px;
  color: #EEE;
  font-size: 1.5em;
  border: none;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
  border-radius: 5px 5px 5px 5px;
  box-shadow: 0px 1px 3px rgba(0,0,0,0.5);
}

button.small {
  width: 10%;
  width: 35px;
	height: 35px;
  margin-top: -8px;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

input {
	width: 90%;
	text-align: center;
	padding: 10px;
	border: solid 2px #dcdcdc;
	transition: box-shadow 0.3s, border 0.3s;
	box-sizing: border-box;
	border-radius: 5px 5px 5px 5px;
	margin-bottom: 10px;
	outline: none;
}

input:focus {
	border: solid 2px #CCC;
	box-shadow: 0 0 3px 1px #DDD;
}

.check {
  display: block;
  text-align: left;
  width: 100%;
}
.check label {
  position: relative;
  padding-left: 10px;
  cursor: pointer;
}
.checkbox {
  display: inline-block;
  appearance: none;
  vertical-align: middle;
  margin-left: 20px;
  width: 30px;
	height: 30px;
	background: #ddd;
	box-shadow: 0px 1px 3px rgba(0,0,0,0.5);
}
.checkbox:checked {
  background: #555;
}

.minus {
  float: left;
  margin-left: 5%;
}

.plus {
  float: right;
  margin-right: 5%;
}


.card {
  margin: auto;
  margin-top: 20px;
  padding: 4px;
  width: 90%;
  box-shadow: 0px 2px 10px #888888;
}

ul {
  padding: 2px;
  margin: auto;
  width: 90%;
  font-size: 1.4em;
  text-align: center;
  text-decoration: none;
  list-style: none;
}

li {
  padding: 2px;
  margin-bottom: 2px;
  cursor: pointer;
}

li.active {
  background-color: #555;
  color: #EEE;
  box-shadow: 0px 2px 5px #888888;
}

li.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

.warning {
  color: #F00;
  font-size: 1.2em;
  text-decoration: underline;
}

</style>
