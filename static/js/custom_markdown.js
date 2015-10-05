var custom_markdown = (function () {

var exports = {};

(function () {
    // Javascript for bugdown.StreamSubscribeButton

    // A map of stream names to ids to select inline subscribe node without
    // needing to escape the CSS selectors.
    var inline_subscribe_id_map = {};

    function add_sub(stream_name, $status_message) {
        channel.post({
            url: '/json/subscriptions/add',
            data: {
                subscriptions: JSON.stringify([{'name': stream_name}])
            }
        }).then(
            function (data) {
                if (!$.isEmptyObject(data.already_subscribed)) {
                    // Display the canonical stream capitalization.
                    var true_stream_name = data.already_subscribed[page_params.email][0];
                    ui.report_success("Already subscribed to " + true_stream_name,
                                      $status_message);
                }
            }, function (xhr) {
                ui.report_error("Error adding subscription", xhr, $status_message);
            }
        );
    }

    function remove_sub(stream_name, $status_message) {
        channel.post({
            url: '/json/subscriptions/remove',
            data: {
                subscriptions: JSON.stringify([stream_name])
            }
        }).then(
            function (data) {
                $status_message.hide();
            }, function (xhr) {
                ui.report_error("Error removing subscription", xhr, $status_message);
            }
        );
    }

    function display_subscribe($button, stream_name) {
        $button.text('Subscribe to ' + stream_data.canonicalized_name(stream_name))
            .removeClass('btn-success')
            .addClass('btn-default');
    }

    function display_unsubscribe($button, stream_name) {
        $button.text('Unsubscribe from ' + stream_data.canonicalized_name(stream_name))
            .removeClass('btn-default')
            .addClass('btn-success');
    }

    function update_button_display($button, stream_name) {
        if (stream_data.is_subscribed(stream_name)) {
            display_unsubscribe($button, stream_name);
        } else {
            display_subscribe($button, stream_name);
        }
    }

    $(function () {
        $('#main_div').delegate('.inline-subscribe-button', 'click', function (e) {
            var $button = $(e.target);
            var stream_name = $button.closest('.inline-subscribe').attr('data-stream-name');
            var $status_message = $button.siblings('.inline-subscribe-error');
            e.preventDefault();
            e.stopPropagation();

            if (stream_data.is_subscribed(stream_name)) {
                remove_sub(stream_name, $status_message);
            } else {
                add_sub(stream_name, $status_message);
            }
        });
    });

    $(document).on('message_rendered.zulip', function (e) {
        var $inline_subscribe, $button, stream_name, id;
        $inline_subscribe = $(e.target).find('.inline-subscribe');
        if ($inline_subscribe.length === 0) {
            return;
        }
        stream_name = $inline_subscribe.attr('data-stream-name');
        $button = $inline_subscribe.find('.inline-subscribe-button');

        if (inline_subscribe_id_map[stream_name]) {
            id = inline_subscribe_id_map[stream_name];
        } else {
            id = _.uniqueId('inline-subscribe-id-');
            inline_subscribe_id_map[stream_name] = id;
        }
        // Can not use data here, jQuery only stores into expando so our jQuery
        // selectors will not be able to find it.
        $inline_subscribe.attr('data-stream-ui-id', id);

        update_button_display($button, stream_name);
    });

    var sub_event_handler = function (e) {
        var stream_name = e.sub.name;
        var id = inline_subscribe_id_map[stream_name];
        var $button = $('#main_div').
            find('.inline-subscribe[data-stream-ui-id="'+ id + '"] .inline-subscribe-button');
        update_button_display($button, stream_name);
    };
    $(document).on('subscription_add_done.zulip', sub_event_handler);
    $(document).on('subscription_remove_done.zulip', sub_event_handler);
}());


return exports;

}());
if (typeof module !== 'undefined') {
    module.exports = custom_markdown;
}
