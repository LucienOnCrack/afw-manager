var divDesignOptionProPart = "DIVDesignOptionProductPart_";
var divMonogramProductPart = "DIVMonoGramProductPart_";
var drpOptionControlId = "drpDesignOption_";
var txtMonogramControlId = "txtDesignOption_";
var chkMonoGramOption = "IsMonogramOption_";
var hdIsMonogramOptionYesNo = "HDIsMonogramOptionYesNo_";
var hdCategorySequence = "HDCategorySequence_";
var hdIsOptional = "IsOptional_";
var hdOptionValueId = "HDDesignOptionValueID_";
var hdOptionSequence = "HDOptionSequence_";
var hdOptionControlType = "HDOptionControlType_";
var hdOptionRequired = "HDOptionRequired_";
var hdOptionlist = "HDOptionList_";
var hdOptionInternalName = "HDOptionInternalName_";
var divOptionCategoryId = "DIVOptionCategory_";
var beltOptionYesInternalName = "BeltYes";
var beltOptionNoInternalName = "BeltNo";
var beltOptionYesInternalNameCLoafer = "BeltYes";
var beltOptionNoInternalNameCLoafer = "BeltNo";
var beltOptionNAInternalName = "NA";
var beltOptionNAInternalNameCL = "NA";
var beltDOInternalName = "Belt";
var beltCLInternalName = "Belt";
var shoeTreeDOInternalName = "ShoeTree";
var shoeTreeYesInternalName = "ShoeTreeYes";
var shoeTreeNoInternalName = "ShoeTreeNo";
var drpMonogramControlId = "drpMonogram_";
var hddrpMonogramControlId = "HDdrpMonogram_";

 
var InitiaLizeDesignOption = function (data, loadAll) {
    if (data) {
        if (loadAll) {
            RenderProductPartDesignOptionTemplate(data.ProductPartDov);
        }
        FillDesignOptiondata(data, loadAll);
        if (loadAll) {
            //RenderMonoGramTemplate(data.ProductPartDov);

            FillMonoGramData(data);
        }
        BindFocusOut();
        BindLazyLoadForDropImagesInSelectPicker();
    }
}

var RenderDesignTemplate = function (data, isCallFromOnSppChange = false) {

    var productPartDovs = data.ProductPartDov;

    for (var i = 0; i < productPartDovs.length; i++) {
        var productPart = productPartDovs[i].PerPartDesignOption.ProductPart;

        if (productPartDovs[i].PerPartDesignOption.Categories.length > 0) {

            AddHtmlDesignOptionCategoryWise(productPartDovs[i], "", false, isCallFromOnSppChange);
            ChangeDesignOptionPanelNameToBelt(productPartDovs[i]);
            var beltToggle = $("input[id^='IsBeltChosen_']");
            if (beltToggle.length > 0) {
                EnableDisableBeltOption(beltToggle[0]);
            }
            var shoeTreeToggle = $("input[id^='IsShoeTreeChosen_']");
            if (shoeTreeToggle.length > 0) {
                ChangeShoeTreeSelection(shoeTreeToggle[0]);
            }
        }
    }


}

var ChangeDesignOptionPanelNameToBelt = function (data) {
    var selectedAtelier = GetSelectedAtelierIdentity();
    var isBeltOptionAvailable = false;
    var categories = data.PerPartDesignOption.Categories;
    for (var i = 0; i < categories.length; i++) {
        var optionCategory = categories[i];
        if (optionCategory) {
            if (!optionCategory.IsOptional) {
                for (var j = 0; j < optionCategory.DesignOptions.length; j++) {
                    var designOption = optionCategory.DesignOptions[j];
                    if (designOption.InternalName == "Belt") {
                        isBeltOptionAvailable = true;
                        break;
                    }
                }
            }
        }
        if (isBeltOptionAvailable)
            break;
    }
    var combinationId = $("#DDLCombinations").val();
    if (isBeltOptionAvailable) {

        $("#" + designOptionPanel).find("div.panel-heading").html("Belt & Shoe trees");

        //$("#" + designOptionPanel).find("div.panel-heading").html.GetResourceText("BELT_AND_SHOE_TREES");
        $("#ShoeDesignOptionPanel").show();

    }
    else if ((selectedAtelier == 'SHOE-B' || selectedAtelier == 'SHOES-FORMAL') && !isBeltOptionAvailable && combinationId != 64)
    { // IN CASE OF RUNNER -  KNIT AS IT DOES NOT SUPPORT BELT ORDER
        $("#" + designOptionPanel).find("div.panel-heading").html("Shoe tree");
        $("#ShoeDesignOptionPanel").show();
    }
    else {
        $("#" + designOptionPanel).find("div.panel-heading").html("Design Option");
        $("#ShoeDesignOptionPanel").hide();
    }
}

var RenderDesignOptionTemplate = function (data) {

    var perPartOptions = data.ProductPartDov;
    RenderMonoGramTemplate(perPartOptions);
    RenderProductPartDesignOptionTemplate(perPartOptions);
}

var RenderProductPartDesignOptionTemplate = function (data) {
    var row = InitializeProductPartDiv(data, divDesignOptionProPart);

    if (row) {
        AddHtmlToDesignOption(row);
    }
}

var InitializeProductPartDiv = function (data, initialDivId, isMonogram) {
    var col = "";
    if (isMonogram) {
        col = "col-xs-12 col-sm-12 col-md=6 col-lg-12";
    } else {
        col = "col-xs-12 col-sm-12 col-md-12 col-lg-12";
    }

    var rowOpen = '<div class="row row-fluid">';
    var colOpen = '<div class="' + col + '">';
    var colClose = '</div>';
    var rowClose = '</div>';

    var firtRow = "";
    var alreadyExists = false;
    for (var i = 0; i < data.length; i++) {
        if (data[i].PerPartDesignOption.ProductPart) {
            var partFitToolDiv = initialDivId + data[i].PerPartDesignOption.ProductPart.ProductPartId;
            var id = "#" + partFitToolDiv;

            if ($(id).contents().length) {
                alreadyExists = true;
            } else {
                firtRow = firtRow +
                    colOpen +
                    '<div class="row row-fluid"><div id=' +
                    partFitToolDiv +
                    '  class="col-xs-12 col-sm-12 col-md-12 col-lg-12"></div></div>' +
                    colClose;
            }
        }
    }
    var row = "";
    if (firtRow) {
        if (alreadyExists) {
            row = undefined;
        } else {
            row = rowOpen + firtRow + rowClose;
        }
    }
    return row;
}

var FillDesignOptiondata = function (data, loadAll) {

    var productPartDovs = data.ProductPartDov;
    var designOptionParthtml = '';
    var mode = -1;
    for (var i = 0; i < productPartDovs.length; i++) {
        var productPart = productPartDovs[i].PerPartDesignOption.ProductPart;

        if (productPartDovs[i].PerPartDesignOption.Categories.length > 0) {
            //designOptionParthtml = DesignOptionPartHeader(productPart.ProductPartName);

            designOptionParthtml = designOptionParthtml + AddHtmlDesignOptionCategoryWise(productPartDovs[i], "", loadAll);
            RefreshSelectPicker($(".divPrimaryInfo"));
            if (loadAll) {
                AddDesignOptionHtmlIntoPartDiv(designOptionParthtml, productPart.ProductPartId, divDesignOptionProPart);
                ChangeDesignOptionPanelNameToBelt(productPartDovs[i]);
                var beltToggle = $("input[id^='IsBeltChosen_']");
                if (beltToggle.length > 0) {
                    EnableDisableBeltOption(beltToggle[0]);
                }
                var shoeTreeToggle = $("input[id^='IsShoeTreeChosen_']");
                if (shoeTreeToggle.length > 0) {
                    ChangeShoeTreeSelection(shoeTreeToggle[0]);
                }
                //   $("#ShoeDesignOptionPanel").show();
            }
        }
        mode = productPartDovs[i].Mode;
    }

    if (designOptionParthtml && loadAll) {

        ShowHideDesignOptionPanel(true);
        UpdateRunningInformation();
    }

   
    var modelHtml = $("select[data-internalname='Model']");
    var selectedModelValue = $(modelHtml).val();
    var selectedAtelier = GetSelectedAtelierIdentity();
    if (selectedAtelier == 'SHOE-B' && modelHtml.length > 0) {
        var isSSO = false;
        var $ssoOrder = $("#HDIsOrderCreationWithSSO");
        if ($ssoOrder.length > 0 && $ssoOrder.val() != null) {
            isSSO = $ssoOrder.val().toLowerCase() === 'true';
        }


        //  Show extra pair of laces DO only for boatshoe and mid-top loafer, low top and mid top loafer also-- SNEAKER - SHOE B ATELIER
        if (selectedModelValue != undefined &&
            selectedModelValue != -1 &&
            (selectedModelValue == 29441 || selectedModelValue == 18619 || selectedModelValue == 18618)) {
            if ((mode == -1 || mode == 0) && !isSSO) {
                $("select[data-internalname='Laces-SNEA']").val("");
            }
            $("select[data-internalname='Laces-SNEA']").closest("div[class*=row]").show();
        } else {
            var noLacesOption = $("select[data-internalname='Laces-SNEA']").find("option[data-internalname='no']");
            $("select[data-internalname='Laces-SNEA']").val($(noLacesOption).val());
            $("select[data-internalname='Laces-SNEA']").closest("div[class*=row]").hide();
        }

        //  Show contrast backpiece and contrast tongue options only for sneaker low top and mid top
        if (selectedModelValue != undefined &&
            selectedModelValue != -1 &&
            (selectedModelValue == 18619 || selectedModelValue == 18618)) {
            

            if ((mode == -1 || mode == 0) && !isSSO) {
                $("select[data-internalname='ShoeBackTab']").val("");
            }
            $("select[data-internalname='ShoeBackTab']").closest("div[class*=row]").show();
        } else {
            var noContrastBackpieceOption = $("select[data-internalname='ShoeBackTab']").find("option[data-internalname='TIT']");
            $("select[data-internalname='ShoeBackTab']").val($(noContrastBackpieceOption).val());
            $("select[data-internalname='ShoeBackTab']").closest("div[class*=row]").hide();
        }

        if (selectedModelValue != undefined &&
            selectedModelValue != -1 &&
            (selectedModelValue == 18619 || selectedModelValue == 18618)) {
            if ((mode == -1 || mode == 0) && !isSSO) {
                $("select[data-internalname='TongueContrast']").val("");
            }
            $("select[data-internalname='TongueContrast']").closest("div[class*=row]").show();
        } else {
            var noContrastTongueOption = $("select[data-internalname='TongueContrast']").find("option[data-internalname='TIT']");
            $("select[data-internalname='TongueContrast']").val($(noContrastTongueOption).val());
            $("select[data-internalname='TongueContrast']").closest("div[class*=row]").hide();
        }
    }
    else {
        if (selectedModelValue != undefined &&
            selectedModelValue != -1 &&
            (selectedModelValue != 18619 && selectedModelValue != 18618)) { // low top and mid top -  SHOE A ATELIER
            var noLacesOption = $("select[data-internalname='Laces-SNEA']").find("option[data-internalname='no']");
            $("select[data-internalname='Laces-SNEA']").val($(noLacesOption).val());
            $("select[data-internalname='Laces-SNEA']").closest("div[class*=row]").hide();
        } else {
            if (mode == -1 || mode == 0) {
                var isChecked = GetIsChecked("chkMarkProductPart");
                if (!isChecked) {
                    $("select[data-internalname='Laces-SNEA']").val("");
                }
            }
            $("select[data-internalname='Laces-SNEA']").closest("div[class*=row]").show();
        }
    }
}

var DesignOptionPartHeader = function (name) {
    var row = '<div class="row row-fluid">' +
        '<div class="col-xs-12 col-sm-12 col-md-12 col-lg-12">' +
        '<label class="form-label-bold">' + name + '</label>' +
        '</div>' +
        '</div>';

    return row;
}

var AddHtmlDesignOptionCategoryWise = function (data, htmlStr, loadAll, isCallFromOnSppChange = false) {

    var categories = data.PerPartDesignOption.Categories;
    var productPart = data.PerPartDesignOption.ProductPart;
    var selectedAtelier = GetSelectedAtelierIdentity(-1);
    var mainMaterialTrimMasterOptionControl = '';
 

    for (var i = 0; i < categories.length; i++) {
        var optionCategory = categories[i];
        if (optionCategory) {
            if (!optionCategory.IsOptional) {
                htmlStr = htmlStr + GetHiddenField(hdCategorySequence + optionCategory.ID, optionCategory.Sequence);
                var htmlBeltSizeWidth = "";
                var contrastDOHtml = "";
                var lininingDOHtml = "";
                var extraPairDOHtml = "";
                var shoeDOPrimaryInfoHTML = "";
                var shoeSecondaryMaterialDOInfoHTML = "";
                for (var j = 0; j < optionCategory.DesignOptions.length; j++) {

                    var designOption = optionCategory.DesignOptions[j];
                    if (designOption.Visible) {
                        var optionHtml = FitOptionRow(designOption, productPart.ProductPartId, optionCategory.ID, isCallFromOnSppChange);

                        if (designOption.InternalName == "LEATHER_SNEAKER" || designOption.InternalName == "LEATHER_CITYLOAFER" || designOption.InternalName == "LEATHER_FR" 
                            || designOption.InternalName == "LEATHER_BELT" || designOption.InternalName == "LEATHER_RUNNER") {
                            $('#leatherTextField').html('');
                            $('#leatherTextField').html(optionHtml);
                            $('#DivMainMaterialTrimMasterAutoSuggest').show();
                            mainMaterialTrimMasterOptionControl = "text_" + drpOptionControlId + productPart.ProductPartId + "_" + optionCategory.ID + "_" + designOption.ID;
                            continue;
                        }
                      

                        if (designOption.InternalName == "BeltSize" ||
                            designOption.InternalName == "BeltWidth" ||
                            designOption.InternalName == "BeltBuckleColor") {

                            htmlBeltSizeWidth += optionHtml;
                            //if (checkToggleBelt) {
                            //    $('#BeltSizeAndWidthTemplate').removeClass("hidden");
                            //    $('#BeltSizeAndWidthTemplate').addClass("show");
                            //} else {
                            //    $('#BeltSizeAndWidthTemplate').removeClass("show");
                            //    $('#BeltSizeAndWidthTemplate').addClass("hidden");
                            //}

                        } else if (data.PerPartDesignOption.ProductPart.ProductPartId == 21 && (designOption.InternalName === "ShoeBackTab" || designOption.InternalName === "TongueContrast")) {

                            contrastDOHtml += optionHtml;
                        } else if ((data.PerPartDesignOption.ProductPart.ProductPartId == 21 || (data.PerPartDesignOption.ProductPart.ProductPartId == 33)) && (designOption.InternalName === "Lining") ) {

                            lininingDOHtml += optionHtml;
                        } else if (((data.PerPartDesignOption.ProductPart.ProductPartId == 21 || data.PerPartDesignOption.ProductPart.ProductPartId == 41)
                            && (designOption.InternalName === "ShoeBackTab" || designOption.InternalName === "TongueContrast" || designOption.InternalName === "Lining"
                                || designOption.InternalName === "Laces-SNEA"
                                || designOption.InternalName === "Laces-RUN"))
                            || (data.PerPartDesignOption.ProductPart.ProductPartId == 33 && designOption.InternalName === "Lining")) {

                            extraPairDOHtml += optionHtml;
                        }
                        else
                            if (designOption.InternalName == "Model") {
                                if (designOption.InternalName == "1") {
                                    $("#" + modelTemplate).html(optionHtml);
                                }
                                else {
                                    shoeDOPrimaryInfoHTML += optionHtml;
                                }
                            }
                            else if (selectedAtelier == 'SHOE-B' && designOption.InternalName == "MODEL_RUNNER") {
                                continue;
                            }
                            else if (selectedAtelier == 'SHOE-B' && (designOption.InternalName == "SECOND_MATERIAL_RUNNER")) {  // AS SECONDARY MATERIAL IN RUNNER WILL BE DROPDOWN BECOZ OF BEST MATCH VALUE TO BE IN IT
                                shoeSecondaryMaterialDOInfoHTML += optionHtml;
                            }
                            else if (loadAll) {
                                if (designOption.InternalName == "Sole" ) {
                                    $("#" + soleTemplate).append(optionHtml);
                                } else {
                                    htmlStr = htmlStr + optionHtml;
                                }
                            }
                    }
                }
                //$("#ShoeDesignOptionPanel").show();
                $("#ShoeContrastTemplate").html(contrastDOHtml);
                if ($("#DDLCombinations").val() == 33 || $("#DDLCombinations").val() == 64) {
                    $("#BeltSizeAndWidthTemplate").show();
                }
                $("#BeltSizeAndWidthTemplate").html(htmlBeltSizeWidth);
                $("#LiningTemplate").html(lininingDOHtml);
                $("#ExtraLacesTemplate").html(extraPairDOHtml);
                $("#" + shoeDesignTemplate).html(shoeDOPrimaryInfoHTML);
                $("#" + shoeSecondaryMaterialTemplate).html(shoeSecondaryMaterialDOInfoHTML);

            }
        }
    }
    if (selectedAtelier == 'SHOE-B' || selectedAtelier == 'SHOES-FORMAL') {
        if (mainMaterialTrimMasterOptionControl != "") {
            AttachMainMaterialTrimMasterAutosuggest(mainMaterialTrimMasterOptionControl, mainMaterialTrimMasterAutosuggestUrl);
            AttachOnFocusForMainMaterialTrimMasterTextbox(mainMaterialTrimMasterOptionControl);
        }
     
    }
    return htmlStr;
}

var AddDesignOptionHtmlIntoPartDiv = function (partHtml, partId, initialPartId) {
    var divPart = initialPartId + partId;

    $("#" + divPart).html(partHtml);
    RefreshSelectPicker($("#" + divPart));
}

var FitOptionRow = function (option, productPartId, categoryId, isCallFromOnSppChange = false) {
    var extraCssClass = "";
    var control = "";
    var extraLabelControl = "";
    var selectedAtelier = GetSelectedAtelierIdentity();
    switch (option.ValueType) {
        case 1:
            control = FillDesignOptionValue(option, productPartId, categoryId, isCallFromOnSppChange);
            break;
        case 2:
            
            control = FillDesignOptionTextBox(option, productPartId, categoryId);
            control = control + GetHiddenField(hdOptionValueId + option.ID, option.DefaultValueID);
            if (selectedAtelier == 'SHOE-B' || selectedAtelier == 'SHOES-FORMAL') {
                extraLabelControl = GetDropDownForShoeBMonogram(option, productPartId, categoryId);              
            }
            else
                extraLabelControl = '<label class="form-label-bold" style="display:inline-block; width:25%; float:left;"><I>Made in Italy for</I></label>';
            break;
        default:
    }
    BindLazyLoadForInfoImages();
    var divCategory = divOptionCategoryId + productPartId + "_" + categoryId + "_" + option.ID;

    var optionSequence = GetHiddenField(hdOptionSequence + option.ID, option.Sequence);
    var opotionControlType = GetHiddenField(hdOptionControlType + option.ID, option.ValueType);
    var optionRequired = GetHiddenField(hdOptionRequired + option.ID, (option.Required ? 1 : 0));
    var optionList = GetHiddenField(hdOptionlist + option.ID, option.DesignOptionList);
    var optionInternalName = GetHiddenField(hdOptionInternalName + option.ID, option.InternalName);

    var hideShowMonogramHiddenDovId = GetHiddenField("HDShoeMonogramDovId_" + productPartId + "_" + categoryId, option.ID);
    control = control + optionSequence + opotionControlType + optionRequired + optionList + optionInternalName;;

    var hideDesignOptionCss = '';
    if (option.InternalName === "Laces-SNEA") {
        var selectedModelValue = $("select[data-internalname='Model']").val();
        if (selectedModelValue != undefined && selectedModelValue != -1 && (selectedModelValue != 18619 && selectedModelValue != 18618)) {
            extraCssClass = "none";
        }
    }
    var designOptionImagePopUp = "";

    if (option.IsImageAvailbleForPL) {


        var designOption = option.ID;
        var designOptionModalId = "divImageModal_" + designOption;
        var imageRefIdLeft = "doImageCarousell_" + designOption;

        designOptionImagePopUp = '<div class="col-xs-1 col-sm-1 col-md-1 col-lg-1 videoPanel paddingLeft0"><a class="fa fa-info-circle iconPanelAnchor unsetRegativeMargin iconAlignment" id="fitToolVideo_' + designOption + '" href="#' + designOptionModalId + '" data-toggle="modal"></a></div>' +
            '<div id="' + designOptionModalId + '" class="modal fade fitToolImageModal" role="dialog">' +
            '<div class="modal-dialog fitToolImageViewer">' +
            '<div class="modal-content">' +
            '<div class="modal-body">' +
            '<span id="modalZoomInOut_' + designOption + '" class="fullViewIcon fa fa-arrows-alt hideZoomInIcon" onclick="OnFullViewClick(' + designOption + ')"></span>' +
            '<span class="spnClose" onclick="OnClickCloseModal(this)">&times;</span>' +
            '<div id="' + imageRefIdLeft + '" data-id ="' + designOption + '" class="divDenimSlider carousel slide" data-ride="carousel">' +
            '<div class="carousel-inner">';
        var countForImage = 0;
        $.each(option.ImagePath, function (index, imagePath) {

            var imageDiv = "";
            if (countForImage == 0) {
                imageDiv = '<div class="item active"><img class="lazy" data-src="' + imagePath + '" alt="" style="width:100%; height:auto"/></div>';
            }
            else {
                imageDiv = '<div class="item"><img class="lazy" data-src="' + imagePath + '" alt="" style="width:100%; height:auto"/></div>';
            }
            countForImage = countForImage + 1;
            designOptionImagePopUp = designOptionImagePopUp + imageDiv;
        });

        if (option.ImagePath.length > 1) {
            designOptionImagePopUp = designOptionImagePopUp
                + '<a class="carousel-control-left arrowPostions" href="#' + imageRefIdLeft + '" role="button" data-slide="prev">'
                + '<div> <span class="fa fa-chevron-left"></span> </div>'
                + ' </a>'
                + '<a class="carousel-control-right arrowRightPos" href="#' + imageRefIdLeft + '" role="button" data-slide="next">'
                + '<div><span class="fa fa-chevron-right"></span ></div >'
                + '</a>'
                + '<ol class="carousel-indicators">';
            var countForSlider = 0;
            $.each(option.ImagePath, function (index, image) {

                designOptionImagePopUp = designOptionImagePopUp
                    + ' <li class="imgCount" data-target="#' + imageRefIdLeft + '"   data-slide-to="' + countForSlider + '"></li>';
                countForSlider = countForSlider + 1;
            });
            designOptionImagePopUp = designOptionImagePopUp + '</ol>';
        }


        designOptionImagePopUp = designOptionImagePopUp +
            ' </div>' +
            '</div>' +
            '</div>' +
            ' </div>' +
            '</div>' +
            ' </div>' +
            '</div>';
    } else {
        designOptionImagePopUp = '<div class="col-lg-1 col-md-1 col-sm-1 col-xs-1" > </div >';
    }

    var row = hideShowMonogramHiddenDovId + '<div class="row row-fluid">' +
        '<div class="col-xs-12 col-sm-12 col-md-12 col-lg-12 ' + hideDesignOptionCss + '" id = "' + divCategory + '">' +
        '<div class="row-fluid" style="display:' + extraCssClass + '" >' +
        '<div class="col-xs-3 col-sm-3 col-md-1 col-lg-1">' +
        '<label class="form-label-bold">' + option.LocalizedName + '</label>' +
        '</div>' + '<div class="col-lg-1 col-md-1 col-sm-1 col-xs-1 hidden-sm hidden-md" > </div >';

    row = row +
        '<div class="col-xs-9 col-sm-8 col-md-4 col-lg-3">'+
        extraLabelControl +
        control +
        '</div>' +
        designOptionImagePopUp +
        '</div>' +
        '</div>' +
        '</div>';

    if (option.InternalName == "LEATHER_SNEAKER" || option.InternalName == "LEATHER_CITYLOAFER" || option.InternalName == "LEATHER_FR"
        || option.InternalName == "LEATHER_BELT" || option.InternalName == "LEATHER_RUNNER") {

        row = "";
        row = control;
    }
    return row;
}

var FillDesignOptionValue = function (designOption, productPartId, categoryId, isCallFromOnSppChange = false) {
    
    var isShopInspiOrder = ($('#IsShopInspiStyleOrderCreation')?.val() || '').toUpperCase() === 'TRUE';
    var defaultValueId = -1;
    var customDefaultValueId = null;
    var isShoesBMainMaterialDesignOption = false;
    var isShoesBSecondaryMaterialDesignOption = false;
    var shoeBMaterialName = "";

    if (designOption.InternalName === "LEATHER_CITYLOAFER" || designOption.InternalName === "LEATHER_SNEAKER" || designOption.InternalName === "LEATHER_FR"
        || designOption.InternalName === "LEATHER_RUNNER" || designOption.InternalName === "LEATHER_BELT") {

        isShoesBMainMaterialDesignOption = true;

        shoeBMaterialName = $('#SearchFabricName').val() == undefined ? "" : $('#SearchFabricName').val();
        // Get ShoesB fabric trim master name
        if ((IsEditOrder() || IsCopyOrder()) && shoeBMaterialName == "" && ! isCallFromOnSppChange) {
            if (designOption.MaterialDetails && designOption.MaterialDetails.Name) {
                shoeBMaterialName = designOption.MaterialDetails.Name;
            }
        }
    }

    if (designOption.InternalName == "SECOND_MATERIAL_RUNNER")
        isShoesBSecondaryMaterialDesignOption = true;

    if (IsCopyOrder()) {
        var isStyleSelected = $("#DDLStyles").val();
        if (isStyleSelected && isStyleSelected > 0) {
            defaultValueId = designOption.DefaultValueID;
        }
        else if (designOption.AllowCopy || isShopInspiOrder) {

            defaultValueId = designOption.DefaultValueID;
            if (designOption.CustomDefaultValueID != null && designOption.CustomDefaultValueID != undefined && designOption.CustomDefaultValueID.includes("_")) {
                customDefaultValueId = designOption.CustomDefaultValueID;
            }
        }
    }
    else {
        defaultValueId = designOption.DefaultValueID;
        if (designOption.CustomDefaultValueID != null && designOption.CustomDefaultValueID != undefined && designOption.CustomDefaultValueID.includes("_")) {
            customDefaultValueId = designOption.CustomDefaultValueID;
        }
    }
    var selectedAtelier = GetSelectedAtelierIdentity();
    if (designOption) {
        var optionControlId = drpOptionControlId + productPartId + "_" + categoryId + "_" + designOption.ID;
        if (designOption.InternalName === "Model") {
            var selectedDesignId = GetValueById(optionControlId);
            if (selectedDesignId > 0) {
                defaultValueId = parseInt(selectedDesignId);
            }
        }
        if (isShoesBMainMaterialDesignOption || isShoesBSecondaryMaterialDesignOption) {
            var selectedDesignId = GetValueById(optionControlId);
            if (selectedDesignId != '' && selectedDesignId != undefined) {
                customDefaultValueId = selectedDesignId;
            }
        }
        if (designOption.InternalName === "ML1L2") {
            ShowHideMonogramLine(productPartId, categoryId, defaultValueId);
            return GetDropDownForShoeDesignOptions(designOption.Values, optionControlId, defaultValueId, null, "OnMonoGramLiningChange(this)", designOption.IsBubbleImageAvailble) +
                GetHiddenField(("ED" + optionControlId), 0) +
                GetHiddenField(("RPrice" + optionControlId), 0) +
                GetHiddenField((productPartId + "_MonogramControlId"), optionControlId);
        }
        else if (designOption.InternalName === shoeTreeDOInternalName) {
            var shoeTreeAttribute = [{ "Name": "data-internalname", "Value": designOption.InternalName }];
            var dropDown = GetDropDownForShoeDesignOptions(designOption.Values, optionControlId, defaultValueId, "hidden", "OnDovChange(this)", shoeTreeAttribute, designOption.IsBubbleImageAvailble) +
                GetHiddenField(("ED" + optionControlId), 0) +
                GetHiddenField(("RPrice" + optionControlId), 0);
            var value = designOption.Values.filter(x => x.ID === defaultValueId)[0].OptionValueInternalName === shoeTreeYesInternalName;
            var id = "IsShoeTreeChosen_" + productPartId + "_" + categoryId + "_" + designOption.ID;
            return dropDown + GetToggleButton(id, value, "ChangeShoeTreeSelection(this)");
        }
        else if (designOption.InternalName === beltDOInternalName) {

            var beltAttribute = [{ "Name": "data-internalname", "Value": designOption.InternalName }];
            var dropDown = GetDropDownForShoeDesignOptions(designOption.Values, optionControlId, defaultValueId, "hidden", "OnDovChange(this)", beltAttribute, designOption.IsBubbleImageAvailble) +
                GetHiddenField(("ED" + optionControlId), 0) +
                GetHiddenField(("RPrice" + optionControlId), 0);
            var value = designOption.Values.filter(x => x.ID === defaultValueId)[0].OptionValueInternalName === beltOptionYesInternalName;



            var id = "IsBeltChosen_" + productPartId + "_" + categoryId + "_" + designOption.ID;
            return dropDown + GetToggleButton(id, value, "EnableDisableBeltOption(this)");
        }
        else if (designOption.InternalName === beltCLInternalName) {
            var beltAttribute = [{ "Name": "data-internalname", "Value": designOption.InternalName }];
            var dropDown = GetDropDownForShoeDesignOptions(designOption.Values, optionControlId, defaultValueId, "hidden", "OnDovChange(this)", beltAttribute, designOption.IsBubbleImageAvailble) +
                GetHiddenField(("ED" + optionControlId), 0) +
                GetHiddenField(("RPrice" + optionControlId), 0);
            var value = designOption.Values.filter(x => x.ID === defaultValueId)[0].OptionValueInternalName === beltOptionYesInternalNameCLoafer;



            var id = "IsBeltChosen_" + productPartId + "_" + categoryId + "_" + designOption.ID;
            return dropDown + GetToggleButton(id, value, "EnableDisableBeltOption(this)");
        }

        else {

            if (designOption.InternalName === "Laces-SNEA") {
                var selectedModelValue = $("select[data-internalname='Model']").val();

                if (selectedAtelier == 'SHOE-B') {  // boatshoe and mid-top loafer, low top, mid top - SNEAKER - SHOE B ATELIER
                    if (selectedModelValue != undefined && selectedModelValue != -1 && (selectedModelValue != 29440 && selectedModelValue != 29441 && selectedModelValue != 18619 && selectedModelValue != 18618)) {

                        var noLacesOption = $("select[data-internalname='Laces-SNEA']").find("option[data-internalname='no']");
                        defaultValueId = $(noLacesOption).val();
                    }
                }
                else {  // low top and mid top -  SHOE A ATELIER
                    if (selectedModelValue != undefined && selectedModelValue != -1 && (selectedModelValue != 18619 && selectedModelValue != 18618)) {
                        var noLacesOption = $("select[data-internalname='Laces-SNEA']").find("option[data-internalname='no']");
                        defaultValueId = $(noLacesOption).val();
                    }
                }
            }
            else if (designOption.InternalName === "ShoeBackTab" && designOption.ID == 315) {
                var selectedModelValue = $("select[data-internalname='Model']").val();
               
                if (selectedAtelier == 'SHOE-B') { // low top and mid-top - SHOE B ATELIER
                    if (selectedModelValue != undefined && selectedModelValue != -1 && (selectedModelValue != 18619 && selectedModelValue != 18618)) {
                        var noContrastBackpieceOption = $("select[data-internalname='ShoeBackTab']").find("option[data-internalname='TIT']");
                        defaultValueId = $(noContrastBackpieceOption).val();
                    }
                }
            }

            else if (designOption.InternalName === "TongueContrast" && designOption.ID == 319) {
                var selectedModelValue = $("select[data-internalname='Model']").val();
               
                if (selectedAtelier == 'SHOE-B') { // low top and mid-top - SHOE B ATELIER
                    if (selectedModelValue != undefined && selectedModelValue != -1 && (selectedModelValue != 18619 && selectedModelValue != 18618)) {
                      var noContrastTongueOption = $("select[data-internalname='TongueContrast']").find("option[data-internalname='TIT']");
                        defaultValueId = $(noContrastTongueOption).val();
                    }
                }
            }

            else if (designOption.InternalName === "Lining") {

                var selectedModelValue = (selectedAtelier == 'SHOE-B') ? $("#IsLeatherMatchGroupShoeB").val() : $("#IsLeatherMatchGroupTXFabric_1").val();

                if (selectedModelValue == undefined || selectedModelValue == "" || selectedModelValue == "null") {
                    designOption.Values = designOption.Values.filter(function (obj) {
                        return obj.OptionValueInternalName !== "BMW-Leather";
                    });
                }
            } // Sole best match only for shoesB Runner
            else if (selectedAtelier == 'SHOE-B' && (designOption.InternalName === "Sole" || designOption.InternalName === "SECOND_MATERIAL_RUNNER")) {
                var selectedModelValue = $("#IsLeatherMatchGroupShoeB").val();

                if (selectedModelValue == undefined || selectedModelValue == "" || selectedModelValue == "null") {
                    designOption.Values = designOption.Values.filter(function (obj) {
                        return obj.OptionValueInternalName !== "BMW-Leather";
                    });
                }
            }
            var drpAttribute = [{ "Name": "data-internalname", "Value": designOption.InternalName }];

            if (customDefaultValueId != null && customDefaultValueId != undefined && customDefaultValueId.includes("_")) {

                if (isShoesBMainMaterialDesignOption && !isShoesBSecondaryMaterialDesignOption) {

                    var selectedValueId = customDefaultValueId.split('_')[1];

                    var dovValue = designOption.Values.find(t => t.TrimMasterID == selectedValueId);
                    var dovExtraDays = dovValue != undefined ? dovValue.ExtraDays : 0;
                    var rPrice = dovValue != undefined ? dovValue.RPrice : 0;
                    return FillAutoSuggestTextRowUpdated(optionControlId, shoeBMaterialName) +
                        GetHiddenField((optionControlId), customDefaultValueId) +
                        GetHiddenField(("ED" + optionControlId), dovExtraDays) +
                        GetHiddenField(("RPrice" + optionControlId), 0) +
                        GetHiddenField(("RPrice" + textboxFabric + "1"), rPrice);
                }
                else {
                    return GetDropDownForShoeDesignOptions(designOption.Values, optionControlId, customDefaultValueId, null, "OnDovChange(this)", drpAttribute, designOption.IsBubbleImageAvailble) +
                        GetHiddenField(("ED" + optionControlId), 0) +
                        GetHiddenField(("RPrice" + optionControlId), 0);
                }
            }
            else {
                if (isShoesBMainMaterialDesignOption && !isShoesBSecondaryMaterialDesignOption) {
                    return FillAutoSuggestTextRowUpdated(optionControlId, shoeBMaterialName) +   // defaultValueID need to change with fabric name
                        GetHiddenField((optionControlId), defaultValueId) +
                        GetHiddenField(("ED" + optionControlId), 0) +
                        GetHiddenField(("RPrice" + optionControlId), 0) +
                        GetHiddenField(("RPrice" + textboxFabric + "1"), 0);
                }
                else {
                    return GetDropDownForShoeDesignOptions(designOption.Values, optionControlId, defaultValueId, null, "OnDovChange(this)", drpAttribute, designOption.IsBubbleImageAvailble) +
                        GetHiddenField(("ED" + optionControlId), 0) +
                        GetHiddenField(("RPrice" + optionControlId), 0);
                }
            }
        }

    }
}

var FillDesignOptionTextBox = function (designOption, productPartId, categoryId) {
    var defaultValueText = "";
    var selectedAtelier = GetSelectedAtelierIdentity();
    if (IsCopyOrder()) {
        if (designOption.AllowCopy) {
            defaultValueText = designOption.DefaultValueText;
        }
    }
    else {
        defaultValueText = designOption.DefaultValueText;
    }
    if (designOption) {
        var optionControlId = txtMonogramControlId + productPartId + "_" + categoryId + "_" + designOption.ID;
        var defaultMonogramText = designOption.MonogramTypeTexts["1"];
        var defaultMonogramTextFor = designOption.MonogramTypeTexts["2"];
        var nameOrInitialsMonogramText = designOption.MonogramTypeTexts["3"];
        var style;

        if (selectedAtelier === 'SHOE-B' || selectedAtelier === 'SHOES-FORMAL') {           
            
            var defaultValue = 1;
            if (IsCopyOrder() || IsEditOrder()) {
                defaultValue = designOption.SelectedMonogramType == 0 ? 1 : designOption.SelectedMonogramType;
                if (designOption.SelectedMonogramType != 2 && !defaultMonogramText && defaultMonogramTextFor && !nameOrInitialsMonogramText) {
                    defaultValue = 2; //default value for AM shops is custom monogram.
                }
            }
            else if (!defaultMonogramText) {
                defaultValue = 2;
            }
            if (defaultValue == 1) {
                defaultValueText = defaultMonogramText;
            }

            style = defaultValue == 1
                ? "display:none; width:100%"
                : "display:inline-block; width:100%";
           
        }
        else {
            style = "display:inline-block; width:75%";
        }
        return GetMonoGramTextBox(designOption.Values, optionControlId, defaultValueText, null, `style='${style}'`);
    }
}

var ClearShoeDesignTemplate = function () {
    $("#" + shoeDesignTemplate).html("");
    $("#" + shoeSecondaryMaterialTemplate).html("");
}

var ClearMaterialAutoSuggestTemplate = function () {
    $("#leatherTextField").html("");
    $("#" + mainMaterialAutoSuggestDiv).hide();
    $("#SearchFabricName").val('');
}

var ClearDesignOption = function () {
    ShowHideDesignOptionPanel(false);
    AddHtmlToDesignOption(" ");
    ClearDesignOptionMonogram();
    $("#" + soleTemplate).html("");
    $("#" + modelTemplate).html("");
}

//MonoGram
var RenderMonoGramTemplate = function (data) {

    var row = InitializeProductPartDiv(data, divMonogramProductPart, true);

    if (row) {
        AddHtmlToDesignOptionMonogram(row);
    }
}

var FillMonoGramData = function (data) {
    var productPartDovs = data.ProductPartDov;

    var designOptionMonogramHtml = '';

    for (var i = 0; i < productPartDovs.length; i++) {
        if (productPartDovs[i].IsMonogramVisible) {
            var productPart = productPartDovs[i].PerPartDesignOption.ProductPart;

            AddHtmlMonoGram(productPartDovs[i], "");

            var optionalCategories = productPartDovs[i].PerPartDesignOption.Categories;
            for (var categoryIndex = 0; categoryIndex < optionalCategories.length; categoryIndex++) {
                var optionCategory = optionalCategories[categoryIndex];
                if (optionCategory) {
                    if (optionCategory.IsOptional) {
                        var optionControlId = chkMonoGramOption + productPart.ProductPartId + "_" + optionCategory.ID;
                        var isMonogramOptionId = hdIsMonogramOptionYesNo + productPart.ProductPartId + "_" + optionCategory.ID;
                        var isMonogramChecked = $("#" + isMonogramOptionId).val() === "true";
                        EnableDisableDovControl(optionControlId, isMonogramChecked);
                    }
                }
                BindLazyLoadForInfoImages();
            }
        }
    }
}

var AddHtmlMonoGram = function (data) {
    var categories = data.PerPartDesignOption.Categories;
    var productPart = data.PerPartDesignOption.ProductPart;

    for (var i = 0; i < categories.length; i++) {
        var optionCategory = categories[i];
        if (optionCategory) {
            if (optionCategory.IsOptional) {
                if (optionCategory.IsVisible) {

                    var htmlStr = '<div class="row row-fluid">' +
                        '<div class="col-xs-12 col-sm-12 col-md-12 col-lg-12">' +
                        '</div>' +
                        '</div>';
                    htmlStr = htmlStr + GetHiddenField((hdIsOptional + optionCategory.ID), optionCategory.IsOptional);

                    htmlStr = htmlStr + GetHiddenField(hdCategorySequence + optionCategory.ID, optionCategory.Sequence);

                    var optionControlId = chkMonoGramOption + productPart.ProductPartId + "_" + optionCategory.ID;
                    var isMonogramOptionId = hdIsMonogramOptionYesNo + productPart.ProductPartId + "_" + optionCategory.ID;
                    htmlStr = htmlStr +
                        AddMonogramToggleButton(optionCategory,
                            optionControlId,
                            isMonogramOptionId,
                            "EnableDisableMonogramOption(this)");

                    for (var j = 0; j < optionCategory.DesignOptions.length; j++) {
                        var designOption = optionCategory.DesignOptions[j];
                        if (designOption.Visible) {
                            htmlStr = htmlStr + FitOptionRow(designOption, productPart.ProductPartId, optionCategory.ID);
                        }
                    }
                    //htmlStr = htmlStr + GetBlankRow();
                    if (optionCategory.DesignOptions.length > 0) {
                        var monogramTextoption = optionCategory.DesignOptions[0];
                        if (monogramTextoption.InternalName === "ShoeMonogramText") {
                            $("#ShoeMonogramTemplate").append(htmlStr);
                        }
                        if (monogramTextoption.InternalName === "BeltMonogramText") {
                            if ($("#DDLCombinations").val() == 33 || $("#DDLCombinations").val() == 64) {
                                $("#BeltMonogramTemplate").css("pointer-events", "auto");
                            }
                            $("#BeltMonogramTemplate").append(htmlStr);
                        }
                    }

                }
            }
        }
    }
}

var AddMonogramToggleButton = function (category, controlId, hdisMonogramOptionId, callBack) {
    var row = '<div class="row row-fluid">' +
        '<div class="col-xs-12 col-sm-12 col-md-12 col-lg-12">' + '<div class="row-fluid">' +
        '<div class="col-xs-3 col-sm-3 col-md-1 col-lg-1">' +
        GetLabel(controlId, category.Name, "form-label-bold") +
        '</div>' + '<div class="col-lg-1 col-md-1 col-sm-1 col-xs-1 hidden-sm hidden-md" > </div >'+
        
        '<div class="col-xs-6 col-sm-6 col-md-6 col-lg-8">' +
        GetToggleButton(controlId, (category.UserChooseToProviceOptionValue && (category.DesignOptions[0].DefaultValueText != "")), callBack) +
        GetHiddenField(hdisMonogramOptionId, ((category.UserChooseToProviceOptionValue && (category.DesignOptions[0].DefaultValueText != "")))) +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>';
    return row;
}

var CategoryHeader = function (category) {
    var row = '<div class="row row-fluid">' +
        '<div class="col-xs-12 col-sm-12 col-md-12 col-lg-12">' +
        '<div class="row-fluid">' +
        '<div class="col-xs-6 col-sm-6 col-md-6 col-lg-4">' +
        '<label class="form-label-bold">' + option.LocalizedName + '</label>' +
        '</div>' +
        '<div class="col-xs-6 col-sm-6 col-md-6 col-lg-8">' +
        '<div class="col-lg-1 col-md-1 col-sm-1 col-xs-1" > </div >' +
        control +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>';

    return row;
}

var ClearDesignOptionMonogram = function () {
    AddHtmlToDesignOptionMonogram("");
}

var ShowHideDesignOptionPanel = function (isShow) {
    if (isShow) {
        $("#" + designOptionPanel).show();

    } else {
        $("#" + designOptionPanel).hide();

    }
}

var AddHtmlToDesignOption = function (designOptionhtml) {
    $("#" + designOptiontemplate).html(designOptionhtml);

    RefreshSelectPicker($("#" + designOptiontemplate));
}

var AddHtmlToDesignOptionMonogram = function (designOptionhtml) {
    $("#" + shoeMonogramtemplate).html(designOptionhtml);
    $("#" + beltMonogramtemplate).html(designOptionhtml);

    RefreshSelectPicker($("#" + shoeMonogramtemplate));
    RefreshSelectPicker($("#" + beltMonogramtemplate));
}

//Fill data
var FillDesignOptionTemplatePerPart = function (data) {

    if (data) {
        FillDesignOptiondata(data, true);
        FillMonoGramData(data);
    }
}

//Clear div
var ClearDesignOptionPerPart = function (productPartId) {
    if (productPartId) {
        $("#" + divDesignOptionProPart + productPartId).html(" ");
        $("#" + divMonogramProductPart + productPartId).html(" ");
    } else {
        $("#" + designOptiontemplate).find('div[id^="' + divDesignOptionProPart + '"]').each(function (index) {
            SetValueById(this.id, " ");
        });
        $("#" + designOpitonMonogramtemplate).find('div[id^="' + divMonogramProductPart + '"]').each(function (index) {
            SetValueById(this.id, " ");
        });
        ShowHideDesignOptionPanel(false);
        ShowHideDesignOptionPanelMonogram(false);
    }
}

function ShowHideMonogramLine(partId, categoryId, value) {
    var divId = divOptionCategoryId + partId + "_" + categoryId + "_" + 240;
    var monogramText = $("#" + txtMonogramControlId + partId + "_" + categoryId + "_" + 240);

    switch (value) {
        case "16728":
            $("#" + divId).css("display", "none");
            monogramText.removeAttr("data-required");
            monogramText.val(" ");
            break;
        default:
            $("#" + divId).show();
            monogramText.attr("data-required", "1");
            break;;
    }
}

function GetDropDownForShoeDesignOptions(data, controlId, selectedValue, cssClass, onchangeEvent, attribute, isBubbleImageAvailable) {
    var css = "form-control selectpicker imgDesignOptionImgSelect "+" "+ cssClass;

    var attrubuteStr = null;
    if (attribute) {
        attrubuteStr = ResolveAttributeValue(attribute);
    }

    var items = "";
    $.each(data, function (i, item) {

        var imgTemplate = "";
        var selectedOptTemplate = "";
        selectedOptTemplate = "<span class= paddingLeft10 spnExpertOptionColour >" + item.Name + "</span>";
        imgTemplate = "<img class='imgDesignOptionColour lazy' data-src='" + item.ImagePath + "'/> <span class='paddingLeft10 spnExpertOptionColour '>" + item.Name + "</span>";

        if (isBubbleImageAvailable &&  item.ImagePath && item.ImagePath != undefined && item.ImagePath.trim() != "") {
            if (item.ID === selectedValue) {
                items += '<option selected = "selected" value="' + item.CustomID + '" data-extradays= "' + item.ExtraDays + '" data-rprice= "' +
                    item.RPrice + '" data-internalname= "' + item.OptionValueInternalName + '" data-content="' + imgTemplate + '" title="' + selectedOptTemplate + '" >' + item.Name +
                    '</option>';
            }
            else if (item.CustomID === selectedValue)
            {
                items += '<option selected = "selected" value="' + item.CustomID + '" data-extradays= "' + item.ExtraDays + '" data-rprice= "' +
                    item.RPrice + '" data-internalname= "' + item.OptionValueInternalName + '" data-content="' + imgTemplate + '" title="' + selectedOptTemplate + '" >' + item.Name +
                    '</option>';
            }
            else {
                items += '<option value="' + item.CustomID + '" data-extradays= "' + item.ExtraDays + '"  data-rprice= "' +
                    item.RPrice + '" data-internalname= "' + item.OptionValueInternalName + '" data-content="' + imgTemplate + '" title="' + selectedOptTemplate + '">' + item.Name +
                    '</option>';
            }
        }
        else {

            if (item.ID === selectedValue) {
                items += "<option selected = 'selected' value='" + item.CustomID + "' data-extradays= '" + item.ExtraDays + "' data-rprice= '" +
                    item.RPrice + "' data-internalname= '" + item.OptionValueInternalName + "'>" + item.Name +
                    "</option>";
            }
            else if (item.CustomID == selectedValue)
            {
                items += "<option selected = 'selected' value='" + item.CustomID + "' data-extradays= '" + item.ExtraDays + "' data-rprice= '" +
                    item.RPrice + "' data-internalname= '" + item.OptionValueInternalName + "'>" + item.Name +
                    "</option>";
            }
            else {
                items += "<option value='" + item.CustomID + "' data-extradays= '" + item.ExtraDays + "' data-rprice= '" +
                    item.RPrice + "' data-internalname= '" + item.OptionValueInternalName + "'>" + item.Name +
                    "</option>";
            }
        }



    });

    var select = '<select class="' + css + '" id="' + controlId + '" name="' + controlId + '""  onChange= "' + onchangeEvent + '" ' + attrubuteStr + ' >' + items + "</select>";

    return select;
}

function EnableDisableBeltOption(element) {
    var isBeltSelected = GetIsChecked(element.id);

    var beltOptionInternalName = isBeltSelected ? beltOptionYesInternalName : beltOptionNoInternalName;

    var beltSelectElement = $(element).closest("div").find("select")[0];
    var beltOptions = $(beltSelectElement).children();
    var selectedOptionId = -1;

    if (isBeltSelected) {

        $("#BeltMonogramTemplate").css("pointer-events", "auto");

    } else {
        $("#BeltMonogramTemplate").css("pointer-events", "none");

        $("#BeltMonogramTemplate").find("input[id^='IsMonogramOption_']").each(function () {
            //$(this).prop("checked", "");

            var isBeltMonogramSelected = GetIsChecked(this.id);

            if (isBeltMonogramSelected) {
                $(this).click();
            }
        });
        RefreshSelectPicker($('.divBeltAndShoeTree'));
    }


    $.each(beltOptions, function (index, optionElement) {
        var optionInternalName = $(optionElement).data("internalname");
        if (optionInternalName === beltOptionInternalName) {
            selectedOptionId = $(optionElement).val();
            return false;
        }
    });
    $(beltSelectElement).val(selectedOptionId);
    OnDovChange(beltSelectElement);

};


function ChangeShoeTreeSelection(element) {

    var isSelected = GetIsChecked(element.id);
    var shoeTreeOptionInternalName = isSelected ? shoeTreeYesInternalName : shoeTreeNoInternalName;
    var shoeTreeSelectElement = $(element).closest("div").find("select")[0];
    var shoeTreeOptions = $(shoeTreeSelectElement).children();
    var selectedOptionId = -1;
    $.each(shoeTreeOptions, function (index, optionElement) {
        var optionInternalName = $(optionElement).data("internalname");
        if (optionInternalName === shoeTreeOptionInternalName) {
            selectedOptionId = $(optionElement).val();
            return false;
        }
    });
    $(shoeTreeSelectElement).val(selectedOptionId);
    OnDovChange(shoeTreeSelectElement);
};

function OnBeltOptionChange(beltSelectElement) {

    var selectedBeltOptionInternalName = $(beltSelectElement).find("option:selected").data("internalname");
    var prodPartDesignOptionDiv = $("#BeltSizeAndWidthTemplate");

    var disableBeltDesignOptions = selectedBeltOptionInternalName === beltOptionNoInternalName;

    var dropDowns = $(prodPartDesignOptionDiv).find("select");
    if (dropDowns.length > 0) {
        $.each(dropDowns, function (index, dropDown) {
            if ($(dropDown).data("internalname") == "ShoeTree" || $(dropDown).data("internalname") == "ShoeBackTab" || $(dropDown).data("internalname") == "TongueContrast") {
                return;
            }

            if (dropDown.id !== beltSelectElement.id) {
                var optionIdToSelectOrRemove = 0;
                var dropDownOptions = $(dropDown).find("option");
                $.each(dropDownOptions, function (optionIndex, dropDownOption) {
                    if ($(dropDownOption).data("internalname") === beltOptionNAInternalName) {
                        optionIdToSelectOrRemove = $(dropDownOption).val();
                        return false;
                    }
                });

                if (optionIdToSelectOrRemove > 0) {
                    if (disableBeltDesignOptions) {
                        $(dropDown).val(optionIdToSelectOrRemove);
                        $(dropDown).prop("disabled", true);
                        $(dropDown).find("option[value='" + optionIdToSelectOrRemove + "']").css("display", "block");
                    } else {

                        if ($(dropDown).val() == optionIdToSelectOrRemove) {
                            $(dropDown).val(-1);
                        }
                        $(dropDown).prop("disabled", false);
                        $(dropDown).find("option[value='" + optionIdToSelectOrRemove + "']").css("display", "none");
                    }
                } else {
                    $(dropDown).val(-1);
                    $(dropDown).prop("disabled", false);
                }
                OnDovChange(dropDown);
            }
        });
    }
    RefreshSelectPicker($("#designOptionPanel"));
}

var FillAutoSuggestTextRow = function (designOption, productPartId, categoryId) {

    var defaultValueId = -1;
    var customDefaultValueId = null;
    if (IsCopyOrder()) {
        var isStyleSelected = $("#DDLStyles").val();
        if (isStyleSelected && isStyleSelected > 0) {
            defaultValueId = designOption.DefaultValueID;
        }
        else if (designOption.AllowCopy) {
            defaultValueId = designOption.DefaultValueID;
            if (designOption.CustomDefaultValueID != null && designOption.CustomDefaultValueID != undefined && designOption.CustomDefaultValueID.includes("_")) {
                customDefaultValueId = designOption.CustomDefaultValueID;
            }
        }
    }
    else {
        defaultValueId = designOption.DefaultValueID;
        if (designOption.CustomDefaultValueID != null && designOption.CustomDefaultValueID != undefined && designOption.CustomDefaultValueID.includes("_")) {
            customDefaultValueId = designOption.CustomDefaultValueID;
        }
    }

    if (designOption) {
        var optionControlId = drpOptionControlId + productPartId + "_" + categoryId + "_" + designOption.ID;

        var drpAttribute = [{ "Name": "data-internalname", "Value": designOption.InternalName }];

        var textBox = '<input type="text" id="' + optionControlId + '"  name = "' + optionControlId + '" data-required="1" value="' + customDefaultValueId + '" class="form-control typeahead inputTextSize" />';

        $('#leatherTextField').html('');
        $('#leatherTextField').html(textBox);
        $('#DivMainMaterialTrimMasterAutoSuggest').show();
        
        return optionControlId;
    }
}

var FillAutoSuggestTextRowUpdated = function (optionControlId, customDefaultValueId) {

    optionControlId = "text_" + optionControlId;
    var textBox = '<input type="text" id="' + optionControlId + '"  name = "' + optionControlId + '" data-required="1" value="' + customDefaultValueId + '" class="form-control typeahead inputTextSize" />';
    return textBox;

}

function GetAutoSuggestTextBoxFor(designOption, controlId, customDefaultValueId, drpAttribute) {

    var css = "style='display: inline-block; width: 72 % '";

    var fabricRowOpen = '<div class="row row-fluid">';
    var fabricRowClose = '</div>';
    var fabricHtml = '<div class="col-xs-2 col-sm-3 col-md-1 col-lg-1">' +
        GetLabel("MainMaterialTrim", GetResourceText("SHOE_FABRIC", "Leather"), "form-label-bold") +
        '</div>' + '<div class="col-xs-3 col-sm-4 col-md-2 col-lg-1 hidden-md hidden-sm"></div>' +
        '<div class="col-xs-9 col-sm-8 col-md-6 col-lg-3">' +
        '<input type="text" id="' + controlId + '"  name = "' + controlId + '" data-required="1" value="' + customDefaultValueId + '" class="' + css + '"/>' +
        GetHiddenField(("SearchMainMaterialTrimMasterName"), designOption.Name) +
        GetHiddenField(("sp" + controlId), designOption.Name) +
        GetHiddenField(("HD" + controlId), designOption.ID) +
        GetHiddenField(("ED" + controlId), designOption.DefaultValueExtraDays) +
        GetHiddenField(("RPrice" + controlId), 0) +
        GetHiddenField(("IsLeatherMatchGroup" + controlId), 0) +
        '</div>';

    return (fabricRowOpen + fabricHtml + fabricRowClose);
}

function GetDropDownForShoeBMonogram(designOption, productPartId, categoryId) {
    var css = "form-control selectpicker imgDesignOptionImgSelect";
    
    var monogramDrpControlId = drpMonogramControlId + productPartId + "_" + categoryId + "_" + designOption.ID;
    var monogramTxtBoxControlId = txtMonogramControlId + productPartId + "_" + categoryId + "_" + designOption.ID;

    var defaultMonogramText = designOption.MonogramTypeTexts["1"];
    var customMonogramText = designOption.MonogramTypeTexts["2"];
    var nameOrInitials = designOption.MonogramTypeTexts["3"];

    var defaultValue = 1;

    if (IsCopyOrder() || IsEditOrder()) {
        defaultValue = designOption.SelectedMonogramType;
        if (defaultValue == 0 && !defaultMonogramText) {
            defaultValue = 2; //default value for AM shops is custom monogram.
        }
    }
    else if (!defaultMonogramText) {
        defaultValue = 2;
    }
    if (defaultValue <= 1)
        $("#" + monogramTxtBoxControlId).hide();
    else 
        $("#" + monogramTxtBoxControlId).show();
    
    var items = "";
    if (defaultMonogramText && defaultMonogramText.trim() !== '') {
        items += "<option value='1' " + (defaultValue == 1 ? "selected" : "") + ">" + defaultMonogramText + "</option>";
    }
    if (customMonogramText && customMonogramText.trim() !== '') {
        items += "<option value='2' " + (defaultValue == 2 ? "selected" : "") + ">" + customMonogramText + "</option>";
    }
    if (nameOrInitials && nameOrInitials.trim() !== '') {
        items += "<option value='3' " + (defaultValue == 3 ? "selected" : "") + ">" + nameOrInitials + "</option>";
    }

    var select = '<select class="' + css + '" id="' + monogramDrpControlId + '" name="' + monogramDrpControlId +
        '" onChange="OnShoeBMonogramDrpChange(this)">' + items + "</select>";
    return select;
}

function OnShoeBMonogramDrpChange(element) {
    var elementId = $(element).attr("id");
    var txtControlId = elementId.replace(/^drpMonogram_/, "txtDesignOption_");

    var selectedMonogramOption = $(element).val();

    if (selectedMonogramOption == "2" || selectedMonogramOption == "3") {
        $("#" + txtControlId).val("");
        $("#" + txtControlId).show();
    } else {
        $("#" + txtControlId).val(GetResourceText("MADE_IN_PORTUGAL", "Made in Portugal")).hide();
    }
}