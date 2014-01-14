# js-gheditor

Editor of markdown ([GFM](https://help.github.com/articles/github-flavored-markdown) included),
__with preview window__. Taken from [ghost](https://ghost.org/).

Ghost provide interesting editor for blog entries editing.
But it is hardcoded instead of provided as a separate library for reuse.
This is my try to extract all necessary stuff to provide such library.
js-gheditor provides only the basic functionality:
Editing is done __only__ via markdown editor.
Even images, and links can be added only by editing markdown.
For version with upload UI check [js-gheditor-with-uploads](https://github.com/vencax/js-gheditor-with-uploads).

## distribution

js-gheditor uses bower. So installation should be easy as:

```
bower install js-gheditor
```

## usage

See example.html for example.
