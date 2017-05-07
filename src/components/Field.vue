<template>
  <div>
    <table>
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
      active: -1
    }
  },
  props: {
    sudoku: Object,
    settings: Object
  },
  computed: {
    size: function() {
      return this.sudoku.xSize*this.sudoku.ySize;
    },
    fontSize: function() {
      // TODO
      return '1em';
    },
    sudokuRows: function() {
      var arr = [];
      for(var i = 0; i < this.sudoku.field.length; i += this.size) {
        arr.push(this.sudoku.field.slice(i, i + this.size));
      }
      return arr;
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
    clicked: function(id) {
      if(!this.sudoku.field[id].fixed) {
        if(this.active == id) this.active = -1;
        else this.active = id;
        this.$emit('cellclicked', { active: this.active });
      }
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
  cursor: default;
}

.fixed {
  background-color: #DDD;
  cursor: not-allowed;;
}

.active {
  background-color: #555;
  box-shadow: inset 0 0 2px 2px #222;
  color: #EEE;
}

.opaque {
  color: rgba(0,0,0,0);
}

</style>
