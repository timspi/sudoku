function go() {
	console.log("Start");
	var solstr, solarr = solver(document.getElementById("input").value, 2)
	for (var i = 0; i < solarr.length; i++) {
		solstr += solarr[i].join('') + '\n'
	}
	console.log(solarr);
	document.getElementById("output").textContent = solstr;
	
	console.log("First:");
	for(var i = 0; i < solarr[0].length; i++) {
		var val = solarr[0][i];
		if(val < 10) console.log(val);
		else console.log(String.fromCharCode(87+val));
	}
}

//var sudoku9 = "1.......2.9.4...5...6...7...5.9.3.......7.......85..4.7.....6...3...9.8...2.....1";
//var sudoku12 = "..6..5.......4........2.5...4c..8..a28.49....5....a9..c.........b.....a..b.56....c9..c7.8a.....b...2......769.....8...b..2b.c6....17c..1.74..9.8";

var sudoku9 = "a.......b.i.d...e...f...g...e.i.c.......g.......he..d.g.....f...c...i.h...b.....a";
var sudoku12 = "..f..e.......d........b.e...dl..h..jbh.di....e....ji..l.........k.....j..k.ef....li..lg.hj.....k...b......gfi.....h...k..bk.lf....agl..a.gd..i.h";
var sudoku16 = "..a....c.....o.i.j..a.b.p.cgf.h...d..f.i.e....p..g.el.h....m.j......e....c..g....i..k.ga.b...e.jd.gp..j.f....a...e...c.b..dp..o.e..f.m..d..l.k.a.c........o.i.l.h.p.c..f.a..b......g.od...j....hk...j....h.a.p.l..b..p..e..k..a..h..b..k..fi.c....f...c..d..h.n.";


document.getElementById("input").value = sudoku12;

var solver = sudoku_solver(4, 3); // xSize, ySize
go();


