var constants = require("./constants")
var models = require("./models");

exports.testGetActiveCells = function(test)
{
    var testGrid = new models.Grid(5, 5);
    var pos0 = new models.GridPosition(0, 1);
    var pos1 = new models.GridPosition(1, 1);
    var pos2 = new models.GridPosition(2, 1);
    var pos3 = new models.GridPosition(3, 1);
    var cell1 = new models.GridCell(pos1, constants.OCCUPIED_ORGANISM, 1);
    var cell2 = new models.GridCell(pos2, constants.OCCUPIED_ORGANISM, 1);
    var cell3 = new models.GridCell(pos3, constants.OCCUPIED_OBSTACLE, 1);

    // Expected volume after block == 2
    testGrid.replaceCell(testGrid.getCell(pos1), cell1);
    testGrid.replaceCell(testGrid.getCell(pos2), cell2);
    testGrid.replaceCell(testGrid.getCell(pos2), cell2);
    testGrid.replaceCell(testGrid.getCell(pos3), cell3);

    // Test if values
    test.equal(testGrid.getVolumeIf(pos0, constants.OCCUPIED_ORGANISM), 3);
    test.equal(testGrid.getVolumeIf(pos0, constants.UNOCCUPIED), 2);
    test.equal(testGrid.getVolumeIf(pos1, constants.OCCUPIED_ORGANISM), 2);
    test.equal(testGrid.getVolumeIf(pos1, constants.UNOCCUPIED), 1);
    test.done();
}

exports.testUpdateChemicalField = function(test)
{
    var testGrid = new models.Grid(5, 5);
    testVals = [
        1, 1, 1, 1, 1,
        1, 2, 2, 2, 1,
        1, 2, 3, 2, 1,
        1, 2, 2, 2, 1,
        1, 1, 1, 1, 1
    ]
    pos = new models.GridPosition(2, 2);

    testGrid.updateChemicalField(pos, 3, 1);

    for(var y = 0; y < 5; y++)
    {
        for(var x = 0; x < 5; x++)
        {
            test.equal(
                testVals[y * 5 + x], // TODO: Terrible magic constants.
                testGrid.getChemicalFieldValCoord(x, y)
            );
        }
    }

    test.done();
}
