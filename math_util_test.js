var math_util = require("./math_util");

exports.testRandInt = function(test)
{
    test.equal(5, math_util.randInt(5, 5));
    test.done();
};
