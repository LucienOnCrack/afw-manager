// Panel and template ids
var styleTemplate = "StylTemplate";

var fitProfilePanel = "fitProfilePanel";
var fitProfileTemplate = "fitProfileTemplate";

var fitToolPanel = "fitToolPanel";
var fitToolTemplate = "fitFitToolTemplate";

var designOptionPanel = "designOptionPanel";
var designOptiontemplate = "designOptionTemplate";

var designOptionMonogramPanel = "designOptionMonogramPanel";
var designOpitonMonogramtemplate = "designOptionMonogramTemplate";

var brandingOptionPanel = "brandingOptionPanel";
var brandingOptionTemplate = "brandingOptionTemplate";

var otherPanel = "OtherPanel";

var editMode = 1;
var copyMode = 2;

var textEditMode = "Edit";
var textCopyMode = "Copy";



function OnCombinationChange(control) {

    var combinationId = GetValueById(control.id);

    if (combinationId) {

        var styleId = $("#HDStyleId").val();

        $.ajax({
            type: "POST",
            data: { combinationId: combinationId, styleId: styleId},
            url: "/DyoOrder/RenderPrimaryInfo/",
            success: function (responseData) {
                ClearCombinationRelatedChanges();
                InitializeStyle(responseData.Data.PrimaryInfoViewModel, combinationId);
                RenderStyleData(styleId);
                BindFocusOut();

            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {

            }
        });

    } else {
        ClearCombinationRelatedChanges();
    }
    BindFitToolModalOpenFullView();
}

function SubmitProcesssOrder() {
    if (ValidateOrder()) {

        var confirmationMessageDetails = GetResourceText("CONFIRM_ORDER_PROCESSED", "Are you sure you want to Process this order?");
        var confirmationHeader = GetResourceText("TITLE", "DYO order");

        if (IsOrderSummaryScreenValid(true)) {
            ShowConfirmationDialog(confirmationHeader, confirmationMessageDetails, function () {
                SaveOrderOnServer(true, false);
            }, null, null);
        }
    }
    else {
        var message = GetResourceText("DYO_ORDER_SAVE_VALIDATION_MESSAGE", " Please fill in the data for the highlighted fields");

        ShowErrorDialog(GetResourceText("ERROR_HEADER", "Error"), message, null, null);
    }
}
function SubmitOrder() {

    if (ValidateOrder()) {
        if (IsOrderSummaryScreenValid(false)) {
            SaveOrderOnServer(false, false);
        }

    } else {
        var message = GetResourceText("DYO_ORDER_SAVE_VALIDATION_MESSAGE", " Please fill in the data for the highlighted fields");

        ShowErrorDialog(GetResourceText("ERROR_HEADER", "Error"), message, null, null);
    }
}

function SaveOrderOnServer(isToProcessOrder, skipWarning) {
    var options = {
        dataType: "json",
        data: { isToProcessOrder: isToProcessOrder, skipWarning: skipWarning },
        success: function (testdata) {
            if (testdata != null) {

                if (testdata.Status == false) {
                    if (testdata.ValidationType == 2)
                        ShowConfirmationDialog("",
                            testdata.MessageHtml,
                            function () {
                                SaveOrderOnServer(isToProcessOrder, true);
                            },
                            null,
                            null);
                    else
                        ShowErrorDialog("", testdata.MessageHtml, null, null);
                } else {
                    window.onbeforeunload = null;
                    $("#OrderConfirmationMessage").html(testdata.MessageHtml);
                    $("#OrderConfirmationMessage").dialog("open");
                }
            }
        }
    };
    $("#frmDyoOrder").ajaxForm(options);
    $("#frmDyoOrder").submit();
}


function ClearCombinationRelatedChanges() {
    ClearStyleInfo();
    ClearFitProfile();
    ClearFitTool();
    ClearDesignOption();
    ClearDesignOptionMonogram();
    ClearBrandingOption();
}

function RedirectToNewOrders() {
    location.href = "/DyoOrder/CreateOrderForSameCustomer";
}

function RedirectToOrderOverview() {
    location.href = "/CustomOrderOverview";
}

// error control and validate control class (red and green)
function BindFocusOut() {
    $("select").focusout(function () {
        
        var isToValidate = true;

        if (this.id === "SalesPersonID") {
            var isTailorManditory = $("#IsTailorManditory").val();

            if (isTailorManditory === "False") {
                isToValidate = false;
                $(this).removeClass("ErrorControl");
                $(this).addClass("ValidControl");
            }
        }

        if(isToValidate)
        {
            ApplyControlBorderStyle();
            var val = $(this).val();
            var result = $(this).attr("id").indexOf("DDLDyoStyle");
            if (result == -1) {
                if (val && val >= 0) {
                    $(this).removeClass("ErrorControl");
                    $(this).addClass("ValidControl");
                } else {
                    $(this).removeClass("ValidControl");
                    $(this).addClass("ErrorControl");
                }
            } else {
                if (val && (val > 0 || val == -1)) {
                    $(this).removeClass("ErrorControl");
                    $(this).addClass("ValidControl");
                } else {
                    $(this).removeClass("ValidControl");
                    $(this).addClass("ErrorControl");
                }
            }
        }
    });

    $("input").focusout(function () {
        ApplyControlBorderStyle();
        var val = $(this).val();
        if (val && val.trim().length > 0) {
            $(this).removeClass("ErrorControl");
            $(this).addClass("ValidControl");
        } else {
            $(this).removeClass("ValidControl");
            $(this).addClass("ErrorControl");
        }
    });
}

function ApplyControlBorderStyle() {

    var $drpDowns = $("#divSinglePageOrderContainer").find("select");

    $.each($drpDowns, function(i, $currentdrpDown) {

        var elementId = $($currentdrpDown).prop('id');

        var isToValidate = true;

        if (elementId === "SalesPersonID") {
            var isTailorManditory = $("#IsTailorManditory").val();

            if (isTailorManditory === "False") {
                isToValidate = false;
                $(this).removeClass("ErrorControl");
                $(this).addClass("ValidControl");
            }
        }

        if (isToValidate) {
            var val = $($currentdrpDown).val();

            var result = $($currentdrpDown).attr("id").indexOf("DDLDyoStyle");

            if (result == -1) {
                if (val && val >= 0) {
                    $($currentdrpDown).removeClass("ErrorControl");
                    $($currentdrpDown).addClass("ValidControl");
                } else {
                    if ($($currentdrpDown).hasClass("ValidControl")) {
                        $($currentdrpDown).removeClass("ValidControl");
                        $($currentdrpDown).addClass("ErrorControl");
                    }
                }
            } else {
                if (val && (val >= 0 || val == -1)) {
                    $($currentdrpDown).removeClass("ErrorControl");
                    $($currentdrpDown).addClass("ValidControl");
                } else {
                    if ($($currentdrpDown).hasClass("ValidControl")) {
                        $($currentdrpDown).removeClass("ValidControl");
                        $($currentdrpDown).addClass("ErrorControl");
                    }
                }
            }
        }
    });

    var $textBoxes = $("#divSinglePageOrderContainer").find("input[type='text']");
    $.each($textBoxes, function (i, $textBox) {
        var val = $($textBox).val();
        if (val && val.trim().length > 0) {
            $($textBox).removeClass("ErrorControl");
            $($textBox).addClass("ValidControl");
        } else {
            if ($($textBox).hasClass("ValidControl")) {
                $($textBox).removeClass("ValidControl");
                $($textBox).addClass("ErrorControl");
            }
        }
    });
}

function UpdateRunningInformation() {
    var fabricId = $("#HDTXFabric_1").val();
    var liningId = $("#HDTXLining_1").val();
    var combinationId = $("#DDLCombinations").val();
    var highestExtraDays = GethighestExtraDays();
    RefereshRunningInfo(combinationId, -1, -1, fabricId, liningId, highestExtraDays);
}

function RefereshRunningInfo(combinationId, productPartId, selectedMakeId, fabricId, liningId, selectedMaxExtraDays) {
    $.ajax(
    {
        type: "GET",
        url: "/DyoOrder/GetRunningInfo",
        data: { combinationId: combinationId, productPartId: productPartId, selectedMakeId: selectedMakeId, fabricId: fabricId, liningId: liningId, extraDays: selectedMaxExtraDays },
        async: false,
        success: function (result) {
            if (result.Data) {
                UpdateShipmentRunningInformation(result.Data.ShipmentInformationViewModel);
                UpdateRPriceRunningInformation();
                var runningInfoClone = $("#dyoRunningInfo").clone();
                $(runningInfoClone).attr("style", "display: block");
                $("#anchorRunningInfo").attr("data-content", $(runningInfoClone)[0].outerHTML);
                $("#anchorRunningInfo").popover({
                    container: 'body'
                });
            }
        }
    });
}

function UpdateShipmentRunningInformation(shipmentInformationViewModel) {
    if (shipmentInformationViewModel.ExpDeliveryDate) {
        $("#ExpDelDate").html(shipmentInformationViewModel.ExpDeliveryDate);
    }
    if (shipmentInformationViewModel.LatestDeliveryDate) {
        $("#LatestDelDate").html(shipmentInformationViewModel.LatestDeliveryDate);
    }
}

function UpdateRPriceRunningInformation() {
    var makeRPrice = GetRpriceForMake();
    var fabricRprice = parseFloat($("#RPriceTXFabric_1").val());
    var liningRprice = parseFloat($("#RPriceTXLining_1").val());
    var buttonRprice = parseFloat($("#RPriceDDLButton").val());
    var pipingRprice = parseFloat($("#RPriceDDLPiping").val());
    var dovRprice = GetRpriceForDov();

    if (isNaN(makeRPrice) || makeRPrice == undefined) {
        makeRPrice = 0;
    }
    if (isNaN(liningRprice) || liningRprice == undefined) {
        liningRprice = 0;
    }
    if (isNaN(fabricRprice) || fabricRprice == undefined) {
        fabricRprice = 0;
    }
    if (isNaN(dovRprice) || dovRprice == undefined) {
        dovRprice = 0;
    }
    if (isNaN(buttonRprice) || buttonRprice == undefined) {
        buttonRprice = 0;
    }
    if (isNaN(pipingRprice) || pipingRprice == undefined) {
        pipingRprice = 0;
    }
    var total = makeRPrice + fabricRprice + liningRprice + dovRprice + buttonRprice + pipingRprice;
    $("#spnRPriceDate").html(total);
}

function GethighestExtraDays() {
    var fabricExtraDays = parseInt($("#EDTXFabric_1").val());
    var liningExtraDays = parseInt($("#EDTXLining_1").val());
    var dovExtraDays = GetHighestExtraDaysForDov();
    var buttonExtraDays = parseFloat($("#DDLButton").find('option:selected').attr('data-extradays'));
    var pipingExtraDays = parseFloat($("#DDLPiping").find('option:selected').attr('data-extradays'));
    var makeExtraDays = GetHighestExtraDaysForMake();
    if (isNaN(buttonExtraDays) || buttonExtraDays == undefined || buttonExtraDays == null) {
        buttonExtraDays = 0;
    }
    if (isNaN(pipingExtraDays) || pipingExtraDays == undefined || pipingExtraDays == null) {
        pipingExtraDays = 0;
    }
    if (isNaN(dovExtraDays) || dovExtraDays == undefined || dovExtraDays == null) {
        dovExtraDays = 0;
    }
    if (isNaN(makeExtraDays) || makeExtraDays == undefined || makeExtraDays == null) {
        makeExtraDays = 0;
    }

    var extraDaysArray = [fabricExtraDays, liningExtraDays, dovExtraDays, buttonExtraDays, pipingExtraDays, makeExtraDays];
    var higestExtraDays = Math.max.apply(Math, extraDaysArray);
    return higestExtraDays;
}

function GetHighestExtraDaysForDov() {
    var arrayCounter = 0;
    var extraDaysArray = [];
    $("select[id^='drpDesignOption_']").each(function () {
        var dovExtraDays = parseFloat($(this).find(':selected').attr("data-extradays"));
        extraDaysArray[arrayCounter] = dovExtraDays;
        arrayCounter++;
    });
    var higestExtraDays = 0;
    if (extraDaysArray.length > 0)
        higestExtraDays = Math.max.apply(Math, extraDaysArray);
    return higestExtraDays;
}

function GetHighestExtraDaysForMake() {
    var extraDaysArray = [];
    var arrayCounter = 0;
    $("select[id^='DDLDyoModel_']").each(function () {
        var makeExtraDays = parseFloat($(this).find(':selected').attr("data-makeextradays"));
        extraDaysArray[arrayCounter] = makeExtraDays;
        arrayCounter++;
    });
    var higestExtraDays = 0;
    if (extraDaysArray.length > 0)
        higestExtraDays = Math.max.apply(Math, extraDaysArray);
    return higestExtraDays;
}

function GetRpriceForDov() {
    var rpriceDovs = 0;
    $("select[id^='drpDesignOption_']").each(function () {
        var rPrice = parseFloat($(this).find(':selected').attr("data-rprice"));
        if (isNaN(rPrice) || rPrice == undefined) {
            rPrice = 0;
        }
        rpriceDovs += rPrice;
    });
    return rpriceDovs;
}

function GetRpriceForMake() {
    var rpriceMakes = 0;
    $("select[id^='DDLDyoModel_']").each(function () {
        var rPrice = parseFloat($(this).find(':selected').attr("data-makerprice"));
        if (isNaN(rPrice) || rPrice == undefined) {
            rPrice = 0;
        }
        rpriceMakes += rPrice;
    });
    return rpriceMakes;
}

function RefreshMakeRPrice(element) {
    var modelProductPartId = $("#" + element.id).find(':selected').attr("data-productpartid");
    var elementId = "DDLDyoModel_Make_" + modelProductPartId;
    var makeId = $("#" + element.id).find(':selected').attr("data-makeid");
    SetValueById(("HD" + elementId), makeId);

    var extraDays = $("#" + element.id).find(':selected').attr("data-makeextradays");
    SetValueById(("ED" + elementId), extraDays);

    var rPrice = $("#" + element.id).find(':selected').attr("data-makerprice");
    SetValueById(("RPrice" + elementId), rPrice);

    var fabricId = $("#HDTXFabric_1").val();
    var liningId = $("#HDTXLining_1").val();
    var combinationId = $("#DDLCombinations").val();
    var highestExtraDays = GethighestExtraDays();
    if (isNaN(highestExtraDays)) {
        highestExtraDays = 0;
    }
    RefereshRunningInfo(combinationId, modelProductPartId, makeId, fabricId, liningId, highestExtraDays);
}


function IsCopyOrder() {
    var orderMode = GetValueById("hiddenOrderMode");
    if (orderMode === textCopyMode) {
        return true;
    }
    return false;
}

function DesignOptionIsNotAllowCopy(designOption) {
    var id = "-1";
    if ((designOption.InternalName === "JBU") || designOption.InternalName === "TBU" || designOption.InternalName === "WBU" || designOption.InternalName === "SBU") {
        id = $("#HDDDLButton").val();
    }
    else if ((designOption.InternalName === "JPP" || designOption.InternalName === "MPP")) {
        id = $("#HDDDLPiping").val();
    }
    else if (designOption.InternalName === "ML1L2") {
        id = designOption.DefaultValueID;
    }
    return $.parseInt(id);
}

function IsOrderSummaryScreenValid(isProcessOrder) {
    var result = true;

    if (!$("#chkConfirm").is(":checked")) {
        result = false;
        ShowOrderSummaryDialog(isProcessOrder);
    }

    return result;
}

function ShowOrderSummaryDialog(isProcessOrder) {
    $("#dialogChkConfirm").attr('checked', false);
    $("#divDialogErrorCustomOrderSummary").hide();
    $("#OrderSummaryCheckbox").dialog({
        width: 400,
        title: GetResourceText("ORDERSUMMARY_MESSAGE_HEADER", "Order summary"),
        resizable: false,
        modal: true,
        buttons: [
                    {
                        text: GetResourceText("OK", "Ok"),
                        click: function () {
                            if (GetIsChecked("chkConfirmDialog")) {
                                SaveOrderOnServer(isProcessOrder, false);
                                $("#OrderSummaryCheckbox").dialog('close');
                            }
                            else {
                                $("#divDialogErrorCustomOrderSummary").show();
                            }
                        }
                    },
                    {
                        text: GetResourceText("CANCEL", "Cancel"),
                        click: function () {
                            $("#OrderSummaryCheckbox").dialog('close');
                        }
                    }
        ],
        close: function (event, ui) {
            //$("#divCustomorderSummaryChk").dialog('close');
        }
    });
}

function ReviewOrderSummary(element, targetControlId) {
    var isCheckedSummary = GetIsChecked(element.id);
    SetCheckBoxChecked(targetControlId, isCheckedSummary);
}

function WarningFitAndTryOn() {
    var isNewFitProfile = false;
    var fitProfileId = $("#DDLFitProfile").val();
    if (fitProfileId == 0) {
        isNewFitProfile = true;
    }
    if (isNewFitProfile) {
        var warnings = new Array();
        var tryOnDDLs = $("#fitProfileTemplate").find("select[id *= 'DDLTryOnSize_']");
        var tryOnOne = 0, tryOnTwo = 0;
        var tryOnFlag = false;
        var next;
        var j;
        var hasValueFlag = true;
        $.each(tryOnDDLs, function (index, element) {
            var value = $(element).val();
            hasValueFlag = hasValueFlag && value > 0;
        });
        if (hasValueFlag) {
            for (j = 0; j < tryOnDDLs.length; j++) {
                if (j === tryOnDDLs.length - 1) {
                    next = 0;
                } else {
                    next = j + 1;
                }
                tryOnOne = $(tryOnDDLs[j]).val() > 0 ? parseInt($(tryOnDDLs[j]).find("option:selected").text()) : 0;

                tryOnTwo = $(tryOnDDLs[next]).val() > 0 ? parseInt($(tryOnDDLs[next]).find("option:selected").text()) : 0;

                if (Math.abs(tryOnOne - tryOnTwo) > 3) {
                    tryOnFlag = true;
                    break;
                }
            }
            if (tryOnFlag) {
                warnings.push("You might want to check the TryOn sizes you have selected. Are you sure these are correct? ");
            }

            if (warnings.length > 0) {
                var msgBoxData = {
                    modal: true,
                    title: "Warning",
                    width: 500,
                    resizable: false,
                    buttons: [
                        {
                            text: GetResourceText("YES", "Yes"),
                            click: function () {
                                $("#msgbx").dialog('close');
                            },
                            class: 'btn',
                            style: ' outline: none !important; color : white;'
                        }
                    ],
                    close: function (event, ui) {
                        try {
                            if (typeof dialogClose != 'undefined')
                                dialogClose();
                        } catch (err) {
                        }
                    }
                };
                ShowDialog("Warning", warnings, msgBoxData);
            }
        }
    }
}

var ShowHideOtherPanel = function (isShow) {
    if (isShow) {
        $("#" + otherPanel).show();
    } else {
        $("#" + otherPanel).hide();
    }
}

function IsEditOrder() {
    var orderMode = GetValueById("hiddenOrderMode");

    if (orderMode === textEditMode) {
        return true;
    }
    return false;
}

function ClearAll() {
    ClearItem();
    ClearStyleDetails();
    ClearOnStyleChange();
    ClearCombinationRelatedChanges();
}