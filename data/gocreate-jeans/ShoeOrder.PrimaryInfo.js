function OnFabricChange(fabricId, mainMaterialTrimMasterId) {
    var selectedAtelier = GetSelectedAtelierIdentity();
  
    ClearOnFabricChange();
    if (mainMaterialTrimMasterId == undefined || mainMaterialTrimMasterId == '') {
        mainMaterialTrimMasterId = -1;
    }
    var combinationId = $("#DDLCombinations").val();
    if (fabricId > 0 || (selectedAtelier == 'SHOE-B' || selectedAtelier == 'SHOES-FORMAL')) {
        $.ajax(
            {
                type: "GET",
                url: "/ShoeOrder/GetMakes/",
                dataType: "json",
                data: { combinationId: combinationId, fabricId: fabricId, mainMaterialTrimMasterId: mainMaterialTrimMasterId },
                success: function (data) {
                    $('#IsLeatherMatchGroupShoeB').val(data.MainMaterialTrimMasterBestMatchGroupId);
                    var existingMakeDropDown = $("select[id^='" + initialTextShoeMake + "']")[0];                  
                    $(existingMakeDropDown).selectpicker('destroy');
                    existingMakeDropDown = $("select[id^='" + initialTextShoeMake + "']")[0];
                    var makeResult = GetDropDownForMakes(data.Data, existingMakeDropDown.id, 0, null, "OnMakeChange(this)", "", false);

                    $(existingMakeDropDown).replaceWith(makeResult.selectHtml);
                    
                    var imageDivId = "#MakeImage_" + combinationId;
                    $(imageDivId).html(makeResult.imageHtml);
                    var ppid = existingMakeDropDown.id.split("_")[1];
                    if ($("#HDIsOrderCreationWithSSO").val() == 'true') {
                        var makeId = $("#HDSSOOrderMake_" + ppid).val()
                        $("#DDLShoeMake_" + ppid).val(makeId);
                        $("#DDLShoeMake_" + ppid).change();
                    }
                    RefreshCurrentSelectPicker($("select[id^='" + initialTextShoeMake + "']"));
                    //RefreshSelectPicker($('#fitProfilePanel'));
                    BindLazyLoadForInfoImages();
                    var productPartId = $("#hdnDeterministicProductPartId").val();
                    PreSelectInPrimaryInfoSection("MAKE", '#DDLShoeMake_' + productPartId);
                },
                error: function (XMLHttpRequest, textStatus, errorThrown) {
                }
            });
    }
}

function SetMainMaterialBestMatchGroup(mainMaterialTrimMasterId) {
    if (mainMaterialTrimMasterId == undefined || mainMaterialTrimMasterId == '') {
        mainMaterialTrimMasterId = -1;
    }

    $.ajax(
        {
            type: "GET",
            url: "/ShoeOrder/GetMainMaterialBestMatchGroup/",
            dataType: "json",
            data: { mainMaterialTrimMasterId: mainMaterialTrimMasterId },
            success: function (data) {
                $('#IsLeatherMatchGroupShoeB').val(data.MainMaterialTrimMasterBestMatchGroupId);
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
            }
        });
}

function OnMakeChange(control) {
    var makeControlId = control.id;
    var productPartId = makeControlId.split('_')[1];
    if (productPartId != 25 && makeControlId != null) {
        $("#ShoeDesignOptionPanel").show();
    } else {
        $("#ShoeDesignOptionPanel").hide();
    }
    var makeId = GetValueById(makeControlId);
    var sppId = $('#hdnSelectedSubProductPartId').val() != undefined ? $('#hdnSelectedSubProductPartId').val() : -1;
    ClearOnMakeChange();
    if (makeId > 0) {
        $.ajax(
            {
                type: "GET",
                url: "/ShoeOrder/OnMakeChange/",
                dataType: "json",
                data: { prodcutPartId: productPartId, makeId: makeId },
                success: function (data) {
                    if (data.IsBelt) {
                        InitializeBeltFitProfile(data.Data, data.FitAdvises);
                    } else {

                        if (data.FitToolsViewModel != null) {
                            InitializeFitProfile(data.Data, data.FitAdvises, true, data.FitToolsViewModel);
                        } else {
                            InitializeFitProfile(data.Data, data.FitAdvises, false);
                        }

                    }
                    
                    //Loading Design options
                    FetchDesignOption(productPartId, sppId);
                    RenderBrandingOption();
                    BindFocusOut();
                    
                    UpdateRunningInformation(ELEMENT_TYPE_MAKE);
                    //RefreshSelectPicker($(".divShoeDesignOption"));
                  //RefreshSelectPicker($(".divBeltAndShoeTree"));
                },
                error: function (XMLHttpRequest, textStatus, errorThrown) {
                }
            });
    }
}

function ClearOnFabricChange() {
    $("select[id^='" + initialTextShoeMake + "']").html("");
    var combinationId = $("#DDLCombinations").val();
    var imageDivId = "#MakeImage_" + combinationId;
    $(imageDivId).html("");
    ClearOnMakeChange();
}

function ClearOnMakeChange() {
   //ClearFitProfile();
    ClearDesignOption();
    ClearDesignOptionMonogram();
    ClearBrandingOption();
    $("#ShoeDesignOptionPanel").hide();
}

//old autocomplete is replaced by new
function AttachFabricAutosuggest(textboxId, fabricAutosuggestURL) {

    $('[id^=TXFabric_]').on('input', function () {
        IsShowSpinner = false;
    });

    $('#' + textboxId).typeahead('destroy');
    var combinationId = $("#DDLCombinations").val();
    var urlString = fabricAutosuggestURL + '?q=%QUERY&combinationId=' + combinationId + '&itemNumber=' + 1;
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
               
                // Map the remote source JSON array to a JavaScript object array
                return data.FabricList;
            }
        },
        sufficient: 25
    });
    fabricsList.clearRemoteCache();
    $('#' + textboxId).typeahead({
        minLength: 2,
        highlight: true,
        hint: false
    },
        {
            display: 'MaterialName',
            limit: 25,
            source: fabricsList,
            templates: {
                empty: [
                    '<div class="fabricNotFound" style="margin-left: 10px">',
                    GetResourceText("LEATHER_NOT_FOUND"),
                    '</div>'
                ].join('\n'),
                suggestion: function (data) {
                    var fabricNameSpn = '<span class="fabricName-ordercreation">' + data.MaterialName + '</span>';
                    return '<div>' + fabricNameSpn + '</div>';
                }
            }
        });

    $('#' + textboxId).on('typeahead:selected',
        function (e, data) {
        var text = "";
        var fabricID = -1;
        var fabricName = "";
        var controlID = $(this).attr("id");
        var extraDays = 0;
        var notification = false;
        var IsLeatherMatch = "";
      
            var rPrice = 0;
            if (data != undefined) {
                if (data.ID != undefined && data.ID > 0 && !isNaN(data.ID)) {
                    fabricID = data.ID;
                }
                if (data.MaterialName != undefined && !isNaN(data.ID)) {
                    fabricName = data.MaterialName;
                }
                if (data.ExtraDays != undefined && data.ExtraDays > 0 && !isNaN(data.ExtraDays)) {
                    extraDays = data.ExtraDays;
                }
                if (data.Notification != undefined) {
                    notification = data.Notification;
                }
                if (data.ShoeLeatherMatchingGroupId != undefined && data.ShoeLeatherMatchingGroupId > 0 && !isNaN(data.ShoeLeatherMatchingGroupId)) {
                    IsLeatherMatch = data.ShoeLeatherMatchingGroupId;
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
                    $("#SearchFabricName").val(fabricName);
                    //Set the current values
                    $("#sp" + controlID).html(text);
                    $("#HD" + controlID).val(fabricID);
                    $("#ED" + controlID).val(extraDays);
                    $("#CL" + controlID).val(notification);
                    $("#IsLeatherMatchGroup" + controlID).val(IsLeatherMatch);


                    //make request 
                    if (fabricID > 0)
                        OnFabricSelection(ELEMENT_TYPE_FABRIC, this);
                    else {
                        OnFabricSelection(ELEMENT_TYPE_FABRIC, this);
                    }
                }
            }
        });
    $('#' + textboxId).on('typeahead:change',
        function (e, fabric) {
            var controlID = $(this).attr("id");
            if ($(this).val() == "") {
                $("#SearchFabricName").val("");
                //Set the current values
                $("#sp" + controlID).html('');
                $("#HD" + controlID).val("-1");
                $("#ED" + controlID).val("0");
                $("#CL" + controlID).val("");
                $("#IsLeatherMatchGroup" + controlID).val("");
               
            }
        });
     $('#' + textboxId).on('typeahead:rendered', function () {
        
        if (arguments.length == 2) {
            $("div.tt-suggestion.tt-selectable").addClass("hightlightSelectedSuggestion");
            $("div.tt-suggestion.tt-selectable .tt-highlight").addClass("textColorSuggestions");
            $("div.tt-suggestion.tt-selectable").addClass("tt-cursor");
        }
    });
    $("span.twitter-typeahead").addClass("col-xs-12 col-sm-12 col-md-12 col-lg-12 padding0 d-block");
    $("div.tt-menu").addClass("tt-menu-ordercreation .tt-suggestion-ordercreation");
}

function OnFabricSelectionUpdateSession(elementType, fabricTextbox) {
    var fabricTextBoxId = $(fabricTextbox).attr("id");
    var selectedId = GetValueById("HD" + fabricTextBoxId);
    var itemNumber = GetItemNumberFromFabricTextboxID(fabricTextBoxId);
    var extraDay = GetValueById("ED" + fabricTextBoxId);

    UpdateOrderInSession(fabricTextBoxId, elementType, selectedId, itemNumber, extraDay);
}

function OnMainMaterialTrimSelection(trimMasterID, dovHiddenId, designOptionInternalName) {

    if (designOptionInternalName === 'LEATHER_BELT') {
        OnMainMaterialTrimSelectionUpdateSession(trimMasterID, dovHiddenId, function () {
            UpdateRunningInformation(ELEMENT_TYPE_TRIM, trimMasterID, designOptionInternalName);
            OnFabricChange(-1, trimMasterID);
        });
    } else {
        OnFabricChange(-1, trimMasterID);
    }
}

function OnFabricSelection(elementType, fabricTextbox) {
    var fabricTextBoxId = $(fabricTextbox).attr("id");
    var selectedId = GetValueById("HD" + fabricTextBoxId);
    OnFabricSelectionUpdateSession(elementType, fabricTextbox);
    OnFabricChange(selectedId);
}

function UpdateOrderInSession(controlId, elementType, selectedId, itemNumber, extraDays, elementName, callback) {

    var requestData =
    {
        elementType: elementType,
        elementID: selectedId,
        itemNumber: 1,
        extraDays: extraDays,
        elementName: elementName
    };

    var updateSessionOrderUrl = "/ShoeOrder/UpdateSelectedFabricInSession";
    $.getJSON(updateSessionOrderUrl, requestData,
        function (data) {
            if (data.status) {
                if (callback)
                    callback();
                SetValueById("RPrice" + controlId, data.RPrice);
                UpdateRunningInformation(ELEMENT_TYPE_FABRIC);
                
                if (elementType == ELEMENT_TYPE_FABRIC && data.IsProcessPending != null && data.IsProcessPending == true) {
                    $("#btnSaveOrder").hide();
                    $("#ProcessPending").show();
                    $("#ProcessPendingNote").show();
                }
            }
        });
}

function OnMainMaterialTrimSelectionUpdateSession(selectedTrimMasterId, dovHiddenId, callback) {
    
    var extraDays = GetValueById("ED" + dovHiddenId);
    extraDays = extraDays ? parseInt(extraDays) : 0;
    var atelierId = GetValueById("HD_AtelierId");
    UpdateMainMaterialTrimAtelierInSession(selectedTrimMasterId, extraDays, atelierId, callback);
}

function UpdateMainMaterialTrimAtelierInSession(selectedTrimMasterId, extraDays, atelierId, callback) {
    debugger;
    var requestData =
    {
        elementId: selectedTrimMasterId,
        extraDays: extraDays,
        atelierId: atelierId
    };

    var updateSessionOrderUrl = "/ShoeOrder/UpdateSelectedMainMaterialAtelierInSession";
    $.getJSON(updateSessionOrderUrl, requestData,
        function (data) {
            if (data.status) {
                if (typeof callback === "function") {
                    callback();
                }
            }
        });
}

function GetItemNumberFromFabricTextboxID(fabricTextboxId) {
    var result = -1;

    if (fabricTextboxId != null) {

        var arr = fabricTextboxId.split("_");
        if (arr != null && arr.length > 1) {
            result = $.parseInt(arr[1]);
        }
    }

    return result;
}

function AttachOnFocusForFabricTextbox() {
    $("#PrimaryInfoTemplate").find("input[id^='TXFabric_']").keydown(function (e) {
        OnFabricTextboxFocus(this, e);
    });

}

function AttachOnFocusForMainMaterialTrimMasterTextbox(mainMaterialTrimMasterOptionControl) {
    $("#" + mainMaterialTrimMasterOptionControl).keydown(function (e) {
        OnMainMaterialTrimMasterTextboxFocus(this, e);
    });
}

function OnFabricTextboxFocus(fabricOrLiningTextbox, e) {
     // select first elemnt of fabric list on enter
    if (e.keyCode == 13) {
        var parentDiv = $(fabricOrLiningTextbox).siblings(".tt-menu");
        var childDiv = $("div.tt-dataset ", parentDiv);
      
        var numberOfDivs = $("div.tt-suggestion.tt-selectable", childDiv).length;
        if (numberOfDivs == 1) {
            $(".tt-suggestion:first-child", childDiv).trigger("click")
        }
    }      

    const input = String.fromCharCode(e.keyCode);

    if (/[a-zA-Z0-9-_]/.test(input)) {
        $("#HDTXFabric_1").val("-1");
        $("#EDTXFabric_1").val("0");
    }
}

function OnSPPChange(element) {
    var subProductPartId = $(element).val();
    var productPartId = $(element).attr("id").split("_")[1];
    var isCallAsync = $("#hdnPreSelectDropDown").val() == "true";
    var settingSPPFirstTimeForSSO = false;
    if (($('#hdnSelectedSubProductPartId').val() === 'null') && subProductPartId > 0 && $("#HDIsOrderCreationWithSSO").val() == 'true') {
        settingSPPFirstTimeForSSO = true;
    }
    $('#hdnSelectedSubProductPartId').val(subProductPartId);

    if (subProductPartId > 0) {
        // ClearCombinationRelatedChanges();
        var data = { productPartId: productPartId, subProductPartId: subProductPartId };
        $.ajax({
            type: "POST",
            data: data,
            async: !isCallAsync,
            url: "/ShoeOrder/OnSPPChange/",
            success: function (responseData) {
                if (responseData != null && responseData.Status) {
                    //make                   
                    var $prodMakeTr = $("#PrimaryInfoTemplate div[id='DIVMake']");
                    var $prodMakeTd = $prodMakeTr.find("div[id='DDLShoeMake_" + productPartId + "']")[0];
                    var oldSelectedMakeId = $($prodMakeTd).find('select option:selected').val();

                    if ($("#HDIsOrderCreationWithSSO").val() == 'true') {
                        
                        var makeId = $("#HDSSOOrderMake_" + productPartId).val()
                        oldSelectedMakeId = makeId;
                        $("#DDLShoeMake_" + productPartId).val(makeId);
                        $("#DDLShoeMake_" + productPartId).change();
                    }

                    if (responseData.ProductMakes != null && responseData.ProductMakes.length > 0) {
                        $($prodMakeTd).find('select').html("");
                        $($prodMakeTd).find('select').append($('<option value = "-1"></option>').attr('data-extraDays', 0));

                        $.each(responseData.ProductMakes, function (prodMakeIndex, productMake) {
                            var $prodMakeOption = $('<option></option').attr("value", productMake.Id).attr('data-extraDays', productMake.ExtraDays).attr('data-rPrice', productMake.RPrice).html(productMake.Name);
                            if (oldSelectedMakeId > 0 && oldSelectedMakeId == productMake.Id) {
                                $prodMakeOption.attr('selected', 'selected');
                            }
                            $($prodMakeTd).find('select').append($prodMakeOption);
                        });
                    } else {
                        $($prodMakeTd).find('select').html("");
                        $($prodMakeTd).find('select').append($('<option></option>'));
                    }
                    if (!settingSPPFirstTimeForSSO)
                        ClearMaterialAutoSuggestTemplate();
                    //design options
                    RenderDesignTemplate(responseData.Data.DesignOptionViewModel, true);

                    UpdateRunningInformation(ELEMENT_TYPE_SPP);
                    RefreshSelectPicker($(".divPrimaryInfo"));
                    RefreshSelectPicker($(".divShoeDesignOption"));
                    RefreshSelectPicker($(".divBeltAndShoeTree"));
                    //RefereshRunningInfo(REQUEST_TYPE_ELEMENT, TAB_PPRICE, ELEMENT_TYPE_SPP, subProductPartId, 1, productPartId, "0", READYMADE_ORDER);
                }
                BindFocusOut();
                RefreshSelectPicker($(".divPrimaryInfo"));
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
            }
        });
    }
}

function OnMainMaterialTrimMasterTextboxFocus(trimMasterDOVTextbox, e) {
    // select first elemnt of fabric list on enter
    if (e.keyCode == 13) {
        var parentDiv = $(trimMasterDOVTextbox).siblings(".tt-menu");
        var childDiv = $("div.tt-dataset ", parentDiv);

        var numberOfDivs = $("div.tt-suggestion.tt-selectable", childDiv).length;
        if (numberOfDivs == 1) {
            $(".tt-suggestion:first-child", childDiv).trigger("click")
        }
    }

    const input = String.fromCharCode(e.keyCode);
    // change this
    if (/[a-zA-Z0-9-_]/.test(input)) {
        $("#HDTXFabric_1").val("-1");
        $("#EDTXFabric_1").val("0");
    }
}

function AttachMainMaterialTrimMasterAutosuggest(textboxId, mainMaterialTrimMasterAutosuggestUrl) {

    $('[id^=TXFabric_]').on('input', function () {// fix this
        IsShowSpinner = false;
    });
    $('#' + textboxId).typeahead('destroy');
    //var combinationId = $("#DDLCombinations").val();
    var designOptionData = textboxId.split("_");

    var productPartId = designOptionData[2];
    var designOptionCategoryId = designOptionData[3];
    var designOptionId = designOptionData[4];
    var sppId = $('#hdnSelectedSubProductPartId').val() != undefined ? $('#hdnSelectedSubProductPartId').val() : null;

    var urlString = mainMaterialTrimMasterAutosuggestUrl + '?q=%QUERY&productPartId=' + productPartId + '&designOptionCategoryId=' + designOptionCategoryId + '&designOptionId=' + designOptionId + '&sppId=' + sppId;
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

                // Map the remote source JSON array to a JavaScript object array
                return data.TrimMasterList;
            }
        },
        sufficient: 25
    });
    fabricsList.clearRemoteCache();
    $('#' + textboxId).typeahead({
        minLength: 2,
        highlight: true,
        hint: false
    },
        {
            display: 'MaterialName',
            limit: 25,
            source: fabricsList,
            templates: {
                empty: [
                    '<div class="fabricNotFound" style="margin-left: 10px">',
                    GetResourceText("LEATHER_NOT_FOUND"),
                    '</div>'
                ].join('\n'),
                suggestion: function (data) {
                    var fabricNameSpn = '<span class="fabricName-ordercreation">' + data.MaterialName + '</span>';
                    return '<div>' + fabricNameSpn + '</div>';
                }
            }
        });

    $('#' + textboxId).on('typeahead:selected',
        function (e, data) {
            var text = "";
            var fabricID = -1;
            var fabricName = "";
            var controlID = $(this).attr("id");
            var extraDays = 0;
            var notification = false;
            var IsLeatherMatch = "";
            var fabricDOVID = "";
            var atelierId = -1;
            var rPrice = 0;
            if (data != undefined) {
                if (data.ID != undefined && data.ID > 0 && !isNaN(data.ID)) {
                    fabricID = data.ID;
                }
                if (data.DOVTrimMasterID != undefined) {
                    fabricDOVID = data.DOVTrimMasterID;
                }

                if (data.MaterialName != undefined && !isNaN(data.ID)) {
                    fabricName = data.MaterialName;
                }
                if (data.ExtraDays != undefined && data.ExtraDays > 0 && !isNaN(data.ExtraDays)) {
                    extraDays = data.ExtraDays;
                }
                if (data.ShoeLeatherMatchingGroupId != undefined && data.ShoeLeatherMatchingGroupId > 0 && !isNaN(data.ShoeLeatherMatchingGroupId)) {
                    IsLeatherMatch = data.ShoeLeatherMatchingGroupId;
                }

                if (extraDays > 0) {
                    text = String.format(GetResourceText("EXTRADAYS", "{0} extra day(s)"), extraDays);
                }

                if (data.RPrice != undefined && data.RPrice > 0 && !isNaN(data.RPrice)) {
                    rPrice = data.RPrice;
                }       

                if (data.AtelierID != undefined && data.AtelierID > 0 && !isNaN(data.AtelierID)) {
                    atelierId = data.AtelierID;
                }

                if (fabricDOVID != $("#" + controlID).val()) {
                    
                    $("#SearchFabricName").val(fabricName);
                    //Set the current values
                    
                    var dovHiddenId = textboxId.replace(/^text_/, "");
                    $("#ED" + dovHiddenId).val(extraDays);
                    $("#RPrice" + dovHiddenId).val(rPrice);                
                    $("#RPrice" + textboxFabric + "1").val(rPrice);
                    $('#' + dovHiddenId).val(fabricDOVID);
                    $("#IsLeatherMatchGroupShoeB").val(IsLeatherMatch);
                    $("#HD_AtelierId").val(atelierId);                    
                    OnMainMaterialDovChange(this, fabricDOVID, controlID, dovHiddenId);
                }
            }
        });
    $('#' + textboxId).on('typeahead:change',
        function (e, fabric) {
            var controlID = $(this).attr("id");
            if ($(this).val() == "") {
                $("#SearchFabricName").val("");
                //Set the current values
                $("#ED" + controlID).val(0);
                $("#RPrice" + controlID).val(0);
                $("#IsLeatherMatchGroup" + controlID).val("");
                $(controlID).val("");

                var dovHiddenId = controlID.replace(/^text_/, "");
                $('#' + dovHiddenId).val(-1);
            }
        });
    $('#' + textboxId).on('typeahead:rendered', function () {

        if (arguments.length == 2) {
            $("div.tt-suggestion.tt-selectable").addClass("hightlightSelectedSuggestion");
            $("div.tt-suggestion.tt-selectable .tt-highlight").addClass("textColorSuggestions");
            $("div.tt-suggestion.tt-selectable").addClass("tt-cursor");
        }
    });
    $("span.twitter-typeahead").addClass("col-xs-12 col-sm-12 col-md-12 col-lg-12 padding0 d-block");
    $("div.tt-menu").addClass("tt-menu-ordercreation .tt-suggestion-ordercreation");
}

// not needed anymore remove this
function AttachSecondaryMaterialTrimMasterAutosuggest(textboxId, mainMaterialTrimMasterAutosuggestUrl) {

    $('#' + textboxId).typeahead('destroy');
    var designOptionData = textboxId.split("_");

    var productPartId = designOptionData[2];
    var designOptionCategoryId = designOptionData[3];
    var designOptionId = designOptionData[4];
    var sppId = $('#hdnSelectedSubProductPartId').val() != undefined ? $('#hdnSelectedSubProductPartId').val() : null;
    var urlString = mainMaterialTrimMasterAutosuggestUrl + '?q=%QUERY&productPartId=' + productPartId + '&designOptionCategoryId=' + designOptionCategoryId + '&designOptionId=' + designOptionId + '&sppId=' + sppId;
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

                // Map the remote source JSON array to a JavaScript object array
                return data.TrimMasterList;
            }
        },
        sufficient: 25
    });
    fabricsList.clearRemoteCache();
    $('#' + textboxId).typeahead({
        minLength: 2,
        highlight: true,
        hint: false
    },
        {
            display: 'MaterialName',
            limit: 25,
            source: fabricsList,
            templates: {
                empty: [
                    '<div class="fabricNotFound" style="margin-left: 10px">',
                    GetResourceText("LEATHER_NOT_FOUND"),
                    '</div>'
                ].join('\n'),
                suggestion: function (data) {
                    var fabricNameSpn = '<span class="fabricName-ordercreation">' + data.MaterialName + '</span>';
                    return '<div>' + fabricNameSpn + '</div>';
                }
            }
        });

    $('#' + textboxId).on('typeahead:selected',
        function (e, data) {
            var text = "";
            var fabricID = -1;
            var fabricName = "";
            var controlID = $(this).attr("id");
            var extraDays = 0;
            var notification = false;
            var IsLeatherMatch = "";
            var fabricDOVID = "";

            var rPrice = 0;
            if (data != undefined) {
                if (data.ID != undefined && data.ID > 0 && !isNaN(data.ID)) {
                    fabricID = data.ID;
                }
                if (data.DOVTrimMasterID != undefined) {
                    fabricDOVID = data.DOVTrimMasterID;
                }

                if (data.MaterialName != undefined && !isNaN(data.ID)) {
                    fabricName = data.MaterialName;
                }
                if (data.ExtraDays != undefined && data.ExtraDays > 0 && !isNaN(data.ExtraDays)) {
                    extraDays = data.ExtraDays;
                }
                if (data.ShoeLeatherMatchingGroupId != undefined && data.ShoeLeatherMatchingGroupId > 0 && !isNaN(data.ShoeLeatherMatchingGroupId)) {
                    IsLeatherMatch = data.ShoeLeatherMatchingGroupId;
                }

                if (extraDays > 0) {
                    text = String.format(GetResourceText("EXTRADAYS", "{0} extra day(s)"), extraDays);
                }

                if (fabricDOVID != $("#" + controlID).val()) {
                    $("#SecondaryFabricName").val(fabricName);
                    //Set the current values
                    $("#ED" + controlID).val(extraDays);
                    $("#RPrice" + controlID).val(0);

                    var dovHiddenId = textboxId.replace(/^text_/, "");
                    $('#' + dovHiddenId).val(fabricDOVID);

                    $("#IsLeatherMatchGroup" + controlID).val(IsLeatherMatch);
                    //make request 
                    
                    OnMainMaterialDovChange(this, fabricDOVID, controlID);
                }
            }
        });
    $('#' + textboxId).on('typeahead:change',
        function (e, fabric) {
            var controlID = $(this).attr("id");
            if ($(this).val() == "") {
                $("#SecondaryFabricName").val("");
                //Set the current values
                $("#ED" + controlID).val(0);
                $("#RPrice" + controlID).val(0);
                $("#IsLeatherMatchGroup" + controlID).val("");
                $(controlID).val("");

                var dovHiddenId = controlID.replace(/^text_/, "");
                $('#' + dovHiddenId).val(-1);
            }
        });
    $('#' + textboxId).on('typeahead:rendered', function () {

        if (arguments.length == 2) {
            $("div.tt-suggestion.tt-selectable").addClass("hightlightSelectedSuggestion");
            $("div.tt-suggestion.tt-selectable .tt-highlight").addClass("textColorSuggestions");
            $("div.tt-suggestion.tt-selectable").addClass("tt-cursor");
        }
    });
    $("span.twitter-typeahead").addClass("col-xs-12 col-sm-12 col-md-12 col-lg-12 padding0 d-block");
    $("div.tt-menu").addClass("tt-menu-ordercreation .tt-suggestion-ordercreation");
}


function AttachSecondaryMaterialTrimMasterAutosuggest(textboxId, mainMaterialTrimMasterAutosuggestUrl) {

    //$('[id^=TXFabric_]').on('input', function () {// fix this
    //    IsShowSpinner = false;
    //});
    $('#' + textboxId).typeahead('destroy');
    var designOptionData = textboxId.split("_");

    var productPartId = designOptionData[2];
    var designOptionCategoryId = designOptionData[3];
    var designOptionId = designOptionData[4];
    var sppId = $('#hdnSelectedSubProductPartId').val() != undefined ? $('#hdnSelectedSubProductPartId').val() : null;
    var urlString = mainMaterialTrimMasterAutosuggestUrl + '?q=%QUERY&productPartId=' + productPartId + '&designOptionCategoryId=' + designOptionCategoryId + '&designOptionId=' + designOptionId + '&sppId=' + sppId;
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

                // Map the remote source JSON array to a JavaScript object array
                return data.TrimMasterList;
            }
        },
        sufficient: 25
    });
    fabricsList.clearRemoteCache();
    $('#' + textboxId).typeahead({
        minLength: 2,
        highlight: true,
        hint: false
    },
        {
            display: 'MaterialName',
            limit: 25,
            source: fabricsList,
            templates: {
                empty: [
                    '<div class="fabricNotFound" style="margin-left: 10px">',
                    GetResourceText("LEATHER_NOT_FOUND"),
                    '</div>'
                ].join('\n'),
                suggestion: function (data) {
                    var fabricNameSpn = '<span class="fabricName-ordercreation">' + data.MaterialName + '</span>';
                    return '<div>' + fabricNameSpn + '</div>';
                }
            }
        });

    $('#' + textboxId).on('typeahead:selected',
        function (e, data) {
            var text = "";
            var fabricID = -1;
            var fabricName = "";
            var controlID = $(this).attr("id");
            var extraDays = 0;
            var notification = false;
            var IsLeatherMatch = "";
            var fabricDOVID = "";

            var rPrice = 0;
            if (data != undefined) {
                if (data.ID != undefined && data.ID > 0 && !isNaN(data.ID)) {
                    fabricID = data.ID;
                }
                if (data.DOVTrimMasterID != undefined) {
                    fabricDOVID = data.DOVTrimMasterID;
                }

                if (data.MaterialName != undefined && !isNaN(data.ID)) {
                    fabricName = data.MaterialName;
                }
                if (data.ExtraDays != undefined && data.ExtraDays > 0 && !isNaN(data.ExtraDays)) {
                    extraDays = data.ExtraDays;
                }
                if (data.ShoeLeatherMatchingGroupId != undefined && data.ShoeLeatherMatchingGroupId > 0 && !isNaN(data.ShoeLeatherMatchingGroupId)) {
                    IsLeatherMatch = data.ShoeLeatherMatchingGroupId;
                }

                if (extraDays > 0) {
                    text = String.format(GetResourceText("EXTRADAYS", "{0} extra day(s)"), extraDays);
                }

                if (fabricDOVID != $("#" + controlID).val()) {
                    $("#SecondaryFabricName").val(fabricName);
                    //Set the current values
                    $("#ED" + controlID).val(extraDays);
                    $("#RPrice" + controlID).val(0);

                    var dovHiddenId = textboxId.replace(/^text_/, "");
                    $('#' + dovHiddenId).val(fabricDOVID);

                    $("#IsLeatherMatchGroup" + controlID).val(IsLeatherMatch);
                    //make request 
                    
                    OnMainMaterialDovChange(this, fabricDOVID, controlID);
                }
            }
        });
    $('#' + textboxId).on('typeahead:change',
        function (e, fabric) {
            var controlID = $(this).attr("id");
            if ($(this).val() == "") {
                $("#SecondaryFabricName").val("");
                //Set the current values
                $("#ED" + controlID).val(0);
                $("#RPrice" + controlID).val(0);
                $("#IsLeatherMatchGroup" + controlID).val("");
                $(controlID).val("");

                var dovHiddenId = controlID.replace(/^text_/, "");
                $('#' + dovHiddenId).val(-1);
            }
        });
    $('#' + textboxId).on('typeahead:rendered', function () {

        if (arguments.length == 2) {
            $("div.tt-suggestion.tt-selectable").addClass("hightlightSelectedSuggestion");
            $("div.tt-suggestion.tt-selectable .tt-highlight").addClass("textColorSuggestions");
            $("div.tt-suggestion.tt-selectable").addClass("tt-cursor");
        }
    });
    $("span.twitter-typeahead").addClass("col-xs-12 col-sm-12 col-md-12 col-lg-12 padding0 d-block");
    $("div.tt-menu").addClass("tt-menu-ordercreation .tt-suggestion-ordercreation");
}