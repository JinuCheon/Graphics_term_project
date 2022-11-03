//For pc
var mstartX = 0, mendX = 0, mstartY = 0, mendY = 0;
$("html").on('mousedown', function (event) {
    mstartX = event.pageX;
    mstartY = event.pageY;
});
$("html").on('mouseup', function (event) {
    mendX = event.pageX;
    mendY = event.pageY;

    var fakeKeyObject;
    if ((startY - mendY < 50 || mendY - mstartY < 50) && (mendX - mstartX > 50)) {
        fakeKeyObject = { keyCode: 39 };
    } else if ((startY - mendY < 50 || mendY - mstartY < 50) && (mstartX - mendX > 50)) {
        fakeKeyObject = { keyCode: 37 };
    }
    handleKeyDown(fakeKeyObject);
});

//For mobile
var startX, startY, endX, endY;
$("html").on('touchstart', function (event) {
    startX = event.originalEvent.changedTouches[0].screenX;
    startY = event.originalEvent.changedTouches[0].screenY;
});
$("html").on('touchend', function (event) {
    endX = event.originalEvent.changedTouches[0].screenX;
    endY = event.originalEvent.changedTouches[0].screenY;

    var fakeKeyObject;
    if((startY - endY < 50 || endY - startY < 50) && (endX - startX > 50)) {
        fakeKeyObject = { keyCode: 39 };
    } else if((startY - endY < 50 || endY - startY < 50) && (startX - endX > 50)) {
        fakeKeyObject = { keyCode: 37 };
    }
    handleKeyDown(fakeKeyObject);
});