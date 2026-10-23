/* Colour mode toggle: cycles dark → light → terminal.
   The mode itself is applied by partials/color-mode.hbs in <head>. */
(function () {
    if (typeof window.setColorMode !== 'function') return;

    var order = ['dark', 'light', 'terminal'];

    document.querySelectorAll('[data-color-mode-toggle]').forEach(function (button) {
        button.addEventListener('click', function () {
            var current = order.indexOf(window.getColorMode());
            window.setColorMode(order[(current + 1) % order.length]);
        });
    });
})();
