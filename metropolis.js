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


/**
 * Calculate the probability of making a change in a grid.
 *
 * @param {float} origEnergy The original energy of the cell that may be
 *      changed.
 * @param {float} candidateEnergy The new energy of the cell after the potential
 *      change.
 * @return {float} The probability under the metropolis algorithm that this
 *      change should occur.
**/
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


/**
 * Determines if an even with the given chance should be accepted.
 *
 * Generates a random number to see if an event with the given chance should be
 * accepted.
 *
 * @param {float} The chance (0 to 1) that this event should be accepted.
 * @return {boolean} true if this event should be accepted and false otherwise.
**/
function shouldAccept(acceptChance)
{
    return Math.random() <= acceptChance;
}


/**
 * Run the metropolis algorithm on a given grid cell.
 *
 * Runs the metropolis algorithm on a given grid cell, potentially changing its
 * state given the randomly selected neighbor to potentially copy and some
 * randomness.
 *
 * @param {models.Grid} grid The grid to run the metropolis algorithm on.
 * @param {models.GridCell} targetCell The cell to run the metropolis algorithm
 *      on.
 * @return {boolean} true if a change was made and false otherwise.
**/
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
        /*var willBreak = grid_util.willBreakIfLost(grid, targetCell);
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


/**
 * Run a step in the Metropolis algorithm.
 *
 * Runs the Metropolis algorithm on all of the given grid's active cells but
 * ignores all non-"active" cells.
 *
 * @param {models.Grid} grid The grid to run the Metropolis algorithm on.
**/
function runMetropolisStep(grid)
{
    var targetCell = null;
    // TODO: This might not be good for locality
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
