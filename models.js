var usingNode = typeof window === 'undefined';
var models = {};

if(usingNode)
{
    var constants = require("./constants");
    var grid_util = require("./grid_util");
}

function GridPosition(x, y)
{
    this.getX = function()
    {
        return x;
    }

    this.getY = function()
    {
        return y;
    }

    this.equals = function(other)
    {
        return other.getX() == getX() && other.getY() == getY();
    }

    var getX = this.getX;
    var getY = this.getY;
    var equals = this.equals;
}

function GridCell(pos, state, energy)
{
    this.getPos = function()
    {
        return pos;
    }

    this.getState = function()
    {
        return state;
    }

    this.getEnergy = function()
    {
        return energy;
    }

    this.equals = function(other)
    {
        var same = getPos().equals(other.getPos());
        same = same && getState() == other.getState();
        same = same && getEnergy() == other.getEnergy();
        return same;
    }

    var getPos = this.getPos;
    var getState = this.getState;
    var getEnergy = this.getEnergy;
    var equals = this.equals;
}

function Grid(xSize, ySize)
{
    var contentsMatrix = new Array(xSize * ySize);
    var chemicalFieldMatrix = new Array(xSize * ySize);
    var activeRecord = new Array(xSize * ySize);
    var lastActiveRecordListing = null;

    var volume = 0;
    var connectedFoodSources = 0;

    this.makeEmpty = function()
    {
        var x;
        var y;
        var i;
        var newPos;
        var newState = constants.UNOCCUPIED;
        
        volume = 0;
        connectedFoodSources = 0;
        clearChemicalField();
        clearActiveRecord();

        i = 0;
        for(y=0; y<ySize; y++)
        {
            for(x=0; x<xSize; x++)
            {
                newPos = new GridPosition(x, y);
                contentsMatrix[i] = new GridCell(newPos, newState, 0);
                i++;
            }
        }
    }

    this.makeRandom = function(food_prob, obstacle_prob)
    {
        var x;
        var y;
        var newPos;
        var newState;
        var newCell;
        
        makeEmpty();

        // Create populations
        for(y=0; y<ySize; y++)
        {
            for(x=0; x<xSize; x++)
            {
                newState = calcRandState(food_prob, obstacle_prob);
                newPos = new GridPosition(x, y);
                newCell = new GridCell(newPos, newState, 0);
                this.replaceCell(getCell(newPos), newCell);
            }
        }
    }

    this.getXSize = function()
    {
        return xSize;
    }

    this.getYSize = function()
    {
        return ySize;
    }

    this.getCell = function(position)
    {
        return getCellByCoord(position.getX(), position.getY());
    }

    this.getCellByCoord = function(xPos, yPos)
    {
        return contentsMatrix[calcCoordIndex(xPos, yPos)];
    }

    this.getVolumeIf = function(replacePos, replaceState)
    {
        var oldState = getCell(replacePos).getState();

        if(replaceState == oldState)
            return volume;

        if(replaceState == constants.OCCUPIED_ORGANISM)
            return volume + 1;
        else if(oldState == constants.OCCUPIED_ORGANISM)
            return volume - 1;
    }

    this.getConnectedFoodSources = function()
    {
        return connectedFoodSources;
    }

    this.setCellNoChem = function(targetCell)
    {
        var i = calcPosIndex(targetCell.getPos());
        contentsMatrix[i] = targetCell;
    }

    // TODO; replaceCell should rely on this... not other way around.
    this.setCell = function(targetCell)
    {
        this.replaceCell(targetCell, targetCell);
    }

    this.replaceCell = function(targetCell, replacementCell)
    {
        var oldPos = targetCell.getPos();
        var newPos = replacementCell.getPos();
        var pos = newPos;
        if(!oldPos.equals(newPos))
        {
            throw new Error(
                "New cell\'s position is different than the old cells\'."
            );
        }

        setCellNoChem(replacementCell);

        // Update chemical field
        if(targetCell.getState() == constants.OCCUPIED_ORGANISM)
        {
            updateChemicalField(
                pos,
                -constants.COHESION_ATTR,
                constants.COHESION_ATTR_DECAY
            );
        }
        
        var newState = replacementCell.getState();
        if(newState == constants.OCCUPIED_ORGANISM)
        {
            updateChemicalField(
                pos,
                constants.COHESION_ATTR,
                constants.COHESION_ATTR_DECAY
            );
        }
        else if(newState == constants.OCCUPIED_FOOD)
        {
            updateChemicalField(
                newPos,
                FOOD_ATTR,
                FOOD_ATTR_DECAY
            );
        }
        else if(newState == constants.OCCUPIED_OBSTACLE)
        {
            updateChemicalField(
                newPos,
                OBSTACLE_REP,
                OBSTACLE_ATTR_DECAY
            );
        }

        // Update volume, connected food sources, and active positions
        var neighbor;
        var neighbors;
        if(replacementCell.getState() == constants.OCCUPIED_ORGANISM)
        {
            if(targetCell.getState() != constants.OCCUPIED_ORGANISM)
                volume++;

            neighbors = grid_util.getNeighbors(this, replacementCell);
            for(var i in neighbors)
            {
                neighbor = neighbors[i];
                if(neighbor != null)
                {
                    if(neighbor.getState() == constants.OCCUPIED_FOOD)
                    {
                        connectedFoodSources++;
                        replaceCell(
                            neighbor,
                            new GridCell(
                                neighbor.getPos(),
                                constants.OCCUPIED_CONNECTED_FOOD,
                                0
                            )
                        );
                    }
                    setActive(neighbor.getPos());
                }
            }

            setActive(pos);
        }
        else if(targetCell.getState() == constants.OCCUPIED_ORGANISM)
        {
            if(replacementCell.getState() != constants.OCCUPIED_ORGANISM)
                volume--;
        }
    }

    this.getActivePos = function()
    {
        if(lastActiveRecordListing == null)
            lastActiveRecordListing = forceGetActivePos();
        return lastActiveRecordListing;
    }

    this.getChemicalFieldVal = function(pos)
    {
        return getChemicalFieldValCoord(pos.getX(), pos.getY())
    }

    this.getChemicalFieldValCoord = function(x, y)
    {
        var i = calcCoordIndex(x, y);
        return chemicalFieldMatrix[i];
    }

    this.updateChemicalField = function(pos, chemVal, decay)
    {
        var minX;
        var maxX;
        var minY;
        var maxY;
        var centerX;
        var centerY;
        var radius;
        var startRadius;
        var effectiveDecay;

        startRadius = Math.abs(chemVal) / decay - 1;
        centerX = pos.getX();
        centerY = pos.getY();

        if(chemVal < 0)
            effectiveDecay = -decay;
        else
            effectiveDecay = decay;

        for(radius = startRadius; radius >= 0; radius--)
        {
            minX = centerX - radius;
            maxX = centerX + radius;
            minY = centerY - radius;
            maxY = centerY + radius;

            updateChemicalFieldArea(minX, minY, maxX, maxY, effectiveDecay);
        }
    }

    var calcRandState = function(food_prob, obstacle_prob)
    {
        var randVal = Math.random();
        if(randVal <= food_prob)
            return constants.OCCUPIED_FOOD;
        randVal -= food_prob;

        if(randVal <= obstacle_prob)
            return constants.OCCUPIED_OBSTACLE;
        randVal -= obstacle_prob;

        return constants.UNOCCUPIED;
    }

    var calcPosIndex = function(pos)
    {
        return calcCoordIndex(pos.getX(), pos.getY());
    }

    var calcCoordIndex = function(xPos, yPos)
    {
        return yPos * xSize + xPos;
    }

    var clearChemicalField = function()
    {
        var numSpaces = ySize * xSize;
        for(var i=0; i<numSpaces; i++)
            chemicalFieldMatrix[i] = 0;
    }

    var updateChemicalFieldArea = function(minX, minY, maxX, maxY, val)
    {
        var x;
        var y;
        var index;

        if(minX < 0)
            minX = 0;
        if(maxX >= xSize)
            maxX = xSize - 1;
        if(minY < 0)
            minY = 0;
        if(maxY >= ySize)
            maxY = ySize - 1;

        for(y=minY; y<=maxY; y++)
        {
            for(x=minX; x<=maxX; x++)
            {
                index = calcCoordIndex(x, y);
                chemicalFieldMatrix[index] += val;
            }
        }
    }

    var setActive = function(pos)
    {
        setActiveCord(pos.getX(), pos.getY());
    }

    var setActiveCord = function(x, y)
    {
        var index = calcCoordIndex(x, y);
        var lastVal = activeRecord[index]

        if(lastVal == false)
        {
            lastActiveRecordListing.push(new GridPosition(x, y));
            activeRecord[index] = true;
        }
    }

    var clearActiveRecord = function()
    {
        var numSpaces = ySize * xSize;
        lastActiveRecordListing = new Array();
        for(var i = 0; i < numSpaces; i++)
            activeRecord[i] = false;
    }

    var forceGetActivePos = function()
    {
        var i;
        var x;
        var y;
        var retList = new Array();

        for(y=0; y<ySize; y++)
        {
            for(x=0; x<xSize; x++)
            {
                i = calcCoordIndex(x, y);
                // TODO: This could be bad for locality
                if(activeRecord[i] == true)
                    retList.push(new GridPosition(x, y));
            }
        }

        return retList;
    }

    var makeEmpty = this.makeEmpty;
    var makeRandom = this.makeRandom;
    var replaceCell = this.replaceCell;
    var getXSize = this.getXSize;
    var getYSize = this.getYSize;
    var getCell = this.getCell;
    var getCellByCoord = this.getCellByCoord;
    var getVolumeIf = this.getVolumeIf;
    var getConnectedFoodSources = this.getConnectedFoodSources;
    var getActivePos = this.getActivePos;
    var getChemicalFieldVal = this.getChemicalFieldVal;
    var getChemicalFieldValCoord = this.getChemicalFieldValCoord;
    var setCell = this.setCell;
    var setCellNoChem = this.setCellNoChem;
    var updateChemicalField = this.updateChemicalField;

    makeEmpty();
}

if(usingNode)
{
    exports.GridPosition = GridPosition;
    exports.GridCell = GridCell;
    exports.Grid = Grid;
}
else
{
    models.GridPosition = GridPosition;
    models.GridCell = GridCell;
    models.Grid = Grid;
}
