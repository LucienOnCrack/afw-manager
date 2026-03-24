
function FetchDesignOption(productPartId, subProductPartId) {

    $.ajax(
        {
            type: "GET",
            url: "/ShoeOrder/GetDesignOptions",
            data: { productPartId: productPartId, subProductPartId: subProductPartId },
            success: function (responseData) {
                ClearDesignOption();
                InitiaLizeDesignOption(responseData.Data, true);
                RefreshSelectPicker($("#ShoeDesignOptionPanel"));
                RefreshSelectPicker($(".divBeltAndShoeTree"));
                if (responseData.Data.ProductPartDov[0].MonogramMaxLength > 0) {
                    $("#monogramMaxLength").val(responseData.Data.ProductPartDov[0].MonogramMaxLength);
                }
                if (responseData.Data.ProductPartDov[0].AtelierAllowedCharacters.length) {
                    $("#atelierAllowedCharacters").val(responseData.Data.ProductPartDov[0].AtelierAllowedCharacters);
                }
                var productPartId = $("#hdnDeterministicProductPartId").val();
                $("input[id^='IsMonogramOption_"+productPartId+"_']").each(function (i, el) {
                    if (el.checked) {
                        BindMonogramTextLLengthValidation(el.id);
                    }
                });

                if (responseData.IsProcessPending) {
                    $("#btnSaveOrder").hide();
                    $("#ProcessPending").show();
                    $("#ProcessPendingNote").show();
                }

            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {

            }
        });
}


//-----------------------------------------------------------------------


var EnableDisableMonogramOption = function (element) {

    if (element.id) {
        var idArray = element.id.split("_");

        if (idArray) {

            EnableDisableDovControl(element.id, GetIsChecked(element.id));
            BindMonogramTextLLengthValidation(element.id);
        }
        BindLazyLoadForDropImagesInSelectPicker();
        BindLazyLoadForInfoImages();
        BindFitToolModalOpenFullView();
    }
}

HideShowDovControl = function (idArray, isChecked) {

    if (idArray) {

        var partId = idArray[1];
        var categoryId = idArray[2];
        //var designOptionId = idArray[3];
        if (partId && categoryId) {

            //Find textboxes and enable and disable
            var shoeDovId = $("#HDShoeMonogramDovId_" + partId + "_" + categoryId).val();
            var divTextBoxOptionId = "DIVOptionCategory_" + partId + "_" + categoryId + "_" + shoeDovId;
            if (isChecked) {
                $("#" + divTextBoxOptionId).removeClass("hide");
                $("#" + divTextBoxOptionId).addClass("show");
            } else {
                $("#" + divTextBoxOptionId).removeClass("show");
                $("#" + divTextBoxOptionId).addClass("hide");
            }
        }
    }
}

var EnableDisableDovControl = function (controlId, isChecked) {

    var idArray = controlId.split("_");
    var selectedAtelier = GetSelectedAtelierIdentity();

    if (idArray) {

        var partId = idArray[1];
        var categoryId = idArray[2];
        if (partId && categoryId) {

            var isOptionYesNo = hdIsMonogramOptionYesNo + partId + "_" + categoryId;

            SetValueById(isOptionYesNo, isChecked);

            var textBoxOptionId = txtMonogramControlId + partId + "_" + categoryId;
            var drpOptionId = drpOptionControlId + partId + "_" + categoryId;

            //var monogramDivId = divMonogramProductPart + partId;

            // Find Dropdown and enable and disable 
            $('select[id^="' + drpOptionId + '"]')
                .each(function (index, item) {
                    EnableDisableInputControl(item.id, isChecked);
                    if (!isChecked) {
                        SetValueById(item.id, -1);
                    }
                    AddRemoveValidaitonClass(item, undefined);
                });

            //Hide and Show Monogram text div
            HideShowDovControl(idArray, isChecked);

            //Find textboxes and enable and disable
            $('input[id^="' + textBoxOptionId + '"]')
                .each(function (index, item) {
                    EnableDisableInputControl(item.id, isChecked);
                    if (!isChecked) {
                        if ((selectedAtelier == 'SHOE-B' || selectedAtelier == 'SHOES-FORMAL') && ($('#' + item.id)?.val() || '').toUpperCase() == GetResourceText("MADE_IN_PORTUGAL", "Made in Portugal").toUpperCase()) {
                            SetValueById(item.id, GetResourceText("MADE_IN_PORTUGAL", "Made in Portugal"));
                        }
                        else {
                            SetValueById(item.id, "");
                        }
                    }
                    AddRemoveValidaitonClass(item, undefined);
                });
        }
    }
}

function AddRemoveValidaitonClass(element, isAddClass) {

    switch (isAddClass) {
        case true:
            $(element).removeClass("ErrorControl");
            $(element).addClass("ValidControl");
            $("button.dropdown-toggle", $(element).closest(".bootstrap-select")).removeClass("ErrorControl");
            $("button.dropdown-toggle", $(element).closest(".bootstrap-select")).addClass("ValidControl");
            $(element).closest(".bootstrap-select").removeClass("ErrorControl");
            $(element).closest(".bootstrap-select").addClass("ValidControl");
            break;
        case false:
            $(element).removeClass("ValidControl");
            $(element).addClass("ErrorControl");
            $("button.dropdown-toggle", $(element).closest(".bootstrap-select")).removeClass("ValidControl");
            $("button.dropdown-toggle", $(element).closest(".bootstrap-select")).addClass("ErrorControl");
            $(element).closest(".bootstrap-select").removeClass("ValidControl");
            $(element).closest(".bootstrap-select").addClass("ErrorControl");
            break;
        default:
            $(element).removeClass("ValidControl");
            $(element).removeClass("ErrorControl");
            $("button.dropdown-toggle", $(element).closest(".bootstrap-select")).removeClass("ValidControl");
            $("button.dropdown-toggle", $(element).closest(".bootstrap-select")).removeClass("ErrorControl");
            $(element).closest(".bootstrap-select").removeClass("ValidControl");
            $(element).closest(".bootstrap-select").removeClass("ErrorControl");
            break;
    }
}

function OnDovChange(element) {
   
    var isCurrentDOVTrim = false;
    var trimMasterID = 0;
    var selectedAtelier = GetSelectedAtelierIdentity();

    if ($(element).data("internalname") === beltDOInternalName) {
        OnBeltOptionChange(element);
    }
    else if ($(element).data("internalname") === beltCLInternalName) {
        OnBeltOptionChange(element);
    }
    var previousExtraDays = parseInt($("#ED" + element.id).val());
    var extraDays = $("#" + element.id).find(':selected').attr("data-extradays");
    SetValueById(("ED" + element.id), extraDays);

    var previousRPrice = parseFloat($("#RPrice" + element.id).val());
    var rPrice = $("#" + element.id).find(':selected').attr("data-rprice");
    SetValueById(("RPrice" + element.id), rPrice);

    var combinationID = $("#DDLCombinations").val();
    if (combinationID != "33" || combinationID != "64") {
        if ($("input[id^='IsBeltChosen_']").is(':checked') === false) {
            $("select[data-internalName='BeltPosition']").val(2903);
        } else {
            if (selectedBeltPositionBrandingOptionValue != "")
                $("select[data-internalName='BeltPosition']").val(selectedBeltPositionBrandingOptionValue);
        }
    }

    var listOfDOVID = null;
    if ($(element).val() != null && $(element).val().includes("_")) {
        listOfDOVID = $(element).val().split("_")[0];
        isCurrentDOVTrim = true;
        trimMasterID = $(element).val().split("_")[1];
    }
    else
        listOfDOVID = $(element).val();

    var selectedModelValue = listOfDOVID;
    
    var designOptionInternalName = $(element).attr('data-internalname');

    if (isCurrentDOVTrim) {
        UpdateRunningInformation(ELEMENT_TYPE_TRIM, trimMasterID, designOptionInternalName);                
    }
    else
        UpdateRunningInformation(ELEMENT_TYPE_DOV, selectedModelValue, designOptionInternalName);


    if ($(element).data("internalname") === "Model") {

        if (selectedAtelier == 'SHOE-B') {
            if (selectedModelValue != undefined &&
                selectedModelValue != -1 &&
                (selectedModelValue == 29441 || selectedModelValue == 18619 || selectedModelValue == 18618)) { // boatshoe, low top, mid top show extra pair of laces - SHOE B ATELIER
                $("select[data-internalname='Laces-SNEA']").val("");
                $("select[data-internalname='Laces-SNEA']").closest("div[class*=row]").show();
            } else {
                var noLacesOption = $("select[data-internalname='Laces-SNEA']").find("option[data-internalname='no']");
                $("select[data-internalname='Laces-SNEA']").val($(noLacesOption).val());
                $("select[data-internalname='Laces-SNEA']").closest("div[class*=row]").hide();
            }

            // CONTRAST TONGUE AND CONTRAST BACKPIECE - DESIGN OPTION -- ONLY SHOWN FOR -- SHOES-B SNEAKER - low top and mid top
            if (selectedModelValue != undefined &&
                selectedModelValue != -1 &&
                (selectedModelValue == 18619 || selectedModelValue == 18618)) {
                //CONTRAST BACKPIECE
                $("select[data-internalname='ShoeBackTab']").val("");
                $("select[data-internalname='ShoeBackTab']").closest("div[class*=row]").show();

                //CONTRAST TONGUE
                $("select[data-internalname='TongueContrast']").val("");
                $("select[data-internalname='TongueContrast']").closest("div[class*=row]").show();
            } else {
                 //CONTRAST BACKPIECE
                var noContrastBackpieceOption = $("select[data-internalname='ShoeBackTab']").find("option[data-internalname='TIT']"); // no contrast
                $("select[data-internalname='ShoeBackTab']").val($(noContrastBackpieceOption).val());
                $("select[data-internalname='ShoeBackTab']").closest("div[class*=row]").hide();

                  //CONTRAST TONGUE
                var noContrastTongueOption = $("select[data-internalname='TongueContrast']").find("option[data-internalname='TIT']");  // no contrast
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
                $("select[data-internalname='Laces-SNEA']").val("");
                $("select[data-internalname='Laces-SNEA']").closest("div[class*=row]").show();
            }
        }
    }

    if ($(element).data("internalname") === "Belt") {

        var prodPartDesignOptionDiv = $("#BeltSizeAndWidthTemplate");
        if (selectedModelValue != undefined &&
            selectedModelValue != -1 &&
            (selectedModelValue == 22657 ||
                selectedModelValue == 18489 ||
                selectedModelValue == 18520 ||
                selectedModelValue == 18553 ||
                selectedModelValue == 18601 ||
                selectedModelValue == 27117 ||
                selectedModelValue == 29410)) {

            prodPartDesignOptionDiv.hide();
        } else {

            prodPartDesignOptionDiv.show();
        }
    }

    RefreshSelectPicker($(".divPrimaryInfo"));
    RefreshSelectPicker($("#ShoeDesignOptionPanel"));
    if ($(element).is(":visible")  && $(element).val() > 0) {
        var productPartId = $("#hdnDeterministicProductPartId").val();
        PreSelectInFitProfileSection("#fitProfileTemplate", productPartId);
    }
}

function OnMainMaterialDovChange(element, fabricDOVID, controlID, dovHiddenId) {
    debugger;
    var isCurrentDOVTrim = false;
    var trimMasterID = 0;
    var designOptionID = -1;

    var listOfDOVID = null;
    if (fabricDOVID != null && fabricDOVID.includes("_")) {
        listOfDOVID = fabricDOVID.split("_")[0];
        isCurrentDOVTrim = true;
        trimMasterID = fabricDOVID.split("_")[1];
    }
    else
        listOfDOVID = fabricDOVID;

    var selectedModelValue = listOfDOVID;

    if (controlID && typeof controlID === "string") {
        var idArray = controlID.split("_");
        designOptionID = idArray[idArray.length - 1];
    }
    var internalName = $("#" + hdOptionInternalName + designOptionID).val();

    if (internalName === "LEATHER_CITYLOAFER" || internalName === "LEATHER_SNEAKER" || internalName === "LEATHER_FR"
        || internalName === "LEATHER_RUNNER" || internalName === "LEATHER_BELT") {
        OnMainMaterialTrimSelection(trimMasterID, dovHiddenId, internalName);
    }

    if (internalName != "LEATHER_BELT") {
        if (isCurrentDOVTrim) {
            UpdateRunningInformation(ELEMENT_TYPE_TRIM, trimMasterID, internalName);
        }
        else
            UpdateRunningInformation(ELEMENT_TYPE_DOV, selectedModelValue, internalName);
    }
    RefreshSelectPicker($(".divPrimaryInfo"));
    RefreshSelectPicker($("#ShoeDesignOptionPanel"));
}
function BindMonogramTextLLengthValidation(controlId) {
    var idArray = controlId.split("_");
    var selectedAtelier = GetSelectedAtelierIdentity();
    if (idArray) {
        var partId = idArray[1];
        var categoryId = idArray[2];
        if (partId && categoryId) {
            var shoeDovId = $("#HDShoeMonogramDovId_" + partId + "_" + categoryId).val();
            var divTextBoxOptionId = "txtDesignOption_" + partId + "_" + categoryId + "_" + shoeDovId;
            $("#" + divTextBoxOptionId).on('keyup', function () {
                if (selectedAtelier == 'SHOE-B' || selectedAtelier == 'SHOES-FORMAL') {
                    this.value = this.value.toUpperCase();
                }
                CalculateMonogramTextLength(divTextBoxOptionId);
            });            
        }
    }
}

function CalculateMonogramTextLength(divTextBoxOptionId)
{
    var monogramMaxLength = $("#monogramMaxLength").val();
    var monogramTextbox = $("#" + divTextBoxOptionId);
    var monogramValue = monogramTextbox.val();
    var totalLength = 0;
    var allowedText = '';
    if (monogramValue)
    {
        var characterArray = monogramValue.split('');
        for (var i = 0; i < characterArray.length; i++)
        {
            if (totalLength < monogramMaxLength)
            {
                allowedText = allowedText + characterArray[i];
                totalLength = allowedText.length;
            } else
            {
                break;
            }
        }
        monogramTextbox.val(allowedText);
    }
    InitializePopover();
}

function GetSelectedAtelierIdentity(atelierId) {
    var selectedAtelierId = -1;
    if (atelierId > 0 && atelierId != '')
        selectedAtelierId = parseInt(atelierId);
    else
        selectedAtelierId = parseInt($('#HD_AtelierId').val());
    switch (selectedAtelierId) {
        case 15:
            return 'SHOE-A'
            break;
        case 22:
            return 'SHOE-B'
            break;
        case 23:
            return 'SHOES-FORMAL'
            break;
        default:
            return '';
    }
}