(function (mw) {


    mw._dialogEncapsulate = function (content, scripts) {
        scripts = $.merge(scripts || [], [
            mw.settings.site_url + 'apijs_settings?mwv=' + mw.version,
            mw.settings.site_url + 'apijs?mwv='+mw.version
        ]);

        var frame = document.createElement('iframe');
        frame.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
        frame.allowFullscreen = true;
        frame.scrolling = "no";
        frame.width = "100%";
        frame.frameBorder = "0";
        frame.style.display = 'none';
        document.body.appendChild(frame);

        frame.__int = setInterval(function(){
            if(frame.contentWindow && frame.contentWindow.document && frame.contentWindow.document.body){
                $(frame.contentWindow.document.head)
                    .append('<link rel="stylesheet" href="'+mw.settings.modules_url + 'microweber/default.css?mwv='+mw.version+'">');
                var c = 0;
                $.each(scripts, function(){
                    var el = frame.contentWindow.document.createElement('script');
                    $(el).on('load error', function(){
                        c++;
                        if(c === scripts.length){
                            setTimeout(function(){
                                $(frame).trigger('load');
                                $(frame.contentWindow).trigger('load');
                            }, 78);
                        }
                    });
                    el.src = this;
                    // $(frame.contentWindow.document.head).append(el);
                });

                $(frame.contentWindow.document.body).append(content);

                mw.tools.iframeAutoHeight(frame);
                clearInterval(frame.__int);

            }
        }, 78);
        return frame;
    };

    mw.dialog = function (options) {
        return new mw.Dialog(options);
    };
    mw.dialogIframe = function (options) {
        options.pauseInit = true;
        var attr = 'frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen';
        if (options.autoHeight) {
            attr += ' scrolling="no"';
            options.height = 'auto';
        }
        options.content = '<iframe src="' + mw.external_tool(options.url.trim()) + '" ' + attr + '><iframe>';
        options.className = ('mw-dialog-iframe mw-dialog-iframe-loading ' + (options.className || '')).trim();
        options.className += (options.autoHeight ? ' mw-dialog-iframe-autoheight' : '');
        var dialog = new mw.Dialog(options);
        dialog.iframe = dialog.dialogContainer.querySelector('iframe');
        mw.tools.loading(dialog.dialogContainer, 90);

        setTimeout(function () {
            var frame = dialog.dialogContainer.querySelector('iframe');
            if (options.autoHeight) {
                mw.tools.iframeAutoHeight(frame);
            }
            mw.$(frame).on('load', function () {
                mw.tools.loading(dialog.dialogContainer, false);
                setTimeout(function () {
                    dialog.center();
                    mw.$(frame).on('bodyResize', function () {
                        dialog.center();
                    });
                    dialog.dialogMain.classList.remove('mw-dialog-iframe-loading');
                    frame.contentWindow.thismodal = dialog;
                    mw.tools.iframeAutoHeight(frame, 'now');
                }, 78);
                if (mw.tools.canAccessIFrame(frame)) {
                    mw.$(frame.contentWindow.document).on('keydown', function (e) {
                        if (mw.event.is.escape(e) && !mw.event.targetIsField(e)) {
                            if(frame.contentWindow.mw.__dialogs && frame.contentWindow.mw.__dialogs.length){
                                var dlg = frame.contentWindow.mw.__dialogs;
                                dlg[dlg.length - 1].remove();
                            }
                            else {
                                if (dialog.options.closeOnEscape) {
                                    dialog.remove();
                                }
                            }
                        }
                    })
                }
            });
        }, 12);
        return dialog
    };

    mw.dialog.get = function (selector) {
        var el = mw.$(selector)[0];
        if(!el) return false;
        if(el._dialog) {
            return el._dialog;
        }
        var child_cont = el.querySelector('.mw-dialog-holder');
        var parent_cont = el.parents(".mw-dialog-holder:first");
        if (child_cont) {
            return child_cont._dialog;
        }
        else if (parent_cont.length !== 0) {
            return parent_cont[0]._dialog;
        }
        else {
            return false;
        }
    };

    mw.Dialog = function (options) {

        var scope = this;

        options = options || {};
        options.content = options.content || options.html || '';

        var defaults = {
            skin: 'default',
            overlay: true,
            overlayClose: false,
            autoCenter: true,
            root: document,
            id: mw.id('mw-dialog-'),
            content: '',
            closeOnEscape: true,
            closeButton: true,
            closeButtonAppendTo: '.mw-dialog-header',
            draggable: true,
            scrollMode: 'inside', // 'inside' | 'window',
            centerMode: 'intuitive', // 'intuitive' | 'center'
            containment: 'window'
        };

        this.options = $.extend({}, defaults, options, {
            skin: 'default'
        });

        this.id = this.options.id;
        var exist = document.getElementById(this.id);
        if (exist) {
            return exist._dialog;
        }

        this.hasBeenCreated = function () {
            return this.options.root.getElementById(this.id) !== null;
        };

        if (this.hasBeenCreated()) {
            return this.options.root.getElementById(this.id)._dialog;
        }

        mw.__dialogs = mw.__dialogs || [];
        mw.__dialogsData = mw.__dialogsData || {};

        if (!mw.__dialogsData._esc) {
            mw.__dialogsData._esc = true;
            mw.$(document).on('keydown', function (e) {
                if (mw.event.is.escape(e)) {
                    for (var i = mw.__dialogs.length - 1; i >= 0; i--) {
                        var dlg = mw.__dialogs[i];
                        if (dlg.options.closeOnEscape) {
                            dlg.remove();
                            break;
                        }
                    }
                }
            });
        }

        mw.__dialogs.push(this);

        this.draggable = function () {
            if (this.options.draggable && $.fn.draggable) {
                var $holder = mw.$(this.dialogHolder);
                $holder.draggable({
                    handle: this.options.draggableHandle || '.mw-dialog-header',
                    start: function () {
                        $holder.addClass('mw-dialog-drag-start');
                        scope._dragged = true;
                    },
                    stop: function () {
                        $holder.removeClass('mw-dialog-drag-start');
                    },
                    containment: scope.options.containment,
                    iframeFix: true
                });
            }
        };

        this.header = function () {
            this.dialogHeader = this.options.root.createElement('div');
            this.dialogHeader.className = 'mw-dialog-header';
            if (this.options.title || this.options.header) {
                this.dialogHeader.innerHTML = '<div class="mw-dialog-title">' + (this.options.title || this.options.header) + '</div>';
            }
        };

        this.footer = function (content) {
            this.dialogFooter = this.options.root.createElement('div');
            this.dialogFooter.className = 'mw-dialog-footer';
            if (this.options.footer) {
                $(this.dialogFooter).append(this.options.footer);
            }
        };

        this.title = function (title) {
            var root = mw.$('.mw-dialog-title', this.dialogHeader);
            if (typeof title === 'undefined') {
                return root.html();
            } else {
                if (root[0]) {
                    root.html(title);
                }
                else {
                    mw.$(this.dialogHeader).prepend('<div class="mw-dialog-title">' + title + '</div>');
                }
            }
        };


        this.build = function () {
            this.dialogMain = this.options.root.createElement('div');

            this.dialogMain.id = this.id;
            var cls = 'mw-defaults mw-dialog mw-dialog-scroll-mode-' + this.options.scrollMode + ' mw-dialog-skin-' + this.options.skin;
            cls += (!this.options.className ? '' : (' ' + this.options.className));
            this.dialogMain.className = cls;
            this.dialogMain._dialog = this;

            this.dialogHolder = this.options.root.createElement('div');
            this.dialogHolder.id = 'mw-dialog-holder-' + this.id;


            this.dialogHolder._dialog = this;

            this.header();
            this.footer();
            this.draggable();



            this.dialogContainer = this.options.root.createElement('div');
            this.dialogContainer._dialog = this;

            this.dialogContainer.className = 'mw-dialog-container';
            this.dialogHolder.className = 'mw-dialog-holder';

            var cont = this.options.encapsulate ? mw._dialogEncapsulate(this.options.content) : this.options.content;

            mw.$(this.dialogContainer).append(cont);

            if (this.options.encapsulate) {
                this.iframe = cont;
                this.iframe.style.display = '';
            }

            this.dialogHolder.appendChild(this.dialogHeader);
            this.dialogHolder.appendChild(this.dialogContainer);
            this.dialogHolder.appendChild(this.dialogFooter);

            this.closeButton = this.options.root.createElement('div');
            this.closeButton.className = 'mw-dialog-close';

            this.closeButton.$scope = this;

            this.closeButton.onclick = function () {
                this.$scope.remove();
            };
            this.main = mw.$(this.dialogContainer); // obsolete
            this.main.width = this.width;

            this.width(this.options.width || 600);
            this.height(this.options.height || 320);

            this.options.root.body.appendChild(this.dialogMain);
            this.dialogMain.appendChild(this.dialogHolder);
            if (this.options.closeButtonAppendTo) {
                mw.$(this.options.closeButtonAppendTo, this.dialogMain).append(this.closeButton)
            }
            else {
                this.dialogHolder.appendChild(this.closeButton);

            }
            this.dialogOverlay();
            return this;
        };

        this.containmentManage = function () {
            if (scope.options.containment === 'window') {
                if (scope.options.scrollMode === 'inside') {
                    var rect = this.dialogHolder.getBoundingClientRect();
                    var $win = mw.$(window);
                    var sctop = $win.scrollTop();
                    var height = $win.height();
                    if (rect.top < sctop || (sctop + height) > (rect.top + rect.height)) {
                        this.center();
                    }
                }
            }
        };

        this.dialogOverlay = function () {
            this.overlay = this.options.root.createElement('div');
            this.overlay.className = 'mw-dialog-overlay';
            this.overlay.$scope = this;
            if (this.options.overlay === true) {
                this.dialogMain.appendChild(this.overlay);
            }
            mw.$(this.overlay).on('click', function () {
                if (this.$scope.options.overlayClose === true) {
                    this.$scope.remove();
                }
            });

            return this;
        };

        this.show = function () {
            mw.$(this.dialogMain).addClass('active');
            this.center();
            mw.$(this).trigger('Show');
            mw.trigger('mwDialogShow', this);
            return this;
        };

        this._hideStart = false;
        this.hide = function () {
            if (!this._hideStart) {
                this._hideStart = true;
                mw.$(this.dialogMain).removeClass('active');
                mw.$(this).trigger('Hide');
                mw.trigger('mwDialogHide', this);
            }
            return this;
        };

        this.remove = function () {
            this.hide();
            mw.removeInterval('iframe-' + this.id);
            mw.$(this).trigger('BeforeRemove');
            mw.$(this.dialogMain).remove();
            mw.$(this).trigger('Remove');
            mw.trigger('mwDialogRemove', this);
            for (var i = 0; i < mw.__dialogs.length; i++) {
                if (mw.__dialogs[i] === this) {
                    mw.__dialogs.splice(i, 1);
                    break;
                }
            }
            return this;
        };

        this.destroy = this.remove;

        this._prevHeight = -1;
        this._dragged = false;

        this.center = function (width, height) {
            var $holder = mw.$(this.dialogHolder), $window = mw.$(window);
            var holderHeight = height || $holder.outerHeight();
            var holderWidth = width || $holder.outerWidth();
            var dtop, css = {};

            if (this.options.centerMode === 'intuitive' && this._prevHeight < holderHeight) {
                dtop = $window.height() / 2 - holderHeight / 2;
            } else if (this.options.centerMode === 'center') {
                dtop = $window.height() / 2 - holderHeight / 2;
            }
            if (width) {
                scope._dragged = false;
            }
            if (!scope._dragged) {
                css.left = $window.outerWidth() / 2 - holderWidth / 2;
            }

            if (dtop) {
                css.top = dtop > 0 ? dtop : 0;
            }

            $holder.css(css);
            this._prevHeight = holderHeight;

            mw.$(this).trigger('dialogCenter');

            return this;
        };

        this.width = function (width) {
            //$(this.dialogContainer).width(width);
            mw.$(this.dialogHolder).width(width);
        };
        this.height = function (height) {
            //$(this.dialogContainer).height(height);
            mw.$(this.dialogHolder).height(height);
        };
        this.resize = function (width, height) {
            if (typeof width !== 'undefined') {
                this.width(width);
            }
            if (typeof height !== 'undefined') {
                this.height(height);
            }
            this.center(width, height)
        };
        this.content = function (content) {
            this.options.content = content || '';
            this.dialogContainer.innerHTML = this.options.content;
            return this;
        };


        this.contentMaxHeight = function () {
            var scope = this;
            if (this.options.scrollMode === 'inside') {
                mw.interval('iframe-' + this.id, function () {
                    var max = mw.$(window).height() - scope.dialogHeader.clientHeight - scope.dialogFooter.clientHeight - 40;
                    scope.dialogContainer.style.maxHeight = max + 'px';
                    scope.containmentManage();
                });
            }
        };
        this.init = function () {
            this.build();
            this.contentMaxHeight();
            this.center();
            this.show();
            if (this.options.autoCenter) {
                (function (scope) {
                    mw.$(window).on('resize orientationchange load', function () {
                        scope.contentMaxHeight();
                        scope.center();
                    });
                })(this);
            }
            if (!this.options.pauseInit) {
                mw.$(this).trigger('Init');
            }
            mw.$(this.dialogHolder).on('transitionend', function () {
                scope.center();
            });

            return this;
        };
        this.init();

    };


})(window.mw);


