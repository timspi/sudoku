<template>
  <div class="help">
    <table>
      <tr v-for="row in rows">
        <td v-for="col in row" :class="{opaque: !col}">
          {{ col }}
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
    help: Array
  },
  computed: {
    rows: function() {
      var arr = [[0,0,0],[0,0,0],[0,0,0]]
      console.log("Help: " + this.help);
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
