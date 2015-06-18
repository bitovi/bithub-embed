# BitHub Embed code

This repository contains open sourced code for the BitHub embed. You can use this code as a base for writing custom hub widgets.

## Customization

Code is split in multiple components which make it easy to customize only the part you need to.

1. Hub layout - contained in the `bits_vertical_infinite` folder
2. Bit (card) - contained in the `bit` folder
3. Styles - styles are contained in the components' folders.

The demo is available in the `demo` folder and it should be the starting point for your customizations. 

### Customizing the Bit (card)

You can customize the Bit by changing the code in the `bit/` folder. It contains all the code that is needed to change the layout and look of the Bit (card).

If you implement a new component that renders the bit, you can pass the `bit-tag` attribute to the `bh-bits-vertical-infinite` component:

`<bh-bits-vertical-infinite bit-tag=“tag-name-of-your-component”></bh-bits-vertical-infinite>`

This will use your own component to render the hub.

## Changing the hub layout 

If you want to change the layout of the hub, you’ll need to implement the custom layout yourself. In the `bits_vertical_infinite/partitioned_column_list.js` file, you can find the implementation of the class that manages which cards should be displayed at a time. It is a good start if you want to implement the layout similar to the current one, but with the different behavior.

## Changing the styles

Styles are contained in the components' folders. If you want to customize the layout styles, edit the `bits_vertical_infinite/bits_vertical_infinite.less` file. If you want to customize the bit (card) design, edit the `bit/bit.less` file.

--

# Bit Component

Bit Component (located in the `bit` folder) takes care of displaying one item in the hub. It has three sub components:

1. `body-wrap` - Wraps the content body and cuts it off if it's too tall
2. `image-gallery` - If an item has images in it, `image-gallery` component creates the image gallery
3. `share-bit` - Displays the share buttons

When an item containing images is rendered, `bit` component will first wait for all the images to load before displaying the card content. Until that happens the loading animation is shown. In the `examples` folder you can find two custom implementations of the bit components.


# Bits Vertical Infinite Component

This component takes care of the layout behavior. It has the following responsobilities:

1. Partitioning items into columns (depending on the window width)
2. Loading new items on scroll
3. Removing everything except the first page of items when user scrolls back to top.

All the logic related to items partitioning is contained in the `bits_vertical_infinite/partitioned_column_list.js` file. This file contains the class that knows how to rebuild the partitioning when the column count changes or new data is added to the list.

# Usage example

To use the `bits_vertical_infinite` component import the module and render the component:

```
import "bits_vertical_infinite/";
import $ from "jquery";
import can from "can";


var template = can.stache("<bh-bits-vertical-infinite></bh-bits-vertical-infinite>");

$('#app').html(template());

```

This will render the component and make the request to load the data.

## Using a different bit (card) component

If you want to change how each item is rendered, you can implement you own card component and replace the default `bh-bit` component. `bh-bits-vertical-infinite` accepts the `bit-tag` attribute which can be used to load a different component for the card rendering.

```
import "bits_vertical_infinite/";
import $ from "jquery";
import can from "can";

var CustomBitComponent = can.Component.extend({
    tag : 'custom-bit',
    template: '...'
}); 

var template = can.stache("<bh-bits-vertical-infinite bit-tag='custom-bit'></bh-bits-vertical-infinite>");

$('#app').html(template());
```

This will render each bit using the `custom-bit` component.
