/**
 * Driver that starts iteration in the slime mold simulation.
 *
 * @author Sam Pottinger
 * @license GNU GPL v3
**/

var usingNode = typeof window === 'undefined';
var staleIterationsBeforeStopping;
var updateTimerID = null;
var testGrid;

if(usingNode)
{
    var constants = require("./constants");
    var metropolis = require("./metropolis");
    var models = require("./models");
    var view = require("./view");
}


/**
 * A "main" method that sets up the slime mold simulation and starts iteration.
**/
var resetSimulation = function()
{
    if(updateTimerID != null)
        window.clearInterval(updateTimerID);

    testGrid = new models.Grid(GRID_HORIZ_SPACES, GRID_VERT_SPACES);
    testGrid.makeRandom(0.012, 0.006);
    centerX = Math.floor(constants.GRID_HORIZ_SPACES / 2);
    centerY = Math.floor(constants.GRID_VERT_SPACES / 2);
    startFoodPos = new models.GridPosition(centerX, centerY);
    startFood = new models.GridCell(
        startFoodPos,
        constants.OCCUPIED_FOOD,
        0
    );
    testGrid.setCell(startFood);
    startOrganismPos = new models.GridPosition(centerX-1, centerY);
    startOrganism = new models.GridCell(
        startOrganismPos,
        constants.OCCUPIED_ORGANISM,
        0
    );
    testGrid.setCell(startOrganism);
    view.displayGrid(testGrid);

    staleIterationsBeforeStopping = 20; // TODO: Constant
    updateTimerID = window.setInterval(updateSimulation, 150);
};


$(document).ready(function()
    {
        resetSimulation();
        $("#reset-link").click(resetSimulation);
    });


/**
 * Take a step in the metropolis algorithm running the slime mold simulation.
**/
function updateSimulation()
{
    if(!metropolis.runMetropolisStep(testGrid))
        staleIterationsBeforeStopping--;
    if(staleIterationsBeforeStopping <= 0)
    {
        window.clearInterval(updateTimerID);
        updateTimerID = null;
    }
    view.displayGrid(testGrid);
}
