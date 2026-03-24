/***********************************************************************************************
COMMON METHODS
*************************************************************************************************/
var REQUEST_TYPE_ELEMENT = "ELEMENT";
var REQUEST_TYPE_TAB_SWITCH = "TAB_SWITCH";
var TAB_PPRICE = "PPRICE";
var TAB_RPRICE = "RPRICE";
var TAB_SHIPMENT = "SHIPMENT";
var TAB_MEASUREMENT = "MEASUREMENT";
var TAB_FITPROFILE = "FITPROFILE";
var TAB_NONE = "NONE";
var ELEMENT_TYPE_MAKE = "MAKE";
var ELEMENT_TYPE_STYLE = "STYLE";
var ELEMENT_TYPE_FABRIC = "FABRIC";
var ELEMENT_TYPE_LINING = "LINING";
var ELEMENT_TYPE_DOV = "DOV";
var ELEMENT_TYPE_BUTTON = "BUTTON";
var ELEMENT_TYPE_TRIM = "TRIM";
var ELEMENT_TYPE_LININGDOV = "LININGDOV";
var ELEMENT_TYPE_FITTOOL = "FITTOOL";
var ELEMENT_TYPE_FIT = "FIT";
var ELEMENT_TYPE_TRYON = "TRYON";
var ELEMENT_TYPE_FITPROFILE = "FITPROFILE";
var ELEMENT_TYPE_FITTOOL_DOV = "FITTOOLDOV";
var READYMADE_ORDER = "READY_MADE";
var CUSTOM_ORDER = "CUSTOM_MADE";
var rPricediv_oldState = new Array();
var ELEMENT_TYPE_REMARKS = "REMARKS";
var ELEMENT_TYPE_ISINTERNAL = "IS_INTERNAL";
var ELEMENT_TYPE_BODY = "BODY";
var ELEMENT_TYPE_GARMENT = "GARMENT";
var ELEMENT_TYPE_DETACHABLELINER = "DETACHABLELINING";
var ELEMENT_TYPE_SPP = "SPP";
var ELEMENT_TYPE_EXTRA_TROUSER = "EXTRA_TROUSER";
var ELEMENT_TYPE_EXTRA_LINING = "EXTRA_LINING";

function RefreshRunningInformation(requestType, tab, elementType, elementID, itemNumber, productPart, value, orderType, numberOfBlocksChosen = 0, isForTrim = false, isCallForDiffLining = false) {
    
    /// <summary>Refreshes the running information of the specified tab with the data received from server.</summary>
    /// <param name="requestType" type="string">The type of request {'ELEMENT', 'TAB_SWITCH'}.</param>
    /// <param name="tab" type="string">The tab to be refreshed. This is generally the active tab {'PPRICE','RPRICE','SHIPMENT'}.</param>
    /// <param name="elementType" type="string">The type of the element because of which the information needs to be refreshed {'Make','FABRIC','LINING'}.</param>
    /// <param name="elementID" type="int">The ID of the element because of which the information needs to be refreshed.</param>
    /// <param name="itemNumber" type="int">The sequence number (starting with 1) of the item in picture because of which the information needs to be refreshed {1,2,3}.</param>
    /// <param name="productPart" type="int">The ID of the product part because of which the information needs to be refreshed.</param>
    /// <param name="callBackFunction" type="function">The function which will be called once the response is received.</param>
    /// <returns type="Number">Nothing.</returns>

    //Prepare the request data
    var isExtraTrouserSelected = parseInt($("#ddAddOnsValue").val()) == 2;
    var requestData =
    {
        RequestType: requestType,
        Tab: GetActiveRunningInformationTab(),
        ElementType: elementType,
        ElementID: elementID,
        ItemNumber: itemNumber,
        ProductPart: productPart,
        Value: value,
        OrderType: orderType,
        NumberOfBlocks: numberOfBlocksChosen,
        IsForTrim: isForTrim,
        IsExtraTrouserSelected: isExtraTrouserSelected,
        IsCallForDiffLining: isCallForDiffLining
    };

    GetOldStatusofRPriceTab();

    var url = '';

    if (orderType == CUSTOM_ORDER) {
        url = "/CustomOrder/RefreshRunningInformation";
    }
    else if (orderType == READYMADE_ORDER) {
        url = "/ReadyMadeOrder/RefreshRunningInformation";
    }
    $.ajax(
        {
            type: "GET",
            url: url,
            data: requestData,
            global: false,
            success: function (data) {
                var jsonData = $.parseJSON(data);
                //callBackFunction(jsonData);
                ProcessResponse(jsonData);
                DisplayPossibleAtelierIDs(jsonData);
                if (CUSTOM_ORDER == orderType) {
                    UpdateRRunningInformationTab(rPricediv_oldState);
                    if (jsonData.ItemDetails != null) {
                        UpdateItemDetails(jsonData.ItemDetails);
                    }
                } else if (READYMADE_ORDER == orderType) {
                    UpdateRMOrderInfoDetails(jsonData.ItemDetails);
                }
                setUpPanels();
                SetCollapsablePanelStatus(jsonData);
            }
        });
}


function GetOldStatusofRPriceTab() {
    var rPricediv = $("#divRPriceContainer").find("div[id^=RPriceTemplateContainer]");
    // find('.CollapsiblePanel');
    if (rPricediv.attr != undefined || rPricediv != 'undefined') {
        for (var i = 0; i < rPricediv.length; i++) {
            rPricediv_oldState[i] = $(rPricediv[i]).attr('class');
        }
    }
}

function ProcessResponse(response) {
    var dataUpdated = false;
    //Check and update the data    
    if (response != null) {
        var index = response.ItemNumber;

        //Update tab data
        dataUpdated = UpdateTabDataWithResponse(response, index);
    }

    //Update the UI
    if (dataUpdated.tabDataUpdated)
        UpdateRunningInformationTabHtml(response.Tab);

    //update Finish measurement
    if (dataUpdated.tabMeasurement) {
        UpdateRunningInformationMeasurement(response.Tab);
        //SelectedMeasurementTab();
        AdjustRunningInformationHeight();
    }

    if (dataUpdated.cautionDataUpdated) {
        RefreshCautionMessageHtml(response.CautionMessages);
    }

    var combinationID = $("#hdnProductCombinationID").val();


    if (response.ResetInformation != null) {
        if (response.OrderType == CUSTOM_ORDER) {
            var itemNumber = response.ItemNumber + 1;
            if (response.ResetInformation.ResetFabric)
                clearSelectedFabric(itemNumber);
            if (response.ResetInformation.ResetLining) {
                clearSelectedLining(itemNumber);
                var hasExtraLining = $("#HDShowExtraProductLining").val();
                if (hasExtraLining.toLowerCase() == "true") {
                    clearSelectedExtraLining(itemNumber);
                }
            }
            //check if response element type is make, then only load matching info
            if (response.ElementType.toUpperCase() == "MAKE") {
                var atelierId = -1;
                if (response.PossibleAtelierIDs != null && response.PossibleAtelierIDs !== "" && !response.ResetInformation.ResetFabric) {

                    atelierId = parseInt(response.PossibleAtelierIDs);
                }                
                if ($("#HDIsOrderCreationWithSSO").val() == "true") {
                    atelierId = $("#HDSSOOrderAtelierId").val();
                }
                var isDeterMinisticPP = $("#HDSSOOrderIsDeterministicPP_" + response.ProductPart).val() == 'true';
                if ($("#HDIsOrderCreationWithSSO").val() == "true") {
                    if (isDeterMinisticPP) {
                        LoadMachingInfoData($("#HDFabric_" + itemNumber).val(), itemNumber, false, atelierId, false);
                    }
                }
                else {
                    LoadMachingInfoData($("#HDFabric_" + itemNumber).val(), itemNumber, false, atelierId,false);
                    AttachFabricAutosuggest("Fabric_" + itemNumber, fabricAutosuggestURL);
                    AttachLiningAutosuggest("Lining_" + itemNumber, liningAutosuggestURL);
                    
                    var hasExtraLining = $("#HDShowExtraProductLining").val();
                    if (hasExtraLining.toLowerCase() == "true") 
                        AttachWaistcoatLiningAutosuggest("WaistcoatLining_" + itemNumber, liningAutosuggestURL);
                }
            }
        }
        else if (response.OrderType == READYMADE_ORDER) {
            if (response.ResetInformation.ResetLining) {
                ResetSelectedLiningRM();
                var hasExtraLining = $("#ShowExtraProductLining").val();
                if (hasExtraLining.toLowerCase() == "true") {
                    ResetSelectedExtraLiningRM(itemNumber);
                }
            }
            if (response.ElementType != null && response.ElementType.toUpperCase() == "MAKE") {
                let mockAtelierID = response.PossibleAtelierIDs ? Number(response.PossibleAtelierIDs.split(',')[0]) : -1;
                LoadMachingInfoData($("#HDFabric").val(), mockAtelierID, false);
                AttachFabricAutosuggest("Fabric", fabricAutosuggestURL);
                AttachLiningAutosuggest("Lining", liningAutosuggestURL);
                var hasExtraLining = $("#ShowExtraProductLining").val();
                if (hasExtraLining.toLowerCase() == "true") 
                    AttachWaistcoatLiningAutosuggest("WaistcoatLining", liningAutosuggestURL);
            }           
        }
    }


}

function UpdateItemDetails(itemDetailsJSonString) {
    window.ItemDetails = $.parseJSON(itemDetailsJSonString);
    UpdateItemDetailsHTML();
    AdjustRunningInformationHeight();
    setUpPanels();
}
function UpdateRemarks(itemDetailsJSonString) {
    window.ItemDetails = $.parseJSON(itemDetailsJSonString);
    UpdateRemarksHtml();
    AdjustRunningInformationHeight();
}
function UpdateRemarksHtml() {
    if (ItemDetails != null && ItemDetails.Items != null && ItemDetails.Items.length > 0) {
        $("#divRemarkContainer").html("");
        $("#RemarksTemplate").tmpl(ItemDetails).appendTo($("#divRemarkContainer"));
        //        InitializeShowItemDetailsCloseAction();
        ApplyalternateScroll($("#divRemarkContainer").find(".itemDetailContainer"));
    }
}
function UpdateReadymadeRemarks(itemDetailsJSonString) {
    window.RemarksDetail = $.parseJSON(itemDetailsJSonString);
    UpdateReadymadeRemarksHtml();
    AdjustRunningInformationHeight();
}
function UpdateReadymadeRemarksHtml() {
    if (RemarksDetail != null) {
        $("#divRemarkContainer").html("");
        $("#RemarksTemplate").tmpl(RemarksDetail).appendTo($("#divRemarkContainer"));
        //        InitializeShowItemDetailsCloseAction();
        ApplyalternateScroll($("#divRemarkContainer").find(".itemDetailContainer"));
    }
}
function UpdateRMOrderInfoDetails(itemDetailsJSonString) {
    window.ReadyMadeOrderDetail = $.parseJSON(itemDetailsJSonString);
    UpdateReadyMadeOrderItemDetailsHTML();
    AdjustRunningInformationHeight();
    setUpPanels();
}

function isValidRunningInformation(object, length) {
    var result = false;
    if (object != null && object.Items != null && object.Items.length > length) {
        result = true;
    }
    return result;
}

function isValidRunningMeasurement(object) {
    var result = false;
    if (object != null && object.ProductParts != null && object.ProductParts.length > 0) {
        result = true;
    }
    return result;
}

function UpdateTabDataWithResponse(response, index) {
    var result = { tabDataUpdated: false, cautionDataUpdated: false, tabMeasurement: false };

    if (response.RunningInformation != null && RunningInformation != null) {
        var runningInfo = RunningInformation;

        var runningInfoFromServer = response.RunningInformation;

        //Update the tab data

        runningInfo.Quantity = runningInfoFromServer.Quantity;

        //Update PPrice
        if (isValidRunningInformation(runningInfo.PPrice, index)
            && isValidRunningInformation(runningInfoFromServer.PPrice, 0)) {
            runningInfo.PPrice.Items[index] = runningInfoFromServer.PPrice.Items[index];
            UpdatePriceTotal(runningInfo.PPrice);
            result.tabDataUpdated = true;
        }

        //Update RPrice
        if (isValidRunningInformation(runningInfo.RPrice, index)
            && isValidRunningInformation(runningInfoFromServer.RPrice, 0)) {
            runningInfo.RPrice.Items[index] = runningInfoFromServer.RPrice.Items[index];
            UpdatePriceTotal(runningInfo.RPrice);
            result.tabDataUpdated = true;
        }

        //Update Shipment
        if (isValidRunningInformation(runningInfo.ShipmentInfo, index)
            && isValidRunningInformation(runningInfoFromServer.ShipmentInfo, 0)) {
            runningInfo.ShipmentInfo.Items[index] = runningInfoFromServer.ShipmentInfo.Items[index];
            result.tabDataUpdated = true;
        }

        // Update Measurement
        if (isValidRunningMeasurement(runningInfo.Measurement) && isValidRunningMeasurement(runningInfoFromServer.Measurement)) {
            var rProductParts = runningInfoFromServer.Measurement.ProductParts;
            for (var i = 0; i < rProductParts.length; i++) {
                for (var j = 0; j < runningInfo.Measurement.ProductParts.length; j++) {
                    if (runningInfo.Measurement.ProductParts[j].ProductPartID == rProductParts[i].ProductPartID) {
                        runningInfo.Measurement.ProductParts[j].FitToolMeasurements = rProductParts[i].FitToolMeasurements;
                        runningInfo.Measurement.ProductParts[j].FlatListOfMeasurement = rProductParts[i].FlatListOfMeasurement;
                        runningInfo.Measurement.ProductParts[j].ProductFitProfile = rProductParts[i].ProductFitProfile;
                        runningInfo.Measurement.ProductParts[j].TryOnSizeInCM = rProductParts[i].TryOnSizeInCM;
                        runningInfo.Measurement.ProductParts[j].DesiredMeasurements = rProductParts[i].DesiredMeasurements;
                        runningInfo.Measurement.ProductParts[j].ProductFit = rProductParts[i].ProductFit;
                    }
                }
            }
            // runningInfo.Measurement = runningInfoFromServer.Measurement;
            result.tabMeasurement = true;
        }
    }

    //Update the caution message data
    if (response.CautionMessages != null && RunningInformation != null) {
        var runningInfo = RunningInformation;

        if (runningInfo.CautionMessages.Items == null)
            runningInfo.CautionMessages.Items = new Array();

        //If the length of caution message array mismatch, then add empty objects
        if (runningInfo.CautionMessages.Items.length < index + 1) {
            for (var i = runningInfo.CautionMessages.Items.length; i < index + 1; i++)
                runningInfo.CautionMessages.Items.push("");
        }
    }

    result.cautionDataUpdated = UpdateCautionMessages(response, index);

    return result;
}

function UpdateCautionMessages(response, index) {
    var result = false;

    var runningInfo = RunningInformation;
    switch (response.ElementType) {
        case ELEMENT_TYPE_FABRIC:
            runningInfo.CautionMessages.Items[index].Fabric = null;
            runningInfo.CautionMessages.Items[index].Fabric = response.CautionMessages;
            if (response.ResetInformation.ResetLining)
                runningInfo.CautionMessages.Items[index].Lining = null;
            result = true;
            break;
        case ELEMENT_TYPE_LINING:
            runningInfo.CautionMessages.Items[index].Lining = null;
            runningInfo.CautionMessages.Items[index].Lining = response.CautionMessages;
            result = true;
            break;
        case ELEMENT_TYPE_EXTRA_LINING:
            runningInfo.CautionMessages.Items[index].ExtraLining = null;
            runningInfo.CautionMessages.Items[index].ExtraLining = response.CautionMessages;
            result = true;
            break;
        case ELEMENT_TYPE_DOV:
        case ELEMENT_TYPE_BUTTON:
        case ELEMENT_TYPE_TRIM:
        case ELEMENT_TYPE_LININGDOV:
            var item = runningInfo.CautionMessages.Items[index];
            var pp = item.DOV[response.ProductPart];

            if ($.isEmptyObject(pp)) {

                var DO = pp[response.ElementID];

                if (DO != null) {
                    if (response.CautionMessages != null)
                        DO = response.CautionMessages;
                    else
                        delete pp[response.ElementID];
                }
                else {
                    if (response.CautionMessages != null)
                        pp[response.ElementID] = response.CautionMessages;
                }
            } else {
                if (pp[response.ElementID] == null && response.CautionMessages != null)
                    pp[response.ElementID] = response.CautionMessages;
                else {
                    //delete pp[response.ElementID];
                    var resultRunningInfo = response.RunningInformation.CautionMessages.Items[index];
                    if (resultRunningInfo != undefined) {
                        var resultPP = resultRunningInfo.DOV[response.ProductPart];
                        for (let key in pp) {
                            if (pp[key].IsForTrim) {
                                if (resultPP[key] != null && resultPP[key].IsForTrim) {
                                    pp[key].IsForShow = resultPP[key].IsForShow;
                                    pp[key].Message = resultPP[key].Message;
                                }
                            }
                        }
                    }
                }
            }
            result = true;
            break;
        case ELEMENT_TYPE_FITTOOL_DOV:
            var rPP = runningInfo.CautionMessages.ProductParts;
            for (var i = 0; i < rPP.length; i++) {
                if (rPP[i].ProductPartID == response.ProductPart) {
                    var fittoolDO = rPP[i].FitToolCautionMessages[response.ElementID];
                    if (fittoolDO != null) {
                        if (response.CautionMessages != null && !($.isEmptyObject(response.CautionMessages)))
                            fittoolDO = response.CautionMessages[response.ElementID];
                        else
                            delete rPP[i].FitToolCautionMessages[response.ElementID];
                    } else {
                        if (response.CautionMessages != null)
                            rPP[i].FitToolCautionMessages[response.ElementID] = response.CautionMessages[response.ElementID];
                    }
                }


            }
            result = true;
            break;
        case ELEMENT_TYPE_FITTOOL:
            var rProductParts = runningInfo.CautionMessages.ProductParts;
            for (var i = 0; i < rProductParts.length; i++) {
                if (rProductParts[i].ProductPartID == response.ProductPart) {
                    if ($.isEmptyObject(rProductParts[i].FitToolCautionMessages)) {
                        rProductParts[i].FitToolCautionMessages = response.CautionMessages;
                    } else if ($.parseFloat(response.Value) != 0) {
                        for (var key1 in response.CautionMessages) {
                            rProductParts[i].FitToolCautionMessages[key1] = response.CautionMessages[key1];
                        }
                    } else if ($.parseFloat(response.Value) == 0) {
                        delete rProductParts[i].FitToolCautionMessages[response.ElementID];
                    }
                }
            }
            result = true;
            break;
        case ELEMENT_TYPE_MAKE:
            if (response.ResetInformation.ResetFabric)
                runningInfo.CautionMessages.Items[index].Fabric = null;
            if (response.ResetInformation.ResetLining)
                runningInfo.CautionMessages.Items[index].Lining = null;
            break;
    }

    return result;
}

function updateDefaultRunningInformation(runningInfoJson) {
    RunningInformation.CautionMessages = runningInfoJson.CautionMessages;
    RunningInformation.PPrice = runningInfoJson.PPrice;
    RunningInformation.RPrice = runningInfoJson.RPrice;
    RunningInformation.ShipmentInfo = runningInfoJson.ShipmentInfo;
    RunningInformation.Measurement = runningInfoJson.Measurement;
    UpdateRunningInformationTabHtml();
}
function UpdateRunningInformationTabHtml(tab) {
    RefreshPPriceTabHtml();
    RefreshRPriceTabHtml();
    RefreshShipmentTabHtml();
    RefreshCautionMessageHtml(tab);
    RefreshMeasurementTabHtml();
    setUpPanels();
    AdjustRunningInformationHeight();
}

function UpdateRunningInformationMeasurement(tab) {
    /// <summary>Refreshes the Measurement tab html with the updated data.</summary>
    if (RunningInformation != null) {
        $("#divFinishedMContainer").html("");
        $("#MeasurementTemplate").tmpl({ Items: RunningInformation.Measurement.ProductParts }).appendTo($("#divFinishedMContainer"));
        ApplyalternateScroll($("#MeasurementScrollContainer"));
        setUpPanels();
    }
}


function RefreshCurrentTabAndCautionMessages() {
    UpdateRunningInformationTabHtml("");
    RefreshCautionMessageHtml();
    AdjustRunningInformationHeight();
}


function ApplyalternateScroll(div) {
    if (div != null) {
        $(div).removeClass("alternate-scroll");
        $(div).alternateScroll();
    }
}

function RefreshPPriceTabHtml() {
    /// <summary>Refreshes the PPrice tab html with the updated date.</summary>
    var RI = RunningInformation;

    if (RI != null) {

        //Prepare template data
        var templateData = { TotalQuantity: 0, Data: null };
        if (RI.Quantity != null)
            templateData.TotalQuantity = RI.Quantity;
        templateData.Data = RI.PPrice;
        alert(RI.PPrice);

        $("#divPPriceContainer").html("");
        $("#PPriceTemplate").tmpl(templateData).appendTo($("#divPPriceContainer"));
        var cntrl = $("#divPPriceContainer").find(".PPriceContainer");
        ApplyalternateScroll(cntrl);
    } else {
        $("#divPPriceContainer").html("");
    }
}


function RefreshRPriceTabHtml() {
    /// <summary>Refreshes the PPrice tab html with the updated date.</summary>
    if (RunningInformation != null) {
        var rPriceContainer = $("#divRPriceContainer");
        var rPriceTemplate = $("#RPriceTemplate");
        if (rPriceContainer != null && rPriceContainer.length > 0 && rPriceTemplate != null && rPriceTemplate.length > 0) {
            rPriceContainer.html("");
            rPriceTemplate.tmpl(RunningInformation.RPrice).appendTo(rPriceContainer);
            var cntrl = rPriceContainer.find(".PPriceContainer");
            ApplyalternateScroll(cntrl);
        }

    }
    else {
        $("#divRPriceContainer").html("");
    }
}

function RefreshShipmentTabHtml() {
    /// <summary>Refreshes the PPrice tab html with the updated date.</summary>
    if (RunningInformation != null) {
        $("#divShipmentContainer").html("");
        $("#ShipmentTemplate").tmpl(RunningInformation.ShipmentInfo).appendTo($("#divShipmentContainer"));
    } else {
        $("#divShipmentContainer").html("");
    }
    AdjustShippmentInfoRowHeight();
}

function AdjustShippmentInfoRowHeight() {
    var shipmentTableHeight = $("#ShipmentTable").height();
    if (!isNaN(shipmentTableHeight)) {
        $("#ItemTable").height($("#ShipmentTable").height());
        $("#ShipmentTable tr").each(function (i) {
            var firstTd = $(this).find("td:first");
            var height = $(firstTd).height();
            var row = $("#ItemTable tr").get(i);
            $(row).find("td").height(height);
        });
    }

}

function RefreshCautionMessageHtml(tab) {
    /// <summary>Refreshes the PPrice tab html with the updated date.</summary>
    if (RunningInformation != null) {


        $("#divCautionMessageContainer").html("");
        $("#CautionMessageTemplate").tmpl(RunningInformation.CautionMessages).appendTo($("#divCautionMessageContainer"));

        $("#divFitToolCautionMessageContainer").html("");
        $("#FitToolCautionMessageTemplate").tmpl({ Items: RunningInformation.CautionMessages.ProductParts }).appendTo($("#divFitToolCautionMessageContainer"));
    } else {
        $("#divCautionMessageContainer").html("");
        $("#divFitToolCautionMessageContainer").html("");
    }
}

function RefreshMeasurementTabHtml() {
    /// <summary>Refreshes the Measurement tab html with the updated data.</summary>
    if (RunningInformation != null) {
        if (RunningInformation.Measurement != null && isValidRunningMeasurement(RunningInformation.Measurement)) {
            var finishedMContainer = $("#divFinishedMContainer");
            var measurementTemplate = $("#MeasurementTemplate");
            if (finishedMContainer != null && finishedMContainer.length > 0 && measurementTemplate != null & measurementTemplate.length > 0) {

                finishedMContainer.html("");
                measurementTemplate.tmpl({ Items: RunningInformation.Measurement.ProductParts }).appendTo(finishedMContainer);
                ApplyalternateScroll($("#MeasurementScrollContainer"));

            }
            setUpPanels();
        }
    } else {
        $("#divFinishedMContainer").html("");
    }
}

function UpdatePriceTotal(priceObject) {

    if (priceObject != null) {
        if (priceObject.Items != null && priceObject.Items.length > 0) {
            var total = 0;
            for (var i = 0; i < priceObject.Items.length; i++) {
                total = total + priceObject.Items[i].PPriceAfterDiscount;
            }
            priceObject.TotalPrice = total;
        }
    }
}

function GetActiveRunningInformationTab() {
   
    var result = "";
    var tabs = $("#tab-container").find("li");
    if (tabs != null && tabs.length > 0) {
        for (var i = 0; i < tabs.length; i++) {

            if ($(tabs[i]).hasClass("active")) {
                var tabName = $(tabs[i]).attr("id");

                switch (tabName) {
                    case "tabPPrice":
                        result = TAB_PPRICE;
                        break;
                    case "tabFinishedMeasurements":
                        result = TAB_MEASUREMENT;
                        break;
                    case "tabShipment":
                        result = TAB_SHIPMENT;
                        break;
                    case "tabRPrice":
                        result = TAB_RPRICE;
                        break;
                }
            }
        }
    }

    return result;
}

/***********************************************************************************************
CAUTION REMARKS

Common functions related controls on caution remarks tab
*************************************************************************************************/
function OnCautionRemarkClick(checkBox) {
    var isChecked = $(checkBox).is(":checked");
    var id = $(checkBox).attr("id");

    $("#" + id).prop('checked', isChecked);
    if ($.trim(id).length > 0) {
        var runningInfo = RunningInformation;

        if (id.match("^CM_FABRIC_")) {
            var itemNumber = GetFabricLiningIDFromCautionRemarkID(id);
            if (itemNumber > 0)
                runningInfo.CautionMessages.Items[itemNumber - 1].Fabric[0].Read = isChecked;
        }
        else if (id.match("^CM_LINING_")) {
            var itemNumber = GetFabricLiningIDFromCautionRemarkID(id);
            if (itemNumber > 0)
                runningInfo.CautionMessages.Items[itemNumber - 1].Lining[0].Read = isChecked;
        }
        else if (id.match("^CM_EXTRALINING_")) {
            var itemNumber = GetFabricLiningIDFromCautionRemarkID(id);
            if (itemNumber > 0)
                runningInfo.CautionMessages.Items[itemNumber - 1].ExtraLining[0].Read = isChecked;
        }
        else if (id.match("^CM_MAKE_")) {
            var iDs = GetMakeIDsFromCautionRemarkID(id);
            if (iDs > 0 && iDs.ItemID > 0 && iDs.ProductPartID > 0)
                runningInfo.CautionMessages.Items[iDs.ItemID - 1].Make[iDs.ProductPartID].Read = isChecked;
        }
        else if (id.match("^CM_DOV_")) {
            var iDs = GetDOVIDsFromCautionRemarkID(id);
            if (iDs > 0 && iDs.ItemID > 0 && iDs.ProductPartID > 0 && iDs.DesignOptionID > 0)
                runningInfo.CautionMessages.Items[iDs.ItemID - 1].Make[iDs.ProductPartID][iDs.DesignOptionID] = isChecked;
        }
        else if (id.match("^CM_INVOICE_SURCHARGE")) {
            IS_SURCHARGE_CHECKED = !IS_SURCHARGE_CHECKED;
        }
    }
    CheckAndMarkSelectAllCautionMessagesCheckbox();
}

function ClearCautionRemarkFromSession(elementType, elementID, itemNumber, productPart) {
    /// <summary>Sends a request on server to clear caution message for an element.</summary>
    /// <param name="elementType" type="string">The type of the element whose caution message needs to be cleared {'Make','FABRIC','LINING'}.</param>
    /// <param name="elementID" type="int">The ID of the element whose caution message needs to be cleared.</param>
    /// <param name="itemNumber" type="int">The sequence number (starting with 1) of the item in picture {1,2,3}.</param>
    /// <param name="productPart" type="int">The ID of the product part.</param>
    /// <returns type="Number">Nothing.</returns>

    //Prepare the request data
    var requestData =
    {
        RequestType: REQUEST_TYPE_ELEMENT,
        Tab: TAB_NONE,
        ElementType: elementType,
        ElementID: elementID,
        ItemNumber: itemNumber,
        ProductPart: productPart
    };

    $.ajax(
        {
            type: "GET",
            url: "/CustomOrder/ClearCautionMessage",
            data: requestData,
            success: function (data) {
            }
        });

}

function GetFabricLiningIDFromCautionRemarkID(id) {
    var result = -1;

    if (id.match("^CM_FABRIC_")) {
        result = $.parseInt(id.replace("CM_FABRIC_", ""));
    }
    else if (id.match("^CM_LINING_")) {
        result = $.parseInt(id.replace("CM_LINING_", ""));
    }
    else if (id.match("^CM_EXTRALINING_")) {
        result = $.parseInt(id.replace("CM_EXTRALINING_", ""));
    }

    return result;
}

function GetMakeIDsFromCautionRemarkID(id) {
    var result = { ItemID: 0, ProductPartID: 0 };


    var arr = id.split("_");
    if (arr != null && arr.length > 1)
        result.ItemID = $.parseInt(arr[1]);
    if (arr != null && arr.length > 2)
        result.ProductPartID = $.parseInt(arr[2]);

    return result;
}

function GetDOVIDsFromCautionRemarkID(id) {
    var result = { ItemID: 0, ProductPartID: 0, DesignOptionID: 0 };


    var arr = id.split("_");
    if (arr != null && arr.length > 1)
        result.ItemID = $.parseInt(arr[1]);
    if (arr != null && arr.length > 2)
        result.ProductPartID = $.parseInt(arr[2]);
    if (arr != null && arr.length > 3)
        result.DesignOptionID = $.parseInt(arr[3]);

    return result;
}
function GetIndividualMakes(combinationId, itemNumber, productPartId, selectedMakeId, nextdropdown, isFirstProductPart, previousProductPartId, nextProductPartIds) {    
    var isSSOrder = $("#HDIsOrderCreationWithSSO").val() == "true";
    var isCallAsync = $("#HDIsOrderCreationWithSSO").val() == "true" && $("#HDDataLoaded").val() == "false";
    $.ajax({
        url: onMakeChangeUrl,
        async: !isCallAsync,
        data: { combinationId: combinationId, itemNumber: itemNumber, productPartId: productPartId, selectedMakeId: selectedMakeId, isFirstProductPart: isFirstProductPart, previousProductPartId: previousProductPartId, nextProductPartIds: nextProductPartIds.join(",") },
        success: function (data) {
            nextdropdown.clearOldAndAddItems(data);
            DisplayDropdownValueInTextbox(nextdropdown.attr("id"));
            RefreshRunningInformation(REQUEST_TYPE_ELEMENT, TAB_PPRICE, ELEMENT_TYPE_MAKE, selectedMakeId, itemNumber, productPartId, "0", CUSTOM_ORDER);
            if (itemNumber == 3) {
                $('.panel').alternateScroll('remove');
                $('.panel').alternateScroll();
                $("div.panel").find(".alt-scroll-horizontal-bar").css('left', '0px');

            }
            var isDeterministicProductPart = $("#HDSSOOrderIsDeterministicPP_" + productPartId).val() == 'true';
            if (selectedMakeId > 0) {
                if (productPartId != 27) {
                    if (isSSOrder) {
                        var deterministicPPId = $("#HDDeterministicProductPartID").val();
                        if (isDeterministicProductPart || deterministicPPId == productPartId) {
                            //GetPrimaryButtons(itemNumber, productPartId, false);
                           
                                GetPrimaryTrims(itemNumber, productPartId, false);
                          
                            GetCanvasValues(itemNumber, productPartId, selectedMakeId);
                        }
                    }
                    else {
                        //GetPrimaryButtons(itemNumber, productPartId, false);
                       
                            GetPrimaryTrims(itemNumber, productPartId, false);
                       
                        GetCanvasValues(itemNumber, productPartId, selectedMakeId);
                    }

                }

                if (productPartId == 31)
                {
                    GetInsideLiningValues(itemNumber, selectedMakeId, productPartId);
                    //AttachLiningAutosuggest("Lining_" + itemNumber, liningAutosuggestURL);
                }
                
                //GetDetachableLinerValues(itemNumber, productPartId, selectedMakeId);
            } else {
                if (productPartId != 27) {
                    if (!isSSOrder) {
                        $("#Button_" + itemNumber).html("");
                    }
                    LoadMunroDropDowns();
                }
            }
            if (isSSOrder && isDeterministicProductPart) {
                var fabricId = $("#HDSSOOrderFabricId").val();
                var fabricName = $("#HDSSOOrderFabricName").val();
                var atelierId = $("#HDSSOOrderAtelierId").val();
                var isCLFabric = $("#HDSSOOrderFabricNotification").val();
                var extraDays = $("#HDSSOOrderFabricExtraDays").val();
                $("#Fabric_" + itemNumber).val(fabricName);
                $("#HDFabric_" + itemNumber).val(fabricId);
                $("#EDFabric_" + itemNumber).val(extraDays);
                $("#CLFabric_" + itemNumber).val(isCLFabric);
                if (fabricId > 0) {
                    var text = "";
                    if (extraDays != 0 && isCLFabric.toLowerCase() == "true") {
                        text = String.format(GetResourceText("CLFABRIC_WITH_EXTRA_DAYS", "Please note this is a CL Fabric with temporarily delay of {0} days"), extraDays);
                    }
                    else if (isCLFabric.toLowerCase() == "true" && extraDays == 0) {
                        text = GetResourceText("CLFABRIC_WITH_NO_EXTRA_DAYS", "Please note this is a CL Fabric");
                    }
                    else if (isCLFabric.toLowerCase() == "false" && extraDays > 0) {
                        text = String.format(GetResourceText("EXTRADAYS", "{0} extra day(s)"), extraDays);
                    }
                    $("#spFabric_" + itemNumber).html(text);
                    LoadMachingInfoData(fabricId, itemNumber, true, atelierId, true);
                }
            }
            // Not allow copy and finalize when user will back to step                        
            GoToFinalizedElementUpdateToFalse();

            if (combinationId && combinationId > 0 && combinationId == 42) {

                if (productPartId == 26) {
                    var detachableMakeDrp = $("div[id ^= trProductPart_]").find("select[id ^= Make_27_"+itemNumber+"]");
                    var detachableMakeDrpId= $("div[id ^= trProductPart_]").find("select[id ^= Make_27_"+itemNumber+"]").attr("id");
                    $('select[id^= '+detachableMakeDrpId+'] option[value="11"]').attr("selected","selected");
                    OnMakeSelectionChange(detachableMakeDrp);
                }
            }
        }
    });    

}


function GetPrimaryButtons(itemNumber, productPartId,isforFabricSelection) {
    $.getJSON(getPrimaryButtonUrl, { productPartId: productPartId, itemNumber: itemNumber,isforFabricSelection:isforFabricSelection },
        function (data) {
            if (data.status)
                AddOptionForPrimaryButton(data.data, itemNumber);
            if ($("#HDIsOrderCreationWithSSO").val() == "true") {
                
                var buttonId = $("#HDSSOOrderButtonId_" + productPartId ).val();
                $("#Button_" + itemNumber).val(buttonId);
                LoadMunroDropDowns();
            }
        });
}

function GetPrimaryTrims(itemNumber, productPartId, isforFabricSelection) {
    $.getJSON(getPrimaryTrimUrl, { productPartId: productPartId, itemNumber: itemNumber, isforFabricSelection: isforFabricSelection },
        function (data) {
            if (data.status)
                AddOptionForPrimaryTrim(data.data, itemNumber);
            if ($("#HDIsOrderCreationWithSSO").val() == "true") {

                var trimId = $("#HDSSOOrderTrimId_" + productPartId).val();
                $("#Trim_" + itemNumber).val(trimId);
                SetPrimaryInfoTrimExtraDaysNote(itemNumber, trimId, productPartId);
                LoadMunroDropDowns();
            }
        });
}


function SetPrimaryInfoTrimExtraDaysNote(itemNumber, selectedTrimId, productPartId) {
    var extraDays = $("#Trim_" + itemNumber).find("Option[value=" + selectedTrimId + "]").attr("data-extraDays");
    if (extraDays > 0) {
        var text = String.format(GetResourceText("EXTRADAYS", "{0} extra day(s)"), extraDays);
        $("#spTrim_" + itemNumber).html(text);

    } else {
        $("#spTrim_" + itemNumber).html("");
    }
    RefreshRunningInformation(REQUEST_TYPE_ELEMENT, TAB_SHIPMENT, ELEMENT_TYPE_TRIM, "spTrim_" + itemNumber, itemNumber, productPartId, selectedTrimId, CUSTOM_ORDER);
}

function AddOptionForPrimaryButton(data, itemNumber) {
    var combo = $("#Button_" + itemNumber);
    $("#Button_" + itemNumber).html("");
    $.each(data, function (i, el) {
        combo.append($("<option>").attr('value', el.Value).attr('data-extraDays', el.ExtraDays).text(el.Text));
    });

};


function AddOptionForPrimaryTrim(data, itemNumber) {
    var combo = $("#Trim_" + itemNumber);
    $("#Trim_" + itemNumber).html("");
    $.each(data, function (i, el) {
        combo.append($("<option>").attr('value', el.Value).attr('data-extraDays', el.ExtraDays).text(el.Text));
    });

};


function GetCanvasValues(itemNumber, productPartId, makeId) {
    $.getJSON(getCanvasOptionsUrl, { productPartId: productPartId, itemNumber: itemNumber, makeId: makeId },
        function (data) {
            $("#Canvas_" + productPartId + "_" + itemNumber).clearOldAndAddItems(data.data);
            if ($("#HDIsOrderCreationWithSSO").val() == "true") {
                var canvasId = $("#HDSSOOrderCanvas_" + productPartId).val();
                $("#Canvas_" + productPartId + "_" + itemNumber).val(canvasId);
                LoadMunroDropDowns();
            }
        });
}

function GetInsideLiningValues(itemNumber, selectedMakeId, productPartId) {    
    $.getJSON(getInsideLiningOptionsUrl, { productPartId: productPartId, makeId: selectedMakeId, itemNumber: itemNumber },
        function (data) {
            $("#InsideLining_" + productPartId + "_" + itemNumber).clearOldAndAddItems(data.data);
            
            $.each(data.data, function (index, element) {
                if (element.IsDefault) {
                    $("#InsideLining_" + productPartId + "_" + itemNumber).val(element.Value);
                }
            });
            if ($("#HDIsOrderCreationWithSSO").val() == "true") {
                var liningId = $("#HDSSOOrderLiningStyle_" + productPartId).val();
                $("#InsideLining_" + productPartId + "_" + itemNumber).val(liningId);
                LoadMunroDropDowns();
            }
            if (productPartId == 31)
            {
                AttachLiningAutosuggest("Lining_" + itemNumber, liningAutosuggestURL);
            }
        });
}
//function GetDetachableLinerValues(itemNumber, productPartId, makeId) {
//	$.getJSON(getDetachableLinerOptionsUrl, { productPartId: productPartId, itemNumber: itemNumber, makeId: makeId },
//		function (data) {
//			$("#DetachableLiner_"+ productPartId + "_" +itemNumber).clearOldAndAddItems(data.data);
//		});
//}
/***********************************************************************************************
OC1 STEP1: PRIMARY INFORMATION


Functions related controls on primary information tab.
*************************************************************************************************/

function OnMakeSelectionChange(dropdown) {
	
    var IDs = GetProductPartAndItemFromMakeDropdown(dropdown);
    var selectedMakeId = $(dropdown).val();
    var combinationID = $("#ddCombinations").val();
    var item = IDs.Item;
    var productPart = IDs.ProductPartID;
    var nextMakeDropdown = GetNextMakeDropdown(dropdown, item);
    var nextAllMakeDropdowns = GetAllNextMakeDropdowns(dropdown, item);
    var prevMakeDropdown = GetPreviousMakeDropdown(dropdown, item);
    var isFirstProductPart = false;
    var previousProductPartId = 0;
    var nextProductPartIds = new Array();
    if (prevMakeDropdown.length == 0)
        isFirstProductPart = true;
    else
        previousProductPartId = GetProductPartAndItemFromMakeDropdown(prevMakeDropdown).ProductPartID;

    if (nextAllMakeDropdowns.length > 0) {
        for (var i = 0; i < nextAllMakeDropdowns.length; i++) {
            nextProductPartIds.push(GetProductPartAndItemFromMakeDropdown(nextAllMakeDropdowns[i]).ProductPartID);
            var isSSOrder = $("#HDIsOrderCreationWithSSO").val() == "true";
            var previousOrderPPs = $("#HDSSOOrderPPs").val();
            var ppInOrder = previousOrderPPs.split(",");
            var ppId = GetProductPartAndItemFromMakeDropdown(nextAllMakeDropdowns[i]).ProductPartID;
            var isSSOForProductPart = ppInOrder.filter(x => x == ppId);
            if (isSSOrder) {
                if (isSSOForProductPart != null) {

                } else {
                    $("#" + nextAllMakeDropdowns[i].id).val("-1");
                    InitializeDropDownWithoutSearchBoxByID(nextAllMakeDropdowns[i].id);
                }
            } else {
                $("#" + nextAllMakeDropdowns[i].id).val("-1");
                InitializeDropDownWithoutSearchBoxByID(nextAllMakeDropdowns[i].id);
            }
        }
    }
    nextAllMakeDropdowns.each(function (index, element) {
        $(element).clearOldAndAddItems([{ Text: "", Value: "-1" }]);
    });
    GetIndividualMakes(combinationID, item, productPart, selectedMakeId, nextMakeDropdown, isFirstProductPart, previousProductPartId, nextProductPartIds);

}

function OnFabricLiningSelection(elementType, fabricLiningTextbox, isCallForDiffLining = false) {

    var fabricLiningTextBoxID = $(fabricLiningTextbox).attr("id");
    var selectedID = $("#HD" + fabricLiningTextBoxID).val();
    var itemNumber = GetItemNumberFromFabricLiningTextboxID(fabricLiningTextBoxID);

    RefreshRunningInformation(REQUEST_TYPE_ELEMENT, TAB_PPRICE, elementType, selectedID, itemNumber, -1, "0", CUSTOM_ORDER, 0, false, isCallForDiffLining);


}


/*.............................
Caution messages related
.............................*/


function OnEmptyFabricLiningSelection(elementType, fabricLiningTextbox) {
    var fabricLiningTextBoxID = $(fabricLiningTextbox).attr("id");
    var itemNumber = GetItemNumberFromFabricLiningTextboxID(fabricLiningTextBoxID);
    var index = itemNumber - 1;

    if (index >= 0) {
        if (ClearFabricLiningCautionMessage(elementType, index)) {
            ClearCautionRemarkFromSession(elementType, -1, itemNumber, -1);
            RefreshCautionMessageHtml();
        }
    }
}
function clearSelectedFabric(item) {
     var isSSOOrder = $("#HDIsOrderCreationWithSSO").val() == "true";

    if (isSSOOrder) {
        return;
    }

    var fabricInput = $("#Fabric_" + item);
    var extraDaysSpan = $("#spFabric_" + item);
    var fabricHidden = $("#HDFabric_" + item);
    var extraDaysHidden = $("#EDFabric_" + item);
    fabricInput.val("");
    extraDaysSpan.empty();
    fabricHidden.val("-1");
    extraDaysHidden.val("0");

}
function clearSelectedLining(item) {
    var isSSOOrder = $("#HDIsOrderCreationWithSSO").val() == "true";

    if (isSSOOrder) {
        return;
    }

    var liningInput = $("#Lining_" + item);
    var extraDaysSpan = $("#spLining_" + item);
    var liningHidden = $("#HDLining_" + item);
    var extraDaysHidden = $("#EDLining_" + item);
    liningInput.val("");
    extraDaysSpan.empty();
    liningHidden.val("-1");
    extraDaysHidden.val("0");

}

function clearSelectedExtraLining(item) {
    var isSSOOrder = $("#HDIsOrderCreationWithSSO").val() == "true";

    if (isSSOOrder) {
        return;
    }

    var liningInput = $("#WaistcoatLining_" + item);
    var extraDaysSpan = $("#spWaistcoatLining_" + item);
    var liningHidden = $("#HDWaistcoatLining_" + item);
    var extraDaysHidden = $("#EDWaistcoatLining_" + item);
    liningInput.val("");
    extraDaysSpan.empty();
    liningHidden.val("-1");
    extraDaysHidden.val("0");

}

function ResetSelectedLiningRM() {

    $("#Lining").val("");
    $("#spLining").empty();
    $("#HDLining").val("-1");
    $("#EDLining").val("0");
    $("#LiningPossibleAteliers").html("");
}

function ResetSelectedExtraLiningRM() {
    $("#WaistcoatLining").val("");
    $("#spWaistcoatLining").empty();
    $("#HDWaistcoatLining").val("-1");
    $("#EDWaistcoatLining").val("0");
    $("#LiningPossibleAteliers").html("");
}
function ClearFabricLiningCautionMessage(elementType, index) {
    var result = false;

    var runningInfo = RunningInformation;
    if (runningInfo != null && runningInfo.CautionMessages != null && runningInfo.CautionMessages.Items != null
        && runningInfo.CautionMessages.Items.length > index) {

        if (elementType == ELEMENT_TYPE_FABRIC && runningInfo.CautionMessages.Items[index].Fabric != null
            && runningInfo.CautionMessages.Items[index].Fabric.length > 0)
        {
            runningInfo.CautionMessages.Items[index].Fabric = new Array();
            runningInfo.CautionMessages.Items[index].Lining = new Array();
            runningInfo.CautionMessages.Items[index].ExtraLining = new Array();
            result = true;
        }
        else if (elementType == ELEMENT_TYPE_LINING && runningInfo.CautionMessages.Items[index].Lining != null
            && runningInfo.CautionMessages.Items[index].Lining.length > 0) {
            runningInfo.CautionMessages.Items[index].Lining = new Array();
            result = true;
        }
        else if (elementType == ELEMENT_TYPE_EXTRA_LINING && runningInfo.CautionMessages.Items[index].ExtraLining != null
            && runningInfo.CautionMessages.Items[index].ExtraLining.length > 0) {
            runningInfo.CautionMessages.Items[index].ExtraLining = new Array();
            result = true;
        }
    }
    return result;
}
/**************RPRICE For Make**********************/

function OnDesignOptionValueSelectionChange(dropdown, designOptionID, isTextBox, controlID, buttonList, orderType) {
    var activeTab = $("#ActiveProductTab").val();
    var productPartID = $("#" + activeTab).find("input[id^=designOptionProductPartID]").val();
    var currentItem = 1;
    var isCurrentDOVTrim = false;
    var trimMasterIDofCurrentDOV = 0;
    if (orderType == CUSTOM_ORDER) {
        currentItem = $("#" + activeTab).find("input[id^=currentItem]").val();
    }
    var selecteValuID = 0;
    if (!isTextBox) {
        //designOptionID = GetDesignOptionIDFromID(dropdown);
        selecteValuID = $("#" + dropdown).val();
    } else {
        //designOptionID = GetDesignOptionIDFromID(controlID);
        selecteValuID = dropdown;
    }

    if (selecteValuID != null && selecteValuID != -1 && selecteValuID.includes("_")) {         // it means it contains trim master
        trimMasterIDofCurrentDOV = selecteValuID.split("_")[1];
        selecteValuID = selecteValuID.split("_")[0];
        isCurrentDOVTrim = true;
    }

    var numberOfBlocksChosen = 0;
    var monogramDetails = $("#" + dropdown).parents().find('div[id^="MonogramDetails_"]');
    if (monogramDetails.length > 0) {
        
        var monogramDetailsDiv;

        $.each(monogramDetails,
            function(i) {
                if ($(this).find('select[id="' + dropdown + '"]').length > 0) {
                    monogramDetailsDiv = $(this).attr('id');
                }
            });

        if (monogramDetailsDiv!= undefined) {
            numberOfBlocksChosen = $("#"+ monogramDetailsDiv).find('div[id^="monogramBlock_"]').length;
        }

    }

    if (buttonList == 0) {
        if (isCurrentDOVTrim) {

            RefreshRunningInformation(REQUEST_TYPE_ELEMENT, TAB_RPRICE, ELEMENT_TYPE_TRIM, designOptionID, currentItem, productPartID, trimMasterIDofCurrentDOV, orderType, numberOfBlocksChosen);
            RefreshRunningInformation(REQUEST_TYPE_ELEMENT, TAB_RPRICE, ELEMENT_TYPE_DOV, designOptionID, currentItem, productPartID, selecteValuID, orderType, numberOfBlocksChosen, true);

        }
        else
            RefreshRunningInformation(REQUEST_TYPE_ELEMENT, TAB_RPRICE, ELEMENT_TYPE_DOV, designOptionID, currentItem, productPartID, selecteValuID, orderType, numberOfBlocksChosen);
    }
    else if (buttonList == 1 || buttonList == 3)
        RefreshRunningInformation(REQUEST_TYPE_ELEMENT, TAB_RPRICE, ELEMENT_TYPE_TRIM, designOptionID, currentItem, productPartID, selecteValuID, orderType);
    else if (buttonList == 2) {
        RefreshRunningInformation(REQUEST_TYPE_ELEMENT, TAB_RPRICE, ELEMENT_TYPE_LININGDOV, designOptionID, currentItem, productPartID, selecteValuID, orderType);
    }

}


function OnFitToolSelectionChange(fitToolID, fitToolValue, productPartID, orderType) {
    RefreshRunningInformation(REQUEST_TYPE_ELEMENT, TAB_MEASUREMENT, ELEMENT_TYPE_FITTOOL, fitToolID, 1, productPartID, fitToolValue, orderType);
}
function OnFiToolDOVSelectionChanged(designOptionId, dovId, productPartId, orderType) {
    RefreshRunningInformation(REQUEST_TYPE_ELEMENT, TAB_MEASUREMENT, ELEMENT_TYPE_FITTOOL_DOV, designOptionId, 1, productPartId, dovId, orderType);
}

//For Body measurement 
function OnBodyMeasurementSelectionChange(measurementId, measurementValue, productPartID, orderType) {
    RefreshRunningInformation(REQUEST_TYPE_ELEMENT, TAB_MEASUREMENT, ELEMENT_TYPE_BODY, measurementId, 1, productPartID, measurementValue, orderType);
}

function OnGarmentMeasurementSelectionChange(measurementId, measurementValue, productPartID, orderType) {
    RefreshRunningInformation(REQUEST_TYPE_ELEMENT, TAB_MEASUREMENT, ELEMENT_TYPE_GARMENT, measurementId, 1, productPartID, measurementValue, orderType);
}



function DisplayPossibleAtelierIDs(response) {
    if (response.OrderType == READYMADE_ORDER) {
        switch (response.ElementType) {
            case ELEMENT_TYPE_FABRIC:
                $("#FabricPossibleAteliers").html(response.PossibleAtelierIDs);
                break;
            case ELEMENT_TYPE_LINING:
                $("#LiningPossibleAteliers").html(response.PossibleAtelierIDs);
                break;
            //case ELEMENT_TYPE_EXTRA_LINING:
            //    $("#LiningPossibleAteliers").html(response.PossibleAtelierIDs);
            //    break;
        }
    }
}

function CollectAllCautionMessages() {
    var cautionMessages = [];
    $("input[type=checkbox][id^=CM]").each(function (index, element) {
        var cautionMessage = { Name: $(element).attr("id"), CheckState: element.checked };
        cautionMessages.push(cautionMessage);
    });
    return JSON.stringify(cautionMessages);
}

function SetCollapsablePanelStatus(response) {
    if (response.OrderType == CUSTOM_ORDER) {
        switch (response.ElementType) {
            case ELEMENT_TYPE_DOV:
            case ELEMENT_TYPE_BUTTON:
            case ELEMENT_TYPE_TRIM:
                SetDetailInfo();
                break;
        }
    }
}


function SetDetailInfo() {
    SetCustomOrderDetailInfo($("#CurrentItem").val(), $("#TotalItem").val());
}


function SetCustomOrderDetailInfo(id, totalItem) {
    $('#tab-container').easytabs('select', "#Container5");

    for (var i = 1; i <= totalItem; i++) {
        $("#RItemDetail_" + i).removeClass();
        if (i == id) {
            $("#RItemDetail_" + id).addClass('CollapsiblePanel');
        } else {
            $("#RItemDetail_" + i).addClass('panelcollapsed');
        }

    }
}


