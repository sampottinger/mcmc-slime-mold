/**
 * Convenience routines for high level logic for models.Grid.
 *
 * @author Sam Pottinger
 * @license GNU GPL v3
**/

var usingNode = typeof window === 'undefined';
var grid_util = {};

if(usingNode)
{
    var constants = require("./constants");
    var models = require("./models");
}


/**
 * Determines if the given pos is within the given grid.
 *
 * @param {models.Grid} grid The grid to check bounds for.
 * @para {models.GridPosition} pos The position to check.
 * @return {boolean} true if pos is within the bounds of grid and false
 *      otherwise.
**/
function isInRange(grid, pos)
{
    var posX = pos.getX();
    var posY = pos.getY();
    var xInRange = posX >= 0 && posX < grid.getXSize();
    var yInRange = posY >= 0 && posY < grid.getYSize();
    return xInRange && yInRange;
}


/**
 * Get the positions neighboring (adjacent and diagonal) the given position.
 *
 * @param {models.Grid} grid The grid to get neighboring cells from.
 * @param {models.GridPosition} pos The position to get neighboring positions
 *      for.
 * @return {array} Array with 8 elements consisting of neighboring
 *      models.GridPositions and null.
**/
function getNeighborPos(grid, centerPos)
{
    var posX = centerPos.getX();
    var posY = centerPos.getY();

    var startY = posY - 1;
    var endY = posY + 1;
    var startX = posX - 1;
    var endX = posX + 1;

    var x;
    var y;
    var newPos;
    var i = 0;
    var neighborPositions = new Array(8);
    for(y=startY; y<=endY; y++)
    {
        for(x=startX; x<=endX; x++)
        {
            newPos = new models.GridPosition(x, y);
            if(!newPos.equals(centerPos) && isInRange(grid, newPos))
            {
                neighborPositions[i] = newPos;
                i++;
            }
        }
    }

    for(; i<8; i++)
        neighborPositions[i] = null;

    return neighborPositions;
}


/**
 * Get the cells neighboring (adjacent and diagonal) the given position.
 *
 * @param {models.Grid} grid The grid to get neighboring cells from.
 * @param {models.GridPosition} pos The position to get neighboring cells for.
 * @return {array} Array with 8 elements consisting of neighboring
 *      models.GridCells and null.
**/
function getNeighbors(grid, cell)
{
    var neighborPos = getNeighborPos(grid, cell.getPos());
    return neighborPos.map(
        function(val)
        {
            if(val != null)
                return grid.getCell(val);
            else
                return null;
        }
    );
}


/**
 * Get the state of the call at the given coordinates.
 *
 * @param {int} x The x component of the coordinate to look up.
 * @param {int} y The y component of the coordinate to look up.
 * @return {int} Constant corresponding to value in constants.js describing the
 *      state of the cell at the given coordinate. Returns constants.UNOCCUPIED
 *      if coordinates outside bounds of grid.
**/
function getCellStateCoordiantes(grid, x, y)
{
    var cell = grid.getCellByCoord(x, y);
    if(cell == null)
        return constants.UNOCCUPIED;
    else
        return cell.getState();
}


/**
 * Determine if the given coordinate is occupied by an organism.
 *
 * @param {models.Grid} grid The grid to check for an organism in.
 * @param {int} x The x component of the coordinate to look up.
 * @param {int} y The y component of the coordinate to look up.
 * @return {boolean} true if the given coordinate is occupied by an organism
 *      and false otherwise. Returns false if coordinates out of bounds of grid.
**/
function isCoordianteOccupiedByOrganism(grid, x, y)
{
    return getCellStateCoordiantes(grid, x, y) == constants.OCCUPIED_ORGANISM;
}


/**
 * Get the cells (plus a few) that may change in the next metropolis step.
 *
 * Get the cells that are "naturally active" (previously or currently contain an
 * organism) or that border a "naturally" active cell.
 *
 * @param {models.Grid} The grid to find active cells in.
 * @return {array} Array of models.GridCell of cells that are "active" cells.
 * @note Guaranteed to contain all cells that might change state in the next
 *      metropolis step but may contain some cells that cannot change in the
 *      next step.
**/
function getActiveCells(grid)
{
    var activeCellPos = grid.getActivePos();
    return activeCellPos.map(grid.getCell);
}


if(usingNode)
{
    exports.isInRange = isInRange;
    exports.getNeighborPos = getNeighborPos;
    exports.getNeighbors = getNeighbors;
    exports.getCellStateCoordiantes = getCellStateCoordiantes;
    exports.isCoordianteOccupiedByOrganism = isCoordianteOccupiedByOrganism;
    exports.getActiveCells = getActiveCells;
}
else
{
    grid_util.isInRange = isInRange;
    grid_util.getNeighborPos = getNeighborPos;
    grid_util.getNeighbors = getNeighbors;
    grid_util.getCellStateCoordiantes = getCellStateCoordiantes;
    grid_util.isCoordianteOccupiedByOrganism = isCoordianteOccupiedByOrganism;
    grid_util.getActiveCells = getActiveCells;
}
