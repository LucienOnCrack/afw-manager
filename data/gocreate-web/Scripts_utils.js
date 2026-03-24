var PANEL_NORMAL_CLASS = "CollapsiblePanel";
var PANEL_COLLAPSED_CLASS = "panelcollapsed";
var PANEL_HEADING_TAG = "h2";
var PANEL_CONTENT_CLASS = "panelcontent";
var PANEL_COOKIE_NAME = "shoppanels";
var PANEL_COOKIE_NAME_SINGLE_STEP = "shoppanelSingleStep";
var PANEL_ANIMATION_DELAY = 20; /*ms*/
var PANEL_ANIMATION_STEPS = 10;

function setUpPanels1(panelStatus) {
    loadSettings(panelStatus);

    // get all headings
    var headingTags = document.getElementsByTagName(PANEL_HEADING_TAG);

    // go through all tags
    for (var i = 0; i < headingTags.length; i++) {
        var el = headingTags[i];

        // make sure it's the heading inside a panel
        if (el.parentNode.className != PANEL_NORMAL_CLASS && el.parentNode.className != PANEL_COLLAPSED_CLASS)
            continue;

        //
        // get the text value of the tag
        var name = GetCollapseKey(el);
        //name = GetCleanName(name);

        // look for the name in loaded settings, apply the normal/collapsed class
        if (panelsStatus[name] == "false") {
            var cls = $(el.parentNode).attr('class').replace(PANEL_NORMAL_CLASS, '');
            $(el.parentNode).attr('class', cls);
            $(el.parentNode).addClass(PANEL_COLLAPSED_CLASS);
        } else if (panelsStatus[name] == "true") {
            var cls = $(el.parentNode).attr('class').replace(PANEL_COLLAPSED_CLASS, '');
            $(el.parentNode).attr('class', cls);
            $(el.parentNode).addClass(PANEL_NORMAL_CLASS);
        } else {
            // if no saved setting, see the initial setting
            panelsStatus[name] = (el.parentNode.className == PANEL_NORMAL_CLASS) ? "true" : "false";
        }

        // add the click behavor to headings
        el.onclick = function () {
            collapsiblePanel(this);
        };
    }
}

function setUpPanels() {
    loadSettings();

    // get all headings
    var headingTags = document.getElementsByTagName(PANEL_HEADING_TAG);

    // go through all tags
    for (var i = 0; i < headingTags.length; i++) {
        var el = headingTags[i];

        // make sure it's the heading inside a panel
        if (el.parentNode.className != PANEL_NORMAL_CLASS && el.parentNode.className != PANEL_COLLAPSED_CLASS)
            continue;

        //
        // get the text value of the tag
        var name = GetCollapseKey(el);
        //name = GetCleanName(name);

        // look for the name in loaded settings, apply the normal/collapsed class
        if (panelsStatus[name] == "false") {
            var cls = $(el.parentNode).attr('class').replace(PANEL_NORMAL_CLASS, '');
            $(el.parentNode).attr('class', cls);
            $(el.parentNode).addClass(PANEL_COLLAPSED_CLASS);
        } else if (panelsStatus[name] == "true") {
            var cls = $(el.parentNode).attr('class').replace(PANEL_COLLAPSED_CLASS, '');
            $(el.parentNode).attr('class', cls);
            $(el.parentNode).addClass(PANEL_NORMAL_CLASS);
        } else {
            // if no saved setting, see the initial setting
            panelsStatus[name] = (el.parentNode.className == PANEL_NORMAL_CLASS) ? "true" : "false";
        }

        // add the click behavor to headings
        el.onclick = function () {
            collapsiblePanel(this);
        };
    }
}

function SetUpPanelsForSingleStepOrder() {
    LoadSettingsForSingleStepOrder();

    // get all headings
    var headingTags = document.getElementsByTagName(PANEL_HEADING_TAG);

    // go through all tags
    for (var i = 0; i < headingTags.length; i++) {
        var el = headingTags[i];

        // make sure it's the heading inside a panel
        if (el.parentNode.className != PANEL_NORMAL_CLASS && el.parentNode.className != PANEL_COLLAPSED_CLASS)
            continue;

        //
        // get the text value of the tag
        var name = GetCollapseKey(el);
        //name = GetCleanName(name);

        // look for the name in loaded settings, apply the normal/collapsed class
        if (panelsStatus[name] == "false") {
            var cls = $(el.parentNode).attr('class').replace(PANEL_NORMAL_CLASS, '');
            $(el.parentNode).attr('class', cls);
            $(el.parentNode).addClass(PANEL_COLLAPSED_CLASS);
        } else if (panelsStatus[name] == "true") {
            var cls = $(el.parentNode).attr('class').replace(PANEL_COLLAPSED_CLASS, '');
            $(el.parentNode).attr('class', cls);
            $(el.parentNode).addClass(PANEL_NORMAL_CLASS);
        } else {
            // if no saved setting, see the initial setting
            panelsStatus[name] = (el.parentNode.className == PANEL_NORMAL_CLASS) ? "true" : "false";
        }

        // add the click behavor to headings
        el.onclick = function () {
            CollapsiblePanelSinglePageOrder(this);
        };
    }

    if ($(".divSinglePageOrderContainer").length > 0) {
        $(".divSinglePageOrderContainer .leftsectionTabbedPanleContainer .panelcollapsed").first().removeClass("panelcollapsed").addClass("CollapsiblePanel");
    }
}


function collapsiblePanel(element) {
    //disableClick(event);
    var target = element.parentNode;
    var name = GetCollapseKey(element);
    //name = GetCleanName(name);
    var collapsed = (target.className == PANEL_COLLAPSED_CLASS);
    saveSettings(name, collapsed ? "true" : "false");
    animateTogglePanel(target, collapsed);
    ToggleExpandCollapseAllLabelOnSinglePanelClick(element);
}
function CollapsiblePanelSinglePageOrder(element) {
    //disableClick(event);
    var target = element.parentNode;
    var name = GetCollapseKey(element);
    //name = GetCleanName(name);
    var collapsed = (target.className == PANEL_COLLAPSED_CLASS);
    SaveSettingsSinglePageOrder(name, collapsed ? "true" : "false");
    animateTogglePanel(target, collapsed);
    ToggleExpandCollapseAllLabelOnSinglePanelClick(element);
}


function disableClick(event) {
    event.preventDefault();
    return false;
}
function ContainsClass(element, cls) {

    if ($(element).attr('class').indexOf(cls) >= 0)
        return true;
    return false;
}


function GetCleanName(name) {
    name = name.replace(/[\r]+/, '');
    name = name.replace(/[\n]+/, '');
    name = name.replace(/[\t]+/, '');
    name = $.trim(name);
    return name;
}

function GetCollapseKey(element) {
    return element.getAttribute("data-collapsible-panel-key");
}


/**
 * Start the expand/collapse animation of the panel
 * @param panel reference to the panel div
 */
function animateTogglePanel(panel, expanding) {
    // find the .panelcontent div
    var elements = panel.getElementsByTagName("div");
    var panelContent = null;
    for (var i = 0; i < elements.length; i++) {
        if (elements[i].className == PANEL_CONTENT_CLASS) {
            panelContent = elements[i];
            break;
        }
    }

    // make sure the content is visible before getting its height
    panelContent.style.display = "block";

    // get the height of the content
    var contentHeight = panelContent.offsetHeight;

    // if panel is collapsed and expanding, we must start with 0 height
    if (expanding)
        panelContent.style.height = "0px";

    var stepHeight = contentHeight / PANEL_ANIMATION_STEPS;
    var direction = (!expanding ? -1 : 1);
    animateStep(panelContent, 1, stepHeight, direction, contentHeight);
}

/**
 * Change the height of the target
 * @param panelContent	reference to the panel content to change height
 * @param iteration		current iteration; animation will be stopped when iteration reaches PANEL_ANIMATION_STEPS
 * @param stepHeight	height increment to be added/substracted in one step
 * @param direction		1 for expanding, -1 for collapsing
 */
function animateStep(panelContent, iteration, stepHeight, direction, contentHeight) {

    //if (iteration < PANEL_ANIMATION_STEPS) {
    //    panelContent.style.height = Math.round(((direction > 0) ? iteration : 10 - iteration) * stepHeight) + "px";
    //    iteration++;
    //    setTimeout(function () { animateStep(panelContent, iteration, stepHeight, direction) }, PANEL_ANIMATION_DELAY);
    //}
    //else {
    //    // set class for the panel
    //    panelContent.parentNode.className = (direction < 0) ? PANEL_COLLAPSED_CLASS : PANEL_NORMAL_CLASS;
    //    // clear inline styles
    //    panelContent.style.display = panelContent.style.height = "";
    //}

    panelContent.style.height = contentHeight + "px";
    if (direction >= 1) {
        panelContent.parentNode.className = PANEL_NORMAL_CLASS;

    }
    else {
        // set class for the panel
        panelContent.parentNode.className =  PANEL_COLLAPSED_CLASS ;
        // clear inline styles

    }
    panelContent.style.display = panelContent.style.height = "";
}

function loadSettings(loadSettingValue) {
    // prepare the object that will keep the panel statuses
    panelsStatus = {};

    // find the cookie name
    var start = document.cookie.indexOf(PANEL_COOKIE_NAME + "=");
    if (start == -1) return;

    // starting point of the value
    start += PANEL_COOKIE_NAME.length + 1;

    // find end point of the value
    var end = document.cookie.indexOf(";", start);
    if (end == -1) end = document.cookie.length;

    // get the value, split into key:value pairs
    var cookieValue = unescape(document.cookie.substring(start, end));
    var panelsData = cookieValue.split("|");

    // split each key:value pair and put in object
    for (var i = 0; i < panelsData.length; i++) {
        var pair = panelsData[i].split(":");
        panelsStatus[pair[0]] = loadSettingValue;
    }
}
// -----------------------------------------------------------------------------------------------
// Load-Save
// -----------------------------------------------------------------------------------------------
/**
 * Reads the "panels" cookie if exists, expects data formatted as key:value|key:value... puts in panelsStatus object
 */
function loadSettings() {
    // prepare the object that will keep the panel statuses
    panelsStatus = {};

    // find the cookie name
    var start = document.cookie.lastIndexOf(PANEL_COOKIE_NAME + "=");
    if (start == -1) return;

    // starting point of the value
    start += PANEL_COOKIE_NAME.length + 1;

    // find end point of the value
    var end = document.cookie.indexOf(";", start);
    if (end == -1) end = document.cookie.length;

    // get the value, split into key:value pairs
    var cookieValue = unescape(document.cookie.substring(start, end));
    var panelsData = cookieValue.split("|");

    // split each key:value pair and put in object
    for (var i = 0; i < panelsData.length; i++) {
        var pair = panelsData[i].split(":");
        panelsStatus[pair[0]] = pair[1];
    }
}
function LoadSettingsForSingleStepOrder() {
    // prepare the object that will keep the panel statuses
    panelsStatus = {};

    // find the cookie name
    var start = document.cookie.lastIndexOf(PANEL_COOKIE_NAME_SINGLE_STEP + "=");
    if (start == -1) return;

    // starting point of the value
    start += PANEL_COOKIE_NAME_SINGLE_STEP.length + 1;

    // find end point of the value
    var end = document.cookie.indexOf(";", start);
    if (end == -1) end = document.cookie.length;

    // get the value, split into key:value pairs
    var cookieValueForSingleStep = unescape(document.cookie.substring(start, end));
    var panelsData = cookieValueForSingleStep.split("|");

    // split each key:value pair and put in object
    for (var i = 0; i < panelsData.length; i++) {
        var pair = panelsData[i].split(":");
        panelsStatus[pair[0]] = pair[1];
    }
}
function expandAll() {
    for (var key in panelsStatus)
        saveSettings(key, "true");

    setUpPanels();
}

function collapseAll() {
    for (var key in panelsStatus)
        saveSettings(key, "false");

    setUpPanels();
}

function collapseAllInContainer(containerID) {
    var headingTags = $("#" + containerID).find(PANEL_HEADING_TAG);

    for (var i = 0; i < headingTags.length; i++) {
        var el = headingTags[i];

        // make sure it's the heading inside a panel
        if (el.parentNode.className != PANEL_NORMAL_CLASS && el.parentNode.className != PANEL_COLLAPSED_CLASS)
            continue;

        // get the text value of the tag
        var name = GetCollapseKey(el);
        //name = GetCleanName(name);
        saveSettings(name, "false");
    }
    setUpPanels();
    ToggleExpandCollapseAllLabel(true);
}
function CollapseAllInContainerSingleStep(containerID){
    var headingTags = $("#" + containerID).find(PANEL_HEADING_TAG);

    for (var i = 0; i < headingTags.length; i++) {
        var el = headingTags[i];

        // make sure it's the heading inside a panel
        if (el.parentNode.className != PANEL_NORMAL_CLASS && el.parentNode.className != PANEL_COLLAPSED_CLASS)
            continue;

        // get the text value of the tag
        var name = GetCollapseKey(el);
        //name = GetCleanName(name);
        SaveSettingsSinglePageOrder(name, "false");
    }
    SetUpPanelsForSingleStepOrder();
    ToggleExpandCollapseAllLabel(true);
}
/**
 * Takes data from the panelsStatus object, formats as key:value|key:value... and puts in cookie valid for 365 days
 * @param key	key name to save
 * @paeam value	key value
 */
function saveSettings(key, value) {
    // put the new value in the object
    document.cookie = PANEL_COOKIE_NAME + "=" + "";
    panelsStatus[key] = value;

    // create an array that will keep the key:value pairs
    var panelsData = [];
    for (var key in panelsStatus)
        panelsData.push(key + ":" + panelsStatus[key]);

    // set the cookie expiration date 1 year from now
    var today = new Date();
    var expirationDate = new Date(today.getTime() + 100000 * 1000 * 60 * 60 * 24);
    // write the cookie
    document.cookie = PANEL_COOKIE_NAME + "=" + escape(panelsData.join("|")) + ";expires=" + expirationDate.toGMTString();
}


function SaveSettingsSinglePageOrder(key, value) {
    // put the new value in the object
    panelsStatus[key] = value;

    // create an array that will keep the key:value pairs
    var panelsData = [];
    for (var key in panelsStatus)
        panelsData.push(key + ":" + panelsStatus[key]);

    // set the cookie expiration date 1 year from now
    var today = new Date();
    var expirationDate = new Date(today.getTime() + 100000 * 1000 * 60 * 60 * 24);
    // write the cookie
    document.cookie = PANEL_COOKIE_NAME_SINGLE_STEP + "=" + escape(panelsData.join("|")) + ";expires=" + expirationDate.toGMTString();
}
// -----------------------------------------------------------------------------------------------
// Register setUpPanels to be executed on load
//if (window.addEventListener) {
//    // the "proper" way
//    window.addEventListener("load", setUpPanels, false);
//}
//else
//    if (window.attachEvent) {
//        // the IE way
//        window.attachEvent("onload", setUpPanels);
//    }


function expandSinglePanel(h2Element) {
    /// <summary>Expand the single H2 element.</summary>
    /// <param name="H2 Element" type="string">This parameter should be H2 ELement</param>
    /// <returns type="Number">Nothing.</returns>

    // get the text value of the tag
    var name = GetCollapseKey(h2Element);
    //name = GetCleanName(name);
    saveSettings(name, "true");

    setUpPanels1(true);
}

function collapseSinglePanel(h2Element) {

    /// <summary>Collapse the single H2 element.</summary>
    /// <param name="H2 Element" type="string">This parameter should be H2 ELement</param>
    /// <returns type="Number">Nothing.</returns>

    // get the text value of the tag
    var name = GetCollapseKey(h2Element);
    //name = GetCleanName(name);
    saveSettings(name, "false");

    setUpPanels();
}

function expandAllInContainer(containerID) {
    var headingTags = $("#" + containerID).find(PANEL_HEADING_TAG);

    for (var i = 0; i < headingTags.length; i++) {
        var el = headingTags[i];

        // make sure it's the heading inside a panel
        if (el.parentNode.className != PANEL_NORMAL_CLASS && el.parentNode.className != PANEL_COLLAPSED_CLASS)
            continue;

        // get the text value of the tag
        var name = GetCollapseKey(el);
        //name = GetCleanName(name);
        saveSettings(name, "true");
    }
    setUpPanels1(true);
    ToggleExpandCollapseAllLabel(false);
}

function ToggleExpandCollapseAllLabel(showExpandAll){
    if ($("#sp_expandAll").length > 0 && $("#sp_collapseAll").length > 0) {
        if (showExpandAll) {
            $("#sp_expandAll").show();
            $("#sp_collapseAll").hide();
        } else {
            $("#sp_expandAll").hide();
            $("#sp_collapseAll").show();
        }
    }
}

function ToggleExpandCollapseAllLabelOnSinglePanelClick(element) {
    if ($(element).closest("div.tab-container").find("div.expandcollapsetogglediv").length > 0) {
        var collapsibleClassName = element.parentElement.className;
        var allHavingSameClass = true;
        $(element).parent().siblings("div").each(function(index, divElement) {
            allHavingSameClass = divElement.className === collapsibleClassName;
            if (!allHavingSameClass)
                return false;
        });
        if (allHavingSameClass) {
            if (collapsibleClassName === PANEL_NORMAL_CLASS) {
                ToggleExpandCollapseAllLabel(false);
            } else if (collapsibleClassName === PANEL_COLLAPSED_CLASS) {
                ToggleExpandCollapseAllLabel(true);
            }
        }
    }
}

function ToggleExpandCollapseAllLabelOnPageLoad(parentClassName) {
    if ($("div." + parentClassName + ":visible").find("div." + PANEL_NORMAL_CLASS).length > 0) {
        ToggleExpandCollapseAllLabelOnSinglePanelClick($("div." + parentClassName + ":visible")
            .find("div." + PANEL_NORMAL_CLASS).children("h2")[0]);
    } else if ($("div." + parentClassName + ":visible").find("div." + PANEL_COLLAPSED_CLASS).length > 0) {
        ToggleExpandCollapseAllLabelOnSinglePanelClick($("div." + parentClassName + ":visible")
            .find("div." + PANEL_COLLAPSED_CLASS).children("h2")[0]);
    }
}