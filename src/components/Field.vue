<template>
  <div>
    <table class="sudoku">
      <!--<tr>
        <th>Firstname</th>
        <th>Lastname</th>
        <th>Age</th>
      </tr>-->
      <tr v-for="row in sudokuRows">
        <td v-for="entry in row"
            :class="getClass(entry)"
            @click="clicked(entry.id)">
          <Help v-if="entry.value == 0" :help="entry.help"></Help>
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
    sudoku: Array
  },
  computed: {
    size: function() {
      return Math.sqrt(this.sudoku.length);
    },
    sudokuRows: function() {
      var arr = [];
      for(var i = 0; i < 81; i += 9) {
        arr.push(this.sudoku.slice(i, i+9));
      }
      return arr;
    }
  },
  methods: {
    getVal: function(value) {
      return (value == 0 ? "" : value);
    },
    getClass: function(entry) {
      var classes = "cell";
      if(entry.id % 3 == 0) classes += " thick-border-left";
      if(Math.floor(entry.id / 9) % 3 == 0) classes += " thick-border-top";

      if(entry.fixed) classes += " fixed";
      else if(entry.id == this.active) classes += " active";

      return classes;
    },
    clicked: function(id) {
      if(!this.sudoku[id].fixed) {
        if(this.active == id) this.active = -1;
        else this.active = id;
        console.log("Emit" + id);
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
  margin: auto;
  border: 3px solid black;
  border-collapse: collapse;
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

.sudoku {
  height: 90vmin;
  width: 90vmin;
  max-width: 450px;
  max-height: 450px;
}

.cell {
  width: 10vmin;
  height: 10vmin;
  font-size: 7vmin;
  padding: 0px;
}
@media (min-width: 450px) {
  .cell {
    width: 25px;
    height: 25px;
    font-size: 35px;
  }
}


.fixed {
  background-color: #DDD;
}

.active {
  background-color: #555;
  box-shadow: inset 0 0 2px 2px #222;
  color: #EEE;
}

</style>
