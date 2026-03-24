/*!
* This file contains functions related to "Fit Tools" step
* of the order creation wizard.
*/


function InitializeFitToolTab() {
   
    $('#TabbedPanel').easytabs({ updateHash: false });
    $('#TabbedPanel').bind('easytabs:before', ValidateProductFits);

    var frm = $("#frmFitTools");

    $("input:radio[name=ProfileAction]").click(FitToolChangeAction);

    $('#TabbedPanel').bind('easytabs:after', AfterEasyTabLoaded);
    SetTabStatus();
    BindFitToolModalOpenFullView();
}


function AfterEasyTabLoaded() {
    
    ToggleExpandCollapseAllLabelOnPageLoad("CollapsibleHeight");
    DisableEnableCalculatorButton();
}

function DisableEnableCalculatorButton() {
    
    $("#btnLaunchCalculator").hide();
    var activeTab = $("#ActiveProductTab").val();
    var productID = activeTab.replace("ProductPartName", "");
    if ($("#CalcLaunchURL" + productID).length > 0) {
        $("#btnLaunchCalculator").show();
    }
}


function FitToolChangeAction() {
    var value = $(this).val();

    if (value == "SaveNew") {
        $("#ProfileName").show();
        $("#OverwriteProfileName").hide();
    } else {
        $("#ProfileName").hide();
        $("#OverwriteProfileName").show();
    }
}

function FitToolChanged(fitToolID, id) {
    var fitToolValue = $("#" + id).val();
    var fitToolText = $("#" + id + " option:selected").text();
    var productPartID = $("#ProfileProductPart").val();
    var hiddenField = id.replace("_DefaultValue", "_FitToolText");
    $("#" + hiddenField).val(fitToolText);
    OnFitToolSelectionChange(fitToolID, fitToolValue, productPartID, CUSTOM_ORDER);
}

function BodyMeasurmentChangeForBm(bodyMeasurmentId, id) {
    var measurementValue = $("#" + id).val();
    var productPartId = $("#ProfileProductPart").val();
    OnBodyMeasurementSelectionChange(bodyMeasurmentId, measurementValue, productPartId, CUSTOM_ORDER);
}

function GarmentMeasurmentChangeForBm(measurementId, id) {
    var measurementValue = $("#" + id).val();
    var productPartId = $("#ProfileProductPart").val();
    OnGarmentMeasurementSelectionChange(measurementId, measurementValue, productPartId, CUSTOM_ORDER);
}


function FitToolDOVChanged(designOptionId, valueDropdownId) {
    var dovId = $("#" + valueDropdownId).val();
    var dovText = $("#" + valueDropdownId + " option:selected").text();
    var productPartID = $("#ProfileProductPart").val();
    productPartID = productPartID.replace("ProductPartName", "");
    OnFiToolDOVSelectionChanged(designOptionId, dovId, productPartID, CUSTOM_ORDER);
}
function ValidateProductFits(e, tab, panel) {
    var newTabID = panel[0].id;
    SetIsVisitedStatus(newTabID);
    submitFitTools({ checkValidation: true, wizardNextStep: false }, SwitchTab, { tabControl: "TabbedPanel", newTabName: newTabID, callBack: ValidateProductFits, AfterSwitch: SetTabStatus, next: true   });
    return false;
}

function ApplyLevelColors() {
    $("span[aria-labelledby^='select2-']").each(function (index, element) {

        var attrValue = $(element).attr("aria-labelledby");
        attrValue = attrValue.replace("select2-", "");
        attrValue = attrValue.replace("DefaultValue-container", "LevelColorCode");
        var colorCode = $("#" + attrValue).val();
        $(element).css("border-color", colorCode);
        var spanImageAvaliable = $(element).find("span[role='presentation']");
        if (spanImageAvaliable) {
            $(spanImageAvaliable).css("border-color", colorCode);
        }
    });
}

function HideShowFitToolsOrderCreation(status, productPartId) {
    ChangeShowLevelElement(status, productPartId);
    HideShowInternalFittolsOrderCreation(status, productPartId);
}

function ChangeShowLevelElement(status, propuctPartID) {
    var spanElement = $("#LevelSettingChk_" + propuctPartID);
    if (spanElement) {
        if (status) {
            var showAvailableText = GetResourceText("SHOW_AVAILABLE_LEVELS", "show available levels");
            $(spanElement).find("strong").text(showAvailableText);
            $(spanElement).prop("title", showAvailableText);
            $(spanElement).data("status", "false");
        } else {
            var showAllText = GetResourceText("SHOW_ALL_LEVELS", "show all levels");
            $(spanElement).find("strong").text(showAllText);
            $(spanElement).prop("title", showAllText);
            $(spanElement).data("status", "true");
        }
    }
}

function HideShowInternalFittolsOrderCreation(status, productPartId) {
    if (status) {
        $("span[class*='select2-container--disabled']")
            .each(function (index, elmt) {
                $(elmt).show();
                $(elmt).closest('div[class^="row"]').show();
            });
    } else {
        $("span[class*='select2-container--disabled']")
           .each(function (index, elmt) {
               $(elmt).hide();
               $(elmt).closest('div[class^="row"]').hide();
           });
    }

    if (productPartId && productPartId >= 0) {
        $("input[id^='SelectedPartLevelSetting_" + productPartId + "']")
            .each(function(index, elmt) {
                $(elmt).val(status);
            });
    } else {
        $("input[id*='SelectedPartLevelSetting_']")
            .each(function (index, elmt) {
                $(elmt).val(status);
            });
    }
}

function LoadValueToHiddenField() {
    var fittoolContainerDiv = $("#divFitToolContainer");
    $("select", fittoolContainerDiv).each(function (index, element) {
        var did = $(element).attr("id");
        if (did.endsWith("_DefaultValue")) {
            var text = $("#" + did + " option:selected").text();
            var hiddenFiled = did.replace("_DefaultValue", "_FitToolText");
            $("#" + hiddenFiled).val(text);
        }

    });
}
function CheckRequiredOptions(activeProductPartTab) {

    var activeTab = activeProductPartTab;
    var designOptions = $("#" + activeTab).find("select.fitToolDovRequired");
    if (designOptions.length == 0)
        return true;
    var messages = new Array();
    for (var i = 0; i < designOptions.length; i++) {
        if ($(designOptions[i]).val() == -1 || $.trim($(designOptions[i]).val().toString()).length == 0) {
            messages.push(String.format(GetResourceText("FITTOOL_DESIGNOPTION_REQUIRED", "{0} is required"), $(designOptions[i]).data("doname")));
            // $(designOptions[i]).addClass("ErrorControl");
            addErrorClass(designOptions[i], 1);
        } else {
            removeErrorClass(designOptions[i], 1);
            //$(designOptions[i]).removeClass("ErrorControl");
        }
    }
    if (messages.length > 0) {
        var prductPartName = $("input[type=hidden][id$='ProductPart_Name']").val();
        ShowErrorDialogForMessages(String.format(GetResourceText("FITTOOL_DESIGNOPTION_REQUIRED_HEADER", "FitTools to be selected for {0}"), prductPartName), messages, null, null);
        return false;
    }
    return true;
}


function submitFitTools(postData, func, param) {
   
    var validated = true;
    LoadValueToHiddenField();
    if (postData.checkValidation) {
        validated = CheckRequiredOptions($("#ActiveProductTab").val());
    }

    //Do validation for all tabs of current quantity. It is not called in case of tab switch
    var notVisitedTabs = new Array();
    if (validated && postData.checkValidation && postData.wizardNextStep) {
        //Validation for all tabs visited
        var forms = $("#OFitTools").find("div[id^='ProductPartName']");
        if (forms && forms != 'undefined') {
            for (var i = 0; i < forms.length; i++) {
                var tabValidated = $("#" + forms[i].id).find("input[id^='isVisited_']").val().toString().toLowerCase();
                var areAllTabsValidated = CheckRequiredOptions(forms[i].id);
                if (tabValidated == "false" || !areAllTabsValidated) {
                    var productID = forms[i].id.replace("Form", "");
                    var tabName = $("a[href^='#" + productID + "']").first().text().trim();
                    notVisitedTabs.push(tabName);
                }
            }
        }
    }
    if (notVisitedTabs.length != 0) {
        ShowErrorDialogForMessages(String.format(GetResourceText("FITTOOL_TAB_NOTVISITED_TITLE", "FitTool of parts to be selected: ")), notVisitedTabs, null, null);
        validated = false;
    }
    if (validated) {
        var activeTab = $("#ActiveProductTab").val();
        var productID = activeTab.replace("ProductPartName", "");
        var data = { activeProductID: productID };
        postData = $.extend(postData, data);
        var options = {
            data: postData,
            dataType: "json",
            success: function (testdata) {
                if (testdata != null) {
                    if (testdata.Status == false)
                        ShowErrorDialog("", testdata.MessageHtml, null, null);
                    else if (testdata.ValidationType == IMPOSSIBLE_VALIDATION_TYPE_WARNINGS) {
                        ShowConfirmationDialog("", testdata.WarningHtml, function () {
                            OpenProfileChangeDialog(testdata, func, param);
                        }, null, null);
                    } else {
                        OpenProfileChangeDialog(testdata, func, param);
                        if (testdata.RunningInformation && testdata.RunningInformation != null && testdata.RunningInformation != "")
                            updateDefaultRunningInformation($.parseJSON(testdata.RunningInformation));
                    }
                }
            }
        };
        $("#frmFitTools").ajaxForm(options);
        $("#frmFitTools").submit();
    }

}

function OpenProfileChangeDialog(testdata, func, param) {
 
    $("#OverwriteProfileName").val(testdata.ProfileName);
    if (testdata.AcceptChangeProfile && param.next) {
        ShowProfileChangeDialog({
            modal: true,
            width: 500,
            height: 350,
            resizable: false,
            buttons: [
                {
                    text: GetResourceText("OK", "Ok"),
                    click: function () {
                        profileChange(func, param, testdata);
                    }
                },
                {
                    text: GetResourceText("CANCEL", "Cancel"),
                    click: function () {
                        $("#FitToolChange").dialog('close');
                        //$(this).closest("div").dialog("close");
                    }
                }],
            closeOnEscape: true
        });
    } else
        func(param, testdata);

}

function ShowProfileChangeDialog(dialogOptions) {

    // Clear the previously provided (if any) profile name before displaying the dialog
    $("#ProfileName").val($("#OverwriteProfileName").val());
    $("#ProfileName").hide();

    $('input[name=ProfileAction][value=Overwrite]').prop('checked', true);
    $("#OverwriteProfileName").attr("readonly", true);
    $("#OverwriteProfileName").show();

    // Launch the FitTool values changed dialog
    $("#FitToolChange").dialog(dialogOptions);
}

function SetTabStatus() {
 
    var activeTab = $("#ActiveProductTab").val();
    $("#ProfileProductPart").val($("#" + activeTab + "_ID").val());
    $("#ProductPartName").html($("#" + activeTab + "_NAME").val());
    $("#ProductPartTryOnSize").html($("#" + activeTab + "_TRYONSIZE").val());
    SelectedMeasurementTab();

    var spanName = "VisitedIndicator" + activeTab.replace("ProductPartName", "");

    $("div[id*='divLevelName_']").each(function (index, element) {
        $(element).hide();
    });
   
    var adviseIcons = $("#divFitToolContainer").find('button[id^=adviseButton_]');
    if (adviseIcons) {
        $(adviseIcons).hide();
        if (activeTab.toLowerCase() === 'productpartname2') {
            $(adviseIcons).show();
        }
        if (activeTab.toLowerCase() === 'productpartname26') {
            $(adviseIcons).show();
        }
    }
    var activeID = $("#" + activeTab + "_ID").val();
    $("#divLevelName_" + activeID).show();

    $("#" + spanName).attr("class", "green");
    if ($("ul.etabs a[href='#" + activeTab + "']").length > 0) {
        $("ul.etabs a[href='#" + activeTab + "']").removeClass("notVisited");
        $("ul.etabs a[href='#" + activeTab + "']").addClass("visited");
    }
    $(window).scrollTop(0);
}

function profileChange(func, param, testData) {

    var activeTab = $("#ActiveProductTab").val();
    var productPartID = activeTab.replace("ProductPartName", "");
    var action = $('input:radio[name=ProfileAction]:checked').val();
    var profileName = "";
    var overwriteProfileName = "";
    if (action == "SaveNew")
        profileName = $("#ProfileName").val();
    if (action == "Overwrite") {
        overwriteProfileName = $("#OverwriteProfileName").val();
    }
    if (action == "SaveNew" && !profileName.trim().length > 0 || (action == "Overwrite" && !overwriteProfileName.trim().length > 0)) {
        alert(GetResourceText("FIT_PROFILE_CHANGE_VALIDATION_MESSAGE", "Please enter new FitProfile name"));
    } else {
        var overWriteProfileName = $("#OverwriteProfileName").val();
        var fitProfileChangeAjaxParameters = { productPartID: productPartID, profileAction: action, profileName: profileName, changeWizard: testData.ChangeWizard, overWriteProfileName: overWriteProfileName, saveFitProfile: testData.SaveFitProfile, goToPreviousStep: param.previous };
        $.ajax(
			{
			    type: "GET",
			    dataType: "json",
			    url: "/CustomOrder/FitProfileChange",
			    data: fitProfileChangeAjaxParameters,
			    success: function (data) {
			        if (data != null) {
			            if (data.newTabName == undefined) {
			                data.newTabName = activeTab;
			            }
			            if (data.Status == false) {
			                ShowErrorDialog("", data.MessageHtml, null, null);
			            } else {
			                RefreshRunningInformation(REQUEST_TYPE_ELEMENT, TAB_FITPROFILE, ELEMENT_TYPE_FITPROFILE,
                                data.FitProfileId, 1, productPartID, $('#ProfileName').val(), CUSTOM_ORDER);

			                if (data.CanEnterNotes) {
			                    $("#FitToolChange").dialog('close');
			                    RenderFitProfileNotes(fitProfileChangeAjaxParameters);
			                    callBackFunction = func;
			                    paramForCallBackFunction = param;
			                } else {
			                    $("#FitToolChange").dialog('close');
			                    func(param, data);
			                }
			            }
			        }
			    }
			});
    }
}


function RenderFitProfileNotes(fitProfileChangeAjaxParameters) {
    $.ajax(
    {
        type: "GET",
        dataType: "json",
        url: "/CustomOrder/RenderFitProfileNotes",
        data: fitProfileChangeAjaxParameters,
        success: function (data) {
            $('#divFitProfileNotesDialog').remove();
            $('#divOrderCreationMainPanel').append('<div id="divFitProfileNotesDialog"></div>');
            $('#divFitProfileNotesDialog').html(data.MessageHtml);
            $('#divFitProfileNotesDialog').dialog({
                width: '750px !important',
                height: 'auto',
                title: GetResourceText("FITPROFILE_NOTE"),
                autoOpen: false,
                modal: true,
                resizable: false,
                closeOnEscape: false,
                close: function () {
                    $(this).dialog('destroy').remove();
                },
                buttons: [
                    {
                        text: GetResourceText("OK", "Ok"),
                        click: function () {
                            $('#CustomerFitProfileWithNotesSubmit').submit();
                        }
                    }
                ]
            });

            $('#divFitProfileNotesDialog').dialog('open');
        }
    });
}

//The variables written below is used for calling callback function once merging of fit profile notes are done for overwrite profile....
var callBackFunction;
var paramForCallBackFunction;

function OnMergingFitProfileNotes(data) {
    $("#divFitProfileNotesDialog").dialog('close');
    callBackFunction(paramForCallBackFunction, data);
}



function LaunchBodyMeasurementCalculator(isInchMeasurement) {
    
    var activeTab = $("#ActiveProductTab").val();
    var productID = activeTab.replace("ProductPartName", "");
    if ($("#CalcLaunchURL" + productID).length > 0) {
        var url = $("#CalcLaunchURL" + productID).val();
        $.ajax({
            url: url,
        }).done(function (returnData) {

            ShowDlg(isInchMeasurement,returnData, GetResourceText("BODYMEASUREMENT_CALCULATOR_TITLE", "BM calculator"), null, null, null);
        }).fail(function () {

        });
    }
}
function LaunchSavedBodyMeasurements(orderId) {
    window.open(bodyMeasurementUrl + "?orderId=" + orderId, 'bodymeasurement', 'width=600,location=no,titlebar=no,toolbar=no,resizable=no,scrollbars=no');
}
function ShowDlg(isInchMeasurement,returnData, copyOrderHeaderText) {
    
    var msgBoxData = {
        modal: true,
        title: copyOrderHeaderText,
        width: 800,
        height: 600,
        resizable: false,
        buttons: [
            {
                text: GetResourceText("CALCULATE_DELTA", "Calculate delta"),
                click: function () {
                    
                    SubmitCalculator(isInchMeasurement);
                }
            },
            {
                text: GetResourceText("CANCEL", "Cancel"),
                click: function () {
                    try {
                        if (typeof dialogClose != 'undefined')
                            dialogClose();
                    } catch (err) {
                    }
                }
            }],
        close: function (event, ui) {
            try {
                if (typeof dialogClose != 'undefined')
                    dialogClose();
            } catch (err) {
            }
        }
    };

    ShowDialog(copyOrderHeaderText, returnData, msgBoxData);
}

var dialogClose = function () {
    $("#msgbx").dialog('close');
};

function SelectedMeasurementTab() {
    var activeTab = $("#ActiveProductTab").val();
    var measurementTabDivs = $("#divFinishedMContainer").find("div[id^='ProductPartName']");
    if (measurementTabDivs != null || measurementTabDivs != undefined || measurementTabDivs != '') {
        for (var i = 0; i < measurementTabDivs.length; i++) {
            if ($(measurementTabDivs[i]).attr("id") == activeTab) {
                expandSinglePanel($(measurementTabDivs[i]).find("h2")[0]);
            } else {
                collapseSinglePanel($(measurementTabDivs[i]).find("h2")[0]);
            }
        }
    }
    AdjustRunningInformationHeight();
}

function SetIsVisitedStatus(newTab) {
    var hdnfieild = $("#" + newTab).find("input[id^='isVisited_']");
    if (hdnfieild != undefined) {
        $(hdnfieild).val("true");
    }
}


function SaveFitProfile() {
    var activeTab = $("#ActiveProductTab").val();

    submitFitTools({
        checkValidation: true
        , wizardNextStep: false
        , saveFitProfile: true
        
    },
        SwitchTab, {
            tabControl: "TabbedPanel"
        , newTabName: activeTab
        , callBack: ValidateProductFits
            , AfterSwitch: SetTabStatus
            , next: true 
        });
}

function ShowFitProfileHistory(customerId, url) {
    //var popupWidth = 800;
    //var popupHeight = 630;
    //var x = screen.width / 2 - popupWidth / 2;
    //var y = screen.height / 2 - popupHeight / 2;
    var productPartId = $($('#TabbedPanel .etabs').find('li.active').find('a').attr('href') + '_ID').val();
    var fitProfileId = 0;
    $.ajax(
			{
			    type: "GET",
			    dataType: "json",
			    url: "/CustomOrder/GetFitProfileIdForProductPart",
			    data: { productPartId: productPartId },
			    success: function (data) {
			        if (data != null) {
			            if (data.FitProfileId != undefined) {
			                fitProfileId = data.FitProfileId;
			            }

			            if (fitProfileId > 0) {
			                window.open(url + "?customerFitProfileID=" + fitProfileId + "&customerID=" + customerId);
			            } else {
			                alert(GetResourceText("FIT_PROFILE_NO_HISTORY"));
			            }
			        }
			    }
			});
    return false;
}

function addErrorClass(option, optionType) {

    if (optionType === 1) {
        //var optionTr = $("#TrOption_" + option.designOptionID);
        if (option) {
            var spanAvaliable = $(option).parent().find("span[aria-labelledby^='select2-" + $(option).attr('id') + "']");
            if (spanAvaliable) {
                $(spanAvaliable).css("border-color", "salmon");

                var spanImageAvaliable = $(spanAvaliable).find("span[role='presentation']");
                if (spanImageAvaliable) {
                    $(spanImageAvaliable).css("border-color", "salmon");
                }
            }

        }
    }
}

function removeErrorClass(option, optionType) {
    if (optionType === 1) {
        if (option) {
            var spanAvaliable = $(option).parent().find("span[aria-labelledby^='select2-" + $(option).attr('id') + "']");
            if (spanAvaliable) {
                $(spanAvaliable).css("border-color", "");

                var spanImageAvaliable = $(spanAvaliable).find("span[role='presentation']");
                if (spanImageAvaliable) {
                    $(spanImageAvaliable).css("border-color", "");
                }
            }

        }
    }
}