var floating_recipient_bar = (function () {

var exports = {};


var is_floating_recipient_bar_showing = false;

function show_floating_recipient_bar() {
    if (!is_floating_recipient_bar_showing) {
        $("#floating_recipient_bar").css('visibility', 'visible');
        is_floating_recipient_bar_showing = true;
    }
}

var old_label;
function replace_floating_recipient_bar(desired_label) {
    var new_label, other_label, header;
    if (desired_label !== old_label) {
        if (desired_label.children(".message_header_stream").length !== 0) {
            new_label = $("#current_label_stream");
            other_label = $("#current_label_private_message");
            header = desired_label.children(".message_header_stream");
        } else {
            new_label = $("#current_label_private_message");
            other_label = $("#current_label_stream");
            header = desired_label.children(".message_header_private_message");
        }
        new_label.find(".message_header").replaceWith(header.clone());
        other_label.css('display', 'none');
        new_label.css('display', 'block');
        new_label.attr("zid", rows.id(rows.first_message_in_group(desired_label)));

        new_label.toggleClass('faded', desired_label.hasClass('faded'));
        old_label = desired_label;
    }
    show_floating_recipient_bar();
}

exports.hide = function () {
    if (is_floating_recipient_bar_showing) {
        $("#floating_recipient_bar").css('visibility', 'hidden');
        is_floating_recipient_bar_showing = false;
    }
};

exports.update = function () {
    var floating_recipient_bar = $("#floating_recipient_bar");
    var floating_recipient_bar_top = floating_recipient_bar.offset().top;
    var floating_recipient_bar_bottom = floating_recipient_bar_top + floating_recipient_bar.outerHeight();

    // Find the last message where the top of the recipient
    // row is at least partially occluded by our box.
    // Start with the pointer's current location.
    var selected_row = current_msg_list.selected_row();

    if (selected_row === undefined || selected_row.length === 0) {
        return;
    }

    var candidate = rows.get_message_recipient_row(selected_row);
    if (candidate === undefined) {
        return;
    }
    while (true) {
        if (candidate.length === 0) {
            // We're at the top of the page and no labels are above us.
            exports.hide();
            return;
        }
        if (candidate.is(".recipient_row")) {
            if (candidate.offset().top < floating_recipient_bar_bottom) {
                break;
            }
        }
        candidate = candidate.prev();
    }
    var current_label = candidate;

    // We now know what the floating stream/subject bar should say.
    // Do we show it?

    // Hide if the bottom of our floating stream/subject label is not
    // lower than the bottom of current_label (since that means we're
    // covering up a label that already exists).
    var header_height = $(current_label).find('.message_header').outerHeight();
    if (floating_recipient_bar_bottom <=
        (current_label.offset().top + header_height)) {
        exports.hide();
        return;
    }

    replace_floating_recipient_bar(current_label);
};


return exports;
}());
