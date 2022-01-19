<template>
  <div>
    <table :style="scaleStr" id="table">
      <tr v-for="row in sudokuRows" :style="{width: rowWidth}">
        <td v-for="entry in row"
            :class="getClass(entry)"
            :style="{fontSize: fontSize}"
            @click="clicked(entry.id)">
          <div class="notes" v-if="entry.value == 0 && entry.help">{{ helpStr(entry.help) }}</div>
          <div v-else>{{ getVal(entry.value) }}</div>
        </td>
      </tr>
    </table>
  </div>
</template>

<script>

export default {
  name: 'field',
  data () {
    return {
      fontSize: '20px',
      containerSize: 0
    }
  },
  props: {
    sudoku: Object,
    settings: Object,
    transform: Object,
    blur: Boolean
  },
  computed: {
    rowWidth() {
      return this.size*50 + "px";
    },
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
      var blur = "";
      if(this.blur) blur = "filter: blur(5px);-webkit-filter: blur(5px);"

      var x = -50, y = -50, scale = 1;

      if(this.containerSize) {
        scale = (this.containerSize-50)/(50*this.size);
        if(this.containerSize > 400) {
          scale = Math.min(1.2, scale);
        }

        if(this.transform.x != -1 && this.transform.y != -1) {
          x = (this.containerSize/2 - this.transform.x) / this.containerSize*100 *scale* 1.1*Math.max(this.transform.scale-1, 0) -50;
          y = (this.containerSize/2 - this.transform.y) / this.containerSize*100 *scale* 1.1*Math.max(this.transform.scale-1, 0) -50;
        }

        var maxDelta = Math.max(this.transform.scale-1, 0)*50;
        x += this.transform.deltaX/this.containerSize*100;// *scale*Math.max(this.transform.scale-1, 0);// * this.transform.scale;
        x = Math.max(Math.min(x, -50+maxDelta), -50-maxDelta);
        y += this.transform.deltaY/this.containerSize*100;// *scale*Math.max(this.transform.scale-1, 0);// * this.transform.scale;
        y = Math.max(Math.min(y, -50+maxDelta), -50-maxDelta);
      }
      return blur + "transform: translate(" + x + "%," + y + "%) scale(" + scale*this.transform.scale + ")";
      //return "transform: translate(" + x + "px, " + y + "px) scale(" + scale + ")";
    }
  },
  methods: {
    helpStr(help) {
      var arr = [];
      help.forEach((e) => {
        arr.push(this.getVal(e));
      });
      return arr.join(" ");
    },
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

      if(entry.value == 0 && !entry.help) classes += " opaque";
      if(entry.id % this.sudoku.xSize == 0) classes += " thick-border-left";
      if(Math.floor(entry.id / this.size) % this.sudoku.ySize == 0) classes += " thick-border-top";

      if(this.settings.showMistakes && entry.mistake) classes += " error";

      if(entry.fixed) classes += " fixed";
      if(entry.id == this.sudoku.active) classes += " active";

      if(this.settings.highlightNumbers && entry.value && this.sudoku.active >= 0) {
        if(entry.value == this.sudoku.field[this.sudoku.active].value)
          classes += " highlight";
      }

      return classes;
    },
    calcFontSize: function(size) {
      /*if(this.settings.style >= 3) {
        var max = this.getMaxSymbolWidth(this.settings.customStyle, "sans 10px")
        this.fontSize = Math.min(size/this.size/40*max, 24) + 'px';
      } else if(this.settings.style == 0 && this.size > 9) {
        // Numbers with two digits -> more space needed
        this.fontSize = Math.min(size/this.size/2.5, 24) + 'px';
      } else {
        this.fontSize = Math.min(size/this.size/1.5, 24) + 'px';
      }*/
    },
    clicked: function(id) {
      if(!this.sudoku.field[id].fixed) {
        if(this.sudoku.active == id) this.sudoku.active = -1;
        else this.sudoku.active = id;
        this.$emit('cellclicked', { active: this.sudoku.active });
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

    this.containerSize = Math.min(this.$el.offsetWidth, this.$el.offsetHeight);
    window.onresize = () => {
      this.containerSize = Math.min(this.$el.offsetWidth, this.$el.offsetHeight);
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

h1, h2 {
  font-weight: normal;
}

table {
  position: relative;
  top: 50%;
  left: 50%;

  border: 3px solid black;
  border-collapse: collapse;
  background-color: #FFF;
  box-shadow: 0px 2px 10px #888888;
  font-family: sans-serif;

  table-layout: fixed;

  /*transform-origin: top left;*/
}

tr {
  height: 50px;
  margin: 0px;
  padding: 0px;
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
  font-size: 0.5em;
  padding: 0px;
  margin: 0px;
  min-width: 48px;
  min-height: 50px;
  max-width: 48px;
  max-height: 50px;
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

.active.fixed {
  background-color: #888;
  color: #EEE;
}

.opaque {
  color: rgba(0,0,0,0);
}

.notes {
  font-size: 70%;
}

.error {
  background-color: rgba(255, 0, 0, 0.9)!important;
}

.fixed.error {
  background-color: rgba(255, 0, 0, 0.7)!important;
}

.highlight {
  font-weight: bolder;
  text-shadow: 0px 0px 5px #08f;
}

</style>
