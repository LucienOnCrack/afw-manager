$(document).ready(function () {
    var navBarHeight = $("#DIVMenu .navbar").height();
    var mainBodyMargin = navBarHeight + 10;
    var mainBodyMarginTop = mainBodyMargin + "px";
    var orderCustInfoTop = (mainBodyMargin - 17) + "px";
    $("#MainBodyContainer").css("margin-top", mainBodyMarginTop);
    $(".FixedPosition.custInfo").css("top", orderCustInfoTop);
});


//Spinner function

//$(document).ready(function () {
//    $('[class=testOneTwo]').on('input', function () {
//        IsShowSpinner = false;
//    });
//});




/********************************************************************************************************************
CONTROL UTILITY FUNCTIONS
*********************************************************************************************************************/
//Sets date picker on a control
var DateRange = '1950:2050';
var ProductLineId = -1;
function SetDate(id) {
    id = $("#" + id);
    var value = id.val();
    var selectedValue = id.val();
    if (selectedValue == '')
        return;
    var date = $.datepicker.parseDate("dd-M-yyyy", selectedValue);
    var lastDate = new Date(date);
    id.datepicker("setValue", lastDate);
    id.datepicker("hide");
}
function AddDatePickerControl(id) {
    $("#" + id).attr("class", "DatePickerStyle calender_small form-control glyphicons glyphicons-calendar");
    $(".DatePickerStyle").datepicker({
        format: DATEFORMAT,
        autoclose: true
    });

}

function AddDatePickerControlDisableBackDate(id) {
    var date = new Date();
    date.setDate(date.getDate());

    $("#" + id).attr("class", "DatePickerStyle calender_small form-control glyphicons glyphicons-calendar");
    $(".DatePickerStyle").datepicker({
        format: DATEFORMAT,
        startDate: date,
        autoclose: true
    }).on("change", function () {

        $('.DatePickerStyle').focus();
    });;
}

window.alert = function (message) {
    ShowOKDialog("", message, null, null);
};

//Resets various controls
function textboxReset(containerID, value) {
    $("#" + containerID).find('input:text, textarea').val(value);
}

function comboReset(containerID, value) {
    if (!isNaN(value)) {
        $("#" + containerID).find('select').val(value);
    }
}


//Make links in table header as ajaxified
function UpdateSortingLinks(tableId, divId) {
    if (typeof (divId) === 'undefined' || divId == '') {
        divId = "divGrid";
    }

    UpdateCustomizeSortingLinks(tableId, divId);
    $("#EntityListView a").attr("tabindex", "-1");
}
function UpdateCustomizeSortingLinks(tableId, divID) {
    var tables = $("#" + divID).find("table[id='" + tableId + "']");
    if (tables != null && tables.length > 0) {
        for (var i = 0; i < tables.length; i++)
            $(tables[i]).find("tr:first a").click({ param1: divID }, CustomizeOverviewListHeaderLinkClicked);
    }
}
function GenerateAjaxLink(link) {

}

function CustomizeOverviewListHeaderLinkClicked(event) {
    var link = $(this);
    var href = link.attr("href");
    var queryString = href.substring(href.indexOf("?"));
    var qsArgs = queryString.split("&");
    var newQueryString = "";
    for (var icount = 0; icount < qsArgs.length; icount++) {
        var compareString = qsArgs[icount].substring(qsArgs[icount].indexOf("=") + 1);
        compareString = compareString.replace("%2C", ",");
        if (compareString != $("#SelectedProductsForComparison").val()) {
            newQueryString += qsArgs[icount] + "&";
        }
    }

    if (newQueryString.substring(newQueryString.length - 1) == "&")//if ends with
        newQueryString = newQueryString.substring(0, newQueryString.length - 1);

    GetSortedView(window.CurrentControllerURL + newQueryString, event.data.param1);
    return false;
}

function OverviewListHeaderLinkClicked() {
    var link = $(this);
    var href = link.attr("href");
    var queryString = href.substring(href.indexOf("?"));
    var qsArgs = queryString.split("&");
    var newQueryString = "";
    for (var icount = 0; icount < qsArgs.length; icount++) {
        var compareString = qsArgs[icount].substring(qsArgs[icount].indexOf("=") + 1);
        compareString = compareString.replace("%2C", ",");
        if (compareString != $("#SelectedProductsForComparison").val()) {
            newQueryString += qsArgs[icount] + "&";
        }
    }

    if (newQueryString.substring(newQueryString.length - 1) == "&")//if ends with
        newQueryString = newQueryString.substring(0, newQueryString.length - 1);

    GetSortedView(window.CurrentControllerURL + newQueryString, "divGrid");
    return false;
}



function GetSortedView(urlAction, divID) {
    $.ajax(
        {
            type: "GET",
            url: urlAction,
            success: function (data) {
                if (data.length > 0) {

                    $("#" + divID).html(data);
                }
            }
        });
}


//Resets the file upload control
//It is required that the file upload control is wrapped in a div
function ResetFileControl(fileControlID) {

    var fileControl = $("#" + fileControlID);
    if (fileControl != null) {
        var containerColumn = $(fileControl).closest("div");
        if (containerColumn != null) {
            $(containerColumn).html($(containerColumn).html());
        }
    }
}


function AttachTooltipToImages(containerID, imageIdStartsWith) {
    var containerTable = $("#" + containerID);
    $(containerTable).find("img[id^='" + imageIdStartsWith + "']").tooltip({
        delay: 0,
        showURL: false,
        bodyHandler: function () {
            var previewURL = $(this).attr("previewURL");
            if (previewURL != null && $.trim(previewURL).length > 0)
                return $("<img class='previewImage'/>").attr("src", previewURL);
            else
                return $("<img class='previewImage'/>").attr("src", this.src);
        }
    });
}



/********************************************************************************************************************
COMMON UTILITY FUNCTIONS
*********************************************************************************************************************/

//Cancels bubbling of javascript event
function cancelBubble(e) {
    e = GetEvent(e);
    if (e) {
        if (typeof e.cancelBubble != "undefined") {
            e.cancelBubble = true;
        }
        if (typeof e.stopPropagation != "undefined") {
            e.stopPropagation();
        }
    }
}

// Returns browser-independent version of javascript event object
function GetEvent(e) {
    if (!e) e = window.event;
    if (e && !e.target) e.target = e.srcElement;
    return e;
}


//Makes and ajax call and display the result in the specified div
function FetchAndDisplay(actionURL, requestData, containerDivID) {
    $.ajax(
        {
            type: "GET",
            url: actionURL,
            data: requestData,
            success: function (data) {
                if (data != null) {
                    $("#" + containerDivID).html(data);
                }
                else {
                    $("#" + containerDivID).html("");
                }

            }
        });
}


function HandleJSError(jsFile, jsMethod, XMLHttpRequest, textStatus, errorThrown) {

    //if (XMLHttpRequest.status == 500)
    alert(GetResourceText("GENERAL_JS_ERROR", "An unexpected error occured, please try again.\n If thesame error keeps occuring, please contact us so we can check and solve the issue. Sorry for inconvenience caused."))
    //alert("Some error occured in '" + jsMethod + "' in file '" + jsFile + "'");
}

function GetRMOrderTotal(itemPrice, quantity) {
    if (quantity <= 0)
        quantity = 1;
    var orderTotal = itemPrice * quantity;


    return orderTotal;
}

function GetFormattedNumber(number) {
    var result = number.toString();
    //    if (isNaN(Globalize.parseFloat(result)))
    //        return result;
    result = $.format(number, "n2");
    return result;
}

function GetShopCurrency() {
    var result = $("#ShopCurrencySymbol").val();
    return result;
}


function GetResourceText(key, defaultValue) {
    var result = defaultValue;

    if (typeof (LocalisedMessage) != "undefined" && LocalisedMessage != null) {
        var temp = LocalisedMessage[key];
        if (temp != null && typeof temp != "undefined") {
            result = temp;
        }
    }

    return result;
}

function IsInvoiceSurchargeApplicable() {

    if (ISINVOICE_SURCHARGE_APPLICABLE != undefined && ISINVOICE_SURCHARGE_APPLICABLE.toLowerCase() == 'false') {
        return false;
    }
    else if (ISINVOICE_SURCHARGE_APPLICABLE != undefined && ISINVOICE_SURCHARGE_APPLICABLE.toLowerCase() == 'true') {
        return true;
    }

    return false;
}

function IsInvoiceSurchargeChecked() {
    return IS_SURCHARGE_CHECKED;
}

var month = new Array();
month[0] = "Jan";
month[1] = "Feb";
month[2] = "Mar";
month[3] = "Apr";
month[4] = "May";
month[5] = "Jun";
month[6] = "Jul";
month[7] = "Aug";
month[8] = "Sep";
month[9] = "Oct";
month[10] = "Nov";
month[11] = "Dec";

function GetDateFromJSon(dateString, defaultValue) {
    var ret = defaultValue;
    if (dateString != null) {
        var dateValue = ParseJSonDate(dateString);
        if (dateValue != null) {
            ret = $.format(dateValue, DATEFORMAT_SERVER);
        }
    }
    return ret;
}

function ParseJSonDate(dateString) {
    /// <summary>Parses the date</summary>
    /// <param name="dateString" type="string">JSon date string to be parsed.</param>
    /// <returns type="Date">Parsed date</returns>

    var result = null;

    //Parsing method 1
    try {
        result = new Date(parseInt(dateString.replace("/Date(", "").replace(")/", ""), 10));
    } catch (e) { result = null; }

    //Parsing method 2
    try {
        result = new Date($.parseInt(dateString.substr(6, 13)));
    } catch (e) { result = null; }

    return result;
}


$.fn.clearOldAndAddItems = function (data) {
    this.empty();
    return this.each(function () {
        var list = this;
        $.each(data, function (index, itemData) {
            var option = new Option(itemData.Text, itemData.Value);
            if (itemData.Value == "-1")
                option.selected = true;
            list.add(option);
        });
    });
};




///Comman for Fix First Column and fix Header


function FixTableColumns(tableID, numberOfFixedColumns) {

    if (window.innerWidth < 768) {
        numberOfFixedColumns = 0;
    }


    var numberOfColumnsInTable = $("#" + tableID + " tr:eq(0)").find("th").length;

    //Skip the column in which context menu html is rendered.
    numberOfColumnsInTable = numberOfColumnsInTable - 1;

    if (numberOfColumnsInTable < numberOfFixedColumns)
        numberOfFixedColumns = numberOfColumnsInTable;
    else if (numberOfColumnsInTable == numberOfFixedColumns)
        numberOfFixedColumns = 1;

    if (numberOfColumnsInTable > 0) {
        new superTable(tableID, {
            cssSkin: "sDefault",
            fixedCols: numberOfFixedColumns
        });
    }

    $(".sData").scroll(function () {
        $("#hiddenScrollPositionH").val($(".sData").scrollLeft());

    });
}
function AdjustTableCells(dynamicColPosition, dynamicColClass) {

    var tableId = "EntityListView";
    for (var k = 0; k < dynamicColPosition; k++) {
        var classStyle = "td" + (k + 1).toString();
        var colFind = "td:eq(" + k.toString() + "), th:eq(" + k.toString() + ")";
        $("#" + tableId).find("tr").find(colFind).attr('class', classStyle);
    }

    var colRemove = "td:eq(" + dynamicColPosition.toString() + "), th:eq(" + dynamicColPosition.toString() + ")";
    $("#" + tableId).find("tr").find(colRemove).removeAttr("Width");

    var columns = $("#" + tableId).find("tr:eq(0)").find("th");
    var rows = $("#" + tableId).find("tr");

    for (var j = 0; j < rows.length; j++) {
        for (var i = dynamicColPosition + 1; i < columns.length; i++) {
            $("#" + tableId).find("tr:eq(" + j + ")").find("td:eq(" + i + "), th:eq(" + i + ")").attr("class", dynamicColClass);
        }
    }

}


//Atached Context Menu

function AttachedContextMenus(actionButtons, listID) {
    if (actionButtons != null && actionButtons.length > 0) {

        for (var i = 0; i < actionButtons.length; i++) {

            //Extract entityID from button id
            var iDString = $(actionButtons[i]).attr("id");
            var arr = iDString.split('_');

            //Construct context menu id for the entity
            var contextMenuID = "List_" + listID + "_ContextMenu_" + arr[1];
            if ((contextMenuID == 'undefined') || (contextMenuID == null)) {
            }
            else {

                var itema = $("#" + contextMenuID)
                    .children("li")
                    .each(function (index) {
                        $(this).addClass("context-menu-item");
                    });

                $.contextMenu({
                    selector: "#" + $(actionButtons[i]).attr("id"), trigger: "left", zIndex: 100, items: itema
                });


            }
        }
    }


}

function HighlightFirstRow() {

    var rows = $("#EntityListView").find("tr");
    if (rows != null && rows.length > 1) {

        var columns = $(rows[1]).find("td");
        if (columns != null && columns.length > 0) {
            $("#EntityListView").find('tr').removeClass('selectedRow');
            $(rows[1]).addClass('selectedRow');
        }
    }

}


function ApplyEasyTabs(tabPanelID) {
    $('#' + tabPanelID).easytabs({ updateHash: false });
}

function parseBool(value) {
    return (typeof value === "undefined") ?
        false :
        value.replace(/^\s+|\s+$/g, "").toLowerCase() === "true";
}

function EnableDisableCustomDropDown(dropDownID, isEnabled) {
    var dropDownDivID = String.format("{0}_div", dropDownID);

    if (isEnabled) {
        $("#" + dropDownDivID).removeAttr("disabled");
        $("#" + dropDownID).removeAttr("disabled");
    } else {
        $("#" + dropDownDivID).attr("disabled", "disabled");
        $("#" + dropDownID).attr("disabled", "disabled");
    }
    InitializeDropDownWithoutSearchBoxByID(dropDownID);
}

function EnableDisableInputControl(controlID, isEnabled) {
    if (isEnabled) {
        $("#" + controlID).removeAttr("disabled");

    } else {

        $("#" + controlID).attr("disabled", "disabled");
    }
}

function GetHeightForInnerContainer() {
    var HEADER_HEIGHT = $("#pageHeaderContainer").height();
    var PAGE_TITLE = $("#pageTitleContainer").height();


    if (PAGE_TITLE == undefined) {
        PAGE_TITLE = 20;
    } else {
        $("#pageTitleContainer").css("padding-bottom", "5px");
        $("#pageTitleContainer").addClass('orderOverview');
    }

    return (HEADER_HEIGHT + PAGE_TITLE + 5);
}

function GetHeightForGridContainer() {

    var HEADER_HEIGHT = $("#pageHeaderContainer").height();
    var SEARCH_PANEL_HEIGHT = $("#searchContainer").height();
    var PAGE_TITLE = $("#pageTitleContainer").height();
    var PAGER_DIV_HEIGHT = $("#gridPagerContainer").height();

    if (PAGER_DIV_HEIGHT == undefined) {
        PAGER_DIV_HEIGHT = 10;
    }

    if (SEARCH_PANEL_HEIGHT <= 100) {
        SEARCH_PANEL_HEIGHT = SEARCH_PANEL_HEIGHT + 20;
    } else {
        SEARCH_PANEL_HEIGHT = SEARCH_PANEL_HEIGHT - 10;
    }


    if (PAGE_TITLE == undefined) {
        PAGE_TITLE = 20;
    }

    var BOTTOM_FACTOR = 15;

    return (HEADER_HEIGHT + SEARCH_PANEL_HEIGHT + PAGE_TITLE + PAGER_DIV_HEIGHT + BOTTOM_FACTOR);
}

function AdjustDetailsOverviewHeight() {
    var TAB_CONTAINER_HEIGHT = $("#detailContainer").height();
    var SEARCH_PANEL_HEIGHT = $("#searchContainer").height();
    var PAGER_DIV_HEIGHT = $("#gridPagerContainer").height();

    if (SEARCH_PANEL_HEIGHT == undefined) {
        if (SEARCH_PANEL_HEIGHT == 0)
            SEARCH_PANEL_HEIGHT = 40;
    }

    if (PAGER_DIV_HEIGHT == undefined) {
        PAGER_DIV_HEIGHT = 10;
    }
    $("#GridContainer").css("margin-top", "10px");
    $("#GridContainer").height(TAB_CONTAINER_HEIGHT - (SEARCH_PANEL_HEIGHT + PAGER_DIV_HEIGHT + 20));

}

function AdjustAppointmentDetailsOverviewHeight() {
    var TAB_CONTAINER_HEIGHT = $("#divPastAppointmentsGrid").height();
    var SEARCH_PANEL_HEIGHT = $("#searchContainer").height();
    var PAGER_DIV_HEIGHT = $("#gridPagerContainer").height();

    if (SEARCH_PANEL_HEIGHT == undefined) {
        SEARCH_PANEL_HEIGHT = 50;
    }

    if (PAGER_DIV_HEIGHT == undefined) {
        PAGER_DIV_HEIGHT = 10;
    }

    $("#GridContainer").height(TAB_CONTAINER_HEIGHT - (SEARCH_PANEL_HEIGHT + PAGER_DIV_HEIGHT + 20));

}

function AdjustOverviewPageHeight() {

    var INNERCONTAINER_HEIGHT = GetHeightForInnerContainer();

    var GRID_CONTAINER_HEIGHT = GetHeightForGridContainer();
    var DOCUMENT_HEIGHT = $(document).innerHeight();
    var WINDOWS_HEIGHT = $(window).innerHeight();

    var INNERT_CONTAINER_HEIGHT = WINDOWS_HEIGHT - (INNERCONTAINER_HEIGHT);

    var height = WINDOWS_HEIGHT - (GRID_CONTAINER_HEIGHT);


    //if (isFromMobileDevice) {
    //    $("#innerContainer").css("min-height", (INNERT_CONTAINER_HEIGHT - 30) + "px");
    //    $("#GridContainer").css("min-height", (height - 40) + "px");
    //}
    //else {
    //    if (WINDOWS_HEIGHT < 500) {
    //        $("#innerContainer").css("min-height", (INNERT_CONTAINER_HEIGHT - 15) + "px");
    //        $("#GridContainer").css("min-height", (height - 15) + 'px');
    //    } else {
    //        $("#innerContainer").css("height", (INNERT_CONTAINER_HEIGHT - 15) + "px");
    //        $("#GridContainer").css("height", (height - 30) + 'px');
    //    }
    //}

    //$("#GridContainer").css("margin-top", "10px");

}

var noCloumnToFreeze = 0;
var gridTableId = "EntityListView";
function Grid_Load(columnToFreeze, tableId) {
    noCloumnToFreeze = columnToFreeze;
    gridTableId = tableId;

    AdjustOverviewPageHeight();
    FixTableColumns(tableId, noCloumnToFreeze);
    UpdateSortingLinks(tableId);

    var actionButtons = $.find("#" + tableId + " button[id^='PPAction_']");
    if (actionButtons != null && actionButtons.length > 0) {
        AttachedContextMenus(actionButtons, 1);
    }

}


function Grid_Load_Without_AttachedContextMenu(columnToFreeze, tableId) {
    noCloumnToFreeze = columnToFreeze;
    gridTableId = tableId;

    AdjustOverviewPageHeight();
    FixTableColumns(tableId, noCloumnToFreeze);
    UpdateSortingLinks(tableId);

}

function Grid_Load_Details(columnToFreeze, tableId) {
    noCloumnToFreeze = columnToFreeze;
    gridTableId = tableId;

    AdjustDetailsOverviewHeight();
    FixTableColumns(tableId, noCloumnToFreeze);
    UpdateSortingLinks(tableId);


    var actionButtons = $.find("#" + tableId + " button[id^='PPAction_']");
    if (actionButtons != null && actionButtons.length > 0) {
        AttachedContextMenus(actionButtons, 1);
    }
}


function AdjustCustomerFieldsHeight() {
    var heightToApplied = DetailPageHeight();
    $("#detailContainer").css("min-height", heightToApplied + 'px');
    $("#detailContainer").css("overflow", "hidden");
}

function DetailPageHeight() {
    var HEADER_HEIGHT = $("#pageHeaderContainer").height();
    var PAGE_TITLE = $("#pageTitleContainer").height();

    if (PAGE_TITLE == undefined) {
        PAGE_TITLE = 50;
    }

    var WINDOW_HEIGHT = $(window).height();

    var heightToApplied = WINDOW_HEIGHT - (HEADER_HEIGHT + PAGE_TITLE + 100);

    if (isFromMobileDevice) {
        heightToApplied = WINDOW_HEIGHT - (HEADER_HEIGHT);
    }
    return heightToApplied;
}


function AdjustDetailsHeight() {
    var heightToApplied = DetailPageHeight();
    $("#detailContainer").css("min-height", heightToApplied + 'px');
}
function AdjustDetailsHeight(selector) {
    var heightToApplied = DetailPageHeight();
    $(selector).css("min-height", heightToApplied + 'px');

}

function AdjustCustomerCreateEditPageHeight(selector, isEdit) {
    var HEADER_HEIGHT = 130;
    var TAB_HEADER_HEIGHT = 63;
    var BOTTOM_FACTOR = 10 + 20; //grey bottom strip + white space

    var height = $(window).height() - (HEADER_HEIGHT + TAB_HEADER_HEIGHT + BOTTOM_FACTOR);
    $(selector).height(height);
    var MISC = 40;
    if (isEdit)
        MISC = MISC + 30;		//Height of the "Body measurements updated on" in edit mode
    $(".topsectionBody").height(height - MISC);
}

function AdjustMossCustomerCreateEditPageHeight(selector, isEdit) {
    var heightToApplied = DetailPageHeight();
    $("#detailContainer").css("min-height", heightToApplied + 'px');
}

function AdjustTabContainerHeight(selector) {
    var HEADER_HEIGHT = 130;
    var TAB_HEADER_HEIGHT = 71;
    var BOTTOM_FACTOR = 10 + 20; //grey bottom strip + white space
    var MISC = 0;
    var height = $(window).height() - (HEADER_HEIGHT + TAB_HEADER_HEIGHT + BOTTOM_FACTOR + MISC);
    $(selector).height(height);
}

function AdjustMyInformationTabContainerHeight(selector) {
    var HEADER_HEIGHT = 130;
    var TAB_HEADER_HEIGHT = 64;
    var BOTTOM_FACTOR = 10 + 20; //grey bottom strip + white space
    var MISC = 0;
    var height = $(window).height() - (HEADER_HEIGHT + TAB_HEADER_HEIGHT + BOTTOM_FACTOR + MISC);
    $(selector).height(height);
}

function AdjustCustomerFieldSettingsPageHeight() {
    var HEADER_HEIGHT = 130;
    var MISC_HEIGHT = 50;
    var TAB_HEADER_HEIGHT = 45;
    var TABLE_HEADER_HEIGHT = 10;
    var BOTTOM_FACTOR = 10 + 20; //grey bottom strip + white space   

    AdjustTabContainerHeight($(".TabbedPanelsContent"));

    var height = $(window).height() - (HEADER_HEIGHT + MISC_HEIGHT + TAB_HEADER_HEIGHT + TABLE_HEADER_HEIGHT + BOTTOM_FACTOR);
    $(".topsectionBody").height(height);
}

function AdjustCustomerTabContainerHeight(selector) {
    var HEADER_HEIGHT = 150;// 130;
    var SEARCH_PANEL_HEIGHT = 0;// 93;
    var TAB_HEADER_HEIGHT = 41;
    var BOTTOM_FACTOR = 10 + 20 + 10; //grey bottom strip + white space
    var MISC = 0;
    //TAB_HEADER_HEIGHT = $("#tabsCustomerDetails").height();

    var height = $(window).height() - (HEADER_HEIGHT + SEARCH_PANEL_HEIGHT + TAB_HEADER_HEIGHT + BOTTOM_FACTOR + MISC);
    if (height < 400) {
        height = 400;
        $('body').css('overflow-y', 'auto');
        $('#headercontent').css('position', 'relative');
    } else {
        $('#headercontent').css('position', 'fixed');
    }
    $(selector).height(height);

    var mainBodyWidth = $("#MainBodyContainer").width();
    var containerWidth = $(selector).width();

    if (mainBodyWidth < containerWidth) {
        $("#MainBodyContainer").css("overflow-x", "auto");
        $(".CustomerOtherInfo").css("right", mainBodyWidth - containerWidth);
    } else {
        $("#MainBodyContainer").css("overflow-x", "");
        $(".CustomerOtherInfo").css("right", 20);
    }
}



function AdjustCustomerDetailsTabContainerHeight(selector) {
    var HEADER_HEIGHT = 130;
    var SEARCH_PANEL_HEIGHT = 0;
    var TAB_HEADER_HEIGHT = 70;
    var BOTTOM_FACTOR = 10 + 20;
    var height = $(window).height() - (HEADER_HEIGHT + SEARCH_PANEL_HEIGHT + TAB_HEADER_HEIGHT + BOTTOM_FACTOR);
    $(selector).height(height);
    $(".TabbedPanelsContent.ff").height(height - 75);
    $(".TabbedPanelsContent.ff .topsectionBody").height(height - 75 - 35);
    //AdjustTabContainerHeight($(".TabbedPanelsContent"));// TabbedPanelsContent 
}

function RefreshSuperTable(tableID, tableContainerID, numberOfColumnsToFreeze) {
    //Second way - recommended way but not working now :(
    var headerHeight = $("#" + tableID).closest(".sHeader").height();
    var gridContainerHeight = $(".GridContainernew").height();
    var resizeHeight = gridContainerHeight - headerHeight - 2;
    $(".sData").height(resizeHeight);
    $(".sFData").height(resizeHeight);


    //First way to refresh grid	(Not recommended)
    var html = $("#" + tableContainerID).find(".sData").find("table").parent().html();
    if ($.trim(html).length > 0)
        $("#" + tableContainerID).html(html);
    $("EntityListView th a").attr("tabindex", "-1");
}


function GetFilterStatus(urlAction, callBack) {
    $.get(urlAction, function (data) {
        if (data == "True") {
            ShowOKDialog("", GetResourceText("NO_EXPORT_FILTER_APPLIED"), null);
        } else {
            location.href = callBack;
        }
    });
}



function AttachToolTip(containerID, cssName) {
    var containerTable = $("#" + containerID);
    $(containerTable).find("." + cssName).tooltip({
        delay: 0,
        showURL: false,
        extraClass: "SetHeightWidth"
    });
}

function OpenUrl(url, name, spec) {
    var validateUrl = "/RequestValidation/ValidateUrl";
    $.ajax(
        {
            type: "GET",
            url: validateUrl,
            success: function (data) {
                window.open(url, name, spec);
            }
        });

}
function addEventHandlerToElement(elem, eventType, handler) {
    if (elem.addEventListener)
        elem.addEventListener(eventType, handler, false);
    else if (elem.attachEvent)
        elem.attachEvent('on' + eventType, handler);
}
function AdjustStockOverviewPageHeight() {
    var HEADER_HEIGHT = 130;
    var SEARCH_PANEL_HEIGHT = $("#SearchTableContent").height() + 40;
    var PAGER_DIV_HEIGHT = 35;
    var BOTTOM_FACTOR = 10 + 20; //grey bottom strip + white space

    var contentheight = $(window).height() - (155 + BOTTOM_FACTOR);

    if (contentheight < 400) {
        contentheight = 400;
        $('body').css('overflow-y', 'auto');
        $('#headercontent').css('position', 'relative');
        $(".contentwrapperBody").height(contentheight);
        $("#GridContainer").height(190);
    } else {
        $('#headercontent').css('position', 'fixed');
        $(".contentwrapperBody").height(contentheight);

        var height = $(window).height() - (HEADER_HEIGHT + SEARCH_PANEL_HEIGHT + PAGER_DIV_HEIGHT + BOTTOM_FACTOR);
        $("#GridContainer").height(height);
    }
}

function AdjustFabricStockOverviewPageHeight() {
    var HEADER_HEIGHT = 130;
    var SEARCH_PANEL_HEIGHT = $("#SearchTableContent").height() + 58;
    var PAGER_DIV_HEIGHT = 35;
    var BOTTOM_FACTOR = 10; //grey bottom strip + white space

    var contentheight = $(window).height() - (155 + BOTTOM_FACTOR + 20);


    if (contentheight < 400) {
        contentheight = 400;
        $('body').css('overflow-y', 'auto');
        $('#headercontent').css('position', 'relative');
        $(".contentwrapperBody").height(contentheight);
        $("#GridContainer").height(150);
        var searchPanelTableHeight = $("#SearchTableContent").height() + 5;
        $(".StockSearchContainer").css("cssText", "height: " + searchPanelTableHeight + "px !important");
    } else {
        $('#headercontent').css('position', 'fixed');
        $(".contentwrapperBody").height(contentheight);

        var height = $(window).height() - (HEADER_HEIGHT + SEARCH_PANEL_HEIGHT + PAGER_DIV_HEIGHT + BOTTOM_FACTOR);
        $("#GridContainer").height(height);
    }

}

//Date related functions
function GetStartDayOfWeek(d, firstDayOfWeek) {
    var delta = firstDayOfWeek - d.getDay();
    if (delta > 0)
        delta -= 7;
    var weekStartDay = new Date(d);
    weekStartDay.setDate(weekStartDay.getDate() + delta);
    return weekStartDay;

}
function GetFirstDayOfMonth(d) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}

function AdjustWidthOfTableForHorzontalScroll(overviewID, overviewContainerID) {

    var verticalScrollBarheight = 19;
    var containerDivHeight = $("#" + overviewContainerID).height();
    var overviewHeight = $("#" + overviewID).height();
    if (overviewHeight > containerDivHeight) {
        $("#" + overviewID).width($("#" + overviewContainerID).width() - verticalScrollBarheight);
    }
}
function createCookie(name, value, days) {
    var expires;
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toGMTString();
    }
    else expires = "";
    document.cookie = name + "=" + value + expires + "; path=/";
}

function eraseCookie(name) {
    createCookie(name, "", -1);
}

function redirectHttpToHttps(shouldRedirectToHttps, redirectToHttps) {
    if (shouldRedirectToHttps.toLowerCase() == "true") {
        if (redirectToHttps.toLowerCase() == "false") {

            var protocol = window.location.protocol;

            if (protocol.toLowerCase() == "http:") {
                var httpURL = window.location.hostname + window.location.pathname + window.location.search;
                var httpsURL = "https://" + httpURL;
                window.location = httpsURL;
            }
        }
    }
}

function pad(element, size) {
    var s = String(element);
    while (s.length < (size || 2)) { s = "0" + s; }
    return s;
}

function GetOrientationDirection() {

    var mql = window.matchMedia("(orientation: portrait)");

    if (mql.matches) {
        isLandscape = true;
    } else {

        isLandscape = false;
    }
}


var ff = function format(ul, item) {
    item.label = item.label.replace(new RegExp("(?![^&;]+;)(?!<[^<>]*)(" + $.ui.autocomplete.escapeRegex(this.term) + ")(?![^<>]*>)(?![^&;]+;)", "gi"), "<strong>$1</strong>");
    return $("<li></li>")
        .data("item.autocomplete", item)
        .append("<a>" + item.label + "</a>")
        .appendTo(ul);
};

function hideContextMenu() {
    if ($('#context-menu-layer').length > 0)
        $('#context-menu-layer').trigger('mousedown');
}


//Customer Details Related Grid Adjusment

function CustomerDetailsFitProfileGrid() {
    var noCloumnToFreeze = 0;
    var tableId = "EntityListView2";

    AdjustDetailsFitProfileOverviewHeight();
    FixTableColumns(tableId, noCloumnToFreeze);
    UpdateSortingLinks(tableId, "GridContainerFitProfile");


    var actionButtons = $.find("#" + tableId + " button[id^='PPAction_']");
    if (actionButtons != null && actionButtons.length > 0) {
        AttachedContextMenus(actionButtons, 1);
    }
}

function AdjustDetailsFitProfileOverviewHeight() {
    var height = GetCommonHeightForDetails();


    $("#GridContainerFitProfile").css("margin-top", "10px");
    $("#GridContainerFitProfile").height(height);

}

function CustomerDetailsOrderListingGrid() {
    var noCloumnToFreeze = 0;
    var tableId = "EntityListView";

    AdjustDetailsOrderOverviewHeight();
    FixTableColumns(tableId, noCloumnToFreeze);
    UpdateSortingLinks(tableId);

//    var actionButtons = $.find("#" + tableId + " button[id^='PPAction_']");
//    if (actionButtons != null && actionButtons.length > 0) {
//        AttachedContextMenus(actionButtons, 1);
//    }
}

function AdjustDetailsOrderOverviewHeight() {
    var height = $("#detailContainer").height();//GetCommonHeightForDetails();
    $("#GridContainerOrderListing").css("margin-top", "10px");
    //$("#GridContainerOrderListing").height(height);
    $("#GridContainerOrderListing").height(height - 150);
}

function CustomerDetailsAppointmentListingGrid() {
    var noCloumnToFreeze = 0;
    var tableId = "AppointmentList";

    AdjustDetailsAppointmentOverviewHeight();
    FixTableColumns(tableId, noCloumnToFreeze);
    UpdateSortingLinks(tableId);


    var actionButtons = $.find("#" + tableId + " button[id^='PPAction_']");
    if (actionButtons != null && actionButtons.length > 0) {
        AttachedContextMenus(actionButtons, 1);
    }
}

function AdjustDetailsAppointmentOverviewHeight() {
    var height = GetCommonHeightForDetails();
    $("#GridContainerAppointment").css("margin-top", "10px");
    $("#GridContainerAppointment").height(height);

}
function GetCommonHeightForDetails() {
    var HEADER_HEIGHT = GetHeightForGridContainer();
    var WINDOW_HEIGHT = $(window).innerHeight();
    return WINDOW_HEIGHT - (HEADER_HEIGHT + 100);
}

//End Customer details adjustment


function GetValueById(controlId) {
    var value = $("#" + controlId).val();
    return value;
}

function GetHtmlById(controlId) {
    var value = $("#" + controlId).html();
    return value;
}

function SetValueById(controlId, value) {
    $("#" + controlId).val(value);
}

function SetTextById(controlId, value) {
    $("#" + controlId).html(value);
}


function GetIsChecked(chkId) {
    var isChecked = $('#' + chkId).is(':checked');
    return isChecked;
}

function GetTextFromDropDown(controlId) {
    var text = $("#" + controlId + " option:selected").text();
    return text;
}

function EnableDisableControl(controlId, isEnable) {

    if (isEnable) {
        $("#" + controlId).removeAttr("disabled");
    } else {
        $("#" + controlId).attr("disabled", "disabled");
    }

}

function HasNotValueForDropdownById(controlId) {
    var result = false;
    var value = $("#" + controlId).val();
    if (!value) {
        result = true;
    }
    if (value === "-1") {
        result = true;
    }

    if (value === "null") { // this case is added for the drpdowns whose value is in string format => For trim 2.0 => MAhesh R Kunjir
        result = true;
    }

    return result;
}

function HasNotValueForTextBoxById(controlId) {
    var result = false;
    var value = $("#" + controlId).val().trim();
    if (!value) {
        result = true;
    }
    return result;
}

function CollaborationSelectAndUI() {

    if ($.ui && $.ui.dialog && $.ui.dialog.prototype._allowInteraction) {
        var ui_dialog_interaction = $.ui.dialog.prototype._allowInteraction;
        $.ui.dialog.prototype._allowInteraction = function (e) {
            if ($(e.target).closest('.select2-container').length) return true;
            return ui_dialog_interaction.apply(this, arguments);
        };
    }
}

String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    if (typeof target.replace !== "undefined") {
        // safe to use the function
        return target.replace(new RegExp(search, 'g'), replacement);
    }
    return target;

};

function CreateNewReadyMadeOrder() {

    $.ajax({
        type: "GET",
        url: '/ReadymadeOrderOverview/HasShopMultipleProductLine/',
        data: {},
        success: function (data) {

            if (data.hasMultiplePL) {
                if (data.productLineId > 0) {
                    ProductLineId = data.productLineId;
                }
                ShowProductLineSelectionPopUpForReadyMadeOrder(data.productLineId);
            } else {
                window.location = data.RedirectUrl;
            }
        }
    });
    return false;
}

function ShowProductLineSelectionPopUpForReadyMadeOrder(orderProductLine) {
    var width = 800;
    if (orderProductLine == 2) {
        width = 300;
    }

    $.ajax({
        type: "GET",
        url: '/ReadymadeOrderOverview/SelectOrder/',
        success: function (data) {
            $("#divReadyMadeOrderBeforeCreationPopUp").dialog({
                create: function () {
                    $(this)
                        .closest('.ui-dialog')
                        .on('keydown',
                            function (ev) {
                                if (ev.keyCode === $.ui.keyCode.ESCAPE) {
                                    $('#divReadyMadeOrderBeforeCreationPopUp').html("");
                                    $('#divReadyMadeOrderBeforeCreationPopUp').dialog("close");
                                    window.location.replace("/ReadymadeOrderOverview/Index/");

                                }
                            });
                },
                title: GetResourceText("SELECT_ITEM_TYPE", "Please select item type"),
                modal: true,
                resizable: false,
                closeOnEscape: false,
                width: width
            });

            $(".ui-dialog").css("overflow", "hidden");
            $("#divReadyMadeOrderBeforeCreationPopUp").html(data);
            $(".ui-dialog").css("padding", "0px");
            $(".ui-dialog .ui-dialog-titlebar").css("padding", "30px 30px 0px 30px");
            $("#divReadyMadeOrderBeforeCreationPopUp").css("overflow", "unset");
            $("#divReadyMadeOrderBeforeCreationPopUp").dialog("open");
          if ($("#divReadyMadeOrderBeforeCreationPopUp").hasClass('ui-dialog-content')) {
                $("#divReadyMadeOrderBeforeCreationPopUp").dialog("option", "position", { my: "center", at: "center", of: window });
            }
        }
    });
}

function OnItemGroupChangeForReadyMadePopUp(control,productLineID) {
    $("#productLineButtons").show();
    $("#productLineButtons").removeClass("lightgrey_button");
    $("#productLineButtons").addClass("darkgrey_button");
    $("#lblDisableNote").hide();
}

function OnProductLineChangeForReadyMadePopUp(enabled) {
    if (enabled === 'True') {
        $("#productLineButtons").show();
        $("#lblDisableNote").hide();
    } else {
        $("#lblDisableNote").show();
        $("#productLineButtons").hide();
    }
}

function GoToOrderCreationForReadyMade() {

    var checkedRadioButtons = $("#divReadyMadeOrderBeforeCreationPopUp").find("[type='radio']:checked");
    var itemGroupId = checkedRadioButtons.eq(0).attr("data-itemTypeCategoryId");
    var hiddenInput = $('#ItemTypeCategoryMapping_' + itemGroupId);
    var itemTypeCategoryId = -1;
    if (hiddenInput.length) {
        var value = hiddenInput.val();
        var itemTypeId = value.split('_')[1];
        itemTypeCategoryId = value.split('_')[0];
        itemGroupId = itemTypeId;
    }
    var productLineId = ProductLineId;
    if (itemGroupId != null && productLineId != null) {
        $.ajax({
            type: "POST",
            url: '/ReadymadeOrderOverview/LoadReadyMadeOrderCreationPerShop/',
            data: { itemGroupId: $.parseInt(itemGroupId), itemTypeCategoryId: itemTypeCategoryId, productLineId: $.parseInt(productLineId) },
            success: function (data) {
                if (data.Status) {
                    window.location.replace(data.RefreshURL);
                }
            }
        });
    }
}

function SetCheckBoxChecked(controlId, isChecked) {
    var id = "#" + controlId;
    if (isChecked) {
        $(id).prop("checked", "checked");
    }
    else {
        $(id).prop("checked", "");
    }
}

var dailogObject;

function OpenScannerDialog() {

    $("#scannerApp").dialog({
        width: 300,
        title: "",
        resizable: false,
        modal: true,
        dialogClass: 'ui-dialog_update',
        buttons: {
            "Cancel": function () {

                $('#scannerApp').dialog('close');
                $("#clearButtonId").click();
                $('#qr-reader__dashboard_section_csr button[style*="display: inline-block"]').click();
                if ($('#qr-reader__dashboard_section_swaplink:contains(camera)').length) {
                    document.getElementById('qr-reader__dashboard_section_swaplink').click();
                }

            }
        },
        open: function () {
            $("#play").click();
            dailogObject = this;
        }
    });

}

function OpenScanner() {
    $("#play").click();
}



function MakePayment(uniqueRefId, controllerName) {

    $.ajax(
        {
            type: "POST",
            url: "/" + controllerName + "/GetPrePaymentInformation",
            data: { unquieRefID: uniqueRefId },
            success: function (result) {

                if (result.Status) {
                    $("#prePaymentPopup").html("");
                    $("#prePaymentPopup").html(result.pHtml);

                    $("#prePaymentPopup").dialog({
                        positionType: "center",
                        modal: true,
                        resizable: false,
                        width: 900,
                        closeOnEscape: false,
                        title: GetResourceText("PAYMENT_BTN", "Payment"),
                        buttons: [
                            {
                                text: GetResourceText("CONFIRM_BTN", "Confirm"),
                                click: function () {

                                    var chargetotal = parseFloat($("#chargetotal").val());
                                    if (chargetotal === 0) {
                                        $("#prePaymentPopup").dialog("close");
                                        ShowConfirmationDialog(String.format(GetResourceText("ZEROAMOUNTORDERPROCESSWARNING", "The order will be Processed and marked as ''Paid'' since amount is { 0} 0.00"), GetShopCurrency()), GetResourceText("ORDERPROCESSNOEDITWARNING", "You will not be able to edit this order once processed. Do you want to continue?"), function () {
                                           
                                            LoadPaymentPage();
                                        }, function () {
                                            var redirectURL = "/";

                                            var currentURL = location.href.toLowerCase();
                                            if (currentURL.includes("readymade")) {
                                                redirectURL = "/ReadymadeOrderOverview"
                                            }
                                            window.location.href = redirectURL;
                                        }, null);
                                    }
                                    else {
                                        var email = $("#customParam_email").val();
                                        var reg = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
                                        if (email != undefined && email.length > 0) {
                                            if (reg.test(email)) {
                                                window.onbeforeunload = null;
                                                var url = "/AdyenPayment/LoadPaymentPage";
                                                var ecomPaymentSessionId = $("#merchantTransactionId").val();

                                                var form = $('<form action="' + url + '" method="post">' +
                                                    '<input type="text" name="ecomPaymentSessionId" value="' + ecomPaymentSessionId + '" />' +
                                                    '<input type="text" name="email" value="' + email + '" />' +
                                                    '</form>');
                                                $('body').append(form);
                                                form.submit();

                                            }else {
                                                ShowErrorDialog(GetResourceText("ERROR_MESSAGES", "Error messages"),
                                                    GetResourceText("VALID_EMAIL", "Please enter valid e-mail address"),
                                                    null,
                                                    null);
                                            }
                                        }else {
                                            ShowErrorDialog(GetResourceText("ERROR_MESSAGES", "Error messages"),
                                                GetResourceText("VALID_EMAIL", "Please enter valid e-mail address"),
                                                null,
                                                null);
                                        }
                                    }
                                }
                            },
                            {
                                text: GetResourceText("CANCEL_BTN", "Cancel"),
                                click: function () {

                                    $("#prePaymentPopup").dialog("close");
                                    $.ajax({
                                        type: "POST",
                                        url: "/" + controllerName + "/ResetOrderWizard",
                                        success: function (result) {
                                            window.location.href = result.cancellationUrl;
                                        }
                                    });
                                }
                            }]

                    });
                }
            }
        });
}

function LoadPaymentPage() {
    var email = $("#customParam_email").val();
    var reg = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;

    if (email !== undefined && email.length > 0) {
        if (reg.test(email)) {
            window.onbeforeunload = null; // Disable the unload warning
            var url = "/AdyenPayment/LoadPaymentPage";
            var redirectURL = "/";
            var ecomPaymentSessionId = $("#merchantTransactionId").val();
            var currentLocation = location.href.toLowerCase();;
            if (currentLocation.includes("readymade")) { 
                redirectURL = "/ReadymadeOrderOverview"
            }
            var data = {
                ecomPaymentSessionId: ecomPaymentSessionId,
                email: email
            };

            $.ajax({
                url: url,
                method: "POST",
                data: data,
                success: function (response) {

                    if (response.Status) {
                        $("#prePaymentPopup").dialog("close");
                        window.onbeforeunload = null;
                        ShowOKDialog("Success", response.Message, function () {
                            window.location.href = redirectURL;
                        }, null);


                    } else {
                        ShowErrorDialog(GetResourceText("ERROR_MESSAGES", "Error messages"), response.ErrMsg, function () {                      
                            window.location.href = redirectURL;
                            },
                            null);
                    }
                },
                error: function (xhr, status, error) {
                    console.error("AJAX Error: " + error);
                }
            });
        } else {
            ShowErrorDialog(
                GetResourceText("ERROR_MESSAGES", "Error messages"),
                GetResourceText("VALID_EMAIL", "Please enter a valid e-mail address"),
                null,
                null
            );
        }
    } else {
        ShowErrorDialog(
            GetResourceText("ERROR_MESSAGES", "Error messages"),
            GetResourceText("VALID_EMAIL", "Please enter a valid e-mail address"),
            null,
            null
        );
    }
}

function RefreshOrderOverviewGrid() {
    var m_location = location.href;
    var lastchar = m_location[m_location.length - 1];
    var formattedLocation = '';
    if (lastchar == "#")
        formattedLocation = m_location.slice(0, -1);
    else
        formattedLocation = m_location;
    RedirectToLocation($.trim(formattedLocation));
}

function RedirectToDMS(type) {
    $("#DIVTempMenu").html($("#DIVMenu").html());
    $("#DIVTempMenu").find("a[id=701-780]").parent().hide();
    $.ajax({
        type: "POST",
        url: '/Login/GetMarketingToolDetails/',
        data: { type: type, menu: $("#DIVTempMenu").html() },
        success: function (data) {
            $("#DIVTempMenu").html("");
            var url = data.Url;
            window.open(url, "_blank");
        }
    });
}


//HIDE CONTEXT MENU WHEN CLICK ON ACTION 
function HideContextMenuWithClass() {
    $(".context-menu-list")
        .each(function () {
            if ($(this).css('display') == 'block') {
                $(this).trigger("contextmenu:hide");
            }
        });
}



function SetFitProfileDropdown(data, orderType, selectedFitProfileId, elementId, isForVest = false) {

    var dropdownHtml = "";
    if (data) {

        var productPartId = elementId.split('_')[1];
        if (productPartId <= 0 || productPartId == "undefined" || productPartId == undefined) {
            productPartId = "";
            elementId = elementId.split('_')[0];
        } else {
            productPartId = "_" + productPartId;
        }
        var idNmae = "fitProfileCreateList";
        var onClickFuntion = "NewFitProfileChange(this)";
        if (orderType == "Trouser") {
            onClickFuntion = "NewTrouserFitProfileChange(this)";
            if (isForVest) {
                idNmae = "adviseFitProfileCreateList";
            }
        }

        var seldivSelectedFitProfileImg = "";
        var seldivSelectedFitProfileName = "";
        var seldivSelectedFitProfileLastEdited = "";
        var cssClasimgCont_fabricCode = "";

        var optionHtml = '<ul class="dropdown-menu selectValues fitProfileScroll" id="' + idNmae + productPartId + '">';
        var default_Li = '<li class="headerLi">' +
            '                 <div id="fpName_first" class="selFitProfileItemDetail fpName nameConts">' + GetResourceText("FITPROFILEINFO_FITPROFILENAME", "Fitprofile name") + '</div>' +
            '               <div class="selFitProfileItemDetail imgConts" id="fitProfileId_first" data-fitprofileid="-1" data-fitprofileName="FitProfile name">' +
            GetResourceText("FITPROFILEINFO_FABRICLASTUSED", "Fabric last used") + '</div>' +

            '                 <div class="selFitProfileItemDetail fpLastEdited dateConts" id="fpLastEdited_first">' + GetResourceText("FITPROFILEINFO_LASTUSEDDATE", "Last used/edited on") + '</div>' +
            '           </li>';
        optionHtml = optionHtml + default_Li;
        $.each(data.CustomerFitProfiles,
            function (index, item) {

                var $customerFitProfileOption = "";
                var fabricCode = "";

                if (item.FabricCode == null || item.FabricCode == "undefined") {
                    fabricCode = '<div id="fitProfileImg_' +
                        item.Id +
                        '" class="imgCont imgCont-fabricCode">' +
                        GetResourceText('FITPROFILEINFO_NOORDERYET', 'No order yet') +
                        '</div>';

                } else {
                    fabricCode = '<div id="fitProfileImg_' +
                        item.Id +
                        '" class="imgCont imgCont-fabricCode">' +
                        item.FabricCode +
                        '</div>';
                }
                var hClass = "";
                var fitprofileProductPartId = item.ProductPartId;
                var fitprofileProductFitId = item.ProductFitId;
                if (selectedFitProfileId == item.Id) {

                    var imgFabricCode = "";
                    cssClasimgCont_fabricCode = "imgCont-fabricCode";
                    imgFabricCode = item.FabricCode;
                    hClass = "higlightedProfile";

                    seldivSelectedFitProfileImg = imgFabricCode;
                    seldivSelectedFitProfileName = item.Name;
                    seldivSelectedFitProfileLastEdited = item.LastUsedEditedDate;


                }


                var listItem = '<li class="' + hClass + '" data-productfitid="' + fitprofileProductFitId + '" data-productpartid="' + fitprofileProductPartId + '">' +
                    '               <div class="fitProfileItemDetail" id="fitProfileId_' +
                    item.Id +
                    '" data-fitprofileid="' +
                    item.Id +
                    '" data-fitprofileName="' +
                    item.Name +
                    '" onclick="' + onClickFuntion + '">' +

                    '                 <div id="fpName_' +
                    item.Id +
                    '" class="fitProfileTitle fpName nameCont">' +
                    item.Name +
                    '</div>' +
                    fabricCode +
                    '                 <div class="lastEditAlign fpLastEdited dateCont" id="fpLastEdited_' +
                    item.Id +
                    '">' +
                    item.LastUsedEditedDate +
                    '</div>' +
                    '               </div>' +
                    '           </li>';


                optionHtml = optionHtml + listItem;

            });

        var html =
            '<button id="btnFitProfileListDrp" class="btn dropdown-toggle fitProfileButton fitProfileItemDetail" data-id="0" type="button" data-toggle="dropdown" aria-expanded="true">' +
          '       <div class="selectFit alignProduct selNameCont ellipsisDiv" title="' + seldivSelectedFitProfileName+'" id="divSelectedFitProfileName' + productPartId + '">' + seldivSelectedFitProfileName + '</div>' +
          '        <div id="divSelectedFitProfileImg' + productPartId + '"title="' +seldivSelectedFitProfileImg +'" class="selImgCont ' + cssClasimgCont_fabricCode + '">' + seldivSelectedFitProfileImg +
            '        </div>' +

            '       <div class="lastEditAlign selDateCont" title="'+seldivSelectedFitProfileLastEdited+'" id="divSelectedFitProfileLastEdited' + productPartId + '">' + seldivSelectedFitProfileLastEdited + '</div>' +
            '       <div class="fa fa-chevron-down iconDown"></div>' +
            '   </button>';

        $("#" + elementId).html(html + optionHtml);

        //dropdownHtml = (html + optionHtml);

    }

    //return dropdownHtml;
}

function StringToArray(idString) {
    var result = new Array();

    if (idString != null && $.trim(idString).length > 0) {
        idString = $.trim(idString);
        var arr = idString.split(',');
        result = arr;
    }

    return result;
}

function ArrayToString(array) {
    var result = "";

    if (array != null && array.length > 0) {
        for (var i = 0; i < array.length; i++) {
            if (i > 0)
                result = result + ",";
            result = result + array[i];
        }
    }

    return result;
}

function InitializeCarousel() {

    $(".carousel").carousel();

}


function InitializeSelectPicker() {
    //$(".selectpicker").attr("title", "");
    $(".selectpicker").selectpicker({
        noneSelectedText: " "
    });
    $(".dropdown-toggle .bs-caret").addClass("fa fa-chevron-down");
    $(".dropdown-toggle .fa").removeClass("bs-caret");
    $(".dropdown-toggle .caret").css("display", "none");
    $(document).on('change', '.selectpicker', function () {
        // $(".selectpicker").prop("title", " ");
      //if()     
        $('.selectpicker').selectpicker('refresh');      
       
    });
}

function RefreshSelectPicker(element = null) {
    if (element != null) {
        //  $(".selectpicker", element).attr("title", "");
        $(".selectpicker", element).selectpicker('refresh');
        $(".selectpicker", element).selectpicker({ noneSelectedText: " " });
    }
    else {
        //  $(".selectpicker").attr("title", "");
        $(".selectpicker").selectpicker({ noneSelectedText: " " });
    }
    $(".dropdown-toggle .bs-caret").addClass("fa fa-chevron-down");
    $(".dropdown-toggle .fa").removeClass("bs-caret");
    $(".dropdown-toggle .caret").css("display", "none");
}

function RefreshCurrentSelectPicker(element) {
    //$(element).attr("title", "");

    $(element).selectpicker({ noneSelectedText: " " });
    $(element).selectpicker('refresh');
    $(".dropdown-toggle .bs-caret").addClass("fa fa-chevron-down");
    $(".dropdown-toggle .fa").removeClass("bs-caret");
    $(".dropdown-toggle .caret").css("display", "none");
}
function OnClickCloseModal(element) {
    $(element).closest(".modal").modal("hide");
}
function OnFullViewClick(fitToolId) {
    $("#modalZoomInOut_" + fitToolId).toggleClass("fa-compress fa-arrows-alt");
    $("#modalZoomInOut_" + fitToolId).closest(".fitToolImageViewer").toggleClass("fullView");

}
function BindFitToolModalOpenFullView() {
    $(".fitToolImageModal").on("show.bs.modal", function () {
        var popUpId = $(this).attr("id");
        $(".fitToolImageViewer", this).addClass("fullView");
        $(".fullViewIcon", this).addClass("hide");
        $(".carousel-indicators", this).addClass("hide");
    });

}

function BindLazyLoadForInfoImages() {
  $('.modal').on('show.bs.modal', function () {
    var currentModalID = $(this).attr("id");
    $(".lazy", $("#" + currentModalID)).lazy({
      effect: "fadeIn",
      effectTime: 0,
      threshold: 50,
      onFinishedAll: function () {
        if (!this.config("autoDestroy"))
          this.destroy();
      },
      delay: 0
    });
  })
 
}


function BindLazyLoadForDropImagesInSelectPicker() {

  $('.imgDesignOptionImgSelect').on('show.bs.dropdown', function () {
    $(".lazy",$(this)).lazy({
      effect: "fadeIn",
      effectTime: 0,
      threshold: 50,
      delay: 0
    });
  })

}

function BindLazyLoadForDropImagesInSelect2(){
  $('.dropdownImg').on('select2:open', function (e) {
    currentDropId = $(this).attr("id");
    setTimeout(function () {
      $(".lazy", $("#select2-" + currentDropId + "-results")).lazy({
        effect: "fadeIn",
        effectTime: 0,
        threshold: 50,
        onFinishedAll: function () {
          if (!this.config("autoDestroy"))
            this.destroy();
        },
        delay: 0
      },2000);
    })
   
  });
}

function InitializeDeliveryCalenderToggle() {
    var buttonEvents = $(".getsuitedataOne").data('events');
    if (buttonEvents != undefined) {
        if (buttonEvents.click != undefined) {
            return;
        }
    } else {
        $(".getsuitedataOne").click(function (event) {
            $(".detailsdataTwo").fadeOut();
            $(".detailsdataOne").slideToggle();
        });
    }




    var buttonEvents = $(".getsuitedataTwo").data('events');
    if (buttonEvents != undefined) {
        if (buttonEvents.click != undefined) {
            return;
        }
    } else {
        $(".getsuitedataTwo").click(function (event) {
            $(".detailsdataOne").fadeOut();
            $(".detailsdataTwo").slideToggle();
        });
    }



    $("#legendsContent").on("shown.bs.collapse", function () {
        document.getElementById("legendsContent").scrollIntoView({
            behavior: "smooth" // Ensures smooth scrolling
        });
        $(".collapseLegendCont .fa").removeClass("fa-plus").addClass("fa-minus")
    })
    $("#legendsContent").on("hide.bs.collapse", function () {

        $(".collapseLegendCont .fa").addClass("fa-plus").removeClass("fa-minus")
    })
    $("#disclaimerContent").on("shown.bs.collapse", function () {
        document.getElementById("disclaimerContent").scrollIntoView({
            behavior: "smooth" // Ensures smooth scrolling
        });
        $(".collapseDisclaimerCont .fa").removeClass("fa-plus").addClass("fa-minus")
    })
    $("#disclaimerContent").on("hide.bs.collapse", function () {
     
        $(".collapseDisclaimerCont .fa").addClass("fa-plus").removeClass("fa-minus")
    })
  
}

function AddBorderForFitTools(elem) {
    $("#" + elem + " select").each(function () {
        var value = $(this).val()
        if (value != "0") {
            $(this).closest("div").addClass("ValidFitTool");
        }
        else {
            $(this).closest("div").removeClass("ValidFitTool");
        }
    })
}

function AddBorderForSevenStepFitTools() {
    $(".fittoolPresentationTable select").siblings("span.select2").each(function () {
        var value = $(this).prev("select").val();
        if ($(this).prev("select").hasClass("Long")) {
            $(this).removeClass("CustomOrderValidFitTool");
        }
        else {
            if (value != "0") {
                $(this).addClass("CustomOrderValidFitTool");
            }
            else {
                $(this).removeClass("CustomOrderValidFitTool");
            }
        }
    })
}

function AddErrorBorder(elem) {
    $("#" + elem + " select").each(function () {
        var id = $(this).attr("id").split('_')[1] + '_' + $(this).attr("id").split('_')[2];
        var isRightError = $("#warningRFitTool_" + id).data("iserror");
        var isLeftError = $("#warningLFitTool_" + id).data("iserror");

        if (isRightError || isLeftError) {
            $(this).closest("div").removeClass("ValidFitTool");
            $(this).closest("div").addClass("ErrorFitTool");
        }
        else {
            var value = $(this).val();
            $(this).closest("div").removeClass("ErrorFitTool");
            if (value != "0") {
                $(this).closest("div").addClass("ValidFitTool");
            }
            else {
                $(this).closest("div").removeClass("ValidFitTool");
            }
        }
    })
}

function InitializePopover() {

    $("a.safariCautionMob").click(function () {
        if ($(this).next(".toolTipCont").hasClass("showToolTip")) {
            $(this).next(".toolTipCont").removeClass("showToolTip");
        }
        else {
            $(this).next(".toolTipCont").addClass("showToolTip");
        }

    });


}