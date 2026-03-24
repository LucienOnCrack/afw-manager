function LaunchSavedBodyMeasurements(orderId) {
    var myWindow = window.open(bodyMeasurementUrl + "?orderId=" + orderId, 'bodymeasurement', 'width=700,location=no,titlebar=no,toolbar=no,resizable=no,scrollbars=no');
    myWindow.resizeTo(650, 770);
}