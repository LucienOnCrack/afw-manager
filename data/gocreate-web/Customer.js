/******************************************************************************************************
Functions related to Create/Edit customer screen
*******************************************************************************************************/
var FitProfileGridDiv;

var ProductLineId = -1 ;
function InitializeCreateEditCustomerScreen() {
    $("#DOB").addClass("DatePickerStyle");
    AddDatePickerControl("DOB");

    //    SetDate("DOB");
    SetDecimalValidation();
    var TabbedPanels1 = new Spry.Widget.TabbedPanels("TabbedPanels1");
    MakeCustomerAddEditFormAjax();

    ApplyLeftPadding("CustomerData_SuitPerYear");
    ApplyLeftPadding("CustomerData_JacketPerYear");
    ApplyLeftPadding("CustomerData_ShirtPerYear");
    ApplyLeftPadding("CustomerData_CoatPerYear");

    $("#CustomerData_SuitPerYear").closest('div').parent().css('margin-top', '15px');

    $("#tblData").find("div.select2-container").css("margin-right", "2px");

    $("#CustomerData_BrandStoreName").closest('div').parent().hide();
    $("#CustomerData_ReferenceCustomerId").closest('div').parent().hide();
    $("#CustomerData_ReferenceInfo").closest('div').parent().hide();

    ShowHideStoreBrandInfo();
    ShowHideRefreneceInfo();

    $("#CustomerData_IsCMBefore").change(function () {
        ShowHideStoreBrandInfo();
    });

    $("#CustomerData_ReferenceTypeId").change(function () {
        ShowHideRefreneceInfo();

        $("#CustomerData_ReferenceInfo").val('');
    });
}


function ShowQualityReportNewDialogBox(orderId, shopId) {
    ShowSpinner();
    window.location = "/OrderDetail/GetOrderDetail?id=" + orderId + "&shopID=" + shopId + "&openTabID=QualityIssueNewDetailsTab";
}

function ShowNewReportIssueDialog(orderId, shopId) {
    ShowSpinner();
    window.location = "/OrderDetail/GetOrderDetail?id=" + orderId + "&shopID=" + shopId + "&openTabID=NewReportIssueTab";
}


function ViewQualityIssueDetails(orderId, shopId) {
    ShowSpinner();
    $.ajax({
        url: "/Customer/CheckIfQualityIssueExistsAndIsNotCancelled",
        type: "GET",
        data: { orderId: orderId },
        success: function (resp) {
            if (resp.Status) {
                var msgBoxData =
                {
                    modal: true,
                    title: "Issue Cancelled",
                    width: 600,
                    resizable: false,
                    close: function () { $('.ui-dialog').hide(); location.reload(); },
                    buttons: [
                        {
                            text: GetResourceText("OK", "Ok"),
                            click: function () {
                                location.reload();
                            }
                        }
                    ]
                };
                ShowDialog("Issue cancelled", resp.MessageHtml, msgBoxData);
            } else {
                window.location = "/OrderDetail/GetOrderDetail?id=" + orderId + "&shopID=" + shopId + "&openTabID=QualityIssueNewDetailsTab";
                // Kalyani: New Issue details TO BE DONE
            }


        },
        error: function (err) {
        }
    });

}

function ViewNewIssueDetails(orderId, shopId) {
    ShowSpinner();
    $.ajax({
        url: "/Customer/CheckIfNewIssueModuleExistsAndIsNotCancelled",
        type: "GET",
        data: { orderId: orderId },
        success: function (resp) {
            if (resp.Status) {
                var msgBoxData =
                {
                    modal: true,
                    title: "Issue Cancelled",
                    width: 600,
                    resizable: false,
                    close: function () { $('.ui-dialog').hide(); location.reload(); },
                    buttons: [
                        {
                            text: GetResourceText("OK", "Ok"),
                            click: function () {
                                location.reload();
                            }
                        }
                    ]
                };
                ShowDialog("Issue cancelled", resp.MessageHtml, msgBoxData);
            } else {
                window.location = "/OrderDetail/GetOrderDetail?id=" + orderId + "&shopID=" + shopId + "&openTabID=QualityIssueNewDetailsTab";
                // Kalyani: New Issue details TO BE DONE
            }


        },
        error: function (err) {
        }
    });

}



function ShowHideRefreneceInfo() {
    var value = $("#CustomerData_ReferenceTypeId").val();

    if (value === "1") {
        $("#CustomerData_ReferenceCustomerId").closest('div').parent().show();
        $("#CustomerData_ReferenceInfo").closest('div').parent().hide();

        var orgValidationValue = originalValidationDetails["CustomerData_ReferenceCustomerId"];

        validationDetails["CustomerData_ReferenceInfo"] = "None|Reference information";
        validationDetails["CustomerData_ReferenceCustomerId"] = orgValidationValue + "|Reference customer";
    }

    else if (value === "-1" || value === "") {
        $("#CustomerData_ReferenceCustomerId").closest('div').parent().hide();
        $("#CustomerData_ReferenceInfo").closest('div').parent().hide();

        validationDetails["CustomerData_ReferenceInfo"] = "None|Reference information";
        validationDetails["CustomerData_ReferenceCustomerId"] = "None|Reference customer";
    }

    else {
        $("#CustomerData_ReferenceCustomerId").closest('div').parent().hide();
        $("#CustomerData_ReferenceInfo").closest('div').parent().show();

        var orgValidationValue2 = originalValidationDetails["CustomerData_ReferenceInfo"];

        validationDetails["CustomerData_ReferenceInfo"] = orgValidationValue2 + "|Reference information";
        validationDetails["CustomerData_ReferenceCustomerId"] = "None|Reference customer";
    }
}

function ShowHideStoreBrandInfo() {
    var value = $("#CustomerData_IsCMBefore").val();

    if (value === "1") {
        $("#CustomerData_BrandStoreName").closest('div').parent().show();

        var orgValidationValue = originalValidationDetails["CustomerData_BrandStoreName"];

        validationDetails["CustomerData_BrandStoreName"] = orgValidationValue + "|Name of Brand / Store";
    }

    else {
        $("#CustomerData_BrandStoreName").closest('div').parent().hide();
        validationDetails["CustomerData_BrandStoreName"] = "None|Name of Brand / Store";
    }
}

function ApplyLeftPadding(element) {
    $("#" + element).closest('div').parent().children().first().css("padding-left", "25px");
}

//This is called on click of save button on customer Add/Edit form
function OnSubmitClick() {
    if (ValidateForm(false) && ValidataDataTab()) {
        $("#CustomerForm").submit();
    }
}

function ValidateFloat(value) {
    if (/^(\-|\+)?([0-9]+(\.[0-9]+)?|Infinity)$/
        .test(value))
        return Number(value);
    return NaN;
}

function ValidataDataTab() {
    var estimatedValue = $("#CustomerData_EstimatedValuePerYear").val();

    var error = new Array();

    if (estimatedValue) {
        var value = ValidateFloat(estimatedValue);

        if (isNaN(value) || value < 0)
            error.push(GetResourceText("CUSTOMER_PLEASE_ENTER_VALID_ESTIMATED_VALUE", "Please enter valid Estimated value / Year"));
    }

    if (error.length > 0) {
        var messageHtml = GetMessageHTML(error);
        ShowErrorDialog("Error", messageHtml, null, null);
        return false;
    }

    return true;
}

//On success of main form
function OnCustomerFormSubmitSuccess(data) {
    if (data != null) {
        if (data.Status == true) {
            ShowProgressMessageDialog(GetResourceText("CREATE_CUSTOMER_SUCCESS_MESSAGE", "Customer created successfully"));

            if (data.ShowProductLineSelectionPopup == true) {
                CreateNewOrderForCustomer(data.CustomerId);
            } else {
                window.location.replace(data.RedirectURL);
            }
        } else {

            if (data.IsForMossValidation) {
                $("#NoOfCalls").val(data.NoOfCalls);
                $("#VsPhone").show();
                $("#VsEmail").show();

                if (data.InvalidPhone) {
                    $("#Customer_Hdr_Cellphone").val("");
                    $("#Customer_Hdr_IsPhoneValidated").val(false);
                    $("#Customer_Hdr_CellphoneValidated").val(false);
                    $("#VsPhone span").removeClass("text-success fa fa-check");
                    $("#VsPhone span").addClass("fa fa-times text-danger");

                } else {
                    $("#VsPhone span").removeClass("fa fa-times text-danger");
                    $("#VsPhone span").addClass("text-success fa fa-check");
                    $("#Customer_Hdr_IsPhoneValidated").val(true);
                    $("#Customer_Hdr_CellphoneValidated").val(true);
                }

                if (data.InvalidEmail) {
                    $("#Customer_Hdr_Email").val("");
                    $("#Customer_Hdr_IsEmailValidated").val(false);
                    $("#Customer_Hdr_EmailValidated").val(false);
                    $("#VsEmail span").removeClass("text-success fa fa-check");
                    $("#VsEmail span").addClass("fa fa-times text-danger");
                } else {
                    $("#VsEmail span").removeClass("fa fa-times text-danger");
                    $("#VsEmail span").addClass("text-success fa fa-check");
                    $("#Customer_Hdr_IsEmailValidated").val(true);
                    $("#Customer_Hdr_EmailValidated").val(true);
                }
            } else {
                var messages = data.Messages;
                var messageHTML = GetMessageHTML(messages);
                ShowErrorDialog("Error", messageHTML, null, null);
            }
        }
    }

    return false;
}

var AdditionalValidations = function () {
    var errors = new Array();

    if ($.trim($("#Email").val()).length > 0) {
        if (!emailRegex.test($.trim($("#Email").val()))) {
            errors.push(GetResourceText("INVALID_EMAIL_ERRORMESSAGE", "Please give a valid email address"));
            $("#Email").addClass("ErrorControl");
        }
    } else {
        $("#Email").removeClass("ErrorControl");
    }

    var bodyMeasurementValidations = ValidateBodyMeasurementFields();
    errors = $.merge(errors, bodyMeasurementValidations);

    for (var key in validationDetails) {
        var value = validationDetails[key].split('|');

        var controlValue = $("#" + key).val();

        $("#" + key).removeClass("ErrorControl");

        if (value[0].toUpperCase() === 'REQUIRED') {
            if ($.trim(controlValue) === "-1") {
                errors.push("Please enter value in the field - " + value[1]);

                $("#" + key).addClass("ErrorControl");
            }
        }
    }

    return errors;
};

function ValidateBodyMeasurementFields() {
    var errors = new Array();

    var bodyMeasurementFields = $(document).find("input[name^='BodyMeasurement_']");

    if (bodyMeasurementFields != null && bodyMeasurementFields.length > 0) {
        for (var i = 0; i < bodyMeasurementFields.length; i++) {
            var measurementValue = $.trim($(bodyMeasurementFields[i]).val());

            if (IsRequiredField($(bodyMeasurementFields[i]).attr("id")) && $.trim(measurementValue).length == 0) {
                $(bodyMeasurementFields[i]).addClass("ErrorControl");
            } else {
                $(bodyMeasurementFields[i]).removeClass("ErrorControl");

                if (!isNaN(measurementValue)) {
                    var value = $.parseFloat(measurementValue);
                    if (value <= 0) {
                        if ($.inArray(GetResourceText("BODYMEASUREMENT_GREATER_THAN_ZERO", "Please enter positive value in Body measurement fields."), errors) < 0) {
                            errors.push(GetResourceText("BODYMEASUREMENT_GREATER_THAN_ZERO", "Please enter positive value in Body measurement fields."));
                        }
                        $(bodyMeasurementFields[i]).addClass("ErrorControl");
                    }
                }
            }
        }
    }

    return errors;
}

function GetMessageHTML(messages) {
    var html = "<ul>";
    html += GetMessageBulletPoints(messages);
    html += "</ul>";
    return html;
}

function GetMessageBulletPoints(messages) {
    var html = "";
    if (messages && messages.length > 0) {
        $.each(messages, function (i, message) {
            html += "<li>" + message + "</li>";
        });
    }
    return html;
}

function MakeCustomerAddEditFormAjax() {
    var options = { dataType: "json", success: OnCustomerFormSubmitSuccess };
    $("#CustomerForm").ajaxForm(options);
}

function MakeCustomerTextboxAjax(customerAutocompleteUrl) {
    var autoCompleteWidth = $("#CUSTOMERNAME").width() + 28;

    $("#CUSTOMERNAME").autocomplete(customerAutocompleteUrl,
        {
            extraParams: { lookInField: function () { return $("#ddFilterField").val(); }, global: false },
            cacheLength: 0,
            minChars: 2,
            width: autoCompleteWidth,
            multiple: false,
            matchContains: true,
            formatItem: function (row) {
                var result = "<tr class='autocompleteRow'>";
                result += "<td class='name'>" + row[1] + " " + row[2] + "</td>";
                result += "<td class='city'>" + row[3] + "</td>";
                result += "<td class='company'>" + row[4] + "</td>";
                result += "</tr>";

                //var result = row[1] + " " + row[2] + " " + row[3] + " " + row[4];
                return result;
            },
            formatResult: function (row) {
                $("#SearchCustomerID").val(row[0]);
                $("#CustomerID").val(row[0]);
                return $.trim(row[1] + " " + row[2]);
            }
        }
    );
}

/******************************************************************************************************
Functions related to customer overview screen
*******************************************************************************************************/
function ShopReferedCustomer_GridLoad() {
    var HEADER_HEIGHT = 130;
    var SEARCH_PANEL_HEIGHT = 0;
    var TAB_HEADER_HEIGHT = 10;
    var PAGER_DIV_HEIGHT = 40;
    var BOTTOM_FACTOR = 10 + 20 + 10;
    var height = $(window).height() - (HEADER_HEIGHT + SEARCH_PANEL_HEIGHT + TAB_HEADER_HEIGHT + PAGER_DIV_HEIGHT + 55 + BOTTOM_FACTOR);
    $("#ReferedByGridContainer").height(height);

    FixTableColumns("EntityListView1", 0);
    var items = $("#EntityListView1 tr:first a").click({ param1: "divReferedCustomerGrid" }, CustomizeOverviewListHeaderLinkClicked);
    LoadMunroDropDowns();
}

function ShopCustomerBMFitProfile_GridLoad() {
    var HEADER_HEIGHT = 130;
    var SEARCH_PANEL_HEIGHT = 0;
    var TAB_HEADER_HEIGHT = 0;
    var BOTTOM_FACTOR = 10 + 20 + 10;
    var SEARCH_PANEL_HEIGHT = $("#customerFitProfileSearch").height();
    var height = $(window).height() - (HEADER_HEIGHT + SEARCH_PANEL_HEIGHT + TAB_HEADER_HEIGHT + 75 + BOTTOM_FACTOR + SEARCH_PANEL_HEIGHT);
    if (height < 300)
        height = 300;
    $("#FitProfileGridContainer").height(height);
    FixTableColumns("EntityListView2", 0);

    UpdateCustomizeSortingLinks("EntityListView2", "divFitProfileGrid");
    var actionButtons = $.find("#EntityListView2 button[id^='PPAction_']");

    if (actionButtons != null && actionButtons.length > 0) {
        AttachedContextMenus(actionButtons, 1);
    }
    LoadMunroDropDowns();
}

function ShopCustomer_GridLoad() {
    Grid_Load(3, "EntityListView");
    AttachToolTip("GridContainer", "CustomerAttention");
}

function OnCustomerDeleteClick(customerID) {
    ShowConfirmationDialog(GetResourceText("CUSTOMER_PAGE_TITLE", "Customers"), GetResourceText("CUSTOMER_DELETE_CONFIRMATION_MESSAGE", "Are you sure you want to delete customer?"), function () {
        DeleteCustomer(customerID);
    }, null, null);
}


function DeleteCustomer(customerID) {
    $.ajax(
        {
            type: "POST",
            url: "/Customer/Delete",
            data: { customerID: customerID },
            success: function (result) {
                if (result.Status) {
                    ShowProgressMessageDialog(result.Message);
                    window.location.replace(result.RedirectURL);
                }
                else {
                    ShowErrorDialog(GetResourceText("CUSTOMER_PAGE_TITLE", "Customers"), result.Message, null, null);
                }
            }
        });
}

function OnCustomerOverviewSearchButtonClick() {
    $(".AdvancedSearch").hide();
}

function OnOverviewSearchFormSuccess(data) {
    if (data.Status) {
        $("#divGrid").html("");
        $("#divGrid").html(data.Html);
    }
    else {
        //ShowErrorDialog(headerText, messageText, okClick, dialogClose) {
        ShowErrorDialog("Customers", data.Html, null, null);
    }
}

/******************************************************************************************************
Functions related to Create details screen
*******************************************************************************************************/

//This is for search panel on Customer details page
function SearchPanel_Load(customerAutocompleteUrl) {
    MakeCustomerTextboxAjax(customerAutocompleteUrl);
}

function ValidateEditCopyFitProfile(customerProfileID, customerID, requestType) {
    
    $.ajax(
        {
            type: "Post",
            url: "/Customer/ValidateEditCopyFitProfile",
            data: { customerFitProfileID: customerProfileID },
            success: function (returnData) {
                if (returnData.IsValidFitProfile) {
                    switch (requestType) {
                        case "EDIT": EditFitProfile(customerProfileID, customerID);
                            break;
                        case "COPY": CopyFitProfile(customerProfileID, customerID);
                            break;
                    }
                }
                else
                    ShowOKDialog("",returnData.ErrorMessage, null, null);
            }
    });
}


function EditFitProfile(customerProfileID, customerID) {
    $.ajax(
        {
            type: "GET",
            url: "/Customer/EditCustomerFitProfile",
            data: { customerFitProfileID: customerProfileID, customerID: customerID },
            success: function (data) {
                $("#" + FitProfileGridDiv).html("");
                $("#" + FitProfileGridDiv).html(data);
                $("img").on("error", function () {
                    $(this).parent().remove();
                });
                var imageParentFit = $(document).find(".divDenimSlider");
                $(imageParentFit).each(function (index, element) {
                    var fitModelId = $(element).data("id");
                    $("#fittoolImageModel_" + fitModelId).on('show.bs.modal', function () {
                        var liCount = $(".carousel-inner .item", this).length;
                        if (liCount < 2) {
                            DestroyCarousal(this);
                        }
                    });
                });
            }
        });


}

function EditFitProfileName(customerProfileID, customerID, pn, profileType) {
    HideContextMenuWithClass();
    $('#hdnEditCustomerFitProfileID').val(customerProfileID);
    $('#hdnEditProfileType').val(profileType);
    $('#hdnEditCustomerID').val(customerID);

    $("#txtNewProfileName").val(pn);

    $("#txtNewProfileName").show();

    $('#divCustomerFitProfileEditName').dialog('open', function () {
    });

    return false;
}

function ViewCustomerFitProfile(customerFitProfileId, customerId) {
    $.ajax({
        type: "GET",
        url: "/Customer/GetCustomerFitProfileDetail",
        data: { customerFitProfileID: customerFitProfileId, customerID: customerId },
        success: function (data) {
            $("#" + FitProfileGridDiv).html("");
            $("#" + FitProfileGridDiv).html(data);

            $("img").on("error", function () {
                $(this).parent().remove();
            });
            var imageParentFit = $(document).find(".divDenimSlider");
            $(imageParentFit).each(function (index, element) {
                var fitModelId = $(element).data("id");
                $("#fittoolImageModel_" + fitModelId).on('show.bs.modal', function () {
                    var liCount = $(".carousel-inner .item", this).length;
                    if (liCount < 2) {
                        DestroyCarousal(this);
                    }
                });
            });
        }
    });
}

function CopyFitProfile(customerProfileID, customerID) {
    $.ajax(
        {
            type: "GET",
            url: "/Customer/CopyCustomerFitProfile",
            data: { customerFitProfileID: customerProfileID, customerID: customerID },
            success: function (data) {
                $("#" + FitProfileGridDiv).html("");
                $("#" + FitProfileGridDiv).html(data);

                $("img").on("error", function () {
                    $(this).parent().remove();
                });
                var imageParentFit = $(document).find(".divDenimSlider");
                $(imageParentFit).each(function (index, element) {
                    var fitModelId = $(element).data("id");
                    $("#fittoolImageModel_" + fitModelId).on('show.bs.modal', function () {
                        var liCount = $(".carousel-inner .item", this).length;
                        if (liCount < 2) {
                            DestroyCarousal(this);
                        }
                    });
                });
            }
        });
}

function OnFitChange(productPartId) {
    var productFitID = $("#ddProductFit").val();
    var inputData = { productPartID: productPartId, productFitID: productFitID };
    if (productFitID > 0) {
        $.ajax(
            {
                type: "GET",
                url: '/Customer/FillTryOnSizes',
                data: inputData,
                success: function (data) {
                    if (data != null && data != "" && data != 'undefined') {
                        if (data.TryOnSizes != null && data.TryOnSizes != "") {
                            var items = "";
                            $.each(data.TryOnSizes, function (i, item) {
                                items += "<option value='" + item.Value + "'>" + item.Text + "</option>";
                            });
                            $("#ddTryOnSizes").html(" ");
                            $("#ddTryOnSizes").html(items);

                            InitializeDropDownWithoutSearchBoxByID("ddTryOnSizes");
                        }
                    }
                }
            });
    }
};

function SetCustomerProfileAction(action) {
    $("#Action").val("");
    $("#txtOverwriteProfileName").val($("#ProfileName").val());
    $("#txtOverwriteProfileName").show();

    $("#txtProfileName").val($("#ProfileName").val());

    $("#txtProfileName").hide();
    $('#divCustomerFitProfileName').dialog({
        width: 700,
        height: 150,
        title: GetResourceText("FIT_PROFILE"), autoOpen: false,
        modal: true,
        resizable: false,
        buttons: [
            {
                text: GetResourceText("OK", "Ok"),
                click: function () {
                    var action = $('input:radio[name=ProfileAction]:checked').val();
                    $("#Action").val(action);
                    if (action == "Overwrite") {
                        var profileName = $.trim($("#txtOverwriteProfileName").val());
                        if (profileName.length != 0 && profileName != '') {
                            $("#ProfileName").val($("#txtOverwriteProfileName").val());
                            SubmitThisForm();
                            $(this).closest("#divCustomerFitProfileName").dialog('close');
                        } else {
                            ShowErrorDialog("", GetResourceText("VALIDATE_PROFILE_NAME"), null, null);
                        }
                    } else if (action == "SaveNew") {
                        var profileName = $.trim($("#txtProfileName").val());
                        if (profileName.length != 0 && profileName != '') {
                            $("#ProfileName").val($("#txtProfileName").val());
                            SubmitThisForm();
                            $(this).closest("#divCustomerFitProfileName").dialog('close');
                        } else {
                            ShowErrorDialog("", GetResourceText("VALIDATE_PROFILE_NAME"), null, null);
                        }
                    }
                }
            },
            {
                text: GetResourceText("CANCEL", "Cancel"),
                click: function () {
                    $(this).closest("#divCustomerFitProfileName").dialog('close');
                }
            }]
    });
    // ResetDialogValues();
    $('input[name=ProfileAction][value=Overwrite]').attr('checked', true);

    $("#txtOverwriteProfileName").attr("readonly", true);

    $('#divCustomerFitProfileName').dialog('open', function () {
        $('input[name=ProfileAction][value=Overwrite]', $(this)).attr('checked', true);
    });
    return false;
}


function FitToolChangeAction() {
    var value = $(this).val();
    if (value === "SaveNew") {
        $("#txtProfileName").show();
        $("#txtOverwriteProfileName").hide();
    }
    else {
        $("#txtProfileName").hide();
        $("#txtOverwriteProfileName").show();
    }
}

function OnFitProfileSuccess(data) {

    //For fit profile note related pop up display and saving
    if (data.CanEnterNotes) {
        $('#divFitProfileNotesDialog').remove();
        $('#' + FitProfileGridDiv).append('<div id="divFitProfileNotesDialog"></div>');
        $('#divFitProfileNotesDialog').html(data.MessageHtml);
        $('#divFitProfileNotesDialog').dialog({
            cache: false,
            width: '750px',
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
    //if fit profile is saved or not(for both new and overwrite actions)
    else {
        if (data.Status === true) {

            $.contextMenu('destroy');
            $("#" + FitProfileGridDiv).html(data.MessageHtml);
            ShowOKDialog("", GetResourceText("FIT_PROFILE_SUCESS_MESSAGE"), null, null);
            $("#divFitProfileNotesDialog").dialog('close');
        } else {
            ShowErrorDialog(GetResourceText("ERROR_MESSAGES"), data.MessageHtml, null, null);
        }
    }
}

function OnFitProfileDesiredMeasuremtSuccess(data) {
    if (data.Status === true) {
        $(document).scrollTop(0);
        $.contextMenu('destroy');
        ShowOKDialog("", GetResourceText("FIT_PROFILE_SUCESS_MESSAGE"), null, null);
        $("#divFitProfileNotesDialog").dialog('close');
        GetCustomerFitProfiles();
    } else {
        ShowErrorDialog(GetResourceText("ERROR_MESSAGES"), data.MessageHtml, null, null);
    }
}

function ShowDMNotes(fitProfileVersion, fitProfileId, isCurrentVersion) {
    $.ajax(
        {
            type: "GET",
            url: '/Customer/ShowDMNotes',
            data: { fitProfileVersion: fitProfileVersion, fitProfileId: fitProfileId, isCurrentVersion: isCurrentVersion },
            close: function () {
                $(this).dialog('destroy').remove();
            },
            success: function (data) {
                if (data) {
                    if (data.CanShowNotes) {
                        $('#divFitProfileNotesEditDialog').remove();
                        $('#' + FitProfileGridDiv).append('<div id="divFitProfileNotesEditDialog" style="overflow: hidden"></div>');
                        $('#divFitProfileNotesEditDialog').html(data.MessageHtml);

                        $('#divFitProfileNotesEditDialog').dialog({
                            width: '750px',
                            height: 'auto',
                            title: GetResourceText("FITPROFILE_NOTE"),
                            autoOpen: false,
                            modal: true,
                            resizable: false,
                            close: function () {
                                $(this).dialog('destroy').remove();
                            },
                            buttons: [
                                {
                                    text: GetResourceText("OK", "Ok"),
                                    click: function () {
                                        $(this).dialog("close");
                                    }
                                }
                            ]
                        });
                        $('#divFitProfileNotesEditDialog').dialog('open');
                    } else {
                        ShowOKDialog("", GetResourceText("FITPROFILE_NOTE_CANNOT_SHOW"), null, null);
                    }
                }
            },
            error: function () {
            }
        });
}

function OpenFitProfileNotePopUp(fitProfileVersion, fitProfileId, isHistoryNotesEditted) {
    $.ajax(
        {
            type: "GET",
            url: '/Customer/ShowNotesForEditting',
            data: { fitProfileVersion: fitProfileVersion, fitProfileId: fitProfileId },
            close: function () {
                $(this).dialog('destroy').remove();
            },
            success: function (data) {
                if (data != null && data != "" && data != 'undefined') {
                    if (data.CanShowNotes) {
                        $('#divFitProfileNotesEditDialog').remove();
                        $('#' + FitProfileGridDiv).append('<div id="divFitProfileNotesEditDialog"></div>');
                        $('#divFitProfileNotesEditDialog').html(data.MessageHtml);

                        if (isHistoryNotesEditted != undefined)
                            $("#IsHistoryNotesEditted").val(isHistoryNotesEditted);

                        $('#divFitProfileNotesEditDialog').dialog({
                            width: '63%',
                            height: 'auto',
                            title: GetResourceText("FITPROFILE_NOTE"),
                            autoOpen: false,
                            modal: true,
                            resizable: false,
                            close: function () {
                                $(this).dialog('destroy').remove();
                            },
                            buttons: [
                                {
                                    text: GetResourceText("CLOSE", "Close"),
                                    click: function () {
                                        $(this).dialog("close");
                                    }
                                }
                            ]
                        });
                        $('#divFitProfileNotesEditDialog').dialog('open');
                    } else {
                        ShowOKDialog("", GetResourceText("FITPROFILE_NOTE_CANNOT_SHOW"), null, null);
                    }
                }
            },
            error: function (err) { }
        });
}

function RefreshTitleOfFitProfileBodyMeasureValues() {
    $('[id^=FitProfileBodyMeasurementNote_]').each(function (index) {
        var noteToUpdate = $(this).val();

        var fitProfileBodyMeasurementValueId = $(this).attr('id').split('_')[1];

        var idOfElementToRefreshNote = "";
        if ($('#IsHistoryNotesEditted').val() === "1") {
            idOfElementToRefreshNote = "BMValueHistory_" + fitProfileBodyMeasurementValueId;
        } else {
            idOfElementToRefreshNote = "FitProfileBM_" + fitProfileBodyMeasurementValueId;

            var printNoteToUpdate = noteToUpdate.length > 20 ? noteToUpdate.substring(0, 18) + "..." : noteToUpdate;
            //$('#Print' + idOfElementToRefreshNote).text(printNoteToUpdate);
        }

        $('#' + idOfElementToRefreshNote).attr('title', noteToUpdate);
    });
}

function RefreshTitleOfFitProfileGarmentMeasureValues() {
    $('[id^=FitProfileGarmentMeasurementNote_]').each(function (index) {
        var noteToUpdate = $(this).val();

        var fitProfileGarmentMeasurementValueId = $(this).attr('id').split('_')[1];

        var idOfElementToRefreshNote = "";
        if ($('#IsHistoryNotesEditted').val() === "1") {
            idOfElementToRefreshNote = "GMValueHistory_" + fitProfileGarmentMeasurementValueId;
        } else {
            idOfElementToRefreshNote = "FitProfileGM_" + fitProfileGarmentMeasurementValueId;

            var printNoteToUpdate = noteToUpdate.length > 20 ? noteToUpdate.substring(0, 18) + "..." : noteToUpdate;
            //$('#Print' + idOfElementToRefreshNote).text(printNoteToUpdate);
        }

        $('#' + idOfElementToRefreshNote).attr('title', noteToUpdate);
    });
}

function RefreshTitleOfFitValues() {
    $('[id^=FitValueNote_]').each(function (index) {
        var noteToUpdate = $(this).val();

        var fitValueId = $(this).attr('id').split('_')[1];

        var idOfElementToRefreshNote = "";
        if ($('#IsHistoryNotesEditted').val() === "1") {
            idOfElementToRefreshNote = "FitValueHistory_" + fitValueId;
        } else {
            idOfElementToRefreshNote = "FitValue_" + fitValueId;

            var printNoteToUpdate = noteToUpdate.length > 20 ? noteToUpdate.substring(0, 18) + "..." : noteToUpdate;
            $('#Print' + idOfElementToRefreshNote).text(printNoteToUpdate);
        }

        $('#' + idOfElementToRefreshNote).attr('title', noteToUpdate);
    });
}

function RefreshTitleOfFitProfileDovs() {
    $('[id^=FitProfileDovNote_]').each(function (index) {
        var noteToUpdate = $(this).val();

        var fitProfileDovId = $(this).attr('id').split('_')[1];

        var idOfElementToRefreshNote = "";
        if ($('#IsHistoryNotesEditted').val() === "1") {
            idOfElementToRefreshNote = "FitProfileDovHistory_" + fitProfileDovId;
        } else {
            idOfElementToRefreshNote = "FitProfileDov_" + fitProfileDovId;

            var printNoteToUpdate = noteToUpdate.length > 20 ? noteToUpdate.substring(0, 18) + "..." : noteToUpdate;
            $('#Print' + idOfElementToRefreshNote).text(printNoteToUpdate);
        }

        $('#' + idOfElementToRefreshNote).attr('title', noteToUpdate);
    });
}

function OnEdittingNotes(data) {
    if (data.Status) {
        ShowOKDialog("", GetResourceText("FITPROFILE_NOTE_SAVED_MSG"), null, null);
        $("#divFitProfileNotesEditDialog").html("");
        $("#divFitProfileNotesEditDialog").dialog('close');
    } else {
        ShowOKDialog("", data.MessageHtml, null, null);
    }
}

function GetCustomerOrders() {
    var url = '/Customer/GetCustomerOrder';
    var data = { customerID: $("#CustomerID").val(), customerShopID: $("#CustomerShopID").val() };
    var divID = 'divCustomerOrderGrid';

    FetchAndDisplay(url, data, divID);

    return false;
}

function GetPastAppointmentForCustomer() {
    var url = '/Customer/GetCustomerAppointments';
    var data = { customerID: $("#CustomerID").val() };
    var divID = 'divPastAppointmentsGrid';
    FetchAndDisplay(url, data, divID);
    return false;
}

function CreateAppointmentForCustomer() {
    location.href = '/ShopCalendar/CreateAppointmentForRedirectedCustomer?customerId=' + $("#CustomerID").val();
}

function OnOrderSearchFormSuccess(data) {
    if (data.Status) {
        $("#divCustomerOrderGridContaner").html("");
        $("#divCustomerOrderGridContaner").html(data.Html);
    }
    else {
        //ShowErrorDialog(headerText, messageText, okClick, dialogClose) {
        ShowErrorDialog("", data.Html, null, null);
    }
}

function GetImagesForCustomer() {
    var url = '/Customer/GetImagesForCustomer';
    var data = { customerID: $("#CustomerID").val() };
    var divID = 'divImagesCustomer';

    FetchAndDisplay(url, data, divID);

    return false;
}
function GetReferedCustomers() {
    var url = '/Customer/GetReferedCustomer';
    var data = { customerID: $("#CustomerID").val() };
    var divID = 'divReferedCustomerGrid';

    FetchAndDisplay(url, data, divID);

    return false;
}
function GetCustomerFitProfiles() {
    var url = '/Customer/GetCustomerFitProfile';
    var data = { customerID: $("#CustomerID").val() };
    var divID = 'divCustomerFitProfileGrid';

    $("#divCustomerFitProfileGrid").html("");

    FetchAndDisplay(url, data, divID);

    return false;
}

function OnCustomerDetailSearchSuccess(data) {
    $("#CustomerDetaildiv").html(data);
}

function CreateNewOrder() {
    CreateNewOrderForCustomer($("#CustomerID").val());
}

function CreateNewOrderForCustomer(customerId) {

    $("#customerId").val(customerId);

    $.ajax({
        type: "GET",
        url: '/Customer/HasShopMultipleProductLine/',
        data: { customerId: customerId },
        success: function (data) {
            if (data.hasMultiplePL) {
                if (data.productLineId > 0) {
                    ProductLineId = data.productLineId;
                }
                ShowProductLineSelectionPopUp(customerId, data.productLineId);
            } else {
                window.location = data.RedirectUrl;
            }
        }
    });
}

function ShowProductLineSelectionPopUp(customerId, orderProductLine) {
    var width = 800;
    if (orderProductLine == 2) {
        width = 300;
    }
    $("#customerId").val(customerId);

    $.ajax({
        type: "GET",
        url: '/Customer/SelectOrder/',
        success: function (data) {
            $("#divOrderSelectPopup").dialog({
                create: function () {
                    $(this)
                        .closest('.ui-dialog')
                        .on('keydown',
                            function (ev) {
                                if (ev.keyCode === $.ui.keyCode.ESCAPE) {
                                    $("#divOrderSelectPopup").html("");
                                    $('#divOrderSelectPopup').dialog("close");
                                    //window.location.replace("/Customer/Index");


                                }
                            });
                },
                title: GetResourceText("SELECT_ITEM_TYPE", "Please select item type"),
                modal: true,
                resizable: false,
                closeOnEscape: false,
                width: width
            });

            $(".ui-dialog").css("overflow", "hidden");
            $(".ui-dialog").css("max-height", "unset");
            $(".ui-dialog").css("padding", "0px");
            $(".ui-dialog .ui-dialog-titlebar").css("padding", "30px 30px 0px 30px");
            $("#divOrderSelectPopup").html(data);
            $("#divOrderSelectPopup").css("overflow","unset");
            $("#divOrderSelectPopup").dialog("open");
            if ($("#divOrderSelectPopup").hasClass('ui-dialog-content')) {
                $("#divOrderSelectPopup").dialog("option", "position", { my: "center", at: "center", of: window });
            }
        }
    });
}

function OnItemGroupChange(control) {
    $("#productLineButtons").show();
    $("#productLineButtons").removeClass("lightgrey_button");
    $("#productLineButtons").addClass("darkgrey_button");
    $("#lblDisableNote").hide();

    const el = document.getElementById('divOrderSelectPopup');
    el.scrollTo({ top: 0, behavior: 'smooth' });
}


function OnProductLineChange(enabled) {
    if (enabled === 'True') {
        $("#productLineButtons").show();
        $("#lblDisableNote").hide();
    } else {
        $("#lblDisableNote").show();
        $("#productLineButtons").hide();
    }
}

function GoToOrderCreation() {
    var customerId = $("#customerId").val();
    var isSwipe = $("#isSwipe").val();
    var checkedRadioButtons = $("#divOrderSelectPopup").find("[type='radio']:checked");
    var itemGroupId = checkedRadioButtons.eq(0).attr("id");
    var hiddenInput = $('#ItemTypeCategoryMapping_' + itemGroupId);
    var itemTypeCategoryId = -1;
    if (hiddenInput.length) {
        var value = hiddenInput.val(); 
        var itemTypeId = value.split('_')[1]; 
        itemTypeCategoryId = value.split('_')[0]; 
        itemGroupId = itemTypeId;
    }
    var productLineId = ProductLineId;
    if (itemGroupId != null && productLineId != null) {
        $.ajax({
            type: "POST",
            url: '/Customer/LoadCustomOrderCreationPerShop/',
            data: { itemGroupId: $.parseInt(itemGroupId), itemTypeCategoryId: itemTypeCategoryId,  productLineId: $.parseInt(productLineId), customerId: customerId, isSwipe: isSwipe},
            success: function (data) {
                if (data.Status) {
                    window.location.replace(data.RefreshURL);
                }
            }
        });
    }
}

function EditCustomer() {
    var url = '/Customer/Edit/' + $("#CustomerID").val();
    window.location.replace(url);
}


function onUpdateButtonClick() {
    var customerid = $("#CustomerIDToUploadImageFor").val();
    var options = {
        dataType: "json",
        success: function (resultData) {
            if (resultData.Status) {
                ShowOKDialog(null, resultData.SucessMsg, null, null);
                refreshImageList(resultData.RefreshURL, customerid);
            } else {
                ShowErrorDialogForMessages(GetResourceText("ERROR_MESSAGES"), resultData.ErrMsg, null, null);
                refreshImageList(resultData.RefreshURL, customerid);
            }
        }
    };

    $("#UploadForm").ajaxForm(options);
    $("#UploadForm").submit();
}

function refreshImageList(url, id) {
    $.ajax({
        type: "GET",
        url: url,
        data: { 'id': id },
        success: function (data) {
            $("#imageList").html(data);
        }
    });
}

function EditClick(id) {
    $("#EditDiv" + id).show();
    $("#Links" + id).hide();
}

function OnCancelClick(id) {
    $("#EditDiv" + id).hide();
    $("#Links" + id).show();
}

function OnDeleteClick(id) {
    ShowConfirmationDialog("", GetResourceText("IMAGE_DELETE_CONFIRMATION", "This image will be deleted immediately.Do you still want to continue deleting image?"), function () {
        $.ajax(
            {
                type: "GET",
                url: "/Customer/DeleteCustomerImage",
                data: { entityImageID: id },
                success: function (data) {
                    if (data.Status == true) {
                        $("#divImagesCustomer").html(data.MessageHtml);
                    } else {
                        $("#divImagesCustomer").html("");
                    }
                }
            });
    }, function () {
        return false;
    }, null);
}
function OnSaveClick(id) {
    var description = $("#ImageDescription" + id).val();
    $.ajax(
        {
            type: "POST",
            url: "/Customer/EditImageDescription",
            data: { imageID: id, description: description },
            success: function (data) {
                if (data.Status == true) {
                    $("#EditDiv" + id).hide();
                    $("#Links" + id).show();
                    $("#Image" + id).html(description);
                }
            }
        });
    return false;
}

function ShowCustomerOverview() {
    var url = '/Customer';
    window.location.replace(url);
}

function SetFormHeight() {
    var containerHeight = $("#divFitProfiles").height();
    var HEADING_HEIGHT = 20;
    var FIT_PROFILE_HEADING_HEIGHT = 30;
    var BOTTOM_BUTTON_PANEL_HEIGHT = $("#divFitProfiles .buttonwrapper2").height();
    var height = containerHeight - (HEADING_HEIGHT + BOTTOM_BUTTON_PANEL_HEIGHT + FIT_PROFILE_HEADING_HEIGHT + 5);
    $("#divFitProfileFitTools").height(height);
}


function resetSearch() {
    $("#CUSTOMERNAME").val(" ");
    var x = "ALL";
    $('#ddFilterField option:[value=' + x + ']').attr('selected', 'selected');
    LoadMunroDropDowns();
}

function SetCustomerAutoSuggest(AutoSuggestURL, resultFunc) {
    var cusId = $("#ReferredByID").val();
    var actualCustomerId = -1;
    if (cusId != '') {
        actualCustomerId = parseInt($("#ReferredByID").val());
    }

    var autoCompleteWidth = $("#ReferredByCustomer").width() + 28;

    $("#ReferredByCustomer").autocomplete(AutoSuggestURL,
        {
            extraParams: { customerID: actualCustomerId },
            cacheLength: 0,
            minChars: 2,
            width: autoCompleteWidth,
            multiple: false,
            matchContains: true,
            formatItem: function (row) {
                return row[1];
            },
            formatResult: function (row) {
                return $.trim(row[1]);
            },
            mustMatch: true,
        }
    );

    //Things to do when user select any item from the list
    $("#ReferredByCustomer").result(function (event, data, formatted) {
        var text = "";
        var customerID = -1;
        $(this).removeAttr("search");

        if (data != undefined) {
            if (data.length > 0 && data[0] != undefined && !isNaN(data[0])) {
                customerID = data[0];
                text = data[1];
            }
        }

        //If the fabric has been changed (either changed to some other fabric or made empty)
        if (customerID != $("#ReferredByID").val() && data != undefined) {
            //Set the current values
            $("#ReferredByCustomer").html(text);
            $("#ReferredByID").val(customerID);
        }
    });

    $("#ReferredByCustomer").blur(function () {
        $("#ReferredByCustomer").search();
    });
}

function SetCustomerAutoSuggestForDataTab(AutoSuggestURL, resultFunc) {
    var cusId = $("#CustomerData_ReferenceCustId").val();

    var actualCustomerId = -1;

    if (cusId != '') {
        actualCustomerId = parseInt($("#CustomerData_ReferenceCustId").val());
    }

    var autoCompleteWidth = $("#CustomerData_ReferenceCustomerId").width() + 28;

    $("#CustomerData_ReferenceCustomerId").autocomplete(AutoSuggestURL,
        {
            extraParams: { customerID: actualCustomerId },
            cacheLength: 0,
            minChars: 2,
            width: autoCompleteWidth,
            multiple: false,
            parentId: "CustomerData_ReferenceCustomerId",
            matchContains: true,
            formatItem: function (row) {
                return row[1];
            },
            formatResult: function (row) {
                return $.trim(row[1]);
            },
            mustMatch: true,
        }
    );

    $("#CustomerData_ReferenceCustomerId").result(function (event, data, formatted) {
        var text = "";
        var customerID = -1;
        $(this).removeAttr("search");

        if (data != undefined) {
            if (data.length > 0 && data[0] != undefined && !isNaN(data[0])) {
                customerID = data[0];
                text = data[1];
            }
        }

        if (customerID != $("#CustomerData_ReferenceCustId").val() && data != undefined) {
            //Set the current values
            $("#CustomerData_ReferenceCustomerId").html(text);
            $("#CustomerData_ReferenceCustId").val(customerID);
        }
    });

    $("#CustomerData.ReferenceCustomerId").blur(function () {
        $("#CustomerData.ReferenceCustomerId").search();
    });
}

function OnOrderResetClick() {
    $("#ddCombination").val('');
    LoadMunroDropDowns();
    var url = '/Customer/ResetOrderSearch';
    var divID = 'divCustomerOrderGridContaner';
    var data = {};
    FetchAndDisplay(url, data, divID);
    return false;
}

function ActivateDeactivateProfile(customerProfileID, customerID, isEnabled) {
    $.ajax(
        {
            type: "GET",
            url: "/Customer/ActivateDeactivateProfile",
            data: { customerProfileID: customerProfileID, customerID: customerID, isEnabled: isEnabled },
            success: function (data) {
                $.contextMenu('destroy');
                $("#divFitProfileGrid").html(data);
            }
        });
}

function OnFitProfileResetClick() {
    $("#ddProfileActiveInActive").val('');
    $("#ddProfileProductPart").val('');
    $("#ddProfileProductLine").val('');
    LoadMunroDropDowns();
    var url = '/Customer/ResetProfileSearch';
    var divID = 'divFitProfileGrid';
    var data = { profileType: $('#fitProfileSearchViewModel_ProfileType').val() };
    FetchAndDisplay(url, data, divID);
    return false;
}

function OnFitProfileSearchFormSuccess(data) {
    if (data.Status) {
        $("#divFitProfileGrid").html("");
        $("#divFitProfileGrid").html(data.Html);
    }
    else {
        ShowErrorDialog("", data.Html, null, null);
    }
}

function EditAppointmentForCustomer(id) {
    window.open('/ShopCalendar/EditAppointmentForRedirectedCustomer?appointmentID=' + id);
}

function CreateNewOrderForMossBrosCustomerFromCustomerOverview(customerId) {

    var cusId;
    $.ajax({
        type: "GET",
        url: '/Customer/GetCustomerId/',
        data: { customerId: customerId },
        success: function (data) {

            cusId = data;
            $("#isSwipe").val(false);
            CreateNewOrderForCustomer(cusId.data);

        }
    });
}

/*Moss Bros*/
function CreateNewOrderForMossBrosCustomer(customerId) {
    //var url = '/MossBrosOrder/CreateForCustomer?customerID=' + customerId + "&&isSwipe=false";
    //window.location.replace(url);


    $("#isSwipe").val(false);
    CreateNewOrder();

}



function MossCustomer_GridLoad() {
    RefreshSuperTable("EntityListView", "GridContainerOrderListing", 1);
    CustomerDetailsOrderListingGrid("EntityListView");

    var actionButtons = $.find("#EntityListView button[id^='PPAction_']");
    if (actionButtons != null && actionButtons.length > 0) {
        AttachedContextMenus(actionButtons, 1);
    }
}

function OnMossCustomerOverviewSearchButtonClick() {
    var isSearchValid = $("#Email").val().length > 0 || $("#Phone").val().length > 0
        || $("#LastName").val().length > 0 || $("#FirstName").val().length > 0
        || $("#DebtorCode").val().length > 0 || $("#StoreNumber").val().length > 0;
    if (!isSearchValid) {
        ShowErrorDialog(GetResourceText("CUSTOMER_PAGE_TITLE", "Customers"), GetResourceText("NO_FILTER_APPLIED", " Please apply filter for listing."), null, null);
        return false;
    }
    return true;
}


function InitializeCreateEditMossCustomerScreen() {
    MakeCustomerAddEditFormAjax();
    SetUpdateMossCustomerFormHeight();
}


function SetUpdateMossCustomerFormHeight() {
    var HEADER_HEIGHT = 130;
    var SEARCH_PANEL_HEIGHT = 0;
    var TAB_HEADER_HEIGHT = 30;
    var minHeight = $(window).height() - (HEADER_HEIGHT + SEARCH_PANEL_HEIGHT + TAB_HEADER_HEIGHT);
    $('#innerContainer').css('min-height', minHeight + 'px');
    var PANELHEIGHT = $("#updateCustomer").height();
    //var height = $(window).height() - (HEADER_HEIGHT + SEARCH_PANEL_HEIGHT + TAB_HEADER_HEIGHT);
    $("#innerContainer").height(PANELHEIGHT + 30);
}

function OnMossCustomerSubmitClick() {
    var errors = ValidateMossCustomer();
    if (errors.length === 0) {
        $("#CustomerForm").submit();

    } else {

        ShowErrorDialog(GetResourceText("CUSTOMER_PAGE_TITLE", "Customers"), GetMessageHTML(errors), null, null);
    }
}

function ValidateMossCustomer() {
    var errors = new Array();
    if ($.trim($("#Customer_Hdr_Name").val()).length == 0)
        errors.push(GetResourceText("SAVE_CUSTOMER_FIRSTNAME_REQUIRED", "First name is required"));

    if ($.trim($("#Customer_Hdr_Surname").val()).length == 0)
        errors.push(GetResourceText("SAVE_CUSTOMER_LASTNAME_REQUIRED", "Last name is required"));

    if ($.trim($("#Customer_Hdr_Email").val()).length == 0)
        errors.push(GetResourceText("SAVE_CUSTOMER_EMAIL_REQUIRED", "Email is required"));
    else {
        if (!emailRegex.test($.trim($("#Customer_Hdr_Email").val())) && !emailRegex.test($.trim($("#Customer_Hdr_Email").val()))) {
            errors.push(GetResourceText("INVALID_EMAIL_ERRORMESSAGE", "Please give a valid email address"));
        }
    }

    if ($.trim($("#Customer_Hdr_Cellphone").val()).length == 0)
        errors.push(GetResourceText("SAVE_CUSTOMER_PHONE_REQUIRED", "Phone number is required"));

    if ($.trim($("#Customer_Hdr_PhoneCountryId").val()).length == 0)
        errors.push(GetResourceText("SAVE_CUSTOMER_PHONE_COUNTRY_REQUIRED", "Phone number country is required"));

    //if ($.trim($("#PostalCode").val()).length == 0)
    //    errors.push(GetResourceText("SAVE_POSTAL_CODE_REQUIRED", "Postal code is required"));

    //if ($.trim($("#Address1").val()).length == 0)
    //    errors.push(GetResourceText("SAVE_ADDRESS1_REQUIRED", "Address 1 is required"));

    var keepInformed = $("input[name='KeepInformed']:checked").val();
    if (!keepInformed) {
        errors.push("A marketing preference has not been selected.");
    }

    return errors;
}

function CreateOrderForMossCustomer(externalID, isSwipe) {
    $.ajax(
        {
            type: "GET",
            url: "/Customer/CreateOrderForMossCustomer",
            data: { externalID: externalID, isSwipe: isSwipe },
            success: function (data) {
                if (data && data.Status && !data.UpdateInHouseCustomer) {
                    $(document).off('ajaxStop');
                    RedirectToLocation(data.RedirectUrl);
                }
                else if (data && data.Status && data.UpdateInHouseCustomer) {
                    $("#divUpdateInHouseCustomer").dialog({
                        width: 500,
                        height: 100,
                        title: "We have some missing information.Please fill first all information.", autoOpen: false,
                        modal: true,
                        resizable: false,
                        zIndex: 1003,
                        buttons: [
                            {
                                text: GetResourceText("OK", "Ok"),
                                click: function () {
                                    $(document).off('ajaxStop');
                                    RedirectToLocation(data.RedirectUrl);
                                    $(this).closest("#divUpdateInHouseCustomer").dialog("close");
                                }
                            },
                            {
                                text: GetResourceText("CANCEL", "Cancel"),
                                click: function () {
                                    $(this).closest("#divUpdateInHouseCustomer").dialog("close");
                                }
                            }]
                    });
                    $('#divUpdateInHouseCustomer').dialog('open', function () {
                    });
                }
                else {
                    ShowErrorDialog("Error", data.Message, null, null);
                }
            },
            error: function (abc, bcd, efg) {
            }
        });
}

function EditMossCustomer(externalID) {
    $.ajax(
        {
            type: "GET",
            url: "/Customer/EditMossCustomer",
            data: { externalID: externalID },
            success: function (data) {
                if (data && data.Status) {
                    $(document).off('ajaxStop');
                    RedirectToLocation(data.RedirectUrl);
                } else {
                    ShowErrorDialog("Error", data.Message, null, null);
                }
            },
            error: function (abc, bcd, efg) {
            }
        });
}

function ShowMossCustomerDetails(externalCustomerID) {
    $.ajax(
        {
            type: "GET",
            url: "/Customer/MossCustomerDetail",
            data: { externalCustomerID: externalCustomerID },
            success: function (data) {
                if (data && data.Status) {
                    $(document).off('ajaxStop');
                    RedirectToLocation(data.RedirectUrl);
                } else {
                    ShowErrorDialog("Error", data.Message, null, null);
                }
            },
            error: function (abc, bcd, efg) {
            }
        });
}

function EditMossCustomerFromDetails(inhouseID) {
    var url = '/Customer/UpdateMossCustomer?inhouseID=' + inhouseID + "&&redirectToOrderCreation=true&&isUpdate=true";
    window.location.replace(url);
}


/*MTO*/


function GetCustomerFitProfilesBM() {
    var url = '/Customer/GetCustomerFitProfilesBM';
    var data = { customerID: $("#CustomerID").val() };
    var divID = 'divCustomerBMFitProfileGrid';

    $("#" + FitProfileGridDiv).html("");

    FetchAndDisplay(url, data, divID);

    return false;
}

function EnableDisableFitToolControl(element, levelSequence) {
    var status = $(element).is(":checked");
    $("select[levelsequence='" + levelSequence + "']").each(function (index, element) {
        if (status) {
            $(element).removeAttr("disabled");
        } else {
            $(element).attr("disabled", "disabled");
        }
    });
}

function HideShowFitTools(element) {

    var statusData = $(element).data("status");
    var status = (statusData == 'true');
    HideShowInternalFittols(status);
    ChangeShowLevelElement(status);
}

function ChangeShowLevelElement(status) {
    var spanElement = $("#LevelSettingChk");
    if (spanElement) {
        if (status) {
            $(spanElement).find("strong").text("Show available levels");
            $(spanElement).prop("title", "Show available levels");
            $(spanElement).data("status", "false");
        } else {
            $(spanElement).find("strong").text("Show all levels");
            $(spanElement).prop("title", "Show all levels");
            $(spanElement).data("status", "true");
        }
    }
}

function HideShowInternalFittols(status) {
    if (status) {
        $("span[class*='select2-container--disabled']")
            .each(function (index, elmt) {
                $(elmt).show();
                $(elmt).closest('div').next().show();
                $(elmt).closest('div').prev().show();
            });
    } else {
        $("span[class*='select2-container--disabled']")
            .each(function (index, elmt) {
                $(elmt).hide();
                $(elmt).closest('div').next().hide();
                $(elmt).closest('div').prev().hide();
            });
    }
}



function ShowDesiredMeasurementNotes(fitProfileVersion, fitProfileId, isHistoryNotesEditted) {
    $.ajax(
        {
            type: "GET",
            url: '/Customer/ShowDesiredMeasurementNotes',
            data: { fitProfileVersion: fitProfileVersion, fitProfileId: fitProfileId },
            close: function () {
                $(this).dialog('destroy').remove();
            },
            success: function (data) {
                if (data != null && data != "" && data != 'undefined') {
                    if (data.CanShowNotes) {
                        $('#divFitProfileNotesEditDialog').remove();
                        $('#' + FitProfileGridDiv).append('<div id="divFitProfileNotesEditDialog"></div>');
                        $('#divFitProfileNotesEditDialog').html(data.MessageHtml);

                        if (isHistoryNotesEditted != undefined)
                            $("#IsHistoryNotesEditted").val(isHistoryNotesEditted);

                        $('#divFitProfileNotesEditDialog').dialog({
                            width: '63%',
                            height: 'auto',
                            title: GetResourceText("FITPROFILE_NOTE"),
                            autoOpen: false,
                            modal: true,
                            resizable: false,
                            close: function () {
                                $(this).dialog('destroy').remove();
                            },
                            buttons: [
                                {
                                    text: GetResourceText("CLOSE", "Close"),
                                    click: function () {
                                        $(this).dialog("close");
                                    }
                                }
                            ]
                        });
                        $('#divFitProfileNotesEditDialog').dialog('open');
                    } else {
                        ShowOKDialog("", GetResourceText("FITPROFILE_NOTE_CANNOT_SHOW"), null, null);
                    }
                }
            },
            error: function (err) { }
        });
}

function DenimProfileActionChange() {
    var value = $(this).val();
    $(this).prop("checked", "checked");
    if (value === "SaveNew") {
        $($("#divCustomerFitProfileNameDM").find("input[id^=txtProfileName]")).show();
        $($("#divCustomerFitProfileNameDM").find("input[id^=txtOverwriteProfileName]")).hide();
    }
    else {
        $($("#divCustomerFitProfileNameDM").find("input[id^=txtProfileName]")).hide();
        $($("#divCustomerFitProfileNameDM").find("input[id^=txtOverwriteProfileName]")).show();
    }
    return true;
}
function ResetFitProfileDialog() {

    $($("#divCustomerFitProfileNameDM").find("input[id^=radioOverWrite]")).prop("checked", "checked");
    $($("#divCustomerFitProfileNameDM").find("input[id^=txtProfileName]")).hide();
    $($("#divCustomerFitProfileNameDM").find("input[id^=txtOverwriteProfileName]")).show();

}
function HideContextMenuWithClass() {
    $(".context-menu-list")
        .each(function () {
            if ($(this).css('display') == 'block') {
                $(this).trigger("contextmenu:hide");
            }
        });
}

//------------------





/******************************************************************************************************
OTHER METHODS
********************************************************************************************************/
function AddRemoveOrders() {

    var checkStatus = true;
    $("#GridContainerOrderListing  input[type=checkbox][name^='CHK_ORDER']").each(function (index, element) {
        checkStatus = $(element).is(':checked');
        var elementId = $(element).attr("id");
        //$("#" + elementId).prop("checked", checkStatus);
        $("#GridContainerOrderListing  input[type=checkbox][name^='" + elementId + "']").each(function (index, element1) {
            $(element1).prop("checked", checkStatus);
        });
        if (!checkStatus) {
            return false;
        }
        return true;
    });

    if (checkStatus == true) {
        $('#ACHK_ORD').prop("checked", true);
    } else {
        $('#ACHK_ORD').prop("checked", false);
    }
}





function updateStatus(updationUrl, confirmationMsg) {

    var orderType = $("#OrderType").val().toLowerCase();
    var validateURl = "";

    var destinationStatusId = $("#orderStatusDropdownForStatusChange option:selected").val();
    if (destinationStatusId == '') {
        alert(GetResourceText("SELECT_ORDER_STATUS", "Please select an order status"));
        return;
    }

    var items = [];
    $("#GridContainerOrderListing input:checkbox[name^='CHK_ORDER']:checked").each(function (index, element) {
        var td = $(element).parent("td");
        var hiddenInput = $("input[type='hidden'][name='hiddenOrderId']", td);
        var orderId = hiddenInput.val();
        items.push(orderId);
    });

    if (items.length == 0) {
        alert(GetResourceText("SELECT_ORDER", "Please select an order"));
        return;
    }

    HideSpinner();
    ShowConfirmationDialog("", confirmationMsg, function () {

        var data = { 'orderIds': items, "destinationStatusId": destinationStatusId };
        var param = $.param(data, true);
        updationUrl = "/" + updationUrl;
        $.get(updationUrl, param, function (response) {
            $("#dialogForm").html(response);
            $("#dialogForm").dialog("open");
            $("#dialogForm").dialog("option", "resizable", false);
            $("#dialogForm").dialog("option", "height", 550);
            $("#dialogForm").dialog("option", "width", "auto");
        });
    }, null, null);
}
function ShowValidationDialog(message) {

    var items = [];
    $("#GridContainerOrderListing input:checkbox[name^='CHK_ORDER']:checked").each(function (index, element) {
        var td = $(element).parent("td");
        var hiddenInput = $("input[type='hidden'][name='hiddenOrderId']", td);
        var orderId = hiddenInput.val();
        items.push(orderId);
    });
    if (items.length == 0) {
        alert(message);
    }
    return items;
}


//function maxHeight() {

//    var maxHeight = -1;
//    $('.g_BodyStatic div.g_Cl .g_C').each(function () {
//        var contextMenu = $(this).find("ul.jqcontextmenu");
//        if (contextMenu != undefined && contextMenu.length > 0) {

//        } else {
//            if ($(this).height() > maxHeight) {
//                maxHeight = $(this).height();
//            }
//        }
//    });
//    $('.g_Body div.g_Cl .g_C').height(maxHeight);
//}


function CheckAllCheckBoxes(item) {

    var checKState = $(item).is(':checked');
    $("#GridContainerOrderListing  input:checkbox[name^='CHK_ORDER']").each(function () {
        $(this).prop("checked", checKState);
    });

}


function ShowSpinner() {
    $.blockUI(
        {
            message: dlgelement,
            css: { top: '45%', left: '49%', width: '30px', height: '23px', background: 'none', border: '0', opactity: '1' },//left:45%, background:white
            centerY: true,
            centerX: true,
            ignoreIfBlocked: false
        });
}


// VARNIKA 


//function RedirectToCreateFitProfile(customerID) {
//	
//	$.ajax(
//		{
//			type: "GET",
//			url: "/Customer/RedirectToCreateFitProfile",
//			data: {  customerID: customerID },
//			success: function (data) {
//				


//				$("#" + FitProfileGridDiv).html("");
//				$("#" + FitProfileGridDiv).html(data);

//			}
//		});
//}

function OpenCreateFitProfile(customerID) {

    $.ajax(
        {
            type: "GET",
            url: "/Customer/CreateFitProfile",
            data: {  customerID: customerID },
            success: function (data) {



                $("#divCustomerFitProfileGrid").html("");
                $("#divCustomerFitProfileGrid").html(data);

            }
        });
}

function LoadFitProfileCreationPanel(element, customerID) {
    var selectedProductCombinationID = $(element).val();
    $.ajax({
        type: "GET",
        url: '/Customer/CreateNewFitProfileForCustomer',
        data: { selectedProductCombinationID: selectedProductCombinationID ,customerID:customerID},
        success: function (data) {
            $("#divCreateFitProfileContainer").html("");
            $("#divCreateFitProfileContainer").html(data);
        }
    });
}


function LoadOnSelectionOfFitAdvise(element, customerID, productPartId, index) {
    var selectedFitAdviseID = $(element).val();
    var currentActive = $(".productPartTab.active");

    var nameElement = currentActive.find("[id*='FitToolsViewModel.ProfileName']");
    nameElement.removeClass('ErrorControl');
    $("#SSOOrderNumber_" + productPartId).removeClass('ErrorControl');

    $("#ddProductFit_" + productPartId).prop('disabled', false);
    $("#ddTryOnSizes_" + productPartId).prop('disabled', false);
    $("#ddLeftTryOnSizes_" + productPartId).prop('disabled', false);
    $("#ddRightTryOnSizes_" + productPartId).prop('disabled', false);


    switch (selectedFitAdviseID) {
        case "1":
            ShowHideFitTryOnDetailsAndFooter(selectedFitAdviseID, productPartId);
            $("SSOOrderNumber_" + productPartId).autocomplete({ source: [] });
            break;
        case "2": LoadPreviousOrderNumberSelection(productPartId, index, selectedFitAdviseID);
            break;
    }
    LoadMunroDropDowns();

}

function LoadPreviousOrderNumberSelection(productPartId, index, selectedFitAdviseID) {
    ShowHideFitTryOnDetailsAndFooter(selectedFitAdviseID, productPartId);
    AttachOrderNumberAutosuggest("SSOOrderNumber", orderNumberAutosuggestURL,productPartId, index);
}

function ShowHideFitTryOnDetailsAndFooter(calledFrom, productPartId) {

    var isShoeOrder = $('#hdnIsShoeOrder').val();
    var currentActive = $(".productPartTab.active");
    switch (calledFrom) {
        case "1":
            $("#divPreviousOrderNumber", currentActive).hide();
            $("#SSOOrderNumber_" + productPartId).val("");
            var nameElement = currentActive.find("[id*='FitToolsViewModel.ProfileName']");
            nameElement.val($("#hdnFitProfileName_" + productPartId).val());
            $("#divFitTryOnDetails", currentActive).show();
            $("#fitProfileDetailsFooter").show();
            $("#divCopyOrderFromPreviousNote_" + productPartId).hide();

            $("#divFitToolContainer_" + productPartId).html("");
            $("#ddProductFit_" + productPartId).val("");
            $("#ddTryOnSizes_" + productPartId).val("");

            $("#ddLeftTryOnSizes_" + productPartId).val("");
            $("#ddRightTryOnSizes_" + productPartId).val("");

            $('#hdnDdlProductFit_' + productPartId).val(-1);
            $('#hdnDdlProductTryOn_' + productPartId).val(-1);

            $("#hdnDdlProductLeftTryOn_" + productPartId).val(-1);
            $("#hdnDdlProductRightTryOn_" + productPartId).val(-1);

            break;
        case "2": $("#divFitTryOnDetails", currentActive).hide();
            $("#divPreviousOrderNumber", currentActive).show();
            $("#fitProfileDetailsFooter").hide();
            $("#divFitToolContainer_" + productPartId).html("");
            if (isShoeOrder.toLowerCase() != "true")
                $("#divCopyOrderFromPreviousNote_" + productPartId).show();
            break;
    }
    LoadMunroDropDowns();

}

function OnLeftTryOnChange(productPartId) {
    var leftTryonID = $("#ddLeftTryOnSizes_" + productPartId).val();
     $('#hdnDdlProductLeftTryOn_' + productPartId).val(leftTryonID);
}

function TryOnChange(productPartId, index, orderId) {

    var productFitId = $("#ddProductFit_" + productPartId).val();
    var productTryOnText = $("#ddTryOnSizes_" + productPartId).find('option:selected').html();
    var tryOnSizeId = $("#ddTryOnSizes_" + productPartId).val();
    var selectedCombinationId = $("#ddCombinations").val();
    var shoeTryOnSizeId = $("#ddRightTryOnSizes_" + productPartId).val();
    $('#hdnDdlProductRightTryOn_' + productPartId).val(shoeTryOnSizeId);

    $("#SelectedTryOnId").val(tryOnSizeId);
    $("#SelectedFitId").val(productFitId);

    $("#hdnDdlProductFit_" + productPartId).val(productFitId);
    $("#hdnDdlProductTryOn_" + productPartId).val(tryOnSizeId);

    if (orderId == null || orderId == 'undefined' || orderId == "") {
        orderId = -1;
    }

    if (productPartId == 16 || productPartId == 17 || productPartId == 18 || productPartId == 19 || productPartId == 20 ||
        productPartId == 21 || productPartId == 33 || productPartId == 41) {
        GetFitToolViewModel(productPartId, productFitId, shoeTryOnSizeId, selectedCombinationId, index, orderId);
    }
    else {
        GetFitToolViewModel(productPartId, productFitId, tryOnSizeId, selectedCombinationId, index, orderId);
    }


    if (productPartId == 26) {
        var detechableLinerPresent = $("#divFitToolContainer").find("div[id^='ProductPartName27']");
        if (detechableLinerPresent.length > 0) {

            $("#ddTryOnSizes_27 option").each(function () {
                if ($(this).text() == productTryOnText) {
                    $(this).attr('selected', 'selected');
                }
            });

            TryOnChange(27, 1);
            $("#SelectedFitToolPartId").val(0);

        }
    }
    
    //ResetFitTool(productPartId);

    //ShowFitProfileRedAndGreenIndicator();
}

function GetFitToolViewModel(productPartId, productFitId, tryOnSizeId,selectedCombinationId,index, orderId) {

    var customerID = $("#Customer").val();
    
    if (productPartId > 0 && tryOnSizeId > 0 && productFitId > 0) {

        $.ajax(
            {
                type: "GET",
                url: "/Customer/FetchViewModelForFitToolProfileCreation",
                data: {
                    productFitId: productFitId, productPartId: productPartId, tryOnSizeId: tryOnSizeId,
                    customerId: customerID, selectedProductCombinationID: selectedCombinationId, indexForProductPart: index, orderId: orderId
                },

                success: function (responseData) {
                    var mainContent = responseData.ViewString;                                        
                    $("#divFitToolContainer_"+productPartId).html(mainContent);                    
                },
                error: function (XMLHttpRequest, textStatus, errorThrown) {

                }
            });
    } else {
        //ResetFitTool(productPartId);
    }
}


function OnFitProfileFromScratchSuccess(data) {

    if (data.Data != null) {
        if (data.Data.Status === true) {

            $.contextMenu('destroy');
            $(document).scrollTop(0);
            ShowOKDialog("", data.Data.Message, null, null);
            GetCustomerFitProfiles();
            //$("#divCustomerFitProfileGrid").html(data.MessageHtml);

        } else {
            ShowErrorDialog(GetResourceText("ERROR_MESSAGES"), data.Data.Message, null, null);
        }

    }


}

function OnFitProfileSuccessofShoeBelt(data) {
    if (data.Status === true) {

        $.contextMenu('destroy');
        $(document).scrollTop(0);
        ShowOKDialog("", GetResourceText("FIT_PROFILE_SUCESS_MESSAGE"), null, null);
        GetCustomerFitProfiles();
    } else {
        ShowErrorDialog(GetResourceText("ERROR_MESSAGES"), data.MessageHtml, null, null);
    }
}

function OnResetOfCreateFitProfileClick(customerId) {

    $("#divCreateFitProfileContainer").html("");
    $("#ddCombinations").val("");
    $('#ddCombinations').select2();

}

function OnFullViewClick(fitToolId) {
    $("#modalZoomInOut_" + fitToolId).toggleClass("fa-compress fa-arrows-alt");
    $("#modalZoomInOut_" + fitToolId).closest(".fitToolImageViewer").toggleClass("fullView");

}

function OnClickCloseModal(element) {
    $(element).closest(".modal").modal("hide");
}

function ChangeSizeTypeUnit() {
    var yearsResourceText = GetResourceText("YEARS", "years");
    var cmKgResourceText = GetResourceText("CM/KG", "cm/kg");
    var inchPoundResourceText = GetResourceText("INCH/POUND", "inch/pound");

    if ($("#select2-drpSizeType-container").attr('title') === cmKgResourceText) {
        $("#spnHeightUnit").html('');
        $("#spnHeightUnit").html('cm');
        $("#spnWeightUnit").html('');
        $("#spnWeightUnit").html('kg');
        $("#spnAgeUnit").html(yearsResourceText);

    } else if ($("#select2-drpSizeType-container").attr('title') === inchPoundResourceText) {

        $("#spnHeightUnit").html('');
        $("#spnHeightUnit").html('in');
        $("#spnWeightUnit").html('');
        $("#spnWeightUnit").html('lbs');
        $("#spnAgeUnit").html(yearsResourceText);
    }
}

function DestroyCarousal(element) {
    //$(".divDenimSlider", element).removeClass("carousal");
    $(".carousel-indicators", element).addClass("hide");
    $(".carousel-control", element).addClass("hide");
    $(".carousel-inner .item", element).addClass("active");
    $(".modal-content", element).removeClass("paddingBottom");
}

function AttachOrderNumberAutosuggest(textboxID, orderNumberAutosuggestURL, productPartId, index) {
    var autoCompleteWidth = $("#SSOOrderNumber_" + productPartId).width() + 28;
    $("#SSOOrderNumber_" + productPartId).autocomplete(orderNumberAutosuggestURL,
        {
            extraParams: { productPartID: productPartId},
            cacheLength: 0,
            delay: 500,
            minChars: 6,
            width: autoCompleteWidth,
            multiple: false,
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

    //Things to do when user select any item from the list
   $("#SSOOrderNumber_" + productPartId).result(function (event, data, formatted) {

        var orderID = -1;
        var controlID = $(this).attr("id");

        //$(this).removeAttr("search");
        if (data != undefined) {
            if (data.length > 0 && data[0] != undefined && !isNaN(data[0])) {
                orderID = data[0];
            }
        }
        if (orderID != $("#HD" + controlID).val()) {
            if (orderID > 0) {
                LoadOrderFitProfileData(orderID, productPartId, index);                
            } else {
                if (orderID < 0) {
                    $("#" + controlID).val("");
                }
            }
        }
    });
}

function LoadOrderFitProfileData(orderId, productPartId, index) {
    var currentActive = $(".productPartTab.active");
     $.ajax({
        type: "GET",
        url: '/Customer/GetPreviousOrderFitProfileData',
        data: { orderID: orderId, productPartID: productPartId},
         success: function (data) {
             if (data != null && data != "" && data != 'undefined') {
                 if (data.Status == true && data.CustomerFitProfileData != null && data.CustomerFitProfileData != "") {
                     $('#SSOOrderNumber_' + productPartId).removeClass('ErrorControl');
                     if (data.IsDenimOrder) {
                         $('#NewName').removeClass('ErrorControl');
                         LoadOrderFitProfileDataForDenim(data, productPartId, orderId, index);
                     }
                     else {
                         $("#ddProductFit_" + productPartId).val(data.CustomerFitProfileData.ProductFitID);
                         $("#hdnDdlProductFit_" + productPartId).val(data.CustomerFitProfileData.ProductFitID);

                         $("#ddProductFit_" + productPartId).prop('disabled', true);


                         var nameElement = currentActive.find("[id*='FitToolsViewModel.ProfileName']");
                         nameElement.val(data.CustomerFitProfileData.DefaultFitProfileName);
                         $("#hdnFitProfileName_" + productPartId).val(data.CustomerFitProfileData.DefaultFitProfileName);

                         LoadMunroDropDowns();

                         if (data.IsShoeOrder) {
                             $("#ddLeftTryOnSizes_" + productPartId).prop('disabled', true);
                             $("#ddRightTryOnSizes_" + productPartId).prop('disabled', true);
                             OnFitChange(productPartId, -1, orderId, index, data.CustomerFitProfileData.LeftTryOnSizeID, data.CustomerFitProfileData.RightTryOnSizeID);
                         }
                         else {
                             $("#ddTryOnSizes_" + productPartId).prop('disabled', true);
                             OnFitChange(productPartId, data.CustomerFitProfileData.TryOnSizeID, orderId, index);
                         }
                     }
                 }
             }
         }
    });
}


// for denim

function LoadOnSelectionOfFitAdviseForPants(element, productPartId, index) {
    var selectedFitAdviseID = $(element).val();

    $("#SSOOrderNumber_" + productPartId).removeClass('ErrorControl');

    $("#ddProductFit").prop('disabled', false);
    $("#ddTryOnSizes").prop('disabled', false);
    $("#ddTryOnTypes").prop('disabled', false);
  
    switch (selectedFitAdviseID) {
        case "1":
            ShowHideFitTryOnDetailsAndFooterForPants(selectedFitAdviseID, productPartId);
            /*$("SSOOrderNumber_" + productPartId).autocomplete({ source: [] });*/
            break;
        case "2": LoadPreviousOrderNumberSelectionForPants(productPartId, index, selectedFitAdviseID);
            break;
    }
    LoadMunroDropDowns();

}

function ShowHideFitTryOnDetailsAndFooterForPants(calledFrom, productPartId) {
    var valueInt = parseInt(calledFrom);
    switch (valueInt) {
        case 1:
            $("#divPreviousOrderNumber").hide();
            $("#SSOOrderNumber_" + productPartId).val("");
            $('#NewName').val($("#hdnFitProfileName").val());
            $('#NewName').removeClass('ErrorControl');
            $("#divFitTryOnDetails").show();
            $("#divButtonConatiner").show();
            $("#divCopyOrderFromPreviousNote_" + productPartId).hide();
            $("#divCopyOrderFromPreviousDenimNote_" + productPartId).hide();

            $("#divMeasurementContainer").html("");
            $("#ddProductFit").val("");
            $("#ddTryOnSizes").val("");
            $("#ddTryOnTypes").val("");

            $('#hdnDdlProductFit').val(-1);
            $('#hdnDdlProductTryOn').val(-1);
      
            break;
        case 2:
            $("#divFitTryOnDetails").hide();
            $("#divPreviousOrderNumber").show();
            $("#divButtonConatiner").hide();
            $("#divMeasurementContainer").html("");
            $("#divCopyOrderFromPreviousNote_" + productPartId).show();
            if (productPartId == 14)
                $("#divCopyOrderFromPreviousDenimNote_" + productPartId).show();
            break;
    }
    LoadMunroDropDowns();

}

function LoadPreviousOrderNumberSelectionForPants(productPartId, index, selectedFitAdviseID) {
    ShowHideFitTryOnDetailsAndFooterForPants(selectedFitAdviseID, productPartId);
    AttachOrderNumberAutosuggest("SSOOrderNumber", orderNumberAutosuggestURL,productPartId, index);
}

function LoadOrderFitProfileDataForDenim(data, productPartId, orderId, index) {
    $("#ddProductFit").val(data.CustomerFitProfileData.ProductFitID);
    $("#hdnDdlProductFit").val(data.CustomerFitProfileData.ProductFitID);
    $("#ddProductFit").prop('disabled', true);
    $("#NewName").val(data.CustomerFitProfileData.DefaultFitProfileName);
    LoadMunroDropDowns();

    $("#ddTryOnSizes").prop('disabled', true);
    OnFitChange(productPartId, data.CustomerFitProfileData.TryOnSizeID, orderId, index, data.CustomerFitProfileData.TryOnTypeID);
}


//######################################### Shop OrderOverview ContextMenu RunTime ##############################################

function ToggleCustomerOrderRunTimeContextMenuLoader(currentContextbtnID, entityID, isLoaderShow) {

    if (isLoaderShow) {
        var contextMenuLoader = document.getElementById('ContextMenuLoader');
        contextMenuLoader.outerHTML = `<button type="button" class='greyborder_button' id="${currentContextbtnID}" onclick='RenderCustomerOrderActionMenus(${entityID})'>Action</button>`;
    } else {
        var button = document.getElementById(currentContextbtnID);
        button.outerHTML = `
		<span id="ContextMenuLoader">
			<img src="../../Content/Images/ContextMenuLoader.gif" width="18" height="18">
		</span>
		`;
    }
}


function showCustomerOrderContextMenuRunTime(entityID) {
    //Extract entityID from button id

    actionBtnID = "PPAction_" + entityID

    //Construct context menu id for the entity
    var contextMenuID = "List_1" + "_ContextMenu_" + entityID;

    if ((contextMenuID == 'undefined') || (contextMenuID == null)) {
    }
    else {
        //fetch all sub items related to each menu
        var menuItems = $("#" + contextMenuID).find("li");
        $.contextMenu(
            {
                selector: "#" + actionBtnID,
                trigger: "left",
                items: $("#" + contextMenuID).children("li")
            });

        //Bind Click event to hide menu once clicked on items in menu
        $(menuItems).bind('click', function () {
            var menu = $(this).parent();
            $(menu).contextMenu("hide");
            if (($("#rightBottomPane").height() == 0 || $("#rightBottomPane").height() == 1) && toggleStatus != "bottom") {
                normal();
            }
        });
    }
}


function CustomerOrderFetchActionListForContextMenu(url, entityID) {

    var currentContextMenuListID = `List_1_ContextMenu_${entityID}`

    var currentContextbtnID = `PPAction_${entityID}`

    if ($("#shopCustomerOrderOverviewContextMenuContainer ul#" + currentContextMenuListID).length > 0) {

        showCustomerOrderContextMenuRunTime(entityID)

    } else {

        ToggleCustomerOrderRunTimeContextMenuLoader(currentContextbtnID, entityID, false)

        $.ajax({
            url: url,
            type: 'POST',
            global: false,
            data: { entityID: entityID },
            success: function (returnData, textStatus, request) {

                ToggleCustomerOrderRunTimeContextMenuLoader(currentContextbtnID, entityID, true)

                if (returnData.Status) {

                    $('#shopCustomerOrderOverviewContextMenuContainer').append(returnData.htmlString)

                    var btn = $(`#PPAction_${entityID}`);
                    var offset = btn.offset();
                    var width = btn.outerWidth();
                    var height = btn.outerHeight();

                    var x = offset.left + width - 1;
                    var y = offset.top + height - 1;

                    btn.trigger({
                        type: 'click',
                        pageX: x,
                        pageY: y
                    });

                }
                else {
                    ShowErrorDialog("Something went wrong. Please contact the technical team", "")
                }

            },
            error: function (request, status, error) {
                // Handle the error

                console.log(error)

                ToggleCustomerOrderRunTimeContextMenuLoader(currentContextbtnID, entityID, true)

                var loginUrl = window.location.protocol + "//" + window.location.host;

                if (request.status == 401) {
                    //Session time out
                    request.abort();
                    $("#session-timeout-dialog").dialog({
                        width: 500,
                        resizable: false,
                        draggable: false,
                        modal: true,
                        buttons: {
                            Ok: function () {
                                $(this).dialog("close");
                            }
                        },
                        close: function () {
                            window.location = loginUrl;
                        }
                    });
                }
                else if (request.status == 403) {//Session time out
                    request.abort();
                    $("#session-timeout-dialog").dialog({
                        width: 500,
                        resizable: false,
                        draggable: false,
                        modal: true,
                        buttons: {
                            Ok: function () {
                                $(this).dialog("close");
                            }
                        },
                        close: function () {
                            window.location = loginUrl;
                        }
                    });
                }
                else if (request.status == 405) {  //Action not suported
                    request.abort();
                    alert("You do not have sufficient rights to perform this operation.\nPlease contact administrator.");
                }
                else {
                    ShowErrorDialog("Something went wrong. Please contact the technical team", "")
                }
            }
        });


    }
}


function RenderCustomerOrderActionMenus(entityID) {

    var url = window.location.protocol + "//" + window.location.host + "/Customer/GetContextMenuStringByEntityID";

    CustomerOrderFetchActionListForContextMenu(url, entityID)

}


