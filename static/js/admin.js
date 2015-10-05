var admin = (function () {

var exports = {};

exports.show_or_hide_menu_item = function () {
    var item = $('.admin-menu-item').expectOne();
    if (page_params.is_admin) {
        item.show();
    } else {
        item.hide();
    }
};

function failed_listing_users(xhr, error) {
    loading.destroy_indicator($('#subs_page_loading_indicator'));
    ui.report_error("Error listing users or bots", xhr, $("#administration-status"));
}

function failed_listing_streams(xhr, error) {
    ui.report_error("Error listing streams", xhr, $("#administration-status"));
}

function populate_users (realm_people_data) {
    var users_table = $("#admin_users_table");
    var deactivated_users_table = $("#admin_deactivated_users_table");
    var bots_table = $("#admin_bots_table");
    // Clear table rows, but not the table headers
    users_table.find("tr.user_row").remove();
    deactivated_users_table.find("tr.user_row").remove();
    bots_table.find("tr.user_row").remove();

    var active_users = [];
    var deactivated_users = [];
    var bots = [];
    _.each(realm_people_data.members, function (user) {
        user.is_active_human = user.is_active && !user.is_bot;
        if (user.is_bot) {
            bots.push(user);
        } else if (user.is_active) {
            active_users.push(user);
        } else {
            deactivated_users.push(user);
        }
    });

    active_users = _.sortBy(active_users, 'full_name');
    deactivated_users = _.sortBy(deactivated_users, 'full_name');
    bots = _.sortBy(bots, 'full_name');

    _.each(bots, function (user) {
        bots_table.append(templates.render("admin_user_list", {user: user}));
    });
    _.each(active_users, function (user) {
        users_table.append(templates.render("admin_user_list", {user: user}));
    });
    _.each(deactivated_users, function (user) {
        deactivated_users_table.append(templates.render("admin_user_list", {user: user}));
    });
    loading.destroy_indicator($('#admin_page_users_loading_indicator'));
    loading.destroy_indicator($('#admin_page_bots_loading_indicator'));
    loading.destroy_indicator($('#admin_page_deactivated_users_loading_indicator'));
}

function populate_streams (streams_data) {
    var streams_table = $("#admin_streams_table").expectOne();
    streams_table.find("tr.stream_row").remove();
    _.each(streams_data.streams, function (stream) {
        streams_table.append(templates.render("admin_streams_list", {stream: stream}));
    });
    loading.destroy_indicator($('#admin_page_streams_loading_indicator'));
}

exports.setup_page = function () {
    var options = {
        realm_name:                 page_params.realm_name,
        domain:                     page_params.domain,
        realm_restricted_to_domain: page_params.realm_restricted_to_domain,
        realm_invite_required:      page_params.realm_invite_required,
        realm_invite_by_admins_only: page_params.realm_invite_by_admins_only
    };
    var admin_tab = templates.render('admin_tab', options);
    $("#administration").html(admin_tab);
    $("#administration-status").expectOne().hide();
    $("#admin-realm-name-status").expectOne().hide();
    $("#admin-realm-restricted-to-domain-status").expectOne().hide();
    $("#admin-realm-invite-required-status").expectOne().hide();
    $("#admin-realm-invite-by-admins-only-status").expectOne().hide();

    // create loading indicators
    loading.make_indicator($('#admin_page_users_loading_indicator'));
    loading.make_indicator($('#admin_page_bots_loading_indicator'));
    loading.make_indicator($('#admin_page_streams_loading_indicator'));
    loading.make_indicator($('#admin_page_deactivated_users_loading_indicator'));

    // Populate users and bots tables
    channel.get({
        url:      '/json/users',
        idempotent: true,
        timeout:  10*1000,
        success: populate_users,
        error: failed_listing_users
    });

    // Populate streams table
    channel.get({
        url:      '/json/streams?include_public=true&include_subscribed=true',
        timeout:  10*1000,
        idempotent: true,
        success: populate_streams,
        error: failed_listing_streams
    });

    // Setup click handlers
    $(".admin_user_table").on("click", ".deactivate", function (e) {
        e.preventDefault();
        e.stopPropagation();

        $(".active_user_row").removeClass("active_user_row");

        $(e.target).closest(".user_row").addClass("active_user_row");

        var user_name = $(".active_user_row").find('.user_name').text();
        var email = $(".active_user_row").find('.email').text();

        $("#deactivation_user_modal .email").text(email);
        $("#deactivation_user_modal .user_name").text(user_name);
        $("#deactivation_user_modal").modal("show");
    });

    $(".admin_stream_table").on("click", ".deactivate", function (e) {
        e.preventDefault();
        e.stopPropagation();

        $(".active_stream_row").removeClass("active_stream_row");

        $(e.target).closest(".stream_row").addClass("active_stream_row");

        var stream_name = $(".active_stream_row").find('.stream_name').text();

        $("#deactivation_stream_modal .stream_name").text(stream_name);
        $("#deactivation_stream_modal").modal("show");
    });

    $(".admin_user_table").on("click", ".reactivate", function (e) {
        e.preventDefault();
        e.stopPropagation();

        // Go up the tree until we find the user row, then grab the email element
        $(".active_user_row").removeClass("active_user_row");
        $(e.target).closest(".user_row").addClass("active_user_row");

        var email = $(".active_user_row").find('.email').text();
        channel.post({
            url: '/json/users/' + $(".active_user_row").find('.email').text() + "/reactivate",
            error: function (xhr, error_type) {
                if (xhr.status.toString().charAt(0) === "4") {
                    $(".active_user_row button").closest("td").html(
                        $("<p>").addClass("text-error").text($.parseJSON(xhr.responseText).msg)
                    );
                } else {
                     $(".active_user_row button").text("Failed!");
                }
            },
            success: function () {
                var row = $(".active_user_row");
                var button = $(".active_user_row button.reactivate");
                button.addClass("btn-danger");
                button.removeClass("btn-warning");
                button.addClass("deactivate");
                button.removeClass("reactivate");
                button.text("Deactivate");
                row.removeClass("deactivated_user");
            }
        });
    });

    $("#id_realm_invite_required").change(function () {
        if(this.checked) {
            $("#id_realm_invite_by_admins_only").removeAttr("disabled");
            $("#id_realm_invite_by_admins_only_label").removeClass("control-label-disabled");
        } else {
            $("#id_realm_invite_by_admins_only").attr("disabled", true);
            $("#id_realm_invite_by_admins_only_label").addClass("control-label-disabled");
        }
    });

    $(".administration").on("submit", "form.admin-realm", function (e) {
        var name_status = $("#admin-realm-name-status").expectOne();
        var restricted_to_domain_status = $("#admin-realm-restricted-to-domain-status").expectOne();
        var invite_required_status = $("#admin-realm-invite-required-status").expectOne();
        var invite_by_admins_only_status = $("#admin-realm-invite-by-admins-only-status").expectOne();
        name_status.hide();
        restricted_to_domain_status.hide();
        invite_required_status.hide();
        invite_by_admins_only_status.hide();

        e.preventDefault();
        e.stopPropagation();

        var new_name = $("#id_realm_name").val();
        var new_restricted = $("#id_realm_restricted_to_domain").prop("checked");
        var new_invite = $("#id_realm_invite_required").prop("checked");
        var new_invite_by_admins_only = $("#id_realm_invite_by_admins_only").prop("checked");

        var url = "/json/realm";
        var data = {
            name: JSON.stringify(new_name),
            restricted_to_domain: JSON.stringify(new_restricted),
            invite_required: JSON.stringify(new_invite),
            invite_by_admins_only: JSON.stringify(new_invite_by_admins_only)
        };

        channel.patch({
            url: url,
            data: data,
            success: function (data) {
                if (data.name !== undefined) {
                    ui.report_success("Name changed!", name_status);
                }
                if (data.restricted_to_domain !== undefined) {
                    if (data.restricted_to_domain) {
                        ui.report_success("New users must have @" + page_params.domain + " e-mails!", restricted_to_domain_status);
                    }
                    else {
                        ui.report_success("New users may have arbitrary e-mails!", restricted_to_domain_status);
                    }
                }
                if (data.invite_required !== undefined) {
                    if (data.invite_required) {
                        ui.report_success("New users must be invited by e-mail!", invite_required_status);
                    }
                    else {
                        ui.report_success("New users may sign up online!", invite_required_status);
                    }
                }
                if (data.invite_by_admins_only !== undefined) {
                    if (data.invite_by_admins_only) {
                        ui.report_success("New users must be invited by an admin!", invite_by_admins_only_status);
                    }
                    else {
                        ui.report_success("Any user may now invite new users!", invite_by_admins_only_status);
                    }
                }
            },
            error: function (xhr, error) {
                ui.report_error("Failed!", xhr, name_status);
            }
        });
    });

    $(".admin_user_table").on("click", ".make-admin", function (e) {
        e.preventDefault();
        e.stopPropagation();

        // Go up the tree until we find the user row, then grab the email element
        $(".active_user_row").removeClass("active_user_row");
        $(e.target).closest(".user_row").addClass("active_user_row");
        var email = $(".active_user_row").find('.email').text();

        var url = "/json/users/" + email;
        var data = {
            is_admin: JSON.stringify(true)
        };

        channel.patch({
            url: url,
            data: data,
            success: function () {
                var row = $(".active_user_row");
                var button = $(".active_user_row button.make-admin");
                button.addClass("btn-danger");
                button.removeClass("btn-warning");
                button.addClass("remove-admin");
                button.removeClass("make-admin");
                button.text("Remove admin");
            },
            error: function (xhr, error) {
                var status = $(".active_user_row .admin-user-status");
                ui.report_error("Failed!", xhr, status);
            }
        });
    });

    $(".admin_user_table").on("click", ".remove-admin", function (e) {
        e.preventDefault();
        e.stopPropagation();

        // Go up the tree until we find the user row, then grab the email element
        $(".active_user_row").removeClass("active_user_row");
        $(e.target).closest(".user_row").addClass("active_user_row");
        var email = $(".active_user_row").find('.email').text();

        var url = "/json/users/" + email;
        var data = {
            is_admin: JSON.stringify(false)
        };

        channel.patch({
            url: url,
            data: data,
            success: function () {
                var row = $(".active_user_row");
                var button = $(".active_user_row button.remove-admin");
                button.addClass("btn-warning");
                button.removeClass("btn-danger");
                button.addClass("make-admin");
                button.removeClass("remove-admin");
                button.text("Make admin");
            },
            error: function (xhr, error) {
                var status = $(".active_user_row .admin-user-status");
                ui.report_error("Failed!", xhr, status);
            }
        });
    });

    $("#do_deactivate_user_button").click(function (e) {
        if ($("#deactivation_user_modal .email").html() !== $(".active_user_row").find('.email').text()) {
            blueslip.error("User deactivation canceled due to non-matching fields.");
            ui.report_message("Deactivation encountered an error. Please reload and try again.",
               $("#home-error"), 'alert-error');
        }
        $("#deactivation_user_modal").modal("hide");
        $(".active_user_row button").prop("disabled", true).text("Working…");
        channel.del({
            url: '/json/users/' + $(".active_user_row").find('.email').text(),
            error: function (xhr, error_type) {
                if (xhr.status.toString().charAt(0) === "4") {
                    $(".active_user_row button").closest("td").html(
                        $("<p>").addClass("text-error").text($.parseJSON(xhr.responseText).msg)
                    );
                } else {
                     $(".active_user_row button").text("Failed!");
                }
            },
            success: function () {
                var row = $(".active_user_row");
                var button = $(".active_user_row button.deactivate");
                button.prop("disabled", false);
                button.addClass("btn-warning");
                button.removeClass("btn-danger");
                button.addClass("reactivate");
                button.removeClass("deactivate");
                button.text("Reactivate");
                row.addClass("deactivated_user");
                row.find(".user-admin-settings").hide();
            }
        });
    });

    $("#do_deactivate_stream_button").click(function (e) {
        if ($("#deactivation_stream_modal .stream_name").text() !== $(".active_stream_row").find('.stream_name').text()) {
            blueslip.error("Stream deactivation canceled due to non-matching fields.");
            ui.report_message("Deactivation encountered an error. Please reload and try again.",
               $("#home-error"), 'alert-error');
        }
        $("#deactivation_stream_modal").modal("hide");
        $(".active_stream_row button").prop("disabled", true).text("Working…");
        channel.del({
            url: '/json/streams/' + encodeURIComponent($(".active_stream_row").find('.stream_name').text()),
            error: function (xhr, error_type) {
                if (xhr.status.toString().charAt(0) === "4") {
                    $(".active_stream_row button").closest("td").html(
                        $("<p>").addClass("text-error").text($.parseJSON(xhr.responseText).msg)
                    );
                } else {
                     $(".active_stream_row button").text("Failed!");
                }
            },
            success: function () {
                var row = $(".active_stream_row");
                row.remove();
            }
        });
    });
};

return exports;

}());
