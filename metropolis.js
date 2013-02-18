/**
 * Implementation of metropolis alg. for a physarum polycephalum simulation.
 *
 * @author Sam Pottinger
 * @license GNU GPL v3
**/

var usingNode = typeof window === 'undefined';
var metropolis = {};

if(usingNode)
{
    var constants = require("./constants");
    var energy_util = require("./energy_util");
    var grid_util = require("./grid_util");
    var math_util = require("./math_util");
}

function calculateAcceptProbability(origEnergy, candidateEnergy)
{
    var deltaEnergy = candidateEnergy - origEnergy;
    if(deltaEnergy < -constants.YIELD_OFFSET)
    {
        return 1;
    }
    else
    {
        var acceptanceCutOff = -(deltaEnergy + constants.YIELD_OFFSET);
        var acceptanceCutOff = acceptanceCutOff / constants.FLUCTUATION_AMPLITUDE;
        return Math.exp(acceptanceCutOff);
    }
}

function shouldAccept(acceptChance)
{
    return Math.random() <= acceptChance;
}

function runMetropolisCell(grid, targetCell)
{
    // Select target cells
    var origEnergy = targetCell.getEnergy();
    var targetCellNeighbors = grid_util.getNeighbors(grid, targetCell);
    var targetNeighborIndex = math_util.randInt(0, targetCellNeighbors.length);
    var targetNeighbor = targetCellNeighbors[targetNeighborIndex];
    if(targetNeighbor == null)
        return;
    var targetNeighborState = targetNeighbor.getState();
    var origState = targetCell.getState();

    // Make sure not copying obstacle or food source
    var invalid;
    invalid = origState == targetNeighborState;
    invalid = invalid || targetNeighborState == constants.OCCUPIED_CONNECTED_FOOD;
    invalid = invalid || targetNeighborState == constants.OCCUPIED_FOOD;
    invalid = invalid || targetNeighborState == constants.OCCUPIED_OBSTACLE;
    invalid = invalid || origState == constants.OCCUPIED_CONNECTED_FOOD;
    invalid = invalid || origState == constants.OCCUPIED_FOOD;
    invalid = invalid || origState == constants.OCCUPIED_OBSTACLE;
    if(invalid)
        return false;

    // Make sure different states
    if(targetNeighborState == origState)
        return false;

    // TODO: Adjust candidate energy for repulsion constraints
    var candidateEnergy = energy_util.calculateEnergyIf(
        grid,
        targetCell.getPos(),
        targetNeighbor
    );

    // Adopt neighbor if appropriate
    var acceptChance = calculateAcceptProbability(origEnergy, candidateEnergy);
    if(shouldAccept(acceptChance))
    {
        // Don't allow to break connections
        /*var willBreak = targetNeighbor.getState() == constants.UNOCCUPIED;
        willBreak = willBreak && grid_util.willBreakIfLost(grid, targetCell);
        if(willBreak)
            return false;*/

        var replacementCell = new models.GridCell(
            targetCell.getPos(),
            targetNeighborState,
            candidateEnergy
        );
        grid.replaceCell(targetCell, replacementCell)
        return true;
    }
    else
    {
        return false;
    }
}

// TODO: This might not be good for locality
function runMetropolisStep(grid)
{
    var targetCell = null;
    var targetCells = grid_util.getActiveCells(grid);
    for(var i in targetCells)
        runMetropolisCell(grid, targetCells[i]);
}

if(usingNode)
{
    exports.calculateAcceptProbability = calculateAcceptProbability;
    exports.shouldAccept = shouldAccept;
    exports.runMetropolisCell = runMetropolisCell;
    exports.runMetropolisStep = runMetropolisStep;
}
else
{
    metropolis.calculateAcceptProbability = calculateAcceptProbability;
    metropolis.shouldAccept = shouldAccept;
    metropolis.runMetropolisCell = runMetropolisCell;
    metropolis.runMetropolisStep = runMetropolisStep;
}
