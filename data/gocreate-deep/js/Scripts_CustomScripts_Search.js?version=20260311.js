var SEARCH_PANEL_VISIBLE_HEIGHT = 147;

var tablehight;
$(document).ready(function () {
    $('#advancedsearch').click(function () {
        $("#advanceSearchDiv").slideToggle(function () {

            AdjustOverviewPageHeight();
            RefreshSuperTable(gridTableId, "GridContainer", 1);
            Grid_Load(noCloumnToFreeze, gridTableId);
        });

    });

});



function OnOverviewSearchButtonClick() {
    //$(".AdvancedSearch").hide();
    AdjustOverviewPageHeight();
}


function OnExpand() {
}

function OnCollapse() {
}



function OnSearchComplete() {

    LoadMunroDropDowns();
}