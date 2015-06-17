import can from "can/";
import initView from "./custom_bit_images_only.stache!";
import "./custom_bit_images_only.less!";

/* This bit (card) design shows only images */

can.Component.extend({
	tag: 'bh-custom-bit-images-only',
	template: initView
});
