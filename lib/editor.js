

/* global $, _, Showdown, CodeMirror, shortcut */
"use strict";

/*jslint regexp: true, bitwise: true */
var GhostEditor,
    MarkdownShortcuts = [
        {'key': 'Ctrl+B', 'style': 'bold'},
        {'key': 'Meta+B', 'style': 'bold'},
        {'key': 'Ctrl+I', 'style': 'italic'},
        {'key': 'Meta+I', 'style': 'italic'},
        {'key': 'Ctrl+Alt+U', 'style': 'strike'},
        {'key': 'Ctrl+Shift+K', 'style': 'code'},
        {'key': 'Meta+K', 'style': 'code'},
        {'key': 'Ctrl+Alt+1', 'style': 'h1'},
        {'key': 'Ctrl+Alt+2', 'style': 'h2'},
        {'key': 'Ctrl+Alt+3', 'style': 'h3'},
        {'key': 'Ctrl+Alt+4', 'style': 'h4'},
        {'key': 'Ctrl+Alt+5', 'style': 'h5'},
        {'key': 'Ctrl+Alt+6', 'style': 'h6'},
        {'key': 'Ctrl+Shift+L', 'style': 'link'},
        {'key': 'Ctrl+Shift+I', 'style': 'image'},
        {'key': 'Ctrl+Q', 'style': 'blockquote'},
        {'key': 'Ctrl+Shift+1', 'style': 'currentDate'},
        {'key': 'Ctrl+U', 'style': 'uppercase'},
        {'key': 'Ctrl+Shift+U', 'style': 'lowercase'},
        {'key': 'Ctrl+Alt+Shift+U', 'style': 'titlecase'},
        {'key': 'Ctrl+Alt+W', 'style': 'selectword'},
        {'key': 'Ctrl+L', 'style': 'list'},
        {'key': 'Ctrl+Alt+C', 'style': 'copyHTML'},
        {'key': 'Meta+Alt+C', 'style': 'copyHTML'}
    ],
    imageMarkdownRegex = /^(?:\{<(.*?)>\})?!(?:\[([^\n\]]*)\])(?:\(([^\n\]]*)\))?$/gim;
    
    
/*jslint regexp: false, bitwise: false */


GhostEditor = {

    initialize: function (elem, getInitText, desiredheight) {
        
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

        $('.CodeMirror-scroll').on('scroll', this.syncScroll);

        $('.CodeMirror-scroll').scrollClass({target: '.entry-markdown', offset: 10});
        $('.entry-preview-content').scrollClass({target: '.entry-preview', offset: 10});


        // Zen writing mode shortcut
        shortcut.add("Alt+Shift+Z", function () {
            $('body').toggleClass('zen');
        });

        $('.entry-markdown header, .entry-preview header').click(function (e) {
            $('.entry-markdown, .entry-preview').removeClass('active');
            $(e.target).closest('section').addClass('active');
        });

    },

    events: {
        'click .markdown-help': 'showHelp',
    },
    
    initMDHeader: function (header) {
        header.html('Markdown'); 
    },
    
    initPreviewHeader: function (header) {
        header.html('Preview');
    },

    syncScroll: _.throttle(function (e) {
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
    }, 10),

    showHelp: function () {
        // TODO: implement it at all?
    },

    // This updates the editor preview panel.
    // Currently gets called on every key press.
    renderPreview: function () {
        var self = this,
            preview = document.getElementsByClassName('rendered-markdown')[0];
        preview.innerHTML = this.converter.makeHtml(this.editor.getValue());

        this.initUploads();
    },

    // Markdown converter & markdown shortcut initialization.
    initMarkdown: function () {
        var self = this;

        this.converter = new Showdown.converter({extensions: ['ghostdown', 'github']});
        this.editor = CodeMirror.fromTextArea(document.getElementById('entry-markdown'), {
            mode: 'gfm',
            tabMode: 'indent',
            tabindex: "2",
            lineWrapping: true,
            dragDrop: false
        });
        this.uploadMgr = new UploadManager(this.editor, imageMarkdownRegex);

        _.each(MarkdownShortcuts, function (combo) {
            shortcut.add(combo.key, function () {
                return self.editor.addMarkdown({style: combo.style});
            });
        });

        this.enableEditor();
    },

    options: {
        markers: {}
    },

    getEditorValue: function () {
        return this.uploadMgr.getEditorValue();
    },

    initUploads: function () {
        $('.js-drop-zone').upload({editor: true});
        $('.js-drop-zone').on('uploadstart', $.proxy(this.disableEditor, this));
        $('.js-drop-zone').on('uploadfailure', $.proxy(this.enableEditor, this));
        $('.js-drop-zone').on('uploadsuccess', $.proxy(this.enableEditor, this));
        //var tadyen handler se nezavola
        $('.js-drop-zone').on('uploadsuccess', this.uploadMgr.handleUpload);
    },

    enableEditor: function () {
        var self = this;
        this.editor.setOption("readOnly", false);
        this.editor.on('change', function () {
            self.renderPreview();
        });
    },

    disableEditor: function () {
        var self = this;
        this.editor.setOption("readOnly", "nocursor");
        this.editor.off('change', function () {
            self.renderPreview();
        });
    },

    render: function () { return this; }
};


