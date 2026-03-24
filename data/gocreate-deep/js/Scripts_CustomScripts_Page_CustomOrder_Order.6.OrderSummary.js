var orderSummaryConfirmationDailog;
/******************************************************************************************************
METHODS RELATED TO INITIALIZING THE SCREEN
*******************************************************************************************************/
function InitializeOrderSummaryScreen() {
    ClientAppObject.CustomOrderCurrentWizardStep = EnumCustomOrderWizardSteps.ORDER_SUMMARY;
    //$('.panel').alternateScroll();
    $('.leftsectionTabbedPanleContainer').alternateScroll();

    $('#tab-container').easytabs({ updateHash: false });
    $('#TabbedPanel').easytabs({ updateHash: false });

    //Adjust the height of the TryOn section
    //var tablehight = $('.displayTable').height() + 60;
    //$(".ContainerMainbodyScroller").height(tablehight);
    $(".ContainerMainbodyScroller").slideDown();

    setUpPanels();
    RightPanelOpenClosed();

}




/******************************************************************************************************
METHODS RELATED SUBMITTING THE FORM
*******************************************************************************************************/

function SubmitOrderSummaryInfo(postData, func, param) {
    /// <summary>Submits the Order summary information form to server</summary>
    /// <param name="postData" type="jSon">The extra data to be posted with the form</param>
    /// <param name="func" type="function">The callback function that will be called on </param>
    /// <param name="param" type="jSon"></param>
    /// <returns type="Number">Nothing.</returns>
    var options = {
        data: postData,
        dataType: "json",
        success: function (testdata) {
            if (testdata != null) {
                if (testdata.Status == false)
                    ShowErrorDialog("Error", testdata.MessageHtml, null, null);
                else
                    func(param, testdata);
            }
        }
    };
    //var activeTab = $("#ActiveFitToolTab").val();
    
    var isFormValid = true;
    var showDigitalSignature = $("#ShowDigitalSignature").val();
    if (postData.checkValidation) {
        isFormValid = IsOrderSummaryScreenValid();
    }
    else {
        CheckAllCheckBox();
    }

    if (isFormValid) {
        $("#FinalizeForm").ajaxForm(options);
        $("#FinalizeForm").submit();
    }
}

function CheckAllCheckBox() {
    var checkBoxesInTheList = $("#divMainCautionMessageContainer").find("input[type=checkbox][id^='CM_']");
    if (checkBoxesInTheList != null && checkBoxesInTheList.length > 0) {
        for (var i = 0; i < checkBoxesInTheList.length; i++) {
            $(checkBoxesInTheList[i]).attr('checked', true);
        }
    }
}

function ShowHideSelectAllCautionMessageCheckboxes() {
    var allEntitycheckBoxes = $("#divCautionMessageContainer").find("input[type=checkbox]");
    var fitToolcheckBoxes = $("#divFitToolCautionMessageContainer").find("input[type=checkbox]");
    if ((allEntitycheckBoxes != null && allEntitycheckBoxes.length > 0) || (fitToolcheckBoxes != null && fitToolcheckBoxes.length > 0)) {
        $("#divSelectAllCautionMessage").show();
    } else {
        $("#divSelectAllCautionMessage").hide();
    }
    CheckAndMarkSelectAllCautionMessagesCheckbox();
}
 

function ShowOrderSummaryDialog() {
    var height = 400;
    var width = 400;
    var isCheckForDigitalSignature = false;
    var showDigitalSignature = $("#ShowDigitalSignature").val();
    if (showDigitalSignature.toUpperCase() === "TRUE") {
        init();
        $("#pdfDetail").html($("#notVisibleToEndUserPdfDetail").html());
        height = 770;
        width = 850;
        isCheckForDigitalSignature = true;
    }
    $("#dialogChkConfirm").prop('checked', false);
    $("#dialogChkConfirmOfOrderProcessing").prop('checked', false);
    $("#divDialogErrorCustomOrderSummary").hide();
    height = window.innerHeight;


    $('.ui-dialog').css("max-height", function(){ 
        return window.innerHeight;
        //$('#topOrderContainer').height();
    });
    if (isCheckForDigitalSignature) {
        var isIpad = navigator.userAgent.match(/iPad/i) != null;
        if (isIpad) {
            width = 600;
        }

        collapseAllInContainer('OrderSummaryContainer');

        $("#divCustomorderSummaryChk").dialog({
            width: width,
            height: height,
            title: GetResourceText("ORDERSUMMARY_MESSAGE_HEADER", "Order summary"),
            resizable: false,
            modal: true,
            buttons: [
                {
                    text: GetResourceText("OK", "Ok"),
                    click: function () {
                        
                        if (!isCheckForDigitalSignature) {
                            if ($("#dialogChkConfirm").is(':checked') && $("#dialogChkConfirmOfOrderProcessing").is(':checked')) {
                                GetFinalizeTab();

                            } else {
                                $("#divDialogErrorCustomOrderSummary").show();
                            }
                        }
                        else {
                            var canvas = document.getElementById('sketchpad');
                            var dataURL = canvas.toDataURL();
                            if ($("#dialogChkConfirm").is(':checked') && $("#dialogChkConfirmOfOrderProcessing").is(':checked') && $("#validationPoint").val() >= 20) {
                                $("#Canvas").val(dataURL);
                                GetFinalizeTab();
                            }
                            else {
                                $("#divDialogErrorCustomOrderSummary").show();
                            }
                        }
                    },
                    class: 'btn',
                    style: 'outline: none !important; color : white;'
                },
            {
                text: GetResourceText("CANCEL", "Cancel"),
                click: function () {
                    $("#divCustomorderSummaryChk").dialog('close');
                },
                class: 'btn',
                style: ' outline: none !important; color : white;'
            },
            {
                text: GetResourceText("Clear", "Clear"),
                click: function () {
                    try {
                        clearCanvas(canvas, ctx);;
                    } catch (err) {
                    }
                },
                class: 'btn',
                style: ' outline: none !important; color : white;'
            }],
            close: function (event, ui) {
                //$("#divCustomorderSummaryChk").dialog('close');
            }
        });
    }
    else {
        $("#divCustomorderSummaryChk").dialog({
            width: width,
            height: height,
            title: GetResourceText("ORDERSUMMARY_MESSAGE_HEADER", "Order summary"),
            resizable: false,
            modal: true,
            buttons: [
                {
                    text: GetResourceText("OK", "Ok"),
                    click: function () {
                        if (!isCheckForDigitalSignature) {
                            if ($("#dialogChkConfirm").is(':checked')) {
                                GetFinalizeTab();
                            } else {
                                $("#divDialogErrorCustomOrderSummary").show();
                            }
                        }
                    },
                    class: 'btn',
                    style: ' outline: none !important; color : white;'
                },
            {
                text: GetResourceText("CANCEL", "Cancel"),
                click: function () {
                    $("#divCustomorderSummaryChk").dialog('close');
                },
                class: 'btn',
                style: ' outline: none !important; color : white;'
            }],
            close: function (event, ui) {
                //$("#divCustomorderSummaryChk").dialog('close');
            }
        });
    }

}

function GetFinalizeTab() {
    $("#divDialogErrorCustomOrderSummary").hide();
    //$("#divCustomorderSummaryChk").dialog('show');
    $("#chkConfirm").prop('checked', true);
    $("#dialogChkConfirmOfOrderProcessing").prop('checked', true);
    var checkBoxesInTheList = $("#divMainCautionMessageContainer").find("input[type=checkbox][id^='CM_']");
    if (checkBoxesInTheList != null && checkBoxesInTheList.length > 0) {
        for (var i = 0; i < checkBoxesInTheList.length; i++) {
            $(checkBoxesInTheList[i]).prop('checked', true);
        }
        $("#chkCautionMsg").prop('checked', true);
    }
    GetNextDetail();
    //SubmitOrderSummaryInfo({ checkValidation: true, wizardNextStep: true, runningInformation: CollectAllCautionMessages() }, ChangeWizardStep, { newStep: 7, next: true, previous: false });
    $("#divCustomorderSummaryChk").dialog('close');
}
////////////////////


// Variables for referencing the canvas and 2dcanvas context
var canvas, ctx;
var size = 2;
var validationpoint = 0;
// Variables to keep track of the mouse position and left-button status
var mouseX, mouseY, mouseDown = 0;

// Variables to keep track of the touch position
var touchX, touchY;

var oldX, oldY;
// Draws a dot at a specific position on the supplied canvas name
// Parameters are: A canvas context, the x position, the y position, the size of the dot
function drawDot(ctx, x, y, size) {
    // Let's use black by setting RGB values to 0, and 255 alpha (completely opaque)
    r = 0; g = 0; b = 0; a = 255;

    // Select a fill style
    //ctx.fillStyle = "rgba(" + r + "," + g + "," + b + "," + (a / 255) + ")";
    ctx.strokeStyle = "rgba(" + r + "," + g + "," + b + "," + (a / 255) + ")";
    ctx.lineWidth = size;
    // Draw a filled circle

    //ctx.arc(x, y, size, 0, Math.PI * 2, true);    
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(oldX, oldY);

    oldX = x;
    oldY = y;
    //ctx.fill();
    ctx.stroke();
    validationpoint++;
    $("#validationPoint").val(validationpoint);
}

// Clear the canvas context using the canvas width and height
function clearCanvas(canvas, ctx) {
    oldX = undefined;
    oldY = undefined;
    validationpoint = 0;
    $("#validationPoint").val(0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Keep track of the mouse button being pressed and draw a dot at current location
function sketchpad_mouseDown() {
    mouseDown = 1;
    drawDot(ctx, mouseX, mouseY, size);
}

// Keep track of the mouse button being released
function sketchpad_mouseUp() {
    oldX = undefined;
    oldY = undefined;
    mouseDown = 0;
}

// Keep track of the mouse position and draw a dot if mouse button is currently pressed
function sketchpad_mouseMove(e) {
    // Update the mouse co-ordinates when moved
    getMousePos(e);

    // Draw a dot if the mouse button is currently being pressed
    if (mouseDown == 1) {
        drawDot(ctx, mouseX, mouseY, size);
    }
}

// Get the current mouse position relative to the top-left of the canvas
function getMousePos(e) {
    if (!e)
        var e = event;

    if (e.offsetX) {
        mouseX = e.offsetX;
        mouseY = e.offsetY;
    }
    else if (e.layerX) {
        mouseX = e.layerX;
        mouseY = e.layerY;
    }
}

// Draw something when a touch start is detected
function sketchpad_touchStart() {
    // Update the touch co-ordinates
    getTouchPos();

    drawDot(ctx, touchX, touchY, size);

    // Prevents an additional mousedown event being triggered
    event.preventDefault();
}

// Draw something and prevent the default scrolling when touch movement is detected
function sketchpad_touchMove(e) {
  
    getTouchPos(e);

    // During a touchmove event, unlike a mousemove event, we don't need to check if the touch is engaged, since there will always be contact with the screen by definition.
    drawDot(ctx, touchX, touchY, size);

    // Prevent a scrolling action as a result of this touchmove triggering.
    event.preventDefault();
}

function sketchpad_touchend(e) {
    // Update the touch co-ordinates
    oldX = undefined;
    oldY = undefined;
}
// Get the touch position relative to the top-left of the canvas
// When we get the raw values of pageX and pageY below, they take into account the scrolling on the page
// but not the position relative to our target div. We'll adjust them using "target.offsetLeft" and
// "target.offsetTop" to get the correct values in relation to the top left of the canvas.
function getTouchPos(e) {
    if (!e)
        var e = event;

    if (e.touches) {
        if (e.touches.length == 1) { // Only deal with one finger
            var touch = e.touches[0]; // Get the information for finger #1

            var $whatever = $('#sketchpad');
            touchX = touch.pageX - ($whatever.offset().left);
            touchY = touch.pageY - ($whatever.offset().top);
        }
    }
}


// Set-up the canvas and add our event handlers after the page has loaded
function init() {
    // Get the specific canvas element from the HTML document
    canvas = document.getElementById('sketchpad');

    // If the browser supports the canvas tag, get the 2d drawing context for this canvas
    if (canvas.getContext)
        ctx = canvas.getContext('2d');

    // Check that we have a valid context to draw on/with before adding event handlers
    if (ctx) {
        // React to mouse events on the canvas, and mouseup on the entire document
        canvas.addEventListener('mousedown', sketchpad_mouseDown, false);
        canvas.addEventListener('mousemove', sketchpad_mouseMove, false);
        window.addEventListener('mouseup', sketchpad_mouseUp, false);

        // React to touch events on the canvas
        canvas.addEventListener('touchstart', sketchpad_touchStart, false);
        canvas.addEventListener('touchmove', sketchpad_touchMove, false);
        canvas.addEventListener('touchend', sketchpad_touchend, false);
    }
}


function saveCanvas() {
    //alert('Save canvas called');

    var canvas = document.getElementById('sketchpad');
    var context = canvas.getContext('2d');



    var dataURL = canvas.toDataURL();

    var dataToOrder = { 'data': dataURL };
    //var param = $.param(dataToOrder, true);
    $.ajax(
    {
        type: "POST",
        traditional: true,
        url: "/SketchPad/SaveCanvasImage/",
        data: dataToOrder,
        global: false,
        success: function (data) {
            alert(data);
        },
        erro: function (e) {
            alert(e);
        }
    });


}
