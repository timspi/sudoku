<template>
  <div>
    <table class="buttons">
      <tr v-for="row in [0,1]">
        <td v-for="entry in [0,1,2,3,4]">
          <button @click="clicked(entry + 5*row)" :class="{helpmodeColor: helpmode}">
            {{ btnStr(entry + 5*row) }}
          </button>
        </td>
      </tr>
    </table>
    <div class="notice">{{ (helpmode ? 'Notizen' : 'Zahlen') }} einfügen</div>
  </div>
</template>

<script>
export default {
  name: 'buttons',
  data () {
    return {
      msg: 'Welcome to Your Vue.js App',
      active: -1
    }
  },
  methods: {
    clicked: function(id) {
      this.$emit('buttonclicked', { id: id });
    },
    btnStr: function(value) {
      if(value == 0) return "⇄";

      if(this.styleIndex == 1) {
        if(value < 10) return value;
        else return String.fromCharCode(value+55);
      }
      if(this.styleIndex == 2) return String.fromCharCode(value+64);
      if(this.styleIndex >= 3) return this.custom[value-1];
      return value;
    }
  },
  props: {
    helpmode: Boolean,
    size: Number,
    styleIndex: Number,
    custom: Array
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
  width: 90vmin;
  max-width: 450px;
  padding-top: 3vmax;
}

td {
  width: 20%;
  height: 15vmin;
}

button {
  width: 90%;
  height: 90%;
  background-color: #555;
  color: #EEE;
  font-size: 7vmin;
  border: none;
  text-align: center;
  text-decoration: none;
  box-shadow: 0px 2px 5px #888888;
}


.notice {
  padding-top: 10px;
  font-size: 6vmin;
}

@media (min-width: 450px) {
  button {
    font-size: 35px;
  }
  td {
    height: 60px;
  }
  .notice {
    font-size: 30px;
  }
}


.helpmodeColor {
  background-color: #888;
}


</style>
