exports.testObjInArray = function(elem, targetArray)
{
    for(var i in targetArray)
    {
        if(targetArray[i].equals(elem))
            return true;
    }

    return false;
}