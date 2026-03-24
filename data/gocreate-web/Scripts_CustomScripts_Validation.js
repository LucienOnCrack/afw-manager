/********************************************************************************************************************
CONTROL GENERAL VALIDATION
**********************************************************************************************************************/
//For Number validation (integer and decimal)
function ValidateDecimal(event, id, precision, beforeDecimalLimit) {
    var controlValue = $("#" + id).val();
    var keyCode = event.keyCode || event.charCode;
    var inputCharacter = String.fromCharCode(keyCode);
        
    if ((keyCode >= 37 && keyCode <= 40) || keyCode == 46 || keyCode == 8 || keyCode == 9 || keyCode == 16 || keyCode == 17 ||
        keyCode == 35 || keyCode == 36 || (controlValue.length == 0 && keyCode == 45)) {

        return true;
    }
    
    var decimalSeparator = ".";
    if (Globalize && Globalize.culture)
        decimalSeparator = Globalize.culture().numberFormat['.'];

    if ((keyCode < 47 || keyCode > 58) &&  inputCharacter != decimalSeparator) {
        eventPreventDefault(event);
        return false;
    }

    var tempValue = controlValue + inputCharacter;
    var valueArr = tempValue.split(decimalSeparator);
    if (inputCharacter == decimalSeparator) {
        if (valueArr.length > 2) {
            eventPreventDefault(event);
            return false;
        }
        return true;
    }
    var regex = new RegExp("^[-]?\\d+(\\" + decimalSeparator + "\\d{1," + precision + "})?$");

    if (tempValue.match(regex)) {
        return true;
    } else {
        eventPreventDefault(event);
        return false;
    }
}

function ValidateInteger(event, id) {
    if (id == null)
        id = event.target.id;
    var controlValue = $("#" + id).val();
    var keyCode = event.keyCode || event.charCode;
    var inputCharacter = String.fromCharCode(keyCode);
    if ((keyCode >= 37 && keyCode <= 40) || keyCode == 46 || keyCode == 8 || keyCode == 9 || keyCode == 16 || keyCode == 17 ||
        keyCode == 35 || keyCode == 36 || keyCode == 13 || (controlValue.length == 0 && keyCode == 45)) {
        return true;

    }
    
    if (keyCode < 47 || keyCode > 58) {
        eventPreventDefault(event);
        return false;
    }
    
    var tempValue = controlValue + inputCharacter;
    var regex = new RegExp("^[-]?\\d+$");

    if (tempValue.match(regex)) {
        return true;
    } else {
        eventPreventDefault(event);
        return false;
    }
}

function SetDecimalValidation() {
    var decimalSeparator = ".";
    if (Globalize && Globalize.culture)
        decimalSeparator = Globalize.culture().numberFormat['.'];
    var munroDecimalTextBoxs = $(document).find("input[data-munro-textbox='DecimalTextBox']");
    if (munroDecimalTextBoxs.length > 0) {
        var regex = new RegExp("^[-+]?\\d{0,6}\\" + decimalSeparator + "?\\d{0,2}$");
        $(munroDecimalTextBoxs).limitkeypress({ rexp: regex });
        
        //Added By Ameya
        $(munroDecimalTextBoxs).on('paste', function (e) {
        var clipboard = e.originalEvent.clipboardData;

        if (clipboard == undefined)
                clipboard = window.clipboardData;

            var decimalSeparatorForPaste = ".";
            decimalSeparatorForPaste = Globalize.culture().numberFormat['.'];

        var pasteData = clipboard.getData('text');
        if (pasteData.indexOf(',') !== -1) {
            $(this).val(pasteData.replace(',', decimalSeparatorForPaste));
            e.preventDefault();
            }
         else if (pasteData.indexOf('.') !== -1) {
                $(this).val(pasteData.replace('.', decimalSeparatorForPaste));
                e.preventDefault();
            }
        });
    }
}
function SetPositiveDecimalValidation() {
    var decimalSeparator = ".";
    if (Globalize && Globalize.culture)
        decimalSeparator = Globalize.culture().numberFormat['.'];
  
    var munroDecimalTextBoxs = $(document).find("input[data-munro-textbox='PositiveDecimalTextBox'],input.decimal");
    if (munroDecimalTextBoxs.length > 0) {
        var regex = new RegExp("^[+]?\\d{0,6}\\" + decimalSeparator + "?\\d{0,2}$");
        $(munroDecimalTextBoxs).limitkeypress({ rexp: regex });
        
        //Added By Ameya
        $(munroDecimalTextBoxs).on('paste', function (e) {
            var clipboard = e.originalEvent.clipboardData;

            if (clipboard == undefined)
                clipboard = window.clipboardData;

            var decimalSeparatorForPaste = ".";
            decimalSeparatorForPaste = Globalize.culture().numberFormat['.'];

            var pasteData = clipboard.getData('text');
            if (pasteData.indexOf(',') !== -1) {
                $(this).val(pasteData.replace(',', decimalSeparatorForPaste));
                e.preventDefault();
            }
            else if (pasteData.indexOf('.') !== -1) {
                $(this).val(pasteData.replace('.', decimalSeparatorForPaste));
                e.preventDefault();
            }
        });
    }
}

function SetIntegerValidation() {
    var munroIntegerTextBoxs = $(document).find("input[data-munro-textbox='IntegerTextBox']");
    if (munroIntegerTextBoxs.length > 0) {
        $(munroIntegerTextBoxs).limitkeypress({ rexp: /^[-+]?\d*$/ });

        $(munroIntegerTextBoxs).on('paste', function(e) {
            var clipboard = e.originalEvent.clipboardData;

            if (clipboard == undefined)
                clipboard = window.clipboardData;

            var pasteData = clipboard.getData('text');

            if ((pasteData.indexOf('.') !== -1) || (pasteData.indexOf(',') !== -1)) {
                $(this).val("");
                e.preventDefault();
            }
        });
    }
}

function SetPositiveIntegerValidation() {
    var munroIntegerTextBoxs = $(document).find("input[data-munro-textbox='PositiveIntegerTextBox']");
    if (munroIntegerTextBoxs.length > 0)
        $(munroIntegerTextBoxs).limitkeypress({ rexp: /^[+]?\d*$/ });
    $(munroIntegerTextBoxs).on('paste', function(e) {
        var clipboard = e.originalEvent.clipboardData;

        if (clipboard == undefined)
            clipboard = window.clipboardData;

        var pasteData = clipboard.getData('text');

        if ((pasteData.indexOf('.') !== -1) || (pasteData.indexOf(',') !== -1)) {
            $(this).val("");
            e.preventDefault();
        }
    });
}

function ValidateExcelFile(fileControl, submitButtonID) {
    var allowedExtensions = ['xlsx'];

    if (fileControl != null) {
        var fileControlID = $(fileControl).attr("Id");

        var selectFilePath = $(fileControl).val();
        if (selectFilePath != null && $.trim(selectFilePath).length > 0) {
            var IsValidFile = IsValidFileExtension(selectFilePath, allowedExtensions);
            if (IsValidFile == false) {
                ResetFileControl(fileControlID);
                ShowInvalidFileValidationMessage(invalidFileMessage, allowedExtensions);
            } else {
                $("#" + submitButtonID).click();
            }
        }
    }
}


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




function eventPreventDefault(event) {
    if (event.preventDefault)
        event.preventDefault();
    else
        event.returnValue = false;
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


function ShowInvalidFileValidationMessage(message, allowedExtensions) {
    var result = message + "\n";

    if (allowedExtensions != null && allowedExtensions.length > 0) {
        for (var i = 0; i < allowedExtensions.length; i++) {
            if (i > 0)
                result = result + ", ";
            result = result + allowedExtensions[i];
        }
        result = result + ".";
    }
    alert(result);
}
-->