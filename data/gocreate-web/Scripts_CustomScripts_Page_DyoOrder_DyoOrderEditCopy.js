function OnCopyDyoOrder(orderID,orderType) {
    var typeOfOrder = $.parseInt(orderType);
    var url = '';
    if (typeOfOrder === 1) {
        url = "/DyoOrder/CopyDyoOrder";
    }
    else if (typeOfOrder === 2) {
        url = "/DyoReadyMadeOrder/CopyDyoOrder";
    }

    //var url = '';
    //url = "/DyoOrder/CopyDyoOrder";

    $.ajax({
        url: url,
        type: "GET",
        dataType: "json",
        data: {
            orderId: orderID
        }
    }).done(function (returnData) {
        if (returnData.status) {

            PerformCopySkipingSelectionDialog(orderID, orderType);
            //ShowCopyDlgWithoutCancel(returnData.Msg, null);
        }
        else {
            ShowErrorDialogForMessages(GetResourceText("ERROR_MESSAGES"), returnData.ErrMsg, null, null);
        }
    }).fail(function () {

    });

}

function PerformCopySkipingSelectionDialog(orderId,orderType) {
    ShowSpinner();
    var typeOfOrder = $.parseInt(orderType);
    var url = '';
    if (typeOfOrder === 1) {
        url = "/DyoOrder/CopyCustomMadeOrder/?orderID=" + orderId + "";
    }
    else if (typeOfOrder === 2) {
        url = "/DyoReadyMadeOrder/CopyReadymadeOrder/?orderID=" + orderId + "";
    }
   // var url = "/DyoOrder/CopyCustomMadeOrder/?orderID=" + orderId + "";
    RedirectToLocation(url);
}

function EditDyoOrder(orderId, orderType) {
    var messageCode = "ORDER_EDIT_MESSAGES";

    var editOrderMessage = GetResourceText(messageCode,
       "You can edit your order until 4:00 pm CET the same day");

    $.ajax(
        {
            type: "GET",
            url: '/OrderDetail/GetEditOrderWarning2Message',
            data: {orderId: orderId}
        })
        .done(function (returnData) {
            if (returnData != null) {
                if (returnData.ShowEditWarningMsg) {

                    var code = "ORDER_EDIT_JUST_BEFORE_PRODUCTION";

                    editOrderMessage = GetResourceText(code);
                }
                ShowErrorDialog("",
                    editOrderMessage,
                    function () {
                        GoToEditDyoOrder(orderId, orderType);
                    },
                    null);


            }
        });

}

function GoToEditDyoOrder(orderId, orderType) {
    ShowSpinner();
    var typeOfOrder = $.parseInt(orderType);
    var url = '';
    if (typeOfOrder === 1) {
        url = "/DyoOrder/EditDyoOrder/?orderId=" + orderId + "";
    }
    else if (typeOfOrder === 2) {
        url = "/DyoReadymadeOrder/EditDyoOrder/?orderId=" + orderId + "";
    }
    RedirectToLocation(url);
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