/**
 * Unit tests for mathematical convenience functions.
 *
 * @author Sam Pottinger
 * @license GNU GPL v3
**/


var math_util = require("./math_util");


/**
 * Test generating random integers.
**/
exports.testRandInt = function(test)
{
    test.equal(5, math_util.randInt(5, 5));
    test.done();
};
