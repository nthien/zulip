var viewport = (function () {
var exports = {};

var jwindow;
var dimensions = {};
var in_stoppable_autoscroll = false;

exports.at_top = function () {
    return (exports.scrollTop() <= 0);
};

exports.message_viewport_info = function () {
    // Return a structure that tells us details of the viewport
    // accounting for fixed elements like the top navbar.
    //
    // The message_header is NOT considered to be part of the visible
    // message pane, which should make sense for callers, who will
    // generally be concerned about whether actual message content is
    // visible.

    var res = {};

    var element_just_above_us = $(".floating_recipient");

    res.visible_top = element_just_above_us.offset().top
        + element_just_above_us.outerHeight();

    var element_just_below_us = $("#compose");

    res.visible_height =
        element_just_below_us.position().top
        - res.visible_top;

    return res;
};

exports.at_bottom = function () {
    var bottom = exports.scrollTop() + exports.height();
    var full_height = exports.message_pane.prop('scrollHeight');

    // We only know within a pixel or two if we're
    // exactly at the bottom, due to browser quirkiness,
    // and we err on the side of saying that we are at
    // the bottom.
    return bottom + 2 >= full_height;
};

// This differs from at_bottom in that it only requires the bottom message to
// be visible, but you may be able to scroll down further.
exports.bottom_message_visible = function () {
    var last_row = rows.last_visible();
    if (last_row.length) {
        var message_bottom = last_row[0].getBoundingClientRect().bottom;
        var bottom_of_feed = $("#compose")[0].getBoundingClientRect().top;
        return bottom_of_feed > message_bottom;
    } else {
        return false;
    }
};

exports.is_below_visible_bottom = function (offset) {
    return offset > exports.scrollTop() + exports.height() - $("#compose").height();
};

exports.set_message_position = function (message_top, message_height, viewport_info, ratio) {
    // message_top = offset of the top of a message that you are positioning
    // message_height = height of the message that you are positioning
    // viewport_info = result of calling viewport.message_viewport_info
    // ratio = fraction indicating how far down the screen the msg should be

    var how_far_down_in_visible_page = viewport_info.visible_height * ratio;

    // special case: keep large messages fully on the screen
    if (how_far_down_in_visible_page + message_height > viewport_info.visible_height) {
        how_far_down_in_visible_page = viewport_info.visible_height - message_height;

        // Next handle truly gigantic messages.  We just say that the top of the
        // message goes to the top of the viewing area.  Realistically, gigantic
        // messages should either be condensed, socially frowned upon, or scrolled
        // with the mouse.
        if (how_far_down_in_visible_page < 0) {
            how_far_down_in_visible_page = 0;
        }
    }

    var hidden_top =
        viewport_info.visible_top
        - exports.scrollTop();

    var message_offset =
        how_far_down_in_visible_page
        + hidden_top;

    var new_scroll_top =
        message_top
        - message_offset;

    suppress_scroll_pointer_update = true; // Gets set to false in the scroll handler.
    exports.scrollTop(new_scroll_top);
};

function in_viewport_or_tall(rect, top_of_feed, bottom_of_feed,
                             require_fully_visible) {
    if (require_fully_visible) {
        return ((rect.top > top_of_feed) && // Message top is in view and
                ((rect.bottom < bottom_of_feed) || // message is fully in view or
                 ((rect.height > bottom_of_feed - top_of_feed) &&
                  (rect.top < bottom_of_feed)))); // message is tall.
    } else {
        return (rect.bottom > top_of_feed && rect.top < bottom_of_feed);
    }
}

function add_to_visible(candidates, visible,
                                 top_of_feed, bottom_of_feed,
                                 require_fully_visible,
                                 row_to_id) {
    _.every(candidates, function (row) {
        var row_rect = row.getBoundingClientRect();
        // Mark very tall messages as read once we've gotten past them
        if (in_viewport_or_tall(row_rect, top_of_feed, bottom_of_feed,
                                require_fully_visible)) {
            visible.push(row_to_id(row));
            return true;
        } else {
            return false;
        }
    });
}

var top_of_feed = new util.CachedValue({
    compute_value: function () {
        return $(".floating_recipient").offset().top + $(".floating_recipient").outerHeight();
    }
});

var bottom_of_feed = new util.CachedValue({
    compute_value: function () {
        return $("#compose")[0].getBoundingClientRect().top;
    }
});

function _visible_divs(selected_row, row_min_height, row_to_output, div_class, require_fully_visible) {
    // Note that when using getBoundingClientRect() we are getting offsets
    // relative to the visible window, but when using jQuery's offset() we are
    // getting offsets relative to the full scrollable window. You can't try to
    // compare heights from these two methods.
    var height = bottom_of_feed.get() - top_of_feed.get();
    var num_neighbors = Math.floor(height / row_min_height);

    // We do this explicitly without merges and without recalculating
    // the feed bounds to keep this computation as cheap as possible.
    var visible = [];
    var above_pointer = selected_row.prevAll("div." + div_class + ":lt(" + num_neighbors + ")");
    var below_pointer = selected_row.nextAll("div." + div_class + ":lt(" + num_neighbors + ")");
    add_to_visible(selected_row, visible,
                            top_of_feed.get(), bottom_of_feed.get(), require_fully_visible, row_to_output);
    add_to_visible(above_pointer, visible,
                            top_of_feed.get(), bottom_of_feed.get(), require_fully_visible, row_to_output);
    add_to_visible(below_pointer, visible,
                            top_of_feed.get(), bottom_of_feed.get(), require_fully_visible, row_to_output);

    return visible;
}

exports.visible_groups = function (require_fully_visible) {
    var selected_row = current_msg_list.selected_row();
    if (selected_row === undefined || selected_row.length === 0) {
        return [];
    }

    var selected_group = rows.get_message_recipient_row(selected_row);

    function get_row(row) {
        return row;
    }

    // Being simplistic about this, the smallest group is about 75 px high.
    return _visible_divs(selected_group, 75, get_row, "recipient_row", require_fully_visible);
};

exports.visible_messages = function (require_fully_visible) {
    var selected_row = current_msg_list.selected_row();

    function row_to_id(row) {
        return current_msg_list.get(rows.id($(row)));
    }

    // Being simplistic about this, the smallest message is 25 px high.
    return _visible_divs(selected_row, 25, row_to_id, "message_row", require_fully_visible);
};

exports.scrollTop = function viewport_scrollTop (target_scrollTop) {
    var orig_scrollTop = exports.message_pane.scrollTop();
    if (target_scrollTop === undefined) {
        return orig_scrollTop;
    }
    var ret = exports.message_pane.scrollTop(target_scrollTop);
    var new_scrollTop = exports.message_pane.scrollTop();
    var space_to_scroll = $("#bottom_whitespace").offset().top - viewport.height();

    // Check whether our scrollTop didn't move even though one could have scrolled down
    if (space_to_scroll > 0 && target_scrollTop > 0 &&
        orig_scrollTop === 0 && new_scrollTop === 0) {
        // Chrome has a bug where sometimes calling
        // window.scrollTop(x) has no effect, resulting in the browser
        // staying at 0 -- and afterwards if you call
        // window.scrollTop(x) again, it will still do nothing.  To
        // fix this, we need to first scroll to some other place.
        blueslip.info("ScrollTop did nothing when scrolling to " + target_scrollTop + ", fixing...");
        // First scroll to 1 in order to clear the stuck state
        exports.message_pane.scrollTop(1);
        // And then scroll where we intended to scroll to
        ret = exports.message_pane.scrollTop(target_scrollTop);
        if (exports.message_pane.scrollTop() === 0) {
            blueslip.info("ScrollTop fix did not work when scrolling to " + target_scrollTop +
                          "!  space_to_scroll was " + space_to_scroll);
        }
    }
    return ret;
};

exports.set_message_offset = function viewport_set_message_offset(offset) {
    var msg = current_msg_list.selected_row();
    exports.scrollTop(exports.scrollTop() + msg.offset().top - offset);
};

function make_dimen_wrapper(dimen_name, dimen_func) {
    dimensions[dimen_name] = new util.CachedValue({
        compute_value: function () {
            return dimen_func.call(exports.message_pane);
        }
    });
    return function viewport_dimension_wrapper() {
        if (arguments.length !== 0) {
            dimensions[dimen_name].reset();
            return dimen_func.apply(exports.message_pane, arguments);
        }
        return dimensions[dimen_name].get();
    };
}

exports.height = make_dimen_wrapper('height', $(exports.message_pane).height);
exports.width  = make_dimen_wrapper('width',  $(exports.message_pane).width);

exports.stop_auto_scrolling = function () {
    if (in_stoppable_autoscroll) {
        exports.message_pane.stop();
    }
};

exports.is_narrow = function () {
    // This basically returns true when we hide the right sidebar for
    // the left_side_userlist skinny mode.  It would be nice to have a less brittle
    // test for this.  See the "@media (max-width: 975px)" section in
    // zulip.css.
    return window.innerWidth <= 975;
};

exports.system_initiated_animate_scroll = function (scroll_amount) {
    suppress_scroll_pointer_update = true; // Gets set to false in the scroll handler.
    var viewport_offset = exports.scrollTop();
    in_stoppable_autoscroll = true;
    exports.message_pane.animate({
        scrollTop: viewport_offset + scroll_amount,
        always: function () {
            in_stoppable_autoscroll = false;
        }
    });
};

exports.user_initiated_animate_scroll = function (scroll_amount) {
    suppress_scroll_pointer_update = true; // Gets set to false in the scroll handler.
    in_stoppable_autoscroll = false; // defensive

    var viewport_offset = exports.scrollTop();

    exports.message_pane.animate({
        scrollTop: viewport_offset + scroll_amount
    });
};

$(function () {
    jwindow = $(window);
    exports.message_pane = $(".app");
    // This handler must be placed before all resize handlers in our application
    jwindow.resize(function () {
        dimensions.height.reset();
        dimensions.width.reset();
        top_of_feed.reset();
        bottom_of_feed.reset();
    });

    $(document).on('compose_started compose_canceled compose_finished', function () {
        bottom_of_feed.reset();
    });
});

return exports;
}());
