

/* global $, _, Showdown, CodeMirror */
"use strict";

/*jslint regexp: true, bitwise: true */
var GHEditorBase = function() {
    
    var MarkdownShortcuts = [
        {'key': 'Ctrl-B', 'style': 'bold'},
        {'key': 'Cmd-B', 'style': 'bold'},
        {'key': 'Ctrl-I', 'style': 'italic'},
        {'key': 'Cmd-I', 'style': 'italic'},
        {'key': 'Ctrl-Alt-T', 'style': 'strike'},
        {'key': 'Shift-Ctrl-K', 'style': 'code'},
        {'key': 'Cmd-K', 'style': 'code'},
        {'key': 'Ctrl-Alt-1', 'style': 'h1'},
        {'key': 'Ctrl-Alt-2', 'style': 'h2'},
        {'key': 'Ctrl-Alt-3', 'style': 'h3'},
        {'key': 'Ctrl-Alt-4', 'style': 'h4'},
        {'key': 'Ctrl-Alt-5', 'style': 'h5'},
        {'key': 'Ctrl-Alt-6', 'style': 'h6'},
        {'key': 'Shift-Ctrl-L', 'style': 'link'},
        {'key': 'Shift-Ctrl-I', 'style': 'image'},
        {'key': 'Ctrl-Q', 'style': 'blockquote'},
        {'key': 'Shift-Ctrl-1', 'style': 'currentDate'},
        {'key': 'Ctrl-U', 'style': 'uppercase'},
        {'key': 'Ctrl-Alt-U', 'style': 'lowercase'},
        {'key': 'Ctrl-Alt-W', 'style': 'selectword'},
        {'key': 'Ctrl-L', 'style': 'list'}
    ],
    imageMarkdownRegex = /^(?:\{<(.*?)>\})?!(?:\[([^\n\]]*)\])(?:\(([^\n\]]*)\))?$/gim;
        
    this.init = function(elem, getInitText, desiredheight) {
        var necessaryElems = '\
<section class="entry-markdown active">\
    <header class="floatingheader"></header>\
    <section class="entry-markdown-content">\
        <textarea id="entry-markdown"></textarea>\
    </section>\
</section>\
<section class="entry-preview">\
    <header class="floatingheader"></header>\
    <section class="entry-preview-content">\
        <div class="rendered-markdown"></div>\
    </section>\
</section>';
                
        var leElem = $('#' + elem);
        leElem.css('height', desiredheight);
        
        leElem.append(necessaryElems);
        $('.entry-markdown').css('height', desiredheight);
        $('.entry-preview').css('height', desiredheight);
        
        this.initMDHeader($('.entry-markdown .floatingheader'));
        this.initPreviewHeader($('.entry-preview .floatingheader'));

        $('#entry-markdown').text(getInitText());

        this.initMarkdown();
        this.renderPreview();

        $('.entry-content header, .entry-preview header').on('click', function () {
            $('.entry-content, .entry-preview').removeClass('active');
            $(this).closest('section').addClass('active');
        });

        $('.entry-title .icon-fullscreen').on('click', function (e) {
            e.preventDefault();
            $('body').toggleClass('fullscreen');
        });

        $('.CodeMirror-scroll').on('scroll', _.throttle(syncScroll, 10));

        $('.entry-markdown header, .entry-preview header').click(function (e) {
            $('.entry-markdown, .entry-preview').removeClass('active');
            $(e.target).closest('section').addClass('active');
        });

    };

    this.initMDHeader = function(header) {
        header.html('Markdown'); 
    };
    
    this.initPreviewHeader = function(header) {
        header.html('Preview');
    };

    function syncScroll(e) {
        var $codeViewport = $(e.target),
            $previewViewport = $('.entry-preview-content'),
            $codeContent = $('.CodeMirror-sizer'),
            $previewContent = $('.rendered-markdown'),

            // calc position
            codeHeight = $codeContent.height() - $codeViewport.height(),
            previewHeight = $previewContent.height() - $previewViewport.height(),
            ratio = previewHeight / codeHeight,
            previewPostition = $codeViewport.scrollTop() * ratio;

        // apply new scroll
        $previewViewport.scrollTop(previewPostition);
    }

    function showHelp() {
        // TODO: implement it at all?
    }

    // This updates the editor preview panel.
    // Currently gets called on every key press.
    this.renderPreview = function() {
        var preview = document.getElementsByClassName('rendered-markdown')[0];
        preview.innerHTML = this.converter.makeHtml(this.editor.getValue());

        this.initUploads();
    };
    
    function ghostdown(self) {
        return function(converter) {
            return [
                // ![] image syntax
                {
                    type: 'lang',
                    filter: function (text) {
                        var imageMarkdownRegex = /^(?:\{<(.*?)>\})?!(?:\[([^\n\]]*)\])(?:\(([^\n\]]*)\))?$/gim;
                            // /* regex from isURL in node-validator. Yum! */
                            // uriRegex = /^(?!mailto:)(?:(?:https?|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[0-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))|localhost)(?::\d{2,5})?(?:\/[^\s]*)?$/i,
                            // pathRegex = /^(\/)?([^\/\0]+(\/)?)+$/i;
    
                        return text.replace(imageMarkdownRegex, self.renderImageTag);
                    }
                }
            ];
        };
    }
    
    this.mdShortcuts = function() {
        var sc = {};
        _.each(MarkdownShortcuts, function (combo) {
            sc[combo.key] = function(cm) { cm.addMarkdown({style: combo.style}); };
        });
        return sc;
    };

    // Markdown converter & markdown shortcut initialization.
    this.initMarkdown = function() {
        this.converter = new Showdown.converter({extensions: [ghostdown(this), 'github']});
        this.editor = CodeMirror.fromTextArea(document.getElementById('entry-markdown'), {
            mode: 'gfm',
            tabMode: 'indent',
            tabindex: "2",
            lineWrapping: true,
            dragDrop: false,
            extraKeys: this.mdShortcuts()
        });
        this.uploadMgr = new UploadManager(this.editor, imageMarkdownRegex);

        this.enableEditor();
    };

    this.getEditorValue = function() {
        return this.uploadMgr.getEditorValue();
    };

    this.enableEditor = function() {
        var self = this;
        this.editor.setOption("readOnly", false);
        this.editor.on('change', function () {
            self.renderPreview();
        });
    };

    this.disableEditor = function() {
        var self = this;
        this.editor.setOption("readOnly", "nocursor");
        this.editor.off('change', function () {
            self.renderPreview();
        });
    };

};


// Editor without upload features
var SimpleGHEditor = function() {
    
    this.initUploads = function() {
        // prepare nothing, no upload UI
    };
    
    this.renderImageTag = function(match, key, alt, src) {
        return '<img class="js-upload-target" src="' + src + '" alt="' + alt +'"/>';
    };
    
};
SimpleGHEditor.prototype = new GHEditorBase();
