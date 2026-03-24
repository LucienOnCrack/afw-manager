//var ecomPaymentRequestDtoSaved;
//var ecomPaymentSessionIdSaved;
//var redirectUrlSaved;

//function DisplayPaymentMethods(ecomPaymentRequestDto, ecomPaymentSessionId, redirectUrl) {
//    if (ecomPaymentRequestDto != null && ecomPaymentRequestDto != undefined) {
//        ecomPaymentRequestDto.transactionAmount = $('#TotalAmount').val();
//        ecomPaymentRequestDtoSaved = ecomPaymentRequestDto;
//    }

//    ecomPaymentSessionIdSaved = ecomPaymentSessionId;
//    redirectUrlSaved = redirectUrl;

//    $.ajax(
//        {
//            type: "POST",
//            url: SHOWROOM_API_URL + "/EcomPayment/GetPaymentMethods",
//            contentType: 'application/json;charset=utf-8',
//            data: JSON.stringify(ecomPaymentRequestDto),
//            success: function (data) {
//                jsonString = data;
//                const configuration = {
//                    paymentMethodsResponse: JSON.parse(data.Response),
//                    //...data.AdyenEnviornmentMode == "Live" && { originKey: data.OriginalKey },
//                    originKey: data.OriginalKey,
//                    clientKey: data.ClientKey,
//                    locale: data.ShopperLocale,
//                    environment: data.AdyenEnviornmentMode,
//                    amount: { value: data.Amount, currency: data.Currency },
//                    removePaymentMethods: ["paysafecard", "paypal"],
//                    onSubmit: (state, dropin) => {

//                        // Your function calling your server to make the `/payments` request
//                        makeAdyenCreditCardPayment(state.data, dropin, ecomPaymentSessionId, configuration.amount, redirectUrl, ecomPaymentRequestDto.shopId, ecomPaymentRequestDto.email);

//                    },
//                    onAdditionalDetails: (state, dropin) => {

//                        // Your function calling your server to make a `/payments/details` request
//                        makeDetailsCall(state.data, dropin);
//                    },
//                    paymentMethodsConfiguration: {
//                        card: { // Example optional configuration for Cards
//                            hasHolderName: true,
//                            holderNameRequired: true,
//                            enableStoreDetails: false,
//                            hideCVC: false, // Change this to true to hide the CVC field for stored cards
//                            name: 'Credit or debit card'
//                        }
//                    }
//                };

//                const checkout = new AdyenCheckout(configuration);
//                const dropin = checkout.create('dropin').mount('#dropin-container');
//            },
//            error: function (a, b, c) {
//                ShowConfirmationModalDialogWithCustomizeText(GetResourceText("RETRY_PAYMENT", "Retry payment"),
//                    GetResourceText("RETRY_PAYMENT_CONFIRMATION", "There is some problem with payment. Do you want to try again?"), 
//                    DisplayPaymentMethodsCallback,
//                    goBackScreen, null, GetResourceText("YES_CLIENT_MSG", "Yes"), GetResourceText("NO_CLIENT_MSG", "No"));
//            }

//        });
//}

//var goBackScreen = function () {window.location.href = redirectUrlSaved };

//var DisplayPaymentMethodsCallback = function () {
//    setTimeout(function() {
//          DisplayPaymentMethods(ecomPaymentRequestDtoSaved, ecomPaymentSessionIdSaved, redirectUrlSaved);
//        }, 500);
//};

function makeAdyenCreditCardPayment(data, dropin, ecomPaymentSessionId, amount, redirectUrl, shopId, email) {

    var creditCardPaymentRequest = {
        PaymentRequest: data,
        EcomPaymentSessionId: ecomPaymentSessionId,
        Amount: amount,
        InternalRedirectUrl: redirectUrl,
        ShopId: shopId,
        CustomerEmail: email,
        ApplicationType: 'SHOP'
    }
    $.ajax({
        data: JSON.stringify(creditCardPaymentRequest),
        url: SHOWROOM_API_URL + "/EcomPayment/MakeCreditCardB2BPayment",
        type: "POST",
        contentType: 'application/json;charset=utf-8',
        success: function (data) {
            if (data.IsPaymentSuccessful) {
                handleServerResponse(data, dropin);
            }
            else {
                ShowErrorDialog("", "Payment failed", null, null);
            }
        },
        error: function () {
            ShowErrorDialog("", "Something went wrong. Please try later.", null, null);
        }
    }
    );
}


function handleServerResponse(res, component) {

    /*window.hiddenAsyncCall = true;*/
    var actionMethod = JSON.parse(res.PaymentResponse);
    var ecomPaymentSessionId = res.EcomPaymentSessionId;

    if (actionMethod.action) {
        //For Ideal Payment method
        component.handleAction(actionMethod.action);
    } else {
        //For credit Card Payment method
        $.ajax({
            data: { merchantRef: res.MerchantReference, ecomPaymentSessionId: res.EcomPaymentSessionId },
            url: "/AdyenPayment/ProcessPayment",
            type: "POST",
            success: function (result) {
                if (result != null) {

                    if (result.Status) {
                        $("#confirmationDetails").html(result.ReturnHtml);
                        $("#paymentConfirmation").modal();
                        $("body").addClass("noBackgroundScroll");
                    } else {
                        $("#confirmationDetails").html(result.ErrMsg);
                        $("#paymentConfirmation").modal();

                    }
                }
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                $("#divCardSwipeOverlay").addClass("hide");
                alert("Something went wrong in handleServerResponse");
            }
        });
    }
}


// Typical checkout experience
async function startCheckout(ecomPaymentRequest, ecomPaymentSessionId, billingAddressId, isCallForB2B, redirectUrl) {
    const checkoutSessionResponse = await sendPostRequest(SHOWROOM_API_URL + "EcomPayment/GetPaymentMethods", ecomPaymentRequest);
    try {
        const { AdyenCheckout, Dropin, Card, GooglePay, PayPal } = window.AdyenWeb;
        const amount = { value: checkoutSessionResponse.Amount, currency: checkoutSessionResponse.Currency };

        const checkout = await AdyenCheckout({

            environment: checkoutSessionResponse.AdyenEnviornmentMode,
            clientKey: checkoutSessionResponse.ClientKey,
            paymentMethodsResponse: JSON.parse(checkoutSessionResponse.Response),
            amount: amount,
            countryCode: ecomPaymentRequest.countryCode,
            removePaymentMethods: ["applepay"],
            onSubmit: (state, dropin, actions) => {
                makeAdyenCreditCardPayment(state.data, dropin, ecomPaymentSessionId, amount, redirectUrl, ecomPaymentRequest.shopId, ecomPaymentRequest.email);
            },
            onAdditionalDetails: (state, dropin) => {
                makeDetailsCall(state.data, dropin);
            },
            paymentMethodsConfiguration: {
                card: {
                    hasHolderName: true,
                    holderNameRequired: true,
                    enableStoreDetails: false
                }
            }
        });

        // Mount Drop-in (excluding Apple Pay)
        const dropin = new Dropin(checkout).mount('#dropin-container');
    } catch (error) {
        console.error(error);

    }
}

//// Some payment methods use redirects. This is where we finalize the operation
//async function finalizeCheckout() {
//    try {
//        const checkout = await createAdyenCheckout({
//            id: sessionId
//        });
//        checkout.submitDetails({
//            details: {
//                redirectResult
//            }
//        });
//    } catch (error) {
//        console.error(error);
//        alert("Error occurred. Look at console for details");
//    }
//}



//async function createAdyenCheckout(data, ecomPaymentSessionId, billingAddressId, ecomPaymentRequestDto, isCallForB2B, redirectUrl) {
//    const { AdyenCheckout, Dropin, Card, GooglePay, PayPal } = window.AdyenWeb;

//    var customerId = $("#HDSelectedCustomerId").val();
//    var amount = parseInt(parseFloat($("#hdnPaybleDownPayment").val()) * 100);
//    var result;

//    var jsonString = data;

//    //const applePayConfiguration = {
//    //    amount: {
//    //        value: amount,
//    //        currency: ecomPaymentRequestDto.currency
//    //    },
//    //    countryCode: ecomPaymentRequestDto.countryCode,
//    //    onClick: (resolve, reject) => {
//    //        result = ValidateOrderBeforePaymentForApplePay(ecomPaymentSessionId);
//    //        if (result.IsValid) {
//    //            applePayConfiguration.amount.value = result.UpdatedAmount.value;
//    //            resolve();
//    //        } else {
//    //            reject();
//    //        }
//    //    },
//    //};

//    const configuration = {
//        paymentMethodsResponse: JSON.parse(data.Response),
//        originKey: data.OriginalKey,
//        clientKey: data.ClientKey,
//        locale: data.ShopperLocale,
//        environment: data.AdyenEnviornmentMode,
//        amount: { value: data.Amount, currency: data.Currency },
//        removePaymentMethods: ["paysafecard", "paypal"],
//        countryCode: ecomPaymentRequestDto.countryCode,
//        onSubmit: (state, dropin, actions) => {
//            // Your function calling your server to make the `/payments` request
//            makeAdyenCreditCardPayment(state.data, dropin, ecomPaymentSessionId, configuration.amount, redirectUrl, ecomPaymentRequestDto.shopId, ecomPaymentRequestDto.email);


//        },
//        onAdditionalDetails: (state, dropin) => {
//            // Your function calling your server to make a `/payments/details` request
//            makeDetailsCall(state.data, dropin);
//        },
//        paymentMethodsConfiguration: {
//            card: { // Example optional configuration for Cards
//                hasHolderName: true,
//                holderNameRequired: true,
//                enableStoreDetails: false,
//                hideCVC: false, // Change this to true to hide the CVC field for stored cards
//                name: 'Credit or debit card'
//            }
//            //,applepay: applePayConfiguration
//        }
//    };
//    return await AdyenCheckout(configuration);
//}

// Sends POST request
async function sendPostRequest(url, ecomPaymentRequest) {
    const res = await fetch(url, {
        method: "POST",
        body: ecomPaymentRequest ? JSON.stringify(ecomPaymentRequest) : "",
        headers: {
            "Content-Type": "application/json;charset=utf-8",
        },
    });

    return await res.json();
}




function DisplayPaymentMethods(ecomPaymentRequestDto, ecomPaymentSessionId, billingAddressId, isCallForB2B = false, redirectUrl = null) {
    startCheckout(ecomPaymentRequestDto, ecomPaymentSessionId, billingAddressId, isCallForB2B, redirectUrl);
}


