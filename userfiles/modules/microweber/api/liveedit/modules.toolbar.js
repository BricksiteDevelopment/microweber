mw.liveedit.modulesToolbar = {
    init: function (selector) {
        var items = selector || ".modules-list li[data-module-name]";
        var $items = mw.$(items);
        $items.draggable({
            revert: true,
            revertDuration: 0,
            start: function(a, b) {
                mw.isDrag = true;
                mw.dragCurrent = mw.ea.data.currentGrabbed = mw.GlobalModuleListHelper;
                mw.$(mwd.body).addClass("dragStart");
                mw.image_resizer._hide();
            },
            stop: function() {
                mw.isDrag = false;
                mw.pauseSave = true;
                var el = this;
                mw.$(mwd.body).removeClass("dragStart");
                setTimeout(function() {
                    mw.drag.load_new_modules();
                    mw.recommend.increase($(mw.dragCurrent).attr("data-module-name"));
                    mw.drag.toolbar_modules(el);
                }, 200);
            }
        });
        $items.on('mouseenter touchstart', function() {
            mw.$(this).draggable("option", "helper", function() {
                var clone = mw.$(this).clone(true);
                clone.appendTo(mwd.body);
                mw.GlobalModuleListHelper = clone[0];
                return clone[0];
            });
        });
        $items.on("click mousedown mouseup", function(e) {
            e.preventDefault();
            if (e.type === 'click') {
                return false;
            }
            if (e.type === 'mousedown') {
                this.mousedown = true;
            }
            if (e.type === 'mouseup' && e.which === 1 && !!this.mousedown) {
                $items.each(function() {
                    this.mousedown = false;
                });
                if (!mw.isDrag && mww.getSelection().rangeCount > 0 && mwd.querySelector('.mw_modal') === null && mw.modulesClickInsert) {
                    var html = this.outerHTML;
                    mw.wysiwyg.insert_html(html);
                    mw.drag.load_new_modules();
                }
            }
        });
    }
};
