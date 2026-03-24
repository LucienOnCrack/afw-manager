/*!
* This file contains functions related to "Fit And TryOn information" step
* of the order creation wizard.
*/

//Function to make Product fit and Tryon size dropdown disabled to avoid selection of tryon size and fit without selecting fit profile
function DisabledProductfitAndTryonSize(isCallFromDocReady) {
    var textboxesPfit = $("#tblFitAndTryOn").find("select[id^=ddProductFits_]");
    var textboxesTsize = $("#tblFitAndTryOn").find("select[id^=ddTryOnSizes_]");
    for (var i = 0; i < textboxesPfit.length; i++) {
        var productPartID = textboxesPfit[i].id.split('_')[1];
        var fitProfile = $("#ddFitProfiles_" + productPartID).val();
        if (fitProfile != 0 || fitProfile.trim().length == 0) {
            if ($("#ddFitAdvise_productPartID").val() == 21) {
                $(textboxesPfit[i]).attr("disabled", "disabled");
                $(textboxesTsize[i]).attr("disabled", "disabled");
            }
            InitializeDropDownWithoutSearchBoxByID(textboxesPfit[i].id);
            InitializeDropDownWithoutSearchBoxByID(textboxesTsize[i].id);
        }
        if (!isCallFromDocReady)
            FitAdviseChange($("#ddFitAdvise_" + productPartID), productPartID, isCallFromDocReady);
    }
}


//Creating a CutomerFitProfile and update hidden field value of CustomerFitProfileName
function CreateFitProfile(jSonData, eventSourceButton) {
    
    var textboxes = $("#profileNameList").find("input[id^=txtFitProfile_]");
    $(textboxes).keyup(function (e) {
        if (e.keyCode == 13) {
            $(this).trigger("enterKey");
        }
    });
    //Validation for duplicate fit profile name
    var data = JSON.stringify({ fitProfiles: jSonData });
    $.ajax(
        {
            type: "POST",
            data: data,
            url: '/CustomOrder/ValidateDuplicateFitProfile',
            contentType: 'application/json; charset=utf-8',
            success: function (result) {
                if (result != null) {
                    if (result.Status == false) {
                        ShowErrorDialog("", result.MessageHtml, null, null);
                    } else {
                        if (jSonData.length > 0) {
                            var counter = 0;
                            var fitProfileName = '';
                            var productPartID = 0;
                            var profileDivID;
                            for (counter = 0; counter < jSonData.length; counter++) {
                                fitProfileName = jSonData[counter].FitProfileName;
                                productPartID = jSonData[counter].ProductPartID;
                                profileDivID = jSonData[counter].FitProfileDIVID;
                                if (fitProfileName.length != 0) {
                                   
                                    //Validation for duplicate fit profile name
                                    $("#hdnFitProfileName_" + productPartID).val(fitProfileName);
                                    var myOptions = {
                                        0: fitProfileName
                                    };
                                    var mySelect = $('#ddFitProfiles_' + productPartID);
                                    if ($('#ddFitProfiles_' + productPartID + " option[value='0']").length > 0)
                                        $('#ddFitProfiles_' + productPartID + " option[value='0']").remove();


                                    //$.each(myOptions, function (val, text) {
                                    //    mySelect.append($('<option></option>').val(val).html(text));
                                    //});

                                    $("#ddFitProfiles_" + productPartID).val(0);
                                    if (profileDivID != undefined) {
                                        $("#txtFitProfileCreation_" + productPartID, $(eventSourceButton).closest(profileDivID)).val("");
                                        $(eventSourceButton).closest(profileDivID).dialog("close");


                                    }

                                    var ddFitProfile = "ddFitProfiles_" + productPartID;
                                    
                                    InitializeDropDownWithoutSearchBoxByID(ddFitProfile);

                                    FitProfileChange("ddFitProfiles_" + productPartID);


                                }
                            }
                        }
                    }
                }
            }
        });
}

// Function to show FitProfile initial popup for product parts for which fit profile not present  
function ShowProfilePopup() {
    var textboxes = $("#profileNameList").find("input[id^=txtFitProfile_]");
    $(textboxes).keyup(function (e) {
        if (e.keyCode == 13) {
            CloseFitMultipleProfileDialogOnEnter(textboxes[0]);
        }
    });
    $("#CreateFitProfile").dialog({
        width: 400,
        height: 200,
        title: GetResourceText("FITPROFILE_CREATEFITPROFILE", "Create Fit Profile_def"),
        modal: true,
        resizable: false,
        buttons: [{
            text: GetResourceText("OK", "Ok"),
            click: function () {
                CloseFitMultipleProfileDialogOnEnter($(this));

            }
        },
        {
            text: GetResourceText("CANCEL", "Cancel"),
            click: function () {
                try {
                    $($(this)).dialog('close');
                } catch (err) {
                }
            }
        }]
    });
}
function CloseFitMultipleProfileDialogOnEnter(element) {
    var flag = 0;
    var productPartName = null;
    var textboxes = $("#profileNameList").find("input[id^=txtFitProfile_]");
    for (var i = 0; i < textboxes.length; i++) {
        var value = $.trim($(textboxes[i]).val());
        var name = $(textboxes[i]).attr("Name");
        if (value.length == 0) {
            flag = 1;
            if (productPartName == null)
                productPartName = name;
            else {
                productPartName = productPartName + "," + name;
            }
        }
    }
    if (flag == 1) {
        alert(GetResourceText("FITPROFILE_CREATEFITPROFILE_VALIDATE_POPUP", "Please enter the fit profile name") + " " + productPartName);
    } else {
        var jSonData = new Array();
        for (var i = 0; i < textboxes.length; i++) {
            var textboxesID = $(textboxes[i]).attr("Id");
            var productPartID = textboxesID.substring(14);
            var fitProfileName = $.trim($(textboxes[i]).val());
            if (fitProfileName.length != 0) {
                jSonData.push({ FitProfileName: fitProfileName, ProductPartID: productPartID, FitProfileDIVID: undefined });
            }

            var className = $(".fitAndTryOnSelection_" + productPartID)[0].className;
            if (className.indexOf("hide") > 0) {
                $(".fitAndTryOnSelection_" + productPartID).removeClass("hide");
            }
            $("#ddFitAdvise_" + productPartID).val(1);
            LoadMunroDropDowns();
        }
        CreateFitProfile(jSonData, element);
        $(element).closest("#CreateFitProfile").dialog("close");
    }
}

//Creating a CutomerFitProfile and update hidden field value of CustomerFitProfileName 
function ShowFitProfileDialog(productPartID) {
    var txtbox = $("#txtFitProfileCreation_" + productPartID);
    $(txtbox).keyup(function (e) {


        if (e.keyCode == 13) {
            CloseFitProfileDialogOnEnter(txtbox, productPartID);
        }
    });
    var defaultProfileName = $("#HiddenFitProfileName_" + productPartID).val();
    $(txtbox).val(defaultProfileName);
    var selectedFitProfile = $("#ddFitProfiles_" + productPartID).select2('data');
    if (selectedFitProfile && selectedFitProfile.text) {
        $(txtbox).val(selectedFitProfile.text);
    }
    $("#divFitProfileCreation_" + productPartID).dialog({
        title: GetResourceText("FITPROFILE_CREATEFITPROFILE", "Create FitProfile"),
        modal: true,
        resizable: false,
        buttons: [{
            text: GetResourceText("OK", "Ok"),
            click: function () {
                CloseFitProfileDialogOnEnter($(this), productPartID);
            }
        },
        {
            text: GetResourceText("CANCEL", "Cancel"),
            click: function () {
                try {
                    $($(this)).dialog('close');
                } catch (err) {
                }
            }
        }]
    });
}

function CloseFitProfileDialogOnEnter(element, productPartID) {

    if (productPartID > 0) {
        var profileDivID = "#divFitProfileCreation_" + productPartID;
        var profileDiv = $(element).closest(profileDivID);
        var fitProfileName = $.trim($("#txtFitProfileCreation_" + productPartID, profileDiv).val());
        var name = $("#txtFitProfileCreation_" + productPartID, profileDiv).attr("Name");

        if (fitProfileName.length != 0) {
            var jSonData = new Array();
            jSonData.push({ FitProfileName: fitProfileName, ProductPartID: productPartID, FitProfileDIVID: profileDivID });
            CreateFitProfile(jSonData, element);

        } else {
            alert(GetResourceText("FITPROFILE_CREATEFITPROFILE_VALIDATE", "Please enter the fit profile name") + " " + name);
        }
    }
}

ShowShirtFitProfileWarningMsg = function (xyz) {
    var orderCopyEachComponent = $("#OrderCopyEachComponent").val();

    if (orderCopyEachComponent != null && orderCopyEachComponent.toLowerCase() === 'true') {
        return;
    }

    var productPartID = xyz.substring(xyz.indexOf('_') + 1);

    var customerFitProfileID = $(xyz).val();
    var inputData = { productPartID: productPartID, customerFitProfileID: customerFitProfileID, isCallFromFitTrySubmit: false };

    if (customerFitProfileID > 0 && productPartID == 4) {

        $.ajax(
            {
                type: "GET",
                url: '/CustomOrder/ShirtFitProfileMsg',
                data: inputData,
                success: function (data) {
                    if (data != null) {

                        if (data.ShowPopUp) {
                            ShowOKDialog("", data.Msg, null, null);

                        }
                    }
                }
            });
    }
}


//Method Call when FitProfileChange

FitProfileChange = function (xyz,tryOnsWithBss) {
    var productPartID = xyz.substring(xyz.indexOf('_') + 1);
    var customerFitProfileID = $("#" + xyz).val();
    if (!customerFitProfileID) {
        customerFitProfileID = "0";
    }
    var inputData = { productPartID: productPartID, customerFitProfileID: customerFitProfileID };
    var adviseId = $("#ddFitAdvise_" + productPartID).val();
    if (adviseId == 22) {
        customerFitProfileID = "0";
        $("#" + xyz).val("");
    }
    else if (adviseId == 1) {
        UpdateResetFitToolForCreateFromTryOn(productPartID);
    } else {
        $("#hdnResetFitTools_" + productPartID).val("True");
    }
    var isTryOnNameSelected = false;
    isTryOnNameSelected = $("#fitProfileNameFromTryOn_" + productPartID).val() != "";
    var tryOnsWithBssArray;
    if (tryOnsWithBss != undefined) {
        if (tryOnsWithBss.indexOf(',') !== -1) {
            tryOnsWithBssArray = tryOnsWithBss.split(',');
        } else {
            tryOnsWithBssArray = tryOnsWithBss;
        }
    }
    
    if(productPartID == 31)
        $('#divInformalJacketFmChangeMsg').hide();
    
    if ($('#hdnInformalJacketFmChangeMsg') && $('#hdnInformalJacketFmChangeMsg').val() != undefined) {
        if ($.inArray(customerFitProfileID, $('#hdnInformalJacketFmChangeMsg').val().split(',')) !== -1) {
            $('#divInformalJacketFmChangeMsg').show();
        }
    }


    if (customerFitProfileID > 0) {
        $.ajax(
            {
                type: "GET",
                url: '/CustomOrder/FillFitProfiles',
                data: inputData,
                success: function (data) {
                    if (data != null) {
                        var fitItems = "";
                        var tryOnItems = "";
                        fitItems = "<option value='" + data.List[0].Value + "'>" + data.List[0].Text + "</option>";
                        tryOnItems = "<option value='" + data.List[1].Value + "'>" + data.List[1].Text + "</option>";
                        $("#ddTryOnSizes_" + productPartID).html(tryOnItems);
                        $("#ddProductFits_" + productPartID).html(fitItems);
                        $("#ddTryOnSizes_" + productPartID).attr("disabled", "disabled");
                        $("#ddProductFits_" + productPartID).attr("disabled", "disabled");
                        $("#FitAndTrySection_" + productPartID).show();
                        InitializeDropDownWithoutSearchBoxByID("ddProductFits_" + productPartID);
                        InitializeDropDownWithoutSearchBoxByID("ddTryOnSizes_" + productPartID);                        
                        if (isTryOnNameSelected && (adviseId==1 || adviseId==2 )) {
                            $("#fpddContainer_" + productPartID).hide();
                            var fpddn = $("#tblFitAndTryOn").find("[aria-labelledby^='select2-ddFitProfiles_" + productPartID + "']");
                            fpddn.hide();
                        }
                      
                        if (adviseId && (adviseId == 1 || adviseId == 21)) {                            
                            $("#ddTryOnSizes_" + productPartID).show();
                            $("#ddProductFits_" + productPartID).show();
                            $(".fitAndTryOnSelection_" + productPartID).show();
                        }

                        if (adviseId && adviseId == 1) {
                            //CREATE NEW FIT PROFILE 
                            $("#ddProductFits_" + productPartID).removeAttr("disabled");
                            $("#ddTryOnSizes_" + productPartID).removeAttr("disabled");
                        }
                        if (data.ShowPopUp) {
                            ShowOKDialog("", data.Msg, null, null);

                        }
                       
                        if (tryOnsWithBssArray != undefined) {
                            if (tryOnsWithBssArray.includes(data.List[1].Value)) {
                                $("#bssWarning_" + productPartID).removeClass('hidden');
                            } else {
                                $("#bssWarning_" + productPartID).addClass('hidden');
                            }
                        }

                        if (data.DetcahableFitProfileList != null) {
                            var detachableTryOnItems = "";
                            var detachableFitItems = "";
                            var detachableFitProfiles = "";
                            if (data.DetcahableFitProfileList.IsNewFitProfile) {
                                $('select[id^= ddFitAdvise_27] option[value="1"]').attr("selected", "selected");

                                FitAdviseChange($("#ddFitAdvise_27"), 27, false);
                             
                                $("#ddTryOnSizes_27 option").each(function() {
                                    if ($(this).text() == data.DetcahableFitProfileList.List[1].Text) {
                                        $('#ddTryOnSizes_27 option:selected').removeAttr('selected');
                                        $(this).attr('selected', 'selected');
                                    }
                                });


                                $("#FitAndTrySection_27").hide();
                                $("#createNewProfileNameContainer_27").hide();
                                $(".createNewProfileNameSection_27").hide();

                            } else {
                                
                                $('select[id^= ddFitAdvise_27] option[value="21"]').attr("selected", "selected");


                                FitAdviseChange($("#ddFitAdvise_27"), 27, false);

                                
                                $("select[id^= ddFitProfiles_27] option[value='" + data.DetcahableFitProfileList.FitProfileID + "']").attr("selected", "selected");
                           
                                
                                detachableFitItems = "<option value='" + data.DetcahableFitProfileList.List[0].Value + "'>" + data.DetcahableFitProfileList.List[0].Text + "</option>";
                                detachableTryOnItems = "<option value='" + data.DetcahableFitProfileList.List[1].Value + "'>" + data.DetcahableFitProfileList.List[1].Text + "</option>";

                            
                            
                                $("#ddTryOnSizes_27").html(detachableTryOnItems);
                                $("#ddProductFits_27").html(detachableFitItems);
                                $("#ddTryOnSizes_27").attr("disabled", "disabled");
                                $("#ddProductFits_27").attr("disabled", "disabled");

                                InitializeDropDownWithoutSearchBoxByID("ddProductFits_27");
                                InitializeDropDownWithoutSearchBoxByID("ddTryOnSizes_27");     


                                var fitProfileSectionElement = $("#fitProfile_27");
                                var toBeShownFPSelection = $(fitProfileSectionElement).find("[id='fpddContainer_27']");
                                $(toBeShownFPSelection).hide();
                                $("#FitAndTrySection_27").hide();
                                $("#createNewProfileNameContainer_27").hide();
                                $(".createNewProfileNameSection_27").hide();

                            }

                        }
                    }
                }
            });
    } else {
    
        $("#ddProductFits_" + productPartID).removeAttr("disabled");
        $("#ddTryOnSizes_" + productPartID).removeAttr("disabled");
        if (adviseId == 21) {
            $(".fitAndTryOnSelection_" + productPartID).hide();
        }

        if (adviseId == 22) {
            $("#ddProductFits_" + productPartID).prop("disabled", true);
            $("#ddTryOnSizes_" + productPartID).prop("disabled", true);
        }
        var productFitId = $("#ddProductFits_" + productPartID).val();
        $.ajax(
            {
                type: "GET",
                url: '/CustomOrder/FillProductFits',
                data: inputData,
                success: function (data) {
                    if (data != null) {
                        var items = "";
                        $.each(data, function (i, item) {
                            items += "<option value='" + item.Value + "'>" + item.Text + "</option>";
                        });
                        $("#ddProductFits_" + productPartID).html(items);
                        if (productFitId > 0) {
                            $("#ddProductFits_" + productPartID).val(productFitId).change();
                            var tryOnBss = $("#TryOnSizesWithBssString").val();
                            TryonSizeChange("ddTryOnSizes_" + productPartID, tryOnBss);
                        }                            
                   

                        InitializeDropDownWithoutSearchBoxByID("ddProductFits_" + productPartID);
                        if (adviseId != 22) {
                            var tryOnSizeIDForCaotAndInformal = $("#ddTryOnSizes_" + productPartID).val();
                            $("#ddTryOnSizes_" + productPartID).html("");
                            InitializeDropDownWithoutSearchBoxByID("ddTryOnSizes_" + productPartID);
                        }
                        //$("#fpddContainer_" + productPartID).show();                        
                        if (isTryOnNameSelected && (adviseId == 1 || adviseId == 2)) {
                            $("#fpddContainer_" + productPartID).hide();
                            var fpddn = $("#tblFitAndTryOn").find("[aria-labelledby^='select2-ddFitProfiles_" + productPartID + "']");
                            fpddn.hide();
                        }

                        if (productPartID == 26) {
                            var fitDrp = $("div[id ^= tblFitAndTryOn]").find("select[id ^= ddProductFits_" + productPartID+"]");


                            jQuery.each(fitDrp,
                                function (i, element) {
                                    var elementId = $(element).attr("id");
                                    $("#" + elementId).val(30);
                                    //$('select[id^= ' + elementId + '] option[value="30"]').attr("selected", "selected");
                                    ProductFitChange(elementId, undefined, tryOnSizeIDForCaotAndInformal, 26);
                                });
                        }

                        if (productPartID == 31) {
                            var fitDrp = $("div[id ^= tblFitAndTryOn]").find("select[id ^= ddProductFits_" + productPartID+"]");


                            jQuery.each(fitDrp,
                                function (i, element) {
                                    var elementId = $(element).attr("id");
                                    $("#" + elementId).val(32);
                                    //$('select[id^= ' + elementId + '] option[value="30"]').attr("selected", "selected");
                                    ProductFitChange(elementId, undefined, tryOnSizeIDForCaotAndInformal, 31);
                                });
                        }
                    }
                }
            });
    }
    //else {

    //    $("#ddProductFits_" + productPartID).attr("disabled", "disabled");
    //    $("#ddTryOnSizes_" + productPartID).attr("disabled", "disabled");
    //    $("#ddProductFits_" + productPartID).empty();
    //    $("#ddTryOnSizes_" + productPartID).empty();
    //    InitializeDropDownWithoutSearchBoxByID("ddProductFits_" + productPartID);
    //    InitializeDropDownWithoutSearchBoxByID("ddTryOnSizes_" + productPartID);
    //    if (isTryOnNameSelected) {
    //        $("#fpddContainer_" + productPartID).hide();
    //        var fpddn = $("#tblFitAndTryOn").find("[aria-labelledby^='select2-ddFitProfiles_" + productPartID + "']");
    //        fpddn.hide();
    //    }

    //}

    var fpName = $("#hdnNewFPNameEnteredByUser_" + productPartID).val();
    RefreshRunningInformation(REQUEST_TYPE_ELEMENT, TAB_FITPROFILE, ELEMENT_TYPE_FITPROFILE, customerFitProfileID, 1,
        productPartID, customerFitProfileID === "0" ? fpName : "0", CUSTOM_ORDER);
};

//Method Call when Product Fit Change

var ProductFitChange = function (xyz, ssotryonSizeId, tryOnSizeIDForCoatAndInformal, productPartIDForCoatAndInformal) {
    var productPartID = xyz.substring(xyz.indexOf('_') + 1);
    var productFitID = $("#" + xyz).val();
    var adviseId = $("#ddFitAdvise_" + productPartID).val();
    if (adviseId != 1) {
        $("#hdnResetFitTools_" + productPartID).val("True");
    }
    var inputData = { productPartID: productPartID, productFitID: productFitID, adviseID: adviseId };
    
    var tryOnSizeId = $("#ddTryOnSizes_" + productPartID).val();
    if (!(tryOnSizeId > 0)) {
        if (tryOnSizeIDForCoatAndInformal > 0 && productPartIDForCoatAndInformal == productPartID) {
            tryOnSizeId = tryOnSizeIDForCoatAndInformal;
        }
    }
    if (ssotryonSizeId != undefined) {
        tryOnSizeId = ssotryonSizeId;
    }
    if (productFitID > 0) {
        $.ajax(
            {
                type: "GET",
                url: '/CustomOrder/FillTryOnSizes',
                data: inputData,
                success: function (data) {
                    if (data != null && data != "" && data != 'undefined') {
                        if (data.TryOnSizes != null && data.TryOnSizes != "") {

                            var items = "";
                            if (data.ShouldSetTryOnSize) {
                                $.each(data.TryOnSizes, function (i, item) {

                                    if (item.Value == data.SelectedTryOnSizeId) {
                                        items += "<option value='" + item.Value + "' selected='selected'>" + item.Text + "</option>";
                                    } else {
                                        items += "<option value='" + item.Value + "'>" + item.Text + "</option>";
                                    }
                                });
                            } else {
                                $.each(data.TryOnSizes, function (i, item) {
                                    items += "<option value='" + item.Value + "'>" + item.Text + "</option>";
                                });
                            }
                            $("#ddTryOnSizes_" + productPartID).html(items);
                                if(tryOnSizeId > 0)
                                    $("#ddTryOnSizes_" + productPartID).val(tryOnSizeId);

                            InitializeDropDownWithoutSearchBoxByID("ddTryOnSizes_" + productPartID);

                            if (productPartID == 27) {
                                var carcoatPresent = $("#tblFitAndTryOn").find(" div.fitAndTryOnSelection_26");
                                if (carcoatPresent.length > 0) {
                                    var carcoatTryOnId = $("#ddTryOnSizes_26").val();
                                    if (carcoatTryOnId != -1 && carcoatTryOnId  != null) {
                                        var carcoatTryOnText = $("#ddTryOnSizes_26").find('option:selected').html();
                                        $("#ddTryOnSizes_27 option").each(function () {
                                            if ($(this).text() == carcoatTryOnText) {

                                                $('#ddTryOnSizes_27 option:selected').removeAttr('selected');

                                                $(this).attr('selected', 'selected');
                                            }
                                        });
                                    }
                                   
                                }
                            }
                            if (ssotryonSizeId != undefined) {
                                ShowNewFPCreationSection(productPartID, false);
                                var tryOnBss = $("#TryOnSizesWithBssString").val();
                                TryonSizeChange("ddTryOnSizes_" + productPartID,tryOnBss);
                            }
                        }
                    }
                    LoadMunroDropDowns();
                }
            });
    } else {
        $("#ddTryOnSizes_" + productPartID).find("option[value!='" + -1 + "']").remove();
    }
    RefreshRunningInformation(REQUEST_TYPE_ELEMENT, TAB_FITPROFILE, ELEMENT_TYPE_FIT, productFitID, 1, productPartID, "0", CUSTOM_ORDER);




};

var TryonSizeChange = function (tryonSize, tryOnsWithBss) {
    var productPartID = tryonSize.substring(tryonSize.indexOf('_') + 1);
    var productTryOnID = $("#ddTryOnSizes_" + productPartID).val();
    var productTryOnText = $("#ddTryOnSizes_" + productPartID).find('option:selected').html();
    var adviseId = $("#ddFitAdvise_" + productPartID).val();
    if (adviseId == 1) {
        
        UpdateResetFitToolForCreateFromTryOn(productPartID);
    }
    else {
        $("#hdnResetFitTools_" + productPartID).val("True");
    }
    var oldTryOnSizeId = $("#hdnOldTryOnSizeId_" + productPartID).val();
    var tryOnSizeId = $("#ddTryOnSizes_" + productPartID).val();
    if (oldTryOnSizeId != tryOnSizeId) {
        $("#hdnOldTryOnSizeId_" + productPartID).val(tryOnSizeId);
    }
    RefreshRunningInformation(REQUEST_TYPE_ELEMENT, TAB_FITPROFILE, ELEMENT_TYPE_TRYON, productTryOnID, 1, productPartID, "0", CUSTOM_ORDER);

	if (productPartID == 26) {
		
		var detechableLinerPresent = $("#tblFitAndTryOn").find(" div.fitAndTryOnSelection_27");
		if (detechableLinerPresent.length > 0) {
        
            if ($('select#ddTryOnSizes_27 option').length > 1) {
                $("#ddTryOnSizes_27 option").each(function() {
                    if ($(this).text() == productTryOnText) {
                        $('#ddTryOnSizes_27 option:selected').removeAttr('selected');
                        $(this).attr('selected', 'selected');
                    }
                });
            } else {
                ProductFitChange('ddProductFits_27');
            }
		
			//$("# option : contains(" + productTryOnText + ")").attr("selected","selected");
		}
    }

    var tryOnsWithBssArray;
    if (tryOnsWithBss != undefined) {
        if (tryOnsWithBss.indexOf(',') !== -1) {
            tryOnsWithBssArray = tryOnsWithBss.split(',');
        } else {
            tryOnsWithBssArray = tryOnsWithBss;
        }
    }
    if (tryOnsWithBssArray != undefined) {
        if (tryOnsWithBssArray.includes(productTryOnID)) {
            $("#bssWarning_" + productPartID).removeClass('hidden');
        } else {
            $("#bssWarning_" + productPartID).addClass('hidden');
        }
    }
};

function UpdateResetFitToolForCreateFromTryOn(productPartID) {
    var oldTryOnSizeId = $("#hdnOldTryOnSizeId_" + productPartID).val();
    var tryOnSizeId = $("#ddTryOnSizes_" + productPartID).val();
    if (oldTryOnSizeId != tryOnSizeId) {
        $("#hdnResetFitTools_" + productPartID).val("True");
    } else {
        $("#hdnResetFitTools_" + productPartID).val("False");
    }
}

function submitFitAndTryOn(postData, func, param) {

    var productPartIDs = GetProductPartIDs("tblFitAndTryOn", "hdnProductPartID_");
    if (productPartIDs.length > 0) {
        var profileid = "#ddFitProfiles_" + productPartIDs[0];
        var customerFitProfileID = $(profileid).val();
        var inputData = { productPartID: productPartIDs[0], customerFitProfileID: customerFitProfileID, isCallFromFitTrySubmit: true };
        if (customerFitProfileID > 0 && productPartIDs[0] == 4) {

            $.ajax(
                {
                    type: "GET",
                    url: '/CustomOrder/ShirtFitProfileMsg',
                    data: inputData,
                    success: function (data) {
                        if (data != null) {
                            if (data.ShowPopUp) {
                                ShowConfirmationDialog("", data.Msg, function () {
                                    OnTryOnSubmit(postData, func, param);
                                }, null);

                            } else {
                                OnTryOnSubmit(postData, func, param);
                            }
                        }
                    }
                });
        } else {
            OnTryOnSubmit(postData, func, param);
        }
    }
}

function OnTryOnSubmit(postData, func, param) {
    var result = false;
    if (postData.checkValidation)
        result = ValidateFitAndTryOn();
 

    if (result === false) {
        WarningFitAndTryOn(postData, func, param);

    }
}

function PostFitAndTryOn(postData, func, param) {
    var options = {
        data: postData,
        dataType: "json",
        success: function (testdata) {
            if (testdata != null) {
                if (testdata.Status == false) {
                    ShowErrorDialog("", testdata.MessageHtml, null, null);
                }
                else {
                    func(param, testdata);
                }
            }
        }
    };
    $("#FitAndTryOnForm").ajaxForm(options);
    $("#FitAndTryOnForm").submit();
}
function GetFitMappingForNewFit(value) {
    var fitMapping = {
        "1": "38",  // Regular -> Regular (Updated)
        "6": "39",  // Slim 2.0 -> Slim2.0 (Updated)
        "3": "40",  // SuperSlim -> SuperSlim (Updated)
        "2": "41"   // Slim -> Slim (Updated)
    };
    return fitMapping[value] || value; 
}
function WarningFitAndTryOn(postData, func, param) {
   

    var isNewFitProfile = false;

    var productPartIDs = GetProductPartIDs("tblFitAndTryOn", "hdnProductPartID_");
    if (productPartIDs.length > 0) {
        var ppid = productPartIDs[0];
    }

    $("select[id^='ddFitProfiles_']").each(function (index, element) {
        var fitProfileId = $(element).val();
        if (fitProfileId == 0) {
            isNewFitProfile = true;
        }
    });

    if (!isNewFitProfile) {
        PostFitAndTryOn(postData, func, param);
    }
    else {
        
        var warnings = new Array();
        //var productPartIDs = GetProductPartIDs("tblFitAndTryOn", "hdnProductPartID_");
        if (productPartIDs !== "undefined" && productPartIDs != null && productPartIDs.length > 0) {
            var tryOnOne = 0, tryOnTwo = 0;
            var fitsFlag = false;
            var tryOnFlag = false;
            var next;
            for (var i = 0; i < productPartIDs.length; i++) {
                if (i === productPartIDs.length - 1) {
                    next = 0;
                } else {
                    next = i + 1;
                }
                var fit1 = GetFitMappingForNewFit($("#ddProductFits_" + productPartIDs[i]).val());
                var fit2 = GetFitMappingForNewFit($("#ddProductFits_" + productPartIDs[next]).val());


                if (fit1 !== fit2 && $("#ddProductFits_2").val() !== '28') { 
                    fitsFlag = true;
                    break;
                }
            }
            for (var j = 0; j < productPartIDs.length; j++) {
                if (j === productPartIDs.length - 1) {
                    next = 0;
                } else {
                    next = j + 1;
                }
                tryOnOne = $("#ddTryOnSizes_" + productPartIDs[j]).select2('data')[0] === null
                    ? 0
                    : parseInt($("#ddTryOnSizes_" + productPartIDs[j]).select2('data')[0].text);
                tryOnTwo = $("#ddTryOnSizes_" + productPartIDs[next]).select2('data')[0] === null
                    ? 0
                    : parseInt($("#ddTryOnSizes_" + productPartIDs[next]).select2('data')[0].text);
                if (Math.abs(tryOnOne - tryOnTwo) > 3) {
                    tryOnFlag = true;
                    break;
                }
            }


            if (fitsFlag && tryOnFlag) {
                warnings.push("You might want to check Fits & TryOn sizes you have selected. Are you sure these are correct? ");

            } else {
                if (fitsFlag) {
                    warnings.push("You might want to check the Fits you have selected. Are you sure these are correct? ");

                }
                if (tryOnFlag) {
                       
                    warnings.push("You might want to check the TryOn sizes you have selected. Are you sure these are correct? ");

                }
            }


            if (warnings.length > 0 && param.newStep !== 1) {
                var msgBoxData = {
                    modal: true,
                    title: "Warning",
                    width: 500,
                    resizable: false,
                    buttons: [
                        {
                            text: GetResourceText("YES", "Yes"),
                            click: function () {
                                $("#msgbx").dialog('close');
                                PostFitAndTryOn(postData, func, param);
                            },
                            class: 'btn',
                            style: ' outline: none !important; color : white;'
                        },
                        {
                            text: GetResourceText("NO", "No"),
                            click: function () {
                                $("#msgbx").dialog('close');
                            },
                            class: 'btn',
                            style: ' outline: none !important; color : white;'
                        }
                    ],
                    close: function (event, ui) {
                        try {
                            if (typeof dialogClose != 'undefined')
                                dialogClose();
                        } catch (err) {
                        }
                    }
                };

                ShowDialog("Warning", warnings, msgBoxData);
            }
            else {
                PostFitAndTryOn(postData, func, param);
            }
        } else {
            PostFitAndTryOn(postData, func, param);
        }

    }
}

function ValidateFitAndTryOn() {
    
    var result = false;
    var errors = new Array();
    var productPartIDs = GetProductPartIDs("tblFitAndTryOn", "hdnProductPartID_");
    if (productPartIDs != 'undefined' && productPartIDs != null && productPartIDs.length > 0) {
        if (productPartIDs.includes("26") && productPartIDs.includes("27")) {
            productPartIDs.splice(productPartIDs.indexOf('27'), 1);
        }
        for (var i = 0; i < productPartIDs.length; i++) {
            var advisedId = $("#ddFitAdvise_" + productPartIDs[i]).val();
            var noFitProfileIsSelected = true;
            if (advisedId == 2) {
                noFitProfileIsSelected = false;
            } else {
                if (advisedId == 21) {

                    noFitProfileIsSelected = $("#ddFitProfiles_" + productPartIDs[i]).val().trim().length == 0;
                    if (noFitProfileIsSelected || $("#ddFitProfiles_" + productPartIDs[i]).val() == -1) {
                        errors.push(
                            GetResourceText("FITPROFILE_SELECTION_VALIDATE", "Please Select FitProfile for_def") +
                            " '" +
                            $("#lbl_" + productPartIDs[i]).html() +
                            "'");
                    }
                }

                if (advisedId == 21 || advisedId == 1) {
                    if ($("#ddProductFits_" + productPartIDs[i]).val() == -1) {
                        errors.push(
                            GetResourceText("PRODUCTFIT_SELECTION_VALIDATE", "Please Select ProductFit for_def") +
                            " '" +
                            $("#lbl_" + productPartIDs[i]).html() +
                            "'");
                    }
                }

                if (advisedId == 21 || advisedId == 1) {
                    if (IsTryOnSizeNotSelected("ddTryOnSizes_" + productPartIDs[i])) {
                        errors.push(GetResourceText("TRYON_SELECTION_VALIDATE", "Please Select TryOnSize for_def") +
                            " '" +
                            $("#lbl_" + productPartIDs[i]).html() +
                            "'");
                    }
                }
                
                if (advisedId == 1 || advisedId == 22) {
                    var name = $("#fitProfileNameFromTryOn_" + productPartIDs[i]).val().trim();
                    if ( name.length <= 0) {
                        errors.push(GetResourceText("NEW_FITPROFILE_USING_ADVISOR_VALIDATE", "Please enter a New FitProfile Name for ") + " '" + $("#lbl_" + productPartIDs[i]).html() + "'");
                    }
                }
                var ssoOrdernumber = $("#fitProfileNameFromOrderNumber_" + productPartIDs[i]).val();
                if (advisedId == 22 && ssoOrdernumber == "" && ssoOrdernumber.length <= 0) {
                    errors.push("Please select copy from order number for " + $("#lbl_" + productPartIDs[i]).html());
                }


                if (productPartIDs != 'undefined' && productPartIDs != null && productPartIDs.length > 0) {
                    if (productPartIDs == "27") {

                        noFitProfileIsSelected = $("#ddFitProfiles_" + productPartIDs[i]).val().trim().length == 0;
                        if (noFitProfileIsSelected || $("#ddFitProfiles_" + productPartIDs[i]).val() == -1) {
                            errors.push(
                                GetResourceText("FITPROFILE_SELECTION_VALIDATE", "Please Select FitProfile for_def") +
                                " '" +
                                $("#lbl_" + productPartIDs[i]).html() +
                                "'");
                        }
                    }
                }
            }

            if (advisedId == 2 && productPartIDs[i] == 2) {
                var newFPForAdvisor = "";
                if ($("#createAdvisorNewName_2").val() != undefined && $("#createAdvisorNewName_2").val().trim() != "") {
                    newFPForAdvisor = $("#createAdvisorNewName_2").val().trim();
                }
                else if ($("#fitProfileNameFromTryOnForAdvisor_2").val() != undefined && $("#fitProfileNameFromTryOnForAdvisor_2").val().trim() != "") {
                    newFPForAdvisor = $("#fitProfileNameFromTryOnForAdvisor_2").val().trim();
                }

                if (newFPForAdvisor.length <= 0) {
                    errors.push(GetResourceText("NEW_FITPROFILE_USING_ADVISOR_VALIDATE", "Please enter a New FitProfile Name for ") + " '" + $("#lbl_" + productPartIDs[i]).html() + "'");
                }
            }

            if (advisedId == 2 && productPartIDs[i] == 26) {
                var newFPForAdvisor = "";
                if ($("#createAdvisorNewName_26").val() != undefined && $("#createAdvisorNewName_26").val().trim() != "") {
                    newFPForAdvisor = $("#createAdvisorNewName_26").val().trim();
                }
                else if ($("#fitProfileNameFromTryOnForAdvisor_26").val() != undefined && $("#fitProfileNameFromTryOnForAdvisor_26").val().trim() != "") {
                    newFPForAdvisor = $("#fitProfileNameFromTryOnForAdvisor_26").val().trim();
                }

                if (newFPForAdvisor.length <= 0) {
                    errors.push(GetResourceText("NEW_FITPROFILE_USING_ADVISOR_VALIDATE", "Please enter a New FitProfile Name for ") + " '" + $("#lbl_" + productPartIDs[i]).html() + "'");
                }
            }

            if (advisedId == 2 && productPartIDs[i] == 31) {
                var newFPForAdvisor = "";
                if ($("#createAdvisorNewName_31").val() != undefined && $("#createAdvisorNewName_31").val().trim() != "") {
                    newFPForAdvisor = $("#createAdvisorNewName_31").val().trim();
                }
                else if ($("#fitProfileNameFromTryOnForAdvisor_31").val() != undefined && $("#fitProfileNameFromTryOnForAdvisor_31").val().trim() != "") {
                    newFPForAdvisor = $("#fitProfileNameFromTryOnForAdvisor_31").val().trim();
                }

                if (newFPForAdvisor.length <= 0) {
                    errors.push(GetResourceText("NEW_FITPROFILE_USING_ADVISOR_VALIDATE", "Please enter a New FitProfile Name for ") + " '" + $("#lbl_" + productPartIDs[i]).html() + "'");
                }
            }
            if (advisedId == "") {
                errors.push(GetResourceText("FITPROFILE_SELECTION_VALIDATE", "Please FitProfile for ") + " '" + $("#lbl_" + productPartIDs[i]).html() + "'");
            }
        }

        if (errors.length > 0) {
            ShowErrorDialogForMessages(GetResourceText("FITANDTRYON_DIALOG_HEADER", "Fit and TryOn information_def"), errors, null, null);
            result = true;
            return result;
        }
        else {
            return result;
        }
    }
    return result;
}

function IsTryOnSizeNotSelected(tryOnSizeId) {
    var className = $("#" + tryOnSizeId).attr('class');
    if (className.indexOf('HiddenDropDownlist') > -1) {
        return false;
    }
    return $("#" + tryOnSizeId).val() == -1;
}

function GetProductPartIDs(containerID, hiddenfieldStartWith) {
  
    var productPartIDs = new Array();
    var productPartHiddenFields = $("#" + containerID).find("input[id^=" + hiddenfieldStartWith + "]");
    if (productPartHiddenFields != null || productPartHiddenFields != 'undefined' || typeof (productPartHiddenFields) != undefined) {
        for (var i = 0; i < productPartHiddenFields.length; i++) {
            var hiddenProductPartID = $(productPartHiddenFields[i]).attr("id").split("_");
            if (hiddenProductPartID != 'undefined') {
                productPartIDs[i] = hiddenProductPartID[1];
            }
        }
    }
    return productPartIDs;
}


function SubmitChestBM() {
    var txtvalue = $.parseFloat($("#TxtChestBM").val());
    if (!isNaN(txtvalue)) {
        $.ajax(
            {
                type: "GET",
                url: '/CustomOrder/GetAdvicedTryOn',
                data: { measurementValue: txtvalue, isForInches: false },
                success: function (data) {
                    if (data.Status) {
                        $("#adviceTd").show();
                        $("#AdvicedTryOn").html(data.MessageHtml);
                    } else {
                        ShowErrorDialog(GetResourceText("WARNING_MESSAGES"), data.MessageHtml, null, null);
                    }

                }
            });
    } else {
        ShowErrorDialog(GetResourceText("ERROR_MESSAGES"), GetResourceText("PLEASE_ENTER_BM_VALUE"), null, null);
    }
}

function SubmitChestBMInches() {
    var txtvalue = $.parseFloat($("#HdAdvicedTryon").val());
    if (!isNaN(txtvalue)) {
        $.ajax(
            {
                type: "GET",
                url: '/CustomOrder/GetAdvicedTryOn',
                data: { measurementValue: txtvalue, isForInches: true },
                success: function (data) {
                    if (data.Status) {
                        $("#adviceTd").show();
                        $("#AdvicedTryOn").html(data.MessageHtml);
                    } else {
                        ShowErrorDialog(GetResourceText("WARNING_MESSAGES"), data.MessageHtml, null, null);
                    }

                }
            });
    } else {
        ShowErrorDialog(GetResourceText("ERROR_MESSAGES"), GetResourceText("PLEASE_ENTER_BM_VALUE"), null, null);
    }
}

function updateDropDownValue() {
    var productpartIDs = $("input[type='hidden'][id^='hdnProductPartID_']");
    if (productpartIDs != undefined && productpartIDs.length > 0) {
        var allDropDowns = $("Select[id^=ddFitProfiles_]");
        if (allDropDowns != undefined && allDropDowns.length > 0) {
            for (var i = 0; i < productpartIDs.length; i++) {
                var productPartID = $(productpartIDs[i]).val();
                var name = $("#hdnFitProfileName_" + productPartID).val();
                if (name != undefined) {
                    //$("#ddFitProfiles_" + productPartID + " option:selected").html(name);
                    InitializeDropDownWithImageBoxByID("ddFitProfiles_" + productPartID, "fpddContainer_" + productPartID);                    
                    AssignToolTipToDropdown("fpddContainer_" + productPartID);                    
                    ShowShirtFitProfileWarningMsg("#ddFitProfiles_" + productPartID);
                    var fpName = $("#hdnNewFPNameEnteredByUser_" + productPartID).val();
                    var customerFitProfileID = $("#ddFitProfiles_" + productPartID).val();
                    RefreshRunningInformation(REQUEST_TYPE_ELEMENT, TAB_FITPROFILE, ELEMENT_TYPE_FITPROFILE, customerFitProfileID, 1,
                        productPartID, customerFitProfileID === "0" ? fpName : "0", CUSTOM_ORDER);
                }

            }
        }
    }
}




//Creating a CutomerFitProfile and update hidden field value of CustomerFitProfileName
function CreateFitProfileForAdvisor(jSonData, eventSourceButton, isCallFromAdvisor,productPartId) {
    var textboxes = $("#profileNameList").find("input[id^=txtFitProfile_]");
    $(textboxes).keyup(function (e) {
        if (e.keyCode == 13) {
            $(this).trigger("enterKey");
        }
    });
    //Validation for duplicate fit profile name
    var data = JSON.stringify({ fitProfiles: jSonData });
    $.ajax(
        {
            type: "POST",
            data: data,
            url: '/CustomOrder/ValidateDuplicateFitProfile',
            contentType: 'application/json; charset=utf-8',
            success: function (result) {
                if (result != null) {
                    if (result.Status == false) {
                        ShowErrorDialog("", result.MessageHtml, null, null);

                    } else {

                        if (isCallFromAdvisor) {
                            GetAdvisedDetails(productPartId);
                        } else {
                            FitProfileChange("ddFitProfiles_" + jSonData[0].ProductPartID);
                        }

                    }
                }
            }
        });
}
