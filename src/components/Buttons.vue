<template>
  <div class="layout">
    <button v-for="button in buttons" @click="clicked(button.id)" :class="{helpmodeColor: button.help}">
          {{ button.val }}
    </button>
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
      if(this.settings.style == 1) {
        if(value < 10) return value;
        else return String.fromCharCode(value+55);
      }
      if(this.settings.style == 2) return String.fromCharCode(value+64);
      if(this.settings.style >= 3) return this.settings.customStyle[value-1];
      return value;
    }
  },
  props: {
    helpmode: Boolean,
    size: Number,
    settings: Object
  },
  computed: {
    buttons: function() {
      var arr = [];
      for(var i = 1; i <= this.size; i++) {
        arr.push({id: i, val: this.btnStr(i), help: (this.helpmode ? 'helpmodeColor' : '')});
      }

      arr.push({id: 0, val: '⇄'});
      arr.push({id: -1, val: '🗑'});

      return arr;
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

.layout {
  width: 100%;
  height: 100%;
  margin: auto;
}

button {
  width: 30%;
  margin: 1%;
  padding: 3%;
  background-color: #555;
  color: #EEE;
  font-size: 1.5em;
  border: none;
  text-align: center;
  text-decoration: none;
  box-shadow: 0px 2px 5px #888888;
}


.notice {
  padding-top: 10px;
  font-size: 1.5em;
}

.helpmodeColor {
  background-color: #888;
}


</style>
