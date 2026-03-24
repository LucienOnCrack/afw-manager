
$(document).ready(function () {
    $('[id^=TXFabric_]').on('input', function () {
        IsShowSpinner = false;
    });

});

// Panel and template ids
var primaryInfoTemplate = "PrimaryInfoTemplate";
var primaryInfoSPPTemplate = "DivPrimaryInfoSPP";
var copyFromOrderTemplate = "DivCopyFromOrder";

var fitProfilePanel = "fitProfilePanel";
var fitProfileTemplate = "fitProfileTemplate";

var mainMaterialAutoSuggestDiv = "DivMainMaterialTrimMasterAutoSuggest";
var secondaryMaterialAutoSuggestDiv = "DivSecondaryMaterialTrimMasterAutoSuggest";
var designOptionPanel = "designOptionPanel";
var designOptiontemplate = "designOptionTemplate";

var shoeDesignTemplate = "ShoeDesignTemplate";
var shoeSecondaryMaterialTemplate = "ShoeSecondaryMaterialDesignTemplate";
var soleTemplate = "SoleTemplate";

var modelTemplate = "ModelTemplate";

var shoeMonogramtemplate = "ShoeMonogramTemplate";
var beltMonogramtemplate = "BeltMonogramTemplate";

var brandingOptionPanel = "brandingOptionPanel";
var brandingOptionTemplate = "brandingOptionTemplate";
var additionalDesignOptionPanel = "ShoeDesignOptionPanel";
var orderNumberAutosuggestURL = "/ShoeOrder/GetOrderNumbers";
var orderNumberPerPPAutosuggestURL = "/ShoeOrder/GetOrderNumbersPerPP";

var otherPanel = "OtherPanel";

var editMode = 1;
var copyMode = 2;

var textEditMode = "Edit";
var textCopyMode = "Copy";

var ELEMENT_TYPE_SPP = "SPP";
var ELEMENT_TYPE_MAKE = "MAKE";
var ELEMENT_TYPE_STYLE = "STYLE";
var ELEMENT_TYPE_FABRIC = "FABRIC";
var ELEMENT_TYPE_DOV = "DOV";
var ELEMENT_TYPE_TRIM = "TRIM";
var ELEMENT_TYPE_MAKE = "MAKE";
var ELEMENT_TYPE_FITPROFILE = "FITPROFILE";
var ELEMENT_TYPE_FIT = "FIT";
var ELEMENT_TYPE_TRYON = "TRYON";
var ELEMENT_TYPE_TRYON_TYPE = "TRYON_TYPE";
var pPriceDictionary = []; // create an empty array



function OnStyleChange(control) {
    ClearStyleRelatedChanges();
    var styleId = GetValueById(control.id);
    FetchDetailsOnStyleChange(styleId);

}

function FetchDetailsOnStyleChange(styleId) {
    if (styleId) {
        $.ajax({
            type: "POST",
            data: { styleId: styleId },
            url: "/ShoeOrder/OnStyleChange/",
            success: function (data) {
                if (styleId == "-1") {
                    InitializeCombination(data.Data, styleId);
                    //RefreshSelectPicker($('.divPrimaryInfo'));
                    //RefreshSelectPicker($('.divShoeDesignOption'));
                } else {
                    InitializeCombination(data.Data, styleId);
                    InitializePrimaryInfo(data.Data.PrimaryInfoViewModel);
                    //InitializeFitProfile(data.Data.FitProfileViewModel);
                    InitiaLizeDesignOption(data.Data.DesignOptionViewModel, false);
                    //InitializeBrandingOption(data.Data.BrandingOptionViewModel);
                    //OnFabricSelectionUpdateSession(ELEMENT_TYPE_FABRIC, $('#TXFabric_1'));
                    var fabricControlID = "TXFabric_1";
                    $("#" + fabricControlID).val('');
                    $("#sp" + fabricControlID).html('');
                    $("#HD" + fabricControlID).val(-1);
                    $("#ED" + fabricControlID).val(0);
                    $("#CL" + fabricControlID).val(false);
                    OnFabricSelection(ELEMENT_TYPE_FABRIC, $("#" + fabricControlID));

                    //RefreshSelectPicker($('.divPrimaryInfo'));
                    //$('#fitProfileTemplate').selectpicker("destroy");
                    //RefreshSelectPicker($('#fitProfilePanel'));
                    //RefreshSelectPicker($('.divBeltAndShoeTree'));

                }
                BindFocusOut();
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {

            }
        });
    }
}

function OnCopyShoeOrder(orderID) {
    var url = '';
    url = "/ShoeOrder/CopyShoeOrder";

    $.ajax({
        url: url,
        type: "GET",
        dataType: "json",
        data: {
            orderId: orderID
        }
    }).done(function (returnData) {
        if (returnData.status) {

            PerformCopySkipingSelectionDialog(orderID);

        }
        else {
            ShowErrorDialogForMessages(GetResourceText("ERROR_MESSAGES"), returnData.ErrMsg, null, null);
        }
    }).fail(function () {

    });

}


function OnCombinationChange(control) {
    var combinationId = GetValueById(control.id);
    if (combinationId) {

        $.ajax({
            type: "POST",
            data: { combinationId: combinationId, quantity: 1 },
            url: "/ShoeOrder/RenderPrimaryInfo/",
            success: function (responseData) {
                $('#DDLStyles').prop('disabled', false);
                RefreshCurrentSelectPicker($('#DDLStyles'));
                $("#ShopOrderNumber").val("");
                ClearCombinationRelatedChanges();
                ClearMaterialAutoSuggestTemplate();
                InitializePrimaryInfo(responseData.Data.PrimaryInfoViewModel, combinationId, 1, responseData.Data.DummyFabricID);
                if (combinationId != 63)
                    RenderDesignTemplate(responseData.Data.DesignOptionViewModel);
                PreSelectTheOnlyDropdownOption("DOV", "#ShoeDesignTemplate", responseData.Data.PrimaryInfoViewModel.DeterministicProductPartId, 0)
                BindFocusOut();
                UpdateRunningInformation("", 0);
                RefreshSelectPicker($(".divShoeDesignOption"));
                RefreshSelectPicker($("#fitProfilePanel"));
                RefreshSelectPicker($(".divBeltAndShoeTree"));
                BindLazyLoadForInfoImages();
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {

            }
        });

    } else {
        ClearCombinationRelatedChanges();
        ClearMaterialAutoSuggestTemplate();
    }
    BindFitToolModalOpenFullView();
}

function SubmitProcesssOrder(isToProcessOrder, isForProcessPending) {

    if (ValidateOrder()) {
        var fitProfileId = $("#DDLFitProfile").val();
        var isFitToolChanged = false;

        if (fitProfileId > 0) {
            isFitToolChanged = IsFitToolChanged();
        }

        if (isFitToolChanged) {
            ShowFitToolDialog(function () { ProcessShoeOrder(isToProcessOrder, isForProcessPending) });
        } else {
            ProcessShoeOrder(isToProcessOrder, isForProcessPending);
        }

    } else {
        var message = GetResourceText("SHOE_ORDER_SAVE_VALIDATION_MESSAGE",
            " Please fill in the data for the highlighted fields");

        ShowErrorDialog(GetResourceText("ERROR_HEADER", "Error"), message, null, null);
    }

}

function ProcessShoeOrder(isToProcessOrder,isForProcessPending) {
    var confirmationMessageDetails = "";
    var isSurchargeApplicable = $("#IsSurchargeApplicable").val();
    if (isSurchargeApplicable.toLowerCase() === "true") {
        confirmationMessageDetails = "<div><strong>Tariff Surcharge Notice</strong></br>" + GetResourceText("INVOICE_SURCHARGE_APPLICABLE", "A 6.48% surcharge will be added to the purchase price of all orders due to updated U.S. trade regulations.") + "</div><br>";
    }

    if (isForProcessPending) {
        confirmationMessageDetails += GetResourceText("CONFIRM_ORDER_PROCESSPENDING",
            "Are you sure you want to save order on Process pending?");
    }
    else {
        confirmationMessageDetails += GetResourceText("CONFIRM_ORDER_PROCESSED", "Are you sure you want to Process this order?");
    }

    var div = $("#divProcessButtonNote");

    if (div && div.length > 0) {
        var value = $(div).html();

        if (value && value.length > 0) {
            //there is note, so order is created via draft fit profile

            confirmationMessageDetails +=
                GetResourceText("CONFIRM_ORDER_SUBMIT", "Are you sure you want to Submit this order?");
        }
    }

    var confirmationHeader = "";
    if (IsOrderSummaryScreenValid(true, false)) {
        ShowConfirmationDialog(confirmationHeader,
            confirmationMessageDetails,
            function () {
                SaveOrderOnServer(isToProcessOrder, false, false, false, false, isForProcessPending);
            },
            null,
            null);
    }

}

function SubmitOrder() {

    if (ValidateOrder()) {
        if (IsOrderSummaryScreenValid(false, false)) {
            var fitProfileId = $("#DDLFitProfile").val();
            var isFitToolChanged = false;

            if (fitProfileId > 0) {
                isFitToolChanged = IsFitToolChanged();
            }

            if (isFitToolChanged) {
                ShowFitToolDialog(function () { SaveOrderOnServer(false, false, false, false, false, false) });
            } else {
                SaveOrderOnServer(false, false, false, false, false, false);
            }
        }
    } else {
        var message = GetResourceText("SHOE_ORDER_SAVE_VALIDATION_MESSAGE", " Please fill in the data for the highlighted fields");

        ShowErrorDialog(GetResourceText("ERROR_HEADER", "Error"), message, null, null);
    }
}

function IsOrderSummaryScreenValid(isProcessOrder, isForPrepayment) {
    var result = true;

    if (!$("#chkConfirm").is(":checked")) {
        result = false;
        var agreeTermsAndConditionsMsg =
            GetResourceText("AGREE_TERMS_CONDITIONS_MSG", "Please review the summary and confirm the order.");
        ShowOKDialog("", agreeTermsAndConditionsMsg, null, null);
    }
    return result;
}


function ShowOrderSummaryDialog(isProcessOrder, isForPrepayment) {
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
                        SaveOrderOnServer(isProcessOrder, false, isForPrepayment, false, false, false);
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


function SaveOrderOnServer(isToProcessOrder, skipWarning, isForPrepayment, isCameForDefaultLabelAdded = false, isBackendDOVExtraDaysValidationChecked = false, isForProcessPending = false) {
    var options = {
        dataType: "json",
        data: { isToProcessOrder: isToProcessOrder, skipWarning: skipWarning, isForPrepayment: isForPrepayment, isCameForDefaultLabelAdded: isCameForDefaultLabelAdded, isBackendDOVExtraDaysValidationChecked: isBackendDOVExtraDaysValidationChecked, isProcessPendingOrder: isForProcessPending   },
        success: function (testdata) {
            if (testdata != null) {

                if (testdata.Status == false) {
                    if (testdata.IsCameForDefaultLabelAdded) {
                        var titleText = 'Label out of stock';
                        ShowConfirmationDialog(titleText, testdata.MessageHtml,
                            function () {
                                SaveOrderOnServer(isToProcessOrder, skipWarning, isForPrepayment, testdata.IsCameForDefaultLabelAdded, true, isForProcessPending)
                            }, null, null);
                    }
                    else if (testdata.IsAnyDateChanged) {
                        var titleText = 'Warning';
                        ShowConfirmationDialog(titleText, testdata.MessageHtml,
                            function () {
                                return SaveOrderOnServer(isToProcessOrder, skipWarning, isForPrepayment, testdata.IsCameForDefaultLabelAdded, true, isForProcessPending);
                            }, null, null);
                    }
                    else if (testdata.ValidationType == 2 && (testdata.IsFromCreditControl == undefined || testdata.IsFromCreditControl == false))
                        ShowConfirmationDialog("",
                            testdata.MessageHtml,
                            function () {
                                SaveOrderOnServer(isToProcessOrder, true, isForPrepayment, false, true, isForProcessPending);
                            },
                            null,
                            null);
                    else if (testdata.ValidationType == 0 &&
                        testdata.IsFromCreditControl != undefined &&
                        testdata.IsFromCreditControl == true) {

                        ShowConfirmationDialog("",
                            testdata.MessageHtml,
                            function () {
                                SaveOrderOnServer(false, true, isForPrepayment, false, true, isForProcessPending);
                            },
                            null,
                            null);
                    } else
                        ShowErrorDialog("", testdata.MessageHtml, null, null);
                } else {
                    window.onbeforeunload = null;

                    if (testdata.Status && testdata.IsPrepayment) {

                        MakePayment(testdata.UniqueGuid, "ShoeOrder");

                    } else {
                        $("#OrderConfirmationMessage").html(testdata.MessageHtml);
                        $("#OrderConfirmationMessage").dialog("open");
                    }
                }
            }
        }
    };
    $("#frmShoeOrder").ajaxForm(options);
    $("#frmShoeOrder").submit();
}

function ClearStyleRelatedChanges() {
    ClearCombination();
    ClearCombinationRelatedChanges();
    ClearMaterialAutoSuggestTemplate();
}


function ClearCombinationRelatedChanges() {
    ClearShoeDesignTemplate();
    ClearPrimaryInfo();
    ClearFitProfile();
    ClearDesignOption();
    ClearDesignOptionMonogram();
    ClearBrandingOption();
    $("#ShoeDesignOptionPanel").hide();
}

function RedirectToNewOrders() {
    location.href = "/ShoeOrder/CreateOrderForSameCustomer";
}

function RedirectToOrderOverview() {
    location.href = "/CustomOrderOverview";
}

function RedirectToCustomerOrders(customerId) {
    location.href = "/Customer/GetCustomerDetail?customerID=" + customerId;
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

        if (isToValidate) {

            ApplyControlBorderStyle();
            var elementId = $(this).prop('id');
            var val = $(this).val();
            if (val && (val >= 0 || (elementId === "DDLStyles" && val === "-1"))) {
                $(this).removeClass("ErrorControl");
                $(this).addClass("ValidControl");
            } else {
                $(this).removeClass("ValidControl");
                $(this).addClass("ErrorControl");
            }
        }
    });
    $(".btn").focusout(function () {
        var currentSelect = $("select", $(this).closest(".bootstrap-select")).get(0);
        var isToValidate = true;
        if (currentSelect.id === "SalesPersonID") {
            var isTailorManditory = $("#IsTailorManditory").val();

            if (isTailorManditory === "False") {
                isToValidate = false;
                $(currentSelect).removeClass("ErrorControl");
                $(currentSelect).addClass("ValidControl");
            }
        }
        if (isToValidate) {

            ApplyControlBorderStyle();
            var elementId = $(currentSelect).prop('id');
            var val = $(currentSelect).val();
            if (val && (val >= 0 || (elementId === "DDLStyles" && val === "-1"))) {
                $(currentSelect).removeClass("ErrorControl");
                $(currentSelect).addClass("ValidControl");
            }
            else if (val != null && val.length > 0 && val.includes("_"))
            {
                $(currentSelect).removeClass("ErrorControl");
                $(currentSelect).addClass("ValidControl");
            }
            else {
                $(currentSelect).removeClass("ValidControl");
                $(currentSelect).addClass("ErrorControl");
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

    var $drpDowns = $("#divShoeOrderContainer").find("select");

    $.each($drpDowns, function (i, $currentdrpDown) {

        var elementId = $($currentdrpDown).prop('id');

        var isToValidate = true;

        if (elementId === "SalesPersonID") {
            var isTailorManditory = $("#IsTailorManditory").val();

            if (isTailorManditory === "False") {
                isToValidate = false;
                $(this).removeClass("ErrorControl");
                $(this).addClass("ValidControl");
                $("button.dropdown-toggle", $(this).closest(".bootstrap-select")).removeClass("ErrorControl");
                $("button.dropdown-toggle", $(this).closest(".bootstrap-select")).addClass("ValidControl");
                $(this).closest(".bootstrap-select").removeClass("ErrorControl");
                $(this).closest(".bootstrap-select").addClass("ValidControl");
            } else {
                $(this).addClass("ErrorControl");
                $(this).removeClass("ValidControl");
                $("button.dropdown-toggle", $(this).closest(".bootstrap-select")).removeClass("ValidControl");
                $("button.dropdown-toggle", $(this).closest(".bootstrap-select")).addClass("ErrorControl");
                $(this).closest(".bootstrap-select").removeClass("ValidControl");
                $(this).closest(".bootstrap-select").addClass("ErrorControl");
            }
        }

        if (isToValidate) {
            var val = $($currentdrpDown).val();

            if (val && (val >= 0 || (elementId === "DDLStyles" && val === "-1"))) {
                $($currentdrpDown).removeClass("ErrorControl");
                $($currentdrpDown).addClass("ValidControl");
                $("button.dropdown-toggle", $($currentdrpDown).closest(".bootstrap-select")).removeClass("ErrorControl");
                $("button.dropdown-toggle", $($currentdrpDown).closest(".bootstrap-select")).addClass("ValidControl");
                $($currentdrpDown).closest(".bootstrap-select").removeClass("ErrorControl");
                $($currentdrpDown).closest(".bootstrap-select").addClass("ValidControl");
            }
            else if (val != null && val.length > 0 && val.includes("_"))
            {
                $($currentdrpDown).removeClass("ErrorControl");
                $($currentdrpDown).addClass("ValidControl");
                $("button.dropdown-toggle", $($currentdrpDown).closest(".bootstrap-select")).removeClass("ErrorControl");
                $("button.dropdown-toggle", $($currentdrpDown).closest(".bootstrap-select")).addClass("ValidControl");
                $($currentdrpDown).closest(".bootstrap-select").removeClass("ErrorControl");
                $($currentdrpDown).closest(".bootstrap-select").addClass("ValidControl");
            }
            else {
                if ($($currentdrpDown).hasClass("ValidControl")) {
                    $($currentdrpDown).removeClass("ValidControl");
                    $($currentdrpDown).addClass("ErrorControl");
                    $("button.dropdown-toggle", $($currentdrpDown).closest(".bootstrap-select")).removeClass("ValidControl");
                    $("button.dropdown-toggle", $($currentdrpDown).closest(".bootstrap-select")).addClass("ErrorControl");
                    $($currentdrpDown).closest(".bootstrap-select").removeClass("ValidControl");
                    $($currentdrpDown).closest(".bootstrap-select").addClass("ErrorControl");
                }
            }
        }
    });

    var $textBoxes = $("#divShoeOrderContainer").find("input[type='text']");
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

function UpdateRunningInformation(elementType, elementId, optionInternalName) {
    var combinationId = $("#DDLCombinations").val();
    var fabricId = $("#HDTXFabric_1").val();
    var highestExtraDays = GethighestExtraDays();
    if ($("select[id^='" + initialTextShoeMake + "']").length > 0) {

        var makeControlId = $("select[id^='" + initialTextShoeMake + "']")[0].id;
        var productPartId = makeControlId.split('_')[1];
        var productMakeId = GetValueById(makeControlId);
        var leftTryOnSizeId = $("select[id^=DDLLeftTryOnSize_]").val();
        var rightTryOnSizeId = $("select[id^=DDLRightTryOnSize_]").val();
        var beltTryOnSizeId = $("select[id^=DDLTryOnSize_]").val();

        RefereshRunningInfo(combinationId, productPartId, productMakeId, fabricId, highestExtraDays, leftTryOnSizeId, rightTryOnSizeId, beltTryOnSizeId, elementId, elementType, optionInternalName);
        RefreshSelectPicker($(".divPrimaryInfo"));
        ShowBSSWarningForSelectedTryOn();
    }
}

function RefereshRunningInfo(combinationId, productPartId, selectedMakeId, fabricId, selectedMaxExtraDays, leftTryOnSizeId, rightTryOnSizeId, beltTryOnSizeId, dovId, elementType, optionInternalName) {

    $.ajax(
        {
            type: "GET",
            url: "/ShoeOrder/GetRunningInfo",
            data: { combinationId: combinationId, productPartId: productPartId, selectedMakeId: selectedMakeId, fabricId: fabricId, extraDays: selectedMaxExtraDays, leftTryOnSizeId: leftTryOnSizeId, rightTryOnSizeId: rightTryOnSizeId, beltTryOnSizeId: beltTryOnSizeId, dovId: dovId, elementType: elementType, designOptionInternalName: optionInternalName },
            success: function (result) {
                if (result.Data) {

                    UpdateShipmentRunningInformation(result.Data.ShipmentInformationViewModel);
                    //Raju Soni[2017-12-20]: When Shoe tryons are difrent this surcharge will apply in RPrice
                    var surcharge = GetShoeTryOnSurCharge();
                    var bigSizeSurcharge = result.Data.ShipmentInformationViewModel.RPrice;
                    UpdateRPriceRunningInformation(surcharge, bigSizeSurcharge);
                    UpdatePPriceRunningInformation(result.Data);

                    RefreshRunnigInfoUI();
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

function RefreshRunnigInfoUI() {
    var runningInfoClone = $("#shoeRunningInfo").clone();
    $(runningInfoClone).attr("style", "display: block");
    $("#anchorRunningInfo").attr("data-content", $(runningInfoClone)[0].outerHTML);
    $("#anchorRunningInfo").popover({
        container: 'body'
    });
}


function UpdatePPriceRunningInformation(data) {

    $("#spnPPriceDate").html(data.PPrice.toFixed(2));
}

function UpdateRPriceRunningInformation(tryOnExtraCharge, bigSizeSurcharge) {
    var makeRPrice = GetRpriceForMake();
    var fabricRprice = parseFloat($("#RPriceTXFabric_1").val());

    var dovRprice = GetRpriceForDov();

    var tryOnDifferenceCharge = 0;

    if ($("select[id^='" + ddlLeftTryOnSize + "']").length > 0) {

        var leftTryOnId = $("select[id^='" + ddlLeftTryOnSize + "']")[0].id;

        if ($("select[id^='" + ddlRightTryOnSize + "']").length > 0) {

            var rightTryOnId = $("select[id^='" + ddlRightTryOnSize + "']")[0].id;

            var leftValue = GetValueById(leftTryOnId);
            var rightValue = GetValueById(rightTryOnId);

            if (leftValue != rightValue) {
                tryOnDifferenceCharge = tryOnExtraCharge;
            }
        }
    }

    if (isNaN(makeRPrice) || makeRPrice == undefined) {
        makeRPrice = 0;
    }
    if (isNaN(fabricRprice) || fabricRprice == undefined) {
        fabricRprice = 0;
    }
    if (isNaN(dovRprice) || dovRprice == undefined) {
        dovRprice = 0;
    }
    if (isNaN(bigSizeSurcharge) || bigSizeSurcharge == undefined) {
        bigSizeSurcharge = 0;
    }


    var total = makeRPrice + fabricRprice + dovRprice + tryOnDifferenceCharge + bigSizeSurcharge;
    $("#spnRPriceDate").html(total);
    $("#spnPaymentRPriceDate").html(total);
    CalculateInitialPaymentDetails();
}

function GethighestExtraDays() {
    var makeExtraDays = GetHighestExtraDaysForMake();
    var fabricExtraDays = parseInt($("#EDTXFabric_1").val());
    var dovExtraDays = GetHighestExtraDaysForDov();

    var mainMaterialDOId = -1;

    var atelier = $("#HD_AtelierId").val();

    var atelierType = GetSelectedAtelierIdentity(atelier);

    if (atelierType == 'SHOE-B' || atelierType == 'SHOES-FORMAL') {

        mainMaterialDOId = $("input[type='hidden'][id^='HDOptionInternalName_'][value^='LEATHER_']").attr('id');
              
        if (mainMaterialDOId) {

            var dovId = mainMaterialDOId.split('_')[1];

            let val = $("input[type='hidden'][id^='EDdrpDesignOption'][id$='" + dovId + "']").val();

            fabricExtraDays = val;
        }
    }

    if (isNaN(makeExtraDays) || makeExtraDays == undefined || makeExtraDays == null) {
        makeExtraDays = 0;
    }

    if (isNaN(fabricExtraDays) || fabricExtraDays == undefined || fabricExtraDays == null) {
        fabricExtraDays = 0;
    }

    if (isNaN(dovExtraDays) || dovExtraDays == undefined || dovExtraDays == null) {
        dovExtraDays = 0;
    }

    var extraDaysArray = [makeExtraDays, fabricExtraDays, dovExtraDays];
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
    $("select[id^='DDLShoeModel_']").each(function () {
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
    $("select[id^='DDLShoeMake_']").each(function () {
        var rPrice = parseFloat($(this).find(':selected').attr("data-makerprice"));
        if (isNaN(rPrice) || rPrice == undefined) {
            rPrice = 0;
        }
        rpriceMakes += rPrice;
    });
    return rpriceMakes;
}

function RefreshMakeRPrice(element) {

    var productPartId = $("#" + element.id).find(':selected').attr("data-productpartid");
    var elementId = "DDLShoeModel_Make_" + productPartId;
    var makeId = $("#" + element.id).find(':selected').attr("data-makeid");
    SetValueById(("HD" + elementId), makeId);

    var extraDays = $("#" + element.id).find(':selected').attr("data-makeextradays");
    SetValueById(("ED" + elementId), extraDays);

    var rPrice = $("#" + element.id).find(':selected').attr("data-makerprice");
    SetValueById(("RPrice" + elementId), rPrice);

    var fabricId = $("#HDTXFabric_1").val();
    var combinationId = $("#DDLCombinations").val();
    var highestExtraDays = GethighestExtraDays();
    if (isNaN(highestExtraDays)) {
        highestExtraDays = 0;
    }
    RefereshRunningInfo(combinationId, productPartId, makeId, fabricId, highestExtraDays);
}


function IsCopyOrder() {

    var orderMode = GetValueById("hiddenOrderMode");

    if (orderMode === textCopyMode) {
        return true;
    }
    return false;
}

function IsEditOrder() {

    var orderMode = GetValueById("hiddenOrderMode");

    if (orderMode === textEditMode) {
        return true;
    }
    return false;
}

function ReviewOrderSummary(element, targetControlId) {
    var isCheckedSummary = GetIsChecked(element.id);
    SetCheckBoxChecked(targetControlId, isCheckedSummary);
}

var GetShoeTryOnSurCharge = function () {
    var surcharge = 0;
    surcharge = parseFloat($("#HDShoeTryOnSurCharge").val());
    return surcharge;
}



function OnDiscountClick() {
    var isVisible = $("#trDiscount").is(':visible');
    if (isVisible)
        $("#trDiscount").hide();
    else
        $("#trDiscount").show();
}


function OnDiscountChange(discountTextbox) {
    if ($.trim($(discountTextbox).val()).length == 0)
        $($(discountTextbox).val(0));


    var discountcost = $("#PriceCorrection").val();
    if ($.trim(discountcost).length == 0)
        $("#PriceCorrection").val(0);

    var rPrice = $.parseFloat($("#spnPaymentRPriceDate").text());
    discountcost = $.parseFloat($("#PriceCorrection").val());
    var discountPrice = $.parseFloat($(discountTextbox).val());
    var totalPrice = rPrice - discountPrice + discountcost;

    if (isNaN(totalPrice))
        totalPrice = 0;
    $("#Total").val(GetFormattedNumber(totalPrice));

    OnDownpaymentChange($("#Downpayment"));
}

function OnDiscountCostChange(discountcostTextbox) {
    if ($.trim($(discountcostTextbox).val()).length == 0)
        $($(discountcostTextbox).val(0));


    var discount = $("#Discount").val();
    if ($.trim(discount).length == 0)
        $("#Discount").val(0);

    var rPrice = $.parseFloat($("#spnPaymentRPriceDate").text());
    discount = parseFloat($("#Discount").val());
    var discountcostPrice = $.parseFloat($(discountcostTextbox).val());
    var totalPrice = rPrice - discount + discountcostPrice;
    if (isNaN(totalPrice))
        totalPrice = 0;
    $("#Total").val(GetFormattedNumber(totalPrice));

    OnDownpaymentChange($("#Downpayment"));
}

function OnDownpaymentChange(downpaymentTextbox) {
    //var downPaymentTerm = $.parseFloat($("#DownPaymentInPercentage").val());
    if ($.trim($(downpaymentTextbox).val()).length == 0)
        $($(downpaymentTextbox).val(GetFormattedNumber(0)));



    var initialDownPayment = $.parseFloat($("#hiddenDownpayment").val());
    var currentValue = $.parseFloat($(downpaymentTextbox).val());
    if (currentValue < initialDownPayment) {
        $(downpaymentTextbox).val(GetFormattedNumber(initialDownPayment));
        ShowErrorDialog("", GetResourceText("LESS_DOWNPAYMENT", "Down payment must be minimum 50% of R.Price"), null, null);
        return;

    }

    var discount = $.parseFloat($(downpaymentTextbox).val());
    $(downpaymentTextbox).val(GetFormattedNumber(discount));



    var totalPrice = $.parseFloat($("#Total").val());
    var downpaymentPrice = $.parseFloat($(downpaymentTextbox).val());
    var outstandingPrice = totalPrice - downpaymentPrice;
    if (isNaN(outstandingPrice))
        outstandingPrice = 0;
    $("#Outstanding").val(GetFormattedNumber(outstandingPrice));
}

function OnDiscountClick() {
    var isVisible = $("#trDiscount").is(':visible');
    if (isVisible)
        $("#trDiscount").hide();
    else
        $("#trDiscount").show();
}

function CalculateInitialPaymentDetails() {

    var discountTextboxes = $("#DIVPaymentData").find("input[id^=Discount]");
    var discountCostTextboxes = $("#DIVPaymentData").find("input[id^=PriceCorrection]");
    var downpaymentTextboxes = $("#DIVPaymentData").find("input[id^=Downpayment]");


    for (var i = 0; i < discountTextboxes.length; i++)
        OnDiscountChange(discountTextboxes[i]);

    for (var i = 0; i < downpaymentTextboxes.length; i++)
        OnDownpaymentChange(downpaymentTextboxes[i]);

    for (var i = 0; i < discountCostTextboxes.length; i++)
        OnDiscountCostChange(discountCostTextboxes[i]);
}




function SubmitPrePayment() {
    if (ValidateOrder()) {
        var confirmationMessageDetails = GetResourceText("PAYMENT_ORDER_PROCESSED", "Are you sure you want to process and make payment for this order?<br><div style='color:red'>Once payment is made,you can't make changes order.<div>");
        var confirmationHeader = GetResourceText("TITLE", "Shoe order");
        if (IsOrderSummaryScreenValid(false, true)) {
            ShowConfirmationDialog(confirmationHeader, confirmationMessageDetails, function () {
                SaveOrderOnServer(false, false, true, false, false, false);
            }, null, null);
        }

    } else {
        var message = GetResourceText("SHOE_ORDER_SAVE_VALIDATION_MESSAGE",
            " Please fill in the data for the highlighted fields");

        ShowErrorDialog(GetResourceText("ERROR_HEADER", "Error"), message, null, null);
    }
}


function IsFitToolChanged() {

    var isFitToolChanged = false;

    if (selectedFitProfileDefaultFitTools  &&
        selectedFitProfileDefaultFitTools.SelectedFitTools &&
        selectedFitProfileDefaultFitTools.SelectedFitTools.length > 0) {
        $.each(selectedFitProfileDefaultFitTools.SelectedFitTools, function(i, item) {
            if (!isFitToolChanged) {
                var fitToolInOrder = $("#DDLFitTool_" + item.ID).val();

                if (fitToolInOrder) {
                    isFitToolChanged = fitToolInOrder !== item.Name;
                }
            }
        });
    }

    return isFitToolChanged;
}


function ShowBSSWarningForSelectedTryOn() {
    var leftTryOnSizeId = $("select[id^=DDLLeftTryOnSize_]").val();
    var rightTryOnSizeId = $("select[id^=DDLRightTryOnSize_]").val();
    var beltTryOnSizeId = $("select[id^=DDLTryOnSize_]").val();
    var makeControlId = $("select[id^='" + initialTextShoeMake + "']")[0].id;
    var productPartId = makeControlId.split('_')[1];

    var tryOnsWithBss = $("#TryOnSizesWithBssString").val();
    var tryOnsWithBssArray;
    if (tryOnsWithBss != undefined) {
        if (tryOnsWithBss.indexOf(',') !== -1) {
            tryOnsWithBssArray = tryOnsWithBss.split(',');
        } else {
            tryOnsWithBssArray = tryOnsWithBss;
        }
    }
    if (leftTryOnSizeId > 0 && rightTryOnSizeId > 0) {

        var isBssApplicable = leftTryOnSizeId == rightTryOnSizeId;
        if (tryOnsWithBssArray != undefined && isBssApplicable) {
            var selectedTryOnId = rightTryOnSizeId;
            if (tryOnsWithBssArray.includes(selectedTryOnId.toString())) {
                $("#bssWarning_" + productPartId).show();
            } else {
                $("#bssWarning_" + productPartId).hide();
            }
        }
        else {
            $("#bssWarning_" + productPartId).hide();
        }
    }
    if (beltTryOnSizeId > 0) {
        if (tryOnsWithBssArray != undefined) {
            var selectedTryOnId = beltTryOnSizeId;
            if (tryOnsWithBssArray.includes(selectedTryOnId.toString())) {
                $("#bssWarning_" + productPartId).show();
            } else {
                $("#bssWarning_" + productPartId).hide();
            }
        }
        else {
            $("#bssWarning_" + productPartId).hide();
        }

    }

}



function OnToggleChangeForSSOOrderNumber() {

    var isChecked = GetIsChecked("chkMarkProductPart");

    if (isChecked) {
        $("#SSOOrderNumber").show();
        AttachOrderNumberAutosuggest("SSOOrderNumber", orderNumberAutosuggestURL);
        $("#HDIsOrderCreationWithSSO").val(true);
        $('#DDLStyles').prop('disabled', true);
        RefreshCurrentSelectPicker($('#DDLStyles'));
        var ppRows = $("[id^=HDPPId_]");
        var itemNumber = 1;

        for (var i = 0; i < ppRows.length; i++) {
            var ppRowId = ppRows[i].id;
            var ppId = ppRowId.replace("HDPPId_", "")

            EnableDisablePrimaryInfoControl(true, itemNumber, ppId);
        }
    }
    else {
        $('#DDLStyles').prop('disabled', false);
        RefreshCurrentSelectPicker($('#DDLStyles'));
        var oldOrderId = $("#HDSSOOrderId").val();
        if (oldOrderId && oldOrderId > 0) {
            ShowConfirmationModalDialogWithCustomizeText("", GetResourceText("SSO_RESET_INFORMATION"),
                function () {
                    ResetSSOOrderCopy();
                },
                OnSSCopyOrderCancelled, "", "Continue", "Cancel");
        }
        else {
            ResetSSOOrderCopy();
        }
    }
}
function ResetSSOOrderCopyForFitTool() {
    $.ajax({
        type: "POST",
        data: { copyOrder: false, orderNumber: '', orderId: -1, isCallFromFitprofile: true },
        url: "/ShoeOrder/OnCopyOrderFromSSOOrderChanged/",
        success: function (data) {
            if (data.Status) {
            }
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
        }
    });
}

function ResetSSOOrderCopy() {

    $.ajax({
        type: "POST",
        data: { copyOrder: false, orderNumber: '', orderId: -1, isCallFromFitprofile: false },
        url: "/ShoeOrder/OnCopyOrderFromSSOOrderChanged/",
        success: function (data) {
            if (data.Status) {
                //All good with Ajax call
                var ppRows = $("[id^=HDPPId_]");
                var itemNumber = 1;

                for (var i = 0; i < ppRows.length; i++) {
                    var ppRowId = ppRows[i].id;
                    var ppId = ppRowId.replace("HDPPId_", "")
                    $("#HDSSOOrderMake_" + ppId).val(-1);
                    $("#HDSSOOrderSPP_" + ppId).val(-1);
                    $("#HDSSOOrderIsDeterministicPP_" + ppId).val('');
                    EnableDisablePrimaryInfoControl(false, itemNumber, ppId);
                }
                $("#HDSSOOrderId").val(-1);
                $("#HDSSOOrderPPs").val("");
                $("#HDSSOOrderFabricId").val(-1);
                $("#HDSSOOrderFabricExtraDays").val(0);
                $("#HDSSOOrderLiningExtraDays").val(0);
                $("#HDSSOOrderLiningId").val(-1);
                $("#HDSSOOrderFabricName").val('');
                $("#HDSSOOrderLiningNotification").val(false);
                $("#HDSSOOrderFabricNotification").val(false);
                $("#HDSSOOrderLiningName").val('');
                $("#HDSSOOrderAtelierId").val(-1);
                $("#ddQuantities").prop("disabled", false);
                $("#HDIsOrderCreationWithSSO").val(false);
                $("SSOOrderNumber").autocomplete({ source: [] });
                $("#SSOOrderNumber").hide();
                $("#SSOOrderNumber").val('');
                $("#DDLCombinations").change();
            }
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
        }
    });
}

function OnSSCopyOrderCancelled() {
    SetCheckBoxChecked("chkMarkProductPart", true);
}

function EnableDisablePrimaryInfoControl(isTodisable, itemNumber, ppId) {
    $('#DDLShoeMake_' + ppId).prop('disabled', isTodisable);
    if ($("#ShoeDesignTemplate").find("[id^=drpDesignOption]")[0] != null) {
        var modelDoID = $("#ShoeDesignTemplate").find("[id^=drpDesignOption]")[0].id;
        $("#" + modelDoID).prop('disabled', isTodisable);
        RefreshCurrentSelectPicker($("#" + modelDoID));
    }
    RefreshCurrentSelectPicker($('#DDLShoeMake_' + ppId));
    $("#TXFabric_" + itemNumber).prop('disabled', isTodisable);
}
function AttachOrderNumberAutosuggest(textboxID, orderNumberAutosuggestURL) {
    var autoCompleteWidth = $("#" + textboxID).width() + 28;
    var combinationId = $("#DDLCombinations").val();
    $("#" + textboxID).autocomplete(orderNumberAutosuggestURL,
        {
            extraParams: { combinationID: combinationId },
            cacheLength: 0,
            delay: 500,
            minChars: 6,
            width: autoCompleteWidth,
            multiple: false,
            class: "test",
            matchContains: true,
            formatItem: function (row) {
                var result = row[1];
                return result;
            },
            formatResult: function (row) {
                return $.trim(row[1]);
            },
            mustMatch: true,
            selectFirst: true
        }
    );

    $("#" + textboxID).result(function (event, data, formatted) {
        var orderID = -1;
        var orderNumber = "";
        var controlID = $(this).attr("id");
        if (data != undefined) {
            if (data.length > 0 && data[0] != undefined && !isNaN(data[0])) {
                orderID = data[0];
            }
            if (data.length > 1 && data[1] != undefined) {
                orderNumber = data[1];
            }
        }
        if (orderID != $("#HD" + controlID).val()) {
            if (orderID > 0) {
                LoadOrderData(orderID, orderNumber);
            } else {
                if (orderID < 0) {
                    $("#" + controlID).val("");
                }
            }
        }
    });
}

function LoadOrderData(orderId, orderNumber) {
    $.ajax(
        {
            type: "Post",
            url: "/ShoeOrder/GetOrderData",
            data: { orderId: orderId, orderNumber: orderNumber },
            success: function (data) {
                if (data.status == true) {
                    $("#HDSSOOrderPPs").val("");
                    $("#HDDataLoaded").val(false);
                    if (data.orderData != null) {
                        var ssoOrderPrimaryInfoData = data.orderData;
                        var itemNumber = 1;
                        var productPartIds = "";

                        var ppIds = $("[id^=HDPPId]");
                        for (var k = 0; k < ppIds.length; k++) {

                            var productPartId = parseInt(ppIds[k].id.replace("HDPPId_", ""));
                            EnableDisablePrimaryInfoControl(false, itemNumber, productPartId);
                        }
                        for (var k = 0; k < ssoOrderPrimaryInfoData.length; k++) {
                            var productPartId = ssoOrderPrimaryInfoData[k].ProductPartId;
                            if (productPartIds != "") {
                                productPartIds = productPartIds + "," + productPartId;
                            }
                            else {
                                productPartIds = productPartId;
                            }
                        }
                        $("#HDSSOOrderPPs").val(productPartIds);
                        for (var i = 0; i < ppIds.length; i++) {
                            var ppid = parseInt(ppIds[i].id.replace("HDPPId_", ""));
                            var ssoOrderPP = ssoOrderPrimaryInfoData.filter(x => x.ProductPartId == ppid).pop();
                            if (ssoOrderPP != null) {
                                $("#HDSSOOrderId").val(ssoOrderPP.OrderId);
                                $("#HDSSOOrderFabricId").val(ssoOrderPP.FabricId);
                                $("#HDSSOOrderFabricExtraDays").val(ssoOrderPP.FabricExtraDays);
                                $("#HDSSOOrderFabricName").val(ssoOrderPP.FabricName);
                                $("#HDSSOOrderFabricNotification").val(ssoOrderPP.IsNotificationFabric);
                                $("#HDSSOOrderAtelierId").val(ssoOrderPP.AtelierId);
                                $("#HDSSOOrderMake_" + ppid).val(ssoOrderPP.MakeId);
                                if ($("#ShoeDesignTemplate").find("[id^=drpDesignOption]")[0] != null) {

                                    var modelDoID = $("#ShoeDesignTemplate").find("[id^=drpDesignOption]")[0].id;
                                    $("#" + modelDoID).val(ssoOrderPP.ShoeModelId);
                                    $("#" + modelDoID).change()
                                    RefreshCurrentSelectPicker($("#" + modelDoID));
                                }
                                else if (ppid == 41) {
                                    var shoeBSecondaryMaterialInfo = ssoOrderPP.ShoeBMainMaterialInfo.filter(x => x.DesignOptionID == 619).pop();
                                    var secondaryMaterialControlID = drpOptionControlId + ppid + "_" + shoeBSecondaryMaterialInfo.DesignOptionCategoryID + "_" + shoeBSecondaryMaterialInfo.DesignOptionID;

                                    $('#DDLShoeSPP_' + ppid).val(ssoOrderPP.SubProductPartId);
                                    $('#DDLShoeSPP_' + ppid).change();

                                    $("#SecondaryFabricName").val(shoeBSecondaryMaterialInfo.MaterialName);
                                    $("#ED" + secondaryMaterialControlID).val(shoeBSecondaryMaterialInfo.ExtraDays);
                                    $("#RPrice" + secondaryMaterialControlID).val(0);
                                    $('#' + secondaryMaterialControlID).val(shoeBSecondaryMaterialInfo.DOVTrimMasterID);
                                    $('#text_' + secondaryMaterialControlID).val(shoeBSecondaryMaterialInfo.MaterialName);
                                    $("#IsLeatherMatchGroupShoeB").val(shoeBSecondaryMaterialInfo.ShoeLeatherMatchingGroupId);

                                    OnMainMaterialDovChange(this, shoeBSecondaryMaterialInfo.DOVTrimMasterID, secondaryMaterialControlID);

                                }
                                var text = "";
                                var extraDays = ssoOrderPrimaryInfoData[i].FabricExtraDays;
                                var notification = ssoOrderPrimaryInfoData[i].IsNotificationFabric;
                                if (extraDays != 0 && notification) {
                                    text = String.format(GetResourceText("CLFABRIC_WITH_EXTRA_DAYS", "Please note this is a CL Fabric with temporarily delay of {0} days"), data[2]);
                                }
                                else if (notification && extraDays == 0) {
                                    text = GetResourceText("CLFABRIC_WITH_NO_EXTRA_DAYS", "Please note this is a CL Fabric");
                                }
                                else if (notification && extraDays > 0) {
                                    text = String.format(GetResourceText("EXTRADAYS", "{0} extra day(s)"), data[2]);
                                }

                                var atelier = GetSelectedAtelierIdentity();

                                if (atelier != 'SHOE-B' && atelier != 'SHOES-FORMAL') {
                                    $("#spTXFabric_1").html(text);
                                    $("#TXFabric_1").val(ssoOrderPrimaryInfoData[i].FabricName);
                                    $("#HDTXFabric_1").val(ssoOrderPrimaryInfoData[i].FabricId);
                                    $("#EDTXFabric_1").val(ssoOrderPrimaryInfoData[i].FabricExtraDays);
                                    $("#CLTXFabric_1").val(ssoOrderPrimaryInfoData[i].IsNotificationFabric);

                                    if (ssoOrderPrimaryInfoData[i].FabricId > 0) {
                                        OnFabricSelection(ELEMENT_TYPE_FABRIC, $("#TXFabric_1"));
                                    }
                                }
                                else {

                                    var shoeBMainMaterialInfo = ssoOrderPP.ShoeBMainMaterialInfo.filter(x => x.DesignOptionID != 619).pop();

                                    var mainMaterialControlID = drpOptionControlId + ppid + "_" + shoeBMainMaterialInfo.DesignOptionCategoryID + "_" + shoeBMainMaterialInfo.DesignOptionID;


                                    $("#SearchFabricName").val(shoeBMainMaterialInfo.MaterialName);
                                    //Set the current values
                                    $("#ED" + mainMaterialControlID).val(shoeBMainMaterialInfo.ExtraDays);
                                    $("#RPrice" + mainMaterialControlID).val(0);

                                    $('#' + mainMaterialControlID).val(shoeBMainMaterialInfo.DOVTrimMasterID);
                                    $('#text_' + mainMaterialControlID).val(shoeBMainMaterialInfo.MaterialName);
                                    $("#IsLeatherMatchGroupShoeB").val(shoeBMainMaterialInfo.ShoeLeatherMatchingGroupId);
                                    //make request 

                                    OnMainMaterialDovChange(this, shoeBMainMaterialInfo.DOVTrimMasterID, mainMaterialControlID);
                                    if (ppid == 41) {
                                        var trimMasterID = shoeBMainMaterialInfo.DOVTrimMasterID.split("_")[1];
                                        OnMainMaterialTrimSelection(trimMasterID);
                                    }
                                }
                            }
                        }
                        $("#HDDataLoaded").val(true);
                    }
                } else {
                }
            }
        });
}

function AttachOrderNumberPerProductPartAutosuggest(textboxID, productPartId, orderNumberAutosuggestURL) {
    var itemNumber = 1;
    var autoCompleteWidth = $("#" + textboxID).width() + 28;
    $("#" + textboxID).autocomplete(orderNumberAutosuggestURL,
        {
            extraParams: { itemNumber: itemNumber, productPartId: productPartId },
            cacheLength: 0,
            delay: 500,
            minChars: 6,
            width: autoCompleteWidth,
            multiple: false,
            class: "test",
            matchContains: true,
            formatItem: function (row) {
                var result = row[1];
                return result;
            },
            formatResult: function (row) {
                return $.trim(row[1]);
            },
            mustMatch: true,
            selectFirst: true
        }
    );
    $("#" + textboxID).result(function (event, data, formatted) {

        var orderID = -1;
        var controlID = $(this).attr("id");
        var orderNumber;
        $(this).removeAttr("search");
        if (data != undefined) {
            if (data.length > 0 && data[0] != undefined && !isNaN(data[0])) {
                orderID = data[0];
            }
            if (data.length > 1 && data[1] != undefined) {
                orderNumber = data[1];
            }
        }
        if (orderID != $("#HD" + controlID).val()) {
            if (orderID > 0) {
                LoadFitProfileData(orderID, productPartId, orderNumber);
            } else {
                if (orderID < 0) {
                    $("#" + controlID).val("");
                }
            }
        }
    });
}
function LoadFitProfileData(orderId, ppid, orderNumber) {
    $.ajax(
        {
            type: "Post",
            url: "/ShoeOrder/GetOrderDataFitAndTryOn",
            data: { orderId: orderId, productPartId: ppid, orderNumber: orderNumber },
            success: function (data) {
                if (data.status == true) {
                    if (data.orderData != null) {
                        var orderFitProfileData = data.orderData;
                        $("#DDLProductFit_" + ppid).val(orderFitProfileData.ProductFitId);
                        if (ppid != 25) {
                            $("#DDLLeftTryOnSize_" + ppid).val(orderFitProfileData.LeftTryOnSizeId);
                            $("#DDLRightTryOnSize_" + ppid).val(orderFitProfileData.RightTryOnSizeId);
                            RefreshCurrentSelectPicker($("#DDLLeftTryOnSize_" + ppid));
                            RefreshCurrentSelectPicker($("#DDLRightTryOnSize_" + ppid));
                            $("#DDLLeftTryOnSize_" + ppid).change();
                        } else {
                            $("#DDLTryOnSize_" + ppid).val(orderFitProfileData.TryOnSizeId);
                            RefreshCurrentSelectPicker($("#DDLTryOnSize_" + ppid));
                            $("#DDLTryOnSize_" + ppid).change();
                        }
                    }
                } else {

                }
            }
        });
}