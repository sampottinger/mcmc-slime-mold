var usingNode = typeof window === 'undefined';
var math_util = {};

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
