var bot_data = (function () {
    var exports = {};

    var bots = {};
    var bot_fields = ['api_key', 'avatar_url', 'default_all_public_streams',
                      'default_events_register_stream',
                      'default_sending_stream', 'email', 'full_name', 'owner'];

    var send_change_event = _.debounce(function () {
        $(document).trigger('zulip.bot_data_changed');
    }, 50);

    var set_can_admin = function bot_data__set_can_admin(bot) {
        if (page_params.is_admin) {
            bot.can_admin = true;
        } else if (page_params.email === bot.owner) {
            bot.can_admin = true;
        } else {
            bot.can_admin = false;
        }
    };

    exports.add = function bot_data__add(bot) {
        var clean_bot = _.pick(bot, bot_fields);
        bots[bot.email] = clean_bot;
        set_can_admin(clean_bot);
        send_change_event();
    };

    exports.remove = function bot_data__remove(email) {
        delete bots[email];
        send_change_event();
    };

    exports.update = function bot_data__update(email, bot_update) {
        var bot = bots[email];
        _.extend(bot, _.pick(bot_update, bot_fields));
        set_can_admin(bot);
        send_change_event();
    };

    exports.get_editable = function bots_data__get_editable() {
        return _.filter(bots, function (bot) { return bot.can_admin; });
    };

    exports.get = function bot_data__get(email) {
        return bots[email];
    };

    $(function init() {
        _.each(page_params.bot_list, function (bot) {
            exports.add(bot);
        });
    });

    return exports;
}());
if (typeof module !== 'undefined') {
    module.exports = bot_data;
}
