var usingNode = typeof window === 'undefined';
var view = {};

if(usingNode)
{
    var constants = require("./constants");
    var models = require("./models");
}

function displayGrid(grid)
{
    var cell;
    var cellState;
    var draw;
    var drawColor;
    var centerX;
    var centerY;
    var startFoodPos;
    var startOrganismPos;
    var startFood;
    var startOrganism;
    var canvas = $(constants.DISPLAY_CANVAS_ID)[0];
    var context = canvas.getContext("2d");

    // Clear what is there
    context.strokeStyle = "#FFFFFF";
    context.fillStyle = "#FFFFFF";
    context.fillRect(0, 0, constants.CANVAS_WIDTH, constants.CANVAS_HEIGHT);

    var maxX = grid.getXSize();
    var maxY = grid.getYSize();
    for(var y=0; y<maxY; y++)
    {
        for(var x=0; x<maxX; x++)
        {
            cell = grid.getCellByCoord(x, y);

            cellState = cell.getState();
            draw = false;
            drawColor;
            switch(cellState)
            {
                case OCCUPIED_FOOD:
                case OCCUPIED_CONNECTED_FOOD:
                    draw = true;
                    drawColor = "#7D3E3E";
                    break;
                case OCCUPIED_ORGANISM:
                    draw = true;
                    drawColor = "#81B281";
                    break;
                case OCCUPIED_OBSTACLE:
                    draw = true;
                    drawColor = "#C0C0C0";
                    break;
            }

            if(draw)
            {
                var startDisplayX = x * constants.SPACE_WIDTH;
                var startDisplayY = y * constants.SPACE_HEIGHT;
                context.fillStyle = drawColor;
                context.fillRect(
                    startDisplayX,
                    startDisplayY,
                    constants.SPACE_WIDTH,
                    constants.SPACE_HEIGHT
                );
            }
        }
    }
}

if(usingNode)
{
    exports.displayGrid = displayGrid;
}
else
{
    view.displayGrid = displayGrid;
}
