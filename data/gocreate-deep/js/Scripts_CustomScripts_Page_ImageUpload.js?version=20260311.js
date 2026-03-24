
/********************************************************************************
ALL THE EVENT HANDLERS
*********************************************************************************/
var MAX_NO_OF_FILE_CONTROL_FIELDS_ON_FORM = $("#MaximumImageToBeUploaded").val();

function OnAddNewEntityImageClick(groupName) {
   MAX_NO_OF_FILE_CONTROL_FIELDS_ON_FORM = $("#MaximumImageToBeUploaded").val();
    var noOfFileControlsAlreadyOnForm = GetTotalNumberOfFileControlInForm(groupName);
    if (noOfFileControlsAlreadyOnForm < MAX_NO_OF_FILE_CONTROL_FIELDS_ON_FORM) {
        var guid = GetGUID()
        var NewFileControl = GetNewFileControl(groupName, guid);
        var NewRow = GetNewRow(NewFileControl, guid);
        var containerTable = $("#ImageContainer_" + groupName);
        $(containerTable).append(NewRow);

        EnableDisableAddEntityImageButton(containerTable);
        ShowHideNoImageMessage(groupName);
    }
    else {
        alert(String.format(GetResourceText("MAX_NUMBER_OF_FILES", "Please upload a maximum of {0} file at a time"), MAX_NO_OF_FILE_CONTROL_FIELDS_ON_FORM));
    }
}


function OnDeleteNewImageButtonClick(button) {
    if (button != null) {

        var containerRow = $(button).closest("tr");
        var inputFiles = $(containerRow).find("input[type='file']");
        if (inputFiles != null && inputFiles.length > 0) {
            var inputFile = inputFiles[0];
            var selectedFile = $(inputFile).val();
            if (selectedFile != null && $.trim(selectedFile).length > 0) {
                ShowConfirmationDialog("", GetResourceText("IMAGE_DELETE_CONFIRMATION", "Do you want to delete this image?"), function () {
                    RemoveRow(button, containerRow);
                }, null, null);
            } else {
                RemoveRow(button, containerRow);
            }
        }
    }
}

function RemoveRow(button, containerRow) {
    var containerTable = $(button).closest("table");
    $(containerRow).remove();
    EnableDisableAddEntityImageButton(containerTable);
    ShowHideNoImageMessage(GetGroupNameFromContainerTable(containerTable));
}

function OnDeleteEntityImageClick(deleteButton, deleteImageURL) {
    if (deleteImageURL != null && $.trim(deleteImageURL).length > 0) {
        ShowConfirmationDialog("", GetResourceText("IMAGE_DELETE_CONFIRMATION", "Do you want to delete this image?"), function () {
            var containerRow = $(deleteButton).closest("tr");
            var entityImage = $(containerRow).find("img");
            DeleteEntityImage(entityImage, deleteImageURL);
        }, null, null);
    }
}


function OnNewFileSelected(fileControl) {
    var allowedExtensions = ['jpg', 'jpeg', 'png'];

    if (fileControl != null) {
        var selectFilePath = $(fileControl).val();
        if (selectFilePath != null && $.trim(selectFilePath).length > 0) {

            var IsValidFile = IsValidFileExtension(selectFilePath, allowedExtensions);
            if (IsValidFile == false) {
                ResetNewFileControl(fileControl);
                alert(GetInvalidFileValidationMessage(allowedExtensions));
            }
        }
    }
}


/********************************************************************************
ADD NEW ENTITY IMAGE RELATED METHODS
*********************************************************************************/

function GetNewRow(inputFile, guid) {
    var Row = document.createElement("tr");

    //First column
    var Col1 = document.createElement("td");
    Col1.appendChild(GetNewImageIcon());
    //$(Col1).text("Image");

    //Second column
    var Col2 = document.createElement("td");
    Col2.appendChild(inputFile);

    //Third column
    var Col3 = document.createElement("td");
    Col3.appendChild(GetDeleteNewImageButton());

    Row.appendChild(Col1);
    Row.appendChild(Col2);

    //Fourth Cloumn for Description
    if (MAX_NO_OF_FILE_CONTROL_FIELDS_ON_FORM > 1) {
        var Col4 = document.createElement("td");
        Col4.appendChild(GetTextboxForDescription(guid));
        Row.appendChild(Col4);
    }


    Row.appendChild(Col3);


    return Row;
}

function GetNewImageIcon() {
    //"../../Content/Images/NewImage.png"
    var result = document.createElement("img");
    //$(result).attr("src", "Content/Images/NewImage.png");
    $(result).attr("alt", "new image");
    return result;
}

function GetDeleteNewImageButton() {

    var deleteButton = document.createElement("button");
    deleteButton.setAttribute("type", "button");
    deleteButton.setAttribute("title", GetResourceText("DELETE", "Delete"));
    deleteButton.setAttribute("alt", GetResourceText("DELETE", "Delete"));
    deleteButton.setAttribute("class", "fa fa-minus");
    deleteButton.setAttribute("onClick", "OnDeleteNewImageButtonClick(this);");
    
    var div = document.createElement("div");
    div.setAttribute("class", "iconPanel");
    div.appendChild(deleteButton);
    return div;
}

function GetNewFileControl(groupID, guid) {
    
    var File = document.createElement("input");
    File.setAttribute("type", "file");
    File.setAttribute("id", "ImageUpload_" + groupID + "_" + guid);
    File.setAttribute("name", "ImageUpload_" + groupID + "_" + guid);
    File.setAttribute("onChange", "OnNewFileSelected(this);");
    return File;
}

function GetPrimaryImageButton(guid) {
    //"../../Content/Images/NewImage.png"
    var result = document.createElement("input");
    $(result).attr("type", "radio");
    $(result).attr("value", "false");
    $(result).attr("name", "PrimaryImage");
    $(result).attr("onClick", "SetValueInHiddenField(-1,this)");
    $(result).attr("id", "RAD_" + guid);
    return result;
}
function GetTextboxForDescription(guid) {
    var result = document.createElement("input");
    $(result).attr("type", "text");
    $(result).attr("value", "Face");
    $(result).attr("name", "DESC_" + guid);
    $(result).attr("id", "TEXT_" + guid);
    return result;
}

function GetTotalNumberOfFileControlInForm(groupName) {

    var result = 0;
    var containerTable = $("#ImageContainer_" + groupName);
    if (containerTable != null) {
        var containerForm = $(containerTable).closest("form");
        if (containerForm != null) {

            var fileControlFields = $(containerForm).find("input:file[id^= 'ImageUpload_" + groupName + "']");
            if (fileControlFields != null && fileControlFields.length > 0) {
                result = fileControlFields.length;
                //                for (var i = 0; i < fileControlFields.length; i++) {
                //                    if($.trim($(fileControlFields[i]).val()).length > 0)
                //                        result = result + 1;
                //                }
            }
        }
    }

    return result;
}


/********************************************************************************
DELETE ENTITY IMAGE RELATED METHODS
*********************************************************************************/

function DeleteEntityImage(entityImage, deleteEntityImageURL) {
    var entityImgID = GetEntityImageIDFromImage(entityImage);

    if (entityImgID != null) {

        $.ajax({
            type: "GET",
            url: deleteEntityImageURL,
            data: { entityImageID: entityImgID },
            success: function (data) {
                if (data != null) {
                    if (data.Status) {
                        RemoveTableRowContainingEntityImage(entityImage);
                        if (data.RefreshURL != undefined)
                            window.location.href = data.RefreshURL;
                    }
                }
            }
        });
    }
}

function RemoveTableRowContainingEntityImage(entityImage) {
    if (entityImage != null) {
        var containerRow = $(entityImage).closest("tr");
        if (containerRow != null) {
            var containerTable = $(entityImage).closest("table");
            $(containerRow).remove();
            EnableDisableAddEntityImageButton(containerTable);
            ShowHideNoImageMessage(GetGroupNameFromContainerTable(containerTable));
        }
    }
}

/********************************************************************************
ADD NEW ENTITY IMAGE RELATED METHODS
*********************************************************************************/

function IsValidFileExtension(selectedFile, allowedExtensions) {
    var result = true;

    if (selectedFile != null && $.trim(selectedFile).length > 0 && allowedExtensions != null && allowedExtensions.length > 0) {

        var ext = GetFileExtension(selectedFile);
        if (ext != null && $.trim(ext).length > 0) {
            var index = $.inArray(ext, allowedExtensions);
            if (index < 0)
                result = false;
        }
    }

    return result;
}

function GetFileExtension(fileName) {
    var result = "";
    try {
        result = fileName.split('.').pop();
    }
    catch (err)
    { result = ""; }

    result = result.toLowerCase();
    return result;
}

function ResetNewFileControl(fileControl) {

    if (fileControl != null) {

        var containerColumn = $(fileControl).closest("td");
        if (containerColumn != null) {
            $(containerColumn).html($(containerColumn).html());
        }
    }
}

function GetInvalidFileValidationMessage(allowedExtensions) {
    var result = "Please select a valid file.";

    if (allowedExtensions != null && allowedExtensions.length > 0) {

        result = result + "The allowed file extension(s) are: \n";
        for (var i = 0; i < allowedExtensions.length; i++) {
            if (i > 0)
                result = result + ", "
            result = result + allowedExtensions[i];
        }
        result = result + "."
    }
    return result;
}

/********************************************************************************
COMMON METHODS
*********************************************************************************/

function InitializeFileUploadControl(groupName) {
    var containerTable = $("#ImageContainer_" + groupName);
    if (containerTable != null) {
        EnableDisableAddEntityImageButton(containerTable);
    }
    ShowHideNoImageMessage(groupName);
    ShowUploadInDisabledMode(groupName);

    var Max = GetMaximumImageCount(groupName);
    if (Max == 1)
        $("#ImageContainerHeader_" + groupName).hide();

    AttachTooltipToEntityImages(groupName);
}

function ShowUploadInDisabledMode(groupName) {
    var displayMode = $("#DisplayMode").val();

    if (displayMode != null && $.trim(displayMode).length > 0) {
        if (displayMode == "Show") {
            $("#ImageContainerDiv_" + groupName).find("input").hide();
            $("#ImageContainerDiv_" + groupName).find("input[type='radio']").show().attr('disabled', true);

        }
        var sel = $("#ImageContainerDiv_" + groupName).find('input[id^=R_]');
        if (sel.length > 0) {
            $("#ImageContainerDiv_" + groupName).find('input[id^=R_]').attr('checked', true);
        }
    }
}

function AttachTooltipToEntityImages(groupName) {

    var containerTable = $("#ImageContainer_" + groupName);
    $(containerTable).find("img[id^='EntityImage_']").tooltip({
        delay: 0,
        showURL: false,
        bodyHandler: function () {
            return $("<img class='previewImage'/>").attr("src", this.src);
        }
    });
}

function EnableDisableAddEntityImageButton(imageContainerTable) {

    var groupName = GetGroupNameFromContainerTable(imageContainerTable);
    var maximumImageCount = GetMaximumImageCount(groupName);
    var totalImageCount = TotalEntityImage(groupName);

    if (maximumImageCount > 0) {
        if (totalImageCount >= maximumImageCount) {
            //$("#btnAddEntityImage_" + groupName).attr("disabled", "disabled");
            $("#btnAddEntityImage_" + groupName).hide();
        }
        else
            //$("#btnAddEntityImage_" + groupName).removeAttr("disabled");
            $("#btnAddEntityImage_" + groupName).show();
    }
}

function ShowHideNoImageMessage(groupName) {

    var totalImages = TotalEntityImage(groupName);
    if (totalImages != null && totalImages > 0)
        $("#NoImageContainer_" + groupName).hide();
    else
        $("#NoImageContainer_" + groupName).show();
}

function TotalEntityImage(groupName) {
    var result = 0;

    var rows = $("#ImageContainer_" + groupName).find("tr");
    if (rows != null && rows.length > 0) {
        result = rows.length - 1;
    }

    return result;
}

function GetMaximumImageCount(groupName) {
    var result = 0;

    var maxCountString = $("#MaximumEntityImage_" + groupName).val();
    if (maxCountString != null && $.trim(maxCountString).length > 0 && !isNaN(maxCountString))
        result = $.parseInt(maxCountString);

    return result;
}

function GetGroupNameFromContainerTable(imageContainerTable) {
    var result = "";
    if (imageContainerTable != null) {
        var iDString = $(imageContainerTable).attr("id");
        if (iDString != null && $.trim(iDString).length > 0) {
            var groupID = iDString.replace("ImageContainer_", "");
            if (groupID != null && $.trim(groupID).length > 0)
                result = groupID;
        }
    }
    return result;
}


function GetEntityImageIDFromImage(entityImage) {
    var result = null;

    if (entityImage != null) {

        var IDString = $(entityImage).attr("ID");
        var ID = IDString.replace("EntityImage_", "");
        if (ID != null && $.trim(ID).length > 0 && !isNaN(ID)) {
            result = $.parseInt(ID);
        }
    }
    return result;
}

function GetGUID() {
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}

function S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}



//function GetContainerTableFromDeleteButton(deleteButton) {
//    var result = null;
//    if (deleteButton != null) {
//        result = $(deleteButton).closest("table");
//    }
//    return result;
//}

//function GetContainerTableFromEntityImage(entityImage) {
//    var result = null;
//    if (entityImage != null) {
//        result = $(entityImage).closest("table");
//    }
//    return result;
//}

















