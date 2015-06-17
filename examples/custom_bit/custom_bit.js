import can from "can/";
import initView from "./custom_bit.stache!";
import "./custom_bit.less!";

/* This bit (card) design shows only titles */

can.Component.extend({
	tag: 'bh-custom-bit',
	template: initView
});
