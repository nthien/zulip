var gear_menu = (function () {

var exports = {};

// We want to remember how far we were scrolled on each 'tab'.
// To do so, we need to save away the old position of the
// scrollbar when we switch to a new tab (and restore it
// when we switch back.)
var scroll_positions = {};

exports.initialize = function () {
    admin.show_or_hide_menu_item();

    $('#gear-menu a[data-toggle="tab"]').on('show', function (e) {
        // Save the position of our old tab away, before we switch
        var old_tab = $(e.relatedTarget).attr('href');
        scroll_positions[old_tab] = viewport.scrollTop();
    });
    $('#gear-menu a[data-toggle="tab"]').on('shown', function (e) {
        var target_tab = $(e.target).attr('href');
        resize.resize_bottom_whitespace();
        // Hide all our error messages when switching tabs
        $('.alert-error').hide();
        $('.alert-success').hide();
        $('.alert-info').hide();
        $('.alert').hide();

        // Set the URL bar title to show the sub-page you're currently on.
        var browser_url = target_tab;
        if (browser_url === "#home") {
            browser_url = "";
        }
        hashchange.changehash(browser_url);

        // After we show the new tab, restore its old scroll position
        // (we apparently have to do this after setting the hash,
        // because otherwise that action may scroll us somewhere.)
        if (scroll_positions.hasOwnProperty(target_tab)) {
            viewport.scrollTop(scroll_positions[target_tab]);
        } else {
            if (target_tab === '#home') {
                scroll_to_selected();
            } else {
                viewport.scrollTop(0);
            }
        }
    });

    var subs_link = $('#gear-menu a[href="#subscriptions"]');

    // If the streams page is shown by clicking directly on the "Streams"
    // link (in the gear menu), then focus the new stream textbox.
    subs_link.on('click', function (e) {
        $(document).one('subs_page_loaded.zulip', function (e) {
            $('#create_stream_name').focus().select();
        });
    });

    // Whenever the streams page comes up (from anywhere), populate it.
    subs_link.on('shown', subs.setup_page);

    // The admin and settings pages are generated client-side through
    // templates.

    var admin_link = $('#gear-menu a[href="#administration"]');
    admin_link.on('shown', admin.setup_page);

    var settings_link = $('#gear-menu a[href="#settings"]');
    settings_link.on('shown', settings.setup_page);
};

return exports;
}());
