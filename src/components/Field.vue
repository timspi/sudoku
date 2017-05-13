<template>
  <div>
    <table :style="scaleStr" id="table">
      <tr v-for="row in sudokuRows">
        <td v-for="entry in row"
            :class="getClass(entry)"
            :style="{fontSize: fontSize}"
            @click="clicked(entry.id)">
          <!--<Help v-if="entry.value == 0" :help="entry.help"></Help>-->
          {{ getVal(entry.value) }}
        </td>
      </tr>
    </table>
  </div>
</template>

<script>
import Help from './Help.vue'

export default {
  name: 'hello',
  components: {
    Help
  },
  data () {
    return {
      msg: 'Welcome to Your Vue.js App',
      active: -1,
      fontSize: '1em'
    }
  },
  props: {
    sudoku: Object,
    settings: Object,
    transform: Object
  },
  computed: {
    size: function() {
      return this.sudoku.xSize*this.sudoku.ySize;
    },
    sudokuRows: function() {
      var arr = [];
      for(var i = 0; i < this.sudoku.field.length; i += this.size) {
        arr.push(this.sudoku.field.slice(i, i + this.size));
      }
      return arr;
    },
    scaleStr: function() {
      var x = 0, y = 0;
      var div = this.$el;
      if(div && this.transform.x != -1 && this.transform.y != -1) {
        var size = div.offsetWidth;

        //this.calcFontSize(size);

        var table = document.getElementById("table");
        //console.log(table);
        x = (size/2 - this.transform.x) / size * Math.max(table.offsetWidth*this.transform.scale*1.1 - size, 0);
        y = (size/2 - this.transform.y) / size * Math.max(table.offsetHeight*this.transform.scale*1.1 - size, 0);

        //x += this.transform.deltaX * this.transform.scale;
        //y += this.transform.deltaY * this.transform.scale;
      }
      return "transform: translate(" + x + "px, " + y + "px) scale(" + this.transform.scale + ")";
    }
  },
  methods: {
    getVal: function(value) {
      if(value == 0) return "0";
      if(this.settings.style == 1) {
        if(value < 10) return value;
        else return String.fromCharCode(value+55);
      }

      if(this.settings.style == 2) return String.fromCharCode(value+64);
      if(this.settings.style >= 3) return this.settings.customStyle[value-1];
      return value;
    },
    getClass: function(entry) {
      var classes = "cell";
      if(entry.value == 0) classes += " opaque";
      if(entry.id % this.sudoku.xSize == 0) classes += " thick-border-left";
      if(Math.floor(entry.id / this.size) % this.sudoku.ySize == 0) classes += " thick-border-top";

      if(entry.fixed) classes += " fixed";
      else if(entry.id == this.active) classes += " active";

      return classes;
    },
    calcFontSize: function(size) {
      if(this.settings.style >= 3) {
        var max = this.getMaxSymbolWidth(this.settings.customStyle, "sans 10px")
        this.fontSize = Math.min(size/this.size/40*max, 24) + 'px';
      } else if(this.settings.style == 0 && this.size > 9) {
        // Numbers with two digits -> more space needed
        this.fontSize = Math.min(size/this.size/2.5, 24) + 'px';
      } else {
        this.fontSize = Math.min(size/this.size/1.5, 24) + 'px';
      }
    },
    clicked: function(id) {
      if(!this.sudoku.field[id].fixed) {
        if(this.active == id) this.active = -1;
        else this.active = id;
        this.$emit('cellclicked', { active: this.active });
      }
    },
    getMaxSymbolWidth: function(symbols, font) {
      // re-use canvas object for better performance
      var canvas = this.getMaxSymbolWidth.canvas || (this.getMaxSymbolWidth.canvas = document.createElement("canvas"));
      var context = canvas.getContext("2d");
      context.font = font;

      var max = 0;
      for(var i = 0; i < symbols.length; i++) {
        var metrics = context.measureText(symbols[i]);
        if(max < metrics.width) max = metrics.width;
      }
      return max;
    }
  },
  mounted: function() {
    this.calcFontSize(this.$el.offsetWidth);
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

h1, h2 {
  font-weight: normal;
}

table {
  height: 90%;
  width: 90%;
  margin: 5%;
  border: 3px solid black;
  border-collapse: collapse;
  background-color: #FFF;
  box-shadow: 0px 2px 10px #888888;
  font-family: sans-serif;
}

th, td {
  border: 1px solid black;
}

.thick-border-left {
  border-left: 3px solid black;
}
.thick-border-top {
  border-top: 3px solid black;
}


.cell {
  font-size: 1em;
  padding: 0px;
  cursor: pointer;
}

.fixed {
  background-color: #DDD;
  cursor: default;
}

.active {
  background-color: #555;
  /*box-shadow: inset 0 0 2px 2px #222;*/
  color: #EEE;
}

.opaque {
  color: rgba(0,0,0,0);
}

</style>
