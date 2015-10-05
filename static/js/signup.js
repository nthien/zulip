$(function () {
    // NB: this file is included on multiple pages.  In each context,
    // some of the jQuery selectors below will return empty lists.

    $.validator.addMethod('password_strength', function (value, element) {
        return password_quality(value);
    }, 'Password is weak.');

    function highlight(class_to_add) {
        // Set a class on the enclosing control group.
        return function (element) {
            $(element).closest('.control-group')
                .removeClass('success error')
                .addClass(class_to_add);
        };
    }

    $('#registration, #password_reset').validate({
        rules: {
            password:      'password_strength',
            new_password1: 'password_strength'
        },
        errorElement: "p",
        errorPlacement: function (error, element) {
            // NB: this is called at most once, when the error element
            // is created.
            error.insertAfter(element).addClass('help-inline');
        },
        highlight:   highlight('error'),
        unhighlight: highlight('success')
    });

    $('#id_password, #id_new_password1').on('change keyup', function () {
        // Update the password strength bar even if we aren't validating
        // the field yet.
        password_quality($(this).val(), $('#pw_strength .bar'));
    });

    $("#send_confirm").validate({
        errorElement: "p",
        errorPlacement: function (error, element) {
            $('#errors').empty();
            error.appendTo("#errors")
                 .addClass("text-error");
        },
        success: function () {
            $('#errors').empty();
        }
    });

    $("#login_form").validate({
        errorClass: "text-error",
        wrapper: "div"
    });
});
