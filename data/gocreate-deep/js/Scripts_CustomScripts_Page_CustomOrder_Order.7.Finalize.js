function InitializeFinalizeScreen() {

    ClientAppObject.CustomOrderCurrentWizardStep = EnumCustomOrderWizardSteps.FINALIZE;

    //Setup scrollbars and tabs
    $('.panelContainer_noFitToolbar').alternateScroll();
    setUpPanels();
    $('#tab-container').easytabs({ updateHash: false });
    //$('#TabbedPanel').easytabs();
    $('#TabbedPanel').easytabs({ updateHash: false });


    //Discount textbox
    $("#FinalizeDetails").find("input[id^=Discount_]").change(function () {
        OnDiscountChange(this);
    });
    //    $("#FinalizeDetails").find("input[id^=Discount_]").keypress(function (event) {
    //        //var id = $(this).attr("id");
    //       // ValidateDecimal(event, id, 2, 3);
    //    });
    $("#FinalizeDetails").find("input[id^=PriceCorrection_]").blur(function (event) {
        OnDiscountCostChange(this);
    });

    //Discount/cost textbox
    $("#FinalizeDetails").find("input[id^=PriceCorrection_]").change(function () {
        OnDiscountCostChange(this);
    });
    //    $("#FinalizeDetails").find("input[id^=Discount_]").keypress(function (event) {
    //        //var id = $(this).attr("id");
    //       // ValidateDecimal(event, id, 2, 3);
    //    });
    $("#FinalizeDetails").find("input[id^=Discount_]").blur(function (event) {
        OnDiscountChange(this);
    });

    //Downpayment textbox
    $("#FinalizeDetails").find("input[id^=Downpayment_]").change(function () {
        OnDownpaymentChange(this);
    });
    //    $("#FinalizeDetails").find("input[id^=Downpayment_]").keypress(function (event) {
    //        //var id = $(this).attr("id");
    //        //ValidateDecimal(event, id, 2, 3);
    //    });
    $("#FinalizeDetails").find("input[id^=Downpayment_]").blur(function (event) {
        OnDownpaymentChange(this);
    });


    //Total and outstanding textbox
    $("#FinalizeDetails").find("input[id^=Total_]").attr("disabled", true);
    $("#FinalizeDetails").find("input[id^=Outstanding_]").attr("disabled", true);

    CalculateInitialPaymentDetails();


    //    $("#FinalizeDetails").find("input[id^=WearingDate_]").datepicker({ yearRange: "1900:2050", changeMonth: true, changeYear: true, dateFormat: "dd-M-yy", onSelect: function (dateText, inst) { }
    //    });

    var datePickers = $("#FinalizeDetails").find("input[id^=WearingDate_]");
    if (datePickers != null && datePickers.length > 0) {
        for (var i = 0; i < datePickers.length; i++) {
            var id = $(datePickers[i]).attr("id");
            AddDatePickerControlDisableBackDate(id);
            //SetDate(id);
        }
    }

}


function SubmitProcessFinalizeForm() {
    if (ValidateFinalizeScreen()) {

        var confirmationMessageDetails = "";

        var isInvoiceSurchargeAppcable = $("#IsSurchargeApplicable").val();
        if (isInvoiceSurchargeAppcable.toLowerCase() === "true") {
            confirmationMessageDetails = "<div><strong>Tariff Surcharge Notice</strong></br>" + GetResourceText("INVOICE_SURCHARGE_APPLICABLE", "A 6.48% surcharge will be added to the purchase price of all orders due to updated U.S. trade regulations.") + "</div><br>";

            confirmationMessageDetails += GetResourceText("CONFIRM_ORDER_PROCESSED", "Are you sure you want to Process this order?");
        }
        else {
            confirmationMessageDetails = GetResourceText("CONFIRM_ORDER_PROCESSED", "Are you sure you want to Process this order?");
        }
        
        var isQualityIssueRemakeOrder = $("#IsQualityIssueRemakeOrder").val();
            
        var isOrderCreatedViaDraftFitProfile = $("#IsCreatedViaDraftFitProfile").val();

        if (isOrderCreatedViaDraftFitProfile.toLowerCase() === "true") {
            confirmationMessageDetails = GetResourceText("CONFIRM_ORDER_SUBMIT", "Are you sure you want to Submit this order?");
        }

        if (isQualityIssueRemakeOrder.toLowerCase() === "true") {
            confirmationMessageDetails += "\n" + GetResourceText("CONFIRM_ORDER_QUALITY_REMAKE", "PLEASE NOTE: Discount for remake is subjected to approval of issue.");
        }

        var confirmationHeader = "";
        ShowConfirmationDialog(confirmationHeader, confirmationMessageDetails, function () {
            
            SubmitFinalize({ checkValidation: true, isProcessOrder: true, isPaymentPending: false }, OnSuccessfulSubmitOfFinalizeForm, null);
        }, null, null);
    }
}

function SubmitProcessCustomerOwnDetail() {
    if (ValidateFinalizeScreen()) {
        var confirmationMessageDetails = GetResourceText("CONFIRM_ORDER_PROCESSED", "Are you sure you want to Process this order?");
        var confirmationHeader = "";
        ShowConfirmationDialog(confirmationHeader, confirmationMessageDetails, function () {
            var editUrl = "CustomOrder/RenderCustomerOrwnFabricForm";
            $.get(editUrl, null, function (response) {
                $("#dialogForm").html(response);
                $("#dialogForm").dialog("open");
            });


        }, null, null);
    }
}

function SubmitOnHoldFinalizeForm() {

    var isQualityIssueRemakeOrder = $("#IsQualityIssueRemakeOrder").val();
    var isInvoiceSurchargeAppcable = $("#IsSurchargeApplicable").val();
    if (isQualityIssueRemakeOrder.toLowerCase() === "true") {
        var confirmationMessageDetails = GetResourceText("CONFIRM_ORDER_QUALITY_REMAKE", "PLEASE NOTE: Discount for remake is subjected to approval of issue.");
        var confirmationHeader = "";

        ShowConfirmationDialog(confirmationHeader, confirmationMessageDetails, function () {
            
            SubmitFinalize({ checkValidation: true, isProcessOrder: false, isPaymentPending: false }, OnSuccessfulSubmitOfFinalizeForm, null);
        }, null, null);
    }
    else if (isInvoiceSurchargeAppcable.toLowerCase() === "true") {
        var confirmationMessageDetails = "<div><strong>Tariff Surcharge Notice</strong></br>" + GetResourceText("INVOICE_SURCHARGE_APPLICABLE", "A 6.48% surcharge will be added to the purchase price of all orders due to updated U.S. trade regulations.") + "</div><br>";

        var confirmationHeader = "";

        ShowConfirmationDialog(confirmationHeader, confirmationMessageDetails, function () {
            
            SubmitFinalize({ checkValidation: true, isProcessOrder: false, isPaymentPending: false }, OnSuccessfulSubmitOfFinalizeForm, null);
        }, null, null);
    }
    else
        SubmitFinalize({ checkValidation: true, isProcessOrder: false, isPaymentPending: false }, OnSuccessfulSubmitOfFinalizeForm, null);
}

function SubmitProcessPendingFinalizeForm() {

    var isQualityIssueRemakeOrder = $("#IsQualityIssueRemakeOrder").val();
    var isInvoiceSurchargeAppcable = $("#IsSurchargeApplicable").val();
    if (isQualityIssueRemakeOrder.toLowerCase() === "true") {
        var confirmationMessageDetails = GetResourceText("CONFIRM_ORDER_QUALITY_REMAKE", "PLEASE NOTE: Discount for remake is subjected to approval of issue.");
        var confirmationHeader = "";

        ShowConfirmationDialog(confirmationHeader, confirmationMessageDetails, function () {
            
            SubmitFinalize({ checkValidation: true, isProcessOrder: false, isPaymentPending: false, isProcessPending: true }, OnSuccessfulSubmitOfFinalizeForm, null);
        }, null, null);
    }
    else if (isInvoiceSurchargeAppcable.toLowerCase() === "true") {
        var confirmationMessageDetails = "<div><strong>Tariff Surcharge Notice</strong></br>" + GetResourceText("INVOICE_SURCHARGE_APPLICABLE", "A 6.48% surcharge will be added to the purchase price of all orders due to updated U.S. trade regulations.") + "</div><br>";

        var confirmationHeader = "";

        ShowConfirmationDialog(confirmationHeader, confirmationMessageDetails, function () {
            
            SubmitFinalize({ checkValidation: true, isProcessOrder: false, isPaymentPending: false, isProcessPending: true }, OnSuccessfulSubmitOfFinalizeForm, null);
        }, null, null);
    }
    else
        SubmitFinalize({ checkValidation: true, isProcessOrder: false, isPaymentPending: false, isProcessPending: true }, OnSuccessfulSubmitOfFinalizeForm, null);
}


function OnSuccessfulSubmitOfFinalizeForm(param, data) {
    if (data.InvalidShop != 'undefined' && data.InvalidShop) {
        ShowInvalidShopError();
    } else {

        if (data.Status && data.IsPrepayment) {

            MakePayment(data.UniqueGuid, "CustomOrder");

        } else {
            $("#finalizeMessage").html(data.MessageHtml);
            $("#finalizeMessage").dialog("open");
        }
    }


}

function ShowInvalidShopError() {
    ShowCloseErrorDialogNew(GetResourceText("SOMETHING_DIDNT_GO_AS_PLANNED"), GetResourceText("GENERAL_UNEXPECTED_ERROR"), function () { window.location.href = "/Login/Logout"; });
}

function ValidateFinalizeScreen() {
    var result = true;
    var err = new Array();
    var wearingDateFields = $("#FinalizeDetails").find("input[id^=WearingDate_]");
    var isVisiblePaymentField = $("#IsVisiblePaymentField").val();
    var reciptNumberMandatory = $("#ReciptNumberMandatory").val();
    //var showSalesPersonMandatory = $("#TailorMandatory").val();

    if (wearingDateFields != null && wearingDateFields.length > 0) {

        for (var i = 0; i < wearingDateFields.length; i++) {
            var itemNumber = $(wearingDateFields[i]).attr("id").replace("WearingDate_", "");

            var isUrgentOrder = $("#ShopUrgentOrder_" + itemNumber).is(':checked');
            if (isUrgentOrder) {
                if ($.trim($(wearingDateFields[i]).val()) == "") {
                    err.push(GetResourceText("UREGENT_WEARING_DATE", "Please enter wearing date for order " + itemNumber));
                }
            }
        }
    }



    if (isVisiblePaymentField != undefined && isVisiblePaymentField.toLowerCase() == "true") {
        var totalAmountFields = $("#FinalizeDetails").find("input[id^=Total_]");
        if (totalAmountFields != null && totalAmountFields.length > 0) {
            var downPaymentTerm = $.parseFloat($("#DownPaymentInPercentage").val());
            for (var i = 0; i < totalAmountFields.length; i++) {
                var itemNumber = $(totalAmountFields[i]).attr("id").replace("Total_", "");
                var totalAmount = $.parseFloat($("#Total_" + itemNumber).val());
                var downPaymentAmount = $.parseFloat($("#Downpayment_" + itemNumber).val());
                var actualAmountToBePaid = (totalAmount * downPaymentTerm) / 100;
                if (downPaymentAmount < actualAmountToBePaid && actualAmountToBePaid > 0) {
                    err.push(String.format(GetResourceText("DOWNPAYMENT_TERM", "Down payment must be minimum  {0}% of R.Price for order " + itemNumber), downPaymentTerm));
                }
            }
        }
    }
    if (reciptNumberMandatory != undefined && reciptNumberMandatory.toLowerCase() == "true") {
        var reciptNumberMandatorytFields = $("#Others").find("input[id^=SHOP_ORDER_NUMBER_]");
        if (reciptNumberMandatorytFields != null && reciptNumberMandatorytFields.length > 0) {
            for (var i = 0; i < reciptNumberMandatorytFields.length; i++) {
                var itemNumber = $.parseInt($(reciptNumberMandatorytFields[i]).attr("id").replace("SHOP_ORDER_NUMBER_", ""));
                var shopOrderNumber = $.trim($("#SHOP_ORDER_NUMBER_" + itemNumber).val());
                if (shopOrderNumber != undefined && shopOrderNumber == "") {
                    err.push(String.format(GetResourceText("SHOP_ORDER_NUMBER_MANDATORY", "Please enter Receipt ID number for order {0}"), itemNumber));
                }
            }
        }
    }
    
    var occasionDrpDwns = $("#Others").find(".occasionDrpDwn");
    if (occasionDrpDwns.length > 0) {
        $(occasionDrpDwns).each(function (index, item) {
            
            var value = $(item).val();
            var itemNumber = $.parseInt($(item).attr("id").split("_")[1]);
            if (value !== "") {
                if ($(item).val() === "15") {
                    var occasionRemark = $("#OrderOccasionRemark_" + itemNumber).val();
                    if (occasionRemark === "" || occasionRemark === undefined) {
                        err.push(String.format(GetResourceText("OCCASION_REMARKS_MANDATORY",
                            "Please select the occasion remarks for order {0}"),
                            index + 1));
                    }
                }
            }
            else {
                err.push(String.format(GetResourceText("OCCASION_MANDATORY", "Please select the occasion for order {0}"),
                    index + 1));

            }
        });
    }



    if (err.length > 0) {
        ShowErrorDialogForMessages("", err, null, null);
        return false;
    }
    return result;
}

function SubmitFinalize(postData, func, param) {
    /// <summary>Submits the Finalize form to server</summary>
    /// <param name="postData" type="jSon">The extra data to be posted with the form</param>
    /// <param name="func" type="function">The callback function that will be called on </param>
    /// <param name="param" type="jSon"></param>
    /// <returns type="Number">Nothing.</returns>
    var options = {
        data: postData,
        dataType: "json",
        success: function (testdata) {
            if (testdata != null) {
                
                if (testdata.Status == false && testdata.IsCameForDefaultLabelAdded) {
                    var titleText = 'Label out of stock';
                    ShowConfirmationDialog(titleText, testdata.MessageHtml, function () {

                        SubmitFinalize({ checkValidation: postData.checkValidation, isProcessOrder: postData.isProcessOrder, isPaymentPending: postData.isPaymentPending, isPrepayment: postData.isPrepayment, isCameForDefaultLabelAdded: testdata.IsCameForDefaultLabelAdded, isProcessPending: postData.isProcessPending }, OnSuccessfulSubmitOfFinalizeForm, param);
                    }, null, null);


                }
                else if (testdata.Status == false && (testdata.IsFromCreditControl == undefined || testdata.IsFromCreditControl === false))
                    ShowErrorDialog("", testdata.MessageHtml, null, null);
                else if (testdata.Status == false &&
                    testdata.IsFromCreditControl != undefined &&
                    testdata.IsFromCreditControl) {
                    $("#IsSurchargeApplicable").val(false);
                    ShowConfirmationDialog("", testdata.MessageHtml, SubmitOnHoldFinalizeForm, function () {
                        $("#IsSurchargeApplicable").val(true);
                    }, null);
                    }
                    
                else
                    func(param, testdata);
            }
        }
    };
    $("#FinalizeForm").ajaxForm(options);
    $("#FinalizeForm").submit();
}


function OnDiscountChange(discountTextbox) {
    if ($.trim($(discountTextbox).val()).length == 0)
        $($(discountTextbox).val(0));

    var itemNumber = GetItemNumberFromDiscount(discountTextbox);

    var discountcost = $("#PriceCorrection_" + itemNumber).val();
    if ($.trim(discountcost).length == 0)
        $("#PriceCorrection_" + itemNumber).val(0);

    var rPrice = $.parseFloat($("#RPrice_" + itemNumber).val());
    discountcost = $.parseFloat($("#PriceCorrection_" + itemNumber).val());
    var discountPrice = $.parseFloat($(discountTextbox).val());
    var totalPrice = rPrice - discountPrice + discountcost;

    if (isNaN(totalPrice))
        totalPrice = 0;
    $("#Total_" + itemNumber).val(GetFormattedNumber(totalPrice));

    OnDownpaymentChange($("#Downpayment_" + itemNumber));
}

function OnDiscountCostChange(discountcostTextbox) {
    if ($.trim($(discountcostTextbox).val()).length == 0)
        $($(discountcostTextbox).val(0));

    var itemNumber = GetItemNumberFromDiscountCost(discountcostTextbox);
    var discount = $("#Discount_" + itemNumber).val();
    if ($.trim(discount).length == 0)
        $("#Discount_" + itemNumber).val(0);

    var rPrice = $.parseFloat($("#RPrice_" + itemNumber).val());
    discount = parseFloat($("#Discount_" + itemNumber).val());
    var discountcostPrice = $.parseFloat($(discountcostTextbox).val());
    var totalPrice = rPrice - discount + discountcostPrice;
    if (isNaN(totalPrice))
        totalPrice = 0;
    $("#Total_" + itemNumber).val(GetFormattedNumber(totalPrice));

    OnDownpaymentChange($("#Downpayment_" + itemNumber));
}

function OnDownpaymentChange(downpaymentTextbox) {
    if ($.trim($(downpaymentTextbox).val()).length == 0)
        $($(downpaymentTextbox).val(GetFormattedNumber(0)));

    var itemNumber = GetItemNumberFromDownpayment(downpaymentTextbox);
    var discount = $.parseFloat($(downpaymentTextbox).val());
    $(downpaymentTextbox).val(GetFormattedNumber(discount));



    var totalPrice = $.parseFloat($("#Total_" + itemNumber).val());
    var downpaymentPrice = $.parseFloat($(downpaymentTextbox).val());
    var outstandingPrice = totalPrice - downpaymentPrice;
    if (isNaN(outstandingPrice))
        outstandingPrice = 0;
    $("#Outstanding_" + itemNumber).val(GetFormattedNumber(outstandingPrice));
}


function OnDiscountClick() {
    var isVisible = $("#trDiscount").is(':visible');
    if (isVisible)
        $("#trDiscount").hide();
    else
        $("#trDiscount").show();
}


function CalculateInitialPaymentDetails() {

    var discountTextboxes = $("#FinalizeDetails").find("input[id^=Discount_]");
    var discountCostTextboxes = $("#FinalizeDetails").find("input[id^=PriceCorrection_]");
    var downpaymentTextboxes = $("#FinalizeDetails").find("input[id^=Downpayment_]");


    for (var i = 0; i < discountTextboxes.length; i++)
        OnDiscountChange(discountTextboxes[i]);

    for (var i = 0; i < downpaymentTextboxes.length; i++)
        OnDownpaymentChange(downpaymentTextboxes[i]);

    for (var i = 0; i < discountCostTextboxes.length; i++)
        OnDiscountCostChange(discountCostTextboxes[i]);
}


function GetItemNumberFromDiscount(discountTextBox) {
    var itemNumber = "-1";
    itemNumber = $(discountTextBox).attr("id").replace("Discount_", "");
    return itemNumber;
}


function GetItemNumberFromDiscountCost(discountTextBox) {
    var itemNumber = "-1";
    itemNumber = $(discountTextBox).attr("id").replace("PriceCorrection_", "");
    return itemNumber;
}

function GetItemNumberFromDownpayment(downpaymentTextBox) {
    var itemNumber = "-1";
    itemNumber = $(downpaymentTextBox).attr("id").replace("Downpayment_", "");
    return itemNumber;
}

function UpdateCustomerOwnFabricSubmitted(data) {
    if (data.Result) {
        $("#dialogForm").dialog("close");
        
        SubmitFinalize({ checkValidation: true, isProcessOrder: true, isPaymentPending: false }, OnSuccessfulSubmitOfFinalizeForm, null);
    } else {
        SetErrorMessages(data.ErrorMessages, $("#editProcurement_CustomerOwnFabric"));
        //ShowErrorDialogForMessages('', data.ErrorMessages, null, null);
    }
}

function SetErrorMessages(messages, dialogobject) {
    var html = "<ul>";
    for (var msg in messages) {
        html += "<li>" + messages[msg] + "</li>";
    }
    html += "</ul>";
    //message = "<li>" + message + "</li>";
    $("#divCustomerOwn").html("");

    $("#errDiv").html(html);
    $("#errDiv").show();
    $("#successDiv").hide();
}


function SubmitPrePayment(processOrder) {

    if (ValidateFinalizeScreen()) {
        var confirmationMessageDetails = GetResourceText("PAYMENT_ORDER_PROCESSED", "Are you sure you want to process and make payment for this order?<br><div style='color:red'>Once payment is made,you can't make changes order.<div>");
        var confirmationHeader = GetResourceText("TITLE", "Custom order");
        ShowConfirmationDialog(confirmationHeader, confirmationMessageDetails, function () {
            
            SubmitFinalize({ checkValidation: true, isProcessOrder: processOrder, isPaymentPending: false, isPrepayment: true }, OnSuccessfulSubmitOfFinalizeForm, null);
        }, null, null);
    }
}

function OnOccasionChange(element, targetIdStr) {
    var targetDiv = $("#" + targetIdStr);
    if (parseInt($(element).val()) === 15) {
        $(targetDiv).removeClass("hide");
    } else {
        $(targetDiv).addClass("hide");
    }
}