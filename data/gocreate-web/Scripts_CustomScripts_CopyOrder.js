function OnCopyClick(orderID, orderType, copyOrderHeaderText, canHideCopyAllButton, shopType, produtLineInternalName, itemTypeCategory) {
    
    if (shopType == 3) {
        //MOSS Shop
        ValidateOrderFitProfile(orderID, orderType, copyOrderHeaderText, canHideCopyAllButton, shopType, produtLineInternalName, itemTypeCategory, "COPY", false);
    }
    else {
        GetNewGuid(orderID, orderType, copyOrderHeaderText, canHideCopyAllButton, shopType, produtLineInternalName, itemTypeCategory);
    }
       
}

function ValidateOrderFitProfile(orderID, orderType, copyOrderHeaderText, canHideCopyAllButton, shopType, produtLineInternalName, itemTypeCategory, operationType, isCallFromOrderDetail) {

    $.ajax(
        {
            type: "Post",
            url: "/CustomOrderOverview/ValidateOrderFitProfile",
            data: { orderID: orderID },
            success: function (returnData) {
                if (returnData.IsValidOrderFitProfile) {
                    
                    switch (operationType) {
                        case "EDIT":
                            if(isCallFromOrderDetail)
                                ShowMossEditOrderDialog(orderID, produtLineInternalName, orderType);
                            else
                                ShowEditOrderDialogBox(orderID, orderType, shopType, produtLineInternalName, itemTypeCategory);
                            break;
                        case "COPY":
                            //GetNewGuid(orderID, orderType, copyOrderHeaderText, canHideCopyAllButton, shopType, produtLineInternalName, itemTypeCategory);
                            OnMossCopyClick(orderID, orderType, copyOrderHeaderText, canHideCopyAllButton, shopType, produtLineInternalName, itemTypeCategory, returnData.IsValidOrderFitProfile);
                            break;
                        case "CANCELANDREMAKE":
                            CancelAndRemakeOrder(orderID, orderType, produtLineInternalName);
                            break;
                    }
                }
                else {
                    switch (operationType) {
                        case "EDIT":
                            ShowErrorDialogForMessages(returnData.Title, returnData.ErrorMessage, null, null);
                            break;
                        case "COPY":
                            OnMossCopyClick(orderID, orderType, copyOrderHeaderText, canHideCopyAllButton, shopType, produtLineInternalName, itemTypeCategory, returnData.IsValidOrderFitProfile);
                            break;
                        case "CANCELANDREMAKE":
                            CancelAndRemakeOrder(orderID, orderType, produtLineInternalName);
                            break;
                    }

                }
            }
        });
}

function GetNewGuid(orderID, orderType, copyOrderHeaderText, canHideCopyAllButton, shopType, produtLineInternalName, itemTypeCategory) {
    var typeOfOrder = $.parseInt(orderType);
    var url = '';

    if (orderType == 1 && (produtLineInternalName.toUpperCase() == "MTM" || produtLineInternalName.toUpperCase() == "CUSTOMMADE")) {

        //CM Order
        url = "/CustomOrder/CopyOrder";
    }

    else if (orderType == 1 && produtLineInternalName.toUpperCase() == "MTO") {
        //MTO Order
        if (shopType == 3 || shopType == undefined) {
            //MOSS Shop
            url = "/MossBrosOrder/CopyOrder";
        }
        else if (shopType == 7 || shopType == undefined) {
            //MOSS Shop
            url = "/CustomOrder/CopyOrder";
        }
        else {
            //Other Shop
            url = "/MTOOrder/CopyOrder";
        }
    }

    else if (orderType == 1 && produtLineInternalName.toUpperCase() == "DYO") {
        //DYO ORDER
        url = "/DyoOrder/CopyDyoOrder";
    }
    else if (orderType == 2 && produtLineInternalName.toUpperCase() == "DYO") {
        //DYO READYMADE ORDER
        url = "/DyoReadyMadeOrder/CopyDyoOrder";
    }

    else if (orderType == 2 && (produtLineInternalName.toUpperCase() == "MTM" || produtLineInternalName.toUpperCase() == "CUSTOMMADE" || produtLineInternalName.toUpperCase() == "MTO")) {

        //RM order
        url = "/ReadyMadeOrder/CopyOrder";
    }


    $.ajax({
        url: "/CustomOrder/GetNewGuid",
        data: { productLineInternalName: produtLineInternalName.toUpperCase(), itemTypeCategory: itemTypeCategory },
        success: function (guid) {
            var newurl = "";
            if (guid === "" || guid === undefined)
                newurl = url;
            else
                newurl = "/g/" + guid + url;
            $.ajax({
                url: newurl,
                type: "GET",
                dataType: "json",
                data: { orderID: orderID, isCancelledAndRemakeOrder: canHideCopyAllButton }
            }).done(function (returnData) {
                if (returnData.status) {
                    if (produtLineInternalName.toUpperCase() == "DYO") {
                        PerformCopySkipingSelectionDialog(orderID, orderType, produtLineInternalName);
                    }
                    else if (typeOfOrder == 1 && produtLineInternalName.toUpperCase() == "MTO") {

                        //if (shopType == 3)
                        {
                            if (canHideCopyAllButton != undefined && canHideCopyAllButton == 1) {
                                ShowCopyDlgWithoutCancel(returnData.Msg, GetResourceText("BODYMEASUREMENT_CALCULATOR_TITLE", ""));
                            } else {
                                MossBrossShowCopyDlgWithExtraButton(returnData.Msg, GetResourceText("BODYMEASUREMENT_CALCULATOR_TITLE", ""));
                            }
                        }
                    } else if (typeOfOrder == 1 && (produtLineInternalName.toUpperCase() == "MTM" || produtLineInternalName.toUpperCase() == "CUSTOMMADE")) {
                        if (canHideCopyAllButton != undefined && canHideCopyAllButton == 1) {
                            ShowCopyDlgWithoutCancel(returnData.Msg, GetResourceText("BODYMEASUREMENT_CALCULATOR_TITLE", ""));
                        } else {
                            ShowCopyDlgWithExtraButton(returnData.Msg, GetResourceText("BODYMEASUREMENT_CALCULATOR_TITLE", ""));
                        }
                    } else if (typeOfOrder == 2 && (produtLineInternalName.toUpperCase() == "MTM" || produtLineInternalName.toUpperCase() == "CUSTOMMADE" || produtLineInternalName.toUpperCase() == "MTO")) {
                        ShowCopyDlg(returnData.Msg, GetResourceText("BODYMEASUREMENT_CALCULATOR_TITLE", ""));
                    }
                } else {
                    ShowErrorDialogForMessages(GetResourceText("ERROR_MESSAGES"), returnData.ErrMsg, null, null);
                }
            }).fail(function () {

            });
        }
    });
}

var duplicateOrderButtons = {};

function OnDuplicateClick(orderID) {
    $.get("/OrderDetail/GetDuplicateOrder", { "orderID": orderID }, function (data) {
        $("#DivDuplicateOrderDialog").html("");
        if (data != undefined && data.status == false) {
            var errormsg = new Array();
            errormsg.push(data.message);
            ShowErrorDialogForMessages("Error(s)", errormsg, null, null);
        } else {
            $("#DivDuplicateOrderDialog").html(data);
            var isCustomOwnFabric = parseBool($("#IsCustomerOwnFabricOrder").val());
            var canProcessOrder = parseBool($("#CanProcessOrder").val());
            var isCreditLimitExceeded = parseBool($("#IsCreditLimitExceeded").val());
            var poMandatoryFor = $("#POMandatoryFor").val();
            
            if (!isCustomOwnFabric && canProcessOrder && !(poMandatoryFor == 'Both' || poMandatoryFor == 'CM') && !isCreditLimitExceeded) {

                    var processButtonText = GetResourceText("PROCESSED", "Processed");

                if ($("#IsDraftFitProfile").val() == 'True') {
                    processButtonText = $("#ProcessButtonText").val();
                }

                duplicateOrderButtons = [
                    {
                        text: GetResourceText("ON_HOLD", "on hold"),
                        click: function() {
                            OnHoldDuplicateOrder();
                        }
                    },
                    {
                        text: processButtonText,
                        click: function() {
                            ProcessedDuplicateOrder();
                        }
                    },
                    {
                        text: GetResourceText("CANCEL", "Cancel"),
                        click: function() {
                            CloseDuplicateOrderDialog();
                            RefreshOrderOverviewGrid();
                        }
                    }
                    ];
                
            } else {
                
                duplicateOrderButtons = [
                    {
                        text: GetResourceText("ON_HOLD", "on hold"),
                        click: function() {
                            OnHoldDuplicateOrder();
                        }
                    },
                    {
                        text: GetResourceText("CANCEL", "Cancel"),
                        click: function() {
                            CloseDuplicateOrderDialog();
                            RefreshOrderOverviewGrid();
                        }
                    }
                ];
                
            }



            $("#DivDuplicateOrderDialog").dialog({
                width: '490px !important',
                height: 'auto',
                resizable: false,
                dialogClass: 'bottombuttons',
                title: 'Duplicate Order',
                modal: true,
                open: function () {
                    $(".ui-dialog-titlebar-close").hide();
                },
                buttons: duplicateOrderButtons
            });
        }
    });
}

function OnHoldDuplicateOrder() {
    var validate = ValidateNoOfOrders();
    if (validate) {
        SubmitDuplicateOrderData(false);
    }
}

function ProcessedDuplicateOrder() {
    var validate = ValidateNoOfOrders();
    if (validate) {
        SubmitDuplicateOrderData(true);
    }
}

function CloseDuplicateOrderDialog() {
    $("#DivDuplicateOrderDialog").dialog('close');
}

function ValidateNoOfOrders() {
    var isTailorMandetory = parseBool($("#IsTailorMandetory").val());
    var salesPersonId = parseInt($("#SalesPersonID").val());
    var quantity = parseInt($("#OrderQuantity").val());

    if (isTailorMandetory === true && salesPersonId === -1) {
        alert("Please select tailor");
        return false;
    }
    else if (!(quantity < 6 && quantity > 0) || isNaN(quantity)) {
        alert("please enter quantity of order in between 1 to 5");
        return false;
    }
    else {
        return true;
    }
    return false;
}

function SubmitDuplicateOrderData(isProcess) {
    $("#IsProcess").val(isProcess);
    var options = { success: DuplicateOrderOkClick };//datatype:"json" remove to remove error
    $("#DuplicateOrderForm").ajaxForm(options);
    $("#DuplicateOrderForm").submit();
}

function DuplicateOrderOkClick(data) {
    if (data.Status == true) {
        $("#DivDuplicateOrderDialog").dialog('close');


        var msgBoxData = {
            positionType: "center",
            modal: true,
            resizable: false,
            title: "",
            closeOnEscape: false,
            open: function () {
                $(".ui-dialog-buttonset").hide();
            }
          
        };

        ShowDialog("", data.MessageHtml, msgBoxData);
    } else {
        ShowErrorDialog("", data.MessageHtml, null, null);
    }
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


function PerformCopySkipingSelectionDialog(orderId, orderType, produtLineInternalName) {
    ShowSpinner();
    var typeOfOrder = $.parseInt(orderType);
    var url = '';
    if (typeOfOrder === 1 && produtLineInternalName.toUpperCase() == "DYO") {
        url = "/DyoOrder/CopyCustomMadeOrder/?orderID=" + orderId + "";
    }
    else if (typeOfOrder === 2 && produtLineInternalName.toUpperCase() == "DYO") {
        url = "/DyoReadyMadeOrder/CopyReadymadeOrder/?orderID=" + orderId + "";
    }
    RedirectToLocation(url);
}

$(window).resize(function () {
    $('.ui-dialog').css({ 'left': "35%" });
    $('.ui-dialog').css({ 'top': "30%" });
});

function OnRemakeClick(orderID, orderType) {
    var typeOfOrder = $.parseInt(orderType);
    var url = '';
    if (typeOfOrder == 1) {
        url = "/CustomOrder/CopyOrder";
    }
    else if (typeOfOrder == 2) {
        url = "/ReadyMadeOrder/CopyOrder";
    }
    $.ajax({
        url: url,
        type: "GET",
        dataType: "json",
        data: { orderID: orderID, isCancelledAndRemakeOrder: true }
    }).done(function (returnData) {
        if (returnData.status) {
            ShowCopyDlgWithoutCancel(returnData.Msg, GetResourceText("BODYMEASUREMENT_CALCULATOR_TITLE", ""));
        }

        else {
            ShowErrorDialogForMessages(GetResourceText("ERROR_MESSAGES"), returnData.ErrMsg, null, null);
        }
    }).fail(function () {

    });

}

function ShowDlg(returnData, copyOrderHeaderText) {
    var msgBoxData = {
        modal: true,
        title: copyOrderHeaderText,
        width: 'auto',
        height: 'auto',
        resizable: false,
        buttons: [
            {
                text: GetResourceText("OK", "Ok"),
                click: function () {
                    CopyOrderSubmit();
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
            }]
        //,
        //close: function (event, ui) {
        //    try {
        //        if (typeof dialogClose != 'undefined')
        //            dialogClose();
        //    } catch (err) {
        //    }
        //}
    };

    ShowDialog(copyOrderHeaderText, returnData, msgBoxData);
}

function ShowCopyDlgWithoutCancel(returnData, copyOrderHeaderText) {
    var msgBoxData = {
        modal: true,
        title: copyOrderHeaderText,
        width: 'auto',
        height: 'auto',
        resizable: false,
        closeOnEscape: false,
        buttons: [
               {
                   text: GetResourceText("COPY_SELECTED", "Copy selected"),
                   click: function () {
                       CopyOrderSubmit();
                   }
               }
        ]
    };

    ShowDialog(copyOrderHeaderText, returnData, msgBoxData);
}

function ShowCopyDlg(returnData, copyOrderHeaderText) {
    var msgBoxData = {
        modal: true,
        title: copyOrderHeaderText,
        width: 'auto',
        height: 'auto',
        resizable: false,
        buttons: [
               {
                   text: GetResourceText("COPY_SELECTED", "Copy selected"),
                   click: function () {
                       CopyOrderSubmit();
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
            }

        ]
    };

    ShowDialog(copyOrderHeaderText, returnData, msgBoxData);
}

function MossBrossShowCopyDlgWithExtraButton(returnData, copyOrderHeaderText) {
    var msgBoxData = {
        modal: true,
        title: copyOrderHeaderText,
        width: 'auto',
        height: 'auto',
        resizable: false,
        buttons: [
            {
                text: GetResourceText("COPY_SELECTED", "Copy selected"),
                click: function () {
                    CopyOrderSubmit();
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
            }

        ]
    };

    ShowDialog(copyOrderHeaderText, returnData, msgBoxData);
}
function SendSelectedProductPartForRemakeOrder(orderID, typeOfOrder, Message, canHideCopyAllButton, produtLineInternalName) {

    var selectedProductCombination = new Array();
    var checkboxes = $("#DivSelectCombinationForRemake").find("input[type='radio']");
    for (var index = 0; index < checkboxes.length; index++) {
        if ($(checkboxes[index]).is(":checked")) {
            selectedProductCombination.push($.parseInt($(checkboxes[index]).val()));
        }

    } 
    selectedProductCombination = JSON.stringify(selectedProductCombination);
    $.ajax(
     {
         type: "GET",
         dataType: "json",
         url: "/QualityIssue/GetValidationOfProductCombinationForQualityIssueRemakeOrder",// "QualityIssue/GetProductPartsFromProductCombinationForOrder",
         data: { orderId: orderID, selectedProductCombination: selectedProductCombination },
         success: function (data) {
             if (data != undefined) {
                 if (data.Status) {
                     //ShowSpinner();
                     //CopyOrderSubmit();
                     $("#DivSelectCombinationForRemake").dialog('close');

                     if (typeOfOrder == 1) {
                         if (produtLineInternalName.toUpperCase() == "DYO") {
                             PerformCopySkipingSelectionDialog(orderID, typeOfOrder, produtLineInternalName);
                         }
                         else {
                             ShowCopyDlgWithExtraButton(Message, GetResourceText("BODYMEASUREMENT_CALCULATOR_TITLE", ""));
                         }


                     } else if (typeOfOrder == 2) {

                         if (produtLineInternalName.toUpperCase() == "DYO") {
                             PerformCopySkipingSelectionDialog(orderID, typeOfOrder, produtLineInternalName);
                         } else {
                             ShowCopyDlg(Message, GetResourceText("BODYMEASUREMENT_CALCULATOR_TITLE", ""));
                         }

                     }
                     else if (typeOfOrder == 6 || typeOfOrder == 7 || typeOfOrder == 9) {

                         PerformCopySkipingSelectionDialog(orderID, typeOfOrder, produtLineInternalName);

                     }
                     else if (typeOfOrder == 5) {
                         if (canHideCopyAllButton != undefined && canHideCopyAllButton == 1) {
                             ShowCopyDlgWithoutCancel(Message, GetResourceText("BODYMEASUREMENT_CALCULATOR_TITLE", ""));
                         } else {
                             MossBrossShowCopyDlgWithExtraButton(Message, GetResourceText("BODYMEASUREMENT_CALCULATOR_TITLE", ""));
                         }
                     }

                     $("#SelectAllComponents").prop("checked", true);
                     $("#SelectAllComponents").trigger("onclick");
                     //$("#tblCopyComponents").parents().find('.ui-dialog').eq(1).hide();
                     //$("#frmCopyOrder").submit();
                 } else {
                     ShowOKDialog("Error", data.Message, null, null);
                 }
             } else {
                 alert("Some error has occured. Please try again later.");
             }
         }
     });


}


function SendSelectedProductPartForIMRemakeOrder(orderID, typeOfOrder, Message, canHideCopyAllButton, produtLineInternalName, selectedProductCombination) {

    $.ajax(
        {
            type: "GET",
            dataType: "json",
            url: "/IssueModule/GetValidationOfProductCombinationForQualityIssueRemakeOrder",// "QualityIssue/GetProductPartsFromProductCombinationForOrder",
            data: { orderId: orderID, selectedProductCombination: selectedProductCombination },
            success: function (data) {
                if (data != undefined) {
                    if (data.Status) {
                        //ShowSpinner();
                        //CopyOrderSubmit();
                        //$("#DivSelectCombinationForRemake").dialog('close');

                        if (typeOfOrder == 1) {
                            if (produtLineInternalName.toUpperCase() == "DYO") {
                                PerformCopySkipingSelectionDialog(orderID, typeOfOrder, produtLineInternalName);
                            }
                            else {
                                ShowCopyDlgWithExtraButton(Message, GetResourceText("BODYMEASUREMENT_CALCULATOR_TITLE", ""));
                            }


                        } else if (typeOfOrder == 2) {

                            if (produtLineInternalName.toUpperCase() == "DYO") {
                                PerformCopySkipingSelectionDialog(orderID, typeOfOrder, produtLineInternalName);
                            } else {
                                ShowCopyDlg(Message, GetResourceText("BODYMEASUREMENT_CALCULATOR_TITLE", ""));
                            }

                        }
                        else if (typeOfOrder == 6 || typeOfOrder == 7 || typeOfOrder == 9) {

                            PerformCopySkipingSelectionDialog(orderID, typeOfOrder, produtLineInternalName);

                        }
                        else if (typeOfOrder == 5) {
                            if (canHideCopyAllButton != undefined && canHideCopyAllButton == 1) {
                                ShowCopyDlgWithoutCancel(Message, GetResourceText("BODYMEASUREMENT_CALCULATOR_TITLE", ""));
                            } else {
                                MossBrossShowCopyDlgWithExtraButton(Message, GetResourceText("BODYMEASUREMENT_CALCULATOR_TITLE", ""));
                            }
                        }

                        $("#SelectAllComponents").prop("checked", true);
                        $("#SelectAllComponents").trigger("onclick");
                        //$("#tblCopyComponents").parents().find('.ui-dialog').eq(1).hide();
                        //$("#frmCopyOrder").submit();
                    } else {
                        ShowOKDialog("Error", data.Message, null, null);
                    }
                } else {
                    alert("Some error has occured. Please try again later.");
                }
            }
        });


}

function validateCombinationSelections() {
    var isAnyCheckboxChecked = false;

    var checkboxes = $("#TableProductParts").find("input[type='radio']");
    for (var index = 0; index < checkboxes.length; index++) {
        if ($(checkboxes[index]).is(":checked"))
            isAnyCheckboxChecked = true;
    }

    return isAnyCheckboxChecked;
}
function ShowRemakeProductCombinationDialog(orderID, typeOfOrder, Message, canHideCopyAllButton, produtLineInternalName) {

    $("#DivSelectCombinationForRemake").dialog({
        width: 530,
        height: 800,
        resizable: false,
        dialogClass: 'bottombuttons',
        title: 'Remake - Select Combination',
        modal: true,
        open: function () {

        },

        buttons: [
            {
                text: GetResourceText("OK", "Ok"),
                click: function () {
                    try {                       
                            if (validateCombinationSelections()) {
                                SendSelectedProductPartForRemakeOrder(orderID,
                                    typeOfOrder,
                                    Message,
                                    canHideCopyAllButton,
                                    produtLineInternalName);

                            } else {
                                alert("Please select at least one checkbox");
                            }
                        
                    } catch (err) {
                    }
                }
            },
            {
                text: GetResourceText("CANCEL", "Cancel"),
                click: function () {

                    try {

                        $("#DivSelectCombinationForRemake").dialog('close');

                    } catch (err) {
                    }
                }
            }
        ]
    });

}

function ShowIssueModuleRemakeProductCombinationDialog(orderID, typeOfOrder, Message, canHideCopyAllButton, produtLineInternalName, selectedProductCombination) {

    $("#DivSelectCombinationForRemake").dialog({
        width: 530,
        height: 800,
        resizable: false,
        dialogClass: 'bottombuttons',
        title: 'Remake - Select Combination',
        modal: true,
        open: function () {

        },

        buttons: [
            {
                text: GetResourceText("OK", "Ok"),
                click: function () {
                    try {
                        
                           SendSelectedProductPartForIMRemakeOrder(orderID,
                                typeOfOrder,
                                Message,
                                canHideCopyAllButton,
                                produtLineInternalName, selectedProductCombination);

                        

                    } catch (err) {
                    }
                }
            },
            {
                text: GetResourceText("CANCEL", "Cancel"),
                click: function () {

                    try {

                        $("#DivSelectCombinationForRemake").dialog('close');

                    } catch (err) {
                    }
                }
            }
        ]
    });

}


function ShowCopyDlgWithExtraButton(returnData, copyOrderHeaderText) {
    var msgBoxData = {
        modal: true,
        title: copyOrderHeaderText,
        resizable: false,
        buttons: [
              {
                  text: GetResourceText("CANCEL_AND_FINAL", "Copy all and go to finalize screen"),
                  click: function () {
                      CopyEachComponentAndSubmit();
                  }
              },
            {
                text: GetResourceText("COPY_SELECTED", "Copy selected"),
                click: function () {
                    CopyOrderSubmit();
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
            }

        ]
    };

    ShowDialog(copyOrderHeaderText, returnData, msgBoxData);
}
function CopyOrderSubmit() {
    //if (IsCopyOrderComponentFormValid()) {
    ShowSpinner();
    $("#frmCopyOrder").submit();
    //}
}
var dialogClose = function () {
    $("#msgbx").dialog('close');
};

function OnEditOrderClick(orderID, orderType, shopType, produtLineInternalName, itemTypeCategory, isCallFromOrderDetail) {

    

    if (shopType == 3) {
        //MOSS Shop
        ValidateOrderFitProfile(orderID, orderType, "", "", shopType, produtLineInternalName, itemTypeCategory, "EDIT", isCallFromOrderDetail);
    }
    else {
        ShowEditOrderDialogBox(orderID, orderType, shopType, produtLineInternalName, itemTypeCategory);
    }
}

function ShowEditOrderDialogBox(orderID, orderType, shopType, produtLineInternalName, itemTypeCategory) {


    var messageCode = (orderType === 1 && shopType == 3 && produtLineInternalName.toUpperCase() == "MTO") ? "MOSS_ORDER_EDIT_MESSAGES" : "ORDER_EDIT_MESSAGES";

    var editOrderMessage = GetResourceText(messageCode,
        "You can edit your order until 4:00 pm CET the same day");

    $.ajax({
        url: "/OrderDetail/GetEditOrderWarning2Message",
        type: "GET",
        dataType: "json",
        data: { orderId: orderID }

    }).done(function (returnData) {

        if (returnData.UserSupressEditOrderWarning) {
            var typeOfOrder = $.parseInt(orderType);
            var url = '';

            if (typeOfOrder === 1 && (produtLineInternalName.toUpperCase() == "MTM" || produtLineInternalName.toUpperCase() == "CUSTOMMADE" || produtLineInternalName.toUpperCase() == "MTO")) {
                url = "/CustomOrder/GetEditOrderDialog";
            }
            else if (typeOfOrder === 2 && (produtLineInternalName.toUpperCase() == "MTM" || produtLineInternalName.toUpperCase() == "CUSTOMMADE" || produtLineInternalName.toUpperCase() == "MTO")) {
                url = "/ReadyMadeOrder/GetEditOrderDialog";
            }

            if (shopType == 3 && typeOfOrder == 1 && produtLineInternalName.toUpperCase() == "MTO") {
                url = "/CustomOrder/GetEditOrderDialog"
            }

            $.ajax({
                url: url,
                type: "GET",
                dataType: "json",
                data: { orderId: orderID, userSpressEditOrderWarning: false }
            }).done(function (returnData) {
                if (returnData.status) {
                    if (returnData.isMossOrder || returnData.isMTOOrder) {
                        $(document).off('ajaxStop');
                        if (returnData.isMossOrder) {
                            $.ajax({
                                url: "/CustomOrder/GetNewGuid",
                                type: "GET",
                                data: { productLineInternalName: produtLineInternalName.toUpperCase(), itemTypeCategory: itemTypeCategory },
                                success: function (guid) {
                                    var newUrl = "";
                                    if (guid === "" || guid === undefined)
                                        newUrl = returnData.redirectUrl;
                                    else
                                        newUrl = "/g/" + guid + returnData.redirectUrl;
                                    RedirectToLocation(newUrl);
                                }
                            });
                        } else
                            RedirectToLocation(returnData.redirectUrl);

                    } else {
                        ShowEditDlg(returnData);
                    }
                } else {
                    ShowErrorDialogForMessages(GetResourceText("ERROR_MESSAGES"), returnData.ErrMsg, null, null);
                }
            }).fail(function () {

            });
        } else {
            if (returnData.ShowEditWarningMsg) {

                var code = (orderType === 1 && produtLineInternalName.toUpperCase() == "MTO") ? "MOSS_ORDER_EDIT_JUST_BEFORE_PRODUCTION" : "ORDER_EDIT_JUST_BEFORE_PRODUCTION";

                editOrderMessage = GetResourceText(code);
            }
            ShowEditOrderDialogBoxCallback(orderID, orderType, editOrderMessage, produtLineInternalName, shopType);
        }
    }).fail(function () {

    });

}

function ShowEditOrderDialogBoxCallback(orderID, orderType, editOrderMessage, produtLineInternalName, shopType) {


    var typeOfOrder = $.parseInt(orderType);
    var url = '';
    if (typeOfOrder === 1 && (produtLineInternalName.toUpperCase() == "MTM" || produtLineInternalName.toUpperCase() == "CUSTOMMADE" || produtLineInternalName.toUpperCase() == "MTO")) {
       url = "/CustomOrder/GetEditOrderDialog";      
    }
    else if (typeOfOrder === 2 && (produtLineInternalName.toUpperCase() == "MTM" || produtLineInternalName.toUpperCase() == "CUSTOMMADE" || produtLineInternalName.toUpperCase() == "MTO")) {
        url = "/ReadyMadeOrder/GetEditOrderDialog";
    }

    ShowEditOKDialog("", editOrderMessage, function () {
        $.ajax({
            url: url,
            type: "GET",
            dataType: "json",
            data: { orderId: orderID, userSpressEditOrderWarning: $("#chkEditOrderSupress").is(':checked') }
        }).done(function (returnData) {     
            if (returnData.status) {
                    if (returnData.isMossOrder || returnData.isMTOOrder)
                {
                    $(document).off('ajaxStop');
                    RedirectToLocation(returnData.redirectUrl);

                } else {
                    ShowEditDlg(returnData);
                }
            } else {
                ShowErrorDialogForMessages(GetResourceText("ERROR_MESSAGES"), returnData.ErrMsg, null, null);
            }
        }).fail(function () {

        });
    });

}

function ShowEditOKDialog(headerText, messageText, okClick, dialogClose) {

    var msgBoxData = {
        positionType: "center",
        modal: true,
        resizable: false,
        width: 'auto',
        title: headerText,
        buttons: [
            {
                text: GetResourceText("OK", "Ok"),
                click: function () {
                    try {
                        if (typeof okClick != 'undefined')
                            okClick();
                    } catch (err) {
                    }
                    $("#msgbxWithCheckBox").dialog('close');
                }
            }],
        close: function (event, ui) {
            try {
                if (typeof dialogClose != 'undefined') {
                    dialogClose();
                }

                //
            } catch (err) {
            }
        }
    };
    ShowCheckBoxDialog(headerText, messageText, msgBoxData);
}


function ShowCheckBoxDialog(headerText, messageText, dialogOptions) {
    //If there is some message only then show the dialog
    if (messageText != null && MessageTextIsNotEmpty(messageText)) {
        $("#msgbxMessageWithCheckBox").html(messageText);
        //$("#msgbx").attr("title", headerText);        //Commented to fix issue with hover on pop-up shows this title everwhere
        $("#msgbxWithCheckBox").dialog(dialogOptions);
        $(".ui-dialog-titlebar").show();
    }
}

function ShowEditDlg(returnData) {
    var msgBoxData = {
        modal: true,
        title: "",
        width: 'auto',
        resizable: false,
        buttons: [

            {
                text: GetResourceText("CANCEL", "Cancel"),
                click: function () {
                    try {
                        if (typeof dialogClose != 'undefined') {
                            dialogClose();
                        }

                    } catch (err) {
                    }
                }
            }]

    };

    ShowDialog("", returnData.Msg, msgBoxData);
}

function ShowAddRemarkDialogBox(orderID) {
    $.get("/OrderDetail/GetRemarkForOrder", { "orderID": orderID }, function (data) {
        $("#DivAddRemarkDialog").html("");
        if (data != undefined && data.status == false) {
            var errormsg = new Array();
            errormsg.push(data.message);
            ShowErrorDialogForMessages("Error(s)", errormsg, null, null);
        } else {
            $("#DivAddRemarkDialog").html(data);
            $("#DivAddRemarkDialog").dialog({
                width: 'auto',
                height: 'auto',
                resizable: false,
                dialogClass: 'bottombuttons',
                title: GetResourceText('AddRemark'),
                modal: true,
                open: function () {
                    // $(".ui-dialog-titlebar-close").hide();
                },

                buttons: [
                    {
                        text: GetResourceText("SAVE", "Save"),
                        click: function () {
                            try {
                                AddRemarkForOrder();   
                            } catch (err) {
                            }
                        }
                    }, {
                        text: GetResourceText("CANCEL", "Cancel"),
                        click: function () {
                            try {
                                $("#DivAddRemarkDialog").dialog('close');
                                window.location.reload();
                            } catch (err) {
                            }
                        }
                    }
                ]
            });
        }
    });

}

function AddRemarkForOrder() {
    var options = { success: isRemarkFororderSaved, };//datatype:"json" remove to remove error
    $("#OrderRemarkForm").ajaxForm(options);
    $("#OrderRemarkForm").submit();
}

function isRemarkFororderSaved(data) {
    if (data.Status == true) {
        $("#DivAddRemarkDialog").dialog('close');
        ShowOKDialog("", data.MessageHtml, null, null);
        window.location.reload();
    } else {
        ShowErrorDialog(GetResourceText("ERROR_MESSAGES", "Error messages"), data.MessageHtml, null, null);
    }
}

function OnCancellationAndRemakeClick(orderId, orderType, produtLineInternalName, shopType) {
    // shop type = 3 Moss shops as Cancel and remake is only for Moss shops
    if(shopType == 3)
        ValidateOrderFitProfile(orderId, orderType, "", "", shopType, produtLineInternalName, "", "CANCELANDREMAKE", false);
    else
        CancelAndRemakeOrder(orderId, orderType, produtLineInternalName);
}

function CancelAndRemakeOrder(orderId, orderType, produtLineInternalName) {

    $('.context-menu-list').trigger('contextmenu:hide');
    var url = "/CustomOrderOverview/UpdateOrderStatusToCancellationAndRemake";
    if ((orderType == 2 && (produtLineInternalName.toUpperCase() == "MTM" || produtLineInternalName.toUpperCase() == "CUSTOMMADE")) || (orderType == 2 && produtLineInternalName.toUpperCase() == "DYO")) {
        url = "/ReadymadeOrderOverview/UpdateOrderStatusToCancellationAndRemake";
    }
    ShowConfirmationDialog("", GetResourceText("CANCEL_AND_REMAKE_CONFIRMATION_MESSAGE", "Are you sure you want to cancel and remake order?"), function () {
        $.ajax({
            url: url,
            type: "GET",
            data: { orderId: orderId }

        }).done(function (returnData) {
            if (returnData.Status) {
                $("#DivCancelAndRemakeDialog").html(returnData.ReturnHTML);
                $("#DivCancelAndRemakeDialog").dialog({
                    width: 'auto',
                    resizable: false,
                    dialogClass: 'bottombuttons',
                    title: GetResourceText('CANCEL_REMAKE_REMARK_TITLE'),
                    modal: true,
                    open: function () {
                    },
                    close: function () {
                        $("#DivCancelAndRemakeDialog").dialog('destroy').empty();
                    },
                    buttons: [
                        {
                            text: GetResourceText("SAVE", "Save"),
                            click: function () {
                                try {
                                    ValidateAndMarkOrderCancelRemake(orderId);
                                } catch (err) {
                                }
                            }
                        }, {
                            text: GetResourceText("CANCEL", "Cancel"),
                            click: function () {
                                try {
                                    $("#DivCancelAndRemakeDialog").dialog('destroy').empty();
                                } catch (err) {
                                }
                            }
                        }
                    ]
                });
                $("#DivCancelAndRemakeDialog").dialog("open");
            } else {
                if (returnData.ReturnHTML && returnData.ReturnHTML.length > 0) {
                    ShowErrorDialog("Error", returnData.ReturnHTML, null, null);
                }
                else if (returnData.Message && returnData.Message.length > 0) {
                    ShowErrorDialog("Error", returnData.Message, null, null);
                } else {
                    ShowErrorDialog("Error", "Some error occurred, please contact administrator", null, null);
                }
            }
        }).fail(function (jqXHR, textStatus, errorThrown) {
            alert(errorThrown);
        });
    }, null, null);
}

function ValidateAndMarkOrderCancelRemake() {
    if (ValidateRemakeOrder()) {
        $("#FrmCancelAndRemake").submit();
        return true;
    }
}

function ValidateRemakeOrder() {
    var errors = new Array();
    var causedBy = $("#FaultById").val();
    if (causedBy <= 0) {
        errors.push(GetResourceText("CAUSED_MANDATORY", "Please select value from caused by"));
    }
    var items = $("#selectedProductPartIds").find('option:selected');
    if (items.length == 0) {
        errors.push(GetResourceText("ITEM_MANDATORY", "Please select value from items"));
    }

    var primaryReasonDropdowns = $("select[id^=SelectedReason]:visible");
    if (primaryReasonDropdowns) {
        var primaryReasonErrorFound = false;
        $.each(primaryReasonDropdowns, function (i, primaryReasonDropdown) {
            if (!primaryReasonErrorFound) {
                var value = $(primaryReasonDropdown).val();
                if (value <= 0) {
                    primaryReasonErrorFound = true;
                }
            }
        });
        if (primaryReasonErrorFound) {
            errors.push(GetResourceText("PRIMARY_REASON_MANDATORY", "Please select primary reason"));
        }
    }

    var secondaryReasonDropdowns = $("select[id^=SelectedSecondary]:visible");
    if (secondaryReasonDropdowns) {
        var secondaryReasonErrorFound = false;
        $.each(secondaryReasonDropdowns, function (i, secondaryReasonDropdown) {
            if (!secondaryReasonErrorFound) {
                var value = $(secondaryReasonDropdown).val();
                if (value <= 0) {
                    secondaryReasonErrorFound = true;
                }
            }
        });
        if (secondaryReasonErrorFound) {
            errors.push(GetResourceText("SECONDARY_REASON_MANDATORY", "Please select secondary reason"));
        }
    }

    var remarkInputs = $("textarea[id$=CancellationRemarks]:visible");
    if (remarkInputs) {
        var remarkErrorFound = false;
        $.each(remarkInputs, function (i, remarkInput) {
            if (!remarkErrorFound) {
                var value = $(remarkInput).val();
                if (!value || value.length <= 20) {
                    remarkErrorFound = true;
                }
            }
        });
        if (remarkErrorFound) {
            errors.push(GetResourceText("REMARK_MANDATORY", "Please enter min. 20 character in remark"));
        }
    }

    if (errors.length > 0) {
        $("#DivCancelAndRemakeError").show();
        var html = "<ul>";
        for (var err in errors) {
            html += "<li>" + errors[err] + "</li>";
        }
        html += "</ul>";
        $("#DivCancelAndRemakeError").html(html);
        return false;
    } else {
        $("#DivCancelAndRemakeError").hide();
        return true;
    }
}

function OnCancelAndRemakeFormSuccess(data) {
    if (data.Status == true) {
        $("#DivCancelAndRemakeDialog").dialog('close');        
        OnCopyClick(data.OrderId, data.orderType, "", true, data.ShopTypeIndicator, data.ProductLineInternalName, data.ItemTypeCategory);
    }
    else if (data.Status == false && data.isShowErrorMessage == true) {
        if (data.ErrMessage != null && data.ErrMessage.length > 0) {
            $("#DivCancelAndRemakeError").show();
            var html = "<ul>";
            for (var err in data.ErrMessage) {
                html += "<li>" + data.ErrMessage[err] + "</li>";
            }
            html += "</ul>";
            $("#DivCancelAndRemakeError").html(html);
            return false;
        }
    }
    else if (data.Status == false && data.isShowErrorMessage == false && data.ReturnHTML != undefined) {
        $("#DivCancelAndRemakeError").show();
        $("#DivCancelAndRemakeError").html(data.ReturnHTML);
        return false;
    }
}

function OnCancelAndRemakeFormFailure(parameters) {
    alert("Some error occurred.Please contact account manager");
}
//----------------------------**Moss Bros Report error related  **------------------------------------

function OnOrderReportErrorClick(orderId, orderType, produtLineInternalName) {
    HideContextMenuWithClass();
    var url = "/CustomOrderOverview/OrderReportError";
    if (orderType == 2 && (produtLineInternalName.toUpperCase() == "MTM" || produtLineInternalName.toUpperCase() == "CustomMade" || produtLineInternalName.toUpperCase() == "DYO")) {
        url = "/ReadymadeOrderOverview/OrderReportError";
    }
    ShowConfirmationDialog("", "Are you sure you want to report error for this order?", function () {
        $.ajax({
            url: url,
            type: "GET",
            data: { orderId: orderId }

        }).done(function (returnData) {
            if (returnData.Status) {
                $("#DivOrderReportErrorDialog").html(returnData.ReturnHTML);
                $("#DivOrderReportErrorDialog").dialog({
                    width: 'auto',
                    resizable: false,
                    dialogClass: 'bottombuttons',
                    title: "Report error",
                    modal: true,
                    open: function () {
                    },
                    close: function () {
                        $("#DivOrderReportErrorDialog").dialog('destroy').empty();
                    },
                    buttons: [
                        {
                            text: GetResourceText("SAVE", "Save"),
                            click: function () {
                                try {
                                    ValidateAndReportOrderError(orderId);
                                } catch (err) {
                                }
                            }
                        }, {
                            text: GetResourceText("CANCEL", "Cancel"),
                            click: function () {
                                try {
                                    $("#DivOrderReportErrorDialog").dialog('destroy').empty();
                                } catch (err) {
                                }
                            }
                        }
                    ]
                });
                $("#DivOrderReportErrorDialog").dialog("open");
            } else {
                ShowErrorDialog("Error", returnData.ReturnHTML, null, null);
            }
        }).fail(function (jqXHR, textStatus, errorThrown) {
            alert(errorThrown);
        });
    }, null, null);
}

function ValidateAndReportOrderError() {
    if (ValidateOrderReportError()) {
        $("#FrmOrderReportError").submit();
        return true;
    }
    return false;
}

function ValidateOrderReportError() {
    var errors = new Array();
    var causedBy = $("#FaultById").val();
    if (causedBy <= 0) {
        errors.push(GetResourceText("CAUSED_MANDATORY", "Please select value from caused by"));
    }
    var item = $("#SelectedProductPartId").val();
    if (item == 0) {
        errors.push(GetResourceText("ITEM_MANDATORY", "Please select value from items"));
    }

    var primaryReasonDropdowns = $("select[id^=SelectedReason]:visible");
    if (primaryReasonDropdowns) {
        var primaryReasonErrorFound = false;
        $.each(primaryReasonDropdowns, function (i, primaryReasonDropdown) {
            if (!primaryReasonErrorFound) {
                var value = $(primaryReasonDropdown).val();
                if (value <= 0) {
                    primaryReasonErrorFound = true;
                }
            }
        });
        if (primaryReasonErrorFound) {
            errors.push(GetResourceText("PRIMARY_REASON_MANDATORY", "Please select primary reason"));
        }
    }

    var secondaryReasonDropdowns = $("select[id^=SelectedSecondary]:visible");
    if (secondaryReasonDropdowns) {
        var secondaryReasonErrorFound = false;
        $.each(secondaryReasonDropdowns, function (i, secondaryReasonDropdown) {
            if (!secondaryReasonErrorFound) {
                var value = $(secondaryReasonDropdown).val();
                if (value <= 0) {
                    secondaryReasonErrorFound = true;
                }
            }
        });
        if (secondaryReasonErrorFound) {
            errors.push(GetResourceText("SECONDARY_REASON_MANDATORY", "Please select secondary reason"));
        }
    }

    var remarkInputs = $("textarea[id$=CancellationRemarks]:visible");
    if (remarkInputs) {
        var remarkErrorFound = false;
        $.each(remarkInputs, function (i, remarkInput) {
            if (!remarkErrorFound) {
                var value = $(remarkInput).val();
                if (!value || value.length <= 20) {
                    remarkErrorFound = true;
                }
            }
        });
        if (remarkErrorFound) {
            errors.push(GetResourceText("REMARK_MANDATORY", "Please enter min. 20 character in remark"));
        }
    }

    var discount = $("OrderReportDiscount").val();
    if (discount <= 0) {
        errors.push("Please select a discount");
    }

    if (errors.length > 0) {
        $("#DivOrderReportError").show();
        var html = "<ul>";
        for (var err in errors) {
            html += "<li>" + errors[err] + "</li>";
        }
        html += "</ul>";
        $("#DivOrderReportError").html(html);
        return false;
    } else {
        $("#DivOrderReportError").hide();
        return true;
    }
}

function OnOrderReportErrorFormSuccess(data) {
    if (data.Status == false && data.isShowErrorMessage == true) {
        if (data.ErrMessage != null && data.ErrMessage.length > 0) {
            $("#DivOrderReportError").show();
            var html = "<ul>";
            for (var err in data.ErrMessage) {
                html += "<li>" + data.ErrMessage[err] + "</li>";
            }
            html += "</ul>";
            $("#DivOrderReportError").html(html);
        }
    }
    else if (data.Status == true) {
        $("#DivOrderReportErrorDialog").dialog('destroy').empty();
        ShowOKDialog("Report Error", data.Message, RefreshOrderOverviewGrid, RefreshOrderOverviewGrid);
    }
}

function RefreshOrderOverviewGrid() {
    var m_location = location.href;
    var lastchar = m_location[m_location.length - 1];
    var formattedLocation = '';
    if (lastchar == "#")
        formattedLocation = m_location.slice(0, -1);
    else
        formattedLocation = m_location;
    RedirectToLocation($.trim(formattedLocation));
}

function RefreshOrderOverviewGrid() {
    var m_location = location.href;
    var lastchar = m_location[m_location.length - 1];
    var formattedLocation = '';
    if (lastchar == "#")
        formattedLocation = m_location.slice(0, -1);
    else
        formattedLocation = m_location;
    RedirectToLocation($.trim(formattedLocation));
}

function OnOrderReportErrorFormFailure(parameters) {
    alert("Some error occurred.Please contact account manager");
}

function OnMossProcessOrder(orderId) {
    var items = [];
    items.push(orderId);

    ShowConfirmationDialog("", "Are you sure you want to process the order?", function () {
        var data = { 'orderIds': items, "destinationStatusId": 6 };
        var param = $.param(data, true);
        $.get("CustomOrderOverview/UpdateOrderStatus", param, function (response) {
            $("#dialogForm").html(response);
            $("#dialogForm").dialog("open");
            $("#dialogForm").dialog("option", "resizable", false);
            $("#dialogForm").dialog("option", "height", 550);
            $("#dialogForm").dialog("option", "width", "auto");
        });

    }, null, null);
}

function OnShipOrder(orderId) {
    var url = "/CustomOrderOverview/ShipOrder";

    ShowConfirmationDialog("", "Are you sure you want to ship this order?", function () {
        $.ajax({
            url: url,
            type: "GET",
            data: { orderId: orderId }

        }).done(function (returnData) {
            if (returnData.Status) {
                RefreshOrderOverviewGrid();
            } else {
                ShowErrorDialog("Error", "Some error occurred while shipping order", null, null);
            }
        }).fail(function (jqXHR, textStatus, errorThrown) {
            alert(errorThrown);
        });
    }, null, null);
}

function DeliverToCustomerOrder(orderId) {
    var url = "/CustomOrderOverview/DeliverToCustomerOrder";

    ShowConfirmationDialog("", "Are you sure you want to 'Deliver to customer' this order?", function () {
        $.ajax({
            url: url,
            type: "GET",
            data: { orderId: orderId }

        }).done(function (returnData) {
            if (returnData.Status) {
                RefreshOrderOverviewGrid();
            } else {
                ShowErrorDialog("Error", "Some error occurred while 'Deliver to customer' order", null, null);
            }
        }).fail(function (jqXHR, textStatus, errorThrown) {
            alert(errorThrown);
        });
    }, null, null);
}

function OnCancelOrderClick(orderId) {
    var url = "/CustomOrderOverview/CancelOrder";

    ShowConfirmationDialog("", "Are you sure you want to cancel this order?", function () {
        $.ajax({
            url: url,
            type: "GET",
            data: { orderId: orderId }

        }).done(function (returnData) {
            if (returnData.Status) {
                RefreshOrderOverviewGrid();
            } else {
                ShowErrorDialog("Error", returnData.Message, null, null);
            }
        }).fail(function (jqXHR, textStatus, errorThrown) {
            alert(errorThrown);
        });
    }, null, null);
}
//-------------------------------** Moss Bros refund related **-------------------------------------------

function OnOrderRefundClick(orderId, orderType, produtLineInternalName) {
    var url = "/CustomOrderOverview/RefundOrder";
    if (orderType == 2 && (produtLineInternalName.toUpperCase() == "MTM" || produtLineInternalName.toUpperCase() == "CUSTOMMADE" || produtLineInternalName.toUpperCase() == "DYO")) {
        url = "/ReadymadeOrderOverview/RefundOrder";
    }
    ShowConfirmationDialog("", "Are you sure you want to refund for this order?", function () {
        $.ajax({
            url: url,
            type: "GET",
            data: { orderId: orderId }

        }).done(function (returnData) {
            if (returnData.Status) {
                HideContextMenuWithClass();
                $("#DivOrderRefundDialog").html(returnData.ReturnHTML);
                $("#DivOrderRefundDialog").dialog({
                    width: 'auto',
                    resizable: false,
                    dialogClass: 'bottombuttons',
                    title: "Refund",
                    modal: true,
                    open: function () {
                    },
                    buttons: [
                        {
                            text: GetResourceText("SAVE", "Save"),
                            click: function () {
                                try {
                                    ValidateAndSubmitRefundOrder(orderId);
                                } catch (err) {
                                }
                            }
                        }, {
                            text: GetResourceText("CANCEL", "Cancel"),
                            click: function () {
                                try {
                                    $("#DivOrderRefundDialog").dialog('destroy').empty();
                                } catch (err) {
                                }
                            }
                        }
                    ]
                });
                $("#DivOrderRefundDialog").dialog("open");
            } else {
                ShowErrorDialog("Error", returnData.ReturnHTML, null, null);
            }
        }).fail(function (jqXHR, textStatus, errorThrown) {
            alert(errorThrown);
        });
    }, null, null);
}

function ValidateAndSubmitRefundOrder(orderId) {
    if (ValidateRefundOrder()) {
        $("#FrmOrderRefund").submit();
        return true;
    }
    return false;
}

function ValidateRefundOrder() {
    var errors = new Array();
    var causedBy = $("#SelectedRefundReasonId").val();
    if (causedBy <= 0)
        errors.push(GetResourceText("REASON_MANDATORY", "Please select refund reason."));
    if (errors.length > 0) {
        $("#DivOrderRefundError").show();
        var html = "<ul>";
        for (var err in errors) {
            html += "<li>" + errors[err] + "</li>";
        }
        html += "</ul>";
        $("#DivOrderRefundError").html(html);
        return false;
    } else {
        $("#DivOrderRefundError").hide();
        return true;
    }
}

function OnOrderRefundSuccess(data) {
    if (data.Status == false) {
        if (data.ErrMessage != null && data.ErrMessage.length > 0) {
            $("#DivOrderRefundError").show();
            var html = "<ul>";
            for (var err in data.ErrMessage) {
                html += "<li>" + data.ErrMessage[err] + "</li>";
            }
            html += "</ul>";
            $("#DivOrderRefundError").html(html);
        }
    }
    else if (data.Status == true) {
        $("#DivOrderRefundDialog").dialog('destroy').empty();
        ShowOKDialog("Refund order", data.Message, RefreshOrderOverviewGrid, RefreshOrderOverviewGrid);
    }
}

function OnOrderRefundFailure(parameters) {
    alert("Some error occurred.Please contact account manager");
}


function MarkOrderForExpressDelivery(orderId) {
    var url = "/CustomOrderOverview/MarkOrderForExpressDelivery";
    $.ajax({
        url: url,
        type: "GET",
        data: { orderId: orderId }
    }).done(function (returnData) {
        var button;
        if (!returnData.IsShopAcceptesPrepayment) {
            button = [{
                text: GetResourceText("CONFIRM", "Confirm"),
                click: function () {
                    try {
                        SubmitExpressOrder(false);
                    } catch (err) {
                    }
                }
            }, {
                text: GetResourceText("CANCEL", "Cancel"),
                click: function () {
                    try {
                        $("#DivMarkOrderAsExpressDeliveryDialog").dialog('destroy').empty();
                        RefreshOrderOverviewGrid();
                    } catch (err) {
                    }
                }
            }];
        } else {
            button = [{
                text: GetResourceText("PAY_NOW", "Pay now"),
                click: function () {
                    try {
                        SubmitExpressOrder(true);
                    } catch (err) {
                    }
                }
            }, {
                    text: GetResourceText("PAY_LATER", "Pay later"),
                    click: function () {
                        try {
                            SubmitExpressOrder(false);
                        } catch (err) {
                        }
                    }
                }, {
                text: GetResourceText("CANCEL", "Cancel"),
                click: function () {
                    try {
                        $("#DivMarkOrderAsExpressDeliveryDialog").dialog('destroy').empty();
                        RefreshOrderOverviewGrid();
                    } catch (err) {
                    }
                }
            }];

        }
        if (returnData.Status) {
            $("#DivMarkOrderAsExpressDeliveryDialog").html(returnData.ReturnHTML);
            $("#DivMarkOrderAsExpressDeliveryDialog").dialog({
                width: '1000px',
                resizable: false,
                dialogClass: 'bottombuttons',
                title: GetResourceText('MARK_ORDER_AS_EXPRESS_DELIVERY', 'Mark order as express delivery'),
                modal: true,
                open: function () {
                },
                close: function () {
                    $("#DivMarkOrderAsExpressDeliveryDialog").dialog('destroy').empty();
                },
                buttons: button
            });
            $("#DivMarkOrderAsExpressDeliveryDialog").dialog("open");
        } else {
            ShowErrorDialog("Error", returnData.ReturnHTML, null, null);
        }
    }).fail(function (jqXHR, textStatus, errorThrown) {
        alert(errorThrown);
    });
}

function MarkOrderForNonExpressDelivery(orderId) {
    ShowConfirmationDialog("Mark order as Non express delivery",
        GetResourceText("NON_EXPRESS_DELIVERY_CONFIRMATION_MESSAGE", "Are you sure you want to mark order as non express delivery?"),
        function () { return SubmitOrderAsNonExpressDelivery(orderId); },
        function () { return RefreshOrderOverviewGrid(); }, null); 
}

function OnShipToChange(orderId) {
    var url = "/CustomOrderOverview/ChangeShipTo";
    $.ajax({
        url: url,
        type: "GET",
        data: { orderId: orderId }

    }).done(function (returnData) {
        if (returnData.Status) {
            $("#DivShipToChangeDialog").html(returnData.ReturnHTML);
            $("#DivShipToChangeDialog").dialog({
                width: 'auto',
                resizable: false,
                dialogClass: 'bottombuttons',
                title: GetResourceText('CHANGE_SHIP_TO_TITLE', 'Change ship to'),
                modal: true,
                open: function () {
                },
                close: function () {
                    $("#DivShipToChangeDialog").dialog('destroy').empty();
                },
                buttons: [
                    {
                        text: GetResourceText("SAVE", "Save"),
                        click: function () {
                            try {
                                if (ValidateShipToChangeForm()) {
                                    $("#frmChangeShipTo").submit();
                                    return true;
                                }
                            } catch (err) {
                            }
                        }
                    }, {
                        text: GetResourceText("CANCEL", "Cancel"),
                        click: function () {
                            try {
                                $("#DivShipToChangeDialog").dialog('destroy').empty();
                            } catch (err) {
                            }
                        }
                    }
                ]
            });
            $("#DivShipToChangeDialog").dialog("open");
        } else {
            ShowErrorDialog("Error", returnData.ReturnHTML, null, null);
        }
    }).fail(function (jqXHR, textStatus, errorThrown) {
        alert(errorThrown);
    });
}

function OnShipToChangeFormSuccess(data) {

    $("#DivShipToChangeDialog").dialog('destroy').empty();
    if (data.Status == true) {

        ShowOKDialog("", GetResourceText("SHIP_TO_CHANGED_FOR_ORDER", "Ship to has been changed for the order."), RefreshOrderOverviewGrid);
    } else {
        ShowOKDialog("", GetResourceText("SHIP_TO_CANNOT_CHANGED_FOR_ORDER", "Order status has changed, Ship To cannot be changed."));
    }
}

function OnShipToChangeFormFailure() {

    ShowOKDialog("", "Some error occurred.Please contact account manager");
}

function ValidateShipToChangeForm() {
    var errors = new Array();
    var dropdown = $("select[id=drpShipToId]:visible");
    if (dropdown) {
        var errorFound = false;
        var value = $(dropdown).val();
        if (value <= 0) {
            errorFound = true;
        }
        if (errorFound) {
            errors.push(GetResourceText("SELECT_SHIP_TO", "Please select ship to"));
        }
    }

    if (errors.length > 0) {
        $("#DivChangeShipToError").show();
        var html = "<ul>";
        for (var err in errors) {
            html += "<li>" + errors[err] + "</li>";
        }
        html += "</ul>";
        $("#DivChangeShipToError").html(html);
        return false;
    } else {
        $("#DivChangeShipToError").hide();
        return true;
    }
}
//===============================Sleeveless Jacket==========================================
function OnVestCopyClick(orderId, orderType, copyOrderHeaderText, canHideCopyAllButton) {

    var typeOfOrder = $.parseInt(orderType);
    var url = '';
    if (orderType == 2)
        url = "/VestReadymadeOrder/CopyOrder";
    else
        url = "/VestOrder/CopyOrder";

    $.ajax({
        url: url,
        type: "GET",
        dataType: "json",
        data: { orderID: orderId, isCancelledAndRemakeOrder: canHideCopyAllButton }
    }).done(function (returnData) {
        if (returnData.status) {

            PerformVestCopySkipingSelectionDialog(orderId, typeOfOrder, returnData.ProductLineInternalName, returnData.ItemTypeCategory);

        } else {
            ShowErrorDialogForMessages(GetResourceText("ERROR_MESSAGES"), returnData.ErrMsg, null, null);
        }
    }).fail(function () {

    });

}

function OnVestCMOrderEdit(url, produtLineInternalName, itemTypeCategory) {

    $.ajax({
        url: "/CustomOrder/GetNewGuid",
        data: { productLineInternalName: produtLineInternalName.toUpperCase(), itemTypeCategory: itemTypeCategory },
        success: function (guid) {
            
            var newurl = "";
            if (guid === "" || guid === undefined)
                newurl = url;
            else
                newurl = "/g/" + guid + url;
            RedirectToLocation(newurl);
        }
    })
}

    function PerformVestCopySkipingSelectionDialog(orderId, orderType, productLineInternalName, itemTypeCategory) {
    ShowSpinner();
    var typeOfOrder = $.parseInt(orderType);
    var url = '';
    if (typeOfOrder === 1) {
        url = "/VestOrder/CopyCustomMadeOrder/?orderID=" + orderId + "";

        $.ajax({
            url: "/CustomOrder/GetNewGuid",
            data: { productLineInternalName: productLineInternalName.toUpperCase(), itemTypeCategory: itemTypeCategory },
            success: function (guid) {
                var newurl = "";
                if (guid === "" || guid === undefined)
                    newurl = url;
                else
                    newurl = "/g/" + guid + url;
                RedirectToLocation(newurl);
            }
        })   
    }
    if (typeOfOrder === 2) {
        url = "/VestReadymadeOrder/CopyReadyMadeOrder/?orderID=" + orderId + "";
    }
    RedirectToLocation(url);
}

function EditSleevelessJacketRmOrder(orderID, orderType) {
    ShowSpinner();
    var typeOfOrder = $.parseInt(orderType);
    var url = '';
    if (typeOfOrder === 1) {
        url = "/VestOrder/EditVestOrder/?orderID=" + orderId + "";
    }
    if (typeOfOrder === 2) {
        url = "/VestReadymadeOrder/EditVestOrder/?orderId=" + orderID + "";
    }
    RedirectToLocation(url);
}

function ValidateSleevelessJacketRmOrder(orderID, orderType, shopType, produtLineInternalName) {
      if (orderID > 0) {
        $.ajax(
            {
                type: "Post",
                url: "/VestReadymadeOrder/ValidateVestReadymadeOrder",
                data: { orderID: orderID },
                success: function (returnData) {
                    if (returnData.status) {
                        EditRMSinglePageOrdersWithValidation(orderID, orderType ,'Vest');
                    }
                    else {
                        ShowErrorDialogForMessages(GetResourceText("ERROR_MESSAGES"), returnData.ErrMsg, null, null);
                    }
                }
            });
    }
}


function EditRMSinglePageOrdersWithValidation(orderId, orderTypeId ,combinationName) {
    var messageCode = "ORDER_EDIT_MESSAGES";
    var editOrderMessage = GetResourceText(messageCode,
        "You can edit your order until 4:00 pm CET the same day");
    $.ajax(
        {
            type: "GET",
            url: '/OrderDetail/GetEditOrderWarning2Message',
            data: { orderId: orderId }
        })
        .done(function (returnData) {
            if (returnData != null) {
                if (returnData.ShowEditWarningMsg) {
                    var code = "ORDER_EDIT_JUST_BEFORE_PRODUCTION";
                    editOrderMessage = GetResourceText(code);
                }
                ShowEditOKDialog("",
                    editOrderMessage,
                    function () {
                        switch (combinationName) {
                            case 'Vest':
                                EditSleevelessJacketRmOrder(orderId, orderTypeId);
                                break;
                            case 'Denim':
                                EditDenimRmOrder(orderId, orderTypeId);
                                break;
                            case 'Knit':
                                EditKnitRmOrder(orderId, orderTypeId);
                                break;
                            default:
                        }

                    },
                    null);
            }
        });
}
//===============================Denim==========================================
function OnDenimCopyClick(orderId, orderType, copyOrderHeaderText, canHideCopyAllButton) {    
    var typeOfOrder = $.parseInt(orderType);
    var url = '';
    if (orderType == 2)
        url = "/DenimReadymadeOrder/CopyOrder";
    else
        url = "/DenimOrder/CopyOrder";

    $.ajax({
        url: url,
        type: "GET",
        dataType: "json",
        data: { orderID: orderId, isCancelledAndRemakeOrder: canHideCopyAllButton }
    }).done(function (returnData) {
        if (returnData.status) {

            PerformDenimCopySkipingSelectionDialog(orderId, typeOfOrder, returnData.ProductLineInternalName, returnData.ItemTypeCategory);

        } else {
            ShowErrorDialogForMessages(GetResourceText("ERROR_MESSAGES"), returnData.ErrMsg, null, null);
        }
    }).fail(function () {

    });
}

function OnDeminCMOrderEdit(url, produtLineInternalName, itemTypeCategory) {
    
    $.ajax({
        url: "/CustomOrder/GetNewGuid",
        data: { productLineInternalName: produtLineInternalName.toUpperCase(), itemTypeCategory: itemTypeCategory },
        success: function (guid) {
            
            var newurl = "";
            if (guid === "" || guid === undefined)
                newurl = url;
            else
                newurl = "/g/" + guid + url;
            RedirectToLocation(newurl);
        }
    })
}


function PerformDenimCopySkipingSelectionDialog(orderId, orderType, productLineInternalName, itemTypeCategory) {
    ShowSpinner();
    var typeOfOrder = $.parseInt(orderType);
    var url = '';
    if (typeOfOrder === 1) {
        url = "/DenimOrder/CopyCustomMadeOrder/?orderID=" + orderId + "";
        
        $.ajax({
            url: "/CustomOrder/GetNewGuid",
            data: { productLineInternalName: productLineInternalName.toUpperCase(), itemTypeCategory: itemTypeCategory },
            success: function (guid) {
                var newurl = "";
                if (guid === "" || guid === undefined)
                    newurl = url;
                else
                    newurl = "/g/" + guid + url;
                RedirectToLocation(newurl);
            }
        })   
    }
    if (typeOfOrder === 2) {
        url = "/DenimReadymadeOrder/CopyReadyMadeOrder/?orderID=" + orderId + "";
        RedirectToLocation(url);
    }
    
}

function EditDenimRmOrder(orderID, orderType) {
    ShowSpinner();
    var typeOfOrder = $.parseInt(orderType);
    var url = '';
    if (typeOfOrder === 2) {
        url = "/DenimReadymadeOrder/EditDenimOrder/?orderId=" + orderID + "";
    }
    RedirectToLocation(url);
}

function ValidateDenimRmOrder(orderID, orderType, shopType, produtLineInternalName) {
      if (orderID > 0) {
        $.ajax(
            {
                type: "Post",
                url: "/DenimReadymadeOrder/ValidateDenimReadymadeOrder",
                data: { orderID: orderID },
                success: function (returnData) {
                    if (returnData.status) {
                        EditRMSinglePageOrdersWithValidation(orderID, orderType, 'Denim');
                    }
                    else {
                        ShowErrorDialogForMessages(GetResourceText("ERROR_MESSAGES"), returnData.ErrMsg, null, null);
                    }
                }
            });
    }
}

function EditKnitRmOrder(orderID, orderType) {
    ShowSpinner();
    var typeOfOrder = $.parseInt(orderType);
    var url = '';
    if (typeOfOrder === 2) {
        url = "/KnitReadymadeOrder/EditKnitOrder/?orderId=" + orderID + "";
    }
    RedirectToLocation(url);
}

function ValidateKnitRmOrder(orderID, orderType) {
      if (orderID > 0) {
        $.ajax(
            {
                type: "Post",
                url: "/KnitReadymadeOrder/ValidateKnitReadymadeOrder",
                data: { orderID: orderID },
                success: function (returnData) {
                    if (returnData.status) {
                        EditRMSinglePageOrdersWithValidation(orderID, orderType , 'Knit');
                    }
                    else {
                        ShowErrorDialogForMessages(GetResourceText("ERROR_MESSAGES"), returnData.ErrMsg, null, null);
                    }
                }
            });
    }
}


//===============================Knitwear==========================================
function OnKnitCopyClick(orderId, orderType, copyOrderHeaderText, canHideCopyAllButton) {

    

    var typeOfOrder = $.parseInt(orderType);
    var url = '';
    if (orderType == 2)
        url = "/KnitReadymadeOrder/CopyOrder";
    else
        url = "/KnitOrder/CopyOrder";

    $.ajax({
        url: url,
        type: "GET",
        dataType: "json",
        data: { orderID: orderId, isCancelledAndRemakeOrder: canHideCopyAllButton }
    }).done(function (returnData) {
        if (returnData.status) {

            PerformKnitCopySkipingSelectionDialog(orderId, typeOfOrder, returnData.ProductLineInternalName, returnData.ItemTypeCategory);

        } else {
            ShowErrorDialogForMessages(GetResourceText("ERROR_MESSAGES"), returnData.ErrMsg, null, null);
        }
    }).fail(function () {

    });
}

function OnKnitCMOrderEdit(url, produtLineInternalName, itemTypeCategory) {

    
    $.ajax({
        url: "/CustomOrder/GetNewGuid",
        data: { productLineInternalName: produtLineInternalName.toUpperCase(), itemTypeCategory: itemTypeCategory },
        success: function (guid) {

            
            var newurl = "";
            if (guid === "" || guid === undefined)
                newurl = url;
            else
                newurl = "/g/" + guid + url;
            RedirectToLocation(newurl);
        }
    })
}

function OnMossCopyClick(orderID, orderType, copyOrderHeaderText, canHideCopyAllButton, shopType, produtLineInternalName, itemTypeCategory, isFitprofileValid) {
    var typeOfOrder = $.parseInt(orderType);
    var url = '';
    if (orderType == 2) {
        GetNewGuid(orderID, orderType, copyOrderHeaderText, canHideCopyAllButton, shopType, produtLineInternalName, itemTypeCategory);
        return;
    }
    else {
        url = "/MossBrosOrder/CopyOrder";
    }
    $.ajax({
        url: url,
        type: "GET",
        dataType: "json",
        data: { orderID: orderID, isCancelledAndRemakeOrder: canHideCopyAllButton }
    }).done(function (returnData) {
        if (returnData.status) {
            PerformMossCopySkipingSelectionDialog(orderID, typeOfOrder, isFitprofileValid, canHideCopyAllButton, produtLineInternalName, itemTypeCategory);

        } else {
            ShowErrorDialogForMessages(GetResourceText("ERROR_MESSAGES"), returnData.ErrMsg, null, null);
        }
    }).fail(function () {

    });

}

function PerformMossCopySkipingSelectionDialog(orderId, orderType, isFitprofileValid, canHideCopyAllButton, produtLineInternalName, itemTypeCategory) {
    
    ShowSpinner();
    var typeOfOrder = $.parseInt(orderType);
    var url = '';
    if (typeOfOrder === 1) {

        url = "/MossBrosOrder/CopyCustomMadeOrder/?orderID=" + orderId + "&isFitProfileValid=" + isFitprofileValid + "&isCancelAndRemake=" + canHideCopyAllButton + "";

        $.ajax({
            url: "/CustomOrder/GetNewGuid",
            data: { productLineInternalName: produtLineInternalName.toUpperCase(), itemTypeCategory: itemTypeCategory },
            success: function (guid) {
                var newurl = "";
                if (guid === "" || guid === undefined)
                    newurl = url;
                else
                    newurl = "/g/" + guid + url;
                RedirectToLocation(newurl);
            }
        })   
    }
}

function PerformKnitCopySkipingSelectionDialog(orderId, orderType, productLineInternalName, itemTypeCategory) {
    ShowSpinner();
    var typeOfOrder = $.parseInt(orderType);
    var url = '';
    if (typeOfOrder === 1) {
        url = "/KnitOrder/CopyCustomMadeOrder/?orderID=" + orderId + "";

        $.ajax({
            url: "/CustomOrder/GetNewGuid",
            data: { productLineInternalName: productLineInternalName.toUpperCase(), itemTypeCategory: itemTypeCategory },
            success: function (guid) {
                var newurl = "";
                if (guid === "" || guid === undefined)
                    newurl = url;
                else
                    newurl = "/g/" + guid + url;
                RedirectToLocation(newurl);
            }
        })   
    }
    if (typeOfOrder === 2) {
        url = "/KnitReadymadeOrder/CopyReadyMadeOrder/?orderID=" + orderId + "";
        RedirectToLocation(url);
    }
    
}

//Shoe CM order

function OnCopyShoeOrder(orderId, orderType, copyOrderHeaderText, canHideCopyAllButton) {

    var typeOfOrder = $.parseInt(orderType);
    var url = '';
    if (orderType == 2)
        url = "/ShoeReadymadeOrder/CopyOrder";
    else
        url = "/ShoeOrder/CopyOrder";

    $.ajax({
        url: url,
        type: "GET",
        dataType: "json",
        data: { orderID: orderId, isCancelledAndRemakeOrder: canHideCopyAllButton }
    }).done(function (returnData) {
        if (returnData.status) {

            PerformShoeCopySkipingSelectionDialog(orderId, typeOfOrder, returnData.ProductLineInternalName, returnData.ItemTypeCategory);

        } else {
            ShowErrorDialogForMessages(GetResourceText("ERROR_MESSAGES"), returnData.ErrMsg, null, null);
        }
    }).fail(function () {

    });
}

function OnShoeCMOrderEdit(url, produtLineInternalName, itemTypeCategory) {
    
    $.ajax({
        url: "/CustomOrder/GetNewGuid",
        data: { productLineInternalName: produtLineInternalName.toUpperCase(), itemTypeCategory: itemTypeCategory },
        success: function (guid) {

            
            var newurl = "";
            if (guid === "" || guid === undefined)
                newurl = url;
            else
                newurl = "/g/" + guid + url;
            RedirectToLocation(newurl);
        }
    })
}

function PerformShoeCopySkipingSelectionDialog(orderId, orderType, productLineInternalName, itemTypeCategory) {

    ShowSpinner();
    var typeOfOrder = $.parseInt(orderType);
    var url = '';
    if (typeOfOrder === 1) {
        url = "/ShoeOrder/CopyCustomMadeOrder/?orderID=" + orderId + "";

        $.ajax({
            url: "/CustomOrder/GetNewGuid",
            data: { productLineInternalName: productLineInternalName.toUpperCase(), itemTypeCategory: itemTypeCategory },
            success: function (guid) {
                var newurl = "";
                if (guid === "" || guid === undefined)
                    newurl = url;
                else
                    newurl = "/g/" + guid + url;
                RedirectToLocation(newurl);
            }
        })
    }
    if (typeOfOrder === 2) {
        url = "/ShoeReadymadeOrder/CopyShoeReadyMadeOrder/?orderID=" + orderId + "";
        RedirectToLocation(url);
    }
    
}

//Tie CM order

function OnTieCopyClick(orderId, orderType, copyOrderHeaderText, canHideCopyAllButton) {


    var typeOfOrder = $.parseInt(orderType);
    var url = '';
    if (orderType == 2)
        url = "/TieReadymadeOrder/CopyOrder";
    else
        url = "/TieOrder/CopyOrder";

    $.ajax({
        url: url,
        type: "GET",
        dataType: "json",
        data: { orderID: orderId, isCancelledAndRemakeOrder: canHideCopyAllButton }
    }).done(function (returnData) {
        if (returnData.status) {

            PerformTieCopySkipingSelectionDialog(orderId, typeOfOrder, returnData.ProductLineInternalName, returnData.ItemTypeCategory);

        } else {
            ShowErrorDialogForMessages(GetResourceText("ERROR_MESSAGES"), returnData.ErrMsg, null, null);
        }
    }).fail(function () {

    });
}

function OnTieCMOrderEdit(url, produtLineInternalName, itemTypeCategory) {

    $.ajax({
        url: "/CustomOrder/GetNewGuid",
        data: { productLineInternalName: produtLineInternalName.toUpperCase(), itemTypeCategory: itemTypeCategory },
        success: function (guid) {

            
            var newurl = "";
            if (guid === "" || guid === undefined)
                newurl = url;
            else
                newurl = "/g/" + guid + url;
            RedirectToLocation(newurl);
        }
    })
}

function PerformTieCopySkipingSelectionDialog(orderId, orderType, productLineInternalName, itemTypeCategory) {

    ShowSpinner();
    var typeOfOrder = $.parseInt(orderType);
    var url = '';
    if (typeOfOrder === 1) {
        url = "/TieOrder/CopyTieCustomMadeOrder/?orderID=" + orderId + "";

        $.ajax({
            url: "/CustomOrder/GetNewGuid",
            data: { productLineInternalName: productLineInternalName.toUpperCase(), itemTypeCategory: itemTypeCategory },
            success: function (guid) {
                var newurl = "";
                if (guid === "" || guid === undefined)
                    newurl = url;
                else
                    newurl = "/g/" + guid + url;
                RedirectToLocation(newurl);
            }
        })
    }
    if (typeOfOrder === 2) {
        url = "/TieReadymadeOrder/CopyTieReadyMadeOrder/?orderID=" + orderId + "";
        RedirectToLocation(url);
    }
    
}