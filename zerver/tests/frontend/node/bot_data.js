var _ = global._;

set_global('$', function (f) {
    if (f) {
        return f();
    }
    return {trigger: function () {}};
});
set_global('document', null);

var page_params = {
    bot_list: [{email: 'bot0@zulip.com', full_name: 'Bot 0'}],
    is_admin: false,
    email: 'owner@zulip.com'
};
set_global('page_params', page_params);

var patched_underscore = _.clone(_);
patched_underscore.debounce = function (f) { return(f); };
global.patch_builtin('_', patched_underscore);


var bot_data = require('js/bot_data.js');

// Our startup logic should have added Bot 0 from page_params.
assert.equal(bot_data.get('bot0@zulip.com').full_name, 'Bot 0');

(function () {
    var test_bot = {
        email: 'bot1@zulip.com',
        avatar_url: '',
        default_all_public_streams: '',
        default_events_register_stream: '',
        default_sending_stream: '',
        full_name: 'Bot 1',
        extra: 'Not in data'
    };

    (function test_add() {
        bot_data.add(test_bot);

        var bot = bot_data.get('bot1@zulip.com');
        assert.equal('Bot 1', bot.full_name);
        assert.equal(undefined, bot.extra);
    }());

    (function test_update() {
        var bot;

        bot_data.add(test_bot);

         bot = bot_data.get('bot1@zulip.com');
        assert.equal('Bot 1', bot.full_name);
        bot_data.update('bot1@zulip.com', {full_name: 'New Bot 1'});
        bot = bot_data.get('bot1@zulip.com');
        assert.equal('New Bot 1', bot.full_name);
    }());

    (function test_remove() {
        var bot;

        bot_data.add(test_bot);

        bot = bot_data.get('bot1@zulip.com');
        assert.equal('Bot 1', bot.full_name);
        bot_data.remove('bot1@zulip.com');
        bot = bot_data.get('bot1@zulip.com');
        assert.equal(undefined, bot);
    }());

    (function test_owner_can_admin() {
        var bot;

        bot_data.add(_.extend({owner: 'owner@zulip.com'}, test_bot));

        bot = bot_data.get('bot1@zulip.com');
        assert(bot.can_admin);

        bot_data.add(_.extend({owner: 'notowner@zulip.com'}, test_bot));

        bot = bot_data.get('bot1@zulip.com');
        assert.equal(false, bot.can_admin);
    }());

    (function test_admin_can_admin() {
        var bot;
        page_params.is_admin = true;

        bot_data.add(test_bot);

        bot = bot_data.get('bot1@zulip.com');
        assert(bot.can_admin);

        page_params.is_admin = false;
    }());

    (function test_get_editable() {
        var can_admin;

        bot_data.add(_.extend({}, test_bot, {owner: 'owner@zulip.com'}));
        bot_data.add(_.extend({}, test_bot, {email: 'bot2@zulip.com'}));

        can_admin = _.pluck(bot_data.get_editable(), 'email');
        assert.deepEqual(['bot1@zulip.com'], can_admin);
    }());


}());
