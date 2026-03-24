
/******************************************************************************************************
Functions related to intializing the page
*******************************************************************************************************/
function InitializeShopCustomerFieldSettingsPage() {

    $('.topsectionBody').alternateScroll();
    $('.bottomsectionBody').alternateScroll();

    $("#tblRegularFields").find('input[id$="IsVisibleInForm"]').bind("click", function (event) {
        OnVisibleInFormClick(this);
    });
    $("#tblRegularFields").find('input[id$="_IsMandatory"]').bind("click", function (event) {
        OnRegularFieldIsMandatoryClick(this);
    });


    //var abc = $("#tblCustomFields").find('input[id$="_IsEnabled"]');
    $("#tblCustomFields").find('input[id$="_IsEnabled"]').bind("click", function (event) {
        OnCustomFieldEnabledClick(this);
    });
    $("#tblCustomFields").find('input[id$="_IsMandatory"]').bind("click", function (event) {
        OnCustomFieldIsMandatoryClick(this);
    });

    $("#tblCustomFields").find('input[id$="IsVisibleInOverview"]').bind("click", function (event) {
        OnCustomFieldIsVisibleClick(this);
    });

}

/******************************************************************************************************
Functions related to event handling
*******************************************************************************************************/
function SubmitSaveForm() {
    var options = {
        success: function (resultData) {
            if (resultData != null) {
                if (resultData.Status == false) {
                    ShowErrorDialog("Error", resultData.ErrorHtml, null, null);
                } else {
                    ShowOKDialog("Success", GetResourceText("SUCCESS_MESSAGE", "Data saved successfully"), null, null);
                }
            }
        }
    };

    if (IsFormValid()) {

        $("#frmCustomerFieldsSave").ajaxForm(options);
        $("#frmCustomerFieldsSave").submit();
    }
}


function OnVisibleInFormClick(chkbx) {
    var isChecked = $(chkbx).is(':checked');

    var visibleInFormID = $(chkbx).attr("id");
    var visibleInOverviewID = visibleInFormID.replace("IsVisibleInForm", "IsVisibleInOverview");
    var isMandatoryID = visibleInFormID.replace("IsVisibleInForm", "IsMandatory");

    $("#" + visibleInOverviewID).attr('checked', isChecked);
    $("#" + isMandatoryID).attr('checked', isChecked);

}



function OnCustomFieldEnabledClick(chkbx) {

    var isChecked = $(chkbx).is(':checked');

    var isEnabledID = $(chkbx).attr("id");
    var visibleInOverviewID = isEnabledID.replace("IsEnabled", "IsVisibleInOverview");
    var isMandatoryID = isEnabledID.replace("IsEnabled", "IsMandatory");
    var isSearchVisibleID = isEnabledID.replace("IsEnabled", "IsVisibleInOverViewSearch");
    
    $("#" + visibleInOverviewID).attr('checked', isChecked);
    $("#" + isMandatoryID).attr('checked', isChecked);
    $("#" + isSearchVisibleID).attr('checked', isChecked);

}


/******************************************************************************************************
Functions related to validations
*******************************************************************************************************/

function IsFormValid() {
    var result = true;


    var errorMessages = new Array();
    var errorMessage = GetResourceText("CUSTOMERFIELD_CUSTOMFIELDLABEL_ERROR", "Please provide label text for Custom field {0}");
    var duplicateLabelTexterrorMessage = GetResourceText("CUSTOMERFIELD_CUSTOMFIELDLABEL_DUPLICATE", "Custom field label text should not repeat, please give valid label text.");

    if (!IsCustomFieldValid(1))
        errorMessages.push(String.format(errorMessage, 1));
    if (!IsCustomFieldValid(2))
        errorMessages.push(String.format(errorMessage, 2));
    if (!IsCustomFieldValid(3))
        errorMessages.push(String.format(errorMessage, 3));
    if (!IsCustomFieldValid(4))
        errorMessages.push(String.format(errorMessage, 4));
    if (!IsCustomFieldValid(5))
        errorMessages.push(String.format(errorMessage, 5));

    if (!ValidateDuplicateCustomFieldNames()) {
        errorMessages.push(duplicateLabelTexterrorMessage);
    }

    if (errorMessages.length > 0) {
        result = false;
        ShowErrorDialogForMessages(GetResourceText("CUSTOMERFIELD_HEADER", "Shop customer field settings"), errorMessages, null, null);
    }
    else {
        var appearsAfterErrorMessages = ValidateCyclicCheck();
        if (appearsAfterErrorMessages.length > 0) {
            result = false;
            ShowErrorDialogForMessages(GetResourceText("CUSTOMERFIELD_HEADER", "Shop customer field settings"), appearsAfterErrorMessages, null, null);
        }
    }


    return result;
}

function ValidateCyclicCheck() {
    var flag = 0;
    var errorMessages = new Array();
    var mappingArray = new Array();
    var selectedappearAfter = new Array();
    for (var i = 1; i <= 5; i++) {
        var isEnabledId = String.format("ShopCustomerFields_CustomFields_CustomField{0}_IsEnabled", i);
        if ($("#" + isEnabledId).is(':checked')) {
            var value = $("#" + String.format("ShopCustomerFields_CustomFields_CustomField{0}_AppearsAfter", i)).val().replace("CF", "");
            mappingArray[i] = value;
            selectedappearAfter.push(value);
        }
    }
    if (!checkForDuplicateSelection(selectedappearAfter)) {
        for (var item in mappingArray) {
            var cumtomFieldLabelId = String.format("ShopCustomerFields_CustomFields_CustomField{0}_Name", item);
            var labelText = $("#" + cumtomFieldLabelId).val();
            var appearsAfterId = String.format("ShopCustomerFields_CustomFields_CustomField{0}_AppearsAfter", item);
            var appearsAfter = $("#" + appearsAfterId).val();
            var sameselection = CheckForSameSelection(item, mappingArray);
            if (!sameselection) {
                var impossibleFields = CheckValidFields(appearsAfter, mappingArray);
                if (!impossibleFields) {
                    var result = CheckForCycle(item, mappingArray);
                    if (result) {
                        flag = 1;
                        break;
                    }

                } else {
                    appearsAfter = appearsAfter.replace("CF", "");
                    errorMessages.push(String.format(GetResourceText("INVALID__SELECTION_MESSAGE", "{0} with appears after CustomField {1} is not possible"), labelText, appearsAfter));
                }
            } else {

                errorMessages.push(String.format(GetResourceText("ERROR_SAME_CUSTOMFIELD", "You can't select appears after CustomField{0} for {1}"), item, labelText));
            }
        }
        if (flag == 1)
            errorMessages.push(GetResourceText("CYCLIC_REDUNDNCY_MESSAGE", "Please select valid value in appears after fields"));
    } else {
        errorMessages.push(GetResourceText("DUPLICATE_SELECTION", "You can't select same values in appears after field"));
    }
    return errorMessages;

}

function CheckForSameSelection(item, mappingArray) {
    return item == mappingArray[item];
}

function CheckValidFields(elementTocheck, mappingArray) {
    if ((elementTocheck.indexOf("CF")) != -1) {
        return mappingArray[elementTocheck.replace("CF", "")] == undefined;
    } else {
        return false;
    }
}

function checkForDuplicateSelection(mappingArray) {
    var result = false;
    if (mappingArray) {
        mappingArray = mappingArray.sort();
        for (var index = 0; index < mappingArray.length - 1; index++) {
            if (mappingArray[index + 1] == mappingArray[index]) {
                result = true;
                break;
            }
        }
    }
    return result;
}

function CheckForCycle(elementTocheck, mappingArray) {
    var value1 = mappingArray[elementTocheck];
    if (value1 != elementTocheck) {
        var value2 = mappingArray[value1];
        if (value2 != elementTocheck) {
            var value3 = mappingArray[value2];
            if (value3 != elementTocheck) {
                var value4 = mappingArray[value3];
                if (value4 != elementTocheck) {
                    var value5 = mappingArray[value4];
                    if (value5 != elementTocheck) {
                    } else {
                        return true;
                    }
                } else {
                    return true;
                }
            } else {
                return true;
            }
        } else {
            return true;
        }

    } else {
        return true;
    }
    return false;
}


function IsCustomFieldValid(number) {

    var result = true;

    var isEnabledID = String.format("ShopCustomerFields_CustomFields_CustomField{0}_IsEnabled", number);

    if ($("#" + isEnabledID).is(':checked')) {
        var cumtomFieldLabelID = String.format("ShopCustomerFields_CustomFields_CustomField{0}_Name", number);
        var labelText = $("#" + cumtomFieldLabelID).val();
        if ($.trim(labelText).length == 0) {
            result = false;
        }
    }
    return result;
}

function OnRegularFieldIsMandatoryClick(chkbx) {
    var isChecked = $(chkbx).is(':checked');
    if (isChecked) {
        var isMandatoryID = $(chkbx).attr("id");
        var visibleInFormID = isMandatoryID.replace("IsMandatory", "IsVisibleInForm");
        $("#" + visibleInFormID).attr('checked', isChecked);
    }
}

function OnCustomFieldIsMandatoryClick(chkbx) {
    var isChecked = $(chkbx).is(':checked');
    if (isChecked) {
        var isMandatoryID = $(chkbx).attr("id");
        var isEnabled = isMandatoryID.replace("IsMandatory", "IsEnabled");
        $("#" + isEnabled).attr('checked', isChecked);
    }
}

function OnCustomFieldIsVisibleClick(chkbx) {
    var isChecked = $(chkbx).is(':checked');
    if (isChecked) {
        var isMandatoryID = $(chkbx).attr("id");
        var isEnabled = isMandatoryID.replace("IsVisibleInOverview", "IsEnabled");
        $("#" + isEnabled).attr('checked', isChecked);
    }
}


function ValidateDuplicateCustomFieldNames() {
    var result = true;

    var customFieldLabels = new Array();

    var enabledCustomFields = $("#tblCustomFields").find("input[id$='_IsEnabled']");
    for (var index = 0; index < enabledCustomFields.length; index++) {

        if ($(enabledCustomFields[index]).is(":checked")) {
            var isEnabledID = $(enabledCustomFields[index]).attr("id");
            var labelTextID = isEnabledID.replace("IsEnabled", "Name");
            var lableText = $("#" + labelTextID).val();
            customFieldLabels.push($.trim(lableText));
        }
    }

    //check for duplicate labels
    if (customFieldLabels) {
        customFieldLabels = customFieldLabels.sort();
        for (var index = 0; index < customFieldLabels.length - 1; index++) {
            if (customFieldLabels[index + 1] == customFieldLabels[index]) {
                result = false;
                break;
            }
        }
    }

    return result;
}


function DisableFieldWhichShopCanNotHide() {
    var fields = $("#tblRegularFields").find("input[id$='_CanShopHideIt']");

    for (var index = 0; index < fields.length; index++) {

        var canHide = $(fields[index]).val();
        if (canHide.toLowerCase() == "false") {

            var canHideID = $(fields[index]).attr("id");
            var isVisibleInFormID = canHideID.replace("CanShopHideIt", "IsVisibleInForm");
            var isVisibleInOverviewID = canHideID.replace("CanShopHideIt", "IsVisibleInOverview");
            var isMandatoryID = canHideID.replace("CanShopHideIt", "IsMandatory");

            $("#" + isVisibleInFormID).prop("checked", true);
            $("#" + isVisibleInFormID).prop("disabled", "disabled");

            $("#" + isVisibleInOverviewID).prop("checked", true);
            $("#" + isVisibleInOverviewID).prop("disabled", "disabled");

            $("#" + isMandatoryID).prop("checked", true);
            $("#" + isMandatoryID).prop("disabled", "disabled");
        }
    }
}