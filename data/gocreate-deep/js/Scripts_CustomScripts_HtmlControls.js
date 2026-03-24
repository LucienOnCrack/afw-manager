var LblText = "LBL_";

function GetDropDown(data, controlId, selectedValue, cssClass, onchangeEvent, attibutes) {
    var css = "form-control selectpicker" +" "+ cssClass;
    var attrStr = ResolveAttribute(attibutes);
    var items = "<option value='' selected></option>";
    $.each(data, function (i, item) {

        if (item.ID === selectedValue) {
            items += "<option selected = 'selected' value='" + item.ID + "'>" + item.Name + "</option>";
        } else {
            items += "<option value='" + item.ID + "'>" + item.Name + "</option>";
        }
    });

    var select = '<select title="" class="' + css + '" id="' + controlId + '" name="' + controlId + '""  onChange= "' + onchangeEvent + '"  ' + attrStr + '  >' + items + "</select>";

    return select;
}

function GetDropDownWithNoBlank(data, controlId, selectedValue, cssClass, onchangeEvent, attributes) {

    var css = "form-control " + cssClass;

    var items = "";
    $.each(data, function (i, item) {

        if (item.ID === selectedValue) {
            items += "<option selected = 'selected' value='" + item.ID + "'>" + item.Name + "</option>";
        } else {
            items += "<option value='" + item.ID + "'>" + item.Name + "</option>";
        }

    });

    var select = '<select class="' + css + '" id="' + controlId + '" name="' + controlId + '""  onChange= "' + onchangeEvent + '"  ' + attributes + ' >' + items + "</select>";

    return select;
}

function GetSelectPickerDropDownWithNoBlank(data, controlId, selectedValue, cssClass, onchangeEvent, attributes) {

    var css = "form-control selectpicker" +" "+ cssClass;

    var items = "";
    $.each(data, function (i, item) {

        if (item.ID === selectedValue) {
            items += "<option selected = 'selected' value='" + item.ID + "'>" + item.Name + "</option>";
        } else {
            items += "<option value='" + item.ID + "'>" + item.Name + "</option>";
        }

    });

    var select = '<select class="' + css + '" id="' + controlId + '" name="' + controlId + '""  onChange= "' + onchangeEvent + '"  ' + attributes + ' >' + items + "</select>";

    return select;
}

function GetTextBox(data, controlId, value, cssClass) {

    var css = "form-control " + cssClass;

    var textBox = '<input type="text" style="padding-left:15px" id="' + controlId + '"  name = "' + controlId + '" value="' + value + '" class="' + css + '"/>';

    return textBox;

}

function GetTextBoxWithDisabled(data, controlId, value, cssClass) {

    var css = "form-control " + cssClass;

    var textBox = '<input type="text" style="padding-left:15px" id="' + controlId + '" name = "' + controlId + '" disabled="disabled"  value="' + value + '" class="' + css + '"/>';

    return textBox;
}

function GetTextBoxWithHidden(data, controlId, hiddenId, value, cssClass) {

    var css = "form-control " + cssClass;

    var textBox = '<input type="text" id="' + controlId + '" name = "' + controlId + '"  value="' + value + '" class="' + css + '"/>';
    var hidden = '<input type="hidden" id="' + hiddenId + '" name = "' + controlId + '"  value= "' + value + '"/>';

    textBox = textBox + hidden;

    return textBox;

}

function GetNumericBox(data, controlId, value, cssClass, minValue, maxValue, attributes) {

    var attributeStr = ResolveAttribute(attributes);

    var css = "form-control " + cssClass;

    var textBox = '<input type="number" id="' + controlId + '"  name = "' + controlId + '" value="' + value + '" class="' + css + '" ';

    if (minValue || minValue == 0)
        textBox += ' min=' + minValue + ' ';

    if (maxValue)
        textBox += ' max=' + maxValue + ' ';

    textBox += ' ' + attributeStr + '  />';

    return textBox;
}

function GetHiddenField(controlId, value) {

    var hiddenField = '<input type="hidden" id="' + controlId + '" name = "' + controlId + '" value= "' + value + '"/>';

    return hiddenField;

}

function GetDropDownForMakes(data, controlId, selectedValue, cssClass, onchangeEvent, attibutes) {
    var css = "form-control " + cssClass;

    var items = "";
    $.each(data, function (i, item) {

        if (item.ID === selectedValue) {
            items += "<option selected = 'selected' value='" +
                item.ID +
                "'  data-productpartid= '" +
                item.ProductPartId +
                "'  data-makeid= '" +
                item.MakeId +
                "'  data-makeextradays= '" +
                item.MakeExtraDays +
                "'  data-makerprice= '" +
                item.MakeRPrice +
                "'>" +
                item.Name +
                "</option>";
        } else {
            items += "<option value='" +
                item.ID +
                "'  data-productpartid= '" +
                item.ProductPartId +
                "'  data-makeid= '" +
                item.MakeId +
                "'  data-makeextradays= '" +
                item.MakeExtraDays +
                "'  data-makerprice= '" +
                item.MakeRPrice +
                "'>" +
                item.Name +
                "</option>";
        }
    });

    var select = '<select class="' + css + '" id="' + controlId + '" name="' + controlId + '""  onChange= "' + onchangeEvent + '"  "' + attibutes + '"  >' + items + "</select>";

    return select;
}


function GetDropDownForMakesWithEmpty(data, controlId, selectedValue, cssClass, onchangeEvent, attibutes) {

    var css = "form-control " + cssClass;

    var items = "<option value=''></option>";
    $.each(data, function (i, item) {

        if (item.ID === selectedValue) {
            items += "<option selected = 'selected' value='" +
                item.ID +
                "'  data-productpartid= '" +
                item.ProductPartId +
                "'  data-makeid= '" +
                item.MakeId +
                "'  data-makeextradays= '" +
                item.MakeExtraDays +
                "'  data-makerprice= '" +
                item.MakeRPrice +
                "'>" +
                item.Name +
                "</option>";
        } else {
            items += "<option value='" +
                item.ID +
                "'  data-productpartid= '" +
                item.ProductPartId +
                "'  data-makeid= '" +
                item.MakeId +
                "'  data-makeextradays= '" +
                item.MakeExtraDays +
                "'  data-makerprice= '" +
                item.MakeRPrice +
                "'>" +
                item.Name +
                "</option>";
        }
    });

    var select = '<select class="' + css + '" id="' + controlId + '" name="' + controlId + '""  onChange= "' + onchangeEvent + '"  "' + attibutes + '"  >' + items + "</select>";

    return select;
}

function GetDropDownForModelsWithEmpty(data, controlId, selectedValue, cssClass, onchangeEvent, attibutes) {

    var css = "form-control " + cssClass;

    var items = "<option value=''></option>";
    $.each(data, function (i, item) {

        if (item.ID === selectedValue) {
            items += "<option selected = 'selected' value='" + item.ID + "'  data-productpartid= '" + item.ProductPartId + "'  data-makeid= '" + item.MakeId + "'  data-makeextradays= '" + item.MakeExtraDays + "'  data-makerprice= '" + item.MakeRPrice + "' data-tuxedo= '" + item.IsTuxedoModel + "'>" +
                item.Name +
                "</option>";
        } else {
            items += "<option value='" + item.ID + "'  data-productpartid= '" + item.ProductPartId + "'  data-makeid= '" + item.MakeId + "'  data-makeextradays= '" + item.MakeExtraDays + "'  data-makerprice= '" + item.MakeRPrice + "'" + "'  data-tuxedo= '" + item.IsTuxedoModel + "'>" + item.Name + "</option>";
        }
    });

    var select = '<select class="' + css + '" id="' + controlId + '" name="' + controlId + '""  onChange= "' + onchangeEvent + '"  "' + attibutes + '"  >' + items + "</select>";

    return select;
}


function GetDropDownForButtons(data, controlId, selectedValue, cssClass, onchangeEvent) {
    var css = "form-control " + cssClass;

    var items = "<option value='' selected></option>";
    $.each(data, function (i, item) {

        if (item.ID === selectedValue) {
            items += "<option selected = 'selected' value='" +
                item.ID +
                "'  data-extradays= '" +
                item.ExtraDays +
                "' data-rprice= '" +
                item.RPrice +
                "'    >" +
                item.Name +
                "</option>";
        } else {
            items += "<option value='" +
                item.ID +
                "'  data-extradays= '" +
                item.ExtraDays +
                "' data-rprice= '" +
                item.RPrice +
                "'    >" +
                item.Name +
                "</option>";
        }


    });

    var select = '<select class="' + css + '" id="' + controlId + '" name="' + controlId + '""  onChange= "' + onchangeEvent + '"  >' + items + "</select>";

    return select;
}

function GetDropDownForPipings(data, controlId, selectedValue, cssClass, onchangeEvent) {
    var css = "form-control " + cssClass;

    var items = "<option value='' selected></option>";

    $.each(data, function (i, item) {

        if (item.ID === selectedValue) {
            items += "<option selected = 'selected' value='" +
                item.ID +
                "'  data-extradays= '" +
                item.ExtraDays +
                "'    >" +
                item.Name +
                "</option>";
        } else {
            items += "<option value='" +
                item.ID +
                "'  data-extradays= '" +
                item.ExtraDays +
                "'    >" +
                item.Name +
                "</option>";
        }


    });

    var select = '<select class="' + css + '" id="' + controlId + '" name="' + controlId + '""  onChange= "' + onchangeEvent + '"  >' + items + "</select>";

    return select;
}

function GetDropDownForDesignOptions(data, controlId, selectedValue, cssClass, onchangeEvent, attribute) {
    var css = "form-control"+ cssClass;

    var attrubuteStr = null;
    if (attribute) {
        attrubuteStr = ResolveAttribute(attribute);
    }

    var items = "";
    $.each(data, function (i, item) {

        if (item.ID === selectedValue) {
            items += "<option selected = 'selected' value='" +
                item.ID +
                "'  data-extradays= '" +
                item.ExtraDays +
                "' data-rprice= '" +
                item.RPrice +
                "'>" +
                item.Name +
                "</option>";
        } else {
            items += "<option value='" +
                item.ID +
                "'  data-extradays= '" +
                item.ExtraDays +
                "' data-rprice= '" +
                item.RPrice +
                "'>" +
                item.Name +
                "</option>";
        }

    });

    var select = '<select class="' + css + '" id="' + controlId + '" name="' + controlId + '""  onChange= "' + onchangeEvent + '" ' + attrubuteStr + ' >' + items + "</select>";

    return select;
}
function GetSelectPickerForDesignOptions(data, controlId, selectedValue, cssClass, onchangeEvent, attribute, IsBubbleImageAvailble) {
    var css = "form-control selectpicker imgDesignOptionImgSelect"+" "+ cssClass;

    var attrubuteStr = null;
    if (attribute) {
        attrubuteStr = ResolveAttribute(attribute);
    }
   
    var items = "";
    $.each(data, function (i, item) {
        var imgTemplate = "";
        var selectedOptTemplate = "";
        selectedOptTemplate = "<span class= paddingLeft10 spnExpertOptionColour >" + item.Name + "</span>";
        imgTemplate = "<img class='imgDesignOptionColour lazy' data-src='" + item.ImagePath + "'/> <span class='paddingLeft10 spnExpertOptionColour '>" + item.Name + "</span>";
        if (IsBubbleImageAvailble && item.ImagePath && item.ImagePath != undefined && item.ImagePath.trim() != "") {
            if (item.ID === selectedValue) {
                items += '<option selected = "selected" value="' + item.ID + '" data-extradays= "' + item.ExtraDays + '" data-rprice= "' +
                    item.RPrice + '" data-content="' + imgTemplate + '" title="' + selectedOptTemplate + '" >' + item.Name +
                    '</option>';
            }
            else {
                items += '<option value="' + item.ID + '" data-extradays= "' + item.ExtraDays + '"  data-rprice= "' +
                    item.RPrice + '" data-content="' + imgTemplate + '" title="' + selectedOptTemplate + '">' + item.Name +
                    '</option>';
            }

        }
        else {
            if (item.ID === selectedValue) {
                items += "<option selected = 'selected' value='" +
                    item.ID +
                    "'  data-extradays= '" +
                    item.ExtraDays +
                    "' data-rprice= '" +
                    item.RPrice +
                    "'>" +
                    item.Name +
                    "</option>";
            } else {
                items += "<option value='" +
                    item.ID +
                    "'  data-extradays= '" +
                    item.ExtraDays +
                    "' data-rprice= '" +
                    item.RPrice +
                    "'>" +
                    item.Name +
                    "</option>";
            }
        }
            

        

    });

    var select = '<select class="' + css + '" id="' + controlId + '" name="' + controlId + '""  onChange= "' + onchangeEvent + '" ' + attrubuteStr + ' >' + items + "</select>";

    return select;
}
function GetLabel(controlId, text, cssClass) {

    var css = cssClass;

    var id = LblText + controlId;

    var label = '<label id=' + id + ' class="' + css + '"  >' +
        text +
        '</label>';

    return label;

}

function GetToggleButton(controlId, defaultValue, callBack) {
    var toggle = "";
    if (defaultValue) {
        toggle = '<label class="switch"><input type="checkbox" id= ' + controlId + ' name = ' + controlId + ' onclick = ' + callBack + ' checked = "checked"><div class="slider round"></div></label>';
    } else {
        toggle = '<label class="switch"><input type="checkbox" id= ' + controlId + ' name = ' + controlId + '  onclick = ' + callBack + '><div class="slider round"></div></label>';
    }


    return toggle;

}

function GetDyoOrderLabelsDropDown(data, controlId, selectedValue, cssClass, onchangeEvent, extraAttribute) {
    var css = "form-control " + cssClass;

    var items = "";
    $.each(data, function (i, item) {
        if (item.ShopLabelID === selectedValue) {
            items += "<option selected = 'selected' value='" + item.ShopLabelID + "'>" + item.ShopLabelName + "</option>";
        } else {
            items += "<option value='" + item.ShopLabelID + "'>" + item.ShopLabelName + "</option>";
        }

    });

    var select = '<select class="' + css + '" id="' + controlId + '" name="' + controlId + '""  onChange= "' + onchangeEvent + '" ' + extraAttribute + '  >' + items + "</select>";

    return select;
}

function GetShoeOrderLabelsDropDown(data, controlId, selectedValue, cssClass, onchangeEvent, extraAttribute, label) {
    var css = "form-control selectpicker " + cssClass;

    var items = "";
    $.each(data, function (i, item) {
        if (item.ShopLabelID === selectedValue)
            items += "<option value='" + item.ShopLabelID + "' selected>" + item.ShopLabelName + "</option>";
        else
            items += "<option value='" + item.ShopLabelID + "'>" + item.ShopLabelName + "</option>";
    });

    var select = '<select class="' + css + '" id="' + controlId + '" name="' + controlId + '""  onChange= "' + onchangeEvent + '" ' + extraAttribute + ' data-internalName="' + label.LabelPositionInternalName +'">' + items + "</select>";

    return select;
}

function GetTieOrderLabelsDropDown(data, controlId, selectedValue, cssClass, onchangeEvent, extraAttribute) {
    var css = "form-control " + cssClass;

    var items = "";
    $.each(data, function (i, item) {
        if (item.ShopLabelID === selectedValue)
            items += "<option value='" + item.ShopLabelID + "' selected>" + item.ShopLabelName + "</option>";
        else
            items += "<option value='" + item.ShopLabelID + "'>" + item.ShopLabelName + "</option>";
    });

    var select = '<select class="' + css + '" id="' + controlId + '" name="' + controlId + '""  onChange= "' + onchangeEvent + '" ' + extraAttribute + ' >' + items + "</select>";

    return select;
}


function GetBlankRow() {
    var row = '<div class="row row-fluid">' +
        '<div class="col-xs-12 col-sm-12 col-md-12 col-lg-12" style="height:5vh">' +


        '</div>' +
        '</div>';

    return row;
}

function GetDropDownWithDisable(data, controlId, selectedValue, cssClass, onchangeEvent) {
    var css = "form-control " + cssClass;

    var items = "<option value='' selected></option>";
    $.each(data, function (i, item) {
        if (item.ID === selectedValue) {
            items += "<option selected = 'selected'  value='" + item.ID + "'>" + item.Name + "</option>";
        } else {
            items += "<option value='" + item.ID + "'>" + item.Name + "</option>";
        }
    });

    var select = '<select class="' + css + '" id="' + controlId + '" name="' + controlId + '""  disabled = "disabled" onChange= "' + onchangeEvent + '"  >' + items + "</select>";

    return select;
}
function GetDropDownWithDisableShoes(data, controlId, selectedValue, cssClass, onchangeEvent) {
    var css = "form-control selectpicker"+" " + cssClass;

    var items = "<option value='' selected></option>";
    $.each(data, function (i, item) {
        if (item.ID === selectedValue) {
            items += "<option selected = 'selected'  value='" + item.ID + "'>" + item.Name + "</option>";
        } else {
            items += "<option value='" + item.ID + "'>" + item.Name + "</option>";
        }
    });

    var select = '<select class="' + css + '" id="' + controlId + '" name="' + controlId + '""  disabled = "disabled" onChange= "' + onchangeEvent + '"  >' + items + "</select>";

    return select;
}

function GetMonoGramTextBox(data, controlId, value, cssClass, attribute) {
    var attrStr = ResolveAttribute(attribute);

    var css = "form-control " + cssClass;

    attribute = attribute != null ? attribute : "";

    var textBox = '<input type="text" ' + attribute + '  id="' + controlId + '"  name = "' + controlId + '" data-required="1" value="' + value + '" class="' + css + '" ' + attrStr + ' />';

    return textBox;

}

function GetBlackColumn(colSpan) {

    var col = 'col-xs-' + colSpan + ' col-sm-' + colSpan + ' col-md-' + colSpan + ' col-lg-' + colSpan + '';

    return '<div class="' + col + '">' +
        '</div>';
}

function GetButton(controlId, css, clickEvent, style, attribute) {

    var attrStr = ResolveAttribute(attribute);

    var button = "<button " +
        "id=" + controlId + " " +
        "type='button' " +
        "class=" + css + " " +
        "onclick=" + clickEvent + " " +
        "style= " + style + " " + attrStr + ">Add size</button>";

    return button;

}

function ResolveAttribute(attributes) {
    var attrStr = "";
    if (attributes) {
        for (var i = 0; i < attributes.length; i++) {
            attrStr = attrStr + attributes[i].Name + "=" + attributes[i].Value + " ";
        }
    }
    return attrStr;
}

function ResolveAttributeValue(attributes) {
    var attrStr = "";
    if (attributes) {
        for (var i = 0; i < attributes.length; i++) {
            attrStr = attrStr + attributes[i].Name + "='" + attributes[i].Value + "'";
        }
    }
    return attrStr;
}

function FillDropDownData(controlId, data, selectedValue) {

    $(controlId).html("");
    $(controlId).append($('<option></option>').val(-1).html(""));
    $.each(data.Combinations, function (val, item) {
        $(controlId).append($('<option></option>').val(item.ID).html(item.Name));
    });
    if (selectedValue)
        $(controlId).val(selectedValue);
}



function GetDropDownForTryOnType(data, controlId, selectedValue, cssClass, onchangeEvent, attibutes) {
    var css = "form-control selectpicker " + cssClass;
    var attrStr = ResolveAttribute(attibutes);
    var items = "";
    $.each(data, function (i, item) {

        if (item.TryOnTypeId === selectedValue) {
            items += "<option selected = 'selected' value='" + item.TryOnTypeId + "'>" + item.TryOnType + "</option>";
        } else {
            items += "<option value='" + item.TryOnTypeId + "'>" + item.TryOnType + "</option>";
        }
    });

    var select = '<select class="' + css + '" id="' + controlId + '" name="' + controlId + '""  onChange= "' + onchangeEvent + '"  ' + attrStr + '  >' + items + "</select>";

    return select;
}


