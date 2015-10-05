var invite = (function () {

var exports = {};

function update_subscription_checkboxes() {
    // TODO: If we were more clever, we would only do this if the
    // stream list has actually changed; that way, the settings of the
    // checkboxes are saved from invocation to invocation (which is
    // nice if I want to invite a bunch of people at once)
    var streams = [];
    _.each(stream_data.subscribed_streams(), function (value) {
        var is_notifications_stream = value === page_params.notifications_stream;
        if ((stream_data.subscribed_streams().length === 1) ||
            !is_notifications_stream ||
            (is_notifications_stream && stream_data.get_invite_only(value))) {
            // You can't actually elect not to invite someone to the
            // notifications stream. We won't even show it as a choice unless
            // it's the only stream you have, or if you've made it private.
            streams.push({name: value, invite_only: stream_data.get_invite_only(value)});
        }
    });
    $('#streams_to_add').html(templates.render('invite_subscription', {streams: streams}));
}

function reset_error_messages() {
    var invite_status = $('#invite_status');
    var invitee_emails = $("#invitee_emails");
    var invitee_emails_group = invitee_emails.closest('.control-group');

    invite_status.hide().text('').removeClass('alert-error alert-warning alert-success');
    invitee_emails_group.removeClass('warning error');
}

function prepare_form_to_be_shown() {
    $("#invitee_emails").val("");
    update_subscription_checkboxes();
    reset_error_messages();
}

exports.initialize = function () {
    var invite_status = $('#invite_status');
    var invitee_emails = $("#invitee_emails");
    var invitee_emails_group = invitee_emails.closest('.control-group');

    $('#submit-invitation').button();
    $('#invite-user').on('show', prepare_form_to_be_shown);
    $('#invite-user').on('shown', function () {
        invitee_emails.focus().autosize();
    });

    $("#invite_user_form").ajaxForm({
        dataType: 'json',
        beforeSubmit: function (arr, $form, options) {
            reset_error_messages();
            // TODO: You could alternatively parse the textarea here, and return errors to
            // the user if they don't match certain constraints (i.e. not real email addresses,
            // aren't in the right domain, etc.)
            //
            // OR, you could just let the server do it. Probably my temptation.
            $('#submit-invitation').button('loading');
            return true;
        },
        success: function (resp, statusText, xhr, form) {
            $('#submit-invitation').button('reset');
            $('#invitee_emails').val('');
            invite_status.text('Users invited successfully.')
                          .addClass('alert-success')
                          .show();
        },
        error: function (xhr, error_type, xhn) {
            $('#submit-invitation').button('reset');
            var arr = $.parseJSON(xhr.responseText);
            if (arr.errors === undefined) {
                // There was a fatal error, no partial processing occurred.
                invite_status.text(arr.msg)
                              .addClass('alert-error')
                              .show();
            } else {
                // Some users were not invited.
                var error_list = $('<ul>');
                _.each(arr.errors, function (value) {
                    error_list.append($('<li>').text(value.join(': ')));
                });

                invite_status.addClass('alert-warning')
                              .empty()
                              .append($('<p>').text(arr.msg))
                              .append(error_list)
                              .show();
                invitee_emails_group.addClass('warning');

            }

        }
    });

    $(document).on('click', '.invite_check_all_button', function (e) {
        $('#streams_to_add :checkbox').attr('checked', true);
        e.preventDefault();
    });

    $(document).on('click', '.invite_uncheck_all_button', function (e) {
        $('#streams_to_add :checkbox').attr('checked', false);
        e.preventDefault();
    });
};

return exports;

}());
