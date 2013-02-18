var usingNode = typeof window === 'undefined';
var grid_util = {};

if(usingNode)
{
    var constants = require("./constants");
    var models = require("./models");
}

function isInRange(grid, pos)
{
    var posX = pos.getX();
    var posY = pos.getY();
    var xInRange = posX >= 0 && posX < grid.getXSize();
    var yInRange = posY >= 0 && posY < grid.getYSize();
    return xInRange && yInRange;
}

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

function getCellStateCoordiantes(grid, x, y)
{
    var cell = grid.getCellByCoord(x, y);
    if(cell == null)
        return constants.UNOCCUPIED;
    else
        return cell.getState();
}

function isCoordianteOccupiedByOrganism(grid, x, y)
{
    return getCellStateCoordiantes(grid, x, y) == constants.OCCUPIED_ORGANISM;
}

function willBreakIfLost(grid, targetCell)
{
    var edgeNeighbors = 0;
    var targetPos = targetCell.getPos();
    var x = targetPos.getX();
    var y = targetPos.getY();

    if(targetCell.getState() == constants.UNOCCUPIED)
        return false;

    edgeNeighbors += isCoordianteOccupiedByOrganism(grid, x + 1, y) ? 1 : 0;
    edgeNeighbors += isCoordianteOccupiedByOrganism(grid, x - 1, y) ? 1 : 0;
    edgeNeighbors += isCoordianteOccupiedByOrganism(grid, x, y - 1) ? 1 : 0;
    edgeNeighbors += isCoordianteOccupiedByOrganism(grid, x, y + 1) ? 1 : 0;

    return edgeNeighbors == 2;
}

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
    exports.willBreakIfLost = willBreakIfLost;
    exports.getActiveCells = getActiveCells;
}
else
{
    grid_util.isInRange = isInRange;
    grid_util.getNeighborPos = getNeighborPos;
    grid_util.getNeighbors = getNeighbors;
    grid_util.getCellStateCoordiantes = getCellStateCoordiantes;
    grid_util.isCoordianteOccupiedByOrganism = isCoordianteOccupiedByOrganism;
    grid_util.willBreakIfLost = willBreakIfLost;
    grid_util.getActiveCells = getActiveCells;
}
