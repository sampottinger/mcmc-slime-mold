/**
 * Data models / structures for a slime mold simulation.
 *
 * @author Sam Pottinger
 * @license GNU GPL v3
**/

var usingNode = typeof window === 'undefined';
var models = {};

if(usingNode)
{
    var constants = require("./constants");
    var grid_util = require("./grid_util");
}


/**
 * Structure representing a coordinate on a 2D plane.
 *
 * @param {int} x The x coordinate of this position.
 * @param {int} y The y coordinate of this position.
**/
function GridPosition(x, y)
{
    /**
     * Get the x component of this position.
     *
     * @return {int} The x coordinate of this position.
    **/
    this.getX = function()
    {
        return x;
    }

    /**
     * Get the y component of this position.
     *
     * @return {int} The y coordinate of this position.
    **/
    this.getY = function()
    {
        return y;
    }

    /**
     * Determines if the given positions are the same by value.
     *
     * @param {GridPosition} other The position to compare this position
     *      to.
     * @return {boolean} true if other is the same as this position and false
     *      otherwise.
    **/
    this.equals = function(other)
    {
        return other.getX() == getX() && other.getY() == getY();
    }

    var getX = this.getX;
    var getY = this.getY;
    var equals = this.equals;
}


/**
 * Structure representing a cell in a slime mold simulation grid.
 *
 * @param {CellPosition} pos The position of this cell.
 * @param {int} state Constant from constants.js describing what this cell
 *      contains.
 * @param {int} energy The starting energy state of this cell.
**/
function GridCell(pos, state, energy)
{
    /**
     * Get the position of this cell.
     *
     * @return {GridPosition} the position of this cell.
    **/
    this.getPos = function()
    {
        return pos;
    }

    /**
     * Get the state of this cell.
     *
     * @return {int} State constant from constants.js
    **/
    this.getState = function()
    {
        return state;
    }

    /**
     * Get the energy of this cell.
     *
     * @return {float} The energy (from the chemical field) of this cell.
    **/
    this.getEnergy = function()
    {
        return energy;
    }

    /**
     * Determines if two cells are the same by value.
     *
     * @param other {GridCell} The cell to compare against.
     * @return {boolean} true if other is the same by value as this cell or
     *      false otherwise.
    **/
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


/**
 * Create a new empty slime mold simulation grid.
 *
 * @param {int} xSize The horizontal size of this grid in spaces.
 * @param {int} ySize The vertical size of this grid in spaces.
**/
function Grid(xSize, ySize)
{
    var contentsMatrix = new Array(xSize * ySize);
    var chemicalFieldMatrix = new Array(xSize * ySize);
    var activeRecord = new Array(xSize * ySize);
    var lastActiveRecordListing = null;

    var volume = 0;
    var connectedFoodSources = 0;

    /**
     * Clear this simulation grid.
    **/
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

    /**
     * Fill this grid with random non-organism contents.
     *
     * Fill this grid with randomly placed non-connected food and obstacle
     * cells.
     *
     * @param {float} food_prob probability of a space containing food (0 to 1).
     * @param {float} obstacle_prob probability of a space containing an
     *      obstacle (0 to 1).
    **/
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

    /**
     * Get the horizontal size of this grid.
     *
     * @return {int} The x-size / horizontal size of this grid in spaces.
    **/
    this.getXSize = function()
    {
        return xSize;
    }

    /**
     * Get the vertical size of this grid.
     *
     * @return {int} The y-size / vertical size of this grid in spaces.
    **/
    this.getYSize = function()
    {
        return ySize;
    }

    /**
     * Get the cell at the given position.
     *
     * @param {GridPosition} position The position within this grid to
     *      get the cell for.
     * @return {GridCell} The cell at the given position.
    **/
    this.getCell = function(position)
    {
        return getCellByCoord(position.getX(), position.getY());
    }

    /**
     * Get the cell at the given coordinates.
     *
     * @param {int} xPos The x coordinate of the cell to retrieve.
     * @param {int} yPos The y coordinate of the cell to retrieve.
     * @return {GridCell} The cell at the given coordinate.
    **/
    this.getCellByCoord = function(xPos, yPos)
    {
        return contentsMatrix[calcCoordIndex(xPos, yPos)];
    }

    /**
     * Get the volume of the organism after the given step is taken.
     *
     * Get what the volume of this grid's organism would be after the given
     * state replaces the state at the given position.
     *
     * @param {GridPosition} replacePos The position of the cell that would get
     *      its state replaced.
     * @param {int} replaceState The state that would replace the state at
     *      replacePos.
     * @return The volume of the organism on this grid if the cell at replacePos
     *      has its state replaced by replaceState.
    **/
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


    /**
     * Get the number of food sources that the organism has connected to.
     *
     * @return {int} The number of food source the organism has connected to.
     * @note Includes formerly connected food sources (in aggregate the
     *      distinction appears not to matter in this simulation's scale.
    **/
    this.getConnectedFoodSources = function()
    {
        return connectedFoodSources;
    }


    /**
     * Insert a cell into this grid without updating the grid chemical field.
     *
     * Insert a cell into this grid without updating the grid chemical field,
     * overwriting the old cell at the provided position if one exists.
     *
     * @param {GridCell} targetCell the cell to insert.
    **/
    this.setCellNoChem = function(targetCell)
    {
        var i = calcPosIndex(targetCell.getPos());
        contentsMatrix[i] = targetCell;
    }


    /**
     * Insert a cell into this grid while updating the grid chemical field.
     *
     * Insert a cell into this grid while updating the grid chemical field,
     * overwriting the old cell at the provided position if one exists.
     *
     * @param {GridCell} targetCell the cell to insert.
    **/
    this.setCell = function(targetCell)
    {
        // TODO: replaceCell should rely on this... not other way around.
        this.replaceCell(targetCell, targetCell);
    }

    /**
     * Replace a cell within a grid, updating the chemical field.
     *
     * @param {GridCell} targetCell The cell to replace.
     * @param {GridCell} replacementCell The cell to replace targetCell with.
    **/
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
                constants.FOOD_ATTR,
                constants.FOOD_ATTR_DECAY
            );
        }
        else if(newState == constants.OCCUPIED_OBSTACLE)
        {
            updateChemicalField(
                newPos,
                constants.OBSTACLE_REP,
                constants.OBSTACLE_ATTR_DECAY
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

    /**
     * Get the list of active positions.
     *
     * Get the cells that are "naturally active" (previously or currently
     * contain an organism) or that border a "naturally" active cell.
     *
     * @return {array} Array of GridPosition indicating which positions contain
     *      active cells.
    **/
    this.getActivePos = function()
    {
        if(lastActiveRecordListing == null)
            lastActiveRecordListing = forceGetActivePos();
        return lastActiveRecordListing;
    }

    /**
     * Get the energy value of the chemical field at the given position.
     *
     * @param {GridPosition} pos The position at which to query the chemical
     *      field.
     * @return {float} The energy value at the given position in this grid's
     *      chemical field.
    **/
    this.getChemicalFieldVal = function(pos)
    {
        return getChemicalFieldValCoord(pos.getX(), pos.getY())
    }

    /**
     * Get the energy value of the chemical field at the given coordinates
     *
     * @param {int} x The x coordinate to query the chemical field at.
     * @param {int} y The y coordinate to query the chemical field at.
     * @return {float} The energy value at the given set of coordinates in this
     *      grid's chemical field.
    **/
    this.getChemicalFieldValCoord = function(x, y)
    {
        var i = calcCoordIndex(x, y);
        return chemicalFieldMatrix[i];
    }

    /**
     * Update the chemical field at the given position.
     *
     * Update the chemical field at the given position with dissipation using
     * the given central position, value, and decay settings.
     *
     * @param {GridPosition} pos The center of the section to update.
     * @param {float} chemVal The value to add to the chemical field at pos.
     * @param {float} decay The decay in the radiating effect of chemVal (
     *      decay is subtracted each space out from pos). This should be a
     *      positive decay regardless of the sign of chemVal.
    **/
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

    /**
     * Calculate a random GridSpace state.
     *
     * Calculate a random GridSpace state, selecting from food, unoccupied, and
     * obstacle.
     *
     * @param {float} foodProb The probability (0 to 1) that the returned state
     *      will be constants.OCCUPIED_FOOD
     * @param {float} obstacleProb The probability (0 to 1) that the returned
     *      state will be constants.OCCUPIED_OBSTACLE
     * @return Random GridSpace state.
    **/
    var calcRandState = function(foodProb, obstacleProb)
    {
        var randVal = Math.random();
        if(randVal <= foodProb)
            return constants.OCCUPIED_FOOD;
        randVal -= foodProb;

        if(randVal <= obstacleProb)
            return constants.OCCUPIED_OBSTACLE;
        randVal -= obstacleProb;

        return constants.UNOCCUPIED;
    }

    /**
     * Calculate the index of a position in this grid's contents matrix.
     *
     * @param {GridPosition} pos The position in the grid to calculate the index
     *      for.
     * @return {int} The index in the contents matrix for the given position.
    **/
    var calcPosIndex = function(pos)
    {
        return calcCoordIndex(pos.getX(), pos.getY());
    }

    /**
     * Calculate the index of 2D coordinates in this grid's contents matrix.
     *
     * @param {int} xPos The x coordinate to generate an index for.
     * @param {int} yPos The y coordinate to generate an index for.
     * @return {int} The index in the contents matrix for the given coordinates.
    **/
    var calcCoordIndex = function(xPos, yPos)
    {
        return yPos * xSize + xPos;
    }

    /**
     * Clear the chemical field for this grid.
    **/
    var clearChemicalField = function()
    {
        var numSpaces = ySize * xSize;
        for(var i=0; i<numSpaces; i++)
            chemicalFieldMatrix[i] = 0;
    }

    /**
     * Update part of the chemical field without dissipation.
     *
     * @param {int} minX The minimum x value of the bounding box to update.
     * @param {int} minY The minimum y value of the bounding box to update.
     * @param {int} maxX The maximum x value of the bounding box to update.
     * @param {int} maxY The maximum y value of the bounding box to update.
     * @param {float} val The value to add to the chemical field in the bounding
     *      box.
    **/
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

    /**
     * Indicate the cell at the given position as an "active" cell.
     *
     * @param {GridPosition} pos The position to set as an "active" position.
    **/
    var setActive = function(pos)
    {
        setActiveCord(pos.getX(), pos.getY());
    }

    /**
     * Indicate the cell at the given coordinates as an "active" cell.
     *
     * @param {int} x The x coordinate of the cell to set as active.
     * @param {int} y The y coordinate of the cell to set as active.
    **/
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

    /**
     * Set all "active" cells as not active.
    **/
    var clearActiveRecord = function()
    {
        var numSpaces = ySize * xSize;
        lastActiveRecordListing = new Array();
        for(var i = 0; i < numSpaces; i++)
            activeRecord[i] = false;
    }

    /**
     * Force a refresh of the classification of cells as active or not active.
    **/
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
