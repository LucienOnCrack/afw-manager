/******************************************************************************************************
Constants used in Order wizard (CM & RM) 
*******************************************************************************************************/
var IMPOSSIBLE_VALIDATION_TYPE_ERRORS = 1;
var IMPOSSIBLE_VALIDATION_TYPE_WARNINGS = 2;


var MunroAdminCurrency = "€";



function EnableNavigationButton(buttonID) {
    $("#" + buttonID).removeAttr("disabled");
}

function DisableNavigationButton(buttonID) {
    $("#" + buttonID).attr("disabled", true);
}



/******************************************************************************************************
Functions related to adjusting the dimensions of various page elements
*******************************************************************************************************/
function adjustHeight_WithTabbedPanel() {
    //    var tablehight = $('.panelwrapper').height();
    //    var etabsheight = $('.etabs').height() + $('.leftsectionTabbedPanleContainer').height();
    //    var panelHeaderheight = $('.panel_headerContent').height();
    //    var panelsubhdrheight = $('#subhdr').height();
    //    var panelFooterheight = $('.panelFooterContent').height() + 17;

    //    var etabsheightUpdated = etabsheight - panelHeaderheight - panelFooterheight - panelsubhdrheight;
    //    $(".leftsectionTabbedPanleContainer").height(etabsheightUpdated);
}

function AddRemoveCautionMessages(e, chkbx) {

    var checkBoxes = $("#divMainCautionMessageContainer").find("input[type=checkbox]");

    var check = false;
    check = $("#chkCautionMsg").is(':checked');
    if (checkBoxes != null && checkBoxes.length > 0) {
        for (var i = 0; i < checkBoxes.length; i++) {
            $(checkBoxes[i]).prop('checked', check);
        }
        CheckAndMarkSelectAllCautionMessagesCheckbox();
    }

    if (!check)
        $("#chkConfirm").prop('checked', check);

    cancelBubble(e);
}


/******************************************************************************************************
Functions related to 'Caution remarks" --> "Select all" and "Order summary" --> "Confirm" checkboxes
*******************************************************************************************************/
function CheckAndMarkSelectAllCautionMessagesCheckbox() {
    /// <summary>Checks if all the caution remarks checkboxes are checked then marks "Select All" checkbox.</summary>

    if ($('#divSelectAllCautionMessage').is(':visible')) {
        var CheckBoxesInTheList = $("#divMainCautionMessageContainer").find("input[type=checkbox][id^='CM_']");

        if (CheckBoxesInTheList != null && CheckBoxesInTheList.length > 0) {
            var AllChecked = true;
            for (var i = 0; i < CheckBoxesInTheList.length; i++) {

                if (!$(CheckBoxesInTheList[i]).is(':checked')) {
                    AllChecked = false;
                    break;
                }
            }
            $("#chkCautionMsg").prop('checked', AllChecked);
            if (!AllChecked) {
                $("#chkConfirm").prop('checked', AllChecked);
            }
        }
    }
}

function SetConfirmChkBoxStatus() {
    /// <summary>Enabled/Disables the 'Order summary"--> Confirm checkbox based on the checked status of "Select All" checkbox.</summary>

    if ($("#chkCautionMsg").is(':checked')) {
        $("#chkConfirm").removeAttr("disabled");
    } else {
        $('#chkConfirm').removeAttr('checked');
        $("#chkConfirm").attr("disabled", true);
    }
}


function DisableCautionMessageCheckboxes() {
    /// <summary>Disables all the checkboxes in the Caution remarks area.</summary>

    $("#divMainCautionMessageContainer").find("input[type=checkbox]").attr("disabled", true);
    //$("#divFitToolCautionMessageContainer").find("input[type=checkbox]").attr("disabled", true);
}

function EnableCautionMessageCheckboxes() {
    /// <summary>Enables all the checkboxes in the Caution remarks area.</summary>

    $("#divMainCautionMessageContainer").find("input[type=checkbox]").removeAttr("disabled");
    //$("#divFitToolCautionMessageContainer").find("input[type=checkbox]").removeAttr("disabled");
}

function IsOrderSummaryScreenValid() {
    /// <summary>Validates if the CM/RM order summary tab is valid or not.</summary>
    var result = true;

    if (!$("#chkConfirm").is(":checked")) {
        result = false;
        ShowOrderSummaryDialog();
    }
    return result;
}

function OnOrderSummaryConfirmationClick() {
    var result = true;
    if ($('#chkCautionMsg').is(':visible') && !$("#chkCautionMsg").is(':checked')) {
        result = false;
        ShowErrorDialog(GetResourceText("ORDERSUMMARY_MESSAGE_HEADER", "Order summary"), GetResourceText("ORDERSUMMARY_PLEASE_CONFIRM_CAUTION_MESSAGES", "Please read and confirm all caution messages"), null, null);
    }
    return result;
}

function ExpandAllInActiveTab() {
    var activePanelID = $("#ActiveProductTab").val().replace("#", "");
    expandAllInContainer(activePanelID);
}

function CollapseAllInActiveTab() {
    var activePanelID = $("#ActiveProductTab").val().replace("#", "");
    collapseAllInContainer(activePanelID);
}


