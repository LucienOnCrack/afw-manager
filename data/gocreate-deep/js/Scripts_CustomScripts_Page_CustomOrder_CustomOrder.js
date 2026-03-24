/******************************************************************************************************
GLOBAL VARIABLES USED
*******************************************************************************************************/
/// <summary>Holds the json serialized object of RunningInformation object. Using this variable the running information html is refreshed.</summary>
var RunningInformation;
/// <summary>Holds the json serialized object of Item details object. Using this variable the Item details popup html is refreshed.</summary>
var ItemDetails;

var TryOnOrderCreationType = 1;
var BMOrderCreationType = 2;
var finalStepToLoad = 0;

var step = 1;
var TOTAL_STEP = 7;

var testGarmentSelected = false;
var CopyTrouserSmokingColor = false;
var CopiedOptionValueId = -1;

var hideFitAndTryOn = parseBool($("#HideFitAndTryOn").val());
var hideFitTools = parseBool($("#HideFitTools").val());
var hideMake = parseBool($("#HideMake").val());
var hideButton = parseBool($("#HideButton").val());



var numberOfStepsToSkip = 0;

function GetTabNameAndCounter(next, previous) {
    var innerStep = step;
    var hideBrandingOptions = $("#hdnHideBrandingOptions").val();
    if (hideBrandingOptions == 1) {
        TOTAL_STEP = 6;
        if (next) {
            if (step == 5)
                innerStep = 6;
        }
        else if (previous) {
            if (step == 5)
                innerStep = 4;
        }
    }
    var hideFitAndTryOnStep = parseBool($("#HideFitAndTryOnStepInCopyOrder").val());
    var hideFitToolsStep = parseBool($("#HideFitToolsStepInCopyOrder").val());
    if (hideFitAndTryOnStep || hideFitAndTryOnStep) {
        if (next) {
            if (step == 2)
                innerStep = 3;
        }
    }
    if (hideFitToolsStep || hideFitToolsStep) {
        if (next) {
            if (step == 3)
                innerStep = 4;
        }
    }




    if (innerStep != 4) {
        EnableNavigationButton("btnNext");
        EnableNavigationButton("btnPrevious");
    } else if (hideFitTools || hideFitAndTryOn) {
        EnableNavigationButton("btnPrevious");
    }
    EnableCautionMessageCheckboxes();
    $("#divSelectAllCautionMessage").hide();
    $('#divCustomOrderSteps li').removeClass('selected');
    $("#btnNext").show();
    $("#btnPrevious").show();
    var stepName = "";
    var stepText = "";
    switch (innerStep) {
        case 1:
            $("#btnPrevious").hide();
            $("#liPrimaryInfo").addClass("selected");
            stepName = GetResourceText("PRIMARYINFO_TABNAME", "Primary Info");
            DisableNavigationButton("btnPrevious");
            break;
        case 2:
            $("#liFitAndTryOn").addClass("selected");
            stepName = GetResourceText("FITANDTRYON_TABNAME", "FitProfile");
            break;
        case 3:
            $("#liFitTool").addClass("selected");
            var orderCreationType = $("#hiddenOrderCreationType").val();

            if (orderCreationType == "2" || (orderCreationType == "3" && $('#hdnIsAdminLoggedInToTheApplication').val() == 0)) {
                stepName = GetResourceText("MEASUREMENT_TABNAME", "FitTool");
            }
            else {
                stepName = GetResourceText("FITTOOL_TABNAME", "FitTool");
            }
            break;
        case 4:
            $("#liDesignOption").addClass("selected");
            stepName = GetResourceText("DESIGNOPTION_TABNAME", "Design Options");
            break;
        case 5:
            $("#liBrandingOption").addClass("selected");
            stepName = GetResourceText("BRANDINGOPTION_TABNAME", "Branding Option");
            break;
        case 6:
            $("#liOrderSummary").addClass("selected");
            stepName = GetResourceText("ORDERSUMMARY_TABNAME", "Summary");
            ShowHideSelectAllCautionMessageCheckboxes();
            break;
        case 7:
            $("#btnNext").hide();
            $("#liFinalize").addClass("selected");
            DisableNavigationButton("btnNext");
            DisableCautionMessageCheckboxes();
            stepName = GetResourceText("FINALIZE_TABNAME", "Finalize");
            break;
    }
    if (hideBrandingOptions == 1) {
        if (next) {
            if (innerStep == 6)
                innerStep = 5;
            else if (innerStep == 7)
                innerStep = 6;
        }
        else if (previous) {
            if (innerStep == 7)
                innerStep = 6;
            else if (innerStep == 6)
                innerStep = 5;
        } else {
            if (innerStep == 6)
                innerStep = 5;
        }
    }

    var totalSteps = TOTAL_STEP;
    if (hideFitAndTryOn || hideFitTools) {
        totalSteps -= numberOfStepsToSkip;
        if (innerStep > 2)
            innerStep -= numberOfStepsToSkip;
    }


    stepText = String.format(GetResourceText("STEPS", "Step {0}/{1}"), innerStep, totalSteps);
    $("#stepCounter").html(stepText);
    $("#TabText").html(stepName);
    CloseRRunningInformationTab();
    ClosePRunningInformationTab();
}

function GetNextDetail() {

    var innerStep = step;
    var hideBrandingOptions = $("#hdnHideBrandingOptions").val();
    var newStepNo = innerStep + 1;
    if (hideBrandingOptions == 1) {
        if (newStepNo == 5)
            newStepNo = 6;
    }

    var hideFitAndTryOnStep = parseBool($("#HideFitAndTryOnStepInCopyOrder").val());
    var hideFitToolsStep = parseBool($("#HideFitToolsStepInCopyOrder").val());

    if (hideFitAndTryOn || hideFitAndTryOnStep) {
        if (newStepNo == 2) {
            newStepNo = 3;
        }

    }

    if (hideFitTools || hideFitToolsStep) {
        if (newStepNo == 3) {
            newStepNo = 4;
        }
    }

    var checkForValidation = true;
    var orderMode = $("#hiddenOrderMode").val();
    if (orderMode == 1 && $("#hiddenOrderCreationType").val() != 2 && innerStep != 4) {
        checkForValidation = false;
    }
    var orderCopyEachComponent = $("#OrderCopyEachComponent").val();
    if (orderCopyEachComponent != null && orderCopyEachComponent != undefined && orderCopyEachComponent.toLowerCase() == 'true') {
        checkForValidation = false;
    }

    if (innerStep == 1) {
        var isFromDraftOrder = $("#IsFromDraftOrder").val();
        testGarmentSelected = IsTestGarmentSelected();
        if (isFromDraftOrder == 1) {
            SubmitPrimaryInfo({ checkValidation: true, wizardNextStep: true, runningInformation: CollectAllCautionMessages() }, ChangeWizardStep, { newStep: newStepNo, next: true, previous: false });
        } else {


            if (orderMode == 0 && $("#IsOrderCreationTypeSelected").val() == 0 && $("#hdnProductCombinationCanCreateBMOrder").val() == 1 && ValidatePrimaryInfoScreen()) {

                $("#divOrderCreationSelection").dialog({
                    top: 350,
                    left: 778,
                    width: 418,
                    height: 70,
                    resizable: false,

                    title: GetResourceText("SELECT_TYPE_OF_ORDER",
                        "Please select the type of your order:"),
                    modal: true,
                    closeOnEscape: false,
                    close: function () {

                        var newStepNo = innerStep + 1;

                        SubmitPrimaryInfo({ checkValidation: true, wizardNextStep: true, runningInformation: CollectAllCautionMessages() }, ChangeWizardStep, { newStep: newStepNo, next: true, previous: false });
                    },
                    open: function () {
                        $(this).parent().find(".ui-dialog-title").css("width", "100%");
                        $(this).parent().find(".ui-dialog-title").css("text-align", "center");
                    }
                });

                $("#divOrderCreationSelection").dialog("open");


            } else {

                SubmitPrimaryInfo({ checkValidation: true, wizardNextStep: true, runningInformation: CollectAllCautionMessages() }, ChangeWizardStep, { newStep: newStepNo, next: true, previous: false });
            }
        }

    }
    else if (innerStep == 2) {
        var productPartIDs = GetProductPartIDs("tblFitAndTryOn", "hdnProductPartID_");
        var isAnyCallFromAdvisor = false;
        for (var i = 0; i < productPartIDs.length; i++) {
            var isCallFromAdvisor = $("#ddFitAdvise_" + productPartIDs[i]).val();
            if (isCallFromAdvisor == 2) {
                isAnyCallFromAdvisor = true;
                ShowNewFPCreationSection(productPartIDs[i], true);
            }
        }
        if (!isAnyCallFromAdvisor) {
            submitFitAndTryOn({ checkValidation: true, wizardNextStep: true, runningInformation: CollectAllCautionMessages() }, ChangeWizardStep, { newStep: newStepNo, next: true, previous: false });
        }
    }
    else if (innerStep == 3) {
        submitFitTools({ checkValidation: checkForValidation, wizardNextStep: true, runningInformation: CollectAllCautionMessages() }, ChangeWizardStep, { newStep: newStepNo, next: true, previous: false });
    }
    else if (innerStep == 4) {
        submitDesignOptions({ checkValidation: checkForValidation, wizardNextStep: true, runningInformation: CollectAllCautionMessages() }, ChangeWizardStep, { newStep: newStepNo, next: true, previous: false });
    }
    else if (innerStep == 5) {
        SubmitBrandingOptionInfo({ checkValidation: checkForValidation, wizardNextStep: true, runningInformation: CollectAllCautionMessages() }, ChangeWizardStep, { newStep: newStepNo, next: true, previous: false });
    }
    else if (innerStep == 6) {
        SubmitOrderSummaryInfo({ checkValidation: true, wizardNextStep: true, runningInformation: CollectAllCautionMessages() }, ChangeWizardStep, { newStep: newStepNo, next: true, previous: false });
    }

}

function GetCheckNextDetailEdited() {
    if (step == 1) {
        SubmitPrimaryInfo({ checkValidation: false, wizardNextStep: true, runningInformation: CollectAllCautionMessages() }, ChangeWizardStep, { newStep: 2 });
    }
    else if (step == 2) {
        submitFitAndTryOn({ checkValidation: false, wizardNextStep: true, runningInformation: CollectAllCautionMessages() }, ChangeWizardStep, { newStep: 3 });
    }
    else if (step == 3) {
        submitFitTools({ checkValidation: false, wizardNextStep: true, runningInformation: CollectAllCautionMessages() }, ChangeWizardStep, { newStep: 4 });
    }
    else if (step == 4) {
        submitDesignOptions({ checkValidation: false, wizardNextStep: true, runningInformation: CollectAllCautionMessages() }, ChangeWizardStep, { newStep: 5 });
    }
    else if (step == 5) {
        SubmitBrandingOptionInfo({ checkValidation: false, wizardNextStep: true, runningInformation: CollectAllCautionMessages() }, ChangeWizardStep, { newStep: 6 });
    }
    else if (step == 6) {
        SubmitOrderSummaryInfo({ checkValidation: true, wizardNextStep: true, runningInformation: CollectAllCautionMessages() }, ChangeWizardStep, { newStep: 7 });
    }

}
function ChangeWizardStep(data, resultData) {
   
    step = data.newStep;
    $("#divOrderCreationMainPanel").html(resultData.MessageHtml);
    GetTabNameAndCounter(data.next, data.previous);
    
     var combinationsAllowedForTestGarment = $("#AllowedCombinationsForTestGarment").val();
    if (combinationsAllowedForTestGarment) {
          RemoveTestGarmentFromTrouser();        
    }  
       
    if (testGarmentSelected) { 
        $("#drpbgroup_" + 1).find("option[value='2']").remove();
        $("#drpbgroup_" + 1).find("option[value='3']").remove();
    }
    $(window).scrollTop(0);
}

function RemoveTestGarmentFromTrouser() {
     var TestjacketSppId = $("#JacketSppIdForTestGarment").val();
     var TestTrouserSppId = $("#TrouserSppIdForTestGarment").val();
     var combinationsAllowedForTestGarment = $("#AllowedCombinationsForTestGarment").val();
     var sppId = $("#Spp_1_1").val();

      if (combinationsAllowedForTestGarment && (sppId == TestjacketSppId)) { //case 1
            $('#Spp_2_1' + ' option').each(function () {
                var data = $(this).val();
                if ((data != "") && (data != TestTrouserSppId)) {
                    $(this).remove();
                }
            });
        }

      if ((combinationsAllowedForTestGarment) && sppId &&  sppId != TestjacketSppId) {  //case 2
            $('#Spp_2_1' + ' option').each(function () {
                var data = $(this).val();
                if (data == TestTrouserSppId) {
                    $(this).remove();
                }
            });
        }

}

function SwitchTab(data, resultData) {
    var tabControl = $("#" + data.tabControl);
    tabControl.unbind('easytabs:before');
    tabControl.easytabs('select', data.newTabName);
    tabControl.bind('easytabs:before', data.callBack);
    $("#ActiveProductTab").val(data.newTabName);

    if (data.AfterSwitch != null)
        data.AfterSwitch();
}

function GoToStep(stepNo) {

    if (stepNo < step) {

        // Not allow copy and finalize when user will back to step                        
        GoToFinalizedElementUpdateToFalse();

        var innerStep = stepNo;
        var hideBrandingOptions = $("#hdnHideBrandingOptions").val();
        if (hideBrandingOptions == 1) {
            if (stepNo == 5) {
                innerStep = 6;
            }
            if (stepNo == 7)
                innerStep = 6;
        }

        var stepInfo = { newStep: innerStep, next: false, previous: false };
        $.ajax(
            {
                type: "GET",
                url: "CustomOrder/GoToStep",
                dataType: "json",
                data: { step: stepNo },
                success: function (data) {
                    ChangeWizardStep(stepInfo, { MessageHtml: data.MessageHtml });
                }
            });
    }
}




function GoToStepForEdit(stepNo) {
    var stepInfo = { newStep: stepNo };
    $.ajax(
        {
            type: "post",
            url: "CustomOrder/GoToStep?step=" + stepNo,
            dataType: "json",
            data: { step: stepNo },
            success: function (data) {
                ChangeWizardStep(stepInfo, { MessageHtml: data.MessageHtml });
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                HandleJSError("CustomOrder.js", "GoToStepForEdit", XMLHttpRequest, textStatus, errorThrown);
            }
        });
}

function GetPreviousDeatil() {

    var innerStep = step;
    var newStepNo = innerStep - 1;
    var hideBrandingOptions = $("#hdnHideBrandingOptions").val();

    // Not allow copy and finalize when user will back to step                        
    GoToFinalizedElementUpdateToFalse();

    if (hideBrandingOptions == 1) {
        if (newStepNo == 5)
            newStepNo = 4;
    }

    if (hideFitTools) {
        if (newStepNo == 3) {
            newStepNo = 2;
        }
    }

    if (hideFitAndTryOn) {
        if (newStepNo == 2) {
            newStepNo = 1;
        }

    }



    if (innerStep == 2) {
        submitFitAndTryOn({ checkValidation: false, wizardNextStep: true, runningInformation: CollectAllCautionMessages() }, ChangeWizardStep, { newStep: newStepNo, next: false, previous: true });
    }
    else if (innerStep == 3) {
        submitFitTools({ checkValidation: false, wizardNextStep: true, runningInformation: CollectAllCautionMessages(), canGoToPreviousStep: true }, ChangeWizardStep, { newStep: newStepNo, next: false, previous: true });
    }
    else if (innerStep == 4) {
        $("#btnNext").removeAttr("disabled");
        submitDesignOptions({ checkValidation: false, wizardNextStep: true, runningInformation: CollectAllCautionMessages(), canGoToPreviousStep: true }, ChangeWizardStep, { newStep: newStepNo, next: false, previous: true });
    }
    else if (innerStep == 5) {
        SubmitBrandingOptionInfo({ checkValidation: false, wizardNextStep: true, runningInformation: CollectAllCautionMessages(), canGoToPreviousStep: true }, ChangeWizardStep, { newStep: newStepNo, next: false, previous: true });
    }
    else if (innerStep == 6) {
        SubmitOrderSummaryInfo({ checkValidation: false, wizardNextStep: true, runningInformation: CollectAllCautionMessages(), canGoToPreviousStep: true }, ChangeWizardStep, { newStep: newStepNo, next: false, previous: true });
    }
    else if (innerStep == 7) {
        SubmitFinalize({ checkValidation: false, wizardNextStep: true, runningInformation: CollectAllCautionMessages(), isProcessOrder: false, isPaymentPending: false, canGoToPreviousStep: true }, ChangeWizardStep, { newStep: newStepNo, next: false, previous: true });
    }
}

function GetDesignOptionIDFromID(id) {
    var result = id;
    if (id.toString().indexOf("_") > 0) {
        var arr = id.split("_");
        if (arr != null && arr.length > 2) {
            result = arr[1];
        }
    }
    return result;
}

function GetDesignOptionCategoryIDFromID(id) {
    var result = id;
    if (id.toString().indexOf("_") > 0) {
        var arr = id.split("_");
        if (arr != null && arr.length > 2) {
            result = arr[2];
        }
    }
    return result;
}

/******************************************************************************************************
FORM SUBMIT FUNCTIONS OF VARIOUS SCREENS
*******************************************************************************************************/

function SubmitPrimaryInfo(postData, func, param) {
    /// <summary>Submits the Primary information form to server</summary>
    /// <param name="postData" type="jSon">The extra data to be posted with the form</param>
    /// <param name="func" type="function">The callback function that will be called on </param>
    /// <param name="param" type="jSon"></param>
    /// <returns type="Number">Nothing.</returns>

    /// Validate and restrict Test garment spp with Multiple order quantity
    var testGarmentAvailable = IsTestGarmentAvailable(-1, 0);
    if (testGarmentAvailable) {
        ShowTestGarmentErrorBox(undefined, false);
        return false;
    }
    if (ValidatePrimaryInfoScreen()) {
        var options = {
            data: postData,
            dataType: "json",
            success: function (testdata) {
                if (testdata != null) {
                    /// Validate and restrict Test garment spp with Multiple order quantity
                    if (testdata.IsTestGarmentSppUse) {
                        ShowTestGarmentErrorBox(undefined, false);
                        return false;
                    }

                    if (testdata.Status == false) {
                        // Not allow copy and finalize when user will back to step                        
                        GoToFinalizedElementUpdateToFalse();
                        ShowErrorDialog("", testdata.MessageHtml, null, null);
                    } else {

                        if (testdata.ValidationType == IMPOSSIBLE_VALIDATION_TYPE_WARNINGS) {
                            // Not allow copy and finalize when user will back to step                        
                            GoToFinalizedElementUpdateToFalse();

                            ShowConfirmationDialog("", testdata.WarningHtml, function () {
                                func(param, testdata);
                            }, null, null);
                        }
                        else
                            func(param, testdata);
                    }
                }
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                HandleJSError("CustomOrder.js", "SubmitPrimaryInfo", XMLHttpRequest, textStatus, errorThrown);
            }
        };
        //var activeTab = $("#ActiveProductTab").val();
        $("#frmPrimaryInfo").ajaxForm(options);
        $("#frmPrimaryInfo").submit();
    }
}

function SubmitOrderSummaryInfo(postData, func, param) {
    /// <summary>Submits the Branding information form to server</summary>
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
                    ShowErrorDialog("", testdata.MessageHtml, null, null);
                else
                    func(param, testdata);
            }
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            HandleJSError("CustomOrder.js", "SubmitOrderSummaryInfo", XMLHttpRequest, textStatus, errorThrown);
        }

    };
    //var activeTab = $("#ActiveFitToolTab").val();
    $("#CustomOrderSummaryForm").ajaxForm(options);
    $("#CustomOrderSummaryForm").submit();
}

/***********************************************************************************************************
METHODS RELATED TO INITIALIZING THE INDEX PAGE FOR CUSTOM ORDER
************************************************************************************************************/
function InitializeCustomOrderIndexPageScripts() {

   
    InitializeScrollBars();
    GetTabNameAndCounter(false, false);

    //Hide the closed panel
    $(".PanelOpen").hide();

    InitializeRunningInformationOpenCloseAction();
    InitializeWizardStepInfoPopup();

    AdjustRunningInformationHeight();
    $("body").click(function (event) {
        $(".StepinfoBox").slideUp();

    });

    MakeFormAjax();

    $(window).resize(function () {

        AdjustRunningInformationHeight();
        switch (ClientAppObject.CustomOrderCurrentWizardStep) {
            case EnumCustomOrderWizardSteps.PRIMARY_INFORMATION:
                AdjustPIHeight();
                break;
            case EnumCustomOrderWizardSteps.FIT_AND_TRYON:
                AdjustFitTryonHeight();
                break;
            case EnumCustomOrderWizardSteps.FITTOOL:
                AdjustFittoolTabHeight();
                break;
            case EnumCustomOrderWizardSteps.DESINGN_OPTIONS:
                AdjustDOHeight();
                break;
            case EnumCustomOrderWizardSteps.BRANDING_OPTIONS:
                AdjustBOHeight();
                break;
            case EnumCustomOrderWizardSteps.ORDER_SUMMARY:
                AdjustOrderSummaryHeight();
                break;
            case EnumCustomOrderWizardSteps.FINALIZE:
                AdjustFinalizeHeight();
                break;
        }
    });
}

function UpdateRRunningInformationTab(oldStatusOfRPriceTab) {
    //	$("#divRPriceContainer").addClass(oldStatusOfRPriceTab);
    var rPricediv = $("#divRPriceContainer").find("div[id^=RPriceTemplateContainer]");
    if (rPricediv.attr != undefined || rPricediv != 'undefined') {
        for (var i = 0; i < rPricediv.length; i++) {
            var className = $(rPricediv[i]).attr('class');
            if (className != oldStatusOfRPriceTab[i]) {
                $(rPricediv[i]).removeClass();
                $(rPricediv[i]).addClass(oldStatusOfRPriceTab[i]);
            }
        }
    }

}

function CloseRRunningInformationTab() {
    var rPricediv = $("#divRPriceContainer").find('.CollapsiblePanel');
    if (rPricediv != 'undefined' && rPricediv.length > 0) {
        $(rPricediv).removeClass();
        $(rPricediv).addClass('panelcollapsed');
    }
}

function ClosePRunningInformationTab() {
    var pPricediv = $("#divPPriceContainer").find('.CollapsiblePanel');
    if (pPricediv != 'undefined' && pPricediv.length > 0) {
        $(pPricediv).removeClass();
        $(pPricediv).addClass('panelcollapsed');
    }
}


/***********************************************************************************************************
METHODS RELATED RIGHT PANEL (RUNNING INFORMATION)
************************************************************************************************************/
function InitializeRunningInformationOpenCloseAction() {
    var width = $(window).width(), height = $(window).height();
    $(".PanelClosed").click(function (event) {
        $(".right_top_section").hide();
        RightPanelOpenClosed();
        $("#runningInfoContainer").removeClass();
        $("#runningInfoContainer").addClass("FixedPositionRight");
        $("#orderCreationSteps").removeClass();
        $("#orderCreationSteps").addClass("col-xs-12 col-md-12 col-lg-12 col-sm-12");

        $("#topOrderContainer").removeClass();
        $("#topOrderContainer").addClass("col-xs-12 col-sm-12 col-md-12 col-lg-12 topOrderContainerClass");

        if ($("ul.fixedBottomWidth").length > 0) {
            $("ul.fixedBottomWidth").removeClass("fixedBottomWidthCollapsed");
            $("ul.fixedBottomWidth").addClass("fixedBottomWidthExpanded");
        }

        if ($("ul.fixedBottomUlWidth").length > 0 || $("div.fixedBottomDivWidth").length > 0) {
            if ($("ul.fixedBottomUlWidth").length > 0 && $("div.fixedBottomDivWidth").length > 0) {
                $("ul.fixedBottomUlWidth").removeClass("fixedBottomWidthHalfCollapsed");
                $("ul.fixedBottomUlWidth").addClass("fixedBottomWidthHalfExpanded");
                $("div.fixedBottomDivWidth").removeClass("fixedBottomWidthHalfCollapsed");
                $("div.fixedBottomDivWidth").addClass("fixedBottomWidthHalfExpanded");
            } else {
                if ($("ul.fixedBottomUlWidth").length > 0) {
                    $("ul.fixedBottomUlWidth").removeClass("fixedBottomWidthCollapsed");
                    $("ul.fixedBottomUlWidth").addClass("fixedBottomWidthExpanded");
                }
                else if ($("div.fixedBottomDivWidth").length > 0) {
                    $("div.fixedBottomDivWidth").removeClass("fixedBottomWidthCollapsed");
                    $("div.fixedBottomDivWidth").addClass("fixedBottomWidthExpanded");
                }
            }
            $("div.fixedBottomDivWidth").removeClass("fixedBottomDivRight");
            $("div.fixedBottomDivWidth").addClass("fixedBottomDivRight3");
        }
        RunningInfoPannelOpenClose();
    });

    $(".PanelOpen").click(function (event) {
        $(window).scrollTop(0);
        $("#runningInfoContainer").addClass("col-xs-12 col-sm-12 col-md-3 col-lg-3");
        $(".right_top_section").show();
        RightPanelOpenClosed();
        AdjustRunningInformationHeight();
        $("#orderCreationSteps").removeClass();
        $("#orderCreationSteps").addClass("col-xs-12 col-sm-12 col-md-9 col-lg-9");

        $("#topOrderContainer").removeClass();
        $("#topOrderContainer").addClass("col-xs-12 col-sm-12 col-md-9 col-lg-9");



        if ($("ul.fixedBottomWidth").length > 0) {
            $("ul.fixedBottomWidth").removeClass("fixedBottomWidthExpanded");
            $("ul.fixedBottomWidth").addClass("fixedBottomWidthCollapsed");
        }
        if ($("ul.fixedBottomUlWidth").length > 0 || $("div.fixedBottomDivWidth").length > 0) {
            if ($("ul.fixedBottomUlWidth").length > 0 && $("div.fixedBottomDivWidth").length > 0) {
                $("ul.fixedBottomUlWidth").removeClass("fixedBottomWidthHalfExpanded");
                $("ul.fixedBottomUlWidth").addClass("fixedBottomWidthHalfCollapsed");
                $("div.fixedBottomDivWidth").removeClass("fixedBottomWidthHalfExpanded");
                $("div.fixedBottomDivWidth").addClass("fixedBottomWidthHalfCollapsed");
            } else {
                if ($("ul.fixedBottomUlWidth").length > 0) {
                    $("ul.fixedBottomUlWidth").removeClass("fixedBottomWidthExpanded");
                    $("ul.fixedBottomUlWidth").addClass("fixedBottomWidthCollapsed");
                }
                else if ($("div.fixedBottomDivWidth").length > 0) {
                    $("div.fixedBottomDivWidth").removeClass("fixedBottomWidthExpanded");
                    $("div.fixedBottomDivWidth").addClass("fixedBottomWidthCollapsed");
                }
            }
            $("div.fixedBottomDivWidth").removeClass("fixedBottomDivRight3");
            $("div.fixedBottomDivWidth").addClass("fixedBottomDivRight");
        }
        RunningInfoPannelOpenClose();
    });
    RunningInfoPannelOpenClose();

    if (width <= 990) {
        $(".right_top_section").hide();

    }

}

function RightPanelOpenClosed() {


    if ($(".right_top_section").is(":visible")) {
        $(".ShopOrderPanelContainer_expand").removeClass("ShopOrderPanelContainer_expand");
        $("#TabbedPanel").removeClass("tabContainer_expand");
        $(".PanelOpen").hide();

    }
    else {
        $(".PanelOpen").show();
        $("#TabbedPanel").addClass("tabContainer_expand");
        $("#suitcount").addClass("suitcount");
        $(".ShopOrderPanelContainer").addClass("ShopOrderPanelContainer_expand");
    }

}

/***********************************************************************************************************
METHODS RELATED TO WIZARD STEP INFO POPUP
************************************************************************************************************/
function InitializeWizardStepInfoPopup() {
    $(".StepInfo").click(function (event) {
        $(".StepinfoBox").slideToggle();
        event.stopPropagation();
    });
}


/***********************************************************************************************************
INITIALIZE SCROLL BARS
************************************************************************************************************/
function InitializeScrollBars() {
    //$('.section1').alternateScroll();
    //$('.TabbedPanelsContentGroup').alternateScroll();
    //$('.panel').alternateScroll();
    //$('.PPriceContainer').alternateScroll();
}


/***********************************************************************************************************
METHODS RELATED UPDATING THE HTML FOR "ITEM DETAILS"
************************************************************************************************************/
function UpdateItemDetailsHTML() {
    if (ItemDetails != null && ItemDetails.Items != null && ItemDetails.Items.length > 0) {
        $("#divItemDetailMContainer").html("");
        $("#ItemDetailsTemplate").tmpl(ItemDetails).appendTo($("#divItemDetailMContainer"));
        //        InitializeShowItemDetailsCloseAction();
        //$('#shwItemDetailsContainer').alternateScroll();
    }
}

function DefaultItemDetailsHTML() {
    var itemDetails = { Items: null };
    $("#divShowItemDetails").html("");
    $("#ItemDetailsTemplate").tmpl(itemDetails).appendTo($("#divShowItemDetails"));
    $('#shwItemDetailsContainer').alternateScroll();
}
/***********************************************************************************************************
METHODS RELATED UPDATING REMARKS IN RUNNING INFO
************************************************************************************************************/
function RefreshRemarksInRunningInfo(ctrl) {
    var ctl = $(ctrl).data("ctl");
    var itemNumber = $(ctrl).attr("id").split("_")[1];
    var remarksInput = (ctl == "remarks") ? $(ctrl) : $("#Remarks_" + itemNumber);
    var internalCheckbox = (ctl == "isinternal") ? $(ctrl) : $("#IsInternalRemarks_" + itemNumber);
    //Prepare the request data
    var requestData =
    {
        ElementType: ELEMENT_TYPE_REMARKS,
        ItemNumber: itemNumber,
        Remarks: $(remarksInput).val(),
        IsInternalRemarks: $(internalCheckbox).is(":checked")
    };

    $.ajax({
        url: "/CustomOrder/RefreshRunningInformation",
        type: "GET",
        data: requestData,
        global: false,
        async: true,
        success: function (data) { }
    });
}

/***********************************************************************************************************
METHODS RELATED TO ADJUSTING HEIGHTS OF VARIOUS SCREENS
************************************************************************************************************/

function AdjustRunningInformationHeight() {
    //var HEADER_HEIGHT = 155;
    //var height = $(window).height() - (HEADER_HEIGHT + 5 + 30);


    //$(".right_top_section").height(height - 30);
    //$(".PanelOpen").height(height - 30);


    ////Adjuest the caution message section
    //var SPACE_BETWEEN_SECTIONS = 0;
    //var topSectionHeight = ((height - SPACE_BETWEEN_SECTIONS) / (2.5));
    //var bottomSectionHeight = (height - SPACE_BETWEEN_SECTIONS - topSectionHeight);
    //$("#divMainCautionMessageContainer").height(topSectionHeight - 55 - 27);

    ////PPrice & RPrice tabs
    //$(".section2 .panel-container").height(bottomSectionHeight - 50);
    //$(".section2 .PPriceContainer_wrapper").height(bottomSectionHeight - 50);
    //var ht = bottomSectionHeight - 35 - 50;
    //$(".section2 .PPriceContainer").height(ht);
    //$('.section2 .PPriceContainer').alternateScroll();

    ////Finished measurement tab
    //$(".section2 .PanelContainerScroll").height(bottomSectionHeight - 60);
    //$(".section2 .PanelContainerScroll").alternateScroll();

    ////Shipment tab
    //$("#shippment_wrapper").height(bottomSectionHeight - 50);
    //AdjustShippmentInfoRowHeight();
    //$("#shippment_item_table_wrapper").alternateScroll();

    ////Item Detail Tab
    //$(".section2 .itemDetailContainer").height(bottomSectionHeight - 50);
    //$(".section2 .itemDetailContainer").alternateScroll();
}

function AdjustPIHeight() {
    var HEADER_HEIGHT = 155;
    var BOTTOM_FACTOR = 10 + 20;
    var MISC = 32;
    var height = $(window).height() - (HEADER_HEIGHT + MISC + BOTTOM_FACTOR);
    $(".panel").height(height);
}

function AdjustFitTryonHeight() {

}

function AdjustFittoolHeight() {

}

function AdjustDOHeight() {

}

function AdjustBOHeight() {

}

function AdjustOrderSummaryHeight() {
    //var HEADER_HEIGHT = 155;
    //var BOTTOM_FACTOR = 10 + 20;
    //var MISC = 32;
    //var subHeaderHeight = $("#subhdr").height();
    //var height = $(window).height() - (HEADER_HEIGHT + MISC + BOTTOM_FACTOR);
    //$(".panel").height(height);
    //$(".leftsectionTabbedPanleContainer ").height(height - 45 - subHeaderHeight);
}

function AdjustFinalizeHeight() {

}

/***********************************************************************************************************
OTHER METHODS
************************************************************************************************************/

function OnTabSwitch() {
    RunningInformation = $.stringify($("#HDData1").val());
    $("#divShipmentContainer").html("");
    render1(RunningInformation.ShipmentInfo);
    RefreshCautionMessageHtml();
    alert("OnTabSwitch");
}

var render1 = function (model) {
    $("#ShipmentTemplate").tmpl(model).appendTo($("#divShipmentContainer"));
    $("#divShipmentContainer").removeClass("alternate-scroll");

    setUpPanels();
};

function OnElementChange() {
    response = $.parse($("#HDData2").val());
    alert("OnElementChange");
}

function Debug(data) {
    //GetResourceText("Fabric", "Fabric:");
}

function SaveCustomOrder() {
    var customOrderName = prompt("Please give a name for custom order.");
    $.ajax(
        {
            type: "GET",
            url: "/CustomOrder/SaveCustomOrder",
            data: { name: customOrderName },
            success: function (data) {
                if (data != null)
                    alert("Custom order saved successfully");
            }
        });
}

function MakeFormAjax() {
    var options = { dataType: "json" };
    $("#ImportForm").ajaxForm(options);
}


function OnBodyMeasurementCalculatorApply(SaveBMStatus) {
    $.ajax(
        {
            type: "GET",
            dataType: "json",
            data: { saveBMStatus: SaveBMStatus },
            url: "/CustomOrder/ApplyBodymeasurementCalculatedValues",
            success: function (resultData) {
                if (resultData != null && resultData.Status == true) {
                    $("#divOrderCreationMainPanel").html(resultData.MessageHtml);
                    GetTabNameAndCounter(false, false);
                    expandAllInContainer("OFitTools");
                }
            }
        });
}

function RedirectToOrderOverview() {
    location.href = "/CustomOrderOverview";
}

function RedirectToCustomerOrders(customerId) {
    location.href = "/Customer/GetCustomerDetail?customerID=" + customerId;
}
function RedirectToNewOrders() {
    location.href = "/CustomOrder/CreateOrderForSameCustomer";
}



function FinalSubmitDraftOrder(tabName) {

    $("#divIsSendMailToAm").dialog({
        width: 300,
        height: 250,
        title: GetResourceText("DRAFT_ORDER", "Draft order"),
        resizable: false,
        modal: true,
        buttons: [
            {
                text: GetResourceText("OK", "Ok"),
                click: function () {
                    $("#IsSendMailToAM").val(true);
                    $("#divIsSendMailToAm").dialog('close');
                    SubmitDraft(tabName);

                }
            },
            {
                text: GetResourceText("NO", "No"),
                click: function () {
                    $("#IsSendMailToAM").val(false);
                    SubmitDraft(tabName);
                    $("#divIsSendMailToAm").dialog('close');
                }
            }],
        close: function (event, ui) {
            //$("#divCustomorderSummaryChk").dialog('close');
        }
    });
}

function SubmitDraft(tabName) {
    if (tabName === "DesignOption" || tabName === "BrandingOption" || tabName === "FitTools" || tabName === "Finalize") {
        DraftOrderSubmit(tabName, true);
    } else {
        DraftSubmit();
    }
}

function SubmitDraftOrder(tabName, isBmOrderCreation) {

    $("#DraftName").dialog({
        width: 300,
        height: 250,
        title: GetResourceText("DRAFT_ORDER", "Draft order"),
        resizable: false,
        modal: true,
        buttons: [
            {
                text: GetResourceText("OK", "Ok"),
                click: function () {
                    if (ValidatDraftNames()) {
                        if (isBmOrderCreation == 'True') {
                            FinalSubmitDraftOrder(tabName, isBmOrderCreation);
                        } else {
                            if (tabName === "DesignOption" || tabName === "BrandingOption" || tabName === "FitTools" || tabName === "Finalize") {
                                DraftOrderSubmit(tabName, false);
                            } else {
                                DraftSubmit();
                            }
                        }
                    }
                }
            },
            {
                text: GetResourceText("CANCEL", "Cancel"),
                click: function () {
                    $("#DraftName").dialog('close');
                }
            }],
        close: function (event, ui) {
            //$("#divCustomorderSummaryChk").dialog('close');
        }
    });


}


function ValidatDraftNames() {
    var result = true;
    var orderNames = $("#DraftName").find("input[id^=textDraftName]");
    var errMsg = new Array();
    var valueArray = new Array();
    for (var i = 0; i < orderNames.length; i++) {
        var id = orderNames[i].id;
        var value = $("#" + id).val();
        if (value.length > 0) {
            valueArray.push(value);
        } else {
            var itemNumber = i + 1;
            errMsg.push(GetResourceText("ERROR_DRAFT_NAME", "Please enter draft order name " + itemNumber));
        }
    }

    var duplicateItems = [];
    var flag = 0;
    for (var i = 0; i < valueArray.length - 1; i++) {
        if (valueArray[i + 1] == valueArray[i]) {
            duplicateItems.push(valueArray[i]);
            flag = 1;
        }
    }
    if (flag == 1) {
        errMsg.push(GetResourceText("UNIQUE_NAME_MESSGE", "Please enter unique name"));
    }
    if (errMsg.length > 0) {
        ShowErrorDialogForMessages(GetResourceText("ERROR_MESSAGES"), errMsg, null, null);
        result = false;
    }
    return result;
}

function DraftOrderSubmit(tabName) {

    var productID = -1;
    if (tabName === "FitTools") {
        var activeTab = $("#ActiveProductTab").val();
        productID = activeTab.replace("ProductPartName", "");
    }

    var options = {
        url: "/CustomOrder/UpdateOrderForDraft",
        data: { tabName: tabName, activeProductID: productID },
        dataType: "json",
        success: function (data) {

            if (data.AcceptChangeProfile) {
                OpenProfileChangeDialog(data, DraftSubmit, null);
            } else {
                DraftSubmit();
            }
        }
    };

    if (tabName === "DesignOption") {
        var activeTab = $("#ActiveProductTab").val();
        $("#Form" + activeTab).ajaxForm(options);
        $("#Form" + activeTab).submit();
    }
    if (tabName === "BrandingOption") {
        $("#BrandingOptionForm").ajaxForm(options);
        $("#BrandingOptionForm").submit();
    }

    if (tabName === "FitTools") {

        $("#frmFitTools").ajaxForm(options);
        $("#frmFitTools").submit();
    }
    if (tabName === "Finalize") {

        $("#FinalizeForm").ajaxForm(options);
        $("#FinalizeForm").submit();
    }
}


function DraftSubmit() {
    var options = {
        type: "POST",
        dataType: "json",
        url: "/CustomOrder/SaveDraftOrder",
        success: OnDraftOrderSuccess
    };

    $("#DraftForm").ajaxForm(options);
    $("#DraftForm").submit();
}

function OnDraftOrderSuccess(resultData) {
    if (resultData.Status == true) {
        $("#IsSendMailToAM").val(false);
        $("#DraftOrderFinalMessage").dialog({
            closeOnEscape: false,
            minWidth: 402,
            width: "auto",
            height: 400,
            autoOpen: false,
            modal: true,
            resizable: false,
            open: function (event, ui) {
                $(".ui-dialog-titlebar-close").hide();
            }
        });

        $("#DraftOrderFinalMessage").html(resultData.MessageHtml);
        $("#DraftOrderFinalMessage").dialog("open");
    }
}

function RedirectToDraftOrders() {
    location.href = "/DraftOrder";
}

function RecalculateOrientationChange() {

    if (isMobilePhoneDevice) {
        $(".right_top_section").hide();
        $(".PanelOpen").show();
    }

}

function RecalculateResize() {

    GetOrientationDirection();

    if ($(".right_top_section").is(":visible")) {
        $("#runningInfoContainer").addClass("col-xs-12 col-sm-12 col-md-3 col-lg-3 ");
        $(".right_top_section").show();
        RightPanelOpenClosed();
        AdjustRunningInformationHeight();

        $("#topOrderContainer").removeClass();
        $("#topOrderContainer").addClass("col-xs-12 col-sm-12 col-md-9 col-lg-9");

        $("#orderCreationSteps").removeClass();
        $("#orderCreationSteps").addClass("col-xs-12 col-sm-12 col-md-9 col-lg-9");

        if ($("ul.fixedBottomWidth").length > 0) {
            $("ul.fixedBottomWidth").removeClass("fixedBottomWidthExpanded");
            $("ul.fixedBottomWidth").addClass("fixedBottomWidthCollapsed");
        }
        if ($("ul.fixedBottomUlWidth").length > 0 || $("div.fixedBottomDivWidth").length > 0) {
            if ($("ul.fixedBottomUlWidth").length > 0 && $("div.fixedBottomDivWidth").length > 0) {
                $("ul.fixedBottomUlWidth").removeClass("fixedBottomWidthHalfExpanded");
                $("ul.fixedBottomUlWidth").addClass("fixedBottomWidthHalfCollapsed");
                $("div.fixedBottomDivWidth").removeClass("fixedBottomWidthHalfExpanded");
                $("div.fixedBottomDivWidth").addClass("fixedBottomWidthHalfCollapsed");
            } else {
                if ($("ul.fixedBottomUlWidth").length > 0) {
                    $("ul.fixedBottomUlWidth").removeClass("fixedBottomWidthExpanded");
                    $("ul.fixedBottomUlWidth").addClass("fixedBottomWidthCollapsed");
                }
                else if ($("div.fixedBottomDivWidth").length > 0) {
                    $("div.fixedBottomDivWidth").removeClass("fixedBottomWidthExpanded");
                    $("div.fixedBottomDivWidth").addClass("fixedBottomWidthCollapsed");
                }
            }
            $("div.fixedBottomDivWidth").removeClass("fixedBottomDivRight3");
            $("div.fixedBottomDivWidth").addClass("fixedBottomDivRight");
        }

        RunningInfoPannelOpenClose();

    } else {
        $(".right_top_section").hide();
        RightPanelOpenClosed();
        $("#runningInfoContainer").removeClass();
        $("#runningInfoContainer").addClass("FixedPositionRight");

        $("#topOrderContainer").removeClass();
        $("#topOrderContainer").addClass("col-xs-12 col-sm-12 col-md-12 col-lg-12 topOrderContainerClass");

        $("#orderCreationSteps").removeClass();
        $("#orderCreationSteps").addClass("col-xs-12 col-md-12 col-lg-12 col-sm-12");

        if ($("ul.fixedBottomWidth").length > 0) {
            $("ul.fixedBottomWidth").removeClass("fixedBottomWidthCollapsed");
            $("ul.fixedBottomWidth").addClass("fixedBottomWidthExpanded");
        }

        if ($("ul.fixedBottomUlWidth").length > 0 || $("div.fixedBottomDivWidth").length > 0) {
            if ($("ul.fixedBottomUlWidth").length > 0 && $("div.fixedBottomDivWidth").length > 0) {
                $("ul.fixedBottomUlWidth").removeClass("fixedBottomWidthHalfCollapsed");
                $("ul.fixedBottomUlWidth").addClass("fixedBottomWidthHalfExpanded");
                $("div.fixedBottomDivWidth").removeClass("fixedBottomWidthHalfCollapsed");
                $("div.fixedBottomDivWidth").addClass("fixedBottomWidthHalfExpanded");
            } else {
                if ($("ul.fixedBottomUlWidth").length > 0) {
                    $("ul.fixedBottomUlWidth").removeClass("fixedBottomWidthCollapsed");
                    $("ul.fixedBottomUlWidth").addClass("fixedBottomWidthExpanded");
                }
                else if ($("div.fixedBottomDivWidth").length > 0) {
                    $("div.fixedBottomDivWidth").removeClass("fixedBottomWidthCollapsed");
                    $("div.fixedBottomDivWidth").addClass("fixedBottomWidthExpanded");
                }
            }
            $("div.fixedBottomDivWidth").removeClass("fixedBottomDivRight");
            $("div.fixedBottomDivWidth").addClass("fixedBottomDivRight3");
        }

        RunningInfoPannelOpenClose();
    }



}




function RunningInfoPannelOpenClose() {
    if ($(".right_top_section").is(":visible")) {
        $("#OrderContainerWrapper").css("padding-right", "0px");

    } else {
        $("#OrderContainerWrapper").css("padding-right", "15px");
    }
}



function GoToFinalizedElementUpdateToFalse() {
    var orderCopyEachComponent = $("#OrderCopyEachComponent").val();
    if (orderCopyEachComponent != null && orderCopyEachComponent != undefined && orderCopyEachComponent.toLowerCase() == 'true') {
        $("#OrderCopyEachComponent").val(false);
        finalStepToLoad = 0;
    }
}

function OnFullViewClick(fitToolId) {
    $("#modalZoomInOut_" + fitToolId).toggleClass("fa-compress fa-arrows-alt");
    $("#modalZoomInOut_" + fitToolId).closest(".fitToolImageViewer").toggleClass("fullView");

}

function OnDOFullViewClick(doId) {
    $("#modalZoomInOut_" + doId).toggleClass("fa-compress fa-arrows-alt");
    $("#modalZoomInOut_" + doId).closest(".doImageViewer").toggleClass("fullView");

}

function OnClickCloseModal(element) {
    $(element).closest(".modal").modal("hide");
}


function BindLeftRightKeyEventsOnModal() {
    $(".fitToolImageModal").on("shown.bs.modal", function () {
        $(document).keydown(CarousalNavBinder);
        BindFitToolModalOpenFullView();
    });
    $(".fitToolImageModal").on("hidden.bs.modal", function () {
        $(document).unbind('keydown', CarousalNavBinder);
    });
}

var CarousalNavBinder = function (e) {
    switch (e.which) {
        case 37:
            $(".fitToolImageModal.in").find(".carousel-control.left").click();
            break;
        case 39:
            $(".fitToolImageModal.in").find(".carousel-control.right").click();
            break;
        default: return;
    }
}

function AdjustRunningInfoSectionHeight() {
    var divHeight = window.innerHeight - $("#DIVMenu .navbar").height() - $("#MainBodyContainer .custInfo").height() - 15;
    $(".divFixedScroll").height(divHeight);
}

function AssignStepsToHideAccordingToCombination() {
    hideFitAndTryOn = parseBool($("#HideFitAndTryOn").val());
    hideFitTools = parseBool($("#HideFitTools").val());
    hideMake = parseBool($("#HideMake").val());
    hideButton = parseBool($("#HideButton").val());

    numberOfStepsToSkip = 0;

    if (hideFitAndTryOn)
        numberOfStepsToSkip += 1;
    if (hideFitTools)
        numberOfStepsToSkip += 1;

}


function RefreshStepsAccordingToSelectedCombination() {
    var currentStep = step;
    var numberOfSteps = TOTAL_STEP;

    if (hideFitAndTryOn) {
        numberOfSteps -= 1;
        $("#liFitAndTryOn").hide();
    } else {
        $("#liFitAndTryOn").show();
    }

    if (hideFitTools) {
        numberOfSteps -= 1;
        $("#liFitTool").hide();
    } else {
        $("#liFitTool").show();
    }

    var stepText = String.format(GetResourceText("STEPS", "Step {0}/{1}"), currentStep, numberOfSteps);
    $("#stepCounter").html(stepText);


}


function IsTestGarmentAvailable(sppId, quantity) {
    /// Validate and restrict Test garment spp with Multiple order quantity
    var testGarmentJacketSppId = $("#JacketSppIdForTestGarment").val();
    var testGarmentTrousersSppId = $("#TrouserSppIdForTestGarment").val();
    
    var result = false;

    if (quantity > 1) {
        for (var i = 1; i < quantity; i++) {
            var sppDivId = "#tdOrderSpp" + i;

            $(sppDivId).find("select[id*=Spp_]").each(function () {
                var selectedSppId = parseInt($(this).val());
                if (selectedSppId == testGarmentJacketSppId || selectedSppId == testGarmentTrousersSppId) {
                    $("#ddQuantities").val(1)
                    result = true;
                }
            });
        }
    }
    else {
        var quantity = parseInt($("#ddQuantities").val());
        if (quantity > 1) {
            if (sppId == testGarmentJacketSppId || sppId == testGarmentTrousersSppId) {
                result = true;
            }
            else {
                for (var i = 0; i < quantity; i++) {
                    var sppDivId = "#tdOrderSpp" + (i + 1);
                    $(sppDivId).find("select[id*=Spp_]").each(function () {
                        var selectedSppId = parseInt($(this).val());
                        if (selectedSppId == testGarmentJacketSppId || selectedSppId == testGarmentTrousersSppId) {
                            result = true;
                        }
                    });
                }
            }
        }
    }

    return result;
}

function ShowTestGarmentErrorBox(element, isResetSpp) {
    ShowErrorDialog(GetResourceText("ERROR_MESSAGES", "Error"),
        GetResourceText("ERROR_TEST_GARMENT_MULTIPLEORDER", "It is not possible to create multiple orders for the model 'Test jacket' and 'Test trouser'."),
        null, function () {
            if (isResetSpp) {
                $(element).val(-1);
                LoadMunroDropDowns();
            }
        });
}

function IsTestGarmentSelected() {
    var testGarmentJacketSppId = $("#JacketSppIdForTestGarment").val();
    var testGarmentTrousersSppId = $("#TrouserSppIdForTestGarment").val();

    var result = false;
    var sppDivId = "#tdOrderSpp" + 1;

    $(sppDivId).find("select[id*=Spp_]").each(function () {
        var selectedSppId = parseInt($(this).val());
        if (selectedSppId == testGarmentJacketSppId || selectedSppId == testGarmentTrousersSppId) {
            $("#ddQuantities").val(1)
            result = true;
        }
    });

    return result;
}
