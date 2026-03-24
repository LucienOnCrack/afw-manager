/*********************************************************************************************************************************
CUSTOM MESSAGE BOXES
**********************************************************************************************************************************/




/******************************************************************************************************
INFORMATION DIALOG
*******************************************************************************************************/
function ShowInformationDialog(headerText, messageText, okClick, cancelClick, dialogClose) {
    var msgBoxData = {
        modal: true,
        title: headerText,
        resizable: false,
        buttons: [
            {
                text: GetResourceText("OK", "Ok"),
                click: function () {
                    try {
                        if (typeof okClick != 'undefined')
                            okClick();
                    } catch (err) {
                    }

                    $("#msgbx").dialog('close');
                },
                class: 'btn',
                style: ' outline: none !important; color : white;'
            },
            {
                text: GetResourceText("CANCEL", "Cancel"),
                click: function () {
                    try {
                        if (typeof cancelClick != 'undefined')
                            cancelClick();
                    } catch (err) {
                    }
                    $("#msgbx").dialog('close');
                },
                class: 'btn',
                style: ' outline: none !important; color : white;'
            }],
        close: function (event, ui) {
            try {
                if (typeof dialogClose != 'undefined')
                    dialogClose();
            } catch (err) {
            }
        }
    };

    ShowDialog(headerText, messageText, msgBoxData);




}


function ShowInformationDialogWithoutCancelButton(headerText, messageText, okClick, cancelClick, dialogClose) {
    var msgBoxData = {
        modal: true,
        title: headerText,
        resizable: false,
        buttons: [
            {
                text: GetResourceText("OK", "Ok"),
                click: function () {
                    try {
                        if (typeof okClick != 'undefined')
                            okClick();
                    } catch (err) {
                    }

                    $("#msgbx").dialog('close');
                },
                class: 'btn',
                style: ' outline: none !important; color : white;'
            }],
        close: function (event, ui) {
            try {
                if (typeof dialogClose != 'undefined')
                    dialogClose();
            } catch (err) {
            }
        }
    };

    ShowDialog(headerText, messageText, msgBoxData);
}


/******************************************************************************************************
ERROR DIALOG
*******************************************************************************************************/
function ShowErrorDialog(headerText, messageText, okClick, dialogClose) {
    var msgBoxData = {
        modal: true,
        title: headerText,
        width: 500,
        resizable: false,
        buttons: [
            {
                text: GetResourceText("OK", "Ok"),
                click: function () {
                    try {
                        if (typeof okClick != 'undefined')
                            okClick();
                    } catch (err) {
                    }
                    $("#msgbx").dialog('close');
                },
                class: 'btn',
                style: ' outline: none !important; color : white;'
            }],
        close: function (event, ui) {
            try {
                if (typeof dialogClose != 'undefined')
                    dialogClose();
            } catch (err) {
            }
        }
    };

    ShowDialog(headerText, messageText, msgBoxData);
}

function ShowNonCloseableErrorDialog(headerText, messageText, okClick, dialogClose) {
    var msgBoxData = {
        modal: true,
        title: headerText,
        width: 500,
        resizable: false,
        closeOnEscape: false,
        buttons: [
            {
                text: GetResourceText("OK", "Ok"),
                click: function () {
                    try {
                        if (typeof okClick != 'undefined')
                            okClick();
                    } catch (err) {
                    }
                    $("#msgbx").dialog('close');
                },
                class: 'btn',
                style: ' outline: none !important; color : white;'
            }],
        close: function (event, ui) {
            try {
                if (typeof dialogClose != 'undefined')
                    dialogClose();
            } catch (err) {
            }
        }
    };

    ShowDialog(headerText, messageText, msgBoxData);



}


function ShowErrorDialogForMessages(headerText, messageArray, okClick, dialogClose) {

    var messageText = GetBulletsForMessages(messageArray);
    ShowErrorDialog(headerText, messageText, okClick, dialogClose);
}



/******************************************************************************************************
COMMON FUNCTIONS
*******************************************************************************************************/
function ShowDialog(headerText, messageText, dialogOptions) {
    //If there is some message only then show the dialog
    if (messageText != null && MessageTextIsNotEmpty(messageText)) {
        $("#msgbxMessage").html(messageText);
        //$("#msgbx").attr("title", headerText);        //Commented to fix issue with hover on pop-up shows this title everwhere
        $("#msgbx").dialog(dialogOptions);
        $(".ui-dialog-titlebar").show();
    }
}

function MessageTextIsNotEmpty(messageText) {
    var result = true;
    var dv = $("<div></div>");
    $(dv).html(messageText);
    result = $(dv).html().length > 0;

    return result;
}


function GetBulletsForMessages(messageArray) {
    var ulElement = $("<ul></ul>");
    for (var i = 0; i < messageArray.length; i++) {
        var liElement = $("<li></li>").html(messageArray[i]);
        $(ulElement).append(liElement);
    }
    return ulElement;
}



/******************************************************************************************************
CONFIRMATION DIALOG
*******************************************************************************************************/
function ShowConfirmationDialog(headerText, messageText, continueClick, cancelClick, dialogClose) {

    var msgBoxData = {
        modal: true,
        title: headerText,
        width: 500,
        resizable: false,
        buttons: [
            {
                text: GetResourceText("CONTINUE", "Continue"),
                click: function () {
                    try {
                        if (typeof continueClick != 'undefined')
                            continueClick();
                    } catch (err) {
                    }
                    $("#msgbx").dialog('close');
                },
                class: 'btn',
                style: ' outline: none !important; color : white;'
            },
            {
                text: GetResourceText("CANCEL", "Cancel"),
                click: function () {
                    try {
                        if (typeof cancelClick != 'undefined')
                            cancelClick();
                    } catch (err) {
                    }
                    $("#msgbx").dialog('close');
                },
                class: 'btn',
                style: ' outline: none !important; color : white;'
            }],
        close: function (event, ui) {
            try {
                if (typeof dialogClose != 'undefined')
                    dialogClose();
            } catch (err) {
            }
        }
    };

    ShowDialog(headerText, messageText, msgBoxData);
}

/******************************************************************************************************
PROGRESS MESSAGE DIALOG
*******************************************************************************************************/
function ShowProgressMessageDialog(messageText) {

    var msgBoxData = {
        modal: true,
        resizable: false,
        title: "",
        width: 500,
        buttons: null,
        close: null,
        class: 'btn',
        style: ' outline: none !important; color : white;'
    };

    ShowDialog("", messageText, msgBoxData);
    $(".ui-dialog-titlebar").hide();
}


/******************************************************************************************************
INFORMATION DIALOG With OK BUTTON
*******************************************************************************************************/
function ShowOKDialog(headerText, messageText, okClick, dialogClose) {

    var msgBoxData = {
        positionType: "center",
        modal: true,
        resizable: false,
        title: headerText,
        buttons: [
            {
                text: GetResourceText("OK", "Ok"),
                click: function () {
                    try {
                        if (typeof okClick != 'undefined')
                            okClick();
                    } catch (err) {
                    }
                    $("#msgbx").dialog('close');
                },
                class: 'btn',
                style: ' outline: none !important; color : white;'
            }],
        close: function (event, ui) {
            try {
                if (typeof dialogClose != 'undefined')
                    dialogClose();
            } catch (err) {
            }
        }
    };
    ShowDialog(headerText, messageText, msgBoxData);
}

function CloseDialog() {
    $("#msgbx").dialog('close');
}

/******************************************************************************************************
Yes No DIALOG With OK BUTTON
*******************************************************************************************************/
function ShowYesNoDialog(headerText, messageText, yesClick, noClick, dialogClose) {
    var msgBoxData = {
        modal: true,
        title: headerText,
        resizable: false,
        buttons: [
            {
                text: GetResourceText("YES", "Yes"),
                click: function () {
                    try {
                        if (typeof yesClick != 'undefined')
                            yesClick();
                    } catch (err) {
                    }

                    $("#msgbx").dialog('close');
                },
                class: 'btn',
                style: ' outline: none !important; color : white;'
            },
            {
                text: GetResourceText("NO", "No"),
                click: function () {
                    try {
                        if (typeof noClick != 'undefined')
                            noClick();
                    } catch (err) {
                    }
                    $("#msgbx").dialog('close');
                },
                class: 'btn',
                style: ' outline: none !important; color : white;'
            }],
        close: function (event, ui) {
            try {
                if (typeof dialogClose != 'undefined')
                    dialogClose();
            } catch (err) {
            }
        }
    };

    ShowDialog(headerText, messageText, msgBoxData);

}

function ShowOKDialogWithOnclick(headerText, messageText, okClick, dialogClose) {

    var msgBoxData = {
        positionType: "center",
        modal: true,
        resizable: false,
        title: headerText,
        buttons: [
            {
                text: GetResourceText("OK", "Ok"),
                click: function () {
                    try {
                        if (typeof okClick != 'undefined')
                            okClick();
                    } catch (err) {
                    }
                },
                class: 'btn',
                style: ' outline: none !important; color : white;'
            }],
        close: function (event, ui) {
            try {
                if (typeof dialogClose != 'undefined')
                    dialogClose();
            } catch (err) {
            }
        }
    };
    ShowDialog(headerText, messageText, msgBoxData);
}




function ShowConfirmationDialogWithCustomizeText(headerText, messageText, continueClick, cancelClick, dialogClose, ContinueButtonText, CancelButtonText) {

    var msgBoxData = {
        modal: true,
        title: headerText,
        width: 500,
        resizable: false,
        buttons: [
            {
                text: ContinueButtonText,
                click: function () {
                    try {
                        if (typeof continueClick != 'undefined')
                            continueClick();
                    } catch (err) {
                    }
                    $("#msgbx").dialog('close');
                },
                class: 'btn',
                style: ' outline: none !important; color : white;'
            },
            {
                text: CancelButtonText,
                click: function () {
                    try {
                        if (typeof cancelClick != 'undefined')
                            cancelClick();
                    } catch (err) {
                    }
                    $("#msgbx").dialog('close');
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

    ShowDialog(headerText, messageText, msgBoxData);
}

function ShowConfirmationModalDialogWithCustomizeText(headerText, messageText, continueClick, cancelClick, dialogClose, ContinueButtonText, CancelButtonText) {

    var msgBoxData = {
        modal: true,
        title: headerText,
        width: 500,
        resizable: false,
        closeOnEscape: false,
        buttons: [
            {
                text: ContinueButtonText,
                click: function () {
                    try {
                        if (typeof continueClick != 'undefined')
                            continueClick();
                    } catch (err) {
                    }
                    $("#msgbx").dialog('close');
                },
                class: 'btn',
                style: ' outline: none !important; color : white;'
            },
            {
                text: CancelButtonText,
                click: function () {
                    try {
                        if (typeof cancelClick != 'undefined')
                            cancelClick();
                    } catch (err) {
                    }
                    $("#msgbx").dialog('close');
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

    ShowDialog(headerText, messageText, msgBoxData);
}
