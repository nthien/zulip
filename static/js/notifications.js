var notifications = (function () {

var exports = {};

var notice_memory = {};

// When you start Zulip, window_has_focus should be true, but it might not be the
// case after a server-initiated reload.
var window_has_focus = document.hasFocus && document.hasFocus();

var asked_permission_already = false;
var names;
var supports_sound;

var unread_pms_favicon = '/static/images/favicon/favicon-pms.png';
var current_favicon;
var previous_favicon;
var flashing = false;

var notifications_api;
if (window.webkitNotifications) {
    notifications_api = window.webkitNotifications;
} else if (window.Notification) {
    // Build a shim to the new notification API
    notifications_api = {
        checkPermission: function checkPermission() {
            if (window.Notification.permission === 'granted') {
                return 0;
            } else {
                return 2;
            }
        },
        requestPermission: window.Notification.requestPermission,
        createNotification: function createNotification(icon, title, content) {
            var notification_object = new window.Notification(title, {icon: icon, body: content});
            notification_object.show = function () {};
            notification_object.cancel = function () { notification_object.close(); };
            return notification_object;
        }
    };
}


function browser_desktop_notifications_on () {
    return (notifications_api &&
            // Firefox on Ubuntu claims to do webkitNotifications but its notifications are terrible
            $.browser.webkit &&
            // 0 is PERMISSION_ALLOWED
            notifications_api.checkPermission() === 0) ||
        // window.bridge is the desktop client
        (window.bridge !== undefined);
}

function cancel_notification_object (notification_object) {
        // We must remove the .onclose so that it does not trigger on .cancel
        notification_object.onclose = function () {};
        notification_object.onclick = function () {};
        notification_object.cancel();
}

exports.initialize = function () {
    $(window).focus(function () {
        window_has_focus = true;

        _.each(notice_memory, function (notice_mem_entry) {
           cancel_notification_object(notice_mem_entry.obj);
        });
        notice_memory = {};

        // Update many places on the DOM to reflect unread
        // counts.
        unread.process_visible();

    }).blur(function () {
        window_has_focus = false;
    });

    if ($.browser.mozilla === true && typeof Notification !== "undefined") {
        Notification.requestPermission(function () {
            asked_permission_already = true;
        });
    }

    if (window.bridge !== undefined) {
        supports_sound = true;

        return;
    }

    var audio = $("<audio>");
    if (audio[0].canPlayType === undefined) {
        supports_sound = false;
    } else {
        supports_sound = true;
        $("#notifications-area").append(audio);
        if (audio[0].canPlayType('audio/ogg; codecs="vorbis"')) {
            audio.append($("<source>").attr("type", "audio/ogg")
                                      .attr("loop", "yes")
                                      .attr("src", "/static/audio/zulip.ogg"));
        } else {
            audio.append($("<source>").attr("type", "audio/mpeg")
                                      .attr("loop", "yes")
                                      .attr("src", "/static/audio/zulip.mp3"));
        }
    }

    if (notifications_api) {
        $(document).click(function () {
            if (!page_params.desktop_notifications_enabled || asked_permission_already) {
                return;
            }
            if (notifications_api.checkPermission() !== 0) { // 0 is PERMISSION_ALLOWED
                notifications_api.requestPermission(function () {});
                asked_permission_already = true;
            }
        });
    }
};

// For web pages, the initial favicon is the same as the favicon we
// set for no unread messages and the initial page title is the same
// as the page title we set for no unread messages.  However, for the
// OS X app, the dock icon does not get its badge updated on initial
// page load.  If the badge icon was wrong right before a reload and
// we actually have no unread messages then we will never execute
// bridge.updateCount() until the unread count changes.  Therefore,
// we ensure that bridge.updateCount is always run at least once to
// synchronize it with the page title.  This can be done before the
// DOM is loaded.
if (window.bridge !== undefined) {
    window.bridge.updateCount(0);
}

var new_message_count;

exports.update_title_count = function (count) {
    new_message_count = count;
    exports.redraw_title();
};

exports.redraw_title = function () {
    // Update window title and favicon to reflect unread messages in current view
    var n;

    var new_title = (new_message_count ? ("(" + new_message_count + ") ") : "")
        + page_params.realm_name + " - " + page_params.product_name;

    if (document.title === new_title) {
        return;
    }

    document.title = new_title;

    // IE doesn't support PNG favicons, *shrug*
    if (! $.browser.msie) {
        // Indicate the message count in the favicon
        if (new_message_count) {
            // Make sure we're working with a number, as a defensive programming
            // measure.  And we don't have images above 99, so display those as
            // 'infinite'.
            n = (+new_message_count);
            if (n > 99) {
                n = 'infinite';
            }

            current_favicon = previous_favicon = '/static/images/favicon/favicon-'+n+'.png';
        } else {
            current_favicon = previous_favicon = '/static/favicon.ico?v=2';
        }
        favicon.set(current_favicon);
    }

    if (window.bridge !== undefined) {
        // We don't use 'n' because we want the exact count. The bridge handles
        // which icon to show.
        window.bridge.updateCount(new_message_count);
    }
};

function flash_pms() {
    // When you have unread PMs, toggle the favicon between the unread count and
    // a special icon indicating that you have unread PMs.
    if (unread.get_counts().private_message_count > 0) {
        if (current_favicon === unread_pms_favicon) {
            favicon.set(previous_favicon);
            current_favicon = previous_favicon;
            previous_favicon = unread_pms_favicon;
        } else {
            favicon.set(unread_pms_favicon);
            previous_favicon = current_favicon;
            current_favicon = unread_pms_favicon;
        }
        // Toggle every 2 seconds.
        setTimeout(flash_pms, 2000);
    } else {
        flashing = false;
        // You have no more unread PMs, so back to only showing the unread
        // count.
        favicon.set(current_favicon);
    }
}

exports.update_pm_count = function (new_pm_count) {
    if (window.bridge !== undefined && window.bridge.updatePMCount !== undefined) {
        window.bridge.updatePMCount(new_pm_count);
    }
    if (!flashing) {
        flashing = true;
        flash_pms();
    }
};

exports.window_has_focus = function () {
    return window_has_focus;
};

function in_browser_notify(message, title, content) {
    var notification_html = $(templates.render('notification', {gravatar_url: ui.small_avatar_url(message),
                                                                title: title,
                                                                content: content}));
    $('.top-right').notify({
        message: {html: notification_html},
        fadeOut: {enabled: true, delay: 4000}
    }).show();
}

exports.notify_above_composebox = function (note, link_class, link_msg_id, link_text) {
    var notification_html = $(templates.render('compose_notification', {note: note,
                                                                        link_class: link_class,
                                                                        link_msg_id: link_msg_id,
                                                                        link_text: link_text}));
    exports.clear_compose_notifications();
    $('#out-of-view-notification').append(notification_html);
    $('#out-of-view-notification').show();
};

function process_notification(notification) {
    var i, notification_object, key, content, other_recipients;
    var message = notification.message;
    var title = message.sender_full_name;
    var msg_count = 1;
    var notification_source;

    // Convert the content to plain text, replacing emoji with their alt text
    content = $('<div/>').html(message.content);
    ui.replace_emoji_with_text(content);
    content = content.text();

    if (message.is_me_message) {
        content = message.sender_full_name + content.slice(3);
    }

    if (message.type === "private") {
        key = message.display_reply_to;
        other_recipients = message.display_reply_to;
        // Remove the sender from the list of other recipients
        other_recipients = other_recipients.replace(", " + message.sender_full_name, "");
        other_recipients = other_recipients.replace(message.sender_full_name + ", ", "");
        notification_source = 'pm';
    } else {
        key = message.sender_full_name + " to " +
              message.stream + " > " + message.subject;
        if (message.mentioned) {
            notification_source = 'mention';
        } else if (message.alerted) {
            notification_source = 'alert';
        } else {
            notification_source = 'stream';
        }
    }

    if (content.length > 150) {
        // Truncate content at a word boundary
        for (i = 150; i > 0; i--) {
            if (content[i] === ' ') {
                break;
            }
        }
        content = content.substring(0, i);
        content += " [...]";
    }

    if (window.bridge === undefined && notice_memory[key] !== undefined) {
        msg_count = notice_memory[key].msg_count + 1;
        title = msg_count + " messages from " + title;
        notification_object = notice_memory[key].obj;
        cancel_notification_object(notification_object);
    }

    if (message.type === "private" && message.display_recipient.length > 2) {
        // If the message has too many recipients to list them all...
        if (content.length + title.length + other_recipients.length > 230) {
            // Then count how many people are in the conversation and summarize
            // by saying the conversation is with "you and [number] other people"
            other_recipients = other_recipients.replace(/[^,]/g, "").length +
                               " other people";
        }
        title += " (to you and " + other_recipients + ")";
    }
    if (message.type === "stream") {
        title += " (to " + message.stream + " > " + message.subject + ")";
    }

    if (window.bridge === undefined && notification.webkit_notify === true) {
        var icon_url = ui.small_avatar_url(message);
        notice_memory[key] = {
            obj: notifications_api.createNotification(
                    icon_url, title, content),
            msg_count: msg_count,
            message_id: message.id
        };
        notification_object = notice_memory[key].obj;
        notification_object.onclick = function () {
            notification_object.cancel();
            if (feature_flags.clicking_notification_causes_narrow) {
                narrow.by_subject(message.id, {trigger: 'notification'});
            }
            window.focus();
        };
        notification_object.onclose = function () {
            delete notice_memory[key];
        };
        notification_object.show();
    } else if (notification.webkit_notify === false && typeof Notification !== "undefined" && $.browser.mozilla === true) {
        Notification.requestPermission(function (perm) {
            if (perm === 'granted') {
                notification_object = new Notification(title, {
                    body: content,
                    iconUrl: ui.small_avatar_url(message)
                });
            } else {
                in_browser_notify(message, title, content);
            }
        });
    } else if (notification.webkit_notify === false) {
        in_browser_notify(message, title, content);
    } else {
        // Shunt the message along to the desktop client
        window.bridge.desktopNotification(title, content, notification_source);
    }
}

exports.close_notification = function (message) {
    _.each(Object.keys(notice_memory), function (key) {
       if (notice_memory[key].message_id === message.id) {
           cancel_notification_object(notice_memory[key].obj);
           delete notice_memory[key];
       }
    });
};

exports.speaking_at_me = function (message) {
    if (message === undefined) {
        return false;
    }

    return message.mentioned;
};

function message_is_notifiable(message) {
    // Independent of the user's notification settings, are there
    // properties of the message that unconditionally mean we
    // shouldn't notify about it.

    if (message.sent_by_me) {
        return false;
    }

    // If a message is edited multiple times, we want to err on the side of
    // not spamming notifications.
    if (message.notification_sent) {
        return false;
    }

    // @-mentions take precent over muted-ness. See Trac #1929
    if (exports.speaking_at_me(message)) {
        return true;
    }
    if ((message.type === "stream") &&
        !stream_data.in_home_view(message.stream)) {
        return false;
    }
    if ((message.type === "stream") &&
        muting.is_topic_muted(message.stream, message.subject)) {
        return false;
    }

    // Everything else is on the table; next filter based on notification
    // settings.
    return true;
}

function should_send_desktop_notification(message) {
    // For streams, send if desktop notifications are enabled for this
    // stream.
    if ((message.type === "stream") &&
        subs.receives_desktop_notifications(message.stream)) {
        return true;
    }

    // For PMs and @-mentions, send if desktop notifications are
    // enabled.
    if ((message.type === "private") &&
        page_params.desktop_notifications_enabled) {
        return true;
    }

    // For alert words and @-mentions, send if desktop notifications
    // are enabled.
    if (alert_words.notifies(message) &&
        page_params.desktop_notifications_enabled) {
        return true;
    }

    if (exports.speaking_at_me(message) &&
        page_params.desktop_notifications_enabled) {
        return true;
    }

    return false;
}

function should_send_audible_notification(message) {
    // For streams, ding if sounds are enabled for this stream.
    if ((message.type === "stream") &&
        subs.receives_audible_notifications(message.stream)) {
        return true;
    }

    // For PMs and @-mentions, ding if sounds are enabled.
    if ((message.type === "private") && page_params.sounds_enabled) {
        return true;
    }

    // For alert words and @-mentions, ding if sounds are enabled.
    if (alert_words.notifies(message) && page_params.sounds_enabled) {
        return true;
    }

    if (exports.speaking_at_me(message) && page_params.sounds_enabled) {
        return true;
    }

    return false;
}

exports.received_messages = function (messages) {
    _.each(messages, function (message) {
        if (!message_is_notifiable(message)) {
            return;
        }
        // checking for unread flags here is basically proxy for
        // "is Zulip currently in focus". In the case of auto-scroll forever,
        // we don't care
        if (!unread.message_unread(message) && !page_params.autoscroll_forever) {
            return;
        }

        message.notification_sent = true;

        if (should_send_desktop_notification(message)) {
            if (browser_desktop_notifications_on()) {
                process_notification({message: message, webkit_notify: true});
            } else {
                process_notification({message: message, webkit_notify: false});
            }
        }
        if (should_send_audible_notification(message) && supports_sound) {
            if (window.bridge !== undefined) {
                window.bridge.bell();
            } else {
                $("#notifications-area").find("audio")[0].play();
            }
        }
    });
};

function get_message_header(message) {
    if (message.type === "stream") {
        return message.stream + ">" + message.subject;
    }
    if (message.display_recipient.length > 2) {
        return "group PM with " + message.display_reply_to;
    }
    if (message.reply_to === page_params.email) {
        return "PM with yourself";
    }
    return "PM with " + message.display_reply_to;
}

exports.possibly_notify_new_messages_outside_viewport = function (messages) {
    _.each(messages, function (message) {
        if (message.sender_email !== page_params.email) {
            return;
        }
        // queue up offscreen because of narrowed, or (secondarily) offscreen
        // because it doesn't fit in the currently visible viewport

        var note;
        var link_class;
        var link_msg_id = message.id;
        var link_text;

        var row = current_msg_list.get_row(message.id);
        if (row.length === 0) {
            if (message.type === "stream" && muting.is_topic_muted(message.stream, message.subject)) {
                note = "Sent! Your message was sent to a topic you have muted.";
            } else if (message.type === "stream" && !stream_data.in_home_view(message.stream)) {
                note = "Sent! Your message was sent to a stream you have muted.";
            } else {
                // offscreen because it is outside narrow
                // we can only look for these on non-search (can_apply_locally) messages
                // see also: exports.notify_messages_outside_current_search
                note = "Sent! Your message is outside your current narrow.";
            }
            link_class = "compose_notification_narrow_by_subject";
            link_text = "Narrow to " + get_message_header(message);
        } else {
            // return with _.each is like continue for normal for loops.
            return;
        }
        exports.notify_above_composebox(note, link_class, link_msg_id, link_text);
    });
};

// for callback when we have to check with the server if a message should be in
// the current_msg_list (!can_apply_locally; a.k.a. "a search").
exports.notify_messages_outside_current_search = function (messages) {
    _.each(messages, function (message) {
        if (message.sender_email !== page_params.email) {
            return;
        }
        exports.notify_above_composebox("Sent! Your recent message is outside the current search.",
                                        "compose_notification_narrow_by_subject",
                                        message.id,
                                        "Narrow to " + get_message_header(message));
    });
};

exports.clear_compose_notifications = function () {
    $('#out-of-view-notification').empty();
    $('#out-of-view-notification').stop(true, true);
    $('#out-of-view-notification').hide();
};

$(function () {
    // Shim for Cocoa WebScript exporting top-level JS
    // objects instead of window.foo objects
    if (typeof(bridge) !== 'undefined' && window.bridge === undefined) {
        window.bridge = bridge;
    }

    $(document).on('message_id_changed', function (event) {
        var old_id = event.old_id, new_id = event.new_id;

        // If a message ID that we're currently storing (as a link) has changed,
        // update that link as well
        _.each($('#out-of-view-notification a'), function (e) {
            var elem = $(e);
            var msgid = elem.data('msgid');

            if (msgid === old_id) {
                elem.data('msgid', new_id);
            }
        });
    });
});

exports.register_click_handlers = function () {
    $('#out-of-view-notification').on('click', '.compose_notification_narrow_by_subject', function (e) {
        var msgid = $(e.currentTarget).data('msgid');
        narrow.by_subject(msgid, {trigger: 'compose_notification'});
        e.stopPropagation();
        e.preventDefault();
    });
    $('#out-of-view-notification').on('click', '.compose_notification_scroll_to_message', function (e) {
        var msgid = $(e.currentTarget).data('msgid');
        current_msg_list.select_id(msgid);
        scroll_to_selected();
        e.stopPropagation();
        e.preventDefault();
    });
    $('#out-of-view-notification').on('click', '.out-of-view-notification-close', function (e) {
        exports.clear_compose_notifications();
        e.stopPropagation();
        e.preventDefault();
    });
};

exports.handle_global_notification_updates = function (notification_name, setting) {
    // Update the global settings checked when determining if we should notify
    // for a given message. These settings do not affect whether or not a
    // particular stream should receive notifications.
    if (notification_name === "enable_stream_desktop_notifications") {
        page_params.stream_desktop_notifications_enabled = setting;
    } else if (notification_name === "enable_stream_sounds") {
        page_params.stream_sounds_enabled = setting;
    } else if (notification_name === "enable_desktop_notifications") {
        page_params.desktop_notifications_enabled = setting;
    } else if (notification_name === "enable_sounds") {
        page_params.sounds_enabled = setting;
    } else if (notification_name === "enable_offline_email_notifications") {
        page_params.enable_offline_email_notifications = setting;
    } else if (notification_name === "enable_offline_push_notifications") {
        page_params.enable_offline_push_notifications= setting;
    } else if (notification_name === "enable_digest_emails") {
        page_params.enable_digest_emails = setting;
    }
};

return exports;

}());
