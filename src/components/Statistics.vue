<template>
  <div class="container">
    <h1>Statistiken</h1>
    <div class="card">
      <h2>Allgemein</h2>
      <img @click="cancel" src="static/cancel.svg">
      Lorme ipsum
    </div>
    <div class="card">
      <h2>Schwierigkeit</h2>
      <button class="small minus" @click="difficulty--" :disabled="difficulty <= 0 ? true:false">-</button>
      <button class="small plus" @click="difficulty++" :disabled="difficulty >= 5 ? true:false">+</button>
      <span>{{ difficultyStr }}</span><br>
      <span>Etwa {{ emptyCells }} freie Felder</span>
    </div>

    <br>
    <button class="" @click="createNew" :disabled="styleErr">Speichern</button>
    <button class="" @click="cancel">Abbrechen</button>
    <br><br>
  </div>
</template>


<script>
import { Doughnut } from 'vue-chartjs'

export default Doughnut.extend({
  data() {
    return {
      labels: ["VueJs", "EmberJs", "ReactJs", "AngularJs"],
    }
  },
  mounted () {
    // Overwriting base render method with actual data.
    this.renderChart({
        labels: this.labels,
        datasets: [{
            backgroundColor: ["rgba(65, 184, 131, .8)", "rgba(228, 102, 81, .8)", "rgba(0, 216, 255, .8)", "rgba(155, 89, 182, .8)"],
            borderWidth: 0,
            data: [40, 20, 80, 10]
        }]
    }, {
        responsive: !0,
        maintainAspectRatio: !1
    });
  }
})
</script>


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
  right: 2.8em;
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
}

button.small {
  width: 10%;
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
