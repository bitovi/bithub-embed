import can from "can/";
import initView from "./image-gallery.stache!";
import "./image-gallery.less!";

can.Component.extend({
	tag: 'bh-image-gallery',
	template: initView,
	scope: {
		init : function(){
			this.attr('currentImage', this.attr('images.0'));
		},
		setCurrent : function(img){
			this.attr('currentImage', img);
		},
		hasGallery : function(){
			var images = this.attr('images');
			return images && images.attr('length') > 1;
		}
	},
	helpers : {
		isCurrent : function(img, opts){
			img = can.isFunction(img) ? img() : img;
			if(img === this.attr('currentImage')){
				return opts.fn();
			}
		}
	}
});
