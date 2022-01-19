<template>
  <div v-if="show">
    <div @click="closeDialog" class="shadow"></div>
    <div class="dialog">
      <h2>{{ title }}</h2>
      <slot></slot>
      <button @click="closeDialog" v-if="cancelable">{{closeButton}}</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'w3-dialog',
  data () {
    return {
      active: -1,
    }
  },
  props: {
    title: String,
    show: Boolean,
    cancelable: {
      type: Boolean,
      default: false
    },
    closeButton: {
      type: String,
      default: "Schließen"
    }
  },
  methods: {
    closeDialog() {
      if(this.cancelable)
        this.$emit("close");
    }
  },
  computed: {
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

.shadow {
  position: fixed;
  top: 0px;
  left: 0px;
  width: 100vw;
  height: 100vh;
  z-index: 500;
  background-color: rgba(0,0,0,0.5);

}
.dialog {
  z-index: 501;
  position: fixed;
  top: 20%;
  left: 50%;
  z-index: 1000;
  width: 60%;
  max-width: 400px;
  padding-bottom: 20px;
  box-shadow: 0px 2px 10px #444;
  background-color: #FFF;
  transform: translateX(-50%);
}
.dialog button {
  width: 90%;
  height: 10%;
  background-color: #555;
  color: #EEE;
  font-size: 1.2em;
  border: none;
  text-align: center;
  text-decoration: none;
  box-shadow: 0px 2px 5px #888888;
  padding: 4px;
  margin: 10px;
  margin-top: 20px;
}
.dialog button:disabled {
  background-color: #AAA;
  cursor: not-allowed;
  box-shadow: none;
}

.dialog input {
  padding: 4px;
  text-align: center;
  margin-top: 4px;
  width: calc(90% - 8px);
}

.dialog img {
  display: inline;
  width: 2em;
  height: 2em;
}

.dialog span {
  position: relative;
  top: -8px;
  left: 8px;
  display: inline;
}

</style>
