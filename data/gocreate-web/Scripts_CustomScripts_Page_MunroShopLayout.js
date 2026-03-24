var dlgelement;
var IsShowSpinner = true;

/************************************************************************************************
INITIALIZATION RELATED METHODS
*************************************************************************************************/

function InitializeMunroShopLayoutScripts(shopLanguageISO) {
    dlgelement = $("#divSpinner");

    InitializeJSGlobalization(shopLanguageISO);
    LoadMunroDropDowns();

    //In IE the cursor does not turn back into default, therefore in IE we are disabling the wait cusrsor at all.
    //This is a known issue with blockUI. In rest all browsers things will work fine.
    if (navigator.userAgent.toUpperCase().indexOf('MSIE') >= 0) {
        $.blockUI.defaults.overlayCSS.cursor = 'default';
    }

    $('#smoothmenu1 a').each(function (index) {
        var windowLocation = window.location.href.trim().replace("#", "");
        var controllerName = $("#ControllerName").val();
        var actionName = $("#ActionName").val();
        var spliteWindowLocationdUrl = windowLocation.split(controllerName);
        var linkHref = this.href.trim().replace("#", "");
        var tokenID = $(this).attr("id");
        var splitedLinkdUrl = linkHref.split(controllerName);
        if (linkHref.toLowerCase() == (spliteWindowLocationdUrl[0] + "" + controllerName).toLowerCase()) {
            SetSelectedMenu(this, tokenID, controllerName, actionName);
        }
        //else if (tokenID == "101-105" && splitedLinkdUrl[0] + "" + controllerName == spliteWindowLocationdUrl[0] + "" + controllerName) {
        //    SetSelectedMenu(this, tokenID, controllerName, actionName);
        //} 
        else if (tokenID == "101-102-103" && controllerName.toLowerCase() == "customorder") {
            SetSelectedMenu(this, "101-102-", controllerName, actionName);
        }
        else if (tokenID == "701-702-710" && controllerName.toLowerCase() == "changepassword") {
            SetSelectedMenu(this, tokenID, controllerName, actionName);
        }
        else if (tokenID == "201-202" && controllerName.toLowerCase() == "customorderoverview") {
            SetSelectedMenu(this, tokenID, controllerName, actionName);
        }
        else if (tokenID == "101" && controllerName.toLowerCase() == "customorder") {
            SetSelectedMenu(this, tokenID, controllerName, actionName);
        }

    });

    window.OnUnload = null;
    $(window).on("unload", function (e) {
        if (window.opener) {
            window.opener.postMessage("childWindowMessage", "*");
        }

    });




}


/************************************************************************************************
CUSTOM DROP DOWN
*************************************************************************************************/
function OnCustomDropdownSelectionChange(dropDown, name, methodName) {
    var continueChange = true;
    if (methodName != null && typeof methodName != 'undefined') {
        var bracketIndex = methodName.indexOf(')');
        if (bracketIndex > 0) {
            methodName = methodName.substr(0, bracketIndex) + ",'" + $(dropDown).attr("id") + "')";
        }
        else {
            methodName = methodName + "('" + $(dropDown).attr("id") + "')";
        }
        var temp = eval(methodName);
        if (temp != null && temp != 'undefined' && temp == false)
            continueChange = temp;
    }

    if (continueChange)
        DisplayDropdownValueInTextbox($(dropDown).attr("id"));
    return continueChange;
}
function DisplayDropdownValueInTextbox(dropDownId) {
    var selectedText = $("#" + dropDownId + " option:selected").text();
    $("#" + dropDownId + "_tb").val(selectedText);

}
function customDropdownReset(customDropDown) {
    customDropDown.empty();
    ClearDropDownText(customDropDown.attr("id"));
}
function ClearDropDownText(dropDownId) {
    $("#" + dropDownId + "_tb").val("");
}

/************************************************************************************************
PAGE SIZE DROP DOWN
*************************************************************************************************/
function OnPageSizeChange(dropDown, url, updatedID) {
    var currentPageSize = $("#" + dropDown.id).val();
    $.ajax(
        {
            type: "GET",
            url: url,
            data: { pageSize: currentPageSize },
            success: function (data) {
                if (data != null) {
                    $("#" + updatedID).html(data);
                }
                else {
                }
            }
        });
}

/***********************************************************************************************************
GLOBAL AJAX HANDLERS FOR AJAX START AND STOP
************************************************************************************************************/
$(document).ajaxStart(function () {
    if (IsShowSpinner) {
        ShowSpinner();
    }
});

$(document).ajaxStop(function () {
    IsShowSpinner = true;
    HideSpinner();
});

var SessionExpiryChecked = false;

$(document).ajaxError(function (event, request, options, thrownError) {
    HideSpinner();

    if (request.status == 401 || request.status == 403 || request.status == 0) {
        //SESSION TIME OUT
        //IF SESSION IS EXPIRED SHOW THE BELOW MESSAGE ELSE RETURN.

        if (!SessionExpiryChecked) {

            SessionExpiryChecked = true;

            $.ajax({
                type: "POST",
                contentType: "application/json; charset=utf-8",
                url: "/Login/CheckIfSessionIsExpired/",
                data: {},
                success: function (data) {

                    if (data.IsSessionExpired) {

                        request.abort();

                        //LogEvent(2, "Session expired on server", "");

                        ShowSessionExpiredDialog();
                    }
                    else {
                    }
                },
                error: function (xmlHttpRequest, textStatus, errorThrown) {

                    request.abort();

                    //LogEvent(5, "Request is-" + xmlHttpRequest + ",status -" + textStatus + ", Error thrown is-" + errorThrown);

                    ShowSessionExpiredDialog();
                }
            });
        } else {

            SessionExpiryChecked = false;
        }
    }
    else if (request.status == 3000) {  //Action not suported
        request.abort();
        alert(GetResourceText("RIGHTS_NOT_SUPPORTED"));
    }
    else if (request.status == 500) {
        ShowCommonError(options);
        //LogEvent(5, "Request is-" + request + ",options is -" + options + ", Error thrown is-" + thrownError);
    }
    else if (request.status == 400) {
        /* ShowRequestValidationException();*/
        LogEvent(5, "BAD Request is-" + request + ",options is -" + options + ", Error thrown is-" + thrownError);
        var errorText = GetResourceText("BAD_REQUEST_RESPONSE_FRIENDLY_MESSAGE", "<div class=''marginBottom5''>1) We have encountered a a problem</div><div class=''marginBottom5''>2) Could you please take a moment to clear your browser''s cache and cookies?</div><div class=''marginBottom5''>3) This will help ensure that you have the most updated and smooth browsing experience.</div>");
        ShowErrorDialog("", errorText);
      
    }

    else {
        alert(request.text);
        //LogEvent(5, "Request is-" + request + ",options is -" + options + ", Error thrown is-" + thrownError);
    }
});

$(document).ajaxSuccess(function (event, XMLHttpRequest, ajaxOptions) {

    try {
        var code = XMLHttpRequest.status;
        if (code == 3000) {
            XMLHttpRequest.abort();
            alert(GetResourceText("ACTION_NOT_SUPPORTED"));
        }

        $(".sData").scrollLeft($("#hiddenScrollPositionH").val());
    } catch (ex) {
    }
});

function ShowSpinner() {
    //$("#divSpinner").removeAttr("disabled");
    $.blockUI(
        {
            message: dlgelement,
            css: { top: '45%', left: '49%', width: '30px', height: '23px', background: 'none', border: '0', opactity: '1' },//left:45%, background:white
            centerY: true,
            centerX: true,
            ignoreIfBlocked: false
        });
}

function HideSpinner() {
    //$("#divSpinner").attr("disabled",true);
    $.unblockUI();
    //$('body').css('cursor', 'auto');
}

function RedirectToLocation(locationUrl) {
    ShowSpinner();
    window.location.replace(locationUrl);
}


/***********************************************************************************************************
GLOBAL AJAX HANDLERS FOR AJAX START AND STOP
************************************************************************************************************/

function InitializeJSGlobalization(shopLanguageISO) {

    (function ($) {
        $.localize = function (key, defaultValue, culture) {
            if (Globalize && Globalize.localize)
                return Global.localize(key, defaultValue, culture);
            return defaultValue;
        };
        $.format = function (value, format, culture) {
            if (Globalize && Globalize.format)
                return Globalize.format(value, format, culture);
            return value;
        };
        $.parseInt = function (value, radix, culture) {
            if (Globalize && Globalize.parseInt)
                return Globalize.parseInt(value.toString(), radix, culture);
            return parseInt(value, radix);
        };
        $.parseFloat = function (value, culture) {
            if (Globalize && Globalize.parseFloat)
                return Globalize.parseFloat(value, culture);
            return parseFloat(value);
        };
        $.parseDate = function (value, formats, culture) {
            if (Globalize && Globalize.parseDate)
                return Globalize.parseDate(value.toString(), formats, culture);
            return parseDate(value);
        };
    }(jQuery));
    Globalize.culture(shopLanguageISO);

    $.fn.datepicker.defaults.language = Globalize.culture().language;

    var opts = {
        lines: 11, // The number of lines to draw
        length: 0, // The length of each line
        width: 11, // The line thickness
        radius: 20, // The radius of the inner circle
        corners: 1, // Corner roundness (0..1)
        rotate: 24, // The rotation offset
        color: '#000', // #rgb or #rrggbb
        speed: 1, // Rounds per second
        trail: 36, // Afterglow percentage
        shadow: true, // Whether to render a shadow
        hwaccel: false, // Whether to use hardware acceleration
        className: 'spinner', // The CSS class to assign to the spinner
        zIndex: 2e9, // The z-index (defaults to 2000000000)
        top: 'auto', // Top position relative to parent in px
        left: 'auto' // Left position relative to parent in px
    };
    //target = document.getElementById('wrapper');
    //spinner = new Spinner(opts);

    //var liCnt = $('.AutoWidthTable td').width() + 250;
    //$('.AutoWidthTable').css({ 'width': liCnt });

}


/***********************************************************************************************************
MENU RELATED METHODS
************************************************************************************************************/
function SetSelectedMenu(element, tokenID, controllerName, actionName) {
    var i = 0;
    if (tokenID != "101-102-") {
        if (tokenID == "101") {
            $("#101").addClass('menuSelected');
        } else {
            $(element).closest('li').find('a').addClass('menuSelected');
        }

    }
    if (controllerName.toLowerCase() == "shopsettings" && actionName.toLowerCase() == "fittools") {
        tokenID = "701-702-704";
        i = 1;
    }
    else if (controllerName.toLowerCase() == "shopsettings" && actionName.toLowerCase() == "designoptions") {
        tokenID = "701-702-705"; i = 1;
    }
    else if (controllerName.toLowerCase() == "shopsettings" && actionName.toLowerCase() == "customerfields") {
        tokenID = "701-702-706"; i = 1;
    }
    else if (controllerName.toLowerCase() == "shopsettings" && actionName.toLowerCase() == "bodymeasurementcalculatorsettings") {
        tokenID = "701-702-707"; i = 1;
    }
    var tokens = tokenID.split("-");
    if (i == 1) {
        $(element).closest('li').find('a').removeClass('menuSelected');
        $("#" + tokenID).addClass('menuSelected');
    }
    if (tokens.length > 0) {
        var newtoken = tokenID;
        for (var i = tokens.length; i > 0; i--) {
            newtoken = newtoken.replace(tokens[i], "");
            var temp = newtoken.substr(newtoken.length - 1);
            if (temp == "-") {
                newtoken = newtoken.slice(0, -1);
                $("#" + newtoken).addClass('menuSelected');
            }
        }
    }
}



/***********************************************************************************************************
VARIOUS DIALOG RELATED METHODS
***********************************************************************************************************/
function ShowSessionExpiredDialog() {

    $("#session-timeout-dialog").dialog({
        width: 450,
        //height: 400,
        modal: true,
        resizable: false,
        buttons: {
            Ok: function () {
                $(this).dialog("close");
                window.location = SITE_BASE_URL;
            }
        },
        close: function (event, ui) {
            window.location = SITE_BASE_URL;
        }
    });
}

function ShowCommonError(options) {
    ShowErrorDialog(GetResourceText("ERROR_HEADER"), GetResourceText("GENERAL_JS_ERROR"));
}
function ShowRequestValidationException() {
    var requestValidationMessage = GetResourceText("REQUEST_VALIDATION_EXCEPTION", "A potentially dangerous request has been encountered.");
    ShowErrorDialog(GetResourceText("ERROR_HEADER"), requestValidationMessage);
}
function ShowError() {
    ShowErrorDialog(GetResourceText("ERROR_HEADER"), GetResourceText("GENERAL_JS_ERROR"));
}
function ShowTimeOut() {
    $("#session-timeout-dialog").dialog({
        dialogClass: "TimeOut",
        width: 450,
        //height: 400,
        modal: true,
        resizable: false,
        buttons: {
            Ok: function () {
                $(this).dialog("close");
                window.location = SITE_BASE_URL;
            }
        }
    });
}



/***********************************************************************************************************
OTHER METHODS
***********************************************************************************************************/
function SessionExpire() {
    $.ajax(
        {
            type: "GET",
            url: SESSION_EXPIRE_URL
        });
}

function LogEvent(lvl, message) {
    // Default to WARN level if level is not specified. Since we
    // are not dependent upon the result of the logging, we leave
    // the data return function empty.

    if (!lvl)
        lvl = 3;

    $.ajax({
        url: "/ClientLog/Addlog",
        type: "POST",
        data: { level: lvl, msg: message },
        success: function (result) {
        }

    });
}