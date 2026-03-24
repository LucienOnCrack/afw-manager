function OnCopyTieOrder(orderID, orderTypeId) {
    
    var url = "";

    if (orderTypeId === 2) {
        url = "/TieReadyMadeOrder/CopyTieOrder";
    } else {
        url = "/TieOrder/CopyTieOrder";
    }


    $.ajax({
        url: url,
        type: "GET",
        dataType: "json",
        data: {
            orderId: orderID
        }
    }).done(function (returnData) {
        if (returnData.status) {

            tieCustomOrder.PerformCopySkiping(orderID, orderTypeId);
           
           
        }
        else {
            ShowErrorDialogForMessages(GetResourceText("ERROR_MESSAGES"), returnData.ErrMsg, null, null);
        }
    }).fail(function () {

    });

}

var tieCustomOrder = {

    PerformCopySkiping: function PerformCopySkipingSelectionDialog(orderId, orderTypeId) {

        ShowSpinner();
        var url = "";
        if (orderTypeId === 2) {
            url = "/TieReadyMadeOrder/CopyTieReadyMadeOrder/?orderID=" + orderId + "&isQualityIssueRemakeOrder=true";

            RedirectToLocation(url);
        }
        else {
            url = "/TieOrder/CopyTieCustomMadeOrder/?orderID=" + orderId + "&isQualityIssueRemakeOrder=true";

            $.ajax({
                url: "/CustomOrder/GetNewGuid",
                data: { productLineInternalName: "STANDARD", itemTypeCategory: 5 },
                success: function (guid) {
                    var newurl = "";
                    if (guid === "" || guid === undefined)
                        newurl = url;
                    else
                        newurl = "/g/" + guid + url;
                    RedirectToLocation(newurl);
                }
            });
        }        
    }
}

function EditTieOrder(orderId, orderTypeId) {
    var messageCode = "ORDER_EDIT_MESSAGES";

    var editOrderMessage = GetResourceText(messageCode, "You can edit your order until 4:00 pm CET the same day");

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
                        GoToEditTieOrder(orderId, orderTypeId);
                    },
                    null);


            }
        });

}


function GoToEditTieOrder(orderId, orderTypeId) {
    ShowSpinner();
    var url = "";
    if (orderTypeId === 2) {
        url = "/TieReadyMadeOrder/EditTieOrder/?orderId=" + orderId + "";
        RedirectToLocation(url);
    }
    else {
        url = "/TieOrder/EditTieOrder/?orderId=" + orderId + "";
        
        OnTieCMOrderEdit(url, 'STANDARD', 5);
    }
    
    
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


//Copy Order related functiions
function CopyOrderSubmit() {
    if (IsCopyOrderComponentFormValid()) {
        ShowSpinner();
        $("#frmCopyOrder").submit();
    }
}

$(document).ready(function () {
    EnableDisableSelectAllCheckBox();
});

function CopyEachComponentAndSubmit() {
    $("#CopyEachComponent").val(true);
    $("#tblCopyComponents").find("input[type='checkbox']").prop("checked", true);
    CopyOrderSubmit();
}

function CopyOrderSubmit() {
    if (IsCopyOrderComponentFormValid()) {
        ShowSpinner();
        $("#frmCopyOrder").submit();
    }
}

function EnableDisableSelectAllCheckBox() {

    var isAnyUnchecked = false;
    var allCheckboxes = $("#tblCopyComponents").find("input[type='checkbox']");
    for (var index = 0; index < allCheckboxes.length; index++) {
        if ($(allCheckboxes[index]).prop("id") != "SelectAllComponents" && !$(allCheckboxes[index]).is(":checked")) {
            isAnyUnchecked = true;
        }
    }

    $("#SelectAllComponents").prop("checked", !isAnyUnchecked);

    return true;
}

function IsCopyOrderComponentFormValid() {
    var isAnyCheckboxChecked = false;

    var checkboxes = $("#tblCopyComponents").find("input[type='checkbox']");
    for (var index = 0; index < checkboxes.length; index++) {
        if ($(checkboxes[index]).is(":checked"))
            isAnyCheckboxChecked = true;
    }

    if (!isAnyCheckboxChecked) {
        $("#tblCopyComponentsError").show();
    } else {
        $("#tblCopyComponentsError").hide();
    }

    return isAnyCheckboxChecked;
}

function SelectAllClick() {
    var checked = $("#SelectAllComponents").is(":checked");
    var isCancelledAndRemakeOrder = $("#IsCancelledAndRemakeOrder").val();
    if (isCancelledAndRemakeOrder && isCancelledAndRemakeOrder.toUpperCase() == "TRUE") {

        $("#tblCopyComponents").find("input[type='checkbox']").each(function (item) {
            var idOfCheckbox = this.id.toLowerCase();
            if (idOfCheckbox == "copyfabric" || idOfCheckbox == "copylining") {

            } else {
                this.checked = checked;
            }

        });


    } else {
        $("#tblCopyComponents").find("input[type='checkbox']").prop("checked", checked);
    }
}

function ValidateTieOrder(orderId, orderTypeId) {
    var url = '';
    if (orderTypeId === 2) {
        url = "/TieReadyMadeOrder/ValidateTieRmOrder";
    }
    else {
        url = "/TieOrder/ValidateTieOrder";
    }

    if (orderId > 0) {
        $.ajax(
            {
                type: "Post",
                url: url,
                data: { orderID: orderId },
                success: function (returnData) {
                    if (returnData.status) {
                        EditTieOrder(orderId, orderTypeId);
                    }
                    else {
                        ShowErrorDialogForMessages(GetResourceText("ERROR_MESSAGES"), returnData.ErrMsg, null, null);
                    }
                }
            });
    }
}
