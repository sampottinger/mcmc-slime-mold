/**
 * Convenience math routines.
 *
 * @author Sam Pottinger
 * @license GNU GPL v3
**/

var usingNode = typeof window === 'undefined';
var math_util = {};


/**
 * Generates a random integer from a inclusive to b exclusive.
 *
 * @param {int} a The lower bound (inclusive) of the integer to generate.
 * @param {int} b The upper bound (exclusive) of the integer to generate.
 * @return {int} random integer in range [a, b)
**/
function randInt(a, b)
{
    var diff = b - a;
    return Math.floor((Math.random()*diff)) + a;
}


if(usingNode)
{
    exports.randInt = randInt;
}
else
{
    math_util.randInt = randInt;
}
