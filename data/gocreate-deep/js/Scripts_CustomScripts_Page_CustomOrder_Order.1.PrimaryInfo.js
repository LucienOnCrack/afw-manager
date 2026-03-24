/*!
* This file contains functions related to "Primary information" step
* of the order creation wizard.
*/



/******************************************************************************************************
Functions related to adding/removing rows and column according to selected quantity
*******************************************************************************************************/
var ITEM_ROW_ID_PREFIX = "trItemHeader";
var ITEM_COLUMN_ID_PREFIX = "tdItem";
var PRODUCTPART_ROW_ID_PREFIX = "trProductPart_";
var MAKE_COLUMN_ID_PREFIX = "tdMake";
var MAKE_AND_MATERIAL_TABLE_ID = "tblMakeAndMaterial";
var FABRIC_COLUMN_ID_PREFIX = "tdFabric";
var FABRIC_COLUMN_ID_PREFIX = "tdFabric";
var LINING_COLUMN_ID_PREFIX = "tdLining";
var FABRIC_EXTRADAYS_ROW_ID_PREFIX = "tdFabricExtraDays";
var LINING_EXTRADAYS_ROW_ID_PREFIX = "tdLiningExtraDays";
var EXTRA_LINING_EXTRADAYS_ROW_ID_PREFIX = "tdWaistcoatLiningExtraDays";


function GetMakesAccordingToCombinationAndQuantity(getPrimaryInfoMakeViewURL, isCallFromCombinationChange, isCallFromResetSSOOrderCopy) {
    var isDuplicateOrder = false;
    //alert("GetMakesAccordingToCombinationAndQuantity");
    var combinationID = $("#ddCombinations").val();
    var combination = $("#ddCombinations option:selected").text();
    var quantity = $("#ddQuantities").val();

    var URL = getPrimaryInfoMakeViewURL;

    if (isCallFromResetSSOOrderCopy === undefined) {
        isCallFromResetSSOOrderCopy = false;
    }


    var data = { combinationID: combinationID, quantity: quantity, isDuplicateOrder: isDuplicateOrder, isCallFromResetSSOOrderCopy: isCallFromResetSSOOrderCopy };
    var DIV = "divPrimaryProductDetails ";

    if (isCallFromCombinationChange) {
        if ($("#hdnProductCombinationID") != undefined &&
            $("#hdnProductCombinationID").val() ===
            "45" /*hide Measurements running info tab & change max quantity to 10 for facemask only*/) {
            AppendQuantityOptions(20);
        } else {
            var maxOrderQuantity = $("#hdnMaxOrderQuantity").val();
            AppendQuantityOptions(5);
        }
    }

    /// Validate and restrict Test garment spp with Multiple order quantity
    var testGarmentAvailable = IsTestGarmentAvailable(-1, quantity);
    if (testGarmentAvailable) {
        ShowTestGarmentErrorBox(undefined, false);
        return false;
    }

    if ((combinationID > 0 && quantity > 0) || (combinationID == -1)) {
        if (quantity == 1) {
            $("#SSOCopyOrderNumber").show();
        }
        else {
            $("#SSOCopyOrderNumber").hide();
        }
        if (quantity > 1 && quantity <= 5) {
            ShowMultipleOrderSelectionDialog(combinationID, quantity, getPrimaryInfoMakeViewURL, combination);

        } else if (quantity > 5) {
            $("#HDSetPreQuantityValue").val(quantity);
            quantity = 1;
            isDuplicateOrder = true;
            SubmitPrimaryInfoForm(combinationID, quantity, getPrimaryInfoMakeViewURL, isDuplicateOrder);
        }
        else {
            $("#HDSetPreQuantityValue").val("1");
            var options = {
                data: data,
                url: getPrimaryInfoMakeViewURL,
                success: function (responseData) {
                    if (responseData != null) {
                        /// Validate and restrict Test garment spp with Multiple order quantity
                        if (responseData.IsTestGarmentSppUse) {
                            ShowTestGarmentErrorBox(element, true);
                        }
                        else {
                            $("#divPrimaryProductDetails").html(responseData);
                        }
                    }

                    if (combinationID && combinationID > 0 && (combinationID == 42 || combinationID == 34)) {

                        var makeDrp = $("div[id ^= trProductPart_]").find("select[id ^= Make_]");

                        var quantityWhereMakeSet = 1;
                        var quantityWhereMakeSetArry = [];

                        if (makeDrp) {
                            jQuery.each(makeDrp,
                                function (i, element) {
                                    var value = $(element).val();
                                    var id = $(element).attr('id');
                                    var splitId = id.split('_');
                                    if (value && value > 0) {

                                    }
                                    else {
                                        quantityWhereMakeSetArry.push(splitId[2]);
                                    }
                                });
                        }
                        quantityWhereMakeSet = Math.min.apply(Math, quantityWhereMakeSetArry);

                        jQuery.each(makeDrp,
                            function (i, element) {
                                var id = $(element).attr('id');
                                var splitId = id.split('_');

                                if (splitId[2] && splitId[2] > 0 && quantityWhereMakeSet <= splitId[2])
                                    OnMakeSelectionChange(element);
                            });
                    }
                    BindLazyLoadForInfoImages();
                }
            }; $("#frmPrimaryInfo").ajaxForm(options);
            $("#frmPrimaryInfo").submit();
        }

    } else {
        $("#divPrimaryProductDetails").html("");
        return false;
    }

    //var activeTab = $("#ActiveProductTab").val();
    //$("#frmPrimaryInfo").ajaxForm(options);
    //$("#frmPrimaryInfo").submit();

    //FetchAndDisplay(URL, data, DIV);
}

function OnModelItemChange(element, itemNumber, productPartID) {

    var itemId = $(element).val();
    var combinationID = $("#ddCombinations").val();
    var quantity = $("#ddQuantities").val();
    var URL = "/CustomOrder/GetPrimaryMakeViewModelBasedOnItemSelection";
    var isCallAsync = $("#HDIsOrderCreationWithSSO").val() == "true" && $("#HDDataLoaded").val() == "false";
    var isSSOOrder = $("#HDIsOrderCreationWithSSO").val() == "true";

    var data = { modelID: itemId, itemNumber: itemNumber, productPartId: productPartID };
    var DIV = "divPrimaryProductDetails ";
    if ((combinationID > 0 && quantity > 0) || (combinationID == -1)) {
        var options = {
            data: data,
            url: URL,
            async: !isCallAsync,
            success: function (responseData) {
                if (responseData != null) {
                    var liningID = -1;
                    //$("#divPrimaryProductDetails").html(responseData);


                    RefreshRunningInformation(REQUEST_TYPE_ELEMENT, TAB_PPRICE, ELEMENT_TYPE_STYLE, $("#OrderModel_" + productPartID + "_" + itemNumber).val(), itemNumber, productPartID, "0", CUSTOM_ORDER);


                    $.each(responseData.data.OrderProductPartMakeses, function (i, productPart) {

                        var items = "";
                        var makeControlId = "Make_" + productPart.ProductPartId + "_" + itemNumber;
                        $.each(productPart.ProductMakes, function (j, item) {

                            items += "<option value='" + item.ID + "'>" + item.LocalizedName + "</option>";
                        });

                        $("#" + makeControlId).html(items);
                        var selectedMakeId = productPart.SelectedMakeId;
                        if ($("#HDIsOrderCreationWithSSO").val() == "true") {
                            selectedMakeId = $("#HDSSOOrderMake_" + productPartID).val();
                        }
                        $("#" + makeControlId).val(selectedMakeId);
                        InitializeDropDownWithoutSearchBoxByID(makeControlId);
                    });
                    RefreshRunningInformation(REQUEST_TYPE_ELEMENT, TAB_PPRICE, ELEMENT_TYPE_MAKE, $("#Make_" + productPartID + "_" + itemNumber).val(), itemNumber, productPartID, "0", CUSTOM_ORDER);

                    $.each(responseData.data.CanvasOptionPerParts, function (i, productPart) {

                        var items = "";
                        var canvasControlId = "Canvas_" + productPart.ProductPartId + "_" + itemNumber;
                        $.each(productPart.CanvasDovs, function (j, item) {

                            items += "<option value='" + item.DesignOptionValueID + "'>" + item.DesignOptionValueName + "</option>";
                        });

                        $("#" + canvasControlId).html(items);
                        if (responseData.data.SelectedCanvasId > 0)
                            $("#" + canvasControlId).val(responseData.data.SelectedCanvasId);
                        InitializeDropDownWithoutSearchBoxByID(canvasControlId);
                    });

                    var buttonControlId = "Button_" + itemNumber;
                    var items = "";
                    $.each(responseData.data.OrderButtons, function (i, button) {
                        items += "<option value='" + button.ButtonID + "'>" + button.ButtonName + "</option>";
                    });

                    $("#" + buttonControlId).html(items);
                    InitializeDropDownWithoutSearchBoxByID(buttonControlId);
                    if (responseData.data.SelectedButtonId > 0)
                        $("#" + buttonControlId).val(responseData.data.SelectedButtonId);


                    var trimControlId = "Trim_" + itemNumber;
                    var items = "";
                    $.each(responseData.data.OrderTrims, function (i, trim) {
                        
                        items += "<option value='" + trim.TrimMasterID + "' data-extraDays='" + trim.ExtraDays + "'>" + trim.TrimMasterName + "</option>";

                    });

                    $("#" + trimControlId).html(items);
                    InitializeDropDownWithoutSearchBoxByID(trimControlId);
                    if (responseData.data.SelectedTrimId > 0) {
                        $("#" + trimControlId).val(responseData.data.SelectedTrimId);
                        SetPrimaryInfoTrimExtraDaysNote(itemNumber, responseData.data.SelectedTrimId, productPartID);
                    }
                   
                    if (!isSSOOrder) {
                        var sFabricControl = "#spFabric_" + itemNumber;

                        $(sFabricControl).html("<label>" + responseData.data.FabricExtraInfo + "</label>");


                        var sLiningControl = "#spLining_" + itemNumber;

                        $(sLiningControl).html("<label>" + responseData.data.LiningExtraInfo + "</label>");


                        var sWaistcoatLiningControl = "#spWaistcoatLining_" + itemNumber;

                        $(sWaistcoatLiningControl).html("<label>" + responseData.data.WaistcoatLiningExtraInfo + "</label>");

                        var fabricControlId = "#Fabric_" + itemNumber;
                        var liningControlId = "#Lining_" + itemNumber;
                        var extraLiningControlId = "#WaistcoatLining_" + itemNumber;
                        $(fabricControlId).val(responseData.data.SelectedFabric.Name);
                        $(liningControlId).val(responseData.data.SelectedLining.Name);

                        if (responseData.data.SelectedExtraLining) {
                            $(extraLiningControlId).val(responseData.data.SelectedExtraLining.Name);
                        }

                        //set fabric hidden fields 
                        if (responseData.data.SelectedFabric) {
                            $("#HDFabric_" + itemNumber).val(responseData.data.SelectedFabric.ID);
                            $("#CLFabric_" + itemNumber).val(responseData.data.SelectedFabric.Notification);
                        }
                        $("#EDFabric_" + itemNumber).val(responseData.data.FabricExtraDays);

                        //set lining hidden fields 
                        if (responseData.data.SelectedLining) {
                            $("#HDLining_" + itemNumber).val(responseData.data.SelectedLining.ID);
                            $("#CLLining_" + itemNumber).val(responseData.data.SelectedLining.Notification);
                        }
                        $("#EDLining_" + itemNumber).val(responseData.data.LiningExtraDays);

                        //set extra lining hidden fields 
                        if (responseData.data.SelectedExtraLining) {
                            $("#HDWaistcoatLining_" + itemNumber).val(responseData.data.SelectedExtraLining.ID);
                            $("#CLWaistcoatLining_" + itemNumber).val(responseData.data.SelectedExtraLining.Notification);
                        }
                        $("#EDWaistcoatLining_" + itemNumber).val(responseData.data.WaistcoatLiningExtraDays);


                        OnFabricLiningSelection(ELEMENT_TYPE_FABRIC, $("#Fabric_" + itemNumber));
                        if (liningID != $("#HDLining_" + itemNumber).val()) {
                            OnFabricLiningSelection(ELEMENT_TYPE_LINING, $("#Lining_" + itemNumber));
                        } else {
                            OnFabricLiningSelection(ELEMENT_TYPE_LINING, $("#Fabric_" + itemNumber));
                            OnEmptyFabricLiningSelection(ELEMENT_TYPE_LINING, $("#Lining_" + itemNumber));
                        }
                        if (responseData.data.SelectedExtraLining) {
                            OnFabricLiningSelection(ELEMENT_TYPE_EXTRA_LINING, $("#WaistcoatLining_" + itemNumber));
                        }
                    }
                    else{
                        OnMakeSelectionChange($("#Make_" + productPartID + "_" + itemNumber));
                    }
                }

                if (itemNumber == 3) {
                    $('.panel').alternateScroll('remove');

                    $("div.panel").find(".alt-scroll-horizontal-bar").css('left', '0px');
                }

            }
        };
    }
    $("#frmPrimaryInfo").ajaxForm(options);
    $("#frmPrimaryInfo").submit();
}


function OnSppItemChange(element, itemNumber, productPartID) {
   
    var itemId = $(element).val();
    /// Validate and restrict Test garment spp with Multiple order quantity
    var isTestGarmentAvailable = IsTestGarmentAvailable(itemId, 0)
    if (isTestGarmentAvailable) {
        ShowTestGarmentErrorBox(element, true);
        return false;
    }
    var atelierId = -1;
    var isSSOOrder = $("#HDIsOrderCreationWithSSO").val() == "true";
    if (isSSOOrder) {
        atelierId = $("#HDSSOOrderAtelierId").val();
    }
    var isCallAsync = $("#HDIsOrderCreationWithSSO").val() == "true" && $("#HDDataLoaded").val() == "false";


    var combinationID = $("#ddCombinations").val();
    var quantity = $("#ddQuantities").val();
    var URL = "/CustomOrder/GetPrimaryMakeViewModelBasedOnSppSelection";
    var data = { subProductPartId: itemId, itemNumber: itemNumber, productPartId: productPartID, atelierId: atelierId };
    if ((combinationID > 0 && quantity > 0) || (combinationID == -1)) {
        var options = {
            data: data,
            url: URL,
            async: !isCallAsync,
            success: function (responseData) {

                if (responseData != null) {
                    /// Validate and restrict Test garment spp with Multiple order quantity
                    if (responseData.IsTestGarmentSppUse) {
                        ShowTestGarmentErrorBox(undefined, false);
                    }

                    RefreshRunningInformation(REQUEST_TYPE_ELEMENT, TAB_PPRICE, ELEMENT_TYPE_SPP, $("#Spp_" + productPartID + "_" + itemNumber).val(), itemNumber, productPartID, "0", CUSTOM_ORDER);
                    $.each(responseData.data.OrderPrimaryInformationModelData.OrderProductPartMakeses, function (i, productPart) {

                        var items = "";
                        var makeControlId = "Make_" + productPart.ProductPartId + "_" + itemNumber;
                        $.each(productPart.ProductMakes, function (j, item) {

                            items += "<option value='" + item.ID + "'>" + item.LocalizedName + "</option>";
                        });

                        $("#" + makeControlId).html(items);
                        var selectedMakeId = productPart.SelectedMakeId;
                        if ($("#HDIsOrderCreationWithSSO").val() == "true") {
                            selectedMakeId = $("#HDSSOOrderMake_" + productPartID).val();
                            $("#" + makeControlId).val(selectedMakeId);
                            InitializeDropDownWithoutSearchBoxByID(makeControlId);
                        }
                        else if (productPartID != 26) {
                            $("#" + makeControlId).val(-1);
                            InitializeDropDownWithoutSearchBoxByID(makeControlId);
                        }
                        else {
                            $("#" + makeControlId).val(selectedMakeId);
                            InitializeDropDownWithoutSearchBoxByID(makeControlId);
                        }                        
                       
                        if ($("#HDIsOrderCreationWithSSO").val() == "false") {
                            if ($("#hiddenOrderMode").val() != "0") {
                                RefreshRunningInformation(REQUEST_TYPE_ELEMENT, TAB_PPRICE, ELEMENT_TYPE_MAKE, $("#" + makeControlId).val(), itemNumber, productPartID, "0", CUSTOM_ORDER);
                            }
                        }
                    });
                    $.each(responseData.data.OrderModelViewModel, function (i, styleData) {
                        var defaultText = GetResourceText("NO_PRESENT_STYLE", "none");
                        var items = "<option value='0'>" + defaultText + "</option>";
                        var styleControlId = "OrderModel_" + styleData.ProductPartID + "_" + itemNumber;
                        var isDisable = true;
                        $.each(styleData.OrderModels, function (j, item) {
                            isDisable = false;
                            items += "<option value='" + item.ID + "'>" + item.ModelName + "</option>";
                        });

                        $("#" + styleControlId).html(items);
                        $("#" + styleControlId).val(styleData.SelectedModelID);
                        InitializeDropDownWithoutSearchBoxByID(styleControlId);

                        if (isSSOOrder || isDisable) {
                            $("#" + styleControlId).prop("disabled", true);
                        }
                        else {
                            $("#" + styleControlId).prop("disabled", false);
                        }
                    });

                    if (!isSSOOrder) {
                        $.each(responseData.data.OrderPrimaryInformationModelData.InsideLiningOptionPerParts, function (i, productPart) {

                            var items = "";
                            var insideLiningControlId = "InsideLining_" + productPart.ProductPartId + "_" + itemNumber;
                            $.each(productPart.PrimaryInfoDovs, function (j, item) {

                                items += "<option value='" + item.DesignOptionValueID + "'>" + item.DesignOptionValueName + "</option>";
                            });

                            $("#" + insideLiningControlId).html(items);
                            if (responseData.data.OrderPrimaryInformationModelData.SelectedInsideLiningId > 0)
                                $("#" + insideLiningControlId).val(responseData.data.OrderPrimaryInformationModelData.SelectedInsideLiningId);
                            InitializeDropDownWithoutSearchBoxByID(insideLiningControlId);
                        });
                        if (responseData.data.OrderPrimaryInformationModelData.SelectedFabric == null) {
                            $("#Fabric_" + itemNumber).val("");
                            $("#HDFabric_" + itemNumber).val("");
                        }
                        if (responseData.data.OrderPrimaryInformationModelData.SelectedLining == null) {
                            $("#Lining_" + itemNumber).val("");
                            $("#HDLining_" + itemNumber).val("");
                            $("#EDLining_" + itemNumber).val("");
                            $("#CLLining_" + itemNumber).val("");
                        }
                        if (responseData.data.OrderPrimaryInformationModelData.SelectedExtraLining == null) {
                            $("#WaistcoatLining_" + itemNumber).val("");
                            $("#HDWaistcoatLining_" + itemNumber).val("");
                            $("#EDWaistcoatLining_" + itemNumber).val("");
                            $("#CLWaistcoatLining_" + itemNumber).val("");
                        }
                    }
                    if (isSSOOrder && productPartID != 26) {
                        // not to call below method for Carcoat product part
                        OnMakeSelectionChange($("#Make_" + productPartID + "_" + itemNumber));
                    }
                    if (isSSOOrder && (combinationID == 42 || combinationID == 34)) {
                        // this changes are only for coat + detachable linner as make selection is not available on UI.
                        var fabricId = $("#HDSSOOrderFabricId").val();
                        var fabricName = $("#HDSSOOrderFabricName").val();
                        var atelierId = $("#HDSSOOrderAtelierId").val();
                        var isCLFabric = $("#HDSSOOrderFabricNotification").val();
                        var extraDays = $("#HDSSOOrderFabricExtraDays").val();
                        $("#Fabric_" + itemNumber).val(fabricName);
                        $("#HDFabric_" + itemNumber).val(fabricId);
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
                        //GetPrimaryButtons(itemNumber, productPartID, true);
                       
                            GetPrimaryTrims(itemNumber, productPartID, true);
                      
                        var quiltedLiningId = $("#HDSSOOrderQuiltedLiningId").val();
                        if (quiltedLiningId > 0) {
                            $("#SelectedDetachableLiner_0__ID").val(quiltedLiningId);
                            OnDetachableLinerSelectionChange($("#SelectedDetachableLiner_0__ID"), 1, "SelectedDetachableLiner_0__ID");
                        }
                        LoadMunroDropDowns();
                    }
                    AttachFabricAutosuggest("Fabric_" + itemNumber, fabricAutosuggestURL);
                    AttachLiningAutosuggest("Lining_" + itemNumber, liningAutosuggestURL);
                    var hasExtraLining = $("#HDShowExtraProductLining").val();
                    if (hasExtraLining.toLowerCase() == "true")
                        AttachWaistcoatLiningAutosuggest("WaistcoatLining_" + itemNumber, liningAutosuggestURL);
                }
            }
        };

        var isTestGarmentSelected = false;
        var isTestGarmentNotAvailable = false;
        var ddEmpty = false;

        var TestjacketSppId = $("#JacketSppIdForTestGarment").val();
        var TestTrouserSppId = $("#TrouserSppIdForTestGarment").val();
        var jacketPpId = $("#jacketPpId").val();
        var trouserSppList = $.parseJSON($("#SubProductPartListForTrouserWithTG").val());

        var combinationsAllowedForTestGarment = $("#AllowedCombinationsForTestGarment").val();

        if ((combinationsAllowedForTestGarment) && productPartID == jacketPpId && itemId == TestjacketSppId) { //case 1
            $('#Spp_2_' + itemNumber + ' option').each(function () {
                var data = $(this).val();
                if ((data != "") && (data != TestTrouserSppId)) {
                    $(this).remove();
                }
            });
        }

        if ((combinationsAllowedForTestGarment) && productPartID == jacketPpId && itemId != TestjacketSppId) {  //case 2
            $('#Spp_2_' + itemNumber + ' option').each(function () {
                var data = $(this).val();
                if (data == TestTrouserSppId) {
                    $(this).remove();
                }
            });
        }

        $('#Spp_2_' + itemNumber + ' option').each(function () {
            if ($('#Spp_2_' + itemNumber + ' option').length == 2 &&
                $('#Spp_2_' + itemNumber + ' option').length >= 2) {
                isTestGarmentSelected = true;
            }

            var data = $(this).val();
            if (data == TestTrouserSppId) {
                isTestGarmentNotAvailable = true;
            }

            if ($('#Spp_2_' + itemNumber + ' option').length == 1 && $('#Spp_2_' + itemNumber + ' option').length >= 1) {
                ddEmpty = true;
            }
        });

        if ((combinationsAllowedForTestGarment) && productPartID == jacketPpId && itemId != TestjacketSppId && isTestGarmentSelected == true) {
            $(trouserSppList).each(function (i, item) {
                if (item.SelectedSubProductPartID != TestTrouserSppId) {
                    $('#Spp_2_' + itemNumber).append(`<option value="${item.SelectedSubProductPartID}"> ${item.LocalizedName} </option>`);
                }
            });
        }
        if ((combinationsAllowedForTestGarment)&& productPartID == jacketPpId && itemId == TestjacketSppId  && isTestGarmentNotAvailable == false) {
            $('#Spp_2_' + itemNumber).append(`<option value="${0}"> ${""} </option>`);
            $(trouserSppList).each(function (i, item) {
                if (item.SelectedSubProductPartID == TestTrouserSppId) {
                    $('#Spp_2_' + itemNumber).append(`<option value="${item.SelectedSubProductPartID}"> ${item.LocalizedName} </option>`);
                }
            });
        }

        if ((combinationsAllowedForTestGarment) && productPartID == jacketPpId && itemId != TestjacketSppId && ddEmpty == true) {

            $(trouserSppList).each(function (i, item) {
                if (item.SelectedSubProductPartID != TestTrouserSppId) {
                    $('#Spp_2_' + itemNumber).append(`<option value="${item.SelectedSubProductPartID}"> ${item.LocalizedName} </option>`);
                }
            });
        }
    }

    $("#frmPrimaryInfo").ajaxForm(options);
    $("#frmPrimaryInfo").submit();
}

function UpdateMakeAndMaterialAccordingToQuantity() {

    //alert("UpdateMakeAndMaterialAccordingToQuantity");
    var selectedQuantity = $("#ddQuantities").val();
    var currentItemCount = GetCurrentNumberOfItems();
    if (selectedQuantity > currentItemCount) {
        for (var i = currentItemCount + 1; i <= selectedQuantity; i++) {
            AddANewItem(i);
        }
    }
    else if (selectedQuantity < currentItemCount) {
        for (var j = currentItemCount; j > selectedQuantity; j--) {
            RemoveItem(j);
        }
    }
}


function AddANewItem(index) {

    AddItemHeaderColumn(index);

    var productPartRows = $("#" + MAKE_AND_MATERIAL_TABLE_ID).find("div[id^=" + PRODUCTPART_ROW_ID_PREFIX + "]");
    if (productPartRows != null && productPartRows.length > 0) {
        for (var i = 0; i < productPartRows.length; i++) {
            AddMakeColumnForProductPart(productPartRows[i], index);
        }
    }
    var fabricTextBoxID = AddFabricColumn(index);
    AddFabricExtraDaysColumn(index);
    AttachFabricAutosuggest(fabricTextBoxID, fabricAutosuggestURL);
    //RegisterSelect(fabricTextBoxID);

    if (HasLiningUsage()) {
        AddLiningColumn(index);
        AddLiningExtraDaysColumn(index);
    }
    
    if (HasWaistcoatLiningUsage()) {
        AddWaistcoatLiningColumn(index);
        AddWaistcoatLiningExtraDaysColumn(index);
    }

    AttachMakeDropdownHandler();
}

function RemoveItem(index) {

    var itemColumn = $("#" + ITEM_COLUMN_ID_PREFIX + index);
    if (itemColumn != null) { $(itemColumn).remove(); }

    var productPartRows = $("#" + MAKE_AND_MATERIAL_TABLE_ID).find("div[id^=" + PRODUCTPART_ROW_ID_PREFIX + "]");
    if (productPartRows != null && productPartRows.length > 0) {
        for (var i = 0; i < productPartRows.length; i++) {
            var makeColumn = $(productPartRows[i]).find("div[id=" + MAKE_COLUMN_ID_PREFIX + index + "]");
            if (makeColumn != null)
                $(makeColumn).remove();
        }
    }

    var fabricColumn = $("#" + FABRIC_COLUMN_ID_PREFIX + index);
    if (fabricColumn != null) { $(fabricColumn).remove(); }
    var fabricExtraDaysColumn = $("#" + FABRIC_EXTRADAYS_ROW_ID_PREFIX + index);
    if (fabricExtraDaysColumn != null) { $(fabricExtraDaysColumn).remove(); }

    var liningColumn = $("#" + LINING_COLUMN_ID_PREFIX + index);
    if (liningColumn != null) { $(liningColumn).remove(); }
    var liningExtraDaysColumn = $("#" + LINING_EXTRADAYS_ROW_ID_PREFIX + index);
    if (liningExtraDaysColumn != null) { $(liningExtraDaysColumn).remove(); }
  
    var hasExtraLining = $("#HDShowExtraProductLining").val();
    if (hasExtraLining.toLowerCase() == "true") {
        var waistcoatLiningColumn = $("#" + EXTRA_LINING_COLUMN_ID_PREFIX + index);
        if (waistcoatLiningColumn != null) { $(waistcoatLiningColumn).remove(); }
        var wliningExtraDaysColumn = $("#" + EXTRA_LINING_COLUMN_ID_PREFIX + index);
        if (wliningExtraDaysColumn != null) { $(wliningExtraDaysColumn).remove(); }
    }
}


function AddItemHeaderColumn(index) {
    var newItemHeaderColumn = "<td id='{0}{1}'>{2}&nbsp;{3}</td>";
    var temp = String.format(newItemHeaderColumn, ITEM_COLUMN_ID_PREFIX, index, "Item", index);
    $("#" + ITEM_ROW_ID_PREFIX).append(temp);
}

function AddMakeColumnForProductPart(productPartRow, index) {

    var makeDropDown = GetMakeDropDownForProductPart(productPartRow);
    if (makeDropDown != null) {
        var productPartID = GetProductPartIDFromMakeDropdownID(makeDropDown);
        var makeDrownToBeInserted = GetCopyOfCustomDropDown(makeDropDown, true, String.format("Make_{0}_{1}", productPartID, index));

        var newColumn = $(String.format("<td id='tdMake{0}'></td>", index));
        $(newColumn).append(makeDrownToBeInserted);

        $(productPartRow).append(newColumn);
        $(newColumn).addClass("tdMake");

        DisplayDropdownValueInTextbox(String.format("Make_{0}_{1}", productPartID, index));
    }
}


function AddFabricColumn(index) {
    var result = "";
    var fabricColumn = $("#trFabrics").find("div[id^=tdFabric]:first");
    if (fabricColumn != null) {
        var newFabricColumn = $(fabricColumn).clone(false);
        $(newFabricColumn).attr("id", "tdFabric" + index);
        $(newFabricColumn).attr("name", "tdFabric" + index);

        var newFabricTextbox = $(newFabricColumn).find("input[id^=Fabric_]:first");
        if (newFabricTextbox != null) {
            $(newFabricTextbox).attr("id", "Fabric_" + index);
            $(newFabricTextbox).attr("name", "Fabric_" + index);
            $(newFabricTextbox).val("");
            result = "Fabric_" + index;
        }

        var newFabricHD = $(newFabricColumn).find("input[id^=HDFabric_]:first");
        if (newFabricHD != null) {
            $(newFabricHD).attr("id", "HDFabric_" + index);
            $(newFabricHD).attr("name", "HDFabric_" + index);
            $(newFabricHD).val("");
        }

        var newFabricSP = $(newFabricColumn).find("span[id^=spFabric_]:first");
        if (newFabricSP != null) {
            $(newFabricSP).attr("id", "spFabric_" + index);
            $(newFabricSP).attr("name", "spFabric_" + index);
            $(newFabricSP).html("");
        }
        $("#trFabrics").append(newFabricColumn);
        AttachFabricAutosuggest("Fabric_" + index, fabricAutosuggestURL);
    }
    return result;
}

function GetItemNumberFromFabricLiningTextboxID(fabricLiningTextboxID) {
    var result = -1;

    if (fabricLiningTextboxID != null) {

        var arr = fabricLiningTextboxID.split("_");
        if (arr != null && arr.length > 1) {
            result = $.parseInt(arr[1]);
        }
    }

    return result;
}

function AddFabricExtraDaysColumn(index) {
    var result = "";
    var fabricColumn = $("#trFabricsExtraDays").find("div[id^=tdFabricExtraDays]:first");
    if (fabricColumn != null) {
        var newFabricColumn = $(fabricColumn).clone(false);
        $(newFabricColumn).attr("id", "tdFabricExtraDays" + index);
        $(newFabricColumn).attr("name", "tdFabricExtraDays" + index);


        var newFabricHD = $(newFabricColumn).find("input[id^=HDFabric_]:first");
        if (newFabricHD != null) {
            $(newFabricHD).attr("id", "HDFabric_" + index);
            $(newFabricHD).attr("name", "HDFabric_" + index);
            $(newFabricHD).val("");
        }

        var newFabricSP = $(newFabricColumn).find("span[id^=spFabric_]:first");
        if (newFabricSP != null) {
            $(newFabricSP).attr("id", "spFabric_" + index);
            $(newFabricSP).attr("name", "spFabric_" + index);
            $(newFabricSP).html("");
        }
        $("#trFabricsExtraDays").append(newFabricColumn);
        //AttachFabricAutosuggest("Fabric_" + index, fabricAutosuggestURL);
    }
    return result;
}

function AddLiningColumn(index) {

    var liningColumn = $("#trLinings").find("div[id^=tdLining]:first");
    if (liningColumn != null) {
        var newLiningColumn = $(liningColumn).clone(false);
        $(newLiningColumn).attr("id", "tdLining" + index);
        $(newLiningColumn).attr("name", "tdLining" + index);

        var newLiningTextbox = $(newLiningColumn).find("input[id^=Lining_]:first");
        if (newLiningTextbox != null) {
            $(newLiningTextbox).attr("id", "Lining_" + index);
            $(newLiningTextbox).attr("name", "Lining_" + index);
            $(newLiningTextbox).val("");
        }

        var newLiningHD = $(newLiningColumn).find("input[id^=HDLining_]:first");
        if (newLiningHD != null) {
            $(newLiningHD).attr("id", "HDLining_" + index);
            $(newLiningHD).attr("name", "HDLining_" + index);
            $(newLiningHD).val("");
        }

        var newLiningSP = $(newLiningColumn).find("span[id^=spLining_]:first");
        if (newLiningSP != null) {
            $(newLiningSP).attr("id", "spLining_" + index);
            $(newLiningSP).attr("name", "spLining_" + index);
            $(newLiningSP).html("");
        }


        $("#trLinings").append(newLiningColumn);
        AttachLiningAutosuggest("Lining_" + index, liningAutosuggestURL);
    }
}

function AddLiningExtraDaysColumn(index) {
    var liningColumn = $("#trLiningsExtraDays").find("div[id^=tdLiningExtraDays]:first");
    if (liningColumn != null) {
        var newLiningColumn = $(liningColumn).clone(false);
        $(newLiningColumn).attr("id", "tdLiningExtraDays" + index);
        $(newLiningColumn).attr("name", "tdLiningExtraDays" + index);


        var newLiningHD = $(newLiningColumn).find("input[id^=HDLining_]:first");
        if (newLiningHD != null) {
            $(newLiningHD).attr("id", "HDLining_" + index);
            $(newLiningHD).attr("name", "HDLining_" + index);
            $(newLiningHD).val("");
        }

        var newLiningSP = $(newLiningColumn).find("span[id^=spLining_]:first");
        if (newLiningSP != null) {
            $(newLiningSP).attr("id", "spLining_" + index);
            $(newLiningSP).attr("name", "spLining_" + index);
            $(newLiningSP).html("");
        }


        $("#trLiningsExtraDays").append(newLiningColumn);
        //AttachLiningAutosuggest("Lining_" + index, liningAutosuggestURL);
    }
}

function AddWaistcoatLiningColumn(index) {
   
    var liningColumn = $("#trWaistcoatLinings").find("div[id^=tdWaistcoatLining]:first");
    if (liningColumn != null) {
        var newLiningColumn = $(liningColumn).clone(false);
        $(newLiningColumn).attr("id", "tdWaistcoatLining" + index);
        $(newLiningColumn).attr("name", "tdWaistcoatLining" + index);

        var newLiningTextbox = $(newLiningColumn).find("input[id^=WaistcoatLining_]:first");
        if (newLiningTextbox != null) {
            $(newLiningTextbox).attr("id", "WaistcoatLining_" + index);
            $(newLiningTextbox).attr("name", "WaistcoatLining_" + index);
            $(newLiningTextbox).val("");
        }

        var newLiningHD = $(newLiningColumn).find("input[id^=HDWaistcoatLining_]:first");
        if (newLiningHD != null) {
            $(newLiningHD).attr("id", "HDWaistcoatLining_" + index);
            $(newLiningHD).attr("name", "HDWaistcoatLining_" + index);
            $(newLiningHD).val("");
        }

        var newLiningSP = $(newLiningColumn).find("span[id^=spWaistcoatLining_]:first");
        if (newLiningSP != null) {
            $(newLiningSP).attr("id", "spWaistcoatLining_" + index);
            $(newLiningSP).attr("name", "spWaistcoatLining_" + index);
            $(newLiningSP).html("");
        }


        $("#trWaistcoatLinings").append(newLiningColumn);
        AttachWaistcoatLiningAutosuggest("WaistcoatLining_" + index, liningAutosuggestURL);
    }
}

function AddWaistcoatLiningExtraDaysColumn(index) {
    
    var liningColumn = $("#trWaistcoatLiningsExtraDays").find("div[id^=tdWaistcoatLiningExtraDays]:first");
    if (liningColumn != null) {
        var newLiningColumn = $(liningColumn).clone(false);
        $(newLiningColumn).attr("id", "tdWaistcoatLiningExtraDays" + index);
        $(newLiningColumn).attr("name", "tdWaistcoatLiningExtraDays" + index);


        var newLiningHD = $(newLiningColumn).find("input[id^=HDWaistcoatLining_]:first");
        if (newLiningHD != null) {
            $(newLiningHD).attr("id", "HDWaistcoatLining_" + index);
            $(newLiningHD).attr("name", "HDWaistcoatLining_" + index);
            $(newLiningHD).val("");
        }

        var newLiningSP = $(newLiningColumn).find("span[id^=spWaistcoatLining_]:first");
        if (newLiningSP != null) {
            $(newLiningSP).attr("id", "spWaistcoatLining_" + index);
            $(newLiningSP).attr("name", "spWaistcoatLining_" + index);
            $(newLiningSP).html("");
        }


        $("#trWaistcoatLiningsExtraDays").append(newLiningColumn);
    }
}


function HasLiningUsage() {
    var result = false;

    var temp = $("#tblMakeAndMaterial").find("div[id=trLinings]");
    if (temp != null && temp.length > 0)
        result = true;

    return result;
}

function HasWaistcoatLiningUsage() {
    var result = false;
    
    var temp = $("#tblMakeAndMaterial").find("div[id=trWaistcoatLinings]");
    if (temp != null && temp.length > 0)
        result = true;

    return result;
}

function GetProductPartIDFromMakeDropdownID(makeDropDown) {
    var result = "";

    var id = $(makeDropDown).attr("id");
    var arr = id.split("_");
    if (arr != null && arr.length > 2) {
        result = arr[1];
    }

    return result;
}

function GetProductPartAndItemFromMakeDropdown(makeDropDown) {
    var result =
    {
        Item: 0,
        ProductPartID: -1
    };

    var id = $(makeDropDown).attr("id");
    var arr = id.split("_");

    if (arr != null && arr.length > 1) {
        result.ProductPartID = arr[1];
    }
    if (arr != null && arr.length > 2) {
        result.Item = arr[2];
    }

    return result;
}

function GetNextMakeDropdown(currentDropdown, item) {
    return $(currentDropdown).closest("div").closest("div").closest("div[id^=trProductPart_]").nextAll("div[id^=trProductPart_]:first").find("select[id^=Make_][id$=_" + item + "]");
}
function GetAllNextMakeDropdowns(currentDropdown, item) {

    return $(currentDropdown).closest("div").closest("div").closest("div[id^=trProductPart_]").nextAll("div[id^=trProductPart_]").find("select[id^=Make_][id$=_" + item + "]");
}
function GetPreviousMakeDropdown(currentDropdown, item) {
    return $(currentDropdown).closest("div").closest("div").closest("div[id^=trProductPart_]").prevAll("div[id^=trProductPart_]:first").find("select[id^=Make_][id$=_" + item + "]");
}


function GetCopyOfCustomDropDown(customDropDown, copyDataAndEvents, newID) {
    var result = $(customDropDown).clone(false);
    var oldID = $(customDropDown).attr("id").replace("_div", "");

    //Replace the old ids with new Ids
    $(result).attr("id", String.format("{0}_div", newID));


    var temp = $(result).find("select[id=" + oldID + "]");
    if (temp != null && temp.length > 0) {
        var selectElement = temp[0];
        $(selectElement).attr("id", newID);
        $(selectElement).attr("name", newID);
        $(selectElement).bind("onchange", "OnCustomDropdownSelectionChange(this,'" + newID + "',null);");
    }

    temp = $(result).find("input[id=" + oldID + "_tb]");
    if (temp != null && temp.length > 0) {
        var textboxElement = temp[0];
        $(textboxElement).attr("id", String.format("{0}_tb", newID));
        $(textboxElement).attr("name", String.format("{0}_tb", newID));
        DisplayDropdownValueInTextbox(newID);
    }

    return result;
}


function GetMakeDropDownForProductPart(productPartRow) {
    var index = 1;
    var makeColumn = $(productPartRow).find("div[id^=tdMake" + index + "]");
    var makeDropDown = null;
    if (makeColumn != null && makeColumn.length > 0) {
        makeDropDown = $(makeColumn[0]).find("div[id^=Make_]");
    }
    return makeDropDown;
}


function GetCurrentNumberOfItems() {
    var result = 1;

    var itemColumns = $("#trItemHeader").find("div[id^=" + ITEM_COLUMN_ID_PREFIX + "]");
    if (itemColumns != null && itemColumns.length > 0)
        result = itemColumns.length;

    return result;
}


/******************************************************************************************************
Function related to Fabric autosuggest
*******************************************************************************************************/

function MakeFabricTextboxAutocomplete(fabricAutocompleteUrl) {
    var fabricTextboxes = $("#tblMakeAndMaterial").find("input[id^=Fabric_]");
    for (var i = 0; i < fabricTextboxes.length; i++) {
        AttachFabricAutosuggest($(fabricTextboxes[i]).attr("id"), fabricAutocompleteUrl);
    }
}
function AttachOrderNumberPerProductPartAutosuggest(textboxID, orderNumberAutosuggestURL) {
    var splitId = textboxID.split("_");
    var ppId = splitId[1];
    var itemNumber = 1;
    var autoCompleteWidth = $("#" + textboxID).width() + 28;
    $("#" + textboxID).autocomplete(orderNumberAutosuggestURL,
        {
            extraParams: { itemNumber: itemNumber, productPartId: ppId },
            cacheLength: 0,
            delay: 500,
            minChars: 6,
            width: autoCompleteWidth,
            multiple: false,
            class: "test",
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
    $("#" + textboxID).result(function (event, data, formatted) {

        var orderID = -1;
        var controlID = $(this).attr("id");
        var orderNumber;
        $(this).removeAttr("search");
        if (data != undefined) {
            if (data.length > 0 && data[0] != undefined && !isNaN(data[0])) {
                orderID = data[0];
            }
            if (data.length > 1 && data[1] != undefined && !isNaN(data[1])) {
                orderNumber = data[1];
            }
        }
        if (orderID != $("#HD" + controlID).val()) {
            if (orderID > 0) {
                LoadFitProfileData(orderID, ppId, orderNumber);
            } else {
                if (orderID < 0) {
                    $("#" + controlID).val("");
                }
            }
        }
    });
}

function AttachOrderNumberAutosuggest(textboxID, orderNumberAutosuggestURL) {
    var splitId = textboxID.split("_");
    var ppId = splitId[1];
    var itemNumber = 1;
    var autoCompleteWidth = $("#" + textboxID).width() + 28;
    var atelierId = $("#HDSSOOrderAtelierId").val();
    var deterministicPPID = $("#HDDeterministicProductPartID").val();
    if (deterministicPPID == ppId || atelierId <= 0 || atelierId == undefined) {
        atelierId = null;
    }
    $("#" + textboxID).autocomplete(orderNumberAutosuggestURL,
        {
            extraParams: { itemNumber: itemNumber, productPartId: ppId, atelierId: atelierId },
            cacheLength: 0,
            delay: 500,
            minChars: 6,
            width: autoCompleteWidth,
            multiple: false,
            class: "test",
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
    $("#" + textboxID).result(function (event, data, formatted) {

        var orderID = -1;
        var controlID = $(this).attr("id");
        var atelierid = -1;
        var orderNumber = "";
        var ppIds = "";
        //$(this).removeAttr("search");
        if (data != undefined) {
            if (data.length > 0 && data[0] != undefined && !isNaN(data[0])) {
                orderID = data[0];
            }
            if (data.length > 0 && data[1] != undefined) {
                orderNumber = data[1];
            }
            if (data.length > 0 && data[2] != undefined && !isNaN(data[2])) {
                atelierid = data[2];
                $("#HDSSOOrderAtelierId").val(atelierid);
            }
            if (data.length > 0 && data[3] != undefined) {
                ppIds = data[3];
            }
        }
        if (orderID > 0) {
            $("#HDSSOIntermediateOrderId_" + ppId).val(orderID);
            $("#SSOIntermediateOrderNumber_" + ppId).val(orderNumber);
            if (deterministicPPID == ppId) {
                CopyPriamryProductPartOrderNumberToOther(orderNumber, orderID, deterministicPPID, ppIds);
            }
        }
        else {
            if (orderID < 0) {
                $("#HDSSOIntermediateOrderId_" + ppId).val(-1);
                $("#SSOIntermediateOrderNumber_" + ppId).val("");
                $("#HDIntermediateCanUseForFitTool_" + ppId).prop("checked", false);
            }
        }
        CheckPrimaryProductPartOrderNumberAvailable();
    });
}

function LoadOrderData(orderId) {
    var jSonData = new Array();
    var deterministicPPID = $("#HDDeterministicProductPartID").val();
    var productParts = $("[id^=HDPPId_]");
    for (var i = 0; i < productParts.length; i++) {
        var id = productParts[i].id.split("_");
        var productPartId = id[1];
        var isDeterMinisticPP = false;
        if (productPartId == deterministicPPID) {
            isDeterMinisticPP = true;
        }
        var orderId = $("#HDSSOOrderId_" + productPartId).val();
        if (orderId > 0) {
            jSonData.push({ ProductPartId: productPartId, OrderId: orderId, IsDeterministic: isDeterMinisticPP });
        }
    }
    ResetSSOOrderWaistcoatLiningData();
    var data = JSON.stringify({ list: jSonData });
    $.ajax(
        {
            type: "Post",
            url: "/CustomOrder/GetOrderData",
            data: data,
            contentType: 'application/json; charset=utf-8',
            success: function (data) {
                if (data.status == true) {
                    $("#HDSSOOrderPPs").val("");
                    $("#HDDataLoaded").val(false);
                    if (data.orderData != null) {
                        var ssoOrderPrimaryInfoData = data.orderData;
                        var itemNumber = 1;
                        var productPartIds = "";

                        var ppIds = $("[id^=HDPPId]");
                        for (var k = 0; k < ppIds.length; k++) {

                            var productPartId = parseInt(ppIds[k].id.replace("HDPPId_", ""));
                            EnableDisablePrimaryInfoControl(false, itemNumber, productPartId);
                        }
                        for (var k = 0; k < ssoOrderPrimaryInfoData.length; k++) {
                            var productPartId = ssoOrderPrimaryInfoData[k].ProductPartId;
                            if (productPartIds != "") {
                                productPartIds = productPartIds + "," + productPartId;
                            }
                            else {
                                productPartIds = productPartId;
                            }
                        }
                        $("#HDSSOOrderPPs").val(productPartIds);
                        for (var i = 0; i < ppIds.length; i++) {
                            var ppid = parseInt(ppIds[i].id.replace("HDPPId_", ""));
                            var ssoOrderPP = ssoOrderPrimaryInfoData.filter(x => x.ProductPartId == ppid).pop();
                            if (ssoOrderPP != null) {
                                $("#Spp_" + ppid + "_" + itemNumber).prop("disabled", true);
                                $("#OrderModel_" + ppid + "_" + itemNumber).prop("disabled", true);
                                $("#HDSSOOrderId").val(ssoOrderPP.OrderId);
                                if (ppid == deterministicPPID) {
                                    $("#HDSSOOrderFabricId").val(ssoOrderPP.FabricId);
                                    $("#HDSSOOrderLiningId").val(ssoOrderPP.LiningId);
                                    $("#HDSSOOrderFabricExtraDays").val(ssoOrderPP.FabricExtraDays);
                                    $("#HDSSOOrderLiningExtraDays").val(ssoOrderPP.LiningExtraDays);
                                    $("#HDSSOOrderQuiltedLiningId").val(ssoOrderPP.QuiltedLining);
                                    $("#HDSSOOrderFabricName").val(ssoOrderPP.FabricName);
                                    $("#HDSSOOrderLiningNotification").val(ssoOrderPP.IsNotificationLining);
                                    $("#HDSSOOrderFabricNotification").val(ssoOrderPP.IsNotificationFabric);
                                    $("#HDSSOOrderLiningName").val(ssoOrderPP.LiningName);
                                }
                                else if (ppid == 3) {
                                    $("#HDSSOOrderWaistcoatLiningId").val(ssoOrderPP.LiningId);
                                    $("#HDSSOOrderWaistcoatLiningName").val(ssoOrderPP.LiningName);
                                    $("#HDSSOOrderWaistcoatLiningExtraDays").val(ssoOrderPP.LiningExtraDays);
                                    $("#HDSSOOrderWaistcoatLiningNotification").val(ssoOrderPP.IsNotificationLining);
                                }
                                $("#HDSSOOrderAtelierId").val(ssoOrderPP.AtelierId);
                                $("#HDSSOOrderMake_" + ppid).val(ssoOrderPP.MakeId);
                                $("#HDSSOOrderSPP_" + ppid).val(ssoOrderPP.SubProductPartId);
                                $("#HDSSOOrderModel" + ppid).val(ssoOrderPP.OrderModelId);
                                $("#HDSSOOrderCanvas_" + ppid).val(ssoOrderPP.CanvasingId);
                                $("#HDSSOOrderLiningStyle_" + ppid).val(ssoOrderPP.LiningStyle);
                                $("#HDSSOOrderTrimId_" + ppid).val(ssoOrderPP.ButtonId);
                                $("#HDSSOOrderIsDeterministicPP_" + ppid).val(ssoOrderPP.IsDeterministicPP);
                                $("#Spp_" + ppid + "_" + itemNumber).val(ssoOrderPP.SubProductPartId);
                                if (ppid != 27 && ssoOrderPP.SubProductPartId > 0) {
                                    OnSppItemChange($("#Spp_" + ppid + "_" + itemNumber), itemNumber, ppid);
                                }
                                else {
                                    if (ppid == 27 && ssoOrderPP.QuiltedLining > 0) {
                                        $("#SelectedDetachableLiner_0__ID").val(ssoOrderPP.QuiltedLining);
                                        OnDetachableLinerSelectionChange($("#SelectedDetachableLiner_0__ID"), 1, "SelectedDetachableLiner_0__ID");
                                        LoadMunroDropDowns();
                                    }
                                    else if (ppid == 12) {
                                        if ($("#OrderModel_" + ppid + "_" + itemNumber)) {
                                            $("#OrderModel_" + ppid + "_" + itemNumber).val(ssoOrderPP.OrderModelId);
                                            OnModelItemChange($("#OrderModel_" + ppid + "_" + itemNumber), itemNumber, ppid);
                                        }
                                        else {
                                            $("#Make_" + ppid + "_" + itemNumber).val(ssoOrderPP.MakeId);
                                            OnMakeSelectionChange($("#Make_" + ppid + "_" + itemNumber));
                                        }
                                    }
                                }
                            }
                            else {
                                $("#Spp_" + ppid + "_" + itemNumber).prop("disabled", false);
                                $("#OrderModel_" + ppid + "_" + itemNumber).prop("disabled", false);
                            }
                        }
                        $("#HDDataLoaded").val(true);
                    }
                } else {
                }
            }
        });
}

function ResetSSOOrderWaistcoatLiningData() {
    $("#HDSSOOrderWaistcoatLiningExtraDays").val(0);
    $("#HDSSOOrderWaistcoatLiningId").val(-1);
    $("#HDSSOOrderWaistcoatLiningNotification").val(false);
    $("#HDSSOOrderWaistcoatLiningName").val('');
}
function LoadFitProfileData(orderId, ppid) {
    $.ajax(
        {
            type: "Post",
            url: "/CustomOrder/GetOrderDataFitAndTryOn",
            data: { orderId: orderId, productPartId: ppid },
            success: function (data) {
                if (data.status == true) {
                    if (data.orderData != null) {
                        var orderFitProfileData = data.orderData;
                        $("#HDFitProfileSSOOrderId_" + ppid).val(orderId);
                        $("#HDFitProfileSSOFitId_" + ppid).val(orderFitProfileData.ProductFitId);
                        $("#HDFitProfileSSOTryOnId_" + ppid).val(orderFitProfileData.TryOnSizeId);
                        $("#FitAndTrySection_" + ppid).show();
                        $(".createNewProfileNameSection_" + ppid).show();
                        $("#createNewProfileNameContainer_" + ppid).show();
                        var defaultFPName = $("#hdnFitProfileName_" + ppid).val().trim();
                        $("#fitProfileNameFromTryOn_" + ppid).val(defaultFPName);
                        $("#hdnNewFPNameEnteredByUser_" + ppid).val("");
                        $("#ddProductFits_" + ppid).val(orderFitProfileData.ProductFitId);
                        $("#ddTryOnSizes_" + ppid).val(orderFitProfileData.TryOnSizeId);
                        $("#ddProductFits_" + ppid).prop("disabled", true);
                        $("#ddTryOnSizes_" + ppid).prop("disabled", true);
                        ProductFitChange('ddProductFits_' + ppid, orderFitProfileData.TryOnSizeId);
                        if (ppid == 26) {
                            var productTryOnText = $("#ddTryOnSizes_" + ppid).find('option:selected').html();
                            var detechableLinerPresent = $("#tblFitAndTryOn").find(" div.fitAndTryOnSelection_27");
                            if (detechableLinerPresent.length > 0) {
                                if ($('select#ddTryOnSizes_27 option').length > 1) {
                                    $("#ddTryOnSizes_27 option").each(function () {
                                        if ($(this).text() == productTryOnText) {
                                            $('#ddTryOnSizes_27 option:selected').removeAttr('selected');
                                            $(this).attr('selected', 'selected');
                                        }
                                    });
                                } else {
                                    ProductFitChange('ddProductFits_27');
                                }
                            }
                        }
                    }
                } else {

                }
            }
        });
}

//old auto complete is replaced by new
function AttachFabricAutosuggest(textboxID, fabricAutosuggestURL) {

    $('#' + textboxID).typeahead('destroy');
    var combinationId = $("#ddCombinations").val();
    var itemNumber = textboxID.replace("Fabric_", "");
    var urlString = fabricAutosuggestURL + '?q=%QUERY&combinationID=' + combinationId + '&itemNumber=' + itemNumber;
    var fabricsList = new Bloodhound({
        datumTokenizer: function (datum) {
            return Bloodhound.tokenizers.whitespace(datum.value);
        },
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        remote: {
            wildcard: '%QUERY',
            url: urlString,
            rateLimitBy: "debounce",
            rateLimitWait: 1500,
            filter: function (data) {
                //$("#HDFabric").val("");
                //$("#EDFabric").val("");
                // Map the remote source JSON array to a JavaScript object array
                return data.FabricList;
            }
        },
        sufficient: 25
    });
    fabricsList.clearRemoteCache();
    $('#' + textboxID).typeahead({
        minLength: 2,
        highlight: true,
        hint: false
    },
        {
            display: 'FabricName',
            limit: 25,
            source: fabricsList,
            templates: {
                empty: [
                    '<div class="fabricNotFound" style="margin-left: 10px">',
                    GetResourceText("FABRIC_NOT_FOUND"),
                    '</div>'
                ].join('\n'),
                suggestion: function (data) {
                    var fabricNameSpn = '<span class="fabricName-ordercreation">' + data.FabricName + '</span>';
                    return '<div>' + fabricNameSpn + '</div>';
                }
            }
        });

    $('#' + textboxID).on('typeahead:selected',
        function (e, data) {
            var text = "";
            var fabricID = -1;
            var controlID = $(this).attr("id");
            var extraDays = 0;
            var notification = false;
            var atelierID = -1;

            if (data != undefined) {
                if (data.ID != undefined && data.ID > 0 && !isNaN(data.ID)) {
                    fabricID = data.ID;
                }
                if (data.ExtraDays != undefined && data.ExtraDays > 0 && !isNaN(data.ExtraDays)) {
                    extraDays = data.ExtraDays;
                }
                if (data.Notification != undefined) {
                    notification = data.Notification;
                }
                if (data.AtelierId != undefined && data.AtelierId > 0 && !isNaN(data.AtelierId)) {
                    atelierID = data.AtelierId;
                }

                if (extraDays != 0 && notification == true) {
                    text = String.format(GetResourceText("CLFABRIC_WITH_EXTRA_DAYS", "Please note this is a CL Fabric with temporarily delay of {0} days"), extraDays);
                }
                else if (notification == true && extraDays == 0) {
                    text = GetResourceText("CLFABRIC_WITH_NO_EXTRA_DAYS", "Please note this is a CL Fabric");
                }
                else if (notification == false && extraDays > 0) {
                    text = String.format(GetResourceText("EXTRADAYS", "{0} extra day(s)"), extraDays);
                }

                if (fabricID != $("#HD" + controlID).val()) {
                    //Set the current values
                    $("#sp" + controlID).html("<label class='extrainfo' style='padding-left:0px'>" +text+"</label>");
                    $("#HD" + controlID).val(fabricID);
                    $("#ED" + controlID).val(extraDays);
                    $("#CL" + controlID).val(notification);

                    //make request 
                    if (fabricID > 0) {
                        LoadMachingInfoData(fabricID, itemNumber, true, atelierID, true);
                    } else {
                        OnEmptyFabricLiningSelection(ELEMENT_TYPE_FABRIC, this);
                        OnFabricLiningSelection(ELEMENT_TYPE_FABRIC, this);
                        ResetMatchingInfo(itemNumber, true, true);

                        var hasExtraLining = $("#HDShowExtraProductLining").val();
                        if (hasExtraLining.toLowerCase() == "true") {
                            ResetWaistcoatLiningMatchingInfo(itemNumber, true);
                        }

                        if (fabricID < 0) {
                            $("#" + controlID).val("");
                            $("#sp" + controlID).html("");
                            $("#HD" + controlID).val("-1");
                            $("#ED" + controlID).val("0");
                            $("#CL" + controlID).val("");
                        }
                    }
                }
            }
        });
    $('#' + textboxID).on('typeahead:change',
        function (e, fabric) {
            if ($(this).val() == "") {
                var controlID = $(this).attr("id");
                var itemNumber = textboxID.replace("Fabric_", "");
               
                OnEmptyFabricLiningSelection(ELEMENT_TYPE_FABRIC, this);
                OnFabricLiningSelection(ELEMENT_TYPE_FABRIC, this);
                ResetMatchingInfo(itemNumber, true, true);
                AttachLiningAutosuggest("Lining_" + itemNumber, liningAutosuggestURL);
                var hasExtraLining = $("#HDShowExtraProductLining").val();
                if (hasExtraLining.toLowerCase() == "true") {
                    ResetWaistcoatLiningMatchingInfo(itemNumber, true);
                    AttachWaistcoatLiningAutosuggest("WaistcoatLining_" + itemNumber, liningAutosuggestURL);
                }
                //Set the current values
                $("#sp" + controlID).html('');
                $("#HD" + controlID).val("-1");
                $("#ED" + controlID).val("0");
                $("#CL" + controlID).val("");
            }
        });
    $('#' + textboxID).on('typeahead:rendered', function () {

        if (arguments.length == 2) {
           
            var currentId = '#' + textboxID;
            var parentDiv = $(currentId).siblings(".tt-menu-ordercreation");
            $("div.tt-suggestion.tt-selectable", parentDiv).addClass("hightlightSelectedSuggestion");
            $("div.tt-suggestion.tt-selectable .tt-highlight", parentDiv).addClass("textColorSuggestions");
            $("div.tt-suggestion.tt-selectable", parentDiv).addClass("tt-cursor");
        }
    });
    $("span.twitter-typeahead").addClass("col-xs-12 col-sm-12 col-md-12 col-lg-12 padding0 d-block");
    $("div.tt-menu").addClass("tt-menu-ordercreation tt-suggestion-ordercreation");
}


/******************************************************************************************************
Function related to Lining autosuggest
*******************************************************************************************************/

function ChangeLiningSelectionOptions(element) {
    var itemNumber = $(element).attr("id").replace("InsideLining_31_", "");
    var combinationID = $("#hdnProductCombinationID").val();
    
    if ($(element).val() > 0 && $("#HDFabric_" + itemNumber).val() > 0) {


        LoadMachingInfoData($("#HDFabric_" + itemNumber).val(), itemNumber, false, -1, false);
        if ($("#HDIsOrderCreationWithSSO").val() == "true") {
        }
        else {
            $("#Lining_" + itemNumber).val('');
        }
        AttachFabricAutosuggest("Fabric_" + itemNumber, fabricAutosuggestURL);
        AttachLiningAutosuggest("Lining_" + itemNumber, liningAutosuggestURL);

        var hasExtraLining = $("#HDShowExtraProductLining").val();
        if (hasExtraLining.toLowerCase() == "true") 
            AttachWaistcoatLiningAutosuggest("WaistcoatLining_" + itemNumber, liningAutosuggestURL);
    }
    else if (combinationID == 53 || combinationID == 55)
    {
        AttachLiningAutosuggest("Lining_" + itemNumber, liningAutosuggestURL);
    }
   
}


function LoadMachingInfoData(fabricId, itemNumber, resetRunningInfo, atelierId, isforFabricSelection) {
    var shouldResetLining = $("#drpbgroup_" + itemNumber).val() !== "1";
    var shouldResetFabric = false;
    if (atelierId == -1) {
        shouldResetFabric = true;
    }
    
    var selectedQuantity = $("#ddQuantities").val();
    var IsManualOptionHiddedn = false;
  
    ResetMatchingInfo(itemNumber, shouldResetLining, shouldResetFabric);
    var hasExtraLining = $("#HDShowExtraProductLining").val();
    if (hasExtraLining.toLowerCase() == "true") {
        var shouldResetWaistcoatLining = $("#drpWLbgroup_" + itemNumber).val() !== "1";
        ResetWaistcoatLiningMatchingInfo(itemNumber, shouldResetWaistcoatLining);
    }

    $.ajax(
        {
            type: "Post",
            url: "/CustomOrder/GetFabricMatchingInfo",
            data: { fabricId: fabricId, itemNumber: itemNumber, atelierId: atelierId },
            success: function (data) {
                var combinationID = $("#hdnProductCombinationID").val();
                var productPartId = -1;
                var productPartDiv = $("#tblMakeAndMaterial").find("div[id^=trProductPart_]").first();
                if (productPartDiv.length > 0) {
                    var productPartDivId = productPartDiv[0].id;
                    productPartId = productPartDivId.split('_')[1];
                }

                if (data != null && data.status && data.data != null) {
                  
                    LoadLiningMatchingInfoData(data, itemNumber);
                    var hasExtraLining = $("#HDShowExtraProductLining").val();
                    if (hasExtraLining.toLowerCase() == "true") 
                        LoadWaistcoatLiningMatchingInfoData(data, itemNumber);

                  
                    if ($("#HDIsOrderCreationWithSSO").val() == "true") { // replicate this for waistcoat lining also
                        var liningId = $("#HDSSOOrderLiningId").val();
                        var liningName = $("#HDSSOOrderLiningName").val();
                        $("#Lining_" + itemNumber).val(liningName);
                        $("#HDLining_" + itemNumber).val(liningId);
                        if (productPartId == 31) {
                            $("#drpbgroup_" + itemNumber).val(2);
                        }
                        var hasExtraLining = $("#HDShowExtraProductLining").val();
                        if (hasExtraLining.toLowerCase() == "true") {
                            var liningId = $("#HDSSOOrderWaistcoatLiningId").val();
                            var liningName = $("#HDSSOOrderWaistcoatLiningName").val();
                            $("#WaistcoatLining_" + itemNumber).val(liningName);
                            $("#HDWaistcoatLining_" + itemNumber).val(liningId);
                        }
                    }


                   
                        GetPrimaryTrims(itemNumber, productPartId, isforFabricSelection);
                        //GetPrimaryButtons(itemNumber, productPartId, isforFabricSelection);
                   
                    LoadMunroDropDowns();
                }
                else {
                    $("#drpbgroup_" + itemNumber).find("option[value='2']").remove();
                    $("#drpbgroup_" + itemNumber).find("option[value='3']").remove();
                    var hasExtraLining = $("#HDShowExtraProductLining").val();
                    if (hasExtraLining.toLowerCase() == "true") {
                        $("#drpWLbgroup_" + itemNumber).find("option[value='2']").remove();
                        $("#drpWLbgroup_" + itemNumber).find("option[value='3']").remove();
                    }

                    // below is added for customer own fabrics to get extra days of the selected atelier.
                    if (isforFabricSelection && data != null && data.FabricIsCustomerOwn) {
                        GetPrimaryTrims(itemNumber, productPartId, isforFabricSelection);
                        LoadMunroDropDowns();
                    }
                   
                }
                if (resetRunningInfo) {
                    OnFabricLiningSelection(ELEMENT_TYPE_FABRIC, $("#Fabric_" + itemNumber));

                    var productPartId = -1;
                    var productPartDiv = $("#tblMakeAndMaterial").find("div[id^=trProductPart_]").first();
                    if (productPartDiv.length > 0) {
                        var productPartDivId = productPartDiv[0].id;
                        productPartId = productPartDivId.split('_')[1];
                    }

                    if (selectedQuantity == 1 || selectedQuantity > 1 && selectedQuantity <= 5) {

                        if (data.IsTestGarmentSppUse) {
                            var hasExtraLining = $("#HDShowExtraProductLining").val();
                            if (hasExtraLining.toLowerCase() == "true") {
                                $('#drpWLbgroup_' + itemNumber + ' option').each(function () {
                                    if ($(this).val() == 2 || $(this).val() == 3) {
                                        $(this).remove();
                                    }
                                });
                            }

                            $('#drpbgroup_' + itemNumber + ' option').each(function () {
                                if ($(this).val() == 2 || $(this).val() == 3) {
                                    $(this).remove();
                                }
                            });
                        }
                    }
                }
                if ($("#HDIsOrderCreationWithSSO").val() == "true") {                    //handle SSO for waistcoat lining 
                    var liningId = $("#HDSSOOrderLiningId").val();
                    var liningName = $("#HDSSOOrderLiningName").val();
                    var extraDays = $("#HDSSOOrderLiningExtraDays").val();
                    if ($('#InsideLining_31_' + itemNumber).val() == 25929) {
                        $("#drpbgroup_" + itemNumber).find("option[value='3']").remove();
                        $("#drpbgroup_" + itemNumber).val(1);
                        //$("#drpbgroup_" + itemNumber).find("option[value='1']").remove();
                        
                        //InitializeDropDownWithoutSearchBoxByID('InsideLining_31_' + itemNumber);
                    }
                    else {
                        $("#drpbgroup_" + itemNumber).val(1);
                        var combinationID = $("#hdnProductCombinationID").val();
                        if (combinationID == 42 || combinationID == 34) {
                            FillLining($("#drpbgroup_" + itemNumber));
                        }

                    }
                    $("#Lining_" + itemNumber).val(liningName);
                    $("#HDLining_" + itemNumber).val(liningId);
                    $("#EDLining_" + itemNumber).val(extraDays);

                    if (liningId > 0) {
                        OnFabricLiningSelection(ELEMENT_TYPE_LINING, $("#Lining_" + itemNumber));
                        var isCLLining = $("#HDSSOOrderLiningNotification").val();
                        $("#CLLining_" + itemNumber).val(isCLLining);
                        var text = "";
                        if (extraDays != 0 && isCLLining.toLowerCase() == "true") {
                            text = String.format(GetResourceText("CLFABRIC_WITH_EXTRA_DAYS", "Please note this is a CL Fabric with temporarily delay of {0} days"), extraDays);
                        }
                        else if (isCLLining.toLowerCase() == "true" && extraDays == 0) {
                            text = GetResourceText("CLFABRIC_WITH_NO_EXTRA_DAYS", "Please note this is a CL Fabric");
                        }
                        else if (isCLLining.toLowerCase() == "false" && extraDays > 0) {
                            text = String.format(GetResourceText("EXTRADAYS", "{0} extra day(s)"), extraDays);
                        }
                        $("#spLining_" + itemNumber).html(text);
                    }
                    var hasExtraLining = $("#HDShowExtraProductLining").val();
                    if (hasExtraLining.toLowerCase() == "true") {
                        SetSSOOrderDataForWaistcoatLining(itemNumber);
                    }
                }
            }
        });
}

function SetSSOOrderDataForWaistcoatLining(itemNumber) {
    var liningId = $("#HDSSOOrderWaistcoatLiningId").val();
    var liningName = $("#HDSSOOrderWaistcoatLiningName").val();
    var extraDays = $("#HDSSOOrderWaistcoatLiningExtraDays").val();
   
    if (liningId <= 0 || liningId == undefined) {
       liningId = $("#HDSSOOrderLiningId").val();
       liningName = $("#HDSSOOrderLiningName").val();
       extraDays = $("#HDSSOOrderLiningExtraDays").val();
    }
    $("#drpWLbgroup_" + itemNumber).val(1);
    
    $("#WaistcoatLining_" + itemNumber).val(liningName);
    $("#HDWaistcoatLining_" + itemNumber).val(liningId);
    $("#EDWaistcoatLining_" + itemNumber).val(extraDays);

    if (liningId > 0) {
        OnFabricLiningSelection(ELEMENT_TYPE_EXTRA_LINING, $("#WaistcoatLining_" + itemNumber));
        var isCLLining = $("#HDSSOOrderWaistcoatLiningNotification").val();
        $("#CLWaistcoatLining_" + itemNumber).val(isCLLining);
        var text = "";
        if (extraDays != 0 && isCLLining.toLowerCase() == "true") {
            text = String.format(GetResourceText("CLFABRIC_WITH_EXTRA_DAYS", "Please note this is a CL Fabric with temporarily delay of {0} days"), extraDays);
        }
        else if (isCLLining.toLowerCase() == "true" && extraDays == 0) {
            text = GetResourceText("CLFABRIC_WITH_NO_EXTRA_DAYS", "Please note this is a CL Fabric");
        }
        else if (isCLLining.toLowerCase() == "false" && extraDays > 0) {
            text = String.format(GetResourceText("EXTRADAYS", "{0} extra day(s)"), extraDays);
        }
        $("#spWaistcoatLining_" + itemNumber).html(text);
    }
}
function LoadLiningMatchingInfoData(data, itemNumber) {
    $("#MatchingGroupId_" + itemNumber).val(data.data.GroupId);

    if ($("#drpbgroup_" + itemNumber).find("option[value='1']").length === 0) {
        var chooseLining = GetResourceText("CHOOSE_LINING", "");
        $("#drpbgroup_" + itemNumber).prepend("<option value='1'>" + chooseLining + "</option>");
    }

    if ($("#drpbgroup_" + itemNumber).find("option[value='2']").length === 0) {
        var uniText = GetResourceText("BEST_MATCH_UNI", "");
        $("#drpbgroup_" + itemNumber).append("<option value='2'>" + uniText + "</option>");
    }

    if ($("#drpbgroup_" + itemNumber).find("option[value='3']").length === 0) {
        var bembergText = GetResourceText("BEST_MATCH_BEMBERG", "");
        $("#drpbgroup_" + itemNumber).append("<option value='3'>" + bembergText + "</option>");
    }

    if (data.data.WithoutLiningOption) {

        if ($("#drpbgroup_" + itemNumber).find("option[value='5']").length === 0) {
            var withoutLiningText = GetResourceText("WITHOUT_LINING", "without lining");
            $("#drpbgroup_" + itemNumber)
                .append("<option value='5' selected='selected'>" + withoutLiningText + "</option>");

            FillLining($("#drpbgroup_" + itemNumber));
        }

    } else {
        $("#drpbgroup_" + itemNumber).find("option[value='5']").remove();
    }

    if (data.data.UniLiningId > 0) {
        $("#UniLiningId_" + itemNumber).val(data.data.UniLiningId);
        $("#UniLiningName_" + itemNumber).val(data.data.UniLiningName);
        $("#UniLiningExtraDays_" + itemNumber).val(data.data.ExtraDaysUni);
    } else {
        $("#drpbgroup_" + itemNumber).find("option[value='2']").remove();
    }

    if (data.data.BembergLiningId > 0) {
        $("#BembergLiningId_" + itemNumber).val(data.data.BembergLiningId);
        $("#BembergLiningName_" + itemNumber).val(data.data.BembergLiningName);
        $("#BembergLiningExtraDays_" + itemNumber).val(data.data.ExtraDaysBemberg);
    } else {
        $("#drpbgroup_" + itemNumber).find("option[value='3']").remove();
    }

    if ($('#InsideLining_31_' + itemNumber).val() == 25929) {
        //1: manually select
        //2: best match in solid
        //3 : best match in bemberg
        //$("#drpbgroup_" + itemNumber).find("option[value='1']").remove();
        $("#drpbgroup_" + itemNumber).find("option[value='3']").remove();
        //$("#drpbgroup_" + itemNumber).val(2);
        //FillLining($("#drpbgroup_" + itemNumber));
        //InitializeDropDownWithoutSearchBoxByID('InsideLining_31_' + itemNumber);
    }

    if ($("#drpbgroup_" + itemNumber).val() != "5") {

        $("#Lining_" + itemNumber).show();
    }

    $("#bgroup_" + itemNumber).show();
    $("#bgroup_" + itemNumber).css("visibility", "visible");
    $("#bgroup_" + itemNumber).parent().show();
    $("#drpTotTitle").show();
    $("#liningTitle").hide();
}

function LoadWaistcoatLiningMatchingInfoData(data, itemNumber) {

    $("#WLMatchingGroupId_" + itemNumber).val(data.data.GroupId);

    if ($("#drpWLbgroup_" + itemNumber).find("option[value='1']").length === 0) {
        var chooseLining = GetResourceText("CHOOSE_LINING", "");
        $("#drpWLbgroup_" + itemNumber).prepend("<option value='1'>" + chooseLining + "</option>");
    }

    if ($("#drpWLbgroup_" + itemNumber).find("option[value='2']").length === 0) {
        var uniText = GetResourceText("BEST_MATCH_UNI", "");
        $("#drpWLbgroup_" + itemNumber).append("<option value='2'>" + uniText + "</option>");
    }

    if ($("#drpWLbgroup_" + itemNumber).find("option[value='3']").length === 0) {
        var bembergText = GetResourceText("BEST_MATCH_BEMBERG", "");
        $("#drpWLbgroup_" + itemNumber).append("<option value='3'>" + bembergText + "</option>");
    }

    if (data.data.WithoutLiningOption) {

        if ($("#drpWLbgroup_" + itemNumber).find("option[value='5']").length === 0) {
            var withoutLiningText = GetResourceText("WITHOUT_LINING", "without lining");
            $("#drpWLbgroup_" + itemNumber)
                .append("<option value='5' selected='selected'>" + withoutLiningText + "</option>");

            FillWaistcoatLining($("#drpWLbgroup_" + itemNumber), false);
        }

    } else {
        $("#drpWLbgroup_" + itemNumber).find("option[value='5']").remove();
    }

    if (data.data.UniLiningId > 0) {
        $("#WLUniLiningId_" + itemNumber).val(data.data.UniLiningId);
        $("#WLUniLiningName_" + itemNumber).val(data.data.UniLiningName);
        $("#WLUniLiningExtraDays_" + itemNumber).val(data.data.ExtraDaysUni);
    } else {
        $("#drpWLbgroup_" + itemNumber).find("option[value='2']").remove();
    }

    if (data.data.BembergLiningId > 0) {
        $("#WLBembergLiningId_" + itemNumber).val(data.data.BembergLiningId);
        $("#WLBembergLiningName_" + itemNumber).val(data.data.BembergLiningName);
        $("#WLBembergLiningExtraDays_" + itemNumber).val(data.data.ExtraDaysBemberg);
    } else {
        $("#drpWLbgroup_" + itemNumber).find("option[value='3']").remove();
    }

    //if ($('#InsideLining_31_' + itemNumber).val() == 25929) {
    //    //1: manually select
    //    //2: best match in solid
    //    //3 : best match in bemberg
    //    //$("#drpbgroup_" + itemNumber).find("option[value='1']").remove();
    //    $("#drpWLbgroup_" + itemNumber).find("option[value='3']").remove();
    //    //$("#drpbgroup_" + itemNumber).val(2);
    //    //FillLining($("#drpbgroup_" + itemNumber));
    //    //InitializeDropDownWithoutSearchBoxByID('InsideLining_31_' + itemNumber);
    //}

    if ($("#drpWLbgroup_" + itemNumber).val() != "5") {

        $("#WaistcoatLining_" + itemNumber).show();
    }

    $("#bgroupWL_" + itemNumber).show();
    $("#bgroupWL_" + itemNumber).css("visibility", "visible");
    $("#bgroupWL_" + itemNumber).parent().show();
    $("#drpTotTitleWL").show();
    $("#waistcoatLiningTitle").hide();
}

function ResetMatchingInfo(itemNumber, resetLining, resetFabric) {

    $("#UniLiningId_" + itemNumber).val("");
    $("#BembergLiningId_" + itemNumber).val("");
    $("#UniLiningName_" + itemNumber).val("");
    $("#BembergLiningName_" + itemNumber).val("");
    $("#MatchingGroupId_" + itemNumber).val("");
    $("#UniLiningExtraDays_" + itemNumber).val("");
    $("#BembergLiningExtraDays_" + itemNumber).val("");
    $("#Lining_" + itemNumber).removeAttr("disabled");
    if (resetLining) {
        $("#Lining_" + itemNumber).show();
        $("#Lining_" + itemNumber).val("");
        $("#HDLining_" + itemNumber).val("");
        $("#spLining_" + itemNumber).val("");

        if ($("#drpbgroup_" + itemNumber).find("option[value='5']").length > 0) {
            $("#drpbgroup_" + itemNumber).find("option[value='5']").remove();
        }
    }
    if (resetFabric) {
        $("#Fabric_" + itemNumber).val("");
        $("#HDFabric_" + itemNumber).val("");
        $("#spFabric_" + itemNumber).val("");
    }
    $("#bgroup_" + itemNumber).show();
    $("#drpbgroup_" + itemNumber).val(1);
    LoadMunroDropDowns();
    //if ($("#trgroups").find("select:visible").length === 0)
    //    $("#bgroup_" + itemNumber).parent().hide();

    HideUniBemebegTrIfNoDropDown();
}

function ResetWaistcoatLiningMatchingInfo(itemNumber, resetLining) {

    $("#WLUniLiningId_" + itemNumber).val("");
    $("#WLBembergLiningId_" + itemNumber).val("");
    $("#WLUniLiningName_" + itemNumber).val("");
    $("#WLBembergLiningName_" + itemNumber).val("");
    $("#WLMatchingGroupId_" + itemNumber).val("");
    $("#WLUniLiningExtraDays_" + itemNumber).val("");
    $("#WLBembergLiningExtraDays_" + itemNumber).val("");
    $("#WaistcoatLining_" + itemNumber).removeAttr("disabled");
    if (resetLining) {
        $("#WaistcoatLining_" + itemNumber).show();
        $("#WaistcoatLining_" + itemNumber).val("");
        $("#HDWaistcoatLining_" + itemNumber).val("");
        $("#spWaistcoatLining_" + itemNumber).val("");

        if ($("#drpWLbgroup_" + itemNumber).find("option[value='5']").length > 0) {
            $("#drpWLbgroup_" + itemNumber).find("option[value='5']").remove();
        }
    }
    $("#drpWLbgroup_" + itemNumber).show();
    $("#drpWLbgroup_" + itemNumber).val(1);
    LoadMunroDropDowns();

    HideUniBemebegTrIfNoDropDownForWaistcoatLining();
}

function HideUniBemebegTrIfNoDropDown() {
    var isAnySelectVisible = false;
    $("#trgroups select").each(function () {
        if ($(this).css('visibility') == 'visible') {
            isAnySelectVisible = true;
            return;
        }
    });
    if (!isAnySelectVisible) {
        $("#trgroups").hide();
        $("#drpTotTitle").hide();
        $("#liningTitle").show();
    }
}

function HideUniBemebegTrIfNoDropDownForWaistcoatLining() {
    var isAnySelectVisible = false;
    $("#trWaistcoatLiningGroups select").each(function () {
        if ($(this).css('visibility') == 'visible') {
            isAnySelectVisible = true;
            return;
        }
    });
    if (!isAnySelectVisible) {
        $("#trWaistcoatLiningGroups").hide();
        $("#drpTotTitleWL").hide();
        $("#waistcoatLiningTitle").show();
    }
}

function MakeLiningTextboxAutocomplete(liningAutocompleteUrl) {
    var liningTextboxes = $("#tblMakeAndMaterial").find("input[id^=Lining_]");
    for (var i = 0; i < liningTextboxes.length; i++) {
        AttachLiningAutosuggest($(liningTextboxes[i]).attr("id"), liningAutocompleteUrl);
    }
}

function MakeWaistcoatLiningTextboxAutocomplete(liningAutocompleteUrl) {
    
    var liningTextboxes = $("#tblMakeAndMaterial").find("input[id^=WaistcoatLining_]");
    for (var i = 0; i < liningTextboxes.length; i++) {
        AttachWaistcoatLiningAutosuggest($(liningTextboxes[i]).attr("id"), liningAutocompleteUrl);
    }
}

//old auto complete is replaced by new
function AttachLiningAutosuggest(textboxID, liningAutosuggestURL) {
    
    var isLiningStyleNoLiningSelected = false;
    $('#' + textboxID).typeahead('destroy');
    var combinationId = $("#ddCombinations").val();

    var itemNumber = textboxID.replace("Lining_", "");
    if (combinationId == 53 || combinationId == 55)
    {
        var liningStyleDov = "#InsideLining_31_" + itemNumber;
        if ($(liningStyleDov).val() == 25929) 
        {
         
            isLiningStyleNoLiningSelected = true;
          
        }
    }
    var urlString = liningAutosuggestURL + '?q=%QUERY&combinationID=' + combinationId + '&itemNumber=' + itemNumber + '&isLiningStyleNoLiningSelected=' + isLiningStyleNoLiningSelected;
    var liningList = new Bloodhound({
        datumTokenizer: function (datum) {
            return Bloodhound.tokenizers.whitespace(datum.value);
        },
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        remote: {
            wildcard: '%QUERY',
            url: urlString,
            rateLimitBy: "debounce",
            rateLimitWait: 1500,
            filter: function (data) {
                // Map the remote source JSON array to a JavaScript object array
                return data.LiningList;
            }
        },
        sufficient: 25
    });
    liningList.clearRemoteCache();
    $('#' + textboxID).typeahead({
        minLength: 2,
        highlight: true,
        hint: false
    },
        {
            display: 'LiningName',
            limit: 25,
            source: liningList,
            templates: {
                empty: [
                    '<div class="fabricNotFound" style="margin-left: 10px">',
                    GetResourceText("LINING_NOT_FOUND"),
                    '</div>'
                ].join('\n'),
                suggestion: function (data) {
                    var liningNameSpn = '<span class="fabricName-ordercreation">' + data.LiningName + '</span>';
                    return '<div>' + liningNameSpn + '</div>';
                }
            }
        });

    $('#' + textboxID).on('typeahead:selected',
        function (e, data) {
            var text = "";
            var liningID = -1;
            var controlID = $(this).attr("id");
            var itemNumber = textboxID.replace("Lining_", "");
            var extraDays = 0;
            var notification = false;

            if (data != undefined) {
                if (data.ID != undefined && data.ID > 0 && !isNaN(data.ID)) {
                    liningID = data.ID;
                }
                if (data.ExtraDays != undefined && data.ExtraDays > 0 && !isNaN(data.ExtraDays)) {
                    extraDays = data.ExtraDays;
                }
                if (data.Notification != undefined) {
                    notification = data.Notification;
                }

                if (extraDays != 0 && notification == true) {
                    text = String.format(GetResourceText("CLLINING_WITH_EXTRA_DAYS", "Please note this is a CL Lining with temporarily delay of {0} days"), extraDays);
                }
                else if (notification == true && extraDays == 0) {
                    text = GetResourceText("CL_LINING_WITH_NO_EXTRA_DAYS", "Please note this is a CL Lining");
                }
                else if (notification == false && extraDays > 0) {
                    text = String.format(GetResourceText("EXTRADAYS", "{0} extra day(s)"), extraDays);
                }

                if (liningID != $("#HD" + controlID).val()) {
                    $("#sp" + controlID).html(text);
                    $("#ED" + controlID).val(extraDays);
                    $("#HD" + controlID).val(liningID);
                    $("#CL" + controlID).val(notification);
                    $("#bgroup_" + itemNumber).find("label").removeClass("active");
                    $("#bgroup_" + itemNumber).find("input").removeAttr("checked");
                    $("#bgroup_" + itemNumber).find("input:first").attr("checked", "checked");
                    $("#bgroup_" + itemNumber).find("label:first").addClass("active");

                    var hasExtraLining = $("#HDShowExtraProductLining").val();
                    if (liningID > 0) {
                        OnFabricLiningSelection(ELEMENT_TYPE_LINING, this);
                        if (hasExtraLining.toLowerCase() == "true")
                            SetWaistcoatLining(text, extraDays, liningID, notification, itemNumber, controlID, false, this);
                    }
                    else {
                        OnFabricLiningSelection(ELEMENT_TYPE_LINING, this);
                        OnEmptyFabricLiningSelection(ELEMENT_TYPE_LINING, this);
                        if (hasExtraLining.toLowerCase() == "true")
                            SetWaistcoatLining(text, extraDays, liningID, notification, itemNumber, controlID, true, this);
                    }
                }
            }
        });
    $('#' + textboxID).on('typeahead:change',
        function (e, fabric) {
            if ($(this).val() == "") {
                //Set the current values
                $("#sp" + controlID).html('');
                $("#ED" + controlID).val("0");
                $("#HD" + controlID).val("-1");
                $("#CL" + controlID).val("");
                $("#bgroup_" + itemNumber).find("label").AddClass("active");
                $("#bgroup_" + itemNumber).find("input").AddAttr("checked");
                $("#bgroup_" + itemNumber).find("input:first").attr("checked", false);
                $("#bgroup_" + itemNumber).find("label:first").removeClass("active");


                OnFabricLiningSelection(ELEMENT_TYPE_LINING, this);
                OnEmptyFabricLiningSelection(ELEMENT_TYPE_LINING, this);

                var hasExtraLining = $("#HDShowExtraProductLining").val();
                if (hasExtraLining.toLowerCase() == "true")
                    SetWaistcoatLining('', "0", "-1", "", itemNumber, controlID, true, this);
            }
        });
    $('#' + textboxID).on('typeahead:rendered', function () {

        if (arguments.length == 2) {

            var currentId = '#' + textboxID;
            var parentDiv = $(currentId).siblings(".tt-menu-ordercreation");
            $("div.tt-suggestion.tt-selectable", parentDiv).addClass("hightlightSelectedSuggestion");
            $("div.tt-suggestion.tt-selectable .tt-highlight", parentDiv).addClass("textColorSuggestions");
            $("div.tt-suggestion.tt-selectable", parentDiv).addClass("tt-cursor");
        }
    });
    $("span.twitter-typeahead").addClass("col-xs-12 col-sm-12 col-md-12 col-lg-12 padding0 d-block");
    $("div.tt-menu").addClass("tt-menu-ordercreation .tt-suggestion-ordercreation");
}

function SetWaistcoatLining(text, extraDays, liningID, notification, itemNumber, controlID, clearWaistcoatLining, element) {
    var waistcoatControlID = "Waistcoat" + controlID;
    var extraLining = "#drpWLbgroup_" + itemNumber;
    if (!$(extraLining).is(':disabled')) {
        var liningName = $("#" + controlID).val();
        var currentWaistcoatLiningValue = $('#' + waistcoatControlID).val();
        $('#' + waistcoatControlID).typeahead('val', liningName);
        $("#sp" + waistcoatControlID).html(text);
        $("#ED" + waistcoatControlID).val(extraDays);
        $("#HD" + waistcoatControlID).val(liningID);
        $("#CL" + waistcoatControlID).val(notification);
        $("#bgroupWL_" + itemNumber).find("label").removeClass("active");
        $("#bgroupWL_" + itemNumber).find("input").removeAttr("checked");
        $("#bgroupWL_" + itemNumber).find("input:first").attr("checked", "checked");
        $("#bgroupWL_" + itemNumber).find("label:first").addClass("active");
        $("#" + waistcoatControlID).removeAttr('disabled');


        var isForExtraLining = $("#HDShowExtraProductLining").val();
        if (isForExtraLining.toLowerCase() == "true") {

            var lining = '#drpbgroup_' + itemNumber;
            var jacketLiningType = $(lining).val();
            if (jacketLiningType != $(extraLining).val()) {
                $(extraLining).val(jacketLiningType);
                LoadMunroDropDowns();
            }
        }

        OnFabricLiningSelection(ELEMENT_TYPE_EXTRA_LINING, $("#" + waistcoatControlID));

        if (clearWaistcoatLining) {
            OnEmptyFabricLiningSelection(ELEMENT_TYPE_EXTRA_LINING, $("#" + waistcoatControlID));
        }

        if (currentWaistcoatLiningValue != "")
            ShowInformationDialogWithoutCancelButton(GetResourceText("PRIMARYINFO_WARNING", "Warning"),
            GetResourceText("PRIMARYINFO_WAISTCOAT_LINING_CHANGED", "Please note : Updating the jacket lining will simultaneously adjust the waistcoat lining to the selected choice."), null, null, null);
    }
}

function AttachWaistcoatLiningAutosuggest(textboxID, liningAutosuggestURL) {
    
    var isLiningStyleNoLiningSelected = false;
    $('#' + textboxID).typeahead('destroy');
    var combinationId = $("#ddCombinations").val();

    var itemNumber = textboxID.replace("WaistcoatLining_", "");

    var urlString = liningAutosuggestURL + '?q=%QUERY&combinationID=' + combinationId + '&itemNumber=' + itemNumber + '&isLiningStyleNoLiningSelected=' + isLiningStyleNoLiningSelected;
    var liningList = new Bloodhound({
        datumTokenizer: function (datum) {
            return Bloodhound.tokenizers.whitespace(datum.value);
        },
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        remote: {
            wildcard: '%QUERY',
            url: urlString,
            rateLimitBy: "debounce",
            rateLimitWait: 1500,
            filter: function (data) {
                // Map the remote source JSON array to a JavaScript object array
                return data.LiningList;
            }
        },
        sufficient: 25
    });
    liningList.clearRemoteCache();
    $('#' + textboxID).typeahead({
        minLength: 2,
        highlight: true,
        hint: false
    },
        {
            display: 'LiningName',
            limit: 25,
            source: liningList,
            templates: {
                empty: [
                    '<div class="fabricNotFound" style="margin-left: 10px">',
                    GetResourceText("LINING_NOT_FOUND"),
                    '</div>'
                ].join('\n'),
                suggestion: function (data) {
                    var liningNameSpn = '<span class="fabricName-ordercreation">' + data.LiningName + '</span>';
                    return '<div>' + liningNameSpn + '</div>';
                }
            }
        });

    $('#' + textboxID).on('typeahead:selected',
        function (e, data) {
            var text = "";
            var liningID = -1;
            var controlID = $(this).attr("id");
            var itemNumber = textboxID.replace("WaistcoatLining_", "");
            var extraDays = 0;
            var notification = false;
            
            if (data != undefined) {
                if (data.ID != undefined && data.ID > 0 && !isNaN(data.ID)) {
                    liningID = data.ID;
                }
                if (data.ExtraDays != undefined && data.ExtraDays > 0 && !isNaN(data.ExtraDays)) {
                    extraDays = data.ExtraDays;
                }
                if (data.Notification != undefined) {
                    notification = data.Notification;
                }

                if (extraDays != 0 && notification == true) {
                    text = String.format(GetResourceText("CLLINING_WITH_EXTRA_DAYS", "Please note this is a CL Lining with temporarily delay of {0} days"), extraDays);
                }
                else if (notification == true && extraDays == 0) {
                    text = GetResourceText("CL_LINING_WITH_NO_EXTRA_DAYS", "Please note this is a CL Lining");
                }
                else if (notification == false && extraDays > 0) {
                    text = String.format(GetResourceText("EXTRADAYS", "{0} extra day(s)"), extraDays);
                }

                if (liningID != $("#HD" + controlID).val()) {
                    $("#sp" + controlID).html(text);
                    $("#ED" + controlID).val(extraDays);
                    $("#HD" + controlID).val(liningID);
                    $("#CL" + controlID).val(notification);
                    $("#bgroupWL_" + itemNumber).find("label").removeClass("active");
                    $("#bgroupWL_" + itemNumber).find("input").removeAttr("checked");
                    $("#bgroupWL_" + itemNumber).find("input:first").attr("checked", "checked");
                    $("#bgroupWL_" + itemNumber).find("label:first").addClass("active");

                    if (liningID > 0) {
                        var primaryLiningID = $("#HDLining_" + itemNumber).val();
                        if (primaryLiningID != liningID) {
                            OnFabricLiningSelection(ELEMENT_TYPE_LINING, $("#" + "Lining_" + itemNumber), true);
                            OnFabricLiningSelection(ELEMENT_TYPE_EXTRA_LINING, this, true);
                        }
                        else {
                            OnFabricLiningSelection(ELEMENT_TYPE_LINING, $("#" + "Lining_" + itemNumber));
                            OnFabricLiningSelection(ELEMENT_TYPE_EXTRA_LINING, this);
                        }
                    }
                    else {
                        OnFabricLiningSelection(ELEMENT_TYPE_EXTRA_LINING, this);
                        OnEmptyFabricLiningSelection(ELEMENT_TYPE_EXTRA_LINING, this);
                    }
                }
            }
        });
    $('#' + textboxID).on('typeahead:change',
        function (e, fabric) {
            if ($(this).val() == "") {
                //Set the current values
                var controlID = $(this).attr("id");
                $("#sp" + controlID).html('');
                $("#ED" + controlID).val("0");
                $("#HD" + controlID).val("-1");
                $("#CL" + controlID).val("");
                $("#bgroupWL_" + itemNumber).find("label").AddClass("active");
                $("#bgroupWL_" + itemNumber).find("input").AddAttr("checked");
                $("#bgroupWL_" + itemNumber).find("input:first").attr("checked", false);
                $("#bgroupWL_" + itemNumber).find("label:first").removeClass("active");


                OnFabricLiningSelection(ELEMENT_TYPE_EXTRA_LINING, this);
                OnEmptyFabricLiningSelection(ELEMENT_TYPE_EXTRA_LINING, this);
            }
        });
    $('#' + textboxID).on('typeahead:rendered', function () {

        if (arguments.length == 2) {

            var currentId = '#' + textboxID;
            var parentDiv = $(currentId).siblings(".tt-menu-ordercreation");
            $("div.tt-suggestion.tt-selectable", parentDiv).addClass("hightlightSelectedSuggestion");
            $("div.tt-suggestion.tt-selectable .tt-highlight", parentDiv).addClass("textColorSuggestions");
            $("div.tt-suggestion.tt-selectable", parentDiv).addClass("tt-cursor");
        }
    });
    $("span.twitter-typeahead").addClass("col-xs-12 col-sm-12 col-md-12 col-lg-12 padding0 d-block");
    $("div.tt-menu").addClass("tt-menu-ordercreation .tt-suggestion-ordercreation");
}

function AttachInchAutosuggest(textboxID, inchAutosuggestURL) {

    var autocompleteWidth = $("#" + textboxID).width() + 28;

    $("#" + textboxID).autocomplete(inchAutosuggestURL,
        {
            extraParams: {},
            cacheLength: 0,
            minChars: 2,
            width: autocompleteWidth,
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

    $("#" + textboxID).result(function (event, data, formatted) {
        $("#HdAdvicedTryon").val(data[2]);
    });
    $("#" + textboxID).blur(function () {
        $("#" + textboxID).search();
    });
}

/******************************************************************************************************
Functions related to validations
*******************************************************************************************************/

function GetProductPartIdFromRow(productPartRow) {
    var result = "";

    var temp = $(productPartRow).attr("id");
    if (temp != null) {
        var arr = temp.split("_");
        if (arr != null && arr.length > 1)
            result = arr[1];
    }

    return result;
}

function GetProductPartNameFromRow(productPartRow) {
    var result = "";

    var temp = $(productPartRow).find("div:first").find("label:first");
    if (temp != null) {
        result = $(temp).html();
    }

    return result;
}


function GetProductPartRows() {
    var productPartRows = $("#" + MAKE_AND_MATERIAL_TABLE_ID).find("div[id^=" + PRODUCTPART_ROW_ID_PREFIX + "]");
    return productPartRows;
}


function ValidatePrimaryInfoScreen() {
    var hiddenShowSalesRep = $("#hiddenShowSalesRep").val();
    var showSalesPersonMandatory = $("#TailorMandatory").val();
    var result = true;

    var errorMessages = new Array();

    //validate region if applicable

    var hiddenShowRegion = $("#hiddenShowRegion").val();

    if (hiddenShowRegion.length > 0 && hiddenShowRegion.toLowerCase() == "true") {
        var regionItem = $("#SelectedRegionID");
        if (regionItem != undefined) {
            var value = $("#SelectedRegionID").val();
            if (value.length == 0)
                errorMessages.push(GetResourceText("REGION_NOT_SELECTED"));
        }

    }

    if (hiddenShowSalesRep.length > 0 && hiddenShowSalesRep.toLowerCase() == "true") {
        var showSalesPersonMandatoryFields = $("#frmPrimaryInfo").find("#SalesPersonID").val();
        if (showSalesPersonMandatory != undefined && showSalesPersonMandatory.toLowerCase() == "true") {

            if (showSalesPersonMandatoryFields.length == 0 || showSalesPersonMandatoryFields == -1) {
                errorMessages.push(GetResourceText("TAILOR_NOT_SELECTED", "Please select tailor"));
            }
        }
    }

    var hideFabric = $("#HideFabric").val();
    //Validate combination selection
    var selectedCombinationId = $("#ddCombinations").val();
    if (selectedCombinationId <= 0)
        errorMessages.push(GetResourceText("COMBINATION_NOT_SELECTED", "Please select a combination."));

    var ssoOrdernumber = $("#SSOOrderNumber").val();
    if ($("#HDIsOrderCreationWithSSO").val() == "true" && ssoOrdernumber == "" && ssoOrdernumber.length <= 0) {
        errorMessages.push("Please select copy from order number.");
    }

    //Validate quantity selection
    var selectedQuantity = $("#ddQuantities").val();
    if (selectedQuantity <= 0)
        errorMessages.push("Please select quantity greater than 0.");

    //Validate make selection
    var makeValidationMessages = ValidateMakeSelection(selectedQuantity);

    if (makeValidationMessages != null && makeValidationMessages.length > 0)
        errorMessages = $.merge(errorMessages, makeValidationMessages);

    var subProductPartValidation = ValidateSppSelection(selectedQuantity);
    if (subProductPartValidation != null && subProductPartValidation.length > 0)
        errorMessages = $.merge(errorMessages, subProductPartValidation);


    //Validate fabric selection
    if (hideFabric.toLowerCase() == "false") {
        var fabricValidationMessages = ValidateFabricSelection(selectedQuantity);
        if (fabricValidationMessages != null && fabricValidationMessages.length > 0)
            errorMessages = $.merge(errorMessages, fabricValidationMessages);
    }
    //Validate lining selection
    if (HasLiningUsage()) {

        var liningValidationMessages = ValidateLiningSelection(selectedQuantity);
        if (liningValidationMessages != null && liningValidationMessages.length > 0)
            errorMessages = $.merge(errorMessages, liningValidationMessages);

        var hasExtraLining = $("#HDShowExtraProductLining").val();
        if (hasExtraLining.toLowerCase() == "true") {
            var liningValidationMessages = ValidateExtraLiningSelection(selectedQuantity);
            if (liningValidationMessages != null && liningValidationMessages.length > 0)
                errorMessages = $.merge(errorMessages, liningValidationMessages);
        }
    }

    //Validate button selection
    var buttonValidationMessages = ValidateButtonSelection(selectedQuantity);
    if (buttonValidationMessages != null && buttonValidationMessages.length > 0)
        errorMessages = $.merge(errorMessages, buttonValidationMessages);

    //Validate trim selection
    var trimValidationMessages = ValidateTrimSelection(selectedQuantity);
    if (trimValidationMessages != null && trimValidationMessages.length > 0)
        errorMessages = $.merge(errorMessages, trimValidationMessages);

    var canvasValidationMessages = ValidateCanvasSelection(selectedQuantity);
    if (canvasValidationMessages != null && canvasValidationMessages.length > 0)
        errorMessages = $.merge(errorMessages, canvasValidationMessages);

    var insideLiningValidationMessages = ValidateInsideLiningSelection(selectedQuantity);
    if (insideLiningValidationMessages != null && insideLiningValidationMessages.length > 0)
        errorMessages = $.merge(errorMessages, insideLiningValidationMessages);

    // Validate Detachable Liner Option

    var detachableLinerValidationMessages = ValidateDetachableLinerSelection(selectedQuantity);
    if (detachableLinerValidationMessages != null && detachableLinerValidationMessages.length > 0)
        errorMessages = $.merge(errorMessages, detachableLinerValidationMessages);


    if (errorMessages.length > 0) {
        result = false;

        ShowErrorDialogForMessages(GetResourceText("PRIMARYINFO_MESSAGEHEADER", "Primary information"), errorMessages, null, null);
    }

    return result;
}


function ValidateMakeSelection(itemCount) {

    var errorMessages = new Array();

    var productPartRows = GetProductPartRows();
    for (var i = 0; i < itemCount; i++) {
        for (var j = 0; j < productPartRows.length; j++) {
            var productPartId = GetProductPartIdFromRow(productPartRows[j]);
            var value = $("#Make_" + productPartId + "_" + (i + 1)).val();

            if (value <= 0) {
                var productPartName = "'" + $.trim(GetProductPartNameFromRow(productPartRows[j])) + "'";
                errorMessages.push(String.format(GetResourceText("PRIMARYINFO_MAKEREQUIRED", "Please select make for {0} and item {1}"), productPartName, (i + 1)));
            }
        }
    }

    return errorMessages;
}




function ValidateSppSelection(itemCount) {

    var errorMessages = new Array();

    var productPartRows = GetProductPartRows();
    for (var i = 0; i < itemCount; i++) {
        for (var j = 0; j < productPartRows.length; j++) {
            var productPartId = GetProductPartIdFromRow(productPartRows[j]);
            var value = $("#Spp_" + productPartId + "_" + (i + 1)).val();

            if (value <= 0) {
                var productPartName = "'" + $.trim(GetProductPartNameFromRow(productPartRows[j])) + "'";
                errorMessages.push(String.format(GetResourceText("PRIMARYINFO_SPPREQUIRED", "Please select sub item for {0} and item {1}"), productPartName, (i + 1)));
            }
        }
    }

    return errorMessages;
}




function ValidateCanvasSelection(itemCount) {

    var errorMessages = new Array();
    var productPartRows = GetProductPartRows();
    for (var i = 0; i < itemCount; i++) {
        for (var j = 0; j < productPartRows.length; j++) {
            var productPartId = GetProductPartIdFromRow(productPartRows[j]);
            var value = $("#Canvas_" + productPartId + "_" + (i + 1)).val();
            if (value <= 0) {
                var productPartName = "'" + $.trim(GetProductPartNameFromRow(productPartRows[j])) + "'";
                errorMessages.push(String.format(GetResourceText("PRIMARYINFO_CANVASREQUIRED", "Please select canvas for {0} and item {1}"), productPartName, (i + 1)));
            }
        }
    }

    return errorMessages;
}


function ValidateInsideLiningSelection(itemCount) {

    var errorMessages = new Array();
    var productPartRows = GetProductPartRows();
    for (var i = 0; i < itemCount; i++) {
        for (var j = 0; j < productPartRows.length; j++) {
            var productPartId = GetProductPartIdFromRow(productPartRows[j]);
            var value = $("#InsideLining_" + productPartId + "_" + (i + 1)).val();
            if (value <= 0) {
                var productPartName = "'" + $.trim(GetProductPartNameFromRow(productPartRows[j])) + "'";
                errorMessages.push(String.format(GetResourceText("PRIMARYINFO_INSIDELININGREQUIRED", "Please select lining style for {0} and item {1}"), productPartName, (i + 1)));
            }
        }
    }

    return errorMessages;
}

function ValidateDetachableLinerSelection(itemCount) {

    var errorMessages = new Array();

    for (var i = 0; i < itemCount; i++) {


        var value = $("#SelectedDetachableLiner_" + i + "__ID").val();
        if (value <= 0) {
            //var productPartName = "'" + $.trim(GetProductPartNameFromRow(productPartRows[j])) + "'";
            errorMessages.push(String.format(GetResourceText("PRIMARYINFO_DETACHABLELINERREQUIRED", "Please select detachable liner for  {0}"), (i + 1)));
        }

    }

    return errorMessages;
}

function ValidateFabricSelection(itemCount) {
    var errorMessages = new Array();

    var duplicateOrder = $("#hiddenIsDuplicateOrder").val();
    if (duplicateOrder.length > 0 && duplicateOrder.toLowerCase() == "true") {
        itemCount = 1;
    }
    for (var i = 1; i <= itemCount; i++) {
        var fabricName = $("#Fabric_" + i).val();
        var fabricId = $("#HDFabric_" + i).val();
        if (fabricName == null || fabricName.length <= 0 || fabricId == "" || fabricId <=0 ) {
            errorMessages.push(String.format(GetResourceText("PRIMARYINFO_FABRICREQUIRED", "Please select fabric for item {0}"), i));
        }
    }

    return errorMessages;
}


function ValidateButtonSelection(itemCount) {
    var errorMessages = new Array();
    var duplicateOrder = $("#hiddenIsDuplicateOrder").val();
    if (duplicateOrder.length > 0 && duplicateOrder.toLowerCase() == "true") {
        itemCount = 1;
    }
    for (var i = 1; i <= itemCount; i++) {
        var value = $("#Button_" + i).val();

        if (value <= 0) {
            errorMessages.push(String.format(GetResourceText("PRIMARYINFO_BUTTONREQUIRED", "Please select button for item {0}"), i));
        }
    }

    return errorMessages;
}

function ValidateTrimSelection(itemCount) {
    var errorMessages = new Array();
    var duplicateOrder = $("#hiddenIsDuplicateOrder").val();
    if (duplicateOrder.length > 0 && duplicateOrder.toLowerCase() == "true") {
        itemCount = 1;
    }
    for (var i = 1; i <= itemCount; i++) {
        var value = $("#Trim_" + i).val();

        if (value <= 0) {
            errorMessages.push(String.format(GetResourceText("PRIMARYINFO_BUTTONREQUIRED", "Please select button for item {0}"), i));
        }
    }

    return errorMessages;
}

function ValidateLiningSelection(itemCount) {
    var errorMessages = new Array();

    var duplicateOrder = $("#hiddenIsDuplicateOrder").val();
    if (duplicateOrder.length > 0 && duplicateOrder.toLowerCase() == "true") {
        itemCount = 1;
    }
    for (var i = 1; i <= itemCount; i++) {


        var liningName = $("#Lining_" + i).val();
        // var label = $("#bgroup_" + i).find("label[class*=active]");
        var liningType = $("#drpbgroup_" + i).val();
        if (liningType != 5) {
            if (liningName == null || liningName.length <= 0) {
                //var value = 1;
                //if (label != undefined && label.length > 0) {
                //    var value = $(label).find("input").val()
                //}
                //if (value == 1 || value == undefined) {
                errorMessages.push(String.format(GetResourceText("PRIMARYINFO_LININGREQUIRED", "Please select lining for item {0}"), i));
                //}
            }
        }
    }

    return errorMessages;
}

function ValidateExtraLiningSelection(itemCount) {
    var errorMessages = new Array();

    var duplicateOrder = $("#hiddenIsDuplicateOrder").val();
    if (duplicateOrder.length > 0 && duplicateOrder.toLowerCase() == "true") {
        itemCount = 1;
    }
    for (var i = 1; i <= itemCount; i++) {
        var liningName = $("#WaistcoatLining_" + i).val();
        var liningType = $("#drpWLbgroup_" + i).val();
        if (liningType != 5) {
            if (liningName == null || liningName.length <= 0) {
                errorMessages.push(String.format(GetResourceText("PRIMARYINFO_EXTRA_LININGREQUIRED", "Please select waistcoat lining for item {0}"), i));

            }
        }
    }

    return errorMessages;
}



/******************************************************************************************************
Functions related Initialization of PrimaryInformation screen
*******************************************************************************************************/
function InitializePrimaryInfoScreen(hdnDuplicateOrderQuantity, isDuplicateOrder) {

    ClientAppObject.CustomOrderCurrentWizardStep = EnumCustomOrderWizardSteps.FINALIZE;



    if (isDuplicateOrder.toUpperCase() === "TRUE") {
        $("#ddQuantities").val(hdnDuplicateOrderQuantity);
    }

    $("#ddQuantities").change(function (e) {

        GetMakesAccordingToCombinationAndQuantity(onCombinationQuantityChangeURL, false);
    });
    RightPanelOpenClosed();
    //$('.panel').alternateScroll();
    //$('.leftsectionTabbedPanleContainer').alternateScroll();


    //  AdjustPIHeight();
}

var OnCombinationChange = function () {
    var showFreeFaceMaskPopup = false;
    var selectedCombinationId = $("#ddCombinations").val();

    if (selectedCombinationId === "8" && showFreeFaceMaskPopup) {
        $('#ddQuantities option[value="1"]').attr('selected', true);

        var IsExists = false;
        $('#ddCombinations option').each(function () {
            if (this.value == '46') {
                IsExists = true;
                return;
            }
        });
        if (IsExists)
            ChangeCombination();
        else {
            CombinationSelection()
        }
    } else {

        CombinationSelection()
    }

};

function CombinationSelection() {
    var combinationID = $("#hdnProductCombinationID").val();
    $("#ddQuantities").val(1);
    var quantity = ($("#ddQuantities option[value='1']").attr('selected', true)).val();
    if (quantity > 0 && combinationID != -1) {

        var itemConfirmationMessage = GetResourceText("PRIMARYINFO_COMBINATIONCHANGECONFIRMATION",
            "Changing the item will reset all the data selected till now.\n Do you still want to change the item?");
        var orderMode = $("#hiddenOrderMode").val();
        if (orderMode == "2") {
            itemConfirmationMessage = String.format(
                GetResourceText("PRIMARYINFO_COMBINATIONCHANGECONFIRMATION_COPY",
                    "Please be aware you are changing item, details from copied item {0} will be selected for new  order.If applicable"),
                $("#hiddenCopiedFromOrder").val());
        }

        ShowConfirmationDialog("",
            itemConfirmationMessage,
            function () {
                OnCombinationChangeConfimration();
            },
            OnCancelCombinationChange,
            OnCancelCombinationChange);
    } else {
        OnCombinationChangeConfimration();
    }
}


function OnCombinationChangeConfimration(isCallFromResetSSOOrderCopy) {
    $("#hdnProductCombinationID").val($("#ddCombinations").val());
    $("#HDSetPreQuantityValue").val("-1");
    //for mobile device, we do not show quantity, hence selecting quantity 1 by default
    if (isMobilePhoneDevice) {
        $("#ddQuantities").val("1");
        InitializeDropDownWithoutSearchBoxByID("ddQuantities");
    }
    else if ($("#ddQuantities").val() >= 1) {
        $("#ddQuantities").val("1");
        $("#ddQuantities").prop("disabled", false);
        InitializeDropDownWithoutSearchBoxByID("ddQuantities", '');
    }
    GetMakesAccordingToCombinationAndQuantity(onCombinationQuantityChangeURL, true, isCallFromResetSSOOrderCopy);


    if ($("#hdnProductCombinationID") != undefined && $("#hdnProductCombinationID").val() === "45" /*hide Measurements running info tab & change max quantity to 10 for facemask only*/) {
        $("#tabFinishedMeasurements").hide();
    } else {
        $("#tabFinishedMeasurements").show();
    }
    BindFitToolModalOpenFullView();
    return true;
}

function OnCancelCombinationChange() {
    $("#ddCombinations").val($("#hdnProductCombinationID").val());
    InitializeDropDownWithoutSearchBoxByID("ddCombinations");
    return false;
}

/******************************************************************************************************
Functions related Initialization of PrimaryInformationMake screen
*******************************************************************************************************/
function InitializePrimaryInfoMakeScreen() {
    MakeFabricTextboxAutocomplete(fabricAutosuggestURL);
    MakeLiningTextboxAutocomplete(liningAutosuggestURL);
    var hasExtraLining = $("#HDShowExtraProductLining").val();
    if (hasExtraLining.toLowerCase() == "true") 
        MakeWaistcoatLiningTextboxAutocomplete(liningAutosuggestURL);
    AttachMakeDropdownHandler();
    RefreshCurrentTabAndCautionMessages();

    //ApplyalternateScroll($("#divPrimaryProductDetails"));
    AttachOnFocusForFabricLiningTextbox();

    if ($("#ddCombinations").val() == 42) {
        var detachableMakeDrp = $("div[id ^= trProductPart_]").find("select[id ^= Make_27_]");


        jQuery.each(detachableMakeDrp,
            function (i, element) {
                var elementId = $(element).attr("id");
                $('select[id^= ' + elementId + '] option[value="11"]').attr("selected", "selected");
            });
    }

    RemoveTestGarmentFromTrouser();
}

function AttachMakeDropdownHandler() {
    $("#tblMakeAndMaterial").find("select[id^=Make_]").unbind("change");
    $("#tblMakeAndMaterial").find("select[id^=Make_]").change(null);
    $("#tblMakeAndMaterial").find("select[id^=Make_]").change(function (e) { OnMakeSelectionChange(this); });
}



function AttachOnFocusForFabricLiningTextbox() {

    $("#trFabrics").find("input[type=text]").keydown(function (e) {
        OnFabricTextboxFocus(this, e);
    });

    $("#trLinings").find("input[type=text]").keydown(function (e) {
        OnLiningTextboxFocus(this, e);
    });

    var hasExtraLining = $("#HDShowExtraProductLining").val();
    if (hasExtraLining.toLowerCase() == "true") {
        $("#trWaistcoatLinings").find("input[type=text]").keydown(function (e) {
            OnExtraLiningTextboxFocus(this, e);
        });
    }

}
function OnFabricTextboxFocus(fabricTextbox, e) {

    var length = $(fabricTextbox).val().length;

    if (length > 0 && length < 2) {
        var index = $(fabricTextbox).attr("id").replace("Fabric_", "");
        var makeDropDowns = $("#tblMakeAndMaterial select[id^=Make_][id$=" + index + "]");

        if (makeDropDowns != null && makeDropDowns.length > 0) {

            for (var i = 0; i < makeDropDowns.length; i++) {
                var val = $(makeDropDowns[i]).val();
                if (val <= 0) {
                    ShowInformationDialog(GetResourceText("PRIMARYINFO_MESSAGEHEADER", "Primary information"),
                        GetResourceText("PRIMARYINFO_SELECT_MAKE_FOR_ALL_PRODUCTPART", "Please select make for all product parts."), null, null, null);
                    $(fabricTextbox).val("");
                }
            }
        }
    }
     // select first elemnt of fabric list on enter
    if (e.keyCode == 13) {
        var parentDiv = $(fabricTextbox).siblings(".tt-menu");
        var childDiv = $("div.tt-dataset ", parentDiv);
      
        var numberOfDivs = $("div.tt-suggestion.tt-selectable", childDiv).length;
        if (numberOfDivs == 1) {
            $(".tt-suggestion:first-child", childDiv).trigger("click")
        }
    }      
}


function OnLiningTextboxFocus(liningTextbox, e) {

    var length = $(liningTextbox).val().length;
    if (length > 0 && length < 2) {
        var fabricTextboxID = $(liningTextbox).attr("id").replace("Lining_", "Fabric_");

        var fabricTextbox = $("#" + fabricTextboxID);
        var fabricName = $(fabricTextbox).val();
        var fabricID = $("#HD" + fabricTextboxID).val();

        if ($.trim(fabricName).length == 0 || fabricID <= 0) {
            ShowInformationDialog(GetResourceText("PRIMARYINFO_MESSAGEHEADER", "Primary information"),
                GetResourceText("PRIMARYINFO_SELECT_FABRIC", "Please select fabric first"), null, null, null);
            $(liningTextbox).val("");
        }
    }
     // select first elemnt of fabric list on enter
    if (e.keyCode == 13) {
        var parentDiv = $(liningTextbox).siblings(".tt-menu");
        var childDiv = $("div.tt-dataset ", parentDiv);
      
        var numberOfDivs = $("div.tt-suggestion.tt-selectable", childDiv).length;
        if (numberOfDivs == 1) {
            $(".tt-suggestion:first-child", childDiv).trigger("click")
        }
    }      
}

function OnExtraLiningTextboxFocus(liningTextbox, e) {

    var length = $(liningTextbox).val().length;
    if (length == 1) {
        var fabricTextboxID = $(liningTextbox).attr("id").replace("WaistcoatLining_", "Fabric_");

        var fabricTextbox = $("#" + fabricTextboxID);
        var fabricName = $(fabricTextbox).val();
        var fabricID = $("#HD" + fabricTextboxID).val();

        if ($.trim(fabricName).length == 0 || fabricID <= 0) {
            ShowInformationDialog(GetResourceText("PRIMARYINFO_MESSAGEHEADER", "Primary information"),
                GetResourceText("PRIMARYINFO_SELECT_FABRIC", "Please select fabric first"), null, null, null);
            $(liningTextbox).val("");
        }
    }
    // select first elemnt of fabric list on enter
    if (e.keyCode == 13) {
        var parentDiv = $(liningTextbox).siblings(".tt-menu");
        var childDiv = $("div.tt-dataset ", parentDiv);

        var numberOfDivs = $("div.tt-suggestion.tt-selectable", childDiv).length;
        if (numberOfDivs == 1) {
            $(".tt-suggestion:first-child", childDiv).trigger("click")
        }
    }
}

function SetFocusToFabric(fabricTextbox) {
    $(fabricTextbox).focus();
}


function ShowMultipleOrderSelectionDialog(combinationID, quantity, getPrimaryInfoMakeViewURL, combination, previousQuantity) {


    $("#multipleOrderSelectionDialog").dialog({
        top: 350,
        left: 778,
        width: 418,
        height: 70,
        resizable: false,
        title: GetResourceText("DO_YOU_WISH_TO_MAKE", "Do you wish to make ") + " " + quantity + " " + combination + " " + GetResourceText("EXACTLY_SAME", " exactly the same?"),
        modal: true,
        closeOnEscape: false,
        buttons: [
            {
                text: GetResourceText("YESS_ALL_SAME", "Yes, all the same"),
                click: function () {

                    $("#HDSetPreQuantityValue").val(quantity);
                    quantity = 1;
                    isDuplicateOrder = true;
                    SubmitPrimaryInfoForm(combinationID, quantity, getPrimaryInfoMakeViewURL, isDuplicateOrder);
                    $(this).dialog('close');
                }
            },
            {
                text: GetResourceText("NO_ALL_DIFFERENT", "No, all different"),
                click: function () {
                    $("#HDSetPreQuantityValue").val(quantity);
                    isDuplicateOrder = false;
                    SubmitPrimaryInfoForm(combinationID, quantity, getPrimaryInfoMakeViewURL, isDuplicateOrder);
                    $(this).dialog('close');
                }
            },
            {
                text: GetResourceText("CANCEL", "Cancel"),
                click: function () {

                    var qantity = $("#HDSetPreQuantityValue").val()
                    if (qantity) {
                        $("#ddQuantities").val(qantity);
                        if (qantity == 1) {
                            $("#SSOCopyOrderNumber").show();
                        }
                        InitializeDropDownWithoutSearchBoxByID("ddQuantities");
                    }

                    $(this).dialog('close');

                }
            }
        ]



    });

}

function SubmitPrimaryInfoForm(combinationID, quantity, getPrimaryInfoMakeViewURL, isDuplicateOrder) {

    var options = {
        data: { combinationID: combinationID, quantity: quantity, isDuplicateOrder: isDuplicateOrder, isCallFromResetSSOOrderCopy : false },
        url: getPrimaryInfoMakeViewURL,
        success: function (responseData) {
            if (responseData != null) {
                /// Validate and restrict Test garment spp with Multiple order quantity
                if (responseData.IsTestGarmentSppUse) {
                    ShowTestGarmentErrorBox(undefined, false);
                }
                else {
                    $("#divPrimaryProductDetails").html(responseData);
                }

            }



            if (combinationID && combinationID > 0 && (combinationID == 42 || combinationID == 34)) {

                var makeDrp = $("div[id ^= trProductPart_]").find("select[id ^= Make_]");

                var quantityWhereMakeSet = 2;
                var quantityWhereMakeSetArry = [];

                if (makeDrp) {
                    jQuery.each(makeDrp,
                        function (i, element) {
                            var value = $(element).val();
                            var id = $(element).attr('id');
                            var splitId = id.split('_');
                            if (value && value > 0) {

                            }
                            else {
                                quantityWhereMakeSetArry.push(splitId[2]);
                            }
                        });
                }
                quantityWhereMakeSet = Math.min.apply(Math, quantityWhereMakeSetArry);

                jQuery.each(makeDrp,
                    function (i, element) {
                        var id = $(element).attr('id');
                        var splitId = id.split('_');

                        if (splitId[2] && splitId[2] > 0 && quantityWhereMakeSet <= splitId[2])
                            OnMakeSelectionChange(element);
                    });


            }

        }
    }; $("#frmPrimaryInfo").ajaxForm(options);
    $("#frmPrimaryInfo").submit();

}


function FillLining(element) {

    var elementId = $(element).attr("id");
    var data = elementId.split("_");
    var liningId = "Lining_" + data[1];
    var liningHdId = "HDLining_" + data[1];
    var liningEdId = "EDLining_" + data[1];
    var messageId = "spLining_" + data[1];

    var lining = "";
    var liningName = "";
    var liningExtraDays = 0;

    var value = $(element).val();
    if (value != 1) {
        if (value == 2) {
            lining = $("#UniLiningId_" + data[1]).val();
            liningName = $("#UniLiningName_" + data[1]).val();
            liningExtraDays = $("#UniLiningExtraDays_" + data[1]).val();

        }

        if (value == 3) {
            lining = $("#BembergLiningId_" + data[1]).val();
            liningName = $("#BembergLiningName_" + data[1]).val();
            liningExtraDays = $("#BembergLiningExtraDays_" + data[1]).val();
        }
    }

    if (value == 2 || value == 3) {
        $("#" + liningId).val(liningName);
        $("#" + liningHdId).val(lining);

        $("#" + liningEdId).val(liningExtraDays);
        $("#" + messageId).html('<label  class="extrainfo" >' + String.format(GetResourceText("EXTRADAYS", "{0} extra day(s)"), liningExtraDays) + '</label><br/>');
        if (liningExtraDays > 0) {
            $("#" + messageId).show();
        } else {
            $("#" + messageId).html("");
        }
        $("#" + liningId).attr("disabled", "disabled");
        $("#CL" + liningId).val(false);
        OnFabricLiningSelection(ELEMENT_TYPE_LINING, $("#" + liningId));
    } else {
        $("#" + liningId).val("");
        $("#" + liningHdId).val("");
        $("#" + liningEdId).val(0);
        $("#" + messageId).html("");
        $("#" + liningId).removeAttr("disabled");
        OnEmptyFabricLiningSelection(ELEMENT_TYPE_LINING, $("#" + liningId));
        AttachLiningAutosuggest(liningId, liningAutosuggestURL);
    }

    if (value == 5) {

        $("#" + liningId).hide();
        $("#" + messageId).html("");
        $("#" + liningHdId).val(-1);
        $("#" + liningEdId).val("");
        OnEmptyFabricLiningSelection(ELEMENT_TYPE_LINING, $("#" + liningId));
        OnFabricLiningSelection(ELEMENT_TYPE_LINING, $("#" + liningId));
    } else {
        $("#" + liningId).show();
    }    
    
    var hasExtraLining = $("#HDShowExtraProductLining").val();
    if (hasExtraLining.toLowerCase() == "true") {
        var extraLining = "#drpWLbgroup_" + data[1];
        if (!$(extraLining).is(':disabled')) {
            var extraLining = "#drpWLbgroup_" + data[1];
            $(extraLining).val(value);
            LoadMunroDropDowns();
            FillWaistcoatLining($(extraLining), true);
        }
    }
}

function FillWaistcoatLining(element, isCallFromLiningChange) {

    var elementId = $(element).attr("id");
    var data = elementId.split("_");
    var liningId = "WaistcoatLining_" + data[1];
    var liningHdId = "HDWaistcoatLining_" + data[1];
    var liningEdId = "EDWaistcoatLining_" + data[1];
    var messageId = "spWaistcoatLining_" + data[1];

    var lining = "";
    var liningName = "";
    var liningExtraDays = 0;

    var currentWaistcoatLiningValue = $('#' + liningId).val();
    var value = $(element).val();
    if (value != 1) {
        if (value == 2) {
            lining = $("#WLUniLiningId_" + data[1]).val();
            liningName = $("#WLUniLiningName_" + data[1]).val();
            liningExtraDays = $("#WLUniLiningExtraDays_" + data[1]).val();

        }

        if (value == 3) {
            lining = $("#WLBembergLiningId_" + data[1]).val();
            liningName = $("#WLBembergLiningName_" + data[1]).val();
            liningExtraDays = $("#WLBembergLiningExtraDays_" + data[1]).val();
        }
    }

    if (value == 2 || value == 3) {
        $("#" + liningId).val(liningName);
        $("#" + liningHdId).val(lining);

        $("#" + liningEdId).val(liningExtraDays);
        $("#" + messageId).html('<label  class="extrainfo">' + String.format(GetResourceText("EXTRADAYS", "{0} extra day(s)"), liningExtraDays) + '</label><br/>');
        if (liningExtraDays > 0) {
            $("#" + messageId).show();
        } else {
            $("#" + messageId).html("");
        }
        $("#" + liningId).attr("disabled", "disabled");
        $("#CL" + liningId).val(false);

        var primaryLiningID = $("#HDLining_" + data[1]).val();
        var secondaryLiningID = $("#HDWaistcoatLining_" + data[1]).val();

        if (primaryLiningID != secondaryLiningID) {
            OnFabricLiningSelection(ELEMENT_TYPE_LINING, $("#" + "Lining_" + data[1]), true);
            OnFabricLiningSelection(ELEMENT_TYPE_EXTRA_LINING, $("#" + liningId), true);
        }
        else {
            OnFabricLiningSelection(ELEMENT_TYPE_LINING, $("#" + "Lining_" + data[1]));
            OnFabricLiningSelection(ELEMENT_TYPE_EXTRA_LINING, $("#" + liningId));
        }
    } else {
        $("#" + liningId).val("");
        $("#" + liningHdId).val("");
        $("#" + liningEdId).val(0);
        $("#" + messageId).html("");
        $("#" + liningId).removeAttr("disabled");
        OnEmptyFabricLiningSelection(ELEMENT_TYPE_EXTRA_LINING, $("#" + liningId));
        AttachWaistcoatLiningAutosuggest(liningId, liningAutosuggestURL);
    }

    if (value == 5) {

        $("#" + liningId).hide();
        $("#" + messageId).html("");
        $("#" + liningHdId).val(-1);
        $("#" + liningEdId).val("");
        OnEmptyFabricLiningSelection(ELEMENT_TYPE_EXTRA_LINING, $("#" + liningId));
        OnFabricLiningSelection(ELEMENT_TYPE_EXTRA_LINING, $("#" + liningId));
    } else {
        $("#" + liningId).show();
    }

    if (isCallFromLiningChange && currentWaistcoatLiningValue != "")
        ShowInformationDialogWithoutCancelButton(GetResourceText("PRIMARYINFO_WARNING", "Warning"),
            GetResourceText("PRIMARYINFO_WAISTCOAT_LINING_CHANGED", "Please note : Updating the jacket lining will simultaneously adjust the waistcoat lining to the selected choice."), null, null, null);
}


function OnButtonSelectionChange(itemNumber) {

    var selectedButtonId = $("#Button_" + itemNumber).val();
    var extraDays = $("#Button_" + itemNumber).find("Option[value=" + selectedButtonId + "]").attr("data-extraDays");
    if (extraDays > 0) {
        var text = String.format(GetResourceText("EXTRADAYS", "{0} extra day(s)"), extraDays);
        $("#spButton_" + itemNumber).html(text);

    } else {
        $("#spButton_" + itemNumber).html("");
    }

    var partbuttonDovs = $("input[id^='PartButtonDoId_" + itemNumber + "'");
    jQuery.each(partbuttonDovs, function (i, element) {
        var inputId = $(element).attr("id");
        var splittedIds = inputId.split("_");
        if (splittedIds.length > 3) {
            var doID = splittedIds[3];
            var partID = splittedIds[2];
            if (doID > 0 && partID > 0) {
                RefreshRunningInformation(REQUEST_TYPE_ELEMENT,
                    TAB_RPRICE,
                    ELEMENT_TYPE_BUTTON,
                    doID,
                    itemNumber,
                    partID,
                    selectedButtonId,
                    CUSTOM_ORDER);
            }
        }
    });

    $("#ButtonCopyToAll_" + itemNumber).val(true);
    var value = $("#ButtonChanged_" + itemNumber).val();
    if (value != undefined && value.length > 0) {
        if (value.toLowerCase() == "true") {
            ShowConfirmationDialog("",
                GetResourceText("ORDER_BUTTON_MESSAGE",
                    "Are you sure you want keep same button for all parts?"),
                function () {
                    $("#ButtonCopyToAll_" + itemNumber).val(true);
                },
                function () {
                    $("#ButtonCopyToAll_" + itemNumber).val(false);
                },
                null);
        }

    }
}

function OnTrimSelectionChange(itemNumber) {

    var selectedTrimId = $("#Trim_" + itemNumber).val();
    var extraDays = $("#Trim_" + itemNumber).find("Option[value=" + selectedTrimId + "]").attr("data-extraDays");
    if (extraDays > 0) {
        var text = String.format(GetResourceText("EXTRADAYS", "{0} extra day(s)"), extraDays);
        $("#spTrim_" + itemNumber).html(text);

    } else {
        $("#spTrim_" + itemNumber).html("");
    }

    var partTrimDovs = $("input[id^='PartTrimDoId_" + itemNumber + "'");
    jQuery.each(partTrimDovs, function (i, element) {
        var inputId = $(element).attr("id");
        var splittedIds = inputId.split("_");
        if (splittedIds.length > 3) {
            var doID = splittedIds[3];
            var partID = splittedIds[2];
            if (doID > 0 && partID > 0) {
                RefreshRunningInformation(REQUEST_TYPE_ELEMENT,
                    TAB_RPRICE,
                    ELEMENT_TYPE_TRIM,
                    doID,
                    itemNumber,
                    partID,
                    selectedTrimId,
                    CUSTOM_ORDER);
            }
        }
    });

    $("#TrimCopyToAll_" + itemNumber).val(true);
    var value = $("#TrimChanged_" + itemNumber).val();
    if (value != undefined && value.length > 0) {
        if (value.toLowerCase() == "true") {
            ShowConfirmationDialog("",
                GetResourceText("ORDER_BUTTON_MESSAGE",
                    "Are you sure you want keep same button for all parts?"),
                function () {
                    $("#TrimCopyToAll_" + itemNumber).val(true);
                },
                function () {
                    $("#TrimCopyToAll_" + itemNumber).val(false);
                },
                null);
        }

    }
}

var OnDetachableLinerSelectionChange = function (element, itemNumber, dropDown) {

    var extraDays = $("#" + dropDown).find(":selected").data('extradays');

    if (extraDays) {
        $("#EDDetachableLining_" + (itemNumber - 1)).val(extraDays);

        var text = String.format(GetResourceText("EXTRADAYS", "{0} extra day(s)"), extraDays);
        $("#spDetachable_" + (itemNumber - 1)).html(text);

    } else {
        $("#EDDetachableLining_" + (itemNumber - 1)).val(0);
        $("#spDetachable_" + (itemNumber - 1)).html('');
    }


    var liningID = $(element).val();

    $("#HDDetachableLining_" + itemNumber).val(liningID);
    RefreshRunningInformation(REQUEST_TYPE_ELEMENT, TAB_PPRICE, ELEMENT_TYPE_DETACHABLELINER, liningID, itemNumber, -1, "0", CUSTOM_ORDER);
};


function AppendQuantityOptions(quantity) {

    var quantityDropDown = $("#ddQuantities");

    if (typeof (quantity) == "string")
        quantity = parseInt(quantity);

    quantityDropDown.empty();

    for (var i = 1; i <= quantity; i++) {

        if (i === 1) {
            quantityDropDown.append("<option selected=\"selected\" value=" + i + ">" + i + "</option>");
        } else {
            quantityDropDown.append("<option value=" + i + ">" + i + "</option>");
        }
    }
}


function ChangeCombination() {
    var freeFacemaskMessage = GetResourceText("FREE_FACEMASK_MESSAGE", "Get a free face mask with any full-price shirt order");
    $("#ddCombinations").val("46");
    ShowConfirmationDialogWithCustomizeText("",
        freeFacemaskMessage,
        function () { OnCombinationChangeConfimration(); },
        function () {
            ContinueCombinationChangeWithShirt();
        },
        null, GetResourceText("CONTINUE", "Continue"), GetResourceText("NO", "No"));
    BindLazyLoadForInfoImages();
}

function ContinueCombinationChangeWithShirt() {
    $("#ddCombinations").val("8");
    $("#hdnProductCombinationID").val("8");
    OnCombinationChangeConfimration();
}

function GetDialogForCreateOrderFromPreviousOrder(isEditOrderNumber) {
    var dailog = $('<div id="createOrderFromPreviousModal">');
    var table  = $('<table id="table" width="100%">');
    var deterministicPPID = $("#HDDeterministicProductPartID").val();
    var useInFitToolTitle = GetResourceText("USE_IN_FIT_PROFILE", "Use in Fit profile");
    var productParts = $("[id^=HDPPId_]");
    for (var i = 0; i < productParts.length; i++) {
        var id = productParts[i].id.split("_");
        var productPartId = id[1];
        var productPartName = $("#HDPPName_" + productPartId).val();
        var orderNumber = $("#SSOOrderNumber_" + productPartId).val();
        var orderid = $("#HDSSOOrderId_" + productPartId).val();
        var isChecked = parseBool($("#HDCanUseForFitTool_" + productPartId).val());
        if (isChecked && orderNumber.length <= 0) {
            isChecked = false;
        }
        if (isEditOrderNumber) {
            $("#HDOldSSOOrderId_" + productPartId).val(orderid);
            $("#OldSSOOrderNumber_" + productPartId).val(orderNumber);
            $("#HDOldCanUseForFitTool_" + productPartId).val(isChecked);
        }
        if (deterministicPPID == productPartId) {
            table.append('<tr class="divProductPartNameCont"><td clospan="2">' + productPartName + '</td><td>' + useInFitToolTitle +'</td> </tr>');
            table.append('<tr><td><input class="form-control ac_input" id="previousOrderNumber_' + productPartId + '" name="" type="text" value="' + orderNumber + '" onchange="CheckPrimaryProductPartOrderNumberAvailable(this)" autocomplete="off"></td>' +
                '<td><input class="marginRight10" id="canUseForFitProfile_' + productPartId + '" type="checkbox" value="true" onchange="UpdateValueInHidden(this,' + productPartId + ')" ></td></tr>');
        }
        else {
            table.append('<tr class="divProductPartNameCont"><td clospan="2">' + productPartName + '</td><td></td> </tr>');
            table.append('<tr><td><input class="form-control ac_input" id="previousOrderNumber_' + productPartId + '" name="" type="text" value="' + orderNumber + '" onchange="CheckPrimaryProductPartOrderNumberAvailable(this)" autocomplete="off" disabled></td>' +
                '<td><input class="marginRight10" id="canUseForFitProfile_' + productPartId + '" type="checkbox" value="'+isChecked+'" onchange="UpdateValueInHidden(this,' + productPartId + ')"></td></tr > ');
        }
        table.append('<tr class="col-lg-6 paddingLeft20"></tr>');
    }
    dailog.append(table);
    var title = GetResourceText("ENTER_PREVIOUS_ORDER_NUMBER", "Enter previous order number");
    var msgBoxData = {
        modal: true,
        title: title,
        width: 500,
        resizable: false,
        closeOnEscape: false,
        buttons: [
            {
                text: "Continue",
                click: function () {
                    try {
                        OnContinueOfCreatePreviousOrder();
                    } catch (err) {
                    }
                },
                class: 'btn',
                style: ' outline: none !important; color : white;'
            },
            {
                text: "Cancel",
                click: function () {
                    try {
                        if (isEditOrderNumber) {
                            OnEditOrderNumberCancel();
                        }else{
                            OnCancelOfCreatePreviousOrder();
                        }
                    } catch (err) {
                    }
                    $("#divCreatePreviousOrderModal").dialog('destroy');
                },
                class: 'btn',
                style: ' outline: none !important; color : white; min-width: 77px;'
            }],
        close: function (event, ui) {
            try {
                if (typeof dialogClose != 'undefined')
                    dialogClose();
            } catch (err) {
            }
        }
    };
    $("#divCreatePreviousOrderModalMessage").html(dailog.html());
    $("#divCreatePreviousOrderModal").dialog(msgBoxData);
    CheckPrimaryProductPartOrderNumberAvailable();
    for (var i = 0; i < productParts.length; i++) {
        var id = productParts[i].id.split("_");
        var productPartId = id[1];
        var canUseForFittool = parseBool($("#HDCanUseForFitTool_" + productPartId).val());
        var orderNumber = $("#previousOrderNumber_" + productPartId).val();
        orderNumber = orderNumber.trim();
        if (canUseForFittool && orderNumber.length <= 0) {
            canUseForFittool = false;
        }
        $("#canUseForFitProfile_" + productPartId).attr("checked", canUseForFittool);
        if (deterministicPPID == productPartId) {
            AttachOrderNumberAutosuggest("previousOrderNumber_" + productPartId, orderNumberPerPPAutosuggestURL);
        } else {
            orderNumber = $("#previousOrderNumber_" + deterministicPPID).val();
            orderNumber = orderNumber.trim();
            if (orderNumber.length > 0) {
                AttachOrderNumberAutosuggest("previousOrderNumber_" + productPartId, orderNumberPerPPAutosuggestURL);
            }
        }
    }
}
function OnEditOrderNumberCancel() {
    var productParts = $("[id^=HDPPId_]");
    for (var i = 0; i < productParts.length; i++) {
        var id = productParts[i].id.split("_");
        var productPartId = id[1];
        var orderNumber = $("#OldSSOOrderNumber_" + productPartId).val();
        var orderid = $("#HDOldSSOOrderId_" + productPartId).val();
        var canUseForFitprofile = $("#HDOldCanUseForFitTool_" + productPartId).val();
        if (orderid > 0) {
            $("#SSOOrderNumber_" + productPartId).val(orderNumber);
            $("#HDSSOOrderId_" + productPartId).val(orderid);
            $("#HDCanUseForFitTool_" + productPartId).val(canUseForFitprofile);
        }
    }
}

function CheckPrimaryProductPartOrderNumberAvailable(element) {
    var deterministicPPID = $("#HDDeterministicProductPartID").val();
    var productParts = $("[id^=HDPPId_]");
    var orderNumber = $("#previousOrderNumber_" + deterministicPPID).val();
    var orderId = $("#HDSSOIntermediateOrderId_" + deterministicPPID).val();
    if (orderId <= 0) {
        orderId = $("#HDSSOOrderId_" + deterministicPPID).val();
    }
    orderNumber = orderNumber.trim();
    var isTextboxDisabled = true;
    if (orderNumber.length == 0) {
        isTextboxDisabled = true;
        CopyPriamryProductPartOrderNumberToOther("", -1, deterministicPPID);
    }
    else {
        if (orderId > 0) {
            isTextboxDisabled = false;
        } else {
            isTextboxDisabled = true;
        }
    }
    for (var i = 0; i < productParts.length; i++) {
        var id = productParts[i].id.split("_");
        var productPartId = id[1];
        if (deterministicPPID != productPartId) {
            $("#previousOrderNumber_" + productPartId).attr("disabled", isTextboxDisabled);
        }
    }
    if (element != null || element != undefined) {
        var productPartOrderNumber = $("#" + element.id).val();
        var ppId = element.id.split("_")[1];
        if (productPartOrderNumber.trim().length <= 0) {
            $("#previousOrderNumber_" + ppId).val("");
            $("#HDSSOOrderId_" + ppId).val(-1);
            $("#HDSSOIntermediateOrderId_" + ppId).val(-1);
            $("#SSOIntermediateOrderNumber_" + ppId).val("");
            $("#SSOOrderNumber_" + ppId).val("");
            $("#canUseForFitProfile_" + ppId).prop("checked", false);
        }
    }
    return isTextboxDisabled;
}

function CopyPriamryProductPartOrderNumberToOther(orderNumber,orderId, deterministicPPid, productPartIds) {
    var productParts = $("[id^=HDPPId_]");
    var copyToProductPartIds = [];
    if (productPartIds != undefined)
        copyToProductPartIds  = productPartIds.split(",");
    for (var i = 0; i < productParts.length; i++) {
        var id = productParts[i].id.split("_");
        var productPartId = id[1];
        var canCopyForPP = copyToProductPartIds.filter(x => x == productPartId);
        if (deterministicPPid != productPartId) {
            if (canCopyForPP.length > 0) {
                $("#previousOrderNumber_" + productPartId).val(orderNumber);
                $("#HDSSOIntermediateOrderId_" + productPartId).val(orderId);
                $("#SSOIntermediateOrderNumber_" + productPartId).val(orderNumber);
            } else {
                $("#previousOrderNumber_" + productPartId).val("");
                $("#HDSSOIntermediateOrderId_" + productPartId).val(-1);
                $("#SSOIntermediateOrderNumber_" + productPartId).val("");
                $("#HDIntermediateCanUseForFitTool_" + productPartId).prop("checked", false);
                $("#canUseForFitProfile_" + productPartId).prop("checked", false);
            }
            AttachOrderNumberAutosuggest("previousOrderNumber_" + productPartId, orderNumberPerPPAutosuggestURL);
        }
    }
}
function OnContinueOfCreatePreviousOrder() {
    var isTextboxDisabled = CheckPrimaryProductPartOrderNumberAvailable();
    if (isTextboxDisabled) {
        var deterministicPPID = $("#HDDeterministicProductPartID").val();
        var productPartName = $("#HDPPName_" + deterministicPPID).val();
        var messgae = GetResourceText("MANDATORY_PRODUCT_PART_ERROR", "To continue, please enter order number for") + " " + productPartName + "."
        ShowOKDialog("", messgae, OnSSCopyOrderCancelled);
    }
    else {
        var productParts = $("[id^=HDPPId_]");
        for (var i = 0; i < productParts.length; i++) {
            var id = productParts[i].id.split("_");
            var productPartId = id[1];
            var orderNumber = $("#SSOIntermediateOrderNumber_" + productPartId).val();
            var orderid = $("#HDSSOIntermediateOrderId_" + productPartId).val();
            var canUseForFitprofile = $("#HDIntermediateCanUseForFitTool_" + productPartId).val();
            if (orderid > 0) {
                $("#SSOOrderNumber_" + productPartId).val(orderNumber);
                $("#HDSSOOrderId_" + productPartId).val(orderid);
                $("#HDCanUseForFitTool_" + productPartId).val(canUseForFitprofile);
            }
        }
        LoadOrderData();
        $("#editOrderNumbers").css("display","inline-block");
    }
    $("#divCreatePreviousOrderModal").dialog('destroy');
}
function UpdateValueInHidden(element, ppId) {
    var value = $("#" + element.id).is(":checked");
    $("#HDIntermediateCanUseForFitTool_" + ppId).val(value);
}
function OnCancelOfCreatePreviousOrder() {
    ShowConfirmationModalDialogWithCustomizeText("", GetResourceText("SSO_RESET_INFORMATION", "This will reset all pre-selected information."),
        function () {
            ResetSSOOrderCopy();
        },
        OnSSCopyOrderCancelled, "", "Continue", "Cancel");
}