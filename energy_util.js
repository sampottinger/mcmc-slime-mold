var usingNode = typeof window === 'undefined';
var energy_util = {};

if(usingNode)
{
    var constants = require("./constants");
}

function calculateInterCellEnergy(grid, cell)
{
    return grid.getChemicalFieldVal(cell.getPos());
}

function calculateIntraCellEnergy(grid, cell)
{
    return calculateInterCellEnergy(grid, cell) / 2;
}

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

// Only works with occupied v unoccupied
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
