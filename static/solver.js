function helper(f, x, y) {
  var field = f;
  var xSize = x;
  var ySize = y;
  var size = field.length;

  return function() {
    var result = solveSudoku(field);
    if(result.isError) return "Fehler in Feld " + result.errorCell;

    var nakedSingle = findNakedSingle();
    if(nakedSingle) return "Nackter Einser: " + nakedSingle;

    var hiddenSingle = findHiddenSingle();
    if(hiddenSingle) return "Versteckter Einser: " + hiddenSingle;

    // TODO several other solving methods
  }

  function findNakedSingle() {
    for(var i = 0; i < size, i++) {
      if(field[i].value == 0) {
        var vals = {};
        //for(var i = 1; i <= 9; i++) possibleVals.push(i);

        for(var num = 0; num < 9; num++) {
          var row = getRow(i);
          var col = getCol(i);
          var block = getBlock(i);

          var val = field[row+num];
          if(val) vals[val] = true;

          val = field[col+num*9];
          if(val) vals[val] = true;

          val = field[block + num%3 + Math.floor(num/3)*9];
          if(val) vals[val] = true;
        }
      }
    }
  }

  // Utility functions
  function getRow(cell) {
    return Math.floor(cell / size);
  }
  function getCol(cell) {
    return cell % size;
  }
  function getBlock(cell) {
    return Math.floor(cell/(size*ySize))*ySize +
           Math.floor(getCol(cell) / xSize);
  }
}
