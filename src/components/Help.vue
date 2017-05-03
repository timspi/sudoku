<template>
  <div class="help">
    <table>
      <tr v-for="row in rows">
        <td v-for="col in row" :class="{opaque: !col}">
          {{ getVal(col) }}
        </td>
      </tr>
    </table>
  </div>
</template>

<script>
export default {
  name: 'help',
  data () {
    return {
      msg: 'Welcome to Your Vue.js App',
    }
  },
  props: {
    help: Array,
    styleIndex: Number
  },
  methods: {
    getVal: function(value) {
      if(value == 0) return 0;
      if(this.styleIndex == 1) {
        if(value < 10) return value;
        else return String.fromCharCode(value+55);
      }

      if(this.styleIndex == 2) return String.fromCharCode(value+64);
      if(this.styleIndex >= 3) return this.custom[value-1];
      return value;
    }
  },
  computed: {
    rows: function() {
      var arr = [[0,0,0],[0,0,0],[0,0,0]]
      for(var i = 0; i < this.help.length; i++) {
        var pos = this.help[i]-1;
        arr[Math.floor(pos/3)][pos%3] = this.help[i];
      }
      return arr;
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>


.help {
  font-size: 2.4vmin;
  font-weight: bold;
  font-family: sans-serif;
}
@media (min-width: 450px) {
  .help {
    font-size: 13px;
  }
}

.opaque {
  opacity: 0;
}

table, td, tr {
  padding: 0px;
  margin: 0px;
  overflow: hidden;
}

table {
  position: relative;
  width: 100%;
  height:100%
}

tr {
  position: relative;
  width: 100%;
  height: 100%;
}

</style>
