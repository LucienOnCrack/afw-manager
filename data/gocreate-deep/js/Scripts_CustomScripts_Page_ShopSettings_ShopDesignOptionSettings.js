
/******************************************************************************************************
Functions related to intializing the page
*******************************************************************************************************/

var isSearch = false;

function InitializeShopDesignOptionSettingsPage() {
    if (typeof (window.ChangeNotifier) != 'undefined')
        ChangeNotifier.SetupDataChangeNotifier();
}

function ValidateDesignOptionsLinkedUnliked() {
    if (!isSearch || !($("#productFitIDs") && $("#productMakeIDs"))) {
        ShowErrorDialog("Error", GetResourceText("SEARCH_ERROR_MESSAGE", "Please select Make and Fit"), null, null);
        return false;
    }
    

    var isValid = ValidateDefaultValue();

    if (isValid) {
        var url = "/ShopSettings/ValidateFitTools";
        $.ajax({
            type: "POST",
            url: url,
            data: $("#frmDesignOptionSave").serialize(),
            success: function(data) {
                if (data.Status == false) {
                    var header = GetResourceText("IMPOSSIBLE_DESIGNOPTIONS_WITH_MAKE_MESSAGE",
                            "Impossible design option with make") +
                        " " +
                        data.Result.ProductMakeName;
                    ShowErrorDialog("", data.MessageHtml, null, null);
                    return false;
                } else {
                    SubmitSaveForm();
                }
                return false;
            }
        });
    }
}

function ValidateDefaultValue() {
    var result = true;

    // Default value should be selected if design option is hidden
    $("input[id^='chk_']:checkbox:not(:checked)").each(function (index, element) {
        var controlID = this.id.replace("chk_", "");
        var dropdownValue = $("#dd_" + controlID).val();
        if (dropdownValue == -1) {
            ShowErrorDialog("Error", GetResourceText("DESIGNOPTIONSETTING_VALIDATION", "Please select default value for all hidden design option(s)"), null, null);
            result = false;
            return false;
        }
    });
    
    //Design option should be hidden if all values are hidden
    $("select[id^='DesignOptionValuesIds_']").each(function(index, element) {
        var allUncheckedCheckBoxes = $(this).parent().find("input:checkbox:not(:checked)");
        if (allUncheckedCheckBoxes !== undefined && allUncheckedCheckBoxes !== null && allUncheckedCheckBoxes.length === 0) {
            var designOptionId = this.id.replace("DesignOptionValuesIds_", "");
            var isVisibleCheckBox = $("#chk_" + designOptionId).is(':checked');
            if (isVisibleCheckBox) {
                ShowErrorDialog("Error", GetResourceText("DESIGNOPTIONSETTING_VALUE_VALIDATION", "Please make design option hidden and select default value as all values are hidden"), null, null);
                result = false;
                return false;
            }
        }
    });
    return result;
}

function SubmitSaveForm() {
    if ($("#productFitIDs") && $("#productMakeIDs")) {

        var options = {
            success: function (resultData) {
                if (resultData != null) {
                    if (resultData.Status === false && resultData.ErrorMessageWithFile) {
                        ShowErrorDialog("Error", resultData.ErrorMessageWithFile, SubmitSearchForm, SubmitSearchForm);
                    }
                    else if (resultData.Status === false && resultData.ErrMessage) {

                        ShowErrorDialogForMessages("Error(s)", resultData.ErrMessage, null, null);
                    }
                    else if (resultData.Status === false && resultData.ErrorMessageWithoutFile) {
                        ShowErrorDialog("Error", resultData.ErrorMessageWithoutFile, SubmitSearchForm, SubmitSearchForm);
                    } else if (resultData.Status === false) {
                        ShowErrorDialog("Error", GetResourceText("SAVE_ERROR_MESSAGE", "Data was not saved properly as some error occurred"), null, null);
                    } else {
                        ShowOKDialog("Success", GetResourceText("SUCCESS_MESSAGE", "Data saved successfully"), null, null);
                    }
                }
            }
        };

        $("#frmDesignOptionSave").ajaxForm(options);
        $("#frmDesignOptionSave").submit();
    } else {
        ShowErrorDialog("Error", GetResourceText("SEARCH_ERROR_MESSAGE", "Please select Make and Fit"), null, null);
    }
}

function SubmitSearchForm() {
    isSearch = false;
    $("#divShopDesignOptions").html("");
    var options = {
        success: function (resultData) {
            if (resultData != null) {
                if (resultData.Status) {
                    $("#divShopDesignOptions").html(resultData.ViewString);
                    InitializeShopDesignOptionSettingsPage();
                    isSearch = true;
                } 
                else {

                    ShowErrorDialog("Error", GetResourceText("SEARCH_ERROR_MESSAGE", "Please select Make and Fit"), null, null);
                }
            }
        }
           
    };

    $("#frnDesignOptionsSearch").ajaxForm(options);
    $("#frnDesignOptionsSearch").submit();
}

function onProductPartChange() {
    isSearch = false;
    var productPartId = $("#ddlProductPart").val();
    var actionUrl = "/ShopSettings/GetProductLineMakeAndFits";
    var requestData = { productPartId: productPartId };
    $.ajax({
        type: "GET",
        url: actionUrl,
        data: requestData,
        success: function (data) {
            if (data != null) {
                var items;
                if (data.ProductLines != null) {
                    items = "";
                    $.each(data.ProductLines, function (i, item) {
                        items += "<option value='" + item.AtelierId + "'>" + item.ProductLineLocalizedName + "</option>";
                    });
                    $("#ddlProductLine").html(items);
                    InitializeDropDownWithoutSearchBoxByID("ddlProductLine");
                    $("#divShopDesignOptions").html("");
                }
                if (data.ProductMakes != null) {
                    items = "";
                    $.each(data.ProductMakes, function (i, item) {
                        if (i === 0)
                            items += "<option value='" + item.ID + "' selected>" + item.Name + "</option>";
                        else
                            items += "<option value='" + item.ID + "'>" + item.Name + "</option>";
                    });
                    $("#ddlProductMake").html(items);
                    //InitializeDropDownWithoutSearchBoxByID("ddlProductMake");
                    RefreshMultiSelectDropdown("ddlProductMake", onProductMakeChange);
                    $("#divShopDesignOptions").html("");
                }
                if (data.ProductFits != null) {
                    items = "";
                    $.each(data.ProductFits, function (i, item) {
                        if (i === 0)
                            items += "<option value='" + item.ID + "' selected>" + item.Name + "</option>";
                        else
                            items += "<option value='" + item.ID + "'>" + item.Name + "</option>";
                    });
                    $("#ddlProductFit").html(items);
                    //InitializeDropDownWithoutSearchBoxByID("ddlProductFit");
                    RefreshMultiSelectDropdown("ddlProductFit", onProductFitChange);
                    $("#divShopDesignOptions").html("");
                }
            }
        }
    });
}

function onProductLineChange() {
    isSearch = false;
    var productPartId = $("#ddlProductPart").val();
    var atelierId = $("#ddlProductLine").val();
    var actionUrl = "/ShopSettings/GetProductMakeAndFits";
    var requestData = { productPartId: productPartId, atelierId: atelierId };

    $.ajax({
        type: "GET",
        url: actionUrl,
        data: requestData,
        success: function (data) {
            if (data != null) {
                var items;
                if (data.ProductMakes != null) {
                    items = "";
                    $.each(data.ProductMakes, function (i, item) {
                        if (i === 0)
                            items += "<option value='" + item.ID + "' selected>" + item.Name + "</option>";
                        else
                            items += "<option value='" + item.ID + "'>" + item.Name + "</option>";
                    });
                    $("#ddlProductMake").html(items);
                    RefreshMultiSelectDropdown("ddlProductMake", onProductMakeChange);
                    $("#divShopDesignOptions").html("");
                }
            }
        }
    });
}

function onProductFitChange() {
    isSearch = false;
    $("#divShopDesignOptions").html("");
}

function onProductMakeChange() {
    isSearch = false;
    $("#divShopDesignOptions").html("");
}

function LoadMultiSelectDropdown(id, multiSelectChangeCallBack) {
    if ($("#" + id)) {
        $("#" + id).multiselect({
            noneSelectedText: function (numChecked, numTotal, checkedItems) {
                if (multiSelectChangeCallBack) {
                    multiSelectChangeCallBack();
                }
                return "";
            },
            selectedText: function (numChecked, numTotal, checkedItems) {
                var previousSelected = $("#" + id + " option:selected").length;
                if (multiSelectChangeCallBack) {
                    //Added this check so that the same check does not empty the form
                    if (numChecked !== numTotal || (numChecked === numTotal && previousSelected !== numChecked))
                        multiSelectChangeCallBack();
                }
                if (numChecked === 0)
                    return "";
                else
                    return numChecked + " of " + numTotal + " checked";
            }
        });
    }
}

function RefreshMultiSelectDropdown(id, callback) {
    if ($("#" + id)) {

        $("#" + id).multiselect("destroy");
        LoadMultiSelectDropdown(id, callback);
    }
}