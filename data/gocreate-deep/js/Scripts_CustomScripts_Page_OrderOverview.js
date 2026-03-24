



/******************************************************************************************************
OTHER METHODS
********************************************************************************************************/
var emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
var phoneRegex = /^(?:\+|00)?0*([1-9][0-9]*)[\s.-]?[0-9]{1,4}[\s.-]?[0-9]{1,4}[\s.-]?[0-9]{1,4}$/;
var orderItems = new Array();
var selectedOrders = [];
var deliveryOrderInfo = {};
function RemoveUncheckPPrice(element) {


    if (orderItems.length > 0) {
        // var elementId = $(element).attr("id");
        var hdnOrderId = element.split('CHK_ORDER');
        var orderId = hdnOrderId[1];

        var result = orderItems.find(x => x.Id === orderId);
        if (typeof result === "undefined") {
            //console.log("undefined - SELECTED ORDERS AFTER PAGINATION");
        } else {
            var index = orderItems.indexOf(result);
            orderItems.splice(index, 1);
        }
    }
}


function AddRemoveOrders(element) {

    var checkStatus = true;

    checkStatus = $(element).is(':checked');

    var elementId = $(element).attr("id");

    //Remove orderItems when unchecked
    if (checkStatus == false)
        RemoveUncheckPPrice(elementId);

    if ($("#GridContainer .sFData input[type=checkbox][name^='CHK_ORDER']:checked").length ==
        $("#GridContainer .sFData input[type=checkbox][name^='CHK_ORDER']").length) {
        $('#ACHK_ORD').prop("checked", true);
    } else {
        $('#ACHK_ORD').prop("checked", false);
    }


}

function AddRemoveOrdersWithPaymentInfo(id) {
    AddRemoveOrders(id);
    CalculatePayment();

}


function CheckAllCheckBoxesWithPaymentInfo(item) {

    CheckAllCheckBoxes(item);
    CalculatePayment();
}

function CalculatePayment() {

    var totalPrice = 0;
    var orderItemCount = 0;
    var onHoldOrdersPrice = 0;
    var onHoldAndProcessPendingOrdersPrice = 0;
    $("#GridContainer .sFData input[type=checkbox][name^='CHK_ORDER']:checked").each(function (index, element) {
        var added = false;
        var elementId = $(element).attr("id");
        var priceId = elementId.replace("CHK_ORDER", "hiddenPPrice_");

        var td = $(element).parent("td");
        var hiddenInput = $("input[type='hidden'][name='hiddenOrderId']", td);
        var hiddenStatus = $("input[type='hidden'][name='hiddenOrderStatus']", td);
        var orderId = hiddenInput.val();
        var status = hiddenStatus.val();

        var pPrice = $.parseFloat($("#" + priceId).val());


        $.map(orderItems, function (elementOfArray, indexInArray) {
            if (elementOfArray.Id == orderId) {
                added = true;
            }
        });
        if (!added) {
            orderItems.push({
                Id: orderId, price: pPrice, status: status
            });
        }

        //var priceId = elementId.replace("CHK_ORDER", "hiddenPPrice_");
        //totalPrice = totalPrice + $.parseFloat($("#" + priceId).val());

    });

    for (var i = 0; i < orderItems.length; i++) {
        totalPrice = totalPrice + orderItems[i].price;

        orderItemCount = orderItems.length;

        if (orderItems[i].status === "2")
            onHoldOrdersPrice = onHoldOrdersPrice + orderItems[i].price;


        if (orderItems[i].status === "2" || orderItems[i].status === "98")
        {
            onHoldAndProcessPendingOrdersPrice = onHoldAndProcessPendingOrdersPrice + orderItems[i].price;
        }
            
    }

    $("#amountToPay").html(totalPrice.toFixed(2));

    $("#selectedOnHoldOrderTotalPPrice").val(0.00);
    $("#selectedOnHoldOrderTotalPPrice").val(onHoldOrdersPrice);


    $("#selectedOnHoldAndProcessPendingOrderTotalPPrice").val(0.00);
    $("#selectedOnHoldAndProcessPendingOrderTotalPPrice").val(onHoldAndProcessPendingOrdersPrice);


    if (orderItemCount > 0) {
        $("#NumberOrdersSelectedDiv").show();
        $("#SelectedOrderCount").html(orderItemCount);
        if (orderItemCount == 1)
            $("#SelectedOrderCountMSG").html(" order selected");
        else
            $("#SelectedOrderCountMSG").html(" orders selected");
    } else {
        $("#NumberOrdersSelectedDiv").hide();
    }


    var showPPrice = parseBool($("#CanShopShowPPrice").val());
    if (showPPrice) {
        ChangeFinancialExposureIndicatorColor();
        SetShopRemainingLimitDetails();
    }

    

}
function PrintMultipleCustomerReceipt(elm) {
    ClosePrintContextMenu();
    var items = [];
    var validateUrl = "";
    validateURl = valiateFilterUrlForCustomOrder;
    $.ajax({
        type: "GET",
        url: validateURl,
        async: false,
        success: function (resp) {
            if (resp.toLowerCase() == 'false') {
                items = ShowValidationDialog(GetResourceText("SELECT_ORDER", "Please select an order"));
            } else {
                items = ShowValidationDialog(GetResourceText("SELECT_ORDER_BEFORE_SEARCH", "Please search and then select an order"));
            }
        }
    });
    if (items.length == 0)
        return false;
    var data = { 'orderIds': items };
    elm.href = "/CustomOrderOverview/DownloadMultipleCustomerReceipt/?" + $.param(data, true);
    return true;
}

function PrintMultipleConfirmationPdfs(elm, withPPrice, recieviedPdf) {
    ClosePrintContextMenu();
    var items = [];
    var validateUrl = "";
    validateURl = valiateFilterUrlForCustomOrder;
    $.ajax({
        type: "GET",
        url: validateURl,
        async: false,
        success: function (resp) {
            if (resp.toLowerCase() == 'false') {
                items = ShowValidationDialog(GetResourceText("SELECT_ORDER", "Please select an order"));
            } else {
                items = ShowValidationDialog(GetResourceText("SELECT_ORDER_BEFORE_SEARCH", "Please search and then select an order"));
            }
        }
    });
    if (items.length == 0)
        return false;

    var data = { 'orderIds': items, 'withPPrice': withPPrice, 'recieviedPdf': recieviedPdf };
    elm.href = "/CustomOrderOverview/DownloadMultipleConfirmationPdfs/?" + $.param(data, true);
    return true;
}

function PrintMultipleBMOrders() {
    var items = [];
    var validateUrl = "";
    validateURl = valiateFilterUrlForCustomOrder;
    $.ajax({
        type: "GET",
        url: validateURl,
        async: false,
        success: function (resp) {
            if (resp.toLowerCase() == 'false') {
                items = ShowValidationDialog(GetResourceText("SELECT_ORDER", "Please select an order"));
            } else {
                items = ShowValidationDialog(GetResourceText("SELECT_ORDER_BEFORE_SEARCH", "Please search and then select an order"));
            }
        }
    });
    if (items.length == 0)
        return false;
    var data = { 'orderIds': items }
    var href = "/CustomOrderOverview/GetOrderBodyMeasurement/?" + $.param(data, true);
    var myWindow = window.open(href, "", 'width=700,location=no,titlebar=no,toolbar=no,resizable=no,scrollbars=no');
    myWindow.resizeTo(650, 770);
}



function ClosePrintContextMenu() {
    $("#MultiPrint").contextMenu('hide');
}

function updateStatus(updationUrl, confirmationMsg) {
    var orderType = $("#OrderType").val().toLowerCase();
    var validateURl = "";
    var items = [];
    var destinationStatusId = $("#orderStatusDropdownForStatusChange option:selected").val();
    if (destinationStatusId == '') {
        alert(GetResourceText("SELECT_ORDER_STATUS", "Please select an order status"));
        return;
    }
    if (orderType == 'custommade') {
        validateURl = valiateFilterUrlForCustomOrder;
    } else if (orderType == 'readymade') {
        validateURl = valiateFilterUrlForReadymadeOrder;
    }
    if (validateURl === "") {

    } else {
        $.ajax({
            type: "GET",
            url: validateURl,
            success: function (data) {
                if (data.toLowerCase() == 'false') {
                    items = ShowValidationDialog(GetResourceText("SELECT_ORDER", "Please select an order"));
                } else {
                    items =
                        ShowValidationDialog(GetResourceText("SELECT_ORDER_BEFORE_SEARCH",
                            "Please search and then select an order"));
                }
            }
        });
    }
    HideSpinner();
    ShowConfirmationDialog("", confirmationMsg, function () {
        var data = { 'orderIds': items, "destinationStatusId": destinationStatusId };
        var param = $.param(data, true);
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
    $("#GridContainer div.sFDataInner input:checkbox[id^='CHK_ORDER']:checked").each(function (index, element) {
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



function maxHeight() {

    var maxHeight = -1;
    $('.g_BodyStatic div.g_Cl .g_C').each(function () {
        var contextMenu = $(this).find("ul.jqcontextmenu");
        if (contextMenu != undefined && contextMenu.length > 0) {

        } else {
            if ($(this).height() > maxHeight) {
                maxHeight = $(this).height();
            }
        }
    });
    $('.g_Body div.g_Cl .g_C').height(maxHeight);
}


function DisableOrder(tableID) {
    var inputControl = $(".readyOnly").find("input");
    var buttonControl = $(".readyOnly").find("button");
    var allTd = $('#EntityListView tr.readyOnly>td');
    if (inputControl != null && inputControl != undefined && inputControl != 'undefined' && inputControl.length > 0) {
        $(inputControl).attr('disabled', true);
    }
    if (buttonControl != null && buttonControl != undefined && buttonControl != 'undefined' && buttonControl.length > 0) {
        $(buttonControl).attr('disabled', true);
    }
    if (allTd != null && allTd != undefined && allTd != 'undefined' && allTd.length > 0) {
        $(allTd).css("background-color", "#F1F1F1");
    }
}


//On success of main form
function OnSearchSuccess(data) {
    if (data != null) {
        if (data.Status == true) {
            $("#divGrid").html(data.Data);
        } else {
            ShowErrorDialog(GetResourceText("TITLE", "Order overview"), data.Data, null, null);
        }
    }
}

function SetSearchDatePickerControls() {
    var datePickers = $(".orderOverviewTable").find("input[id^=ProcessedDate]");
    if (datePickers != null && datePickers.length > 0) {
        for (var i = 0; i < datePickers.length; i++) {
            var id = $(datePickers[i]).attr("id");
            AddDatePickerControl(id);
            SetDate(id);
        }
    }
}

function AttachCustomerAutoComplete(customerNameAutoCompleteUrl, formatMethod) {
    var autoCompleteWidth = $("#CustomerName").width() + 28;

    $("#CustomerName").autocomplete(customerNameAutoCompleteUrl,
        {
            mustMatch: true,
            cacheLength: 0,
            minChars: 2,
            width: autoCompleteWidth,
            multiple: false,
            matchContains: false,
            formatItem: function (row) {
                var result = row[1];
                return result;
            },
            formatResult: function (row) {
                return $.trim(row[1]);
            },

            selectFirst: true


        }
    ).result(function (event, data, formatted) {

        var customerId = -1;

        if (data != undefined) {
            if (data.length > 0 && data[0] != undefined && !isNaN(data[0]))
                customerId = data[0];
        }


        $("#CustomerID").val(customerId);
    });

}
function CheckAllCheckBoxes(item) {

    var checKState = $(item).is(':checked');
    $("#GridContainer  input:checkbox[name^='CHK_ORDER']").each(function (i, element) {
        $(this).prop("checked", checKState);
        if (!checKState)
            //RemoveUncheckPPrice(element);
            AddRemoveOrders(element);
    });
}
function ShowPPriceAfterDiscount(pPrice, orderId, localstring) {
    //if (pPrice == '0') {
    //     window.alert(localstring + " €"+pPrice);
    //     return;
    // }
    //dataType: "json",
    $.ajax({
        url: "OrderDetail/GetOrderPriceDetail",
        type: "GET",
        data: { orderId: orderId, isFromOverview: true },
        success: function (resp) {
            var msgBoxData =
            {
                modal: true,
                title: GetResourceText("PPRICE_DETAIL", "P.Price details"),
                width: 600,
                resizable: false,
                buttons: [
                    {
                        text: GetResourceText("OK", "Ok"),
                        click: function () {
                            CloseDialog();
                        }
                    }
                ]
            };
            ShowDialog(GetResourceText("PPRICE_DETAIL", "P.Price details"), resp, msgBoxData);
        },
        error: function (err) {
        }
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


function ShowFileNotFoundMessage(message) {
    alert(message);
}


function ShowQualityReportDialogBox(orderId, shopId) {
    window.location = "/OrderDetail/GetOrderDetail?id=" + orderId + "&shopID=" + shopId + "&openTabID=QualityIssueDetailsTab";
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
    CheckIfQualityIssueIsNotCancelled(orderId, shopId);

}

function ViewNewIssueDetails(orderId, shopId) {
    ShowSpinner();
    CheckIfNewReportIssueExistsForOrder(orderId, shopId);

}




function CheckIfQualityIssueIsNotCancelled(orderId, shopId) {

    $.ajax({
        url: "OrderDetail/CheckIfQualityIssueExistsAndIsNotCancelled",
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
                window.location = "/OrderDetail/GetOrderDetail?id=" + orderId + "&shopID=" + shopId + "&openTabID=QualityIssueDetailsTab";
            }


        },
        error: function (err) {
        }
    });
}


function CheckIfNewReportIssueExistsForOrder(orderId, shopId) {

    $.ajax({
        url: "IssueModule/CheckIfNewIssueModuleExistsAndIsNotCancelled",
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
                window.location = "/OrderDetail/GetOrderDetail?id=" + orderId + "&shopID=" + shopId + "&openTabID=QualityIssueDetailsTab";                
            }


        },
        error: function (err) {
        }
    });
}



function ProcessOrderPayment(mainUrl, cancellationUrl, controller) {

    window.onbeforeunload = function (e) {
        var message = "Are you sure you want leave?";
        e.returnValue = message;
        return message;
    };

    var items = [];
    //$("#GridContainer input:checkbox[name^='CHK_ORDER']:checked").each(function (index, element) {
    //    var td = $(element).parent("td");
    //    var hiddenInput = $("input[type='hidden'][name='hiddenOrderId']", td);
    //    var orderId = hiddenInput.val();
    //    items.push(orderId);
    //});
    for (var i = 0; i < orderItems.length; i++) {
        items.push(orderItems[i].Id);
    }


    if (items.length > 0) {
        $.ajax({
            url: mainUrl,
            type: "POST",
            data: { orderIds: items, controller: controller },
            success: function (resp) {


                if (resp.Status) {
                    var buttonToDisplay = [];
                    $("#prePaymentPopup").html("");
                    $("#prePaymentPopup").html(resp.pHtml);
                    if (resp.hideButton) {
                        var buttonToDisplay = [
                            {
                                text: GetResourceText("CANCEL_BTN", "Cancel"),
                                click: function () {

                                    $("#prePaymentPopup").dialog("close");
                                    window.onbeforeunload = null;
                                }
                            }
                        ];
                    } else {
                        buttonToDisplay = [
                            {
                                text: GetResourceText("CONFIRM_BTN", "Confirm"),
                                click: function () {
                                        
                                        var chargetotal = parseFloat($("#chargetotal").val());
                                    if (chargetotal === 0) {
                                            $("#prePaymentPopup").dialog("close");
                                        ShowConfirmationDialog(String.format(GetResourceText("ZEROAMOUNTORDERPROCESSWARNING", "The order will be Processed and marked as ''Paid'' since amount is {0} 0.00"), GetShopCurrency()), GetResourceText("ORDERPROCESSNOEDITWARNING", "You will not be able to edit this order once processed. Do you want to continue?"), function () {
                                                LoadPaymentPage();
                                            }, null, null);
                                        }
                                        else {
                                            var email = $("#customParam_email").val();
                                            var reg = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
                                            if (email != undefined && email.length > 0) {
                                                if (reg.test(email)) {
                                                    window.onbeforeunload = null;
                                                    var url = "/AdyenPayment/LoadPaymentPage";
                                                    var ecomPaymentSessionId = $("#merchantTransactionId").val();

                                                    var form = $('<form action="' + url + '" method="post">' +
                                                        '<input type="text" name="ecomPaymentSessionId" value="' + ecomPaymentSessionId + '" />' +
                                                        '<input type="text" name="email" value="' + email + '" />' +
                                                        '</form>');
                                                    $('body').append(form);
                                                    form.submit();

                                                } else {

                                                    ShowErrorDialog(GetResourceText("ERROR_MESSAGES", "Error messages"),
                                                        GetResourceText("VALID_EMAIL", "Please enter valid e-mail address"),
                                                        null,
                                                        null);
                                                }
                                            } else {
                                                ShowErrorDialog(GetResourceText("ERROR_MESSAGES", "Error messages"),
                                                    GetResourceText("VALID_EMAIL", "Please enter valid e-mail address"),
                                                    null,
                                                    null);
                                            }
                                        }                                        

                                    }
                            },
                            {
                                text: GetResourceText("CANCEL_BTN", "Cancel"),
                                click: function () {
                                    $("#prePaymentPopup").dialog("close");
                                    window.onbeforeunload = null;
                                    window.location.href = cancellationUrl;
                                }
                            }
                        ];

                    }
                    $("#prePaymentPopup").dialog({
                        positionType: "center",
                        modal: true,
                        resizable: false,
                        dialogClass: 'prePaymentDialog',
                        width: 900,
                        title: GetResourceText("PAYMENT_BTN", "Payment"),
                        buttons: buttonToDisplay,
                        closeOnEscape: false

                    }).prev(".ui-dialog-titlebar").find("span.ui-dialog-title").addClass("paymentUiDialogTitle");
                }
            }
        });
    } else {
        alert(GetResourceText("SELECT_ORDER", "Please select an order"));
    }
}




function ProcessPaymentForExpressDelivery(mainUrl, cancellationUrl, controller,expressOrderGuID) {

    window.onbeforeunload = function (e) {
        var message = "Are you sure you want leave?";
        e.returnValue = message;
        return message;
    };


    $.ajax({
        url: mainUrl,
        type: "POST",
        data: { expressOrderGuid: expressOrderGuID, controller: controller },
        success: function (resp) {


            if (resp.Status) {
                var buttonToDisplay = [];
                $("#prePaymentPopup").html("");
                $("#prePaymentPopup").html(resp.pHtml);
                if (resp.hideButton) {
                    var buttonToDisplay = [
                        {
                            text: GetResourceText("CANCEL_BTN", "Cancel"),
                            click: function () {

                                $("#prePaymentPopup").dialog("close");
                                window.onbeforeunload = null;
                            }
                        }
                    ];
                } else {
                    buttonToDisplay = [
                        {
                            text: GetResourceText("CONFIRM_BTN", "Confirm"),
                            click: function () {
                                var email = $("#customParam_email").val();
                                var reg = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
                                if (email != undefined && email.length > 0) {
                                    if (reg.test(email)) {
                                        window.onbeforeunload = null;
                                        var url = "/AdyenPayment/LoadPaymentPage";
                                        var ecomPaymentSessionId = $("#merchantTransactionId").val();

                                        var form = $('<form action="' + url + '" method="post">' +
                                            '<input type="text" name="ecomPaymentSessionId" value="' + ecomPaymentSessionId + '" />' +
                                            '<input type="text" name="email" value="' + email + '" />' +
                                            '</form>');
                                        $('body').append(form);
                                        form.submit();

                                    } else {

                                        ShowErrorDialog(GetResourceText("ERROR_MESSAGES", "Error messages"),
                                            GetResourceText("VALID_EMAIL", "Please enter valid e-mail address"),
                                            null,
                                            null);
                                    }
                                } else {
                                    ShowErrorDialog(GetResourceText("ERROR_MESSAGES", "Error messages"),
                                        GetResourceText("VALID_EMAIL", "Please enter valid e-mail address"),
                                        null,
                                        null);
                                }

                            }
                        },
                        {
                            text: GetResourceText("CANCEL_BTN", "Cancel"),
                            click: function () {
                                $("#prePaymentPopup").dialog("close");
                                window.onbeforeunload = null;
                                window.location.href = cancellationUrl;
                            }
                        }
                    ];

                }
                $("#prePaymentPopup").dialog({
                    positionType: "center",
                    modal: true,
                    resizable: false,
                    width: 800,
                    title: GetResourceText("PAYMENT_BTN", "Payment"),
                    buttons: buttonToDisplay,
                    closeOnEscape: false

                }).prev(".ui-dialog-titlebar").find("span.ui-dialog-title").addClass("paymentUiDialogTitle");
            }
        }
    });
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

function OnCargoBoxSelectionChange(element) {
    $("#labelBoxContent").text('');
    $("#drpCargoBoxId").html('');
    $("#drpCargoBoxId").find('option:selected').html('');
    $("#divExpressOrderDeliveryCostContainer").hide();
    $("#divExpressOrderDeliveryOrdersContainer").hide();
    var elementId = $(element).attr('id');
    var elementValue = $("#" + elementId).val();
    if (elementValue != "") {
        var shopId = $("#ShopId").val();
        var orderShipmentDate = $("#OrderShipmentDate").val();
        var shipToId = $("#ShipToId").val();
        var combinationId = $("#CombinationId").val();
        var orderId = $("#OrderId").val();
        $.ajax({
            type: "GET",
            url: "/CustomOrderOverview/GetCargoBoxList",
            data: { selectedBoxSelection: elementValue, orderShipmentDate: orderShipmentDate, shopId: shopId, shipToId: shipToId, combinationId: combinationId, orderId: orderId },
            success: function (result) {
                if (result.Status == true) {
                    if (result.CargoBoxList != null && result.CargoBoxList != "") {
                        var items = '<option value = "-1"></option>';
                        $.each(result.CargoBoxList, function (i, item) {
                            items += "<option value='" + item.Value + "'>" + item.Text + "</option>";
                        });
                        $("#drpCargoBoxId").html(" ");
                        $("#drpCargoBoxId").html(items);
                        InitializeDropDownWithoutSearchBoxByID("drpCargoBoxId");
                        InitaliseGlobalVariable();
                    }
                } else {
                    var errorMessage = new Array();
                    errorMessage.push(result.message)
                    ShowErrorDialogForMessages(GetResourceText("ERROR_MESSAGES"), errorMessage, null, null);
                }
            }
        });
    }
}

function OnCargoBoxChange(cargoBoxDropdownControl) {
    var cargoBoxDropdownControlId = $(cargoBoxDropdownControl).attr('id');
    var boxId = $("#" + cargoBoxDropdownControlId).val();
    if (boxId != "") {
        var shipToId = $("#ShipToId").val();
        var shopId = $("#ShopId").val();
        var orderShipmentDate = $("#OrderShipmentDate").val();
        var orderId = $("#OrderId").val();
        var selectedBoxSelectionId = $("#drpCargoBoxSelectionId").val();
        if (selectedBoxSelectionId == "1") {
            $("#IsSelectBoxDopdownChange").val(true);
            $("#ExpressOrderGuid").val(boxId);
        }

        $("#divExpressOrderDeliveryCostContainer").html('');
        $.ajax({
            type: "POST",
            url: "/CustomOrderOverview/GetExpressOrderDeliveryDetails",
            data: { boxIdAsString: boxId, shipToId: shipToId, orderShipmentDate: orderShipmentDate, shopId: shopId, orderId: orderId, selectedBoxSelectionId: selectedBoxSelectionId },
            success: function (result) {
                if (result.Status == true) {
                    $("#divExpressOrderDeliveryCostContainer").html(result.ReturnHTML);
                    $("#divExpressOrderDeliveryCostContainer").show();
                    CalculateCost();
                }
            }
        });
    }
}

function GetExpressDeliveryOrders() {
    var combinationIds = new Array();
    $.each($("#drpCombinationSelectionId").find('option:selected'), function (index, element) {
        combinationIds.push($(element).val());
    });
    var shopId = $("#ShopId").val();
    var orderShipmentDate = $("#OrderShipmentDate").val();
    var orderId = $("#OrderId").val();
    var boxId = $("#drpCargoBoxId").val()
    var selectedBoxSelectionId = $("#drpCargoBoxSelectionId").val();
    var combinationIdString = ArrayToString(combinationIds);
    if (selectedBoxSelectionId == "1") {
        $("#IsSelectBoxDopdownChange").val(false);
    }
    $.ajax({
        type: "POST",
        url: "/CustomOrderOverview/GetOrdersWithSameShipmentDate",
        data: { shopId: shopId, boxIdAsString: boxId, orderId: orderId, orderShipmentDate: orderShipmentDate, combinationIds: combinationIdString, selectedBoxSelectionId: selectedBoxSelectionId },
        success: function (result) {
            if (result.Status == true) {
                $("#divExpressOrderDeliveryOrdersContainer").html(result.ReturnHTML);
                $("#divExpressOrderDeliveryOrdersContainer").show();
                CheckAndMarkSelectedCheckBox();
                CalculateCost();
            } else {
                var errorMessage = new Array();
                errorMessage.push(result.message)
                ShowErrorDialogForMessages(GetResourceText("ERROR_MESSAGES"), errorMessage, null, null);
            }
        }
    });
}

function AddRemoveDeliveryDetailsElements(element, isToDisplayWarning) {
    var checkStatus = $(element).is(':checked');
    var selectedBoxSelectionId = $("#drpCargoBoxSelectionId").val();
    if (checkStatus) {
        AddRemoveDeliveryDetailInfo(element, true);
        if (selectedBoxSelectionId == "1" && isToDisplayWarning) {
            ShowInformationDialog(null, GetResourceText("SELECTED_ORDERS_WILL_ASSIGN_NEW_DELIVERY_DATE", "Selected all orders will get assigned with selected new delivery date"), null, null);
        }
    }
    else
        AddRemoveDeliveryDetailInfo(element, false);
    CalculateCost();
}

function AddRemoveOrderElements(element) {
    var checkStatus = $(element).is(':checked');
    if (checkStatus)
        AddRemoveOrderInfo(element, true);
    else
        AddRemoveOrderInfo(element, false);
    CalculateCost();
}

var OrderInfo = function (orderId, combinationId, adminCost, orderShipmentDate, isUrgentOrder) {
    this.OrderId = orderId;
    this.CombinationId = combinationId;
    this.AdminCost = adminCost;
    this.OrderShipmentDate = orderShipmentDate;
    this.IsUrgentOrder = isUrgentOrder;
}
var DeliveryOrderInfo = function (deliveryDayId, expressOrderShipmentDate, deliveryCostPrice, deliveryCostPriceWithOutExchangeRate) {
    this.DeliveryDayId = deliveryDayId;
    this.ExpressOrderShipmentDate = expressOrderShipmentDate;
    this.DeliveryCostPrice = deliveryCostPrice;
    this.DeliveryCostPriceWithOutExchangeRate = deliveryCostPriceWithOutExchangeRate;
}

function AddRemoveOrderInfo(element, isAdd) {
    var orderId = $(element).attr('id').split('_')[1];
    if (isAdd)
        $("#hiddenIsUrgentOrder_" + orderId).val(true);
    else
        $("#hiddenIsUrgentOrder_" + orderId).val(false);
    var combinationId = $("#hiddenCombinationId_" + orderId).val();
    var adminCost = $("#hiddenAdminCost_" + orderId).val();
    var orderShipmentDate = $("#hiddenOrderShipmentDate_" + orderId).val();
    var isUrgentOrder = $("#hiddenIsUrgentOrder_" + orderId).val();
    var orderInfo = new OrderInfo(orderId, combinationId, adminCost, orderShipmentDate, isUrgentOrder);
    if (isAdd) {
        selectedOrders = _.filter(selectedOrders, function (e) {
            return e.OrderId != orderInfo.OrderId;
        })
        selectedOrders.push(orderInfo);
    } else {
        selectedOrders = $.grep(selectedOrders, function (e) {
            return e.OrderId != orderInfo.OrderId;
        });
    }
}


function AddRemoveDeliveryDetailInfo(element, isAdd) {
    var deliveryDayId = $(element).attr('id').split('_')[1];
    var expressOrderShipmentDate = $("#hiddenExpressOrderShipmentDate_" + deliveryDayId).val();
    var deliveryCostPrice = $("#hiddenDeliveryCostPrice_" + deliveryDayId).val();
    var deliveryCostPriceWithOutExchangeRate = $("#hiddenDeliveryCostPriceWithOutExchangeRate_" + deliveryDayId).val();
    if (isAdd)
        deliveryOrderInfo = new DeliveryOrderInfo(deliveryDayId, expressOrderShipmentDate, deliveryCostPrice, deliveryCostPriceWithOutExchangeRate);
    else
        deliveryOrderInfo = {};

    $.each($("#tblExpressOrderDeliveryDayCost").find("input[type=checkbox][id^='Check_']"), function (index, tableCheckBox) {
        if (deliveryDayId != $(tableCheckBox).attr("id").split('_')[1] && $(tableCheckBox).is(':checked')) {
            $(tableCheckBox).prop('checked', false);
        }
    });
}

function CalculateCost() {
    $("#labelTotalAdminCost").html('0.00');
    $("#labelTotalDeliveryCost").html('0.00');

    var totalAdminCost = parseFloat($("#labelTotalAdminCost").html());
    var totalDeliveryCost = parseFloat($("#labelTotalDeliveryCost").html());

    if (isNaN(totalAdminCost))
        totalAdminCost = parseFloat('0.00');

    $.each(selectedOrders, function (i, e) {
        totalAdminCost += parseFloat(e.AdminCost);
    });

    if (!isNaN(totalAdminCost)) {
        totalDeliveryCost += totalAdminCost;
    }

    if (Object.keys(deliveryOrderInfo).length > 0) {
        totalDeliveryCost += parseFloat(deliveryOrderInfo.DeliveryCostPrice);
    }

    $("#labelTotalAdminCost").html(totalAdminCost.toFixed(2));
    $("#labelTotalDeliveryCost").html(totalDeliveryCost.toFixed(2));
}

function OnFastTrackClicked(orderId) {

    var data = { orderId: orderId };

    $.ajax({
        type: "POST",
        url: "/CustomOrderOverview/MarkOrderForFastTrack",
        data: data,
        success: function (result) {

            if (result.Status == true) {


                $("#DivMarkOrderAsFastTrackDialog").html(result.ReturnHTML);
                $("#DivMarkOrderAsFastTrackDialog").dialog({
                    width: '750px',
                    height : '100%',
                    resizable: false,
                    dialogClass: 'bottombuttons',
                    title: GetResourceText('MARK_ORDER_AS_FastTrack', 'Mark order as Fast Track'),
                    modal: true,
                    open: function () {
                    },
                    close: function () {
                        $("#DivMarkOrderAsFastTrackDialog").dialog('destroy').empty();
                    },
                    buttons: [{
                        text: GetResourceText("CONFIRM", "Confirm"),
                        click: function () {
                            MarkOrderAsFastTrack(orderId);
                        }
                    }, {
                        text: GetResourceText("CANCEL", "Cancel"),
                        click: function () {
                            $("#DivMarkOrderAsFastTrackDialog").dialog('destroy').empty();
                        }
                    }]
                });
                $("#DivMarkOrderAsFastTrackDialog").dialog("open");

            } else {
                ShowErrorDialogForMessages(GetResourceText("ERROR_MESSAGES"), result.Errors, null, null);
            }
        },
        error: function (event, jqxhr, settings, thrownError) {
        }
    });
}



function MarkOrderAsFastTrack(orderId) {
    
    
    var phoneNumber = $("#mobileNumber").val();
    var emailAddress = $("#emailAddress").val();
    var contactPerson = $("#contactPerson").val();
    var isError = false;
    var errorMsg = [];
    if (phoneNumber == "" || phoneNumber == null || phoneNumber == undefined) {
        errorMsg.push(GetResourceText("SAVE_CUSTOMER_NUMBER_REQUIRED", "Phone number is required"));
        isError = true;
    } else {
        if (!phoneRegex.test($.trim(phoneNumber))) {
            errorMsg.push(GetResourceText("VALID_NUMBER", "Please enter valid phone number"));
            isError = true;
        }
    }
    if (emailAddress == "" || emailAddress == null || emailAddress == undefined) {
        errorMsg.push(GetResourceText("SAVE_CUSTOMER_EMAIL_REQUIRED", "Contact email is required"));
        isError = true;
    } else {
        if (!emailRegex.test($.trim(emailAddress))) {
            errorMsg.push(GetResourceText("VALID_EMAIL","Please enter valid  contact email address"));
            isError = true;
        }
    }

    if (contactPerson == "" || contactPerson == null || contactPerson == undefined) {
        errorMsg.push(GetResourceText("SAVE_CUSTOMER_CONTACT_PERSON_REQUIRED", "Contact name is required"));       
        isError = true;
    }


    if (!isError) {
        $.ajax({
            type: "POST",
            url: "/CustomOrderOverview/MarkOrderForFastTrackConfirmed",
            data: { orderId: orderId, phoneNumber: phoneNumber.trim(), emailAddress: emailAddress.trim(), contactPerson: contactPerson.trim() },
            success: function (result) {
                if (result.Status == true) {
                    $("#DivMarkOrderAsFastTrackDialog").dialog('destroy').empty();

                    ShowOKDialog(null, result.Message, RefreshOrderOverviewGrid, null);
                }
                else {
                    ShowErrorDialogForMessages(GetResourceText("ERROR_MESSAGES"), result.Errors, null, null);
                }
            },
            error: function (event, jqxhr, settings, thrownError) {
            }
        });
    } else {
        ShowErrorDialogForMessages(GetResourceText("ERROR_MESSAGES"), errorMsg, null, null);
    }
}

function SubmitExpressOrder(isPayNow) {
    if (ValidateUrgentOrder()) {
        var data = {
            OrderShipmentDate: $("#OrderShipmentDate").val(),
            ExpressOrderGuid: $("#ExpressOrderGuid").val(),
            DeliveryOrderInfo: deliveryOrderInfo,
            ExpressOrderInfo: selectedOrders,
            OrderId: $("#OrderId").val(),
            SelectedCargoBoxId: $("#drpCargoBoxId").val(),
            SelectedBoxSelectionId: $("#drpCargoBoxSelectionId").val(),
            BoxQuantity: $("#BoxQuantity").val(),
            ShipToId: $("#ShipToId").val(),
            ShopId: $("#ShopId").val()
        };

        $.ajax({
            type: "POST",
            url: "/CustomOrderOverview/MarkOrderForExpressDelivery",
            data: data,
            success: function (result) {
                if (result.Status == true) {
                    $("#DivMarkOrderAsExpressDeliveryDialog").dialog('close');
                    if (isPayNow != undefined && isPayNow) {
                        ProcessPaymentForExpressDelivery("/CustomOrderOverview/ProcessPaymentForExpressOrder", "/CustomOrderOverview/Index", "CustomOrderOverview", result.expressOrderGuid);
                    }
                    else {
                        ShowOKDialog(null, result.updatedResult, RefreshOrderOverviewGrid, null);
                    }
                } else {
                    ShowErrorDialogForMessages(GetResourceText("ERROR_MESSAGES"), result.updatedResult, null, null);
                }
            },
            error: function (event, jqxhr, settings, thrownError) {
            }
        });
        return true;
    }
}

function ValidateUrgentOrder() {
    var isValid = true;
    var errormsg = new Array();
    var selectedCargoBoxId = $("#drpCargoBoxId").val();
    var selectedBoxSelection = $("#drpCargoBoxSelectionId").val();
    if (selectedBoxSelection == null || selectedBoxSelection == "") {
        errormsg.push(GetResourceText("PLEASE_SELECT_OR_CREATE_BOX", "Please select Create/Select box"));
        isValid = false;
    }

    if (selectedCargoBoxId == null || selectedCargoBoxId == "") {
        errormsg.push(GetResourceText("BOX_IS_NOT_SELECTED_VALIDATION_MESSAGE", "Box is not selected"));
        isValid = false;
    }

    if (selectedBoxSelection == "2") {
        if (Object.keys(deliveryOrderInfo).length == 0) {
            errormsg.push(GetResourceText("DELIVERY_DETAILS_ARE_NOT_SELECTED_VALIDATION_MESSAGE", "Delivery details are not selected"));
            isValid = false;
        }
        if (selectedOrders.length == 0) {
            errormsg.push(GetResourceText("ORDERS_ARE_NOT_SELECTED_VALIDATION_MESSAGE", "No orders are selected"));
            isValid = false;
        }
    }

    if (selectedOrders.length > $("#BoxQuantity").val()) {
        errormsg.push(GetResourceText("ORDERS_EXCEEDED_MAXIMUM_BOX_QUANTITY_VALIDATION_MESSAGE", "Order selection exceeded maximum box quantity"));
        isValid = false;
    }
    if (!isValid)
        ShowErrorDialogForMessages(GetResourceText("ERROR_MESSAGES"), errormsg, null, null);
    return isValid;
}

function CheckAndMarkSelectedCheckBox() {
    var orders = new Array();
    for (var i = 0; i <= selectedOrders.length - 1; i++) {
        var mainOrderId = $("#OrderId").val();
        var selectedOrderId = selectedOrders[i].OrderId;
        if (mainOrderId === selectedOrderId) {
            orders.push(selectedOrders[i]);
        }
        else {
            var checkBoxElement = $("#tblExpressDeliveryOrders").find("input[type=checkbox][id^='CheckElement_" + selectedOrderId + "']");
            if (checkBoxElement.length != 0) {
                $(checkBoxElement).prop('checked', true);
                orders.push(selectedOrders[i]);
            }
        }
    }
    selectedOrders = [];
    selectedOrders = orders;
}

function SelectUrgentOrders(expressOrders) {
    selectedOrders = [];
    MarkMainOrderAsUrgent();
    $.each(expressOrders, function (i, e) {
        if (e.IsUrgentOrder == true) {
            var checkBoxElement = $("#tblExpressDeliveryOrders").find("input[type='checkbox'][id='CheckElement_" + e.OrderId + "']")
            $(checkBoxElement).prop('checked', true);
            AddRemoveOrderElements(checkBoxElement);
        }
    });
}

function SelectDeliveryCost(deliveryCostList, selectedDeliveryDay) {
    $.each(deliveryCostList, function (i, e) {
        if (e.DeliveryDayId == selectedDeliveryDay) {
            var checkBoxElement = $("#tblExpressOrderDeliveryDayCost").find("input[type='checkbox'][id='Check_" + e.DeliveryDayId + "']")
            $(checkBoxElement).prop('checked', true);
            AddRemoveDeliveryDetailsElements(checkBoxElement, false);
        }
    });
}


function MarkMainOrderAsUrgent() {
    var orderId = $("#OrderId").val();
    var checkBoxElement = $("#divMainOrder").find("input[type='checkbox'][id='CheckElement_" + orderId + "']")
    $(checkBoxElement).prop('checked', true);
    AddRemoveOrderElements(checkBoxElement);
}

function InitaliseGlobalVariable() {
    selectedOrders = [];
    deliveryOrderInfo = {};
    MarkMainOrderAsUrgent();
}

function SubmitOrderAsNonExpressDelivery(orderId) {
    $.ajax({
        url: "/CustomOrderOverview/MarkOrderForNonExpressDelivery",
        type: "POST",
        data: { orderId: orderId }
    }).done(function (returnData) {
        if (returnData.Status) {
            ShowOKDialog("", returnData.Message, RefreshOrderOverviewGrid, null);
        } else {
            ShowErrorDialog("Error", returnData.Message, RefreshOrderOverviewGrid, null);
        }
    }).fail(function (jqXHR, textStatus, errorThrown) {
        alert(errorThrown);
    });
}


function ChangeFinancialExposureIndicatorColor() {
    var creditLimit = $.parseFloat($("#MunroCreditLimit").val());
    var financialExposure = $.parseFloat($("#CurrentFinancialExposure").val());
    var selectedOnHoldOrderTotalPPrice = $.parseFloat($("#selectedOnHoldOrderTotalPPrice").val());

    var totalExposure = financialExposure + selectedOnHoldOrderTotalPPrice;

    var exposurePercentage = Math.round((totalExposure / creditLimit * 100));

    //   var color = "green";

    //   if (exposurePercentage > 80 && exposurePercentage < 100)
    //       color = "orange";
    //else if (exposurePercentage >= 100)
    //       color = "red";

    //$("#creditControlIndicator").css("color", color);


    $("#inputOrderLimit").val(exposurePercentage);
    //$("#creditVal").html(exposurePercentage + '%');
    multiColorSliderAdjustPercentageSpanValue("inputOrderLimit", "creditVal");
}

function RoundOfValue(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}
function SetShopRemainingLimitDetails() {
    var creditLimit = parseFloat($("#MunroCreditLimit").val());
    var financialExposure = parseFloat($("#CurrentFinancialExposure").val());
    var selectedOrderTotal = parseFloat($("#selectedOnHoldAndProcessPendingOrderTotalPPrice").val());
    var remainingLimit = RoundOfValue(creditLimit - financialExposure);
    var totalExposure = RoundOfValue(financialExposure + selectedOrderTotal);
    
    var color = (selectedOrderTotal > remainingLimit) ? "#D37467" : null;
    let colorStyle = color ? `color:${color};` : ""; 
    var iconHtml = $("#StoreCreditCurrencyIcon").prop("outerHTML");

    

    $("#ShopRemainingLimitDisplay").html(
        `<span style="${colorStyle} margin-left:10px;">${RoundOfValue(selectedOrderTotal).toFixed(2)}</span> / <span> ${remainingLimit.toFixed(2)}</span> `
    );
    $("#ShopRemainingLimitDisplay").append(iconHtml);


    



}



//######################################### Shop OrderOverview ContextMenu RunTime ##############################################

function ToggleRunTimeContextMenuLoader(currentContextbtnID, entityID, isLoaderShow, isCustomMade) {

    if (isLoaderShow) {
        var contextMenuLoader = document.getElementById('ContextMenuLoader');
        contextMenuLoader.outerHTML = `<button type="button" class='greyborder_button' id="${currentContextbtnID}" onclick='RenderActionMenus(${entityID}, ${isCustomMade})'>Action</button>`;
    } else {
        var button = document.getElementById(currentContextbtnID);
        button.outerHTML = `
		<span id="ContextMenuLoader">
			<img src="../../Content/Images/ContextMenuLoader.gif" width="18" height="18">
		</span>
		`;
    }
}


function showContextMenuRunTime(entityID) {
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


function FetchActionListForContextMenu(url, entityID, isCustomMade) {

    var currentContextMenuListID = `List_1_ContextMenu_${entityID}`

    var currentContextbtnID = `PPAction_${entityID}`

    if ($("#shopOrderOverviewContextMenuContainer ul#" + currentContextMenuListID).length > 0) {

        showContextMenuRunTime(entityID)

    } else {

        ToggleRunTimeContextMenuLoader(currentContextbtnID, entityID, false, isCustomMade)

        $.ajax({
            url: url,
            type: 'POST',
            global: false,
            data: { entityID: entityID },
            success: function (returnData, textStatus, request) {

                ToggleRunTimeContextMenuLoader(currentContextbtnID, entityID, true, isCustomMade)

                if (returnData.Status) {

                    $('#shopOrderOverviewContextMenuContainer').append(returnData.htmlString)

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

                ToggleRunTimeContextMenuLoader(currentContextbtnID, entityID, true, isCustomMade)

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


function RenderActionMenus(entityID, isCustomMade) {

    //console.log("Current Order Overview Type isCustomMade : ", isCustomMade)

    if (isCustomMade) {
        var url = window.location.protocol + "//" + window.location.host + "/CustomOrderOverview/GetContextMenuStringByEntityID";
    }
    else {
        var url = window.location.protocol + "//" + window.location.host + "/ReadyMadeOrderOverview/GetContextMenuStringByEntityID";
    }

    FetchActionListForContextMenu(url, entityID, isCustomMade)

}
