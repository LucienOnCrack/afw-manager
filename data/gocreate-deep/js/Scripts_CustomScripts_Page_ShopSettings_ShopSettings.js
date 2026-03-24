
/******************************************************************************************************
Functions related to intializing the page
*******************************************************************************************************/
function SubmitForm() {

    var options = {
        dataType: "json",
        success: function(resultData) {
            if (resultData != null) {
                if (resultData.Status == false) {
                    ShowErrorDialog("Error", resultData.MessageHtml, null, null);
                } else {
                    
                }
            }
        }
    };
    
    //$("#frmShopSettings").ajaxForm(options);
    //$("#frmShopSettings").submit();
}


function AdjustPriceListOverviewPageHeight() {
    var HEADER_HEIGHT = 130;
    var PAGER_DIV_HEIGHT = 35;
    var BOTTOM_FACTOR = 10 + 20; //grey bottom strip + white space

    var contentheight = $(window).height() - (180 + BOTTOM_FACTOR);
    $(".contentwrapperBody").height(contentheight);

    var height = $(window).height() - (HEADER_HEIGHT  + PAGER_DIV_HEIGHT + BOTTOM_FACTOR + 75);
    $("#GridContainer").height(height);
}

function PriceListLoad() {
    ShowSpinner();
    AdjustPriceListOverviewPageHeight();
    FixTableColumns("EntityListView", 0);
    UpdateSortingLinks("EntityListView");
    setTimeout(function () {
        HideSpinner();
    }, 1000);

    var actionButtons = $.find("#EntityListView button[id^='PPAction_']");
    if (actionButtons != null && actionButtons.length > 0) {
        AttachedContextMenus(actionButtons, 1);
    }
}


function SubmitShipmentDateEmailSettingSaveForm() {
    var options = {
        dataType: "json",
        success: function (resultData) {
            if (resultData != null) {
                if (resultData.Status == false) {
                    if (resultData.ErrorMessage) {
                        ShowErrorDialog("Error", resultData.ErrorMessage, null, null);
                    } else {
                        ShowErrorDialog("Error", GetResourceText("SAVE_ERROR_MESSAGE", "Data was not saved properly as some error occured"), null, null);
                    }
                } else {
                    ShowOKDialog("Success", GetResourceText("SUCCESS_MESSAGE", "Data saved successfully"), function () {
                        location.reload();
                    }, null);
                }
            }
        }
    };

    $("#frmShipmentDateUpdateEmailSetting").ajaxForm(options);
    $("#frmShipmentDateUpdateEmailSetting").submit();
}
