self.addEventListener('message', function(e) {
  switch(e.data.cmd) {
    case 'start':
      self.postMessage('STARTED');
			go(e.data);
      break;
    case 'stop':
      //self.postMessage('WORKER STOPPED: ' + data.msg + '. (buttons will no longer work)');
			console.log("Generation terminated by user!");
      self.close(); // Terminates the worker.
      break;
    default:
      self.postMessage('Unknown command: ' + data.msg);
  };
}, false);

function go(data) {
	var generator = sudoku_generator(data.xSize, data.ySize);
	var arr = generator(data.emptyCells);

	self.postMessage({status: 'ok', sudoku: arr});
}



/* The MIT License

   Copyright (c) 2011 by Attractive Chaos <attractor@live.co.uk>

   Permission is hereby granted, free of charge, to any person obtaining
   a copy of this software and associated documentation files (the
   "Software"), to deal in the Software without restriction, including
   without limitation the rights to use, copy, modify, merge, publish,
   distribute, sublicense, and/or sell copies of the Software, and to
   permit persons to whom the Software is furnished to do so, subject to
   the following conditions:

   The above copyright notice and this permission notice shall be
   included in all copies or substantial portions of the Software.

   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
   EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
   MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
   NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
   BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
   ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
   CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
   SOFTWARE.
*/

/* For Sudoku, there are 9x9x9=729 possible choices (9 numbers to choose for
   each cell in a 9x9 grid), and 4x9x9=324 constraints with each constraint
   representing a set of choices that are mutually conflictive with each other.
   The 324 constraints are classified into 4 categories:

   1. row-column where each cell contains only one number
   2. box-number where each number appears only once in one 3x3 box
   3. row-number where each number appears only once in one row
   4. col-number where each number appears only once in one column

   Each category consists of 81 constraints. We number these constraints from 0
   to 323. In this program, for example, constraint 0 requires that the (0,0)
   cell contains only one number; constraint 81 requires that number 1 appears
   only once in the upper-left 3x3 box; constraint 162 requires that number 1
   appears only once in row 1; constraint 243 requires that number 1 appears
   only once in column 1.

   Noting that a constraint is a subset of choices, we may represent a
   constraint with a binary vector of 729 elements. Thus we have a 729x324
   binary matrix M with M(r,c)=1 indicating the constraint c involves choice r.
   Solving a Sudoku is reduced to finding a subset of choices such that no
   choices are present in the same constaint. This is equivalent to finding the
   minimal subset of choices intersecting all constraints, a minimum hitting
   set problem or a eqivalence of the exact cover problem.

   The 729x324 binary matrix is a sparse matrix, with each row containing 4
   non-zero elements and each column 9 non-zero elements. In practical
   implementation, we store the coordinate of non-zero elements instead of
   the binary matrix itself. We use a binary row vector to indicate the
   constraints that have not been used and use a column vector to keep the
   number of times a choice has been forbidden. When we set a choice, we will
   use up 4 constraints and forbid other choices in the 4 constraints. When we
   make wrong choices, we will find an unused constraint with all choices
   forbidden, in which case, we have to backtrack to make new choices. Once we
   understand what the 729x324 matrix represents, the backtracking algorithm
   itself is easy.

   A major difference between the algorithm implemented here and Guenter
   Stertenbrink's suexco.c lies in how to count the number of the available
   choices for each constraint. Suexco.c computes the count with a loop, while
   the algorithm here keeps the count in an array. The latter is a little more
   complex to implement as we have to keep the counts synchronized all the time,
   but it is 50-100% faster, depending on the input.
 */

function sudoku_solver(xSize, ySize) {
	var sudokuSize = xSize*ySize;
	var cells = Math.pow(sudokuSize, 2);
	//console.log("x=" + xSize + ", y=" + ySize + ", sudokuSize=" + sudokuSize + ", cells=" + cells);

	var C = [], R = []
	{ // generate the sparse representation of the binary matrix
		var i, j, r, c, c2
		for (i = r = 0; i < sudokuSize; ++i) // generate c[729][4]
			for (j = 0; j < sudokuSize; ++j)
				for (k = 0; k < sudokuSize; ++k)
					// the 4 numbers correspond to row-col, box-num, row-num and col-num constraints
					C[r++] = [ sudokuSize * i + j, (Math.floor(i/ySize)*ySize + Math.floor(j/xSize)) * sudokuSize + k + cells,
										 sudokuSize * i + k + 2*cells, sudokuSize * j + k + 3*cells ]

		for (c = 0; c < 4*cells; ++c) R[c] = []
		for (r = 0; r < Math.pow(sudokuSize, 3); ++r) // generate r[][] from c[][]
			for (c2 = 0; c2 < 4; ++c2)
				R[C[r][c2]].push(r)
	}

	// update the state vectors when we pick up choice r; v=1 for setting choice; v=-1 for reverting
	function sd_update(sr, sc, r, v) {
		//debugger;
		var min = sudokuSize+1, min_c = 0;
		for (var c2 = 0; c2 < 4; ++c2) sc[C[r][c2]] += v<<10; // 128 for setting, -128 for reverting
		for (var c2 = 0; c2 < 4; ++c2) { // update # available choices
			var r2, rr, cc2, c = C[r][c2];
			if (v > 0) { // move forward
				for (r2 = 0; r2 < sudokuSize; ++r2) {
					if (sr[rr = R[c][r2]]++ != 0) continue; // update the row status
					for (cc2 = 0; cc2 < 4; ++cc2) {
						var cc = C[rr][cc2];
						if (--sc[cc] < min) // update # allowed choices
							min = sc[cc], min_c = cc; // register the minimum number
					}
				}
			} else { // revert
				for (r2 = 0; r2 < sudokuSize; ++r2) {
					if (--sr[rr = R[c][r2]] != 0) continue; // update the row status
					var p = C[rr]
					++sc[p[0]]; ++sc[p[1]]; ++sc[p[2]]; ++sc[p[3]]; // update the count array
				}
			}
		}
		//return min<<16 | min_c // return the col that has been modified and with the minimal available choices
		return {minimum: min, minimum_c: min_c};
	}

	// solve a Sudoku; _s is the standard dot/number representation; max_ret sets the maximum number of returned solutions
	return function(_s, max_ret) {
		var r, c, r2, min, cand, dir, hints = 0; // dir=1: forward; dir=-1: backtrack
		// sr[r]: # times the row is forbidden by others; cr[i]: row chosen at step i
		// sc[c]: bit 1-7 - # allowed choices; bit 8: the constraint has been used or not
		// cc[i]: col chosen at step i

		/**************************
		 *     INITIALIZATION     *
		 **************************/
		var sr = [], sc = [], cr = [], cc = [], out = [], ret = [];
		if (max_ret == null) max_ret = 2;
		for (r = 0; r < Math.pow(sudokuSize,3); ++r) sr[r] = 0; // no row is forbidden
		for (c = 0; c < 4*cells; ++c) sc[c] = sudokuSize; // 9 allowed choices; no constraint has been used
		for (var i = 0; i < cells; ++i) {
			//var a = _s.charAt(i) >= '1' && _s.charAt(i) <= '9'? _s.charCodeAt(i) - 49 : -1; // number from -1 to 8
			//var a = _s.charAt(i) >= 'a' && _s.charCodeAt(i) < 97+sudokuSize ? _s.charCodeAt(i) - 97 : -1; // with chars as input
      var a = _s[i]-1; // Sudoku array is 0,1,2,3,..., kudoku needs -1,0,1,2,...
			if (a >= 0) sd_update(sr, sc, i * sudokuSize + a, 1); // set the choice
			if (a >= 0) ++hints; // count the number of hints
			cr[i] = cc[i] = -1, out[i] = a + 1;
		}

		/*******************
		 *     SOLVING     *
		 *******************/
		for (var i = 0, dir = 1, cand = {minimum: sudokuSize+1, minimum_c: 0};;) {
			while (i >= 0 && i < cells - hints) { // at most 81-hints steps
				if (dir == 1) {
					min = cand.minimum, cc[i] = cand.minimum_c;
					if (min > 1) {
						for (c = 0; c < 4*cells; ++c) {
							if (sc[c] < min) {
								min = sc[c], cc[i] = c; // choose the top constraint
								if (min <= 1) break; // this is for acceleration; slower without this line
							}
						}
					}
					if (min == 0 || min == sudokuSize+1) cr[i--] = dir = -1; // backtrack
				}
				c = cc[i];
				if (dir == -1 && cr[i] >= 0) sd_update(sr, sc, R[c][cr[i]], -1); // revert the choice
				for (r2 = cr[i] + 1; r2 < sudokuSize; ++r2) // search for the choice to make
					if (sr[R[c][r2]] == 0) break; // found if the state equals 0
				if (r2 < sudokuSize) {
					cand = sd_update(sr, sc, R[c][r2], 1); // set the choice
					cr[i++] = r2; dir = 1; // moving forward
				} else cr[i--] = dir = -1; // backtrack
			} // end while loop
			if (i < 0) break;
			var y = []
			for (var j = 0; j < cells; ++j) y[j] = out[j]
			for (var j = 0; j < i; ++j) r = R[cc[j]][cr[j]], y[Math.floor(r/sudokuSize)] = r%sudokuSize + 1; // the solution array (81 numbers)
			ret.push(y)
			if (ret.length >= max_ret) return ret;
			--i; dir = -1; // backtrack
		} // end for loop
		return ret;
	}
}

/* ===== USAGE =====

var solver = sudoku_solver()
var solstr, solarr = solver('..............3.85..1.2.......5.7.....4...1...9.......5......73..2.1........4...9', 2)
for (var i = 0; i < solarr.length; ++i) {
	solstr += solarr[i].join('') + '\n'
}
alert(solstr)

*/


// Code to generate a sudoku (by Tim Spickermann)
function sudoku_generator(x, y) {
	var xSize = x, ySize = y;
	var size = xSize*ySize;
	var cells = Math.pow(size, 2);


	function getRandomInt(min, max) {
	  min = Math.ceil(min);
	  max = Math.floor(max);
	  return Math.floor(Math.random() * (max - min)) + min;
	}


	function isPossibleCell(number, cell, sudoku) {
		var row = Math.floor(cell / size);
		var col = cell % size;
		//var block = (Math.floor(row) / sudoku.xSize) * sudoku.xSize + Math.floor(col / sudoku.ySize);
		var block = Math.floor(cell/(size*ySize))*ySize + Math.floor(col / xSize);
		//console.log("Cell: " + cell + ", row: " + row + ", col: " + col + ", block: " + block);

		for(var i = 0; i < size; i++) {
			if(sudoku[row*size + i] == number || // Check row
					sudoku[col + size*i] == number || // Check col
					sudoku[Math.floor(block/xSize)*xSize*size + i%ySize + size*Math.floor(i/ySize) + ySize*(block%ySize)] == number) { // Check block
				return false;
			}
		}

		return true;
	}

	return function(emptyCells) {
		console.log("###### NEW SUDOKU ######");


		console.log("Initialize solver at " + xSize + "x" + ySize);
		var solver = sudoku_solver(xSize, ySize);

		// Create an empty field
		var arr = [];
		var totalTries = 0;

		console.log("Generating sudoku...");
		console.time("Elapsed time")

		// Try to generate a sudoku
		outer: while(totalTries < 1000) {
			totalTries++;

			// Fill array with zeros
			arr = [];
			for(var i = 0; i < cells; i++) {
				arr.push(0);
			}

			// Add (e.g. 9x9: 81/3=27) random numbers without rule conflicts
			for(var i = 0; i < Math.min(25, cells/3); i++) {
			//for(var i = 0; i < 30; i++) {
				for(var triesCounter = 0; triesCounter < 500; triesCounter++) {
					var pos = getRandomInt(0, cells);
					var val = getRandomInt(0, size);
					if(isPossibleCell(val, pos, arr)) {
						//console.log("Put " + val + " in arr at pos " + pos);
						arr[pos] = val;
						break;
					}
				}
			}

			// Try to solve sudoku
			console.log("Try to solve sudoku:");
			console.log(arr.join(","));
			var solarr = solver(arr.slice(), 2);
			//console.log("=> Solutions: " + solarr.length);
			if(solarr.length > 0) {
				arr = solarr[0];
				break outer;
			}
		}

		console.log("Generated sudoku in " + totalTries + " tries:");
		console.timeEnd("Elapsed time");
		console.log(arr);

		// Solve it, this will generate a random solved sudoku
		//arr = solve(arr);

		// Now remove values until it has only one solution
		var counter = 0;
		var tries = 0;
		console.log("Now removing numbers...");
		var startTime = new Date();
		while(counter < emptyCells && tries < cells * 50) {
			tries++;
			var index = Math.floor(Math.random() * arr.length);
			var val = arr[index];
			if(val != 0) {
				arr[index] = 0;

				var solarr = solver(arr.slice(), 2)
				//if(arraysEqual(solarr[0], solarr[1])) {
				if(solarr.length == 1) {
					// Exactly one solution -> proceed
					counter++;
				} else {
					// Sudoku cannot be solved exactly anymore, put number back in arr and try another
					arr[index] = val
				}
			}
			// Check max execution time
			var timeDiff = new Date() - startTime;
			if(timeDiff > 20000) {
				console.log("Stopped by max execution time");
				break;
			}
		}

		console.log("Removed " + counter + " numbers in " + tries + " tries.");
		console.log("Finished sudoku:");
		console.log(arr);
		console.log("###### END SUDOKU ######");

		return arr;
	}

}
