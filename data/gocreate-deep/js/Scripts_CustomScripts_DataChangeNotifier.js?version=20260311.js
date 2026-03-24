var _changeNotifier = new function () {
    var isChanged = false;
    var changeNotifier = this;
    var excludedFields = [];
    this.SetupDataChangeNotifier = function () {
        $(window).bind("beforeunload", onBeforeUnload);
        $(":input[type!='hidden']").change(onControlChanged);
        $(":submit").click(this.ResetAllChanges);
    };

    // Private method
    function onControlChanged(eventArgs) {
        var currentId = $(eventArgs.target).prop('id');
        if (typeof (excludedFields[currentId]) == 'undefined')
            isChanged = true;
    }
    function onBeforeUnload(eventArgs) {
        if (changeNotifier.IsChangeDetected())
            return GetResourceText("DATA_CHANGE_NOTIFICATION", "If you leave this page without saving the changes in settings are not saved.");
        return undefined;
    }

    // Public Method
    this.DoNotTrackField = function (element) {
        var currentId = $(element).attr('id');
        excludedFields[currentId] = true;
    };
    this.IsChangeDetected = function () {
        return isChanged;
    };
    this.ResetAllChanges = function () {
        excludedFields = [];
        isChanged = false;
        return true;
    };
};

window.ChangeNotifier = _changeNotifier;

