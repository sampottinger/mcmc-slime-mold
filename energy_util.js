/**
 * Routines to calculate changes in system energy for a slime mold simulation.
 *
 * @author Sam Pottinger
 * @license GNU GPL v3
**/

var usingNode = typeof window === 'undefined';
var energy_util = {};

if(usingNode)
{
    var constants = require("./constants");
}


/**
 * Calculate the energy of a grid location in relationship to cells around it.
 *
 * Calculates the energy of a grid location but only includes the energy in
 * relationship to the provided cell to the cells around it. The energy of a
 * cell is the sum of its inter-cell and intra-cell energies.
 *
 * @param {models.Grid} grid The grid from which an energy calculation is being
 *      requested.
 * @param {models.GridCell} cell The cell for which inter-cell energy is being
 *      requested.
 * @return {float} The inter-cell energy for the given cell.
**/
function calculateInterCellEnergy(grid, cell)
{
    return grid.getChemicalFieldVal(cell.getPos());
}


/**
 * Calculate the energy of a grid location in relationship to itself.
 *
 * Calculates the energy of a grid location but only includes the energy in
 * relationship to the provided cell to itself. The energy of a cell is the sum
 * of its inter-cell and intra-cell energies.
 *
 * @param {models.Grid} grid The grid from which an energy calculation is being
 *      requested.
 * @param {models.GridCell} cell The cell for which intra-cell energy is being
 *      requested.
 * @return {float} The intra-cell energy for the given cell.
**/
function calculateIntraCellEnergy(grid, cell)
{
    return calculateInterCellEnergy(grid, cell) / 2;
}


/**
 * Adjusts an energy change of a grid cell based on volume constraints.
 *
 * Adjusts the potential energy change of a grid cell to reflect the size of the
 * organism in relationship to the number of food sources it has connected to.
 * Will help to limit the size of the slime mold to be roughly proportional to
 * the number of food sources it has access to.
 * 
 * @param {models.GridPosition} replacePos The position where the cell state is
 *      being changed.
 * @param {int} replaceState The state that is being considered for replacing
 *      the current state of the cell at replacePos.
 * @param {float} candidateEnergy The new energy of the cell at replacePos if
 *      replaceState is accepted before being adjusted for volume.
 * @param {models.Grid} The grid on which the change in cell state is being
 *      considered.
 * @return {float} The provided candidateEnergy adjusted for forces related to
 *      volume.
**/
function adjustForVolume(replacePos, replaceState, candidateEnergy, grid)
{
    var curVolume = grid.getVolumeIf(replacePos, replaceState);
    var connectedFoodSources = grid.getConnectedFoodSources();
    var idealDelta = curVolume - constants.IDEAL_VOLUME * connectedFoodSources;
    var newEnergy = candidateEnergy + constants.VOLUME_WEIGHT * idealDelta;
    if(replaceState == constants.UNOCCUPIED)
        newEnergy -= 0.1;
    return newEnergy;
}


/**
 * Calculate the change in energy if the given targetCell moves into pos.
 *
 * Calculate the change in energy that the system would incur if the state at
 * targetCell moves into the cell at the provided pos.
 *
 * @param {models.Grid} grid The grid where the proposed changed would occur and
 *      where the change in energy should be calculated.
 * @param {models.GridPosition} pos The position where the state change would
 *      occur and where the change in energy should be calculated.
 * @param {models.GridCell} targetCell The cell whose state is being considered
 *      for moving into pos.
 * @return {float} The change in energy if targetCell's state moves into the
 *      cell at pos.
 * @throws {Error} Error thrown if the current or new state is food or obstacle.
 * @note Does not support energy change calculations involving adding / removing
 *      food or obstacles.
**/
function calculateEnergyIf(grid, pos, targetCell)
{
    // Calculate raw energy (raw Hamiltonian without constraints)
    var candidateEnergy = 0;
    var currentCell = grid.getCell(pos);
    var currentState = currentCell.getState();
    var newState = targetCell.getState();

    var invalid = currentState == constants.OCCUPIED_FOOD;
    invalid = invalid || currentState == constants.OCCUPIED_OBSTACLE;
    invalid = invalid || currentState == constants.OCCUPIED_CONNECTED_FOOD;
    invalid = invalid || newState == constants.OCCUPIED_FOOD;
    invalid = invalid || newState == constants.OCCUPIED_OBSTACLE;
    invalid = invalid || newState == constants.OCCUPIED_CONNECTED_FOOD;
    if(invalid)
    {
        throw new Error(
            "Energy calculation does not work with changing obstacles or food."
        );
    }

    // Between cell forces
    candidateEnergy += calculateInterCellEnergy(
        grid,
        targetCell
    );

    // Within cell forces
    candidateEnergy += calculateIntraCellEnergy(
        grid,
        targetCell
    );

    // Adjust candidate energy for volume constraints
    candidateEnergy = adjustForVolume(
        pos,
        targetCell.getState(),
        candidateEnergy,
        grid
    );

    if(currentState == constants.OCCUPIED_ORGANISM && 
        newState == constants.UNOCCUPIED)
    {
        return -candidateEnergy;
    }
    else if(currentState == constants.UNOCCUPIED && 
        newState == constants.OCCUPIED_ORGANISM)
    {
        return candidateEnergy;
    }
    else
        return 0;
}

/**
 * Calculate the energy if the given cell is added to the grid.
 *
 * Calculates the energy change to the "system" if the given targetCell is
 * added to the given grid, overwriting the cell that already existed there.
 *
 * @param {models.Grid} grid The grid to which targetCell would be assigned and
 *      where the energy change calculation should happen.
 * @param {models.GridCell} cell The cell that is being considered for being 
 *      added to grid.
 * @return {float} The change in energy that would occur to the grid's "system"
 *      if targetCell is added to grid.
**/
function calculateEnergy(grid, targetCell)
{
    return calculateEnergyIf(
        grid,
        targetCell.getPos(),
        targetCell
    );
}


if(usingNode)
{
    exports.calculateInterCellEnergy = calculateInterCellEnergy;
    exports.calculateIntraCellEnergy = calculateIntraCellEnergy;
    exports.adjustForVolume = adjustForVolume;
    exports.calculateEnergyIf = calculateEnergyIf;
    exports.calculateEnergy = calculateEnergy;
}
else
{
    energy_util.calculateInterCellEnergy = calculateInterCellEnergy;
    energy_util.calculateIntraCellEnergy = calculateIntraCellEnergy;
    energy_util.adjustForVolume = adjustForVolume;
    energy_util.calculateEnergyIf = calculateEnergyIf;
    energy_util.calculateEnergy = calculateEnergy;
}
