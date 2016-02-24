/**
 * This code was copied from the "bit" image gallery.  However, it is hard-coded as not
 * acting like a gallery
 */
import can from "can";
import initView from "./image-gallery.stache!";
import "./image-gallery.less!";

can.Component.extend({
	tag: 'bh-bit-carousel-image-gallery',
	template: initView,
	scope: {
		init : function(){
			this.attr('currentImage', this.attr('images.0'));
		},
		setCurrent : function(img){
			this.attr('currentImage', img);
		},
		hasGallery : function(){
			// TODO this is hard coded as not being a gallery
			return false; 
			var images = this.attr('images');
			return images && images.attr('length') > 1;
		},
		prevImage : function(){
			var images = this.attr('images');
			var currentImage = this.attr('currentImage');
			var index = images.indexOf(currentImage);
			var newIndex;

			if(index > 0){
				newIndex = index - 1;
			} else {
				newIndex = images.attr('length') - 1;
			}

			this.setCurrent(images.attr(newIndex));
		},
		nextImage : function(){
			var images = this.attr('images');
			var currentImage = this.attr('currentImage');
			var index = images.indexOf(currentImage);
			var newIndex;

			if(index < images.attr('length') - 1){
				newIndex = index + 1;
			} else {
				newIndex = 0;
			}

			this.setCurrent(images.attr(newIndex));
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
