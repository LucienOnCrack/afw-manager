
/******************************************************************************************************
Functions related to intializing the page
*******************************************************************************************************/
function SubmitSaveForm() {
    var options = {
        success: function (resultData) {
            if (resultData != null) {
                //TODO: VB make string localised
                if (resultData.Status == false) {
                    ShowErrorDialog("Error", GetResourceText("SAVE_ERROR_MESSAGE", "Data was not saved properly as some error occured"), null, null);
                } else {
                    ShowOKDialog("Success", GetResourceText("SUCCESS_MESSAGE", "Data saved successfully"), null, null);
                }
            }
        }
    };

    $("#frmFittoolSave").ajaxForm(options);
    $("#frmFittoolSave").submit();
}


function SubmitSearchForm() {

    var options = {
        success: function (resultData) {
            if (resultData != null) {
                $("#divShopFitTools").html(resultData);
                if (typeof (window.ChangeNotifier) != 'undefined')
                    ChangeNotifier.SetupDataChangeNotifier();
            }
        }
    };

    $("#frnFittoolSearch").ajaxForm(options);
    $("#frnFittoolSearch").submit();
}


function onProductPartChange() {
    var productPartID = $("#SelectedProductPartID").val();
    var URL = "/ShopSettings/GetProductFits";
    var data = { productPartID:productPartID };
    FetchAndDisplay(URL, data, "SearchTableContent");
 
}
 